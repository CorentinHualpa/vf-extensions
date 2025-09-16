/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Carousel – Voiceflow Response Extension                  ║
 *  ║  VERSION 2.0 - COMPATIBLE OVERLAY                         ║
 *  ║                                                           ║
 *  ║  • Auto-détection mode Overlay vs Fullscreen            ║
 *  ║  • Layout adaptatif selon largeur conteneur             ║
 *  ║  • Navigation: Flèches + Dots + Trackpad horizontal     ║
 *  ║  • Responsive: 3 desktop / 1 mobile / 1 overlay         ║
 *  ║  • Popup description UNIQUEMENT sur desktop fullscreen  ║
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
      
      // CSS avec détection overlay
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

/* ═══ DÉTECTION MODE OVERLAY ═══ */
/* Mode overlay = largeur < 450px ou dans conteneur .vfrc-chat--overlay */
.vfrc-chat--overlay .vf-carousel-container,
.vf-carousel-container.overlay-mode {
  --is-overlay: 1;
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
  --is-overlay: 0;
}

/* Mode overlay : réduction des espacements */
.vf-carousel-container[data-overlay="true"],
.vfrc-chat--overlay .vf-carousel-container {
  --carousel-gap: 8px;
  --border-radius: 12px;
  padding: 8px !important;
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

/* ✅ TITRE ADAPTATIF */
.vf-carousel-title {
  position: relative;
  z-index: 2;
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

/* Titre en mode overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-title,
.vfrc-chat--overlay .vf-carousel-title {
  font-size: 18px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

/* ✅ VIEWPORT STABLE */
.vf-carousel-viewport {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
}

.vf-carousel-track {
  display: flex;
  gap: var(--carousel-gap);
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
  justify-content: flex-start;
  width: 100%;
  box-sizing: border-box;
}

/* ═══ LAYOUT ADAPTATIF ═══ */
/* Mode normal : 1-3 cartes selon le nombre */
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

/* ✅ MODE OVERLAY : TOUJOURS 1 CARTE */
.vf-carousel-container[data-overlay="true"] .vf-carousel-card,
.vfrc-chat--overlay .vf-carousel-card {
  flex: 0 0 100% !important;
  max-width: none !important;
}

.vf-carousel-container[data-overlay="true"] .vf-carousel-track,
.vfrc-chat--overlay .vf-carousel-track {
  gap: 0 !important;
}

/* ✅ HOVER DESKTOP UNIQUEMENT (pas en overlay) */
@media (min-width: 769px) {
  .vf-carousel-container:not([data-overlay="true"]) .vf-carousel-card:hover,
  body:not(.vfrc-chat--overlay) .vf-carousel-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 
                0 10px 20px rgba(var(--brand-rgb), 0.2);
    border-color: rgba(var(--brand-rgb), 0.6);
  }
}

/* ═══ IMAGES ═══ */
.vf-carousel-image-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
}

/* Image plus grande en mode overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-image-container,
.vfrc-chat--overlay .vf-carousel-image-container {
  padding-bottom: 50%;
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

/* ✅ CONTENU ADAPTATIF */
.vf-carousel-content {
  padding: 16px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
  min-height: 140px;
  position: relative;
  z-index: 2;
  
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* Contenu optimisé en mode overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-content,
.vfrc-chat--overlay .vf-carousel-content {
  padding: 12px;
  min-height: 100px;
  gap: 6px;
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
}

/* Titre plus petit en overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-card-title,
.vfrc-chat--overlay .vf-carousel-card-title {
  font-size: 14px;
  min-height: 36px;
}

/* ✅ DESCRIPTION */
.vf-carousel-description {
  font-size: 12px;
  color: #ffffff !important;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0.95;
  margin: 0;
  padding: 0;
  align-self: start;
  position: relative;
  cursor: help;
  
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Description optimisée en overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-description,
.vfrc-chat--overlay .vf-carousel-description {
  font-size: 11px;
  -webkit-line-clamp: 2;
  cursor: default;
}

/* ✅ POPUP UNIQUEMENT EN DESKTOP FULLSCREEN */
@media (min-width: 769px) {
  .vf-carousel-container:not([data-overlay="true"]) .vf-carousel-description::before,
  body:not(.vfrc-chat--overlay) .vf-carousel-description::before {
    content: attr(data-full-text);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.95);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.6;
    white-space: normal;
    max-width: 350px;
    min-width: 280px;
    text-align: left;
    z-index: 9999;
    
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(var(--brand-rgb), 0.4);
    
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform: translateX(-50%) translateY(-10px) scale(0.9);
  }
  
  .vf-carousel-container:not([data-overlay="true"]) .vf-carousel-description:hover::before,
  body:not(.vfrc-chat--overlay) .vf-carousel-description:hover::before {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

/* ✅ BOUTON CTA */
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

/* Bouton optimisé en overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-button,
.vfrc-chat--overlay .vf-carousel-button {
  padding: 8px 12px;
  font-size: 11px;
  min-height: 34px;
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

/* Contrôles visibles en overlay si plus d'1 item */
.vf-carousel-container[data-overlay="true"][data-items-count="1"] .vf-carousel-controls,
.vfrc-chat--overlay .vf-carousel-container[data-items-count="1"] .vf-carousel-controls {
  display: none;
}

/* Cache contrôles si pas nécessaire */
.vf-carousel-container[data-items-count="1"]:not([data-overlay="true"]) .vf-carousel-controls,
.vf-carousel-container[data-items-count="2"]:not([data-overlay="true"]) .vf-carousel-controls,
.vf-carousel-container[data-items-count="3"]:not([data-overlay="true"]) .vf-carousel-controls {
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

/* Boutons plus petits en overlay */
.vf-carousel-container[data-overlay="true"] .vf-carousel-nav-button,
.vfrc-chat--overlay .vf-carousel-nav-button {
  width: 32px;
  height: 32px;
  font-size: 14px;
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

/* ═══ RESPONSIVE MOBILE ═══ */
@media (max-width: 768px) {
  .vf-carousel-container {
    padding: 8px !important;
    --carousel-gap: 0px;
  }
  
  .vf-carousel-title {
    font-size: 18px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  
  .vf-carousel-card {
    flex: 0 0 100% !important;
    max-width: none !important;
  }
  
  .vf-carousel-container[data-items-count="2"] .vf-carousel-controls,
  .vf-carousel-container[data-items-count="3"] .vf-carousel-controls {
    display: flex;
  }
  
  .vf-carousel-content {
    padding: 12px;
    min-height: 100px;
  }
  
  .vf-carousel-card-title {
    font-size: 14px;
    min-height: 36px;
  }
  
  .vf-carousel-description {
    font-size: 11px !important;
    -webkit-line-clamp: 2;
  }
  
  .vf-carousel-button {
    padding: 8px 12px;
    font-size: 11px;
    min-height: 34px;
  }
  
  .vf-carousel-nav-button {
    width: 32px;
    height: 32px;
    font-size: 14px;
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
      
      // ✅ DÉTECTION MODE OVERLAY
      const detectOverlayMode = () => {
        // Méthode 1: Vérifier si on est dans .vfrc-chat--overlay
        const isInOverlayClass = container.closest('.vfrc-chat--overlay') !== null;
        
        // Méthode 2: Vérifier la largeur du conteneur parent
        const parentWidth = element.offsetWidth || element.parentElement?.offsetWidth || 0;
        const isNarrow = parentWidth < 450;
        
        // Méthode 3: Vérifier si le chat Voiceflow est en mode widget
        const chatWidget = document.querySelector('.vfrc-chat-widget');
        const isWidget = chatWidget && !chatWidget.classList.contains('vfrc-chat--fullscreen');
        
        return isInOverlayClass || isNarrow || isWidget;
      };
      
      // Appliquer l'attribut overlay
      const isOverlay = detectOverlayMode();
      container.setAttribute('data-overlay', isOverlay.toString());
      
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
      
      // Calcul des slides visibles
      const getSlidesPerView = () => {
        const overlayMode = container.getAttribute('data-overlay') === 'true';
        
        if (overlayMode) return 1; // ✅ Toujours 1 carte en overlay
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
        const overlayMode = container.getAttribute('data-overlay') === 'true';
        
        if (!overlayMode && items.length <= 3 && window.innerWidth > 768) {
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
        
        // Mise à jour des boutons
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
      
      // Gestion du clic
      const handleCardAction = (item, index) => {
        stopAutoplay();
        
        // Simuler un message utilisateur
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
      
      // Construction du HTML
      // Ajout du titre si présent
      if (title) {
        const titleElement = document.createElement('h1');
        titleElement.className = 'vf-carousel-title';
        titleElement.textContent = title;
        container.appendChild(titleElement);
      }
      
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
        
        if (item.description) {
          const description = document.createElement('p');
          description.className = 'vf-carousel-description';
          description.setAttribute('data-full-text', item.description);
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
        
        card.addEventListener('click', () => handleCardAction(item, index));
        track.appendChild(card);
      });
      
      viewport.appendChild(track);
      container.appendChild(viewport);
      
      // Contrôles de navigation
      const needsControls = () => {
        const overlayMode = container.getAttribute('data-overlay') === 'true';
        
        if (overlayMode) return items.length > 1; // ✅ En overlay, contrôles si plus d'1 item
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
      
      // Support trackpad horizontal (sauf en overlay)
      let wheelTimeout;
      container.addEventListener('wheel', (e) => {
        const overlayMode = container.getAttribute('data-overlay') === 'true';
        if (!overlayMode && Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
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
      
      // ✅ Responsive avec détection overlay
      const handleResize = () => {
        // Re-détecter le mode overlay
        const newOverlayMode = detectOverlayMode();
        container.setAttribute('data-overlay', newOverlayMode.toString());
        
        const oldMaxIndex = getMaxIndex();
        if (currentIndex > oldMaxIndex) {
          currentIndex = oldMaxIndex;
        }
        updateCarouselPosition();
      };
      
      window.addEventListener('resize', handleResize);
      
      // Observer les changements de classe sur le chat
      const chatObserver = new MutationObserver(() => {
        handleResize();
      });
      
      const chatElement = document.querySelector('.vfrc-chat');
      if (chatElement) {
        chatObserver.observe(chatElement, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
      
      // Pause autoplay au hover (sauf en overlay)
      container.addEventListener('mouseenter', () => {
        const overlayMode = container.getAttribute('data-overlay') === 'true';
        if (!overlayMode) stopAutoplay();
      });
      
      container.addEventListener('mouseleave', () => {
        const overlayMode = container.getAttribute('data-overlay') === 'true';
        if (autoplay && !overlayMode) startAutoplay();
      });
      
      // Initialisation
      updateCarouselPosition();
      
      if (autoplay) {
        setTimeout(startAutoplay, 1000);
      }
      
      element.appendChild(container);
      
      const modeText = isOverlay ? 'OVERLAY' : 'FULLSCREEN';
      console.log(`✅ Carousel ${modeText} (ID: ${uniqueId}) - ${items.length} items${title ? `, titre: "${title}"` : ''}`);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chatObserver) chatObserver.disconnect();
        stopAutoplay();
      };
      
    } catch (error) {
      console.error('❌ Carousel Error:', error);
      element.innerHTML = `<div style="color: #ff4444; padding: 20px; text-align: center;">❌ Erreur Carousel: ${error.message}</div>`;
    }
  }
};

export default CarouselExtension;
