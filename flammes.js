// flammes.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    canvas.style.backgroundColor = 'transparent';
    canvas.style.pointerEvents = 'none';

    // Trouver le logo du dragon
    const avatarImg = document.querySelector('.vfrc-avatar[alt="system agent avatar"]');
    
    let xPct, yPct;
    if (avatarImg) {
      const rect = avatarImg.getBoundingClientRect();
      xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      // AJUSTEMENT : Ajoute un offset vers le bas pour baisser le point de départ
      yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100 + 2; // +2% vers le bas
    } else {
      const header = document.querySelector('.vfrc-header');
      if (header) {
        const rect = header.getBoundingClientRect();
        xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
        yPct = ((rect.bottom - 10) / window.innerHeight) * 100; // Près du bas du header
      } else {
        xPct = 50;
        yPct = 12; // Un peu plus bas que 10
      }
    }

    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen: { enable: false },
        background: { 
          color: 'transparent',
          opacity: 0
        },
        detectRetina: true,
        fpsLimit: 60,
        
        emitters: {
          direction: 'top',
          life: { 
            count: 1, 
            duration: 2.5,    // AUGMENTÉ : 2.5 secondes d'émission (était 1.2)
            delay: 0
          },
          rate: { 
            quantity: 3,
            delay: 0.08
          },
          position: { x: xPct, y: yPct },
          size: { 
            width: 10, 
            height: 10 
          }
        },

        particles: {
          number: { value: 0 },
          shape: { type: 'circle' },
          
          size: {
            value: { min: 4, max: 16 },
            animation: {
              enable: true,
              speed: 15,        // RÉDUIT : les particules durent plus longtemps (était 20)
              minimumValue: 2,
              startValue: 'max',
              destroy: 'min',
              sync: false
            }
          },
          
          move: {
            enable: true,
            speed: { min: 6, max: 12 },  // RÉDUIT : elles montent moins vite (était 8-15)
            direction: 'top',
            random: true,
            straight: false,
            outModes: { 
              default: 'destroy',
              top: 'destroy'
            },
            
            gravity: {
              enable: true,
              acceleration: -4    // RÉDUIT : monte plus lentement (était -5)
            },
            
            attract: {
              enable: true,
              distance: 200,
              rotate: {
                x: 600,
                y: 600
              }
            },
            
            warp: true,
            vibrate: false,
            bounce: false
          },
          
          color: {
            value: ['#8B0000', '#FF0000', '#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00'],
            animation: {
              enable: true,
              speed: 50,
              sync: false
            }
          },
          
          opacity: {
            value: { min: 0, max: 0.95 },
            animation: {
              enable: true,
              speed: 1.5,       // RÉDUIT : l'opacité diminue plus lentement (était 2)
              minimumValue: 0,
              startValue: 'max',
              destroy: 'min',
              sync: false
            }
          },
          
          rotate: {
            value: { min: 0, max: 360 },
            direction: 'random',
            animation: {
              enable: true,
              speed: 50,
              sync: false
            }
          },
          
          wobble: {
            enable: true,
            distance: 30,
            speed: {
              min: 10,
              max: 25
            }
          },
          
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 1
            }
          },
          
          shadow: {
            enable: true,
            color: '#FF6347',
            blur: 10,
            offset: { x: 0, y: 0 }
          },
          
          stroke: { width: 0 },
          collisions: { enable: false }
        },
        
        interactivity: {
          detectsOn: 'canvas',
          events: {
            onClick: { enable: false },
            onHover: { enable: false },
            resize: false
          }
        }
      }
    });

    // AUGMENTÉ : Nettoyer après 3 secondes (était 1.5)
    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      if (inst) {
        inst.destroy();
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 3000);
  }
};
