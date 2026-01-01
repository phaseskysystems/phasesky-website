const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Scroll reveal animations
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
}

// Signal canvas animation
(function setupSignal() {
  const canvas = document.getElementById('signalCanvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  let phase = 0;

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;

    // Baseline waveform
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const progress = x / width;
      const amplitude = 20;
      const y = height / 2 + Math.sin(progress * 6 * Math.PI + phase) * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#9cacc2';
    ctx.stroke();

    // Sync marker
    const syncX = width * 0.58 + Math.sin(phase / 3) * 6;
    const syncY = height / 2 + Math.sin(phase) * 6;
    ctx.fillStyle = '#76b7ff';
    ctx.beginPath();
    ctx.arc(syncX, syncY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(118, 183, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(syncX, syncY, 14 + Math.sin(phase) * 2, 0, Math.PI * 2);
    ctx.stroke();

    phase += 0.02;
    requestAnimationFrame(draw);
  };

  draw();
})();
