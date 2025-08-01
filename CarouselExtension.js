/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Carousel – Voiceflow Response Extension                  ║
 *  ║                                                           ║
 *  ║  • Navigation: Flèches + Dots                            ║
 *  ║  • Responsive: 3 desktop / 1 mobile                      ║
 *  ║  • Auto-play configurable                                ║
 *  ║  • Images 16:9 centrées sans déformation                ║
 *  ║  • Style ultra moderne avec glassmorphism               ║
 *  ║  • Branding adaptatif basé sur une couleur              ║
 *  ║  • Support touch/swipe                                   ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const CarouselExtension = {
  name: 'Carousel',
  type: 'response',
  match: ({ trace }) => trace.type === 'ext_carousel' || trace.payload?.name === 'ext_carousel',
  render: ({ trace, element }) => {
    try {
      const {
        items = [],
        brandColor = '#6366F1',
        autoplay = false,
        autoplayDelay = 3000,
        maxDescriptionLength = 120,
        instanceId = null
      } = trace.payload;

      // Validation
      if (!items.length || items.length > 10) {
        console.error('❌ Carousel: 1-10 items requis');
        return;
      }

      // Identifiant unique
      const uniqueId = instanceId || `carousel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Utilitaires couleur
      const hexToRgb = (hex) => {
        const num = parseInt(hex.replace('#', ''), 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      };

      const lightenColor = (hex, percent) => {
        const { r, g, b } = hexToRgb(hex);
        const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
        const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
        const newB = Math.min(255, Math.floor(b + (255 - b) * percent));
        return `#${newR.toString(16).padStart(2,'0')}${newG.toString(16).padStart(2,'0')}${newB.toString(16).padStart(2,'0')}`;
      };

      const darkenColor = (hex, percent) => {
        const { r, g, b } = hexToRgb(hex);
        const newR = Math.floor(r * (1 - percent));
        const newG = Math.floor(g * (1 - percent));
        const newB = Math.floor(b * (1 - percent));
        return `#${newR.toString(16).padStart(2,'0')}${newG.toString(16).padStart(2,'0')}${newB.toString(16).padStart(2,'0')}`;
      };

      // Couleurs dérivées
      const { r: brandR, g: brandG, b: brandB } = hexToRgb(brandColor);
      const lightColor = lightenColor(brandColor, 0.3);
      const darkColor = darkenColor(brandColor, 0.2);

      // Container principal
      const container = document.createElement('div');
      container.className = 'vf-carousel-container';
      container.id = uniqueId;
      container.setAttribute('data-items-count', items.length);

      // CSS ultra stylé
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ═══ VARIABLES CSS ADAPTATIVES ═══ */
.vf-carousel-container {
  --brand-color: ${brandColor};
  --brand-rgb: ${brandR}, ${brandG}, ${brandB};
  --brand-light: ${lightColor};
  --brand-dark: ${darkColor};
  --carousel-gap: 20px;
  --border-radius: 16px;
  --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-base: 0 10px 25px rgba(0, 0, 0, 0.15);
  --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.25);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}

/* ═══ CONTAINER PRINCIPAL ═══ */
.vf-carousel-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, 
    rgba(var(--brand-rgb), 0.03) 0%, 
    rgba(var(--brand-rgb), 0.08) 50%, 
    rgba(var(--brand-rgb), 0.03) 100%);
  border-radius: var(--border-radius);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-base);
}

/* ═══ VIEWPORT ET TRACK ═══ */
.vf-carousel-viewport {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 20px;
}

.vf-carousel-track {
  display: flex;
  gap: var(--carousel-gap);
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

/* ═══ CARTES CAROUSEL ═══ */
.vf-carousel-card {
  flex: 0 0 calc((100% - (var(--carousel-gap) * 2)) / 3);
  background: var(--glass-bg);
  border-radius: var(--border-radius);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
  position: relative;
  box-shadow: var(--shadow-base);
}

.vf-carousel-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-hover);
  border-color: rgba(var(--brand-rgb), 0.4);
}

.vf-carousel-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--brand-color), var(--brand-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.vf-carousel-card:hover::before {
  opacity: 1;
}

/* ═══ IMAGES 16:9 ═══ */
.vf-carousel-image-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
}

.vf-carousel-image {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: translate(-50%, -50%);
  transition: transform 0.4s ease;
}

.vf-carousel-card:hover .vf-carousel-image {
  transform: translate(-50%, -50%) scale(1.05);
}

.vf-carousel-image-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 48px;
  opacity: 0.5;
}

/* ═══ CONTENU CARTE ═══ */
.vf-carousel-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 140px;
}

.vf-carousel-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.vf-carousel-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vf-carousel-button {
  background: linear-gradient(135deg, var(--brand-color), var(--brand-light));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(var(--brand-rgb), 0.3);
}

.vf-carousel-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.vf-carousel-button:hover::before {
  left: 100%;
}

.vf-carousel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--brand-rgb), 0.4);
}

.vf-carousel-button:active {
  transform: translateY(0);
}

/* ═══ CONTRÔLES NAVIGATION ═══ */
.vf-carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.vf-carousel-nav-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  color: #fff;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vf-carousel-nav-button:hover {
  background: rgba(var(--brand-rgb), 0.2);
  border-color: var(--brand-color);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(var(--brand-rgb), 0.2);
}

.vf-carousel-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

/* ═══ DOTS PAGINATION ═══ */
.vf-carousel-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.vf-carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.vf-carousel-dot.active {
  background: var(--brand-color);
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(var(--brand-rgb), 0.5);
}

.vf-carousel-dot:hover:not(.active) {
  background: rgba(var(--brand-rgb), 0.6);
  transform: scale(1.1);
}

/* ═══ RESPONSIVE MOBILE ═══ */
@media (max-width: 768px) {
  .vf-carousel-container {
    padding: 16px;
    --carousel-gap: 0px;
  }
  
  .vf-carousel-card {
    flex: 0 0 100%;
  }
  
  .vf-carousel-content {
    padding: 16px;
    height: 120px;
  }
  
  .vf-carousel-title {
    font-size: 16px;
  }
  
  .vf-carousel-description {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }
  
  .vf-carousel-nav-button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}

/* ═══ ANIMATIONS ═══ */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.vf-carousel-container {
  animation: fadeIn 0.6s ease-out;
}

.vf-carousel-card {
  animation: fadeIn 0.6s ease-out;
  animation-fill-mode: both;
}

.vf-carousel-card:nth-child(1) { animation-delay: 0.1s; }
.vf-carousel-card:nth-child(2) { animation-delay: 0.2s; }
.vf-carousel-card:nth-child(3) { animation-delay: 0.3s; }

/* ═══ LOADING STATE ═══ */
.vf-carousel-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.7);
}

.vf-carousel-loading::after {
  content: '';
  width: 32px;
  height: 32px;
  border: 3px solid rgba(var(--brand-rgb), 0.3);
  border-top: 3px solid var(--brand-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
      `;
      container.appendChild(styleEl);

      // État du carousel
      let currentIndex = 0;
      let autoplayInterval = null;
      let touchStartX = 0;
      let touchEndX = 0;

      // Utilitaire: Troncature du texte
      const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
      };

      // Calcul des slides visibles selon l'écran
      const getSlidesPerView = () => {
        return window.innerWidth <= 768 ? 1 : 3;
      };

      const getMaxIndex = () => {
        const slidesPerView = getSlidesPerView();
        return Math.max(0, items.length - slidesPerView);
      };

      // Mise à jour position du carousel
      const updateCarouselPosition = () => {
        const track = container.querySelector('.vf-carousel-track');
        const slidesPerView = getSlidesPerView();
        const slideWidth = 100 / slidesPerView;
        const translateX = -(currentIndex * slideWidth);
        track.style.transform = `translateX(${translateX}%)`;

        // Mise à jour des dots
        container.querySelectorAll('.vf-carousel-dot').forEach((dot, index) => {
          dot.classList.toggle('active', index === currentIndex);
        });

        // Mise à jour des boutons de navigation
        const prevBtn = container.querySelector('.vf-carousel-prev');
        const nextBtn = container.querySelector('.vf-carousel-next');
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();
      };

      // Navigation
      const goToSlide = (index) => {
        currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
        updateCarouselPosition();
      };

      const nextSlide = () => {
        if (currentIndex < getMaxIndex()) {
          goToSlide(currentIndex + 1);
        } else if (autoplay) {
          goToSlide(0); // Loop pour autoplay
        }
      };

      const prevSlide = () => {
        goToSlide(currentIndex - 1);
      };

      // Autoplay
      const startAutoplay = () => {
        if (autoplay && items.length > getSlidesPerView()) {
          autoplayInterval = setInterval(nextSlide, autoplayDelay);
        }
      };

      const stopAutoplay = () => {
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          autoplayInterval = null;
        }
      };

      // Gestion du clic sur carte/bouton
      const handleCardAction = (item, index) => {
        stopAutoplay();
        
        // Interaction Voiceflow
        if (window.voiceflow?.chat?.interact) {
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              carouselAction: 'discover',
              itemIndex: index,
              itemData: item,
              instanceId: uniqueId
            }
          });
        }

        // Ouverture URL externe
        if (item.url) {
          window.open(item.url, '_blank', 'noopener,noreferrer');
        }
      };

      // Construction du HTML
      const viewport = document.createElement('div');
      viewport.className = 'vf-carousel-viewport';

      const track = document.createElement('div');
      track.className = 'vf-carousel-track';

      // Création des cartes
      items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'vf-carousel-card';
        card.setAttribute('data-index', index);

        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'vf-carousel-image-container';

        if (item.image) {
          const img = document.createElement('img');
          img.className = 'vf-carousel-image';
          img.src = item.image;
          img.alt = item.title || 'Carousel item';
          img.loading = 'lazy';

          img.onerror = () => {
            imageContainer.innerHTML = '<div class="vf-carousel-image-placeholder">🖼️</div>';
          };

          imageContainer.appendChild(img);
        } else {
          imageContainer.innerHTML = '<div class="vf-carousel-image-placeholder">🖼️</div>';
        }

        // Contenu
        const content = document.createElement('div');
        content.className = 'vf-carousel-content';

        if (item.title) {
          const title = document.createElement('h3');
          title.className = 'vf-carousel-title';
          title.textContent = item.title;
          content.appendChild(title);
        }

        if (item.description) {
          const description = document.createElement('p');
          description.className = 'vf-carousel-description';
          description.textContent = truncateText(item.description, maxDescriptionLength);
          content.appendChild(description);
        }

        const button = document.createElement('button');
        button.className = 'vf-carousel-button';
        button.textContent = item.buttonText || 'Découvrir';
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          handleCardAction(item, index);
        });
        content.appendChild(button);

        card.appendChild(imageContainer);
        card.appendChild(content);

        // Clic sur la carte entière
        card.addEventListener('click', () => handleCardAction(item, index));

        track.appendChild(card);
      });

      viewport.appendChild(track);
      container.appendChild(viewport);

      // Contrôles de navigation
      const controls = document.createElement('div');
      controls.className = 'vf-carousel-controls';

      // Bouton précédent
      const prevBtn = document.createElement('button');
      prevBtn.className = 'vf-carousel-nav-button vf-carousel-prev';
      prevBtn.innerHTML = '‹';
      prevBtn.addEventListener('click', prevSlide);

      // Dots
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'vf-carousel-dots';

      const maxDots = getMaxIndex() + 1;
      for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('button');
        dot.className = 'vf-carousel-dot';
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }

      // Bouton suivant
      const nextBtn = document.createElement('button');
      nextBtn.className = 'vf-carousel-nav-button vf-carousel-next';
      nextBtn.innerHTML = '›';
      nextBtn.addEventListener('click', nextSlide);

      controls.appendChild(prevBtn);
      controls.appendChild(dotsContainer);
      controls.appendChild(nextBtn);
      container.appendChild(controls);

      // Support tactile
      let isDragging = false;
      
      track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        stopAutoplay();
      }, { passive: true });

      track.addEventListener('touchmove', (e) => {
        if (!touchStartX) return;
        touchEndX = e.touches[0].clientX;
        isDragging = true;
      }, { passive: true });

      track.addEventListener('touchend', () => {
        if (!isDragging) return;
        
        const touchDiff = touchStartX - touchEndX;
        const threshold = 50;

        if (Math.abs(touchDiff) > threshold) {
          if (touchDiff > 0) {
            nextSlide();
          } else {
            prevSlide();
          }
        }

        touchStartX = 0;
        touchEndX = 0;
        isDragging = false;
        
        if (autoplay) {
          setTimeout(startAutoplay, 2000);
        }
      });

      // Support clavier
      container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
      });

      // Responsive
      const handleResize = () => {
        const oldMaxIndex = getMaxIndex();
        if (currentIndex > oldMaxIndex) {
          currentIndex = oldMaxIndex;
        }
        
        // Reconstruction des dots si nécessaire
        const newMaxDots = getMaxIndex() + 1;
        const currentDots = dotsContainer.children.length;
        
        if (newMaxDots !== currentDots) {
          dotsContainer.innerHTML = '';
          for (let i = 0; i < newMaxDots; i++) {
            const dot = document.createElement('button');
            dot.className = 'vf-carousel-dot';
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
          }
        }
        
        updateCarouselPosition();
      };

      window.addEventListener('resize', handleResize);

      // Pause autoplay au hover
      container.addEventListener('mouseenter', stopAutoplay);
      container.addEventListener('mouseleave', () => {
        if (autoplay) startAutoplay();
      });

      // Initialisation
      updateCarouselPosition();
      if (autoplay) {
        setTimeout(startAutoplay, 1000);
      }

      element.appendChild(container);

      console.log(`✅ Carousel prêt (ID: ${uniqueId}) - ${items.length} items, autoplay: ${autoplay}`);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        stopAutoplay();
      };

    } catch (error) {
      console.error('❌ Carousel Error:', error);
      element.innerHTML = `<div style="color: #ff4444; padding: 20px; text-align: center;">❌ Erreur Carousel: ${error.message}</div>`;
    }
  }
};

export default CarouselExtension;
