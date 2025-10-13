// flammes.js
export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) => trace.type === 'ext_flames',
  effect: ({ trace }) => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !window.tsParticles) return;

    canvas.style.backgroundColor = 'transparent';
    // CORRECTION CRITIQUE : utiliser 'auto' pour le reste de la page, pas 'transparent'
    canvas.style.pointerEvents = 'none';

    // RÉCUPÉRATION DES PARAMÈTRES DU PAYLOAD
    const {
      yOffset = 2,           // Décalage vertical en % (par défaut +2%)
      xOffset = 0,           // Décalage horizontal en % (par défaut 0)
      duration = 2.5,        // Durée d'émission en secondes (par défaut 2.5s)
      intensity = 'medium',  // 'low', 'medium', 'high'
      spread = 3,            // Largeur de la zone d'émission en % (par défaut 3%)
      numEmitters = 3        // Nombre d'émetteurs (par défaut 3)
    } = trace.payload || {};

    // Configuration de l'intensité
    const intensityConfig = {
      low: { quantity: 3, delay: 0.1, maxSize: 14 },
      medium: { quantity: 5, delay: 0.06, maxSize: 18 },
      high: { quantity: 8, delay: 0.04, maxSize: 22 }
    };
    const config = intensityConfig[intensity] || intensityConfig.medium;

    // Trouver le point de départ
    const avatarImg = document.querySelector('.vfrc-avatar[alt="system agent avatar"]');
    
    let xPct, yPct;
    if (avatarImg) {
      const rect = avatarImg.getBoundingClientRect();
      xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100 + xOffset;
      // CORRECTION : Appliquer directement yOffset sans limite
      yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100 + yOffset;
    } else {
      const header = document.querySelector('.vfrc-header');
      if (header) {
        const rect = header.getBoundingClientRect();
        xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100 + xOffset;
        yPct = ((rect.bottom - 10) / window.innerHeight) * 100 + yOffset;
      } else {
        xPct = 50 + xOffset;
        yPct = 12 + yOffset;
      }
    }

    // Création des émetteurs selon la configuration
    const emitters = [];
    
    if (numEmitters === 1) {
      emitters.push({
        direction: 'top',
        life: { count: 1, duration: duration, delay: 0 },
        rate: { quantity: config.quantity, delay: config.delay },
        position: { x: xPct, y: yPct },
        size: { width: 15, height: 15 }
      });
    } else {
      for (let i = 0; i < numEmitters; i++) {
        const offset = (i - Math.floor(numEmitters / 2)) * spread;
        const isCenter = i === Math.floor(numEmitters / 2);
        
        emitters.push({
          direction: 'top',
          life: { 
            count: 1, 
            duration: duration,
            delay: isCenter ? 0 : i * 0.1
          },
          rate: { 
            quantity: isCenter ? config.quantity : Math.floor(config.quantity * 0.6),
            delay: config.delay
          },
          position: { x: xPct + offset, y: yPct },
          size: { width: isCenter ? 15 : 12, height: isCenter ? 15 : 12 }
        });
      }
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
            value: { min: 4, max: config.maxSize },
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
            speed: { min: 6, max: 12 },
            direction: 'top',
            random: true,
            straight: false,
            outModes: { default: 'destroy', top: 'destroy' },
            gravity: { enable: true, acceleration: -4 },
            attract: {
              enable: true,
              distance: 200,
              rotate: { x: 600, y: 600 }
            },
            warp: true
          },
          
          color: {
            value: ['#8B0000', '#FF0000', '#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00'],
            animation: { enable: true, speed: 50, sync: false }
          },
          
          opacity: {
            value: { min: 0, max: 0.95 },
            animation: {
              enable: true,
              speed: 1.5,
              minimumValue: 0,
              startValue: 'max',
              destroy: 'min',
              sync: false
            }
          },
          
          rotate: {
            value: { min: 0, max: 360 },
            direction: 'random',
            animation: { enable: true, speed: 50, sync: false }
          },
          
          wobble: {
            enable: true,
            distance: 35,
            speed: { min: 10, max: 25 }
          },
          
          twinkle: {
            particles: { enable: true, frequency: 0.05, opacity: 1 }
          },
          
          shadow: {
            enable: true,
            color: '#FF6347',
            blur: 12,
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

    const cleanupTime = (duration + 0.5) * 1000;
    setTimeout(() => {
      const inst = tsParticles.domItem(0);
      if (inst) {
        inst.destroy();
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // CORRECTION : Réaffirmer que le canvas ne bloque pas les clics
      canvas.style.pointerEvents = 'none';
    }, cleanupTime);
  }
};
