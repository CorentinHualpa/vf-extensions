// flammes.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames',
  effect: () => {
    const btn = document.querySelector('button[aria-label="Open Voiceflow widget"]');
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    // origine en desktop fallback ou mobile bouton
    let xPct, yPct;
    if (btn) {
      const r = btn.getBoundingClientRect();
      xPct = ((r.left + r.width/2)/window.innerWidth)*100;
      yPct = ((r.top  + r.height/2)/window.innerHeight)*100;
    } else {
      const cont = document.getElementById('voiceflow-chat-container');
      const r = cont.getBoundingClientRect();
      xPct = ((r.left + r.width/2)/window.innerWidth)*100;
      yPct = ((r.top  + r.height/2)/window.innerHeight)*100;
    }

    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        detectRetina: true,
        emitters: {
          direction: 'top',
          life:      { count: 1, duration: 0.6 },
          rate:      { quantity: 12, delay: 0 },
          position:  { x: xPct, y: yPct }
        },
        particles: {
          number: { value:0 },
          shape:  { type:'circle' },
          size: {
            value: { min:4, max:8 },
            animation: { enable:true, speed:20, minimumValue:2, startValue:'max', destroy:'min' }
          },
          move: {
            enable:true,
            direction:'top',
            outModes:{ default:'destroy' },
            gravity:{ enable:true, acceleration:-8 },
            speed:{ min:20, max:40 }
          },
          color:  { value:['#FF4500','#FF8C00','#FFD700'] },
          opacity: {
            value: { min:0.3, max:0.7 },
            animation:{ enable:true, speed:2, minimumValue:0, startValue:'max', destroy:'min' }
          },
          rotate:{ value:{min:-45,max:45}, animation:{enable:true,speed:15} },
          swirl: { enable:true, radius:30, acceleration:20 }
        }
      }
    });

    // stop after 1 second
    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      inst?.destroy();
    }, 1000);
  },
};
