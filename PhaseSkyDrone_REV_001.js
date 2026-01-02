import { buildPhaseSkyDroneGraphic } from './PhaseSkyDroneGraphic_REV_001.js';

const LABEL_POSITIONS = {
  FRAME: { top: '55%', left: '52%', angle: -32 },
  PCB: { top: '32%', left: '54%', angle: -22 },
  POWER: { top: '76%', left: '48%', angle: 18 },
  MOTORS: { top: '52%', left: '18%', angle: 180 },
  PROPS: { top: '30%', left: '82%', angle: 8 }
};

const createLabelLayer = container => {
  const layer = document.createElement('div');
  layer.className = 'phasesky-drone__labels';

  Object.entries(LABEL_POSITIONS).forEach(([name, position]) => {
    const label = document.createElement('div');
    label.className = 'phasesky-drone__label';
    label.dataset.name = name;
    label.style.top = position.top;
    label.style.left = position.left;
    label.style.setProperty('--leader-rotation', `${position.angle}deg`);

    const leader = document.createElement('span');
    leader.className = 'phasesky-drone__leader';
    label.append(leader);

    layer.append(label);
  });

  return layer;
};

const initPhaseSkyDrone = () => {
  const container = document.querySelector('[data-component="PhaseSkyDrone_REV_001"]');
  if (!container) return;

  const hint = container.querySelector('.phasesky-drone__hint');
  const labelLayer = createLabelLayer(container);
  container.append(labelLayer);

  buildPhaseSkyDroneGraphic(container);

  container.setAttribute('data-state', 'ASSEMBLED');

  container.addEventListener('click', () => {
    const exploded = !container.classList.contains('is-exploded');
    container.classList.toggle('is-exploded', exploded);
    container.setAttribute('data-state', exploded ? 'EXPLODED' : 'ASSEMBLED');
    if (hint) {
      hint.textContent = exploded ? 'Click to reassemble' : 'Click to explode';
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhaseSkyDrone);
} else {
  initPhaseSkyDrone();
}
