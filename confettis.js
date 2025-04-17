// confettis.js
export const ConfettiExtension = {
  name: 'Confetti',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_confetti',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    const c = confetti.create(canvas, { resize: true, useWorker: true });
    c({ particleCount: 200, spread: 160, colors: ['#ff0','#f0f'] });
  },
};
