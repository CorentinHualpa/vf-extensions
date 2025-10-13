// flammes-intense.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    canvas.style.backgroundColor = 'transparent';
    canvas.style.pointerEvents = 'none !important';

    const avatarImg = document.querySelector('.vfrc-avatar[alt="system agent avatar"]');
    
    let xPct, yPct;
    if (avatarImg) {
      const rect = avatarImg.getBoundingClientRect();
      xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100 + 2;
    } else {
      xPct = 50;
      yPct = 12;
    }

    // Configuration pour BEAUCOUP plus de flammes
    const emitters = [];
    const numEmitters = 5;  // 5 émetteurs pour couvrir large
    
    for (let i = 0; i < numEmitters; i++) {
      const offset = (i - Math.floor(numEmitters / 2)) * 2.5; // Espacés de 2.5%
      emitters.push({
        direction: 'top',
        life: { 
          count: 1, 
          duration: 2.5,
          delay: i * 0.1  // Démarrage progressif
        },
        rate: { 
          quantity: 4,
          delay: 0.05
        },
        position: { 
          x: xPct + offset,
          y: yPct 
        },
        size: { 
          width: 12, 
          height: 12 
        }
      });
    }

    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen: { enable: false },
        background: { color: 'transparent', opacity: 0 },
        detectRetina: true,
        fpsLimit: 60,
        
        emitters: emitters,

        particles: {
          number: { value: 0 },
          shape: { type: 'circle' },
          
          size: {
            value: { min: 4, max: 20 },
            animation: {
              enable: true,
              speed: 15,
              minimumValue: 2,
              startValue: 'max',
              destroy: 'min',
              sync: false
            }
          },
          
          move: {
            enable: true,
            speed: { min: 6, max: 14 },
            direction: 'top',
            random: true,
            straight: false,
            outModes: { default: 'destroy' },
            gravity: { enable: true, acceleration: -4 },
            attract: {
              enable: true,
              distance: 250,
              rotate: { x: 800, y: 800 }
            },
            warp: true
          },
          
          color: {
            value: ['#8B0000', '#FF0000', '#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00']
          },
          
          opacity: {
            value: { min: 0, max: 0.95 },
            animation: {
              enable: true,
              speed: 1.5,
              minimumValue: 0,
              startValue: 'max',
              destroy: 'min'
            }
          },
          
          rotate: {
            value: { min: 0, max: 360 },
            animation: { enable: true, speed: 50 }
          },
          
          wobble: {
            enable: true,
            distance: 40,
            speed: { min: 12, max: 28 }
          },
          
          shadow: {
            enable: true,
            color: '#FF6347',
            blur: 15
          }
        }
      }
    });

    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      inst?.destroy();
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.pointerEvents = 'none !important';
    }, 3000);
  }
};
