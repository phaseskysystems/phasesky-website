const form = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const errorBox = document.getElementById('form-error');
const successPanel = document.getElementById('contact-success');
const resetLink = document.getElementById('contact-reset');
const messageInput = document.getElementById('message');
const countLabel = document.getElementById('message-count');

let sending = false;

const fieldErrors = {
  name: 'Please enter your full name.',
  email: 'Please enter a valid email.',
  topic: 'Select a topic so we can route your message.',
  message: 'Message must be at least 20 characters.',
};

function setButtonState() {
  const valid = form.checkValidity();
  submitBtn.disabled = !valid || sending;
}

function updateCharCount() {
  const len = messageInput.value.length;
  countLabel.textContent = `${len} / 20`;
}

function showError(field, message) {
  const target = form.querySelector(`[data-error="${field}"]`);
  if (target) {
    target.textContent = message;
  }
}

function clearErrors() {
  errorBox.textContent = '';
  form.querySelectorAll('.field-hint').forEach((hint) => {
    hint.textContent = '';
  });
}

function validateField(input) {
  if (!input) return;
  if (input.validity.valid) {
    showError(input.name, '');
    return;
  }
  if (input.validity.valueMissing) {
    showError(input.name, fieldErrors[input.name] || 'This field is required.');
  } else if (input.validity.typeMismatch || input.validity.patternMismatch) {
    showError(input.name, 'Please enter a valid format.');
  } else if (input.validity.tooShort) {
    showError(input.name, fieldErrors[input.name]);
  }
}

form?.addEventListener('input', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
    validateField(target);
  }
  updateCharCount();
  setButtonState();
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  updateCharCount();

  if (!form.checkValidity()) {
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
      validateField(firstInvalid);
      firstInvalid.focus();
    }
    setButtonState();
    return;
  }

  if (sending) return;

  sending = true;
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending…';

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    company: form.company.value.trim(),
    topic: form.topic.value,
    message: form.message.value.trim(),
    metadata: {
      page: window.location.href,
      userAgent: navigator.userAgent,
    },
    honeypot: form.website.value.trim(),
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Something went wrong. Please try again.');
    }

    form.setAttribute('hidden', 'true');
    successPanel.hidden = false;
    successPanel.focus();
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Could not send message.';
    errorBox.style.display = 'block';
  } finally {
    sending = false;
    submitBtn.textContent = originalText;
    setButtonState();
  }
});

resetLink?.addEventListener('click', (event) => {
  event.preventDefault();
  form.reset();
  clearErrors();
  successPanel.hidden = true;
  form.removeAttribute('hidden');
  setButtonState();
  updateCharCount();
  form.querySelector('input, select, textarea')?.focus();
});

updateCharCount();
setButtonState();
