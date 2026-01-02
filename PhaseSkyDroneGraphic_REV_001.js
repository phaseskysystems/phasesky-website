const SVG_NS = 'http://www.w3.org/2000/svg';

const COORDS = {
  radius: 92,
  motorY: 0,
  pcb: { x: 0, y: -24, z: 10 },
  power: { x: 0, y: 22, z: -6 },
  frame: { x: 0, y: 0, z: 0 }
};

const MOTOR_ORDER = ['front-left', 'front-right', 'rear-left', 'rear-right'];
const MOTOR_POSITIONS = {
  'front-left': { x: -COORDS.radius, y: COORDS.motorY, z: COORDS.radius },
  'front-right': { x: COORDS.radius, y: COORDS.motorY, z: COORDS.radius },
  'rear-left': { x: -COORDS.radius, y: COORDS.motorY, z: -COORDS.radius },
  'rear-right': { x: COORDS.radius, y: COORDS.motorY, z: -COORDS.radius }
};

const PROP_SPIN_SIGNS = {
  'front-left': 1,
  'rear-right': 1,
  'front-right': -1,
  'rear-left': -1
};

const createSvg = (tag, attrs = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined) el.setAttribute(key, value);
  });
  return el;
};

const setTransform = (el, x = 0, y = 0) => {
  el.setAttribute('transform', `translate(${x} ${y})`);
};

const deg = rad => (rad * 180) / Math.PI;

const createArm = (dx, dz, length) => {
  const angle = deg(Math.atan2(dz, dx));
  const arm = createSvg('g', { class: 'psk-arm' });
  const taper = createSvg('path', {
    d: `M0 -8 L ${length - 14} -4 Q ${length} 0 ${length - 14} 4 L 0 8 Z`,
    class: 'arm-body'
  });
  const inset = createSvg('path', {
    d: `M10 -3 L ${length - 22} -1 Q ${length - 12} 0 ${length - 22} 1 L 10 3 Z`,
    class: 'arm-inset'
  });
  arm.append(taper, inset);
  arm.setAttribute('transform', `rotate(${angle})`);
  return arm;
};

const createMotor = () => {
  const motor = createSvg('g', { class: 'psk-motor' });
  const bell = createSvg('circle', { r: 14, class: 'motor-bell' });
  const body = createSvg('circle', { r: 11, class: 'motor-body' });
  const hub = createSvg('circle', { r: 4.5, class: 'motor-hub' });
  motor.append(bell, body, hub);
  return motor;
};

const createProp = () => {
  const prop = createSvg('g', { class: 'psk-prop' });
  const hub = createSvg('circle', { r: 2.6, class: 'prop-hub' });
  const blade1 = createSvg('path', {
    d: 'M0 0 C 12 -1 44 -6 58 -2 C 44 2 12 1 0 0 Z',
    class: 'prop-blade'
  });
  const blade2 = createSvg('path', {
    d: 'M0 0 C -12 1 -44 6 -58 2 C -44 -2 -12 -1 0 0 Z',
    class: 'prop-blade'
  });
  const blade3 = createSvg('path', {
    d: 'M0 0 C 4 10 6 40 2 54 C -2 40 -4 10 0 0 Z',
    class: 'prop-blade'
  });
  prop.append(blade1, blade2, blade3, hub);
  prop.style.transform = 'rotateY(0deg)';
  return prop;
};

const createBoard = (width, height, radius, cls) =>
  createSvg('rect', { x: -width / 2, y: -height / 2, width, height, rx: radius, class: cls });

const computeScreen = (x, z) => ({ x, y: z * 0.78 });

const validateLayout = ({ motors, props }) => {
  const radii = motors.map(m => Math.hypot(m.position.x, m.position.z));
  const baseline = radii[0];
  motors.forEach(m => {
    if (Math.abs(m.position.y - COORDS.motorY) > 1e-4) {
      throw new Error('Motor Y positions must be identical');
    }
    if (Math.abs(Math.hypot(m.position.x, m.position.z) - baseline) > 0.5) {
      throw new Error('Motor radii mismatch');
    }
  });
  props.forEach(({ prop, motor }) => {
    const propMatrix = prop.getScreenCTM();
    const motorMatrix = motor.getScreenCTM();
    if (!propMatrix || !motorMatrix) return;
    const propOrigin = { x: propMatrix.e, y: propMatrix.f };
    const motorOrigin = { x: motorMatrix.e, y: motorMatrix.f };
    if (Math.hypot(propOrigin.x - motorOrigin.x, propOrigin.y - motorOrigin.y) > 0.75) {
      throw new Error('Prop misaligned with motor shaft');
    }
    const transform = prop.style.transform || '';
    const hasXorZ = /rotateX\([^0]/.test(transform) || /rotateZ\([^0]/.test(transform));
    if (hasXorZ) {
      throw new Error('Prop rotation must only use Y axis');
    }
  });
};

export function buildPhaseSkyDroneGraphic(container) {
  const host = container.querySelector('.phasesky-drone__scene') || container;
  const svg = createSvg('svg', { viewBox: '-220 -190 440 360', class: 'phasesky-drone__svg', role: 'img', 'aria-hidden': 'true' });
  const defs = createSvg('defs');
  const glow = createSvg('radialGradient', { id: 'psk-glow', cx: '50%', cy: '50%', r: '60%' });
  glow.append(
    createSvg('stop', { offset: '0%', 'stop-color': '#7dd5ff', 'stop-opacity': '0.4' }),
    createSvg('stop', { offset: '100%', 'stop-color': '#7dd5ff', 'stop-opacity': '0' })
  );
  defs.append(glow);
  svg.append(defs);

  const root = createSvg('g', { class: 'psk-root' });

  const halo = createSvg('circle', { r: 170, class: 'psk-halo', fill: 'url(#psk-glow)' });
  root.append(halo);

  const frameGroup = createSvg('g', { class: 'psk-frame' });
  setTransform(frameGroup, COORDS.frame.x, computeScreen(0, COORDS.frame.z).y);

  const body = createBoard(128, 54, 14, 'frame-body');
  const stripe = createBoard(118, 12, 8, 'frame-stripe');
  stripe.setAttribute('y', '-6');
  frameGroup.append(body, stripe);

  const pcbGroup = createSvg('g', { class: 'psk-pcb' });
  const pcbOffset = computeScreen(COORDS.pcb.x, COORDS.pcb.z);
  setTransform(pcbGroup, pcbOffset.x, pcbOffset.y - 34);
  const pcbBase = createBoard(94, 34, 8, 'pcb-base');
  const pcbTrace = createSvg('path', {
    d: 'M-34 -4 H -6 L -2 6 H 30',
    class: 'pcb-trace'
  });
  pcbGroup.append(pcbBase, pcbTrace);

  const powerGroup = createSvg('g', { class: 'psk-power' });
  const powerOffset = computeScreen(COORDS.power.x, COORDS.power.z);
  setTransform(powerGroup, powerOffset.x, powerOffset.y + 34);
  const powerBase = createBoard(92, 28, 10, 'power-base');
  const powerBand = createBoard(98, 12, 8, 'power-band');
  powerBand.setAttribute('y', '-6');
  powerGroup.append(powerBase, powerBand);

  const armLayer = createSvg('g', { class: 'psk-arms' });
  const motorLayer = createSvg('g', { class: 'psk-motors' });
  const propLayer = createSvg('g', { class: 'psk-props' });

  const motorNodes = [];
  const propNodes = [];
  MOTOR_ORDER.forEach(id => {
    const pos = MOTOR_POSITIONS[id];
    const screen = computeScreen(pos.x, pos.z);
    const dir = { x: pos.x, z: pos.z };
    const length = Math.hypot(dir.x, dir.z) - 22;
    const arm = createArm(dir.x, dir.z, length);
    setTransform(arm, 0, 0);
    armLayer.append(arm);

    const motorGroup = createSvg('g', { class: 'motor-unit', 'data-position': id });
    setTransform(motorGroup, screen.x, screen.y);
    const motor = createMotor();
    motorGroup.append(motor);
    motorLayer.append(motorGroup);

    const propGroup = createSvg('g', { class: 'prop-unit', 'data-position': id });
    setTransform(propGroup, screen.x, screen.y - 2);
    const prop = createProp();
    propGroup.append(prop);
    propLayer.append(propGroup);

    motorNodes.push({ group: motorGroup, position: pos, motor });
    propNodes.push({ group: propGroup, prop, position: pos, motor: motorGroup });
  });

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
      const id = group.dataset.position;
      const sign = PROP_SPIN_SIGNS[id] || 1;
      const angle = (prop._angle || 0) + delta * 9 * sign * 60;
      prop._angle = angle;
      prop.style.transform = `rotateY(${angle}deg)`;
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const observer = new MutationObserver(() => enforce());
  observer.observe(container, { attributes: true, attributeFilter: ['class'] });

  return {
    root,
    svg,
    nodes: { frameGroup, pcbGroup, powerGroup, armLayer, motorLayer, propLayer },
    validate: enforce
  };
}
