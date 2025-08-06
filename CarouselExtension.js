/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Carousel – Voiceflow Response Extension                  ║
 *  ║                                                           ║
 *  ║  • Navigation: Flèches + Dots + Trackpad horizontal      ║
 *  ║  • Responsive: 3 desktop / 1 mobile                      ║
 *  ║  • Layout adaptatif pour 1-2-3+ cartes                  ║
 *  ║  • Titre personnalisable visible                         ║
 *  ║  • Zoom équilibré format 4:3 dans le widget             ║
 *  ║  • Fini les glitchs et vibrations                        ║
 *  ║  • Auto-play configurable                                ║
 *  ║  • Images 16:9 centrées sans déformation                ║
 *  ║  • Style ultra moderne avec glassmorphism               ║
 *  ║  • Support touch/swipe + trackpad horizontal            ║
 *  ║  • Simulation de message utilisateur au clic            ║
 *  ║  • Ouverture liens en nouvel onglet                     ║
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
        title = null,
        brandColor = '#6366F1',
        backgroundImage = null,
        autoplay = false,
        autoplayDelay = 3000,
        maxDescriptionLength = 120,
        instanceId = null,
        userMessageText = null
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

      // CSS avec zoom équilibré format 4:3
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ✅ STYLES POUR CONTENEUR PARENT VOICEFLOW */
.vfrc-message--extension-Carousel {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
  box-sizing: border-box !important;
}

.vfrc-message--extension-Carousel > span {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

/* ═══ VARIABLES CSS ADAPTATIVES ═══ */
.vf-carousel-container {
  --brand-color: ${brandColor};
  --brand-rgb: ${brandR}, ${brandG}, ${brandB};
  --brand-light: ${lightColor};
  --brand-dark: ${darkColor};
  --carousel-gap: 12px;
  --border-radius: 16px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-base: 0 10px 25px rgba(0, 0, 0, 0.15);
  --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.25);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}

/* ═══ CONTAINER PRINCIPAL ═══ */
.vf-carousel-container {
  position: relative;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 12px !important;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  border-radius: var(--border-radius);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-base);
  overflow: visible !important;
  box-sizing: border-box !important;
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

/* ✅ TITRE AVEC Z-INDEX ÉLEVÉ POUR RESTER AU-DESSUS */
.vf-carousel-title {
  position: relative;
  z-index: 1000; /* ✅ Au-dessus des cartes zoomées */
  text-align: center;
  margin: 0 0 20px 0;
  padding: 16px 24px;
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9);
  letter-spacing: -0.5px;
  line-height: 1.2;
  
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.7) 0%, 
    rgba(0, 0, 0, 0.5) 50%, 
    rgba(0, 0, 0, 0.7) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.vf-carousel-title::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, var(--brand-color), var(--brand-light));
  border-radius: 2px;
  box-shadow: 0 0 15px rgba(var(--brand-rgb), 0.8);
}

.vf-carousel-title::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 1px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes titleFadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-20px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.vf-carousel-title {
  animation: titleFadeIn 0.8s ease-out;
}

/* ✅ VIEWPORT AVEC ESPACE POUR LE ZOOM */
.vf-carousel-viewport {
  position: relative;
  overflow: visible;
  border-radius: 12px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 30px 10px; /* ✅ Espace modéré pour le zoom */
}

.vf-carousel-track {
  display: flex;
  gap: var(--carousel-gap);
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
  justify-content: flex-start;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

/* ═══ LAYOUT ADAPTATIF SELON NOMBRE DE CARTES ═══ */
.vf-carousel-container[data-items-count="1"] .vf-carousel-track {
  justify-content: center;
}

.vf-carousel-container[data-items-count="1"] .vf-carousel-card {
  flex: 0 0 min(360px, 85%);
  max-width: 360px;
}

.vf-carousel-container[data-items-count="2"] .vf-carousel-track {
  justify-content: center;
}

.vf-carousel-container[data-items-count="2"] .vf-carousel-card {
  flex: 0 0 min(300px, 42%);
  max-width: 300px;
}

/* ✅ CARTES AVEC ZOOM ÉQUILIBRÉ FORMAT 4:3 */
.vf-carousel-card {
  flex: 0 0 calc((100% - (var(--carousel-gap) * 2)) / 3);
  min-width: 0;
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
  box-sizing: border-box;
  z-index: 1;
}

/* ✅ ZOOM ÉQUILIBRÉ DANS LE WIDGET FORMAT 4:3 */
.vf-carousel-card:hover {
  /* ✅ Position absolue DANS le track */
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  
  /* ✅ ZOOM MODÉRÉ */
  transform: translate(-50%, -50%) scale(1.15) !important; /* ✅ Zoom plus raisonnable */
  
  /* ✅ FORMAT 4:3 */
  width: 320px !important; /* ✅ Largeur raisonnable */
  aspect-ratio: 4/3 !important; /* ✅ Ratio 4:3 */
  height: 240px !important; /* ✅ Hauteur calculée pour 4:3 */
  
  /* ✅ Z-INDEX MODÉRÉ */
  z-index: 100 !important; /* ✅ Au-dessus des autres cartes mais sous le titre */
  
  /* ✅ OMBRES ÉLÉGANTES */
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 
              0 15px 25px rgba(var(--brand-rgb), 0.3),
              0 0 0 2px rgba(var(--brand-rgb), 0.4) !important;
  
  border-color: rgba(var(--brand-rgb), 0.8) !important;
}

/* ✅ ZONE DE SURVOL ÉLARGIE POUR ÉVITER LES GLITCHS */
.vf-carousel-card::after {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  pointer-events: auto;
  z-index: 1;
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
  z-index: 2;
}

.vf-carousel-card:hover::before {
  opacity: 1;
}

/* ═══ IMAGES AVEC ADAPTATION AU FORMAT 4:3 ═══ */
.vf-carousel-image-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 par défaut */
  overflow: hidden;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  transition: var(--transition);
}

/* ✅ ADAPTATION POUR LE FORMAT 4:3 AU SURVOL */
.vf-carousel-card:hover .vf-carousel-image-container {
  padding-bottom: 50% !important; /* ✅ Ratio pour s'adapter au format 4:3 */
}

.vf-carousel-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: var(--transition);
  transform-origin: center center;
}

.vf-carousel-card:hover .vf-carousel-image {
  transform: scale(1.02); /* ✅ Zoom très subtil */
}

.vf-carousel-image-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 40px;
  opacity: 0.5;
}

/* ✅ CONTENU ADAPTÉ AU FORMAT 4:3 */
.vf-carousel-content {
  padding: 16px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
  min-height: 140px;
  position: relative;
  z-index: 2;
  transition: var(--transition);
  
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.vf-carousel-card:hover .vf-carousel-content {
  min-height: 120px !important; /* ✅ Adapté au format 4:3 */
  gap: 10px !important;
  padding: 18px !important;
}

.vf-carousel-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 41.6px;
  align-self: start;
  transition: var(--transition);
}

.vf-carousel-card:hover .vf-carousel-card-title {
  font-size: 17px !important;
  -webkit-line-clamp: 3 !important; /* ✅ Limité pour le format 4:3 */
}

/* ✅ DESCRIPTION ADAPTÉE AU FORMAT 4:3 */
.vf-carousel-description {
  font-size: 12px;
  color: #ffffff !important;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0.95;
  margin: 0;
  padding: 0;
  align-self: start;
  transition: var(--transition);
  
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vf-carousel-card:hover .vf-carousel-description {
  font-size: 13px !important;
  -webkit-line-clamp: 4 !important; /* ✅ Limité mais lisible pour le format 4:3 */
  line-height: 1.5 !important;
}

.vf-carousel-button {
  background: linear-gradient(135deg, var(--brand-color), var(--brand-light));
  color: white !important;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(var(--brand-rgb), 0.3);
  
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  min-height: 40px;
  white-space: nowrap;
  align-self: end;
}

.vf-carousel-card:hover .vf-carousel-button {
  font-size: 13px !important;
  padding: 12px 20px !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 16px rgba(var(--brand-rgb), 0.4) !important;
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

.vf-carousel-button:active {
  transform: translateY(0);
}

/* ═══ CONTRÔLES NAVIGATION ═══ */
.vf-carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  position: relative;
  z-index: 3;
}

.vf-carousel-container[data-items-count="1"] .vf-carousel-controls,
.vf-carousel-container[data-items-count="2"] .vf-carousel-controls {
  display: none;
}

.vf-carousel-nav-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 3;
  position: relative;
  font-weight: bold;
}

.vf-carousel-nav-button:hover {
  background: rgba(var(--brand-rgb), 0.8);
  border-color: var(--brand-color);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(var(--brand-rgb), 0.4);
}

.vf-carousel-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  background: rgba(0, 0, 0, 0.3);
}

.vf-carousel-nav-button:disabled:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vf-carousel-dots {
  display: flex;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

.vf-carousel-dot {
  width: 7px;
  height: 7px;
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
    padding: 8px !important;
    --carousel-gap: 0px;
  }
  
  .vf-carousel-title {
    font-size: 20px;
    padding: 14px 20px;
    margin-bottom: 16px;
  }
  
  .vf-carousel-title::before {
    width: 60px;
    height: 2px;
    bottom: -6px;
  }
  
  .vf-carousel-title::after {
    width: 30px;
    bottom: -9px;
  }
  
  .vf-carousel-card {
    flex: 0 0 100% !important;
    max-width: none !important;
  }
  
  .vf-carousel-card:hover {
    transform: translate(-50%, -50%) scale(1.1) !important;
    width: 280px !important; /* ✅ Plus petit sur mobile */
    height: 210px !important; /* ✅ 4:3 ratio */
  }
  
  .vf-carousel-card:hover .vf-carousel-content {
    min-height: 100px !important;
  }
  
  .vf-carousel-card:hover .vf-carousel-description {
    -webkit-line-clamp: 3 !important;
  }
  
  .vf-carousel-container[data-items-count="2"] .vf-carousel-controls {
    display: flex;
  }
  
  .vf-carousel-content {
    padding: 12px;
    min-height: 120px;
  }
  
  .vf-carousel-card-title {
    font-size: 14px;
    min-height: 36.4px;
  }
  
  .vf-carousel-description {
    font-size: 11px !important;
    -webkit-line-clamp: 2;
  }
  
  .vf-carousel-nav-button {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .vf-carousel-button {
    padding: 8px 14px;
    font-size: 11px;
    min-height: 36px;
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

      // Calcul des slides visibles selon l'écran ET le nombre d'items
      const getSlidesPerView = () => {
        if (window.innerWidth <= 768) return 1;
        if (items.length === 1) return 1;
        if (items.length === 2) return 2;
        return 3;
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
          goToSlide(0);
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

      // Gestion du clic avec simulation de message utilisateur + nouvel onglet
      const handleCardAction = (item, index) => {
        stopAutoplay();
        
        // Simuler un message utilisateur dans le chat
        if (window.voiceflow?.chat?.interact) {
          let messageText = '';
          
          if (item.userMessageText) {
            messageText = item.userMessageText;
          } else if (userMessageText) {
            messageText = userMessageText.replace('{title}', item.title || 'Item').replace('{index}', index + 1);
          } else {
            messageText = item.title || item.buttonText || `Item ${index + 1}`;
          }

          window.voiceflow.chat.interact({
            type: 'text',
            payload: messageText
          });

          console.log(`✅ Message utilisateur simulé: "${messageText}"`);
        }

        // Ouverture en nouvel onglet
        if (item.url) {
          setTimeout(() => {
            window.open(item.url, '_blank', 'noopener,noreferrer');
          }, 500);
        }
      };

      // Ajout du titre si présent
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

        // Description complète
        if (item.description) {
          const description = document.createElement('p');
          description.className = 'vf-carousel-description';
          description.textContent = item.description;
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

      // Support trackpad horizontal
      let wheelTimeout;
      container.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
          e.preventDefault();
          stopAutoplay();
          
          clearTimeout(wheelTimeout);
          
          if (e.deltaX > 10) {
            nextSlide();
          } else if (e.deltaX < -10) {
            prevSlide();
          }
          
          if (autoplay) {
            wheelTimeout = setTimeout(startAutoplay, 2000);
          }
        }
      }, { passive: false });

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

      console.log(`✅ Carousel équilibré format 4:3 (ID: ${uniqueId}) - ${items.length} items${title ? `, titre: "${title}"` : ''}`);

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
