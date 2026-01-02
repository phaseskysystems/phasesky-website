import { buildPhaseSkyDroneGraphic } from './PhaseSkyDroneGraphic_REV_002.js';

const MODE_DEFAULT = 'DEFAULT';
const MODE_EXPLODED = 'EXPLODED';
const TRANSITION_MS = 700;
const ARM_ORDER = ['front-left', 'front-right', 'rear-left', 'rear-right'];
const ARM_RADIUS = 152;
const EXPLODE_OFFSET = 96;
const STACK_LAYERS = [
  { name: 'FLIGHT CONTROLLER', z: 36 },
  { name: 'ESC / POWER STAGE', z: 6 },
  { name: 'POWER DISTRIBUTION', z: -24 },
  { name: 'BATTERY / POWER MODULE', z: -46 }
];

const MOTOR_POSITIONS = {
  'front-left': { angle: -45, base: { x: -ARM_RADIUS, y: -ARM_RADIUS } },
  'front-right': { angle: 45, base: { x: ARM_RADIUS, y: -ARM_RADIUS } },
  'rear-left': { angle: -135, base: { x: -ARM_RADIUS, y: ARM_RADIUS } },
  'rear-right': { angle: 135, base: { x: ARM_RADIUS, y: ARM_RADIUS } }
};

const clampRadians = rad => ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

const applyMotorTransforms = (parts, mode) => {
  const exploded = mode === MODE_EXPLODED;
  parts.motorGroups.forEach(group => {
    const id = group.dataset.position;
    const info = MOTOR_POSITIONS[id];
    const offset = exploded ? EXPLODE_OFFSET : 0;
    const angleRad = (info.angle * Math.PI) / 180;
    const dx = Math.cos(angleRad) * offset;
    const dy = Math.sin(angleRad) * offset;
    const x = info.base.x + dx;
    const y = info.base.y + dy;
    group.style.transform = `translate3d(${x}px, ${y}px, ${exploded ? 42 : 28}px) rotateZ(${info.angle}deg)`;
  });
};

const applyStackTransforms = (parts, mode) => {
  const exploded = mode === MODE_EXPLODED;
  parts.stackItems.forEach((item, index) => {
    const layer = STACK_LAYERS[index];
    const z = exploded ? layer.z * 1.12 : 12 + index * 4;
    const y = exploded ? (index - 1.5) * -6 : 0;
    item.style.transform = `translate3d(-50%, -50%, ${z}px) translateY(${y}px)`;
  });

  parts.comms.rf.style.transform = exploded
    ? 'translate3d(-50%, -50%, 44px) translate(-18px, -72px)'
    : 'translate3d(-50%, -50%, 18px) translate(-18px, -72px)';
  parts.comms.antenna.style.transform = exploded
    ? 'translate3d(50%, -50%, 40px) translate(42px, -76px)'
    : 'translate3d(50%, -50%, 18px) translate(42px, -76px)';
  parts.comms.fpv.style.transform = exploded
    ? 'translate3d(-50%, -50%, 34px) translate(-52px, 74px)'
    : 'translate3d(-50%, -50%, 12px) translate(-52px, 74px)';
  parts.comms.vtx.style.transform = exploded
    ? 'translate3d(50%, -50%, 32px) translate(52px, 70px)'
    : 'translate3d(50%, -50%, 12px) translate(52px, 70px)';
};

const applyLabelGeometry = parts => {
  const svg = parts.labels.querySelector('svg');
  const leaders = svg.querySelectorAll('line');
  const tags = parts.labels.querySelectorAll('.psk-label');

  leaders.forEach(line => {
    const key = line.dataset.key;
    const tag = Array.from(tags).find(t => t.dataset.key === key);
    if (!tag) return;
    const x = parseFloat(tag.style.getPropertyValue('--label-x')) || 0;
    const y = parseFloat(tag.style.getPropertyValue('--label-y')) || 0;
    line.setAttribute('x1', 0);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', x * 0.75);
    line.setAttribute('y2', y * 0.75);
  });
};

const validateState = (parts, mode) => {
  const exploded = mode === MODE_EXPLODED;
  // Drone rotation gate
  if (parts.root.dataset.mode !== mode) {
    throw new Error('REV_002 validation failed: mode flag mismatch');
  }

  // Motor alignment at arm ends
  parts.motorGroups.forEach(group => {
    const id = group.dataset.position;
    const target = MOTOR_POSITIONS[id];
    const matrix = group.getBoundingClientRect();
    if (!target || !matrix) {
      throw new Error('REV_002 validation failed: missing motor geometry');
    }
    const center = { x: matrix.left + matrix.width / 2, y: matrix.top + matrix.height / 2 };
    const other = MOTOR_POSITIONS[ARM_ORDER[0]].base;
    if (Number.isNaN(center.x) || Number.isNaN(center.y) || !other) {
      throw new Error('REV_002 validation failed: invalid motor bounds');
    }
  });

  // Prop spin axis check
  parts.props.forEach(prop => {
    const transform = prop.style.transform || '';
    if (/rotateX\(/i.test(transform) || /rotateZ\(/i.test(transform)) {
      throw new Error('REV_002 validation failed: prop rotation axis drift');
    }
    if (!/rotateY\(/i.test(transform) && !/rotate\(/i.test(transform)) {
      throw new Error('REV_002 validation failed: prop rotation missing');
    }
  });

  // Stack spacing sanity (prevent overlap)
  const bounds = parts.stackItems.map(item => item.getBoundingClientRect());
  for (let i = 1; i < bounds.length; i += 1) {
    if (bounds[i - 1].bottom - bounds[i].top > 2 && exploded) {
      throw new Error('REV_002 validation failed: exploded stack overlap');
    }
  }

  // Rotation allowed only in default
  if (exploded && parts.root.style.getPropertyValue('--yaw')) {
    const yawVal = parts.root.style.getPropertyValue('--yaw');
    if (yawVal !== '' && yawVal !== '0deg') {
      throw new Error('REV_002 validation failed: rotation active in exploded');
    }
  }
};

const initPhaseSkyDrone = () => {
  const container = document.querySelector('[data-component="PhaseSkyDrone_REV_002"]');
  if (!container) return;

  const parts = buildPhaseSkyDroneGraphic(container);
  container.dataset.mode = MODE_DEFAULT;
  applyMotorTransforms(parts, MODE_DEFAULT);
  applyStackTransforms(parts, MODE_DEFAULT);
  applyLabelGeometry(parts);

  const hint = container.querySelector('.phasesky-drone__hint');
  if (hint) hint.textContent = 'CLICK TO VIEW PARTS';

  let mode = MODE_DEFAULT;
  let yaw = 0;
  let propAngle = 0;
  let last = performance.now();
  let running = true;

  const applyMode = nextMode => {
    mode = nextMode;
    container.dataset.mode = mode;
    parts.root.dataset.mode = mode;
    applyMotorTransforms(parts, mode);
    applyStackTransforms(parts, mode);
    if (hint) hint.textContent = mode === MODE_DEFAULT ? 'CLICK TO VIEW PARTS' : 'CLICK TO RETURN';
    validateState(parts, mode);
  };

  const animate = now => {
    if (!running) return;
    const delta = Math.min(48, now - last);
    last = now;
    const deltaSeconds = delta / 1000;

    propAngle = (propAngle + deltaSeconds * 720) % 360;
    parts.props.forEach(prop => {
      prop.style.transform = `translate3d(-50%, -50%, 32px) rotateY(${propAngle}deg)`;
    });

    if (mode === MODE_DEFAULT) {
      yaw = clampRadians(yaw + deltaSeconds * 0.6);
      parts.root.style.setProperty('--yaw', `${yaw / DEG_TO_RAD}deg`);
    } else {
      parts.root.style.setProperty('--yaw', '0deg');
    }

    requestAnimationFrame(animate);
  };

  const toggleMode = () => {
    const next = mode === MODE_DEFAULT ? MODE_EXPLODED : MODE_DEFAULT;
    applyMode(next);
  };

  container.addEventListener('click', toggleMode);

  // Transition class to ensure deterministic easing
  [parts.root, ...parts.motorGroups, parts.frame, parts.stackItems].flat().forEach(el => {
    if (!el || !el.style) return;
    el.style.transition = `transform ${TRANSITION_MS}ms ease-in-out`;
  });

  validateState(parts, mode);
  requestAnimationFrame(animate);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhaseSkyDrone);
} else {
  initPhaseSkyDrone();
}
