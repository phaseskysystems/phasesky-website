const DEG_TO_RAD = Math.PI / 180;

const PARTS = {
  frame: { width: 180, depth: 72, height: 16 },
  arm: { length: 190, width: 18, height: 8 },
  motor: { radius: 18, height: 14 },
  prop: { length: 120, width: 14 },
  stack: {
    spacing: 34,
    items: [
      'FLIGHT CONTROLLER',
      'ESC / POWER STAGE',
      'POWER DISTRIBUTION',
      'BATTERY / POWER MODULE'
    ]
  }
};

const ARM_ORDER = ['front-left', 'front-right', 'rear-left', 'rear-right'];
const ARM_ANGLES = {
  'front-left': -45,
  'front-right': 45,
  'rear-left': -135,
  'rear-right': 135
};

const LABELS = [
  { key: 'FRAME', anchor: { x: 0, y: -60 }, align: 'center' },
  { key: 'ARMS', anchor: { x: -4, y: -18 }, align: 'center' },
  { key: 'MOTORS', anchor: { x: 0, y: -132 }, align: 'center' },
  { key: 'PROPELLERS', anchor: { x: 0, y: -166 }, align: 'center' },
  { key: 'FLIGHT CONTROLLER', anchor: { x: -158, y: -18 }, align: 'right' },
  { key: 'ESC / POWER STAGE', anchor: { x: -158, y: 18 }, align: 'right' },
  { key: 'POWER DISTRIBUTION', anchor: { x: 158, y: -6 }, align: 'left' },
  { key: 'BATTERY / POWER MODULE', anchor: { x: 158, y: 26 }, align: 'left' },
  { key: 'RF RECEIVER', anchor: { x: -108, y: -94 }, align: 'right' },
  { key: 'ANTENNA', anchor: { x: 108, y: -98 }, align: 'left' },
  { key: 'FPV CAMERA', anchor: { x: -94, y: 94 }, align: 'right' },
  { key: 'VIDEO TRANSMITTER', anchor: { x: 96, y: 92 }, align: 'left' }
];

const createEl = (tag, className, parent) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (parent) parent.appendChild(el);
  return el;
};

const createPropBlades = () => {
  const blade = createEl('span', 'psk-prop__blade');
  const bladeMirror = createEl('span', 'psk-prop__blade psk-prop__blade--b');
  const hub = createEl('span', 'psk-prop__hub');
  const prop = createEl('div', 'psk-prop');
  prop.append(blade, bladeMirror, hub);
  return prop;
};

const createMotorUnit = (id, yawDegrees) => {
  const motor = createEl('div', 'psk-motor');
  motor.dataset.position = id;
  const prop = createPropBlades();
  const group = createEl('div', 'psk-motor-unit');
  group.dataset.position = id;
  group.style.setProperty('--arm-angle', `${yawDegrees}deg`);
  group.append(motor, prop);
  return { group, motor, prop };
};

const createStackItem = label => {
  const item = createEl('div', 'psk-stack__item');
  item.textContent = label;
  return item;
};

const createLabelLayer = host => {
  const layer = createEl('div', 'psk-labels', host);
  const svg = createEl('svg', 'psk-labels__lines', layer);
  svg.setAttribute('viewBox', '-240 -200 480 400');

  const labelContainer = createEl('div', 'psk-labels__tags', layer);

  LABELS.forEach(label => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('psk-labels__leader');
    line.dataset.key = label.key;
    svg.append(line);

    const tag = createEl('div', 'psk-label');
    tag.dataset.key = label.key;
    tag.dataset.align = label.align;
    tag.textContent = label.key;
    tag.style.setProperty('--label-x', `${label.anchor.x}px`);
    tag.style.setProperty('--label-y', `${label.anchor.y}px`);
    labelContainer.append(tag);
  });

  return layer;
};

export function buildPhaseSkyDroneGraphic(container) {
  const scene = container.querySelector('.phasesky-drone__scene') || container;
  scene.classList.add('psk-drone-scene');

  const root = createEl('div', 'psk-drone', scene);
  root.dataset.mode = 'DEFAULT';

  const frame = createEl('div', 'psk-frame', root);
  const armsLayer = createEl('div', 'psk-arms', root);
  const stack = createEl('div', 'psk-stack', root);
  const comms = createEl('div', 'psk-comms', root);

  ARM_ORDER.forEach(id => {
    const arm = createEl('div', 'psk-arm', armsLayer);
    arm.dataset.position = id;
    arm.style.setProperty('--arm-angle', `${ARM_ANGLES[id]}deg`);
  });

  const motorUnits = ARM_ORDER.map(id => createMotorUnit(id, ARM_ANGLES[id]));
  motorUnits.forEach(({ group }) => root.appendChild(group));

  const electronics = PARTS.stack.items.map(createStackItem);
  electronics.forEach(item => stack.appendChild(item));

  const rf = createEl('div', 'psk-comm psk-comm--rf', comms);
  rf.textContent = 'RF RECEIVER';
  const antenna = createEl('div', 'psk-comm psk-comm--antenna', comms);
  antenna.textContent = 'ANTENNA';
  const fpv = createEl('div', 'psk-comm psk-comm--fpv', comms);
  fpv.textContent = 'FPV CAMERA';
  const vtx = createEl('div', 'psk-comm psk-comm--vtx', comms);
  vtx.textContent = 'VIDEO TRANSMITTER';

  const labels = createLabelLayer(container);

  const parts = {
    root,
    frame,
    arms: Array.from(armsLayer.children),
    motors: motorUnits.map(unit => unit.motor),
    props: motorUnits.map(unit => unit.prop),
    motorGroups: motorUnits.map(unit => unit.group),
    stackItems: electronics,
    comms: { rf, antenna, fpv, vtx },
    labels
  };

  return parts;
}
