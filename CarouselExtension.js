/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Carousel – Voiceflow Response Extension                  ║
 *  ║                                                           ║
 *  ║  • Navigation: Flèches + Dots                            ║
 *  ║  • Responsive: 3 desktop / 1 mobile                      ║
 *  ║  • Layout adaptatif pour 1-2-3+ cartes                  ║
 *  ║  • Titre personnalisable                                 ║
 *  ║  • Auto-play configurable                                ║
 *  ║  • Images 16:9 centrées sans déformation                ║
 *  ║  • Style ultra moderne avec glassmorphism               ║
 *  ║  • Image de fond avec dégradé stylée                    ║
 *  ║  • Capture automatique de sélection                     ║
 *  ║  • Navigation dans la même fenêtre                      ║
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
        title = null, // ✅ NOUVEAU : Titre personnalisable
        brandColor = '#6366F1',
        backgroundImage = null,
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

      // Fix URL Imgur si nécessaire
      const fixImgurUrl = (url) => {
        if (!url) return url;
        // Convertir imgur.com/ID.ext vers i.imgur.com/ID.ext
        return url.replace(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+\.[a-zA-Z]+)$/, 'https://i.imgur.com/$1');
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

      // CSS ultra stylé avec le titre
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
  border-radius: var(--border-radius);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

/* ═══ IMAGE DE FOND AVEC DÉGRADÉ ═══ */
.vf-carousel-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  ${backgroundImage ? `
    background-image: url('${backgroundImage}');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(8px);
    transform: scale(1.1);
  ` : `
    background: linear-gradient(135deg, 
      rgba(var(--brand-rgb), 0.03) 0%, 
      rgba(var(--brand-rgb), 0.08) 50%, 
      rgba(var(--brand-rgb), 0.03) 100%);
  `}
  z-index: -2;
}

.vf-carousel-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${backgroundImage ? `
    linear-gradient(135deg, 
      rgba(var(--brand-rgb), 0.7) 0%, 
      rgba(var(--brand-rgb), 0.5) 30%, 
      rgba(var(--brand-rgb), 0.3) 60%, 
      rgba(var(--brand-rgb), 0.6) 100%)
  ` : 'transparent'};
  z-index: -1;
}

/* ═══ TITRE PERSONNALISABLE ═══ */
.vf-carousel-title {
  position: relative;
  z-index: 2;
  text-align: center;
  margin: 0 0 32px 0;
  padding: 0 0 20px 0;
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.vf-carousel-title::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, var(--brand-color), var(--brand-light));
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(var(--brand-rgb), 0.5);
}

.vf-carousel-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 1px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1px;
}

/* Animation d'apparition du titre */
@keyframes titleFadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.vf-carousel-title {
  animation: titleFadeIn 0.8s ease-out;
}

/* ═══ VIEWPORT ET TRACK ADAPTATIFS ═══ */
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
  justify-content: flex-start;
}

/* ═══ LAYOUT ADAPTATIF SELON NOMBRE DE CARTES ═══ */
/* 1 carte : centrée */
.vf-carousel-container[data-items-count="1"] .vf-carousel-track {
  justify-content: center;
}

.vf-carousel-container[data-items-count="1"] .vf-carousel-card {
  flex: 0 0 min(400px, 90%);
  max-width: 400px;
}

/* 2 cartes : centrées */
.vf-carousel-container[data-items-count="2"] .vf-carousel-track {
  justify-content: center;
}

.vf-carousel-container[data-items-count="2"] .vf-carousel-card {
  flex: 0 0 min(350px, 45%);
  max-width: 350px;
}

/* 3+ cartes : layout normal */
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
  z-index: 1;
}

.vf-carousel-card:hover::before {
  opacity: 1;
}

/* ═══ IMAGES 16:9 CORRIGÉES ═══ */
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

/* ═══ CONTENU CARTE CORRIGÉ ═══ */
.vf-carousel-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 160px;
  position: relative;
  z-index: 2;
}

.vf-carousel-card-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ DESCRIPTION CORRIGÉE - MAINTENANT VISIBLE */
.vf-carousel-description {
  font-size: 14px;
  color: #ffffff !important;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  opacity: 0.95;
  margin: 0;
  padding: 0;
}

/* ✅ BOUTON CORRIGÉ - CENTRAGE PARFAIT */
.vf-carousel-button {
  background: linear-gradient(135deg, var(--brand-color), var(--brand-light));
  color: white !important;
  border: none;
  padding: 14px 24px;
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
  
  /* ✅ CENTRAGE PARFAIT DU TEXTE */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  min-height: 48px;
  
  /* ✅ EMPÊCHER LE WRAP DU TEXTE */
  white-space: nowrap;
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

/* ═══ CONTRÔLES NAVIGATION ADAPTATIFS ═══ */
.vf-carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  position: relative;
  z-index: 3;
}

/* Masquer les contrôles pour 1-2 cartes sur desktop */
.vf-carousel-container[data-items-count="1"] .vf-carousel-controls,
.vf-carousel-container[data-items-count="2"] .vf-carousel-controls {
  display: none;
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
  z-index: 3;
  position: relative;
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
  
  /* Titre plus petit sur mobile */
  .vf-carousel-title {
    font-size: 22px;
    margin-bottom: 24px;
    padding-bottom: 16px;
  }
  
  .vf-carousel-title::before {
    width: 60px;
    height: 2px;
  }
  
  /* Sur mobile, toujours 1 carte en pleine largeur */
  .vf-carousel-card {
    flex: 0 0 100% !important;
    max-width: none !important;
  }
  
  /* Réafficher les contrôles sur mobile pour 2+ cartes */
  .vf-carousel-container[data-items-count="2"] .vf-carousel-controls {
    display: flex;
  }
  
  .vf-carousel-content {
    padding: 16px;
    min-height: 140px;
  }
  
  .vf-carousel-card-title {
    font-size: 16px;
  }
  
  .vf-carousel-description {
    font-size: 13px !important;
    -webkit-line-clamp: 2;
  }
  
  .vf-carousel-nav-button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .vf-carousel-button {
    padding: 12px 20px;
    font-size: 13px;
    min-height: 44px;
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

      // Calcul des slides visibles selon l'écran ET le nombre d'items
      const getSlidesPerView = () => {
        if (window.innerWidth <= 768) return 1; // Mobile : toujours 1
        if (items.length === 1) return 1;
        if (items.length === 2) return 2;
        return 3; // Desktop 3+ items
      };

      const getMaxIndex = () => {
        const slidesPerView = getSlidesPerView();
        return Math.max(0, items.length - slidesPerView);
      };

      // Mise à jour position du carousel
      const updateCarouselPosition = () => {
        const track = container.querySelector('.vf-carousel-track');
        const slidesPerView = getSlidesPerView();
        
        if (items.length <= 2 && window.innerWidth > 768) {
          // Pour 1-2 cartes sur desktop, pas de translation
          track.style.transform = 'translateX(0)';
        } else {
          const slideWidth = 100 / slidesPerView;
          const translateX = -(currentIndex * slideWidth);
          track.style.transform = `translateX(${translateX}%)`;
        }

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
        if (autoplay && getMaxIndex() > 0) {
          autoplayInterval = setInterval(nextSlide, autoplayDelay);
        }
      };

      const stopAutoplay = () => {
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          autoplayInterval = null;
        }
      };

      // ✅ GESTION DU CLIC AVEC CAPTURE AUTOMATIQUE ET NAVIGATION SAME WINDOW
      const handleCardAction = (item, index) => {
        stopAutoplay();
        
        // ✅ CAPTURE AUTOMATIQUE de la sélection
        const selection = `${item.title || ''} : ${item.description || ''}`;
        
        // Stocker dans window pour accès global
        if (typeof window !== 'undefined') {
          window.voiceflow_carousel_selection = selection;
          
          // Aussi dans localStorage pour persistance
          try {
            localStorage.setItem('voiceflow_carousel_selection', selection);
          } catch (e) {
            console.warn('Cannot access localStorage:', e);
          }
        }
        
        console.log('✅ Carousel selection captured:', selection);
        
        // Interaction Voiceflow
        if (window.voiceflow?.chat?.interact) {
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              carouselAction: 'discover',
              itemIndex: index,
              itemData: item,
              instanceId: uniqueId,
              // ✅ AJOUT DIRECT de la sélection formatée dans le payload
              carrousel_selection: selection
            }
          });
        }

        // ✅ NAVIGATION DANS LA MÊME FENÊTRE (au lieu de nouvel onglet)
        if (item.url) {
          window.location.href = item.url;
        }
      };

      // ✅ AJOUT DU TITRE SI PRÉSENT
      if (title) {
        const titleElement = document.createElement('h1');
        titleElement.className = 'vf-carousel-title';
        titleElement.textContent = title;
        container.appendChild(titleElement);
      }

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
          const fixedImageUrl = fixImgurUrl(item.image);
          const img = document.createElement('img');
          img.className = 'vf-carousel-image';
          img.src = fixedImageUrl;
          img.alt = item.title || 'Carousel item';
          img.loading = 'lazy';

          img.onerror = () => {
            console.warn(`❌ Image failed to load: ${fixedImageUrl}`);
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
          const cardTitle = document.createElement('h3');
          cardTitle.className = 'vf-carousel-card-title';
          cardTitle.textContent = item.title;
          content.appendChild(cardTitle);
        }

        // ✅ DESCRIPTION CORRIGÉE
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

      // Contrôles de navigation (seulement si nécessaire)
      const needsControls = () => {
        if (window.innerWidth <= 768) return items.length > 1;
        return items.length > 3;
      };

      if (needsControls()) {
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
      }

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

      console.log(`✅ Carousel prêt (ID: ${uniqueId}) - ${items.length} items${title ? `, titre: "${title}"` : ''}, autoplay: ${autoplay}${backgroundImage ? ', avec image de fond' : ''}`);

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
