// flames-extension.js
import confetti from 'canvas-confetti';

export const FlamesExtension = {
  name: 'ext_flames',           // Si vous avez renommé la Custom Action
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' ||
    trace.payload?.name === 'ext_flames',
  effect: ({ trace }) => {
    const canvas = document.querySelector('#confetti-canvas');
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });
    myConfetti({
      particleCount: 250,
      spread: 120,
      startVelocity: 80,
      ticks: 200,
      shapes: ['circle'],    // des cercles pour ressembler à des étincelles/brasiers
      colors: [
        '#FF4500',           // orange feu
        '#FF8C00',           // orange foncé
        '#FFD700',           // jaune or
        '#FF6347',           // tomate
      ],
      gravity: 0.3,
    });
  },
};

window.voiceflow.chat.load({
  verify: { projectID: 'VOTRE_PROJECT_ID' },
  url: 'https://general-runtime.voiceflow.com',
  versionID: 'production',
  assistant: {
    extensions: [FlamesExtension],
  },
});
