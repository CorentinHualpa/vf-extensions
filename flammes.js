// flammes-v2.js (version avancée)
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

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
        background: { color: 'transparent' },
        detectRetina: true,
        
        emitters: {
          direction: 'top',
          life: { count: 1, duration: 1.5 },
          rate: { quantity: 20, delay: 0.03 },
          position: { x: xPct, y: yPct }
        },

        particles: {
          number: { value: 0 },
          shape: { type: 'circle' },
          
          size: {
            value: { min: 2, max: 15 },
            animation: {
              enable: true,
              speed: 30,
              minimumValue: 0.1,
              startValue: 'max',
              destroy: 'min'
            }
          },
          
          move: {
            enable: true,
            direction: 'top',
            outModes: { default: 'destroy' },
            speed: { min: 20, max: 45 },
            gravity: { enable: true, acceleration: -15 },
            trail: {
              enable: true,
              length: 8,
              fillColor: '#000000'
            }
          },
          
          // Dégradé de couleurs encore plus réaliste
          color: {
            value: ['#8B0000', '#FF0000', '#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700']
          },
          
          opacity: {
            value: { min: 0, max: 0.9 },
            animation: {
              enable: true,
              speed: 4,
              minimumValue: 0,
              startValue: 'max',
              destroy: 'min'
            }
          },
          
          // Effet de lueur
          shadow: {
            enable: true,
            color: '#FF6347',
            blur: 15,
            offset: { x: 0, y: 0 }
          },
          
          rotate: {
            value: { min: 0, max: 360 },
            animation: { enable: true, speed: 40 }
          },
          
          wobble: {
            enable: true,
            distance: 20,
            speed: { min: 8, max: 20 }
          }
        }
      }
    });

    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      inst?.destroy();
    }, 1800);
  }
};
