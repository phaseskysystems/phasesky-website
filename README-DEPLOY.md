# PhaseSky Website Deployment

## Run locally
1. Ensure a modern browser and any simple HTTP server are available.
2. From the repo root, start a static server (examples):
   - Python: `python3 -m http.server 8080`
   - Node (if installed): `npx serve .`
3. Open `http://localhost:8080` and navigate the pages.

## Netlify configuration
- Framework: None (static site).
- Build command: _None required_.
- Publish directory: repository root (`/`).
- Redirects: Netlify will serve `404.html` for missing routes automatically.
- Forms: The contact form is Netlify Forms-ready (`name="contact"`, `data-netlify="true"`).

## Cloudflare DNS
- Point your domain’s A/AAAA records or CNAME to Netlify per Netlify’s custom domain instructions.
- Keep Cloudflare proxy/CDN enabled if desired; ensure SSL is set to “Full” or “Full (Strict)”.
- After DNS propagates, configure the custom domain inside Netlify to issue TLS certificates.
