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
      const amplitude = 28;
      const y = height / 2 + Math.sin(progress * 8 * Math.PI + phase) * amplitude * (0.7 + 0.3 * Math.sin(phase / 2));
      const sway = Math.sin(progress * 4 * Math.PI + phase / 2) * 6;
      const finalY = y + sway;
      if (x === 0) ctx.moveTo(x, finalY);
      else ctx.lineTo(x, finalY);
    }
    ctx.strokeStyle = '#9eb0c8';
    ctx.shadowColor = 'rgba(110, 197, 255, 0.2)';
    ctx.shadowBlur = 16;
    ctx.stroke();

    // Sync marker
    const syncX = width * 0.62 + Math.sin(phase / 2) * 8;
    const syncY = height / 2 + Math.sin(phase * 1.4) * 10;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#6ec5ff';
    ctx.beginPath();
    ctx.arc(syncX, syncY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 197, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(syncX, syncY, 18 + Math.sin(phase) * 3, 0, Math.PI * 2);
    ctx.stroke();

    phase += 0.02;
    requestAnimationFrame(draw);
  };

  draw();
})();
