// https://corentinhualpa.github.io/vf-extensions/flammes.js

export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    // 1) On tente de récupérer le bouton “Open” (uniquement en mobile/popup)
    let originX, originY;
    const btn = document.querySelector('button[aria-label="Open Voiceflow widget"]');
    if (btn) {
      const r = btn.getBoundingClientRect();
      originX = ((r.left + r.width / 2)  / window.innerWidth) * 100;
      originY = ((r.top  + r.height / 2) / window.innerHeight)* 100;
    } else {
      // 2) Fallback pour desktop : au milieu du container
      const container = document.getElementById('voiceflow-chat-container');
      const r = container.getBoundingClientRect();
      originX = ((r.left + r.width / 2)  / window.innerWidth) * 100;
      originY = ((r.top  + r.height / 2) / window.innerHeight)* 100;
    }

    // 3) Lancement du jet de flammes avec tsParticles
    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen:   { enable: false },
        background:   { color: 'transparent' },
        detectRetina: true,
        emitters: {
          direction: 'top',
          life:      { count: 1, duration: 0.6 },
          rate:      { quantity: 12, delay: 0 },
          size:      { width: 0, height: 0 },
          position:  { x: originX, y: originY },
        },
        particles: {
          number: { value: 0 },
          shape:  { type: 'circle' },
          size:   {
            value: { min: 4, max: 8 },
            animation: {
              enable:       true,
              speed:        20,
              minimumValue: 2,
              startValue:   'max',
              destroy:      'min',
            },
          },
          move: {
            enable:    true,
            direction: 'top',
            outModes:  { default: 'destroy' },
            gravity:   { enable: true, acceleration: -8 },
            speed:     { min: 20, max: 40 },
          },
          color: {
            value: ['#FF4500', '#FF8C00', '#FFD700', '#FF6347'],
          },
          opacity: {
            value: { min: 0.3, max: 0.7 },
            animation: {
              enable:       true,
              speed:        2,
              minimumValue: 0,
              startValue:   'max',
              destroy:      'min',
            },
          },
          rotate: {
            value: { min: -45, max: 45 },
            animation: { enable: true, speed: 15, sync: false },
          },
          swirl: {
            enable:       true,
            radius:       30,
            acceleration: 20,
          },
        },
        interactivity: {
          detectsOn: 'canvas',
          events: {
            onClick: { enable: false },
            onHover: { enable: false },
          },
        },
      },
    });

    // 4) Auto‑stop après 1s
    setTimeout(() => {
      const instance = tsParticles.domItem(0);
      instance?.destroy();
    }, 1000);
  },
};
