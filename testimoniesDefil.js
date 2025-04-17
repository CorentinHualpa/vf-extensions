export const TestimoniesDefilExtension = {
  name: 'TestimoniesDefil',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_testimonies_defil' ||
    trace.payload?.name === 'ext_testimonies_defil',
  render: ({ trace, element }) => {
    const { images = [] } = trace.payload;

    // 1. Container principal
    const container = document.createElement('div');
    container.className = 'vf-carousel-container';

    // 2. Styles du carrousel
    const style = document.createElement('style');
    style.textContent = `
      .vf-carousel-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        max-width: 400px;
        margin: auto;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .vf-carousel-track {
        display: flex;
        transition: transform 0.5s ease;
      }
      .vf-carousel-track img {
        width: 100%;
        flex-shrink: 0;
      }
      .vf-carousel-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.8);
        border: none;
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
      }
      .vf-carousel-btn.prev { left: 10px; }
      .vf-carousel-btn.next { right: 10px; }
    `;
    container.appendChild(style);

    // 3. Piste d’images
    const track = document.createElement('div');
    track.className = 'vf-carousel-track';
    images.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      track.appendChild(img);
    });
    container.appendChild(track);

    // 4. Boutons de navigation
    const prevBtn = document.createElement('button');
    prevBtn.className = 'vf-carousel-btn prev';
    prevBtn.innerHTML = '&#10094;'; // flèche gauche
    const nextBtn = document.createElement('button');
    nextBtn.className = 'vf-carousel-btn next';
    nextBtn.innerHTML = '&#10095;'; // flèche droite
    container.append(prevBtn, nextBtn);

    // 5. Logique de défilement
    let index = 0;
    const total = images.length;
    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
    prevBtn.onclick = () => { index = (index - 1 + total) % total; update(); };
    nextBtn.onclick = () => { index = (index + 1) % total; update(); };

    // 6. Auto‑play (facultatif)
    let interval = setInterval(() => {
      index = (index + 1) % total;
      update();
    }, 4000);
    container.onmouseover = () => clearInterval(interval);
    container.onmouseout = () => {
      interval = setInterval(() => {
        index = (index + 1) % total;
        update();
      }, 4000);
    };

    // 7. Injection dans le chat
    element.appendChild(container);

    // 8. Nettoyage si nécessaire
    return () => clearInterval(interval);
  },
};
