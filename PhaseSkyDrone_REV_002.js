// Rev. 1.2.0
import { buildPhaseSkyDroneGraphic, PHASESKY_MODES } from './PhaseSkyDroneGraphic_REV_002.js';

const TRANSITION_DURATION = 700;

const initPhaseSkyDrone = () => {
  const container = document.querySelector('[data-component="PhaseSkyDrone_REV_002"]');
  if (!container) return;

  const hint = container.querySelector('.phasesky-drone__hint');
  const graphic = buildPhaseSkyDroneGraphic(container);

  const updateHint = mode => {
    if (!hint) return;
    hint.textContent = mode === PHASESKY_MODES.EXPLODED ? 'CLICK TO RETURN' : 'CLICK TO VIEW PARTS';
  };

  updateHint(PHASESKY_MODES.DEFAULT);

  const performValidationAfterTransition = () => {
    window.setTimeout(() => {
      try {
        graphic.validate();
      } catch (err) {
        // Validation throws to stop the loop and surface the issue.
      }
    }, TRANSITION_DURATION + 40);
  };

  const toggle = () => {
    const next = graphic.getMode() === PHASESKY_MODES.DEFAULT ? PHASESKY_MODES.EXPLODED : PHASESKY_MODES.DEFAULT;
    graphic.toggleMode(next);
    updateHint(next);
    performValidationAfterTransition();
  };

  container.addEventListener('click', toggle);
  graphic.validate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhaseSkyDrone);
} else {
  initPhaseSkyDrone();
}
