PhaseSky Website

PhaseSky is a clean, professional website for an engineering‑first drone systems company. It is designed to convey the seriousness, restraint and technical depth of the program while remaining approachable to hobbyists and engineers alike. The site uses a bubble‑card interface with generous whitespace, consistent typography, and calm animations.

Overview

This repository contains the complete source code for the PhaseSky website, including:

index.html – The home page with a hero section, feature cards, an animated drone stack, a program status grid, and a short open‑source philosophy section.

about.html – Mission and values, era & inspiration, and guiding principles of PhaseSky.

products.html – A roadmap of current and planned hardware and software products with status badges.

contact.html – Contact information for inquiries and collaboration.

styles.css – Global styles, CSS variables, and responsive layout definitions for the bubble interface and badges.

assets/logo.png – The PhaseSky logo used in the header and metadata.

Technology

The site is a static, client‑side web project built with vanilla HTML, CSS and a small amount of JavaScript. It requires no build tools and can be deployed directly to any static hosting provider (e.g. GitHub Pages, Netlify, Cloudflare Pages).

Features

Bubble Interface – Each section of the site is wrapped in a softly rounded card with consistent spacing and subtle shadows to separate content.

Animated Drone Stack – A custom inline SVG shows the layers of a micro‑drone (frame, motors, flight controller, sensors, radio, battery) sliding into place. Reduced‑motion users see a static stack.

Program Status Grid – A grid of cards summarising the roadmap (PCB v1, Drone v1, PCB v2, Drone v2, and planned future products) with colour‑coded status badges:

Green – Available (Pre‑Order)

Orange – Coming Soon

Blue with glow – In Development

Grey/Muted Blue – Planned

Guiding Principles – Highlights the core values of PhaseSky: future‑forward engineering, aerospace discipline, physics‑driven design, and distributed mesh intelligence.

Open Source Philosophy – Explains which parts of the project are open source (flight software, documentation) and which are released as hardware when mature.

Responsive Design – The layout adapts gracefully to mobile and desktop screens. Multi‑column grids stack vertically on smaller screens.

No New Binary Assets – The project deliberately avoids adding new image or font files. The single logo file is included for branding; all other icons are inline SVG.

Getting Started

Clone or download this repository to your local machine.

Navigate into the project folder and open index.html in a web browser. No build process is needed.

Edit the HTML or CSS files to customise copy, colours, or layout as desired.

Development Tips

Use the CSS variables defined in styles.css for colours, spacing, and typography. This ensures consistency across all pages.

The drone stack animation is controlled via CSS keyframes. If you wish to adjust timing or add additional layers, modify the @keyframes definition and the HTML structure in index.html.

To add new roadmap items, edit the cards in index.html and products.html and assign appropriate status classes.

Deployment

Because the site is fully static, you can deploy it easily with:

GitHub Pages – Push the code to a GitHub repository and enable Pages in the repository settings.

Netlify or Cloudflare Pages – Drag and drop the project folder or configure a build with no command and the root directory as the publish directory.

No server‑side processing is required. The site will load quickly from any CDN when deployed.

Contact

Have a question or want to collaborate? Reach the PhaseSky team via email at info@phasesky.com
 or open an issue in the repository.
