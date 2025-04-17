// flammes.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    // Calculer l’origine sur le bouton d'ouverture (avatar dragon)
    const btn = document.querySelector('button[aria-label="Open Voiceflow widget"]');
    const rect = btn?.getBoundingClientRect();
    const origin = {
      x: ((rect.left + rect.width/2) / window.innerWidth ) * 100,
      y: ((rect.top  + rect.height/2) / window.innerHeight) * 100,
    };

    // Créer l’émission tourbillonnante
    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen:  { enable: false },
        background:  { color: 'transparent' },
        detectRetina: true,
        emitters: {
          direction: 'top',
          life:      { count: 1, duration: 0.5 },
          rate:      { quantity: 10, delay: 0 },
          size:      { width: 0, height: 0 },
          position:  { x: origin.x, y: origin.y }
        },
        particles: {
          number:   { value: 0 },
          shape:    { type: 'circle' },
          size:     {
            value: { min: 4, max: 8 },
            animation: { enable: true, speed: 20, minimumValue: 2, startValue:'max', destroy:'min' }
          },
          move: {
            enable:    true,
            direction: 'top',
            outModes:  { default:'destroy' },
            gravity:   { enable:true, acceleration:-8 },
            speed:     { min:20, max:40 }
          },
          color:   { value: ['#FFA500','#FF4500','#FFD700'] },
          opacity: {
            value: { min: 0.3, max: 0.7 },
            animation: { enable:true, speed:2, minimumValue:0, startValue:'max', destroy:'min' }
          },
          rotate: {
            value: { min:-45, max:45 },
            animation: { enable:true, speed:15, sync:false }
          },
          swirl: {
            enable:       true,
            radius:       30,
            acceleration: 20
          }
        },
        interactivity: {
          detectsOn: 'canvas',
          events:    { onClick:{enable:false}, onHover:{enable:false} }
        }
      }
    });

    // Arrêter TSParticles après 1s
    setTimeout(() => {
      const instance = tsParticles.domItem(0);
      instance?.destroy();
    }, 1000);
  },
};
