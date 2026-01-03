const SVG_NS = 'http://www.w3.org/2000/svg';

const MODES = {
  DEFAULT: 'MODE_DEFAULT',
  EXPLODED: 'MODE_EXPLODED'
};

const MOTOR_IDS = ['front-left', 'front-right', 'rear-left', 'rear-right'];

const LAYOUT = {
  radius: 94,
  motorY: 0,
  yawSpeed: 8.5, // degrees per second
  basePitch: -10,
  propSpinSpeed: 860 // degrees per second
};

const EXPLODE = {
  stackSpacing: 32,
  motorOffset: 54,
  pcbLift: -52,
  escLift: -16,
  pdbLift: 20,
  batteryLift: 58,
  rfOffset: { x: -64, y: 22 },
  antennaOffset: { x: -88, y: 52 },
  fpvOffset: { x: 82, y: -94 },
  vtxOffset: { x: -78, y: -124 }
};

const LABEL_POSITIONS = {
  FRAME: { x: 28, y: 14, angle: -26, delay: 0.2 },
  ARMS: { x: -120, y: -12, angle: -152, delay: 0.22 },
  MOTORS: { x: 132, y: -32, angle: 22, delay: 0.23 },
  PROPELLERS: { x: -128, y: -96, angle: -38, delay: 0.24 },
  'FLIGHT CONTROLLER': { x: 96, y: -64, angle: 18, delay: 0.2 },
  'ESC / POWER STAGE': { x: -86, y: 4, angle: -160, delay: 0.2 },
  'POWER DISTRIBUTION': { x: 88, y: 52, angle: 18, delay: 0.22 },
  'BATTERY / POWER MODULE': { x: -96, y: 136, angle: -162, delay: 0.24 },
  'RF RECEIVER': { x: 118, y: 120, angle: 26, delay: 0.23 },
  ANTENNA: { x: -118, y: 176, angle: -170, delay: 0.25 },
  'FPV CAMERA': { x: 104, y: -130, angle: 16, delay: 0.22 },
  'VIDEO TRANSMITTER': { x: -104, y: -170, angle: -162, delay: 0.24 }
};

const COMM_BASE = {
  rf: { x: -14, y: 96 },
  antenna: { x: 18, y: 132 },
  fpv: { x: 0, y: -42 },
  vtx: { x: 0, y: -52 }
};

const lerp = (a, b, t) => a + (b - a) * t;

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

const easeInOut = t => 0.5 - Math.cos(Math.PI * t) / 2;

const project = (x, z) => ({ x, y: z * 0.7 });

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
  const arm = createSvg('g', { class: 'psk-arm psk-layer' });
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
  g.style.transform = 'rotateY(0deg)';
  g.style.transformOrigin = 'center center';
  return g;
};

const createBoard = (w, h, r, cls) => createSvg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: r, class: cls });

const mapToPercent = (value, min, max) => ((value - min) / (max - min)) * 100;

const createLabelLayer = viewBox => {
  const layer = document.createElement('div');
  layer.className = 'psk-label-layer';
  const [minX, minY, width, height] = viewBox;

  Object.entries(LABEL_POSITIONS).forEach(([name, cfg]) => {
    const label = document.createElement('div');
    label.className = 'psk-label';
    label.textContent = name;
    label.style.left = `${mapToPercent(cfg.x, minX, minX + width)}%`;
    label.style.top = `${mapToPercent(cfg.y, minY, minY + height)}%`;
    label.style.setProperty('--leader-angle', `${cfg.angle}deg`);
    label.style.setProperty('--label-delay', `${cfg.delay}s`);

    const leader = document.createElement('span');
    leader.className = 'psk-leader';
    label.prepend(leader);

    layer.append(label);
  });

  return layer;
};

const validateLayout = state => {
  const { mode, rotationActive, motors, electronics } = state;

  if (rotationActive && mode !== MODES.DEFAULT && !state.isTransitioning) {
    throw new Error('REV_002 validation failed: rotation active outside MODE_DEFAULT');
  }

  if (!rotationActive && mode !== MODES.EXPLODED && !state.isTransitioning) {
    throw new Error('REV_002 validation failed: rotation disabled outside MODE_EXPLODED');
  }

  motors.forEach(({ prop, group, expected }) => {
    const transform = prop.style.transform || '';
    if (/rotateX\(/.test(transform) || /rotateZ\(/.test(transform)) {
      throw new Error('REV_002 validation failed: prop rotation axis drifted');
    }
    const dataX = parseFloat(group.dataset.x);
    const dataY = parseFloat(group.dataset.y);
    if (Math.abs(expected.x - dataX) > 0.75 || Math.abs(expected.y - dataY) > 0.75) {
      throw new Error('REV_002 validation failed: motor not centered on arm end');
    }
  });

  const minSpacing = 14;
  for (let i = 0; i < electronics.length; i += 1) {
    for (let j = i + 1; j < electronics.length; j += 1) {
      const dy = Math.abs(electronics[i].y - electronics[j].y);
      if (dy < minSpacing) {
        throw new Error('REV_002 validation failed: exploded layout overlap detected');
      }
    }
  }
};

export function buildPhaseSkyDroneGraphic(container) {
  const host = container.querySelector('.phasesky-drone__scene') || container;
  host.innerHTML = '';

  const model = document.createElement('div');
  model.className = 'phasesky-drone__model';

  const viewBox = [-220, -200, 440, 400];
  const svg = createSvg('svg', {
    viewBox: viewBox.join(' '),
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

  const frameGroup = createSvg('g', { class: 'psk-frame psk-layer' });
  const body = createBoard(138, 56, 14, 'frame-body');
  const spine = createBoard(122, 14, 10, 'frame-stripe');
  spine.setAttribute('y', '-4');
  frameGroup.append(body, spine);

  const fcGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'fc' });
  fcGroup.append(createBoard(82, 28, 8, 'elec-board'), createBoard(58, 10, 5, 'elec-topper'));

  const escGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'esc' });
  escGroup.append(createBoard(94, 24, 8, 'elec-board'));

  const pdbGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'pdb' });
  pdbGroup.append(createBoard(104, 28, 10, 'elec-board'));

  const batteryGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'battery' });
  batteryGroup.append(createBoard(114, 34, 12, 'elec-board'), createBoard(110, 12, 10, 'elec-topper'));

  const rfGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'rf' });
  rfGroup.append(createBoard(52, 14, 6, 'elec-board'));

  const antennaGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'antenna' });
  antennaGroup.append(createBoard(12, 46, 6, 'elec-board'));

  const fpvGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'fpv' });
  fpvGroup.append(createBoard(48, 18, 6, 'elec-board'));

  const vtxGroup = createSvg('g', { class: 'psk-electronics psk-layer', 'data-role': 'vtx' });
  vtxGroup.append(createBoard(62, 18, 6, 'elec-board'));

  const armLayer = createSvg('g', { class: 'psk-arms' });
  const motorLayer = createSvg('g', { class: 'psk-motors' });
  const propLayer = createSvg('g', { class: 'psk-props' });

  const motors = [];

  MOTOR_IDS.forEach(id => {
    const pos = MOTOR_POSITIONS[id];
    const screen = project(pos.x, pos.z);
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

    motors.push({ group: motorGroup, prop: prop, position: { ...pos, screen }, base: screen });
  });

  const groups = [
    frameGroup,
    armLayer,
    fcGroup,
    escGroup,
    pdbGroup,
    batteryGroup,
    rfGroup,
    antennaGroup,
    fpvGroup,
    vtxGroup,
    motorLayer,
    propLayer
  ];
  root.append(...groups);
  svg.append(root);
  model.append(svg);
  host.append(model, createLabelLayer(viewBox));

  const state = {
    mode: MODES.DEFAULT,
    isTransitioning: false,
    rotationActive: true,
    yaw: 22,
    pitch: LAYOUT.basePitch,
    motors,
    electronics: [],
    root,
    model,
    lastTime: performance.now()
  };

  const applyPositions = progress => {
    const eased = easeInOut(progress);
    const fcY = eased * EXPLODE.pcbLift;
    const escY = eased * EXPLODE.escLift;
    const pdbY = eased * EXPLODE.pdbLift;
    const batteryY = eased * EXPLODE.batteryLift;

    const motorOffset = eased * EXPLODE.motorOffset;

    setTranslate(frameGroup, 0, 10);
    setTranslate(fcGroup, 0, -6 + fcY);
    setTranslate(escGroup, 0, 18 + escY);
    setTranslate(pdbGroup, 0, 46 + pdbY);
    setTranslate(batteryGroup, 0, 76 + batteryY);

    const rfX = lerp(COMM_BASE.rf.x, COMM_BASE.rf.x + EXPLODE.rfOffset.x, eased);
    const rfY = lerp(COMM_BASE.rf.y, COMM_BASE.rf.y + EXPLODE.rfOffset.y, eased);
    setTranslate(rfGroup, rfX, rfY);

    const antennaX = lerp(COMM_BASE.antenna.x, COMM_BASE.antenna.x + EXPLODE.antennaOffset.x, eased);
    const antennaY = lerp(COMM_BASE.antenna.y, COMM_BASE.antenna.y + EXPLODE.antennaOffset.y, eased);
    setTranslate(antennaGroup, antennaX, antennaY);

    const fpvX = lerp(COMM_BASE.fpv.x, COMM_BASE.fpv.x + EXPLODE.fpvOffset.x, eased);
    const fpvY = lerp(COMM_BASE.fpv.y, COMM_BASE.fpv.y + EXPLODE.fpvOffset.y, eased);
    setTranslate(fpvGroup, fpvX, fpvY);

    const vtxX = lerp(COMM_BASE.vtx.x, COMM_BASE.vtx.x + EXPLODE.vtxOffset.x, eased);
    const vtxY = lerp(COMM_BASE.vtx.y, COMM_BASE.vtx.y + EXPLODE.vtxOffset.y, eased);
    setTranslate(vtxGroup, vtxX, vtxY);

    state.electronics = [
      { name: 'FLIGHT CONTROLLER', y: -6 + fcY },
      { name: 'ESC / POWER STAGE', y: 18 + escY },
      { name: 'POWER DISTRIBUTION', y: 46 + pdbY },
      { name: 'BATTERY / POWER MODULE', y: 76 + batteryY },
      { name: 'RF RECEIVER', y: rfY },
      { name: 'ANTENNA', y: antennaY },
      { name: 'FPV CAMERA', y: fpvY },
      { name: 'VIDEO TRANSMITTER', y: vtxY }
    ];

    motors.forEach(motor => {
      const { group, prop, position } = motor;
      const dir = Math.hypot(position.x, position.z) || 1;
      const nx = position.x / dir;
      const nz = position.z / dir;
      const offset = project(nx * motorOffset, nz * motorOffset);
      const base = project(position.x, position.z);
      const target = { x: base.x + offset.x, y: base.y + offset.y };
      motor.expected = target;
      group.dataset.x = target.x;
      group.dataset.y = target.y;
      setTranslate(group, target.x, target.y);
      setTranslate(prop.parentNode, target.x, target.y - 2);
    });
  };

  applyPositions(0);

  const runValidationSafe = () => {
    try {
      validateLayout(state);
    } catch (err) {
      state.halt = true;
      console.error(err);
      throw err;
    }
  };

  runValidationSafe();

  const step = time => {
    if (state.halt) return;
    const delta = (time - state.lastTime) / 1000;
    state.lastTime = time;

    const transitionProgress = state.isTransitioning
      ? Math.min((time - state.transitionStart) / state.transitionDuration, 1)
      : null;
    const rotationWeight = state.isTransitioning
      ? state.mode === MODES.EXPLODED
        ? 1 - transitionProgress
        : transitionProgress
      : state.mode === MODES.DEFAULT
        ? 1
        : 0;

    state.rotationActive = rotationWeight > 0.001;

    if (state.rotationActive) {
      state.yaw += delta * LAYOUT.yawSpeed * rotationWeight;
      const microPitch = Math.sin(time * 0.0006) * 1.4 * rotationWeight;
      state.pitch = LAYOUT.basePitch + microPitch;
    } else {
      state.pitch = LAYOUT.basePitch;
    }

    const rotation = `perspective(1200px) rotateX(${state.pitch}deg) rotateY(${state.yaw}deg)`;
    state.model.style.transform = rotation;

    motors.forEach(({ prop, group }) => {
      const sign = PROP_SPIN_SIGNS[group.dataset.position] || 1;
      const nextAngle = (prop._angle || 0) + delta * LAYOUT.propSpinSpeed * sign;
      prop._angle = nextAngle;
      prop.style.transform = `rotateY(${nextAngle}deg)`;
    });

    if (state.isTransitioning) {
      applyPositions(state.mode === MODES.EXPLODED ? transitionProgress : 1 - transitionProgress);

      if (transitionProgress >= 1) {
        state.isTransitioning = false;
        state.rotationActive = state.mode === MODES.DEFAULT;
        runValidationSafe();
      }
    }

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  const toggleMode = nextMode => {
    if (state.isTransitioning || state.mode === nextMode) return;
    state.mode = nextMode;
    state.isTransitioning = true;
    state.transitionStart = performance.now();
    state.transitionDuration = 700;
    state.rotationActive = state.mode === MODES.DEFAULT;
    container.classList.toggle('is-exploded', state.mode === MODES.EXPLODED);
  };

  return {
    root,
    model,
    toggleMode,
    state,
    getMode: () => state.mode,
    validate: runValidationSafe,
    applyPositions
  };
}

export { MODES as PHASESKY_MODES };
