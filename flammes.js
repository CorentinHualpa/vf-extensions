// flammes.js
import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.esm.min.js';

export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: () => {
    const canvas = document.querySelector('#confetti-canvas');
    if (!canvas) return;
    // on crée 4 “couleurs feu”
    const my = confetti.create(canvas, { resize: true, useWorker: true });
    my({
      particleCount: 150,
      spread:        120,
      startVelocity: 80,
      ticks:         200,
      shapes:       ['circle'],
      gravity:       0.3,
      colors: [
        '#FF4500', // orange brûlé
        '#FF8C00', // orange
        '#FFD700', // or jaune
        '#FF6347', // tomate
      ],
    });
  },
};
