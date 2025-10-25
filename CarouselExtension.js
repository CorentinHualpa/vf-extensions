/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Carousel – Voiceflow Response Extension                  ║
 *  ║  VERSION 4.0 - DUAL MODE (SHOWCASE + GALLERY)            ║
 *  ║                                                           ║
 *  ║  • Mode "showcase": 1 carte pleine largeur, image 50%    ║
 *  ║  • Mode "gallery": 2-3 cartes côte à côte, image 40%    ║
 *  ║  • Optimisé pour véhicules automobiles                   ║
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
        brandColor2 = null,
        backgroundImage = null,
        autoplay = false,
        autoplayDelay = 3000,
        maxDescriptionLength = 250,
        instanceId = null,
        userMessageText = null,
        displayMode = 'showcase',  // 'showcase' ou 'gallery'
        cardsPerView = 2            // Pour mode gallery: 2 ou 3
      } = trace.payload;
      
      // Validation
      if (!items.length || items.length > 10) {
        console.error('❌ Carousel: 1-10 items requis');
        return;
      }
      
      // Validation du mode
      const validModes = ['showcase', 'gallery'];
      const mode = validModes.includes(displayMode) ? displayMode : 'showcase';
      
      // Pour gallery, limiter cardsPerView entre 2 et 3
      const slidesPerView = mode === 'gallery' ? Math.min(3, Math.max(2, cardsPerView)) : 1;
      
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
      
      // Fix URL Imgur
      const fixImgurUrl = (url) => {
        if (!url) return url;
        return url.replace(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+\.[a-zA-Z]+)$/, 'https://i.imgur.com/$1');
      };
      
      // Couleurs
      const color1 = brandColor;
      const color2 = brandColor2 || lightenColor(brandColor, 0.25);
      const { r: r1, g: g1, b: b1 } = hexToRgb(color1);
      const { r: r2, g: g2, b: b2 } = hexToRgb(color2);
      const lightColor = lightenColor(color1, 0.3);
      const darkColor = darkenColor(color1, 0.2);
      
      // Calcul de la largeur des cartes selon le mode
      const cardWidth = mode === 'showcase' ? '100%' : `${100 / slidesPerView - 2}%`;
      const imageHeight = mode === 'showcase' ? '50%' : '40%';
      
      // Container principal
      const container = document.createElement('div');
      container.className = 'vf-carousel-container';
      container.id = uniqueId;
      container.setAttribute('data-items-count', items.length);
      container.setAttribute('data-has-background', backgroundImage ? 'true' : 'false');
      container.setAttribute('data-display-mode', mode);
      container.setAttribute('data-cards-per-view', slidesPerView);
      
      // CSS
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTENEUR PARENT VOICEFLOW                                */
/* ═══════════════════════════════════════════════════════════ */
.vfrc-message--extension-Carousel {
  padding: 0 !important;
  margin: 12px 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
  box-sizing: border-box !important;
  position: relative !important;
  display: block !important;
}
.vfrc-message--extension-Carousel > span {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  position: relative !important;
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ VARIABLES CSS                                             */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-container {
  --color-1: ${color1};
  --color-2: ${color2};
  --rgb-1: ${r1}, ${g1}, ${b1};
  --rgb-2: ${r2}, ${g2}, ${b2};
  --color-light: ${lightColor};
  --color-dark: ${darkColor};
  --border-radius: 20px;
  --card-radius: 16px;
  --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  --shadow-soft: 0 10px 40px rgba(0, 0, 0, 0.15);
  --shadow-strong: 0 20px 60px rgba(0, 0, 0, 0.3);
  --glow-color: rgba(var(--rgb-1), 0.5);
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTAINER PRINCIPAL - TRANSPARENT PAR DÉFAUT             */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-container {
  position: relative !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 16px !important;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  border-radius: var(--border-radius);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: visible !important;
  box-sizing: border-box !important;
  display: block !important;
  z-index: 1 !important;
  
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

/* Fond dégradé si pas d'image */
.vf-carousel-container[data-has-background="false"]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--border-radius);
  background: linear-gradient(135deg, 
    var(--color-1) 0%, 
    var(--color-2) 100%);
  z-index: -2;
  opacity: 0.1;
}

/* Fond avec image */
.vf-carousel-container[data-has-background="true"]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--border-radius);
  background-image: url('${backgroundImage}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(12px) brightness(0.7);
  transform: scale(1.1);
  z-index: -2;
  opacity: 0.9;
}

/* Overlay */
.vf-carousel-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--border-radius);
  background: linear-gradient(135deg, 
    rgba(var(--rgb-1), 0.05) 0%, 
    rgba(var(--rgb-2), 0.08) 50%, 
    rgba(var(--rgb-1), 0.05) 100%);
  z-index: -1;
}

.vf-carousel-container[data-has-background="true"]::after {
  background: linear-gradient(135deg, 
    rgba(var(--rgb-1), 0.85) 0%, 
    rgba(var(--rgb-2), 0.75) 50%, 
    rgba(var(--rgb-1), 0.85) 100%);
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ TITRE                                                     */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-title {
  position: relative;
  z-index: 2;
  text-align: center;
  margin: 0 0 20px 0;
  padding: 16px 24px;
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.5px;
  line-height: 1.2;
  
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.8) 0%, 
    rgba(0, 0, 0, 0.6) 50%, 
    rgba(0, 0, 0, 0.8) 100%);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px var(--glow-color);
  
  text-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.9),
    0 0 30px var(--glow-color);
}

@media (max-width: 768px) {
  .vf-carousel-title {
    font-size: 20px;
    padding: 14px 20px;
    margin-bottom: 16px;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ VIEWPORT                                                  */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-viewport {
  position: relative;
  overflow: hidden;
  border-radius: var(--card-radius);
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
  
  box-shadow: 
    inset 0 0 30px rgba(255, 255, 255, 0.05),
    0 0 40px var(--glow-color);
}

.vf-carousel-track {
  display: flex;
  gap: 16px;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
  width: 100%;
  box-sizing: border-box;
}

/* Mode gallery: réduire le gap sur mobile */
@media (max-width: 768px) {
  .vf-carousel-container[data-display-mode="gallery"] .vf-carousel-track {
    gap: 12px;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CARTES - MODE SHOWCASE (1 carte pleine largeur)         */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-container[data-display-mode="showcase"] .vf-carousel-card {
  flex: 0 0 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CARTES - MODE GALLERY (2-3 cartes côte à côte)          */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-container[data-display-mode="gallery"][data-cards-per-view="2"] .vf-carousel-card {
  flex: 0 0 calc(50% - 8px) !important;
  min-width: calc(50% - 8px) !important;
  max-width: calc(50% - 8px) !important;
}

.vf-carousel-container[data-display-mode="gallery"][data-cards-per-view="3"] .vf-carousel-card {
  flex: 0 0 calc(33.333% - 11px) !important;
  min-width: calc(33.333% - 11px) !important;
  max-width: calc(33.333% - 11px) !important;
}

/* Sur mobile, gallery = 1 carte */
@media (max-width: 768px) {
  .vf-carousel-container[data-display-mode="gallery"] .vf-carousel-card {
    flex: 0 0 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ STYLES COMMUNS DES CARTES                                */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--card-radius);
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  overflow: hidden;
  transition: var(--transition-bounce);
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.2),
    0 5px 15px rgba(0, 0, 0, 0.1),
    0 0 30px var(--glow-color);
}

@media (min-width: 769px) {
  .vf-carousel-card:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: var(--color-light);
    
    box-shadow: 
      0 25px 60px rgba(0, 0, 0, 0.35),
      0 10px 30px rgba(var(--rgb-1), 0.4),
      0 0 60px var(--glow-color);
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ IMAGE - HAUTEUR SELON LE MODE                            */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-image-container {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
}

/* Mode showcase: image 50% */
.vf-carousel-container[data-display-mode="showcase"] .vf-carousel-image-container {
  padding-bottom: 50%;
}

/* Mode gallery: image 40% */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-image-container {
  padding-bottom: 40%;
}

.vf-carousel-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s ease;
  transform-origin: center center;
}

.vf-carousel-card:hover .vf-carousel-image {
  transform: scale(1.08);
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTENU                                                   */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-content {
  padding: 24px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 14px;
  min-height: 180px;
  position: relative;
  z-index: 2;
  
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(250, 250, 250, 0.98) 100%
  );
}

/* Mode gallery: contenu plus compact */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-content {
  padding: 18px;
  min-height: 140px;
  gap: 10px;
}

@media (max-width: 768px) {
  .vf-carousel-content {
    padding: 18px;
    min-height: 140px;
    gap: 10px;
  }
}

.vf-carousel-card-title {
  font-size: 19px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.3;
  margin: 0;
  
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mode gallery: titre plus petit */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-card-title {
  font-size: 16px;
}

@media (max-width: 768px) {
  .vf-carousel-card-title {
    font-size: 17px;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ DESCRIPTION                                               */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-description {
  font-size: 14px;
  color: #4a4a4a !important;
  line-height: 1.6;
  margin: 0;
  position: relative;
  cursor: help;
  
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mode gallery: moins de lignes */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-description {
  font-size: 13px;
  -webkit-line-clamp: 3;
}

@media (max-width: 768px) {
  .vf-carousel-description {
    font-size: 13px;
    -webkit-line-clamp: 4;
    cursor: default;
  }
}

/* Popup description (desktop seulement) */
@media (min-width: 769px) {
  .vf-carousel-description::before {
    content: attr(data-full-text);
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) translateY(-5px) scale(0.95);
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
    
    border: 2px solid var(--color-1);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.6),
      0 0 40px var(--glow-color);
    
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
  }
  
  .vf-carousel-description:hover::before {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ BOUTON CTA                                                */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-button {
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 14px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition-bounce);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  
  box-shadow: 
    0 6px 20px rgba(var(--rgb-1), 0.4),
    0 0 30px var(--glow-color);
  
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 48px;
}

/* Mode gallery: bouton plus compact */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-button {
  padding: 12px 20px;
  font-size: 13px;
  min-height: 42px;
}

.vf-carousel-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 60%
  );
  transform: translateX(-100%) rotate(45deg);
  transition: transform 0.6s;
}

.vf-carousel-button:hover::before {
  transform: translateX(100%) rotate(45deg);
}

.vf-carousel-button:hover {
  transform: translateY(-2px) scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
  
  box-shadow: 
    0 10px 30px rgba(var(--rgb-1), 0.6),
    0 0 50px var(--glow-color);
}

.vf-carousel-button:active {
  transform: translateY(0) scale(1);
}

@media (max-width: 768px) {
  .vf-carousel-button {
    padding: 12px 20px;
    font-size: 13px;
    min-height: 42px;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTRÔLES NAVIGATION                                      */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  position: relative;
  z-index: 3;
  gap: 16px;
}

/* Masquer si 1 item en showcase, ou si tous visible en gallery */
.vf-carousel-container[data-display-mode="showcase"][data-items-count="1"] .vf-carousel-controls,
.vf-carousel-container[data-display-mode="gallery"][data-items-count="2"][data-cards-per-view="2"] .vf-carousel-controls,
.vf-carousel-container[data-display-mode="gallery"][data-items-count="2"][data-cards-per-view="3"] .vf-carousel-controls,
.vf-carousel-container[data-display-mode="gallery"][data-items-count="3"][data-cards-per-view="3"] .vf-carousel-controls {
  display: none;
}

.vf-carousel-nav-button {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #fff;
  cursor: pointer;
  transition: var(--transition-bounce);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 25px var(--glow-color);
}

.vf-carousel-nav-button:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.15);
  
  box-shadow: 
    0 8px 25px rgba(var(--rgb-1), 0.5),
    0 0 40px var(--glow-color);
}

.vf-carousel-nav-button:active:not(:disabled) {
  transform: scale(1);
}

.vf-carousel-nav-button:disabled {
  opacity: 0.25;
  cursor: not-allowed;
  transform: none;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: none;
}

@media (max-width: 768px) {
  .vf-carousel-nav-button {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ DOTS DE NAVIGATION                                        */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.vf-carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: var(--transition-smooth);
  position: relative;
}

.vf-carousel-dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.2);
}

.vf-carousel-dot.active {
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.4);
  
  box-shadow: 
    0 0 15px var(--glow-color),
    0 0 25px rgba(var(--rgb-1), 0.6);
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ ANIMATIONS                                                */
/* ═══════════════════════════════════════════════════════════ */
@keyframes fadeInUp {
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.vf-carousel-container {
  animation: fadeInUp 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.vf-carousel-card {
  animation: fadeInUp 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-fill-mode: both;
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
      
      const getSlidesPerView = () => slidesPerView;
      const getMaxIndex = () => Math.max(0, items.length - slidesPerView);
      
      // Mise à jour position du carousel
      const updateCarouselPosition = () => {
        const track = container.querySelector('.vf-carousel-track');
        
        if (mode === 'showcase') {
          // Mode showcase: déplacement par carte (100%)
          const translateX = -(currentIndex * 100);
          track.style.transform = `translateX(${translateX}%)`;
        } else {
          // Mode gallery: déplacement par groupes
          const cardWidthPercent = 100 / slidesPerView;
          const translateX = -(currentIndex * cardWidthPercent);
          track.style.transform = `translateX(${translateX}%)`;
        }
        
        // Mise à jour des dots
        const totalDots = mode === 'showcase' ? items.length : Math.ceil(items.length / slidesPerView);
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
        if (autoplay && items.length > slidesPerView) {
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
        
        if (item.url) {
          setTimeout(() => {
            window.open(item.url, '_blank', 'noopener,noreferrer');
          }, 500);
        }
      };
      
      // Construction du HTML
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
            imageContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;color:#ccc;">🚗</div>';
          };
          imageContainer.appendChild(img);
        } else {
          imageContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;color:#ccc;">🚗</div>';
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
      
      // Contrôles (si nécessaire)
      const needsControls = mode === 'showcase' ? items.length > 1 : items.length > slidesPerView;
      
      if (needsControls) {
        const controls = document.createElement('div');
        controls.className = 'vf-carousel-controls';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'vf-carousel-nav-button vf-carousel-prev';
        prevBtn.innerHTML = '‹';
        prevBtn.addEventListener('click', prevSlide);
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'vf-carousel-dots';
        
        const totalDots = mode === 'showcase' ? items.length : Math.ceil(items.length / slidesPerView);
        for (let i = 0; i < totalDots; i++) {
          const dot = document.createElement('button');
          dot.className = 'vf-carousel-dot';
          dot.addEventListener('click', () => goToSlide(i));
          dotsContainer.appendChild(dot);
        }
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'vf-carousel-nav-button vf-carousel-next';
        nextBtn.innerHTML = '›';
        nextBtn.addEventListener('click', nextSlide);
        
        controls.appendChild(prevBtn);
        controls.appendChild(dotsContainer);
        controls.appendChild(nextBtn);
        container.appendChild(controls);
      }
      
      // Support trackpad
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
      
      console.log(`✅ Carousel v4.0 ${mode.toUpperCase()} (ID: ${uniqueId}) - ${items.length} items - ${slidesPerView} par vue`);
      
      // Cleanup
      return () => {
        stopAutoplay();
      };
      
    } catch (error) {
      console.error('❌ Carousel Error:', error);
      element.innerHTML = `<div style="color: #ff4444; padding: 20px; text-align: center;">❌ Erreur Carousel: ${error.message}</div>`;
    }
  }
};
export default CarouselExtension;
