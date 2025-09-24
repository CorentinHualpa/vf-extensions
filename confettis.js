// confettis.js 
export const ConfettiExtension = {
  name: 'Confetti',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_confetti' || trace.payload?.name === 'ext_confetti',
  effect: () => {
    const canvas = document.querySelector('#confetti-canvas');
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    myConfetti({
      particleCount: 200,
      spread:        160,
      colors: [
        '#a864fd', // violet
        '#29cdff', // bleu
        '#78ff44', // vert
        '#ff718d', // rose
        '#fdff6a'  // jaune
      ],
    });
  },
};
