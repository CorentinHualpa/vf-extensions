// https://corentinhualpa.github.io/vf-extensions/flammes.js

export const FlamesExtension = {
  name: 'Flames',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_flames' || trace.payload?.name === 'ext_flames',
  effect: () => {
    // On initialise tsParticles sur notre canvas existant
    tsParticles.load({
      id: 'confetti-canvas',
      options: {
        fullScreen:  { enable: false },
        background:  { color: 'transparent' },
        detectRetina: true,
        emitters: {
          direction: 'top',
          life:      { count: -1, duration: 0.1 },
          rate:      { quantity: 5, delay: 0.05 },
          size:      { width: 0, height: 0 },
          position:  { x: 50, y: 100 }
        },
        particles: {
          number:   { value: 0 },
          shape:    { type: 'circle' },
          size:     {
            value: { min: 4, max: 7 },
            animation: {
              enable:       true,
              speed:        20,
              minimumValue: 4,
              startValue:   'max',
              destroy:      'min'
            }
          },
          move: {
            enable:    true,
            direction: 'top',
            outModes:  { default: 'destroy' },
            gravity:   { enable: true, acceleration: -10 },
            speed:     { min: 20, max: 40 }
          },
          color:   { value: ['#FFA500','#FF4500','#FFD700'] },
          opacity: {
            value: { min: 0.3, max: 0.7 },
            animation: {
              enable:       true,
              speed:        1,
              minimumValue: 0,
              startValue:   'max',
              destroy:      'min'
            }
          },
          rotate: {
            value: { min: -45, max: 45 },
            animation: { enable: true, speed: 10, sync: false }
          },
          swirl: {
            enable:       true,
            radius:       50,
            acceleration: 30
          }
        },
        interactivity: {
          detectsOn: 'canvas',
          events:    { onClick: { enable: false }, onHover: { enable: false } }
        }
      }
    });
  },
};
