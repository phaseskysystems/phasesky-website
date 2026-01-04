// Environment variables expected when deployed on Cloudflare Pages Functions:
// - CONTACT_TO_EMAIL: destination inbox
// - CONTACT_FROM_EMAIL: verified from/sender address for MailChannels
// - CONTACT_RATE_LIMIT_KV: (optional) KV binding for rate limiting

const ALLOWED_TOPICS = ['Sales', 'Partnership', 'Support', 'Other'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW = 300; // seconds
const RATE_LIMIT_ATTEMPTS = 5;
const memoryRateMap = globalThis.__contactRateMap || (globalThis.__contactRateMap = new Map());

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
    }
    const validationError = validatePayload(payload);
    if (validationError) {
      return json({ ok: false, error: validationError }, 400);
    }

    const blocked = await isRateLimited(ip, env);
    if (blocked) {
      return json({ ok: false, error: 'Too many attempts. Please try again shortly.' }, 429);
    }

    await sendMail(payload, env);
    return json({ ok: true }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ ok: false, error: message }, 500);
  }
}

function validatePayload(body = {}) {
  const { name, email, company = '', topic, message, honeypot = '' } = body;

  if (honeypot && honeypot.trim().length > 0) {
    return 'Spam detected.';
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return 'Name is required.';
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return 'Valid email is required.';
  }

  if (!topic || !ALLOWED_TOPICS.includes(topic)) {
    return 'Please select a valid topic.';
  }

  if (!message || typeof message !== 'string' || message.trim().length < 20) {
    return 'Message must be at least 20 characters.';
  }

  if (company && typeof company !== 'string') {
    return 'Company must be a string.';
  }

  return null;
}

async function isRateLimited(ip, env) {
  if (!ip) return false;
  const key = `contact:${ip}`;

  if (env.CONTACT_RATE_LIMIT_KV) {
    const current = await env.CONTACT_RATE_LIMIT_KV.get(key, { type: 'text' });
    const attempts = current ? parseInt(current, 10) : 0;
    if (attempts >= RATE_LIMIT_ATTEMPTS) return true;
    await env.CONTACT_RATE_LIMIT_KV.put(key, String(attempts + 1), { expirationTtl: RATE_LIMIT_WINDOW });
    return false;
  }

  // Fallback: per-instance memory map with short TTL (note: does not persist across cold starts)
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW * 1000;
  const timestamps = memoryRateMap.get(ip) || [];
  const filtered = timestamps.filter((ts) => ts > windowStart);
  if (filtered.length >= RATE_LIMIT_ATTEMPTS) return true;
  filtered.push(now);
  memoryRateMap.set(ip, filtered);
  return false;
}

async function sendMail(payload, env) {
  const toEmail = env.CONTACT_TO_EMAIL;
  const fromEmail = env.CONTACT_FROM_EMAIL;

  if (!toEmail || !fromEmail) {
    throw new Error('Email settings are not configured.');
  }

  const subject = `PhaseSky Contact: ${payload.topic}`;
  const content = buildEmailBody(payload);

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: toEmail }],
        },
      ],
      from: { email: fromEmail, name: payload.name || 'PhaseSky Contact' },
      subject,
      content: [
        {
          type: 'text/plain',
          value: content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Mail provider error: ${message}`);
  }
}

function buildEmailBody({ name, email, company = '', topic, message, metadata = {} }) {
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || '—'}`,
    `Topic: ${topic}`,
    '',
    'Message:',
    message,
  ];

  if (metadata && typeof metadata === 'object') {
    const metaLines = Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .filter(Boolean);

    if (metaLines.length) {
      lines.push('', 'Metadata:', ...metaLines);
    }
  }

  return lines.join('\n');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
