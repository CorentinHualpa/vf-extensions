// flames.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    // Trouver l'avatar du dragon dans le header
    const avatar = document.querySelector('.vfrc-avatar');
    
    let xPct, yPct;
    if (avatar) {
      const r = avatar.getBoundingClientRect();
      xPct = ((r.left + r.width/2) / window.innerWidth) * 100;
      yPct = ((r.top + r.height/2) / window.innerHeight) * 100;
    } else {
      // Fallback si l'avatar n'est pas trouvé
      const header = document.querySelector('.vfrc-header');
      if (header) {
        const r = header.getBoundingClientRect();
        xPct = ((r.left + 40) / window.innerWidth) * 100;
        yPct = ((r.top + r.height/2) / window.innerHeight) * 100;
      } else {
        xPct = 50;
        yPct = 10;
      }
    }

    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        detectRetina: true,
        emitters: [
          {
            // Émetteur principal pour les flammes principales
            direction: 'top',
            life: { count: 1, duration: 1.2 },
            rate: { quantity: 8, delay: 0.05 },
            position: { x: xPct, y: yPct },
            particles: {
              move: {
                speed: { min: 15, max: 30 },
                direction: 'top',
                outModes: { default: 'destroy' },
                gravity: { enable: true, acceleration: -12 }
              }
            }
          },
          {
            // Émetteur secondaire pour les étincelles
            direction: 'top',
            life: { count: 1, duration: 1 },
            rate: { quantity: 15, delay: 0.03 },
            position: { x: xPct, y: yPct },
            particles: {
              move: {
                speed: { min: 8, max: 20 },
                direction: 'top',
                outModes: { default: 'destroy' },
                gravity: { enable: true, acceleration: -8 }
              }
            }
          }
        ],
        particles: {
          number: { value: 0 },
          shape: { 
            type: ['circle', 'triangle'],
            options: {
              triangle: {
                fill: true,
                close: true
              }
            }
          },
          size: {
            value: { min: 3, max: 12 },
            animation: { 
              enable: true, 
              speed: 25, 
              minimumValue: 1, 
              startValue: 'max', 
              destroy: 'min' 
            }
          },
          color: {
            value: ['#FF4500', '#FF6A00', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00']
          },
          opacity: {
            value: { min: 0.4, max: 1 },
            animation: { 
              enable: true, 
              speed: 3, 
              minimumValue: 0, 
              startValue: 'max', 
              destroy: 'min' 
            }
          },
          move: {
            enable: true,
            outModes: { default: 'destroy' },
            gravity: { enable: true, acceleration: -10 },
            angle: { offset: 0, value: 90 },
            attract: { enable: false }
          },
          rotate: {
            value: { min: 0, max: 360 },
            animation: { 
              enable: true, 
              speed: 20,
              sync: false 
            }
          },
          life: {
            duration: {
              value: { min: 0.5, max: 1.5 }
            }
          },
          // Effet de scintillement pour les flammes
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 1
            }
          }
        }
      }
    });

    // Arrêter après 1.5 secondes
    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      inst?.destroy();
    }, 1500);
  }
};
