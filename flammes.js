// https://corentinhualpa.github.io/vf-extensions/flammes.js

export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: () => {
    const canvas = document.querySelector('#confetti-canvas');
    if (!canvas) return;

    const flame = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    // On fait plusieurs petites impulsions successives
    const bursts = 3;
    for (let i = 0; i < bursts; i++) {
      flame({
        particleCount:  80,
        angle:          90,        // vers le haut
        spread:         30,        // peu dispersé
        startVelocity:  40,        // vitesse initiale
        decay:          0.95,      // s’éteint doucement
        gravity:       -0.15,      // force vers le haut
        drift:          0.02,      // légère dérive latérale
        origin:         { x: 0.5, y: 1 },      // au bas-centre du canvas
        shapes:         ['square'],            // forme “pixel”
        colors: [
          '#FF4500', // orange foncé
          '#FF8C00', // orange vif
          '#FFD700', // jaune or
          '#FF6347', // rouge
        ],
        scalar:         0.6,       // taille un peu plus petite
      });

      // On espace les bursts pour rendre l’animation plus “ronde”
      // Utile si vous appelez FlamesExtension plusieurs fois de suite
      // sinon vous pouvez supprimer ce délai et tout enchaîner d’un coup.
      // Ici on utilise setTimeout pour décaler chaque burst :
      // (il faudra envelopper flame(...) dans un timeout si vous voulez)
    }
  },
};
