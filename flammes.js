export const FlamesExtension = {
  name: 'ext_flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: ({ trace }) => {
    const canvas = document.querySelector('#confetti-canvas');
    if (!canvas) return;

    // plus d’import, on utilise globalement “confetti”
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
    myConfetti({
      particleCount: 250,
      spread: 120,
      startVelocity: 80,
      ticks: 200,
      shapes: ['circle'],
      colors: ['#FF4500','#FF8C00','#FFD700','#FF6347'],
      gravity: 0.3,
    });
  },
};
