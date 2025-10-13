// flames.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: async () => {
    // 1. Charger le preset fire si ce n'est pas déjà fait
    if (!window.loadFirePreset) {
      // Charger dynamiquement le bundle fire preset
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tsparticles/preset-fire@3/tsparticles.preset.fire.bundle.min.js';
      document.head.appendChild(script);
      
      // Attendre que le script soit chargé
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    // 2. Initialiser le preset
    await loadFirePreset(tsParticles);

    // 3. Trouver la position de l'avatar du dragon
    const avatar = document.querySelector('.vfrc-avatar');
    let xPct = 50; // Valeur par défaut au centre
    let yPct = 10; // Valeur par défaut en haut

    if (avatar) {
      const rect = avatar.getBoundingClientRect();
      xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    }

    // 4. Vérifier/créer le canvas
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
    }

    // 5. Configuration avancée des flammes
    await tsParticles.load({
      id: 'confetti-canvas',
      options: {
        preset: 'fire',
        fullScreen: { enable: false },
        background: {
          color: 'transparent'
        },
        
        // Personnalisation pour faire partir les flammes de l'avatar
        emitters: {
          position: { 
            x: xPct, 
            y: yPct 
          },
          rate: {
            quantity: 15,
            delay: 0.05
          },
          size: {
            width: 5,
            height: 5
          },
          direction: 'top',
          life: {
            count: 1,
            duration: 1.5
          }
        },
        
        // Personnalisation des particules de feu
        particles: {
          number: {
            value: 0
          },
          color: {
            value: ['#ff0000', '#ff4500', '#ff6a00', '#ff8c00', '#ffa500', '#ffd700']
          },
          opacity: {
            value: { min: 0.3, max: 1 },
            animation: {
              enable: true,
              speed: 3,
              minimumValue: 0,
              sync: false,
              startValue: 'max',
              destroy: 'min'
            }
          },
          size: {
            value: { min: 3, max: 10 },
            animation: {
              enable: true,
              speed: 20,
              minimumValue: 1,
              sync: false,
              startValue: 'max',
              destroy: 'min'
            }
          },
          move: {
            enable: true,
            speed: { min: 10, max: 25 },
            direction: 'top',
            outModes: {
              default: 'destroy',
              top: 'destroy'
            },
            gravity: {
              enable: true,
              acceleration: -15
            },
            trail: {
              enable: true,
              length: 3,
              fillColor: {
                value: '#000000'
              }
            }
          },
          life: {
            duration: {
              value: { min: 0.5, max: 1.5 }
            }
          },
          rotate: {
            value: { min: 0, max: 360 },
            direction: 'random',
            animation: {
              enable: true,
              speed: 30,
              sync: false
            }
          }
        }
      }
    });

    // 6. Arrêter l'effet après 2 secondes
    setTimeout(() => {
      const instance = tsParticles.domItem(0);
      if (instance) {
        instance.destroy();
      }
    }, 2000);
  }
};
