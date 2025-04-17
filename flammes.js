// https://corentinhualpa.github.io/vf-extensions/flammes.js

export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: () => {
    const canvas = document.querySelector('#confetti-canvas');
    if (!canvas) return;

    // Utilisation du global “confetti” chargé par le <script> UMD
    const myFlames = confetti.create(canvas, {
      resize:    true,
      useWorker: true,
    });

    myFlames({
      particleCount: 150,
      spread:        120,
      startVelocity: 80,
      ticks:         200,
      shapes:       ['circle'],
      gravity:       0.3,
      colors: [
        '#FF4500',
        '#FF8C00',
        '#FFD700',
        '#FF6347',
      ],
    });
  },
};
