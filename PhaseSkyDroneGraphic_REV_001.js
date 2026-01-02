const SVG_NS = 'http://www.w3.org/2000/svg';

// Coordinate system: +X right, +Y up, +Z forward (toward viewer)
const LAYOUT = {
  radius: 96,
  motorY: 0,
  pcb: { x: 0, y: -22, z: 18 },
  power: { x: 0, y: 24, z: -14 },
  frame: { x: 0, y: 0, z: 0 }
};

const MOTOR_IDS = ['front-left', 'front-right', 'rear-left', 'rear-right'];
const MOTOR_POSITIONS = {
  'front-left': { x: -LAYOUT.radius, y: LAYOUT.motorY, z: LAYOUT.radius },
  'front-right': { x: LAYOUT.radius, y: LAYOUT.motorY, z: LAYOUT.radius },
  'rear-left': { x: -LAYOUT.radius, y: LAYOUT.motorY, z: -LAYOUT.radius },
  'rear-right': { x: LAYOUT.radius, y: LAYOUT.motorY, z: -LAYOUT.radius }
};

const PROP_SPIN_SIGNS = {
  'front-left': 1,
  'rear-right': 1,
  'front-right': -1,
  'rear-left': -1
};

const PROJECTION = {
  project(x, z) {
    return { x, y: z * 0.7 };
  }
};

const createSvg = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined) node.setAttribute(key, value);
  });
  return node;
};

const setTranslate = (el, x = 0, y = 0) => {
  el.setAttribute('transform', `translate(${x} ${y})`);
};

const deg = rad => (rad * 180) / Math.PI;

const createArm = (dx, dz, length) => {
  const angle = deg(Math.atan2(dz, dx));
  const arm = createSvg('g', { class: 'psk-arm' });
  const body = createSvg('path', {
    d: `M0 -7 L ${length - 12} -4 Q ${length} 0 ${length - 12} 4 L 0 7 Q 12 0 0 -7 Z`,
    class: 'arm-body'
  });
  const inset = createSvg('path', {
    d: `M10 -2.6 L ${length - 24} -1.6 Q ${length - 14} 0 ${length - 24} 1.6 L 10 2.6 Z`,
    class: 'arm-inset'
  });
  arm.append(body, inset);
  arm.setAttribute('transform', `rotate(${angle})`);
  return arm;
};

const createMotor = () => {
  const g = createSvg('g', { class: 'psk-motor' });
  const bell = createSvg('circle', { r: 14, class: 'motor-bell' });
  const body = createSvg('circle', { r: 11, class: 'motor-body' });
  const hub = createSvg('circle', { r: 4.5, class: 'motor-hub' });
  g.append(bell, body, hub);
  return g;
};

const createProp = () => {
  const g = createSvg('g', { class: 'psk-prop' });
  const hub = createSvg('circle', { r: 2.8, class: 'prop-hub' });
  const bladeA = createSvg('path', {
    d: 'M0 0 C 12 -1 44 -6 60 -2 C 44 2 12 1 0 0 Z',
    class: 'prop-blade'
  });
  const bladeB = createSvg('path', {
    d: 'M0 0 C -12 1 -44 6 -60 2 C -44 -2 -12 -1 0 0 Z',
    class: 'prop-blade'
  });
  g.append(bladeA, bladeB, hub);
  g.style.transform = 'rotate(0deg)';
  g.style.transformOrigin = 'center center';
  return g;
};

const createBoard = (w, h, r, cls) => createSvg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: r, class: cls });

const validateLayout = ({ motors, props }) => {
  const radii = motors.map(m => Math.hypot(m.position.x, m.position.z));
  const baseline = radii[0];
  motors.forEach(m => {
    if (Math.abs(m.position.y - LAYOUT.motorY) > 1e-4) {
      throw new Error('Motor Y positions must match');
    }
    if (Math.abs(Math.hypot(m.position.x, m.position.z) - baseline) > 0.25) {
      throw new Error('Motor radii mismatch');
    }
  });
  props.forEach(({ prop, group, motor }) => {
    const propMatrix = prop.getScreenCTM();
    const motorMatrix = motor.getScreenCTM();
    if (!propMatrix || !motorMatrix) return;
    const propPos = { x: propMatrix.e, y: propMatrix.f };
    const motorPos = { x: motorMatrix.e, y: motorMatrix.f };
    if (Math.hypot(propPos.x - motorPos.x, propPos.y - motorPos.y) > 0.9) {
      throw new Error('Prop not centered on motor');
    }
    const transform = prop.style.transform || '';
    if (
      /rotateX\([^0]/.test(transform) ||
      /rotateZ\([^0]/.test(transform)) ||
      (/rotateY\([^0]/.test(transform)) && !/rotate\(/.test(transform))
    ) {
      throw new Error('Prop rotation must stay on local Y only');
    }
  });
};

export function buildPhaseSkyDroneGraphic(container) {
  const host = container.querySelector('.phasesky-drone__scene') || container;
  const svg = createSvg('svg', {
    viewBox: '-220 -200 440 380',
    class: 'phasesky-drone__svg',
    role: 'img',
    'aria-hidden': 'true'
  });

  const defs = createSvg('defs');
  const glow = createSvg('radialGradient', { id: 'psk-glow', cx: '50%', cy: '45%', r: '65%' });
  glow.append(
    createSvg('stop', { offset: '0%', 'stop-color': '#7dd5ff', 'stop-opacity': '0.35' }),
    createSvg('stop', { offset: '100%', 'stop-color': '#7dd5ff', 'stop-opacity': '0' })
  );
  defs.append(glow);
  svg.append(defs);

  const root = createSvg('g', { class: 'psk-root' });
  const halo = createSvg('circle', { r: 176, class: 'psk-halo', fill: 'url(#psk-glow)' });
  root.append(halo);

  const frameGroup = createSvg('g', { class: 'psk-frame' });
  const body = createBoard(138, 56, 14, 'frame-body');
  const spine = createBoard(122, 14, 10, 'frame-stripe');
  spine.setAttribute('y', '-4');
  frameGroup.append(body, spine);

  const pcbGroup = createSvg('g', { class: 'psk-pcb' });
  const pcbBase = createBoard(92, 36, 8, 'pcb-base');
  const pcbTrace = createSvg('path', { d: 'M-34 -5 H -8 L -2 6 H 32', class: 'pcb-trace' });
  pcbGroup.append(pcbBase, pcbTrace);

  const powerGroup = createSvg('g', { class: 'psk-power' });
  const powerBase = createBoard(96, 30, 10, 'power-base');
  const powerBand = createBoard(102, 12, 8, 'power-band');
  powerBand.setAttribute('y', '-4');
  powerGroup.append(powerBase, powerBand);

  const armLayer = createSvg('g', { class: 'psk-arms' });
  const motorLayer = createSvg('g', { class: 'psk-motors' });
  const propLayer = createSvg('g', { class: 'psk-props' });

  const motorNodes = [];
  const propNodes = [];

  MOTOR_IDS.forEach(id => {
    const pos = MOTOR_POSITIONS[id];
    const screen = PROJECTION.project(pos.x, pos.z);
    const dir = { x: pos.x, z: pos.z };
    const length = Math.max(Math.hypot(dir.x, dir.z) - 18, 72);

    const arm = createArm(dir.x, dir.z, length);
    armLayer.append(arm);

    const motorGroup = createSvg('g', { class: 'motor-unit', 'data-position': id });
    setTranslate(motorGroup, screen.x, screen.y);
    const motor = createMotor();
    motorGroup.append(motor);
    motorLayer.append(motorGroup);

    const propGroup = createSvg('g', { class: 'prop-unit', 'data-position': id });
    setTranslate(propGroup, screen.x, screen.y - 2);
    const prop = createProp();
    propGroup.append(prop);
    propLayer.append(propGroup);

    motorNodes.push({ group: motorGroup, motor, position: pos });
    propNodes.push({ group: propGroup, prop, position: pos, motor: motorGroup });
  });

  const pcbOffset = PROJECTION.project(LAYOUT.pcb.x, LAYOUT.pcb.z);
  setTranslate(pcbGroup, pcbOffset.x, pcbOffset.y - 30);

  const powerOffset = PROJECTION.project(LAYOUT.power.x, LAYOUT.power.z);
  setTranslate(powerGroup, powerOffset.x, powerOffset.y + 34);

  const frameOffset = PROJECTION.project(LAYOUT.frame.x, LAYOUT.frame.z);
  setTranslate(frameGroup, frameOffset.x, frameOffset.y + 4);

  root.append(frameGroup, armLayer, pcbGroup, powerGroup, motorLayer, propLayer);
  svg.append(root);
  host.innerHTML = '';
  host.append(svg);

  const enforce = () => validateLayout({ motors: motorNodes, props: propNodes });
  enforce();

  let lastTime = performance.now();
  const tick = time => {
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    propNodes.forEach(({ prop, group }) => {
      const sign = PROP_SPIN_SIGNS[group.dataset.position] || 1;
      const nextAngle = (prop._angle || 0) + delta * 720 * sign;
      prop._angle = nextAngle;
      prop.style.transform = `rotate(${nextAngle}deg)`;
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const observer = new MutationObserver(() => enforce());
  observer.observe(container, { attributes: true, attributeFilter: ['class'] });

  return { root, svg, nodes: { frameGroup, pcbGroup, powerGroup, armLayer, motorLayer, propLayer }, validate: enforce };
}
