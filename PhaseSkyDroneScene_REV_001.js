// Rev. 1.2.0
const SVG_NS = 'http://www.w3.org/2000/svg';

const createSvgElement = (tag, attributes = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
};

const setBasePosition = (element, x, y) => {
  element.style.setProperty('--base-x', `${x}px`);
  element.style.setProperty('--base-y', `${y}px`);
};

export const buildPhaseSkyDroneScene = container => {
  const sceneHost = container.querySelector('.phasesky-drone__scene') || container;
  const svg = createSvgElement('svg', { viewBox: '0 0 400 320', role: 'img', 'aria-hidden': 'true' });
  const root = createSvgElement('g', { class: 'phase-root' });

  // FRAME GROUP
  const frameGroup = createSvgElement('g', { class: 'phase-group phase-group--frame', 'data-part': 'FRAME' });
  setBasePosition(frameGroup, 200, 170);
  const frameBase = createSvgElement('rect', {
    x: -54,
    y: -26,
    width: 108,
    height: 56,
    rx: 12,
    class: 'fill-frame stroke-silver',
    'stroke-width': 2
  });
  const framePanel = createSvgElement('rect', {
    x: -46,
    y: -18,
    width: 92,
    height: 40,
    rx: 10,
    class: 'fill-panel stroke-dark',
    'stroke-width': 1.5
  });
  const accentBar = createSvgElement('rect', {
    x: -44,
    y: 4,
    width: 88,
    height: 6,
    rx: 3,
    class: 'fill-blue'
  });
  frameGroup.append(frameBase, framePanel, accentBar);

  // PCB GROUP
  const pcbGroup = createSvgElement('g', { class: 'phase-group phase-group--pcb', 'data-part': 'PCB' });
  setBasePosition(pcbGroup, 200, 140);
  const pcb = createSvgElement('rect', {
    x: -32,
    y: -14,
    width: 64,
    height: 28,
    rx: 6,
    class: 'fill-silver stroke-blue',
    'stroke-width': 1.6
  });
  const pcbTrace = createSvgElement('path', {
    d: 'M-24 -4 H -8 L -6 4 H 20',
    fill: 'none',
    class: 'stroke-blue',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });
  pcbGroup.append(pcb, pcbTrace);

  // POWER GROUP
  const powerGroup = createSvgElement('g', { class: 'phase-group phase-group--power', 'data-part': 'POWER' });
  setBasePosition(powerGroup, 200, 206);
  const cell = createSvgElement('rect', {
    x: -30,
    y: -16,
    width: 60,
    height: 32,
    rx: 8,
    class: 'fill-panel stroke-silver',
    'stroke-width': 1.8
  });
  const cellBand = createSvgElement('rect', {
    x: -32,
    y: -6,
    width: 64,
    height: 12,
    rx: 6,
    class: 'fill-blue'
  });
  powerGroup.append(cell, cellBand);

  // MOTOR GROUP
  const motorsGroup = createSvgElement('g', { class: 'phase-group phase-group--motors', 'data-part': 'MOTORS' });
  const propsGroup = createSvgElement('g', { class: 'phase-group phase-group--props', 'data-part': 'PROPS' });

  const motorPositions = [
    { name: 'front-left', x: 140, y: 120 },
    { name: 'front-right', x: 260, y: 120 },
    { name: 'rear-left', x: 140, y: 220 },
    { name: 'rear-right', x: 260, y: 220 }
  ];

  motorPositions.forEach(({ name, x, y }) => {
    const arm = createSvgElement('rect', {
      x: -12,
      y: -8,
      width: 86,
      height: 16,
      rx: 8,
      transform: name.includes('left') ? 'rotate(-18)' : 'rotate(18)',
      class: 'fill-panel'
    });
    const armGroup = createSvgElement('g', { class: 'motor-unit', 'data-position': name });
    setBasePosition(armGroup, x, y);
    const hub = createSvgElement('circle', {
      cx: 0,
      cy: 0,
      r: 14,
      class: 'fill-silver stroke-dark',
      'stroke-width': 1.2
    });
    const hubCap = createSvgElement('circle', {
      cx: 0,
      cy: 0,
      r: 7,
      class: 'fill-blue'
    });
    armGroup.append(arm, hub, hubCap);

    const propUnit = createSvgElement('g', { class: 'prop-unit', 'data-position': name });
    setBasePosition(propUnit, x, y);
    const propeller = createSvgElement('g', { class: 'propeller' });
    const bladeOne = createSvgElement('rect', {
      x: -2,
      y: -34,
      width: 4,
      height: 68,
      rx: 2.5,
      class: 'fill-silver'
    });
    const bladeTwo = createSvgElement('rect', {
      x: -2,
      y: -34,
      width: 4,
      height: 68,
      rx: 2.5,
      transform: 'rotate(90)',
      class: 'fill-silver'
    });
    const propGlow = createSvgElement('circle', { cx: 0, cy: 0, r: 10, class: 'fill-blue', opacity: '0.35' });
    propeller.append(propGlow, bladeOne, bladeTwo);
    propUnit.append(propeller);

    motorsGroup.append(armGroup);
    propsGroup.append(propUnit);
  });

  // FRAME arms overlay for visual cohesion
  const frameArms = createSvgElement('path', {
    d: 'M0 0 L-58 -52 M0 0 L58 -52 M0 0 L-58 52 M0 0 L58 52',
    fill: 'none',
    class: 'stroke-silver',
    'stroke-width': 2.2,
    'stroke-linecap': 'round'
  });
  frameGroup.append(frameArms);

  root.append(frameGroup, pcbGroup, powerGroup, motorsGroup, propsGroup);
  svg.append(root);
  sceneHost.innerHTML = '';
  sceneHost.append(svg);

  return {
    root,
    svg,
    groups: {
      frame: frameGroup,
      pcb: pcbGroup,
      power: powerGroup,
      motors: motorsGroup,
      props: propsGroup
    }
  };
};
