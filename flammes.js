// flammes.js - Extension Voiceflow pour effet de flammes

/* 
═══════════════════════════════════════════════════════════════════
📋 CONFIGURATIONS POSSIBLES POUR LES FLAMMES
═══════════════════════════════════════════════════════════════════

🔥 CONFIGURATION 1 : FLAMMES SUBTILES (Accueil discret)
────────────────────────────────────────────────────────────────
{
  "yOffset": 2,
  "xOffset": 0,
  "duration": 1.5,
  "intensity": "low",
  "spread": 2,
  "numEmitters": 1
}
Effet : Petite flamme centrale, courte durée, idéal pour un accueil doux


🔥 CONFIGURATION 2 : FLAMMES STANDARD (Équilibrées)
────────────────────────────────────────────────────────────────
{
  "yOffset": 4,
  "xOffset": 0,
  "duration": 2.5,
  "intensity": "medium",
  "spread": 3,
  "numEmitters": 3
}
Effet : Configuration par défaut, bon compromis entre discrétion et visibilité


🔥 CONFIGURATION 3 : FLAMMES INTENSES (Spectaculaire)
────────────────────────────────────────────────────────────────
{
  "yOffset": 5,
  "xOffset": 0,
  "duration": 4,
  "intensity": "high",
  "spread": 4,
  "numEmitters": 5
}
Effet : Beaucoup de flammes, longue durée, très impressionnant


🔥 CONFIGURATION 4 : FLAMMES RAPIDES (Explosion courte)
────────────────────────────────────────────────────────────────
{
  "yOffset": 4,
  "xOffset": 0,
  "duration": 1.8,
  "intensity": "high",
  "spread": 4,
  "numEmitters": 5
}
Effet : Beaucoup de flammes mais très rapides, comme une explosion


🔥 CONFIGURATION 5 : FLAMMES LONGUES (Hypnotiques)
────────────────────────────────────────────────────────────────
{
  "yOffset": 3,
  "xOffset": 0,
  "duration": 5,
  "intensity": "medium",
  "spread": 3.5,
  "numEmitters": 4
}
Effet : Durée prolongée, mouvement contemplatif et apaisant


🔥 CONFIGURATION 6 : COLONNE DE FEU (Étroite et intense)
────────────────────────────────────────────────────────────────
{
  "yOffset": 2,
  "xOffset": 0,
  "duration": 3,
  "intensity": "high",
  "spread": 1.5,
  "numEmitters": 2
}
Effet : Flamme fine et concentrée, très puissante visuellement


🔥 CONFIGURATION 7 : NAPPE DE FEU (Large et dispersée)
────────────────────────────────────────────────────────────────
{
  "yOffset": 4,
  "xOffset": 0,
  "duration": 3.5,
  "intensity": "medium",
  "spread": 5,
  "numEmitters": 7
}
Effet : Feu qui s'étend largement, effet de nappe


🔥 CONFIGURATION 8 : FLAMMES BASSES (Sous le logo)
────────────────────────────────────────────────────────────────
{
  "yOffset": 8,
  "xOffset": 0,
  "duration": 3,
  "intensity": "medium",
  "spread": 3,
  "numEmitters": 3
}
Effet : Partent du bas du header, juste sous le logo


🔥 CONFIGURATION 9 : FLAMMES HAUTES (Au-dessus)
────────────────────────────────────────────────────────────────
{
  "yOffset": -2,
  "xOffset": 0,
  "duration": 2.5,
  "intensity": "medium",
  "spread": 3,
  "numEmitters": 3
}
Effet : Partent au-dessus du logo, effet de couronne de feu


🔥 CONFIGURATION 10 : FLAMMES DÉCALÉES GAUCHE
────────────────────────────────────────────────────────────────
{
  "yOffset": 3,
  "xOffset": -5,
  "duration": 2.5,
  "intensity": "medium",
  "spread": 3,
  "numEmitters": 3
}
Effet : Décalage horizontal vers la gauche


🔥 CONFIGURATION 11 : FLAMMES DÉCALÉES DROITE
────────────────────────────────────────────────────────────────
{
  "yOffset": 3,
  "xOffset": 5,
  "duration": 2.5,
  "intensity": "medium",
  "spread": 3,
  "numEmitters": 3
}
Effet : Décalage horizontal vers la droite


🔥 CONFIGURATION 12 : FEU D'ARTIFICE (Ultra spectaculaire)
────────────────────────────────────────────────────────────────
{
  "yOffset": 4,
  "xOffset": 0,
  "duration": 4.5,
  "intensity": "high",
  "spread": 6,
  "numEmitters": 7
}
Effet : Maximum de flammes sur une large zone, effet wow garanti


🔥 CONFIGURATION 13 : FLAMME UNIQUE (Minimaliste)
────────────────────────────────────────────────────────────────
{
  "yOffset": 2,
  "xOffset": 0,
  "duration": 2,
  "intensity": "medium",
  "spread": 0,
  "numEmitters": 1
}
Effet : Une seule flamme centrale, très épuré


🔥 CONFIGURATION 14 : TORCHE OLYMPIQUE (Flamme constante)
────────────────────────────────────────────────────────────────
{
  "yOffset": 3,
  "xOffset": 0,
  "duration": 6,
  "intensity": "low",
  "spread": 2,
  "numEmitters": 2
}
Effet : Flamme douce et constante, comme une torche


🔥 CONFIGURATION 15 : DRAGON'S BREATH (Souffle de dragon)
────────────────────────────────────────────────────────────────
{
  "yOffset": 5,
  "xOffset": 0,
  "duration": 2,
  "intensity": "high",
  "spread": 5,
  "numEmitters": 6
}
Effet : Explosion rapide et large, parfait pour "Evo le dragon"


═══════════════════════════════════════════════════════════════════
📊 GUIDE DES PARAMÈTRES
═══════════════════════════════════════════════════════════════════

yOffset (nombre)
  -10 à 10 : Décalage vertical en %
  • Positif = vers le bas
  • Négatif = vers le haut
  • Recommandé : 2 à 5

xOffset (nombre)
  -10 à 10 : Décalage horizontal en %
  • Positif = vers la droite
  • Négatif = vers la gauche
  • Recommandé : 0 (centré)

duration (nombre)
  1 à 6 : Durée d'émission en secondes
  • Court (1-2s) = explosion rapide
  • Moyen (2.5-3.5s) = équilibré
  • Long (4-6s) = effet contemplatif

intensity (string)
  'low', 'medium', 'high'
  • low : 3 particules/émission, taille max 14px
  • medium : 5 particules/émission, taille max 18px
  • high : 8 particules/émission, taille max 22px

spread (nombre)
  1 à 10 : Largeur de la zone d'émission en %
  • 1-2 = colonne étroite
  • 3-4 = équilibré
  • 5+ = nappe large

numEmitters (nombre)
  1 à 7 : Nombre d'émetteurs de flammes
  • 1 = flamme unique
  • 3 = standard (gauche, centre, droite)
  • 5-7 = effet spectaculaire

═══════════════════════════════════════════════════════════════════
🎯 CONFIGURATIONS RECOMMANDÉES PAR USAGE
═══════════════════════════════════════════════════════════════════

📱 Accueil utilisateur (première visite)
  → Configuration 2 (Standard) ou 3 (Intenses)

🎉 Événement spécial / Promotion
  → Configuration 12 (Feu d'artifice) ou 15 (Dragon's Breath)

💼 Usage professionnel discret
  → Configuration 1 (Subtiles) ou 13 (Unique)

🎮 Gamification / Récompense
  → Configuration 4 (Rapides) ou 6 (Colonne de feu)

🧘 Ambiance zen / Contemplative
  → Configuration 5 (Longues) ou 14 (Torche)

🐉 Thème dragon / Puissance
  → Configuration 3 (Intenses) ou 15 (Dragon's Breath)

═══════════════════════════════════════════════════════════════════
*/
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
