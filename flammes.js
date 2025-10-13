// flammes-spirale.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    canvas.style.backgroundColor = 'transparent';
    canvas.style.pointerEvents = 'none';

    const avatarImg = document.querySelector('.vfrc-avatar[alt="system agent avatar"]');
    
    let xPct, yPct;
    if (avatarImg) {
      const rect = avatarImg.getBoundingClientRect();
      xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    } else {
      xPct = 50;
      yPct = 10;
    }

    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen: { enable: false },
        background: { color: 'transparent', opacity: 0 },
        detectRetina: true,
        
        emitters: {
          direction: 'none',  // Pas de direction fixe
          life: { count: 1, duration: 1.3 },
          rate: { quantity: 4, delay: 0.06 },
          position: { x: xPct, y: yPct }
        },

        particles: {
          number: { value: 0 },
          shape: { type: 'circle' },
          
          size: {
            value: { min: 3, max: 14 },
            animation: {
              enable: true,
              speed: 18,
              minimumValue: 1,
              startValue: 'max',
              destroy: 'min'
            }
          },
          
          move: {
            enable: true,
            speed: { min: 5, max: 12 },
            direction: 'top',
            random: false,
            straight: false,
            outModes: { default: 'destroy' },
            
            gravity: { enable: true, acceleration: -4 },
            
            // Tourbillon prononcé
            spin: {
              enable: true,
              position: { x: xPct, y: yPct },
              acceleration: 3,
              radius: 25
            },
            
            attract: {
              enable: true,
              distance: 150,
              rotate: { x: 1000, y: 1000 }
            }
          },
          
          color: {
            value: ['#8B0000', '#FF0000', '#FF4500', '#FF8C00', '#FFA500', '#FFD700']
          },
          
          opacity: {
            value: { min: 0, max: 0.9 },
            animation: {
              enable: true,
              speed: 2.5,
              minimumValue: 0,
              startValue: 'max',
              destroy: 'min'
            }
          },
          
          rotate: {
            value: { min: 0, max: 360 },
            animation: { enable: true, speed: 60 }
          },
          
          wobble: {
            enable: true,
            distance: 25,
            speed: { min: 15, max: 30 }
          },
          
          shadow: {
            enable: true,
            color: '#FF4500',
            blur: 12
          }
        }
      }
    });

    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      inst?.destroy();
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }, 1500);
  }
};
