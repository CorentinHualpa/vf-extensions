/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Carousel – Voiceflow Response Extension                  ║
 *  ║  VERSION 4.4 - CORRECTION MOBILE                          ║
 *  ║                                                           ║
 *  ║  • Choix automatique showcase (1-2 items) / gallery (3+) ║
 *  ║  • Thème clair ou sombre configurable                    ║
 *  ║  • Affichage mobile optimisé (1 carte en plein écran)    ║
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
        brandColor = '#C3002F',
        brandColor2 = null,
        backgroundImage = null,
        autoplay = false,
        autoplayDelay = 3000,
        maxDescriptionLength = 250,
        instanceId = null,
        userMessageText = null,
        displayMode = null,
        cardsPerView = null,
        theme = 'light'
      } = trace.payload;
      
      // Validation
      if (!items.length || items.length > 10) {
        console.error('❌ Carousel: 1-10 items requis');
        return;
      }
      
      // ✅ CHOIX AUTOMATIQUE DU MODE selon le nombre d'items
      let mode = displayMode;
      let slidesPerView = cardsPerView;
      
      if (!mode || !slidesPerView) {
        if (items.length <= 2) {
          mode = 'showcase';
          slidesPerView = 1;
        } else if (items.length <= 4) {
          mode = 'gallery';
          slidesPerView = 2;
        } else {
          mode = 'gallery';
          slidesPerView = 3;
        }
      }
      
      // Validation du mode
      const validModes = ['showcase', 'gallery'];
      mode = validModes.includes(mode) ? mode : 'showcase';
      slidesPerView = mode === 'gallery' ? Math.min(3, Math.max(2, slidesPerView)) : 1;
      
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
      const color2 = brandColor2 || darkenColor(brandColor, 0.3);
      const { r: r1, g: g1, b: b1 } = hexToRgb(color1);
      const { r: r2, g: g2, b: b2 } = hexToRgb(color2);
      const lightColor = lightenColor(color1, 0.3);
      const darkColor = darkenColor(color1, 0.2);
      
      // ✅ VARIABLES DE THÈME
      const themeVars = theme === 'light' ? {
        // MODE CLAIR
        containerBg: 'rgba(255, 255, 255, 0.98)',
        containerBorder: 'rgba(0, 0, 0, 0.08)',
        containerShadow: '0 15px 50px rgba(0, 0, 0, 0.08)',
        overlayBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
        backgroundOpacity: '0.15',
        backgroundBrightness: '1.1',
        imageBackgroundOpacity: '0.3',
        
        titleBg: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a1a1a',
        titleBorder: 'rgba(0, 0, 0, 0.1)',
        titleShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        titleTextShadow: 'none',
        
        navBtnBg: 'rgba(255, 255, 255, 0.95)',
        navBtnBorder: 'rgba(0, 0, 0, 0.15)',
        navBtnColor: color1,
        navBtnHoverBg: color1,
        navBtnHoverColor: '#ffffff',
        navBtnShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        
        dotBg: 'rgba(0, 0, 0, 0.2)',
        dotBorder: 'rgba(0, 0, 0, 0.3)',
        dotHoverBg: 'rgba(0, 0, 0, 0.4)',
        dotActiveBg: color1,
        dotActiveBorder: color1,
        dotGlow: `0 0 15px rgba(${r1}, ${g1}, ${b1}, 0.5)`
      } : {
        // MODE SOMBRE
        containerBg: 'rgba(0, 0, 0, 0.3)',
        containerBorder: 'rgba(255, 255, 255, 0.1)',
        containerShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
        overlayBg: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.3) 100%)',
        backgroundOpacity: '1',
        backgroundBrightness: '0.7',
        imageBackgroundOpacity: '0.9',
        
        titleBg: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#ffffff',
        titleBorder: 'rgba(255, 255, 255, 0.2)',
        titleShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        titleTextShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
        
        navBtnBg: 'rgba(0, 0, 0, 0.6)',
        navBtnBorder: 'rgba(255, 255, 255, 0.8)',
        navBtnColor: '#fff',
        navBtnHoverBg: 'rgba(255, 255, 255, 0.9)',
        navBtnHoverColor: color1,
        navBtnShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        
        dotBg: 'rgba(255, 255, 255, 0.3)',
        dotBorder: 'rgba(255, 255, 255, 0.6)',
        dotHoverBg: 'rgba(255, 255, 255, 0.6)',
        dotActiveBg: 'rgba(255, 255, 255, 0.95)',
        dotActiveBorder: 'rgba(255, 255, 255, 1)',
        dotGlow: '0 0 15px rgba(255, 255, 255, 0.5)'
      };
      
      // Container principal
      const container = document.createElement('div');
      container.className = 'vf-carousel-container';
      container.id = uniqueId;
      container.setAttribute('data-items-count', items.length);
      container.setAttribute('data-has-background', backgroundImage ? 'true' : 'false');
      container.setAttribute('data-display-mode', mode);
      container.setAttribute('data-cards-per-view', slidesPerView);
      container.setAttribute('data-theme', theme);
      
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
/* ✅ CONTAINER PRINCIPAL                                       */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-container {
  position: relative !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 20px !important;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  border-radius: var(--border-radius);
  overflow: visible !important;
  box-sizing: border-box !important;
  display: block !important;
  z-index: 1 !important;
  
  box-shadow: ${themeVars.containerShadow}, 0 0 0 1px ${themeVars.containerBorder};
}

@media (max-width: 768px) {
  .vf-carousel-container {
    padding: 12px !important;
    border-radius: 16px;
  }
}

/* ✅ Fond avec dégradé (si pas d'image) */
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
  opacity: ${themeVars.backgroundOpacity};
}
/* ✅ Fond avec image personnalisée */
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
  filter: blur(12px) brightness(${themeVars.backgroundBrightness});
  transform: scale(1.1);
  z-index: -2;
  opacity: ${themeVars.imageBackgroundOpacity};
}
/* ✅ Overlay */
.vf-carousel-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--border-radius);
  background: ${themeVars.overlayBg};
  z-index: -1;
}

@media (max-width: 768px) {
  .vf-carousel-container[data-has-background="false"]::before,
  .vf-carousel-container[data-has-background="true"]::before,
  .vf-carousel-container::after {
    border-radius: 16px;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ TITRE STYLÉ                                               */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-title {
  position: relative;
  z-index: 2;
  text-align: center;
  margin: 0 0 20px 0;
  padding: 16px 24px;
  font-size: 22px;
  font-weight: 900;
  color: ${themeVars.titleColor};
  letter-spacing: -0.3px;
  line-height: 1.2;
  
  background: ${themeVars.titleBg};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 2px solid ${themeVars.titleBorder};
  
  box-shadow: 
    ${themeVars.titleShadow},
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  text-shadow: ${themeVars.titleTextShadow};
}
@media (max-width: 768px) {
  .vf-carousel-title {
    font-size: 16px;
    padding: 12px 16px;
    margin-bottom: 12px;
    border-radius: 10px;
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
}

@media (max-width: 768px) {
  .vf-carousel-viewport {
    border-radius: 12px;
    margin-bottom: 12px;
  }
}

.vf-carousel-track {
  display: flex;
  gap: 16px;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
  width: 100%;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  .vf-carousel-track {
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

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CORRECTION MOBILE - TOUJOURS 1 CARTE EN PLEIN ÉCRAN      */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  /* Force 1 carte en plein écran sur mobile, quelle que soit la config */
  .vf-carousel-container[data-display-mode="showcase"] .vf-carousel-card,
  .vf-carousel-container[data-display-mode="gallery"] .vf-carousel-card,
  .vf-carousel-container[data-display-mode="gallery"][data-cards-per-view="2"] .vf-carousel-card,
  .vf-carousel-container[data-display-mode="gallery"][data-cards-per-view="3"] .vf-carousel-card,
  .vf-carousel-card {
    flex: 0 0 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ STYLES COMMUNS DES CARTES                                */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: var(--card-radius);
  border: 2px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  transition: var(--transition-bounce);
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 5px 15px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .vf-carousel-card {
    border-radius: 12px;
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.25),
      0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

@media (min-width: 769px) {
  .vf-carousel-card:hover {
    transform: translateY(-6px) scale(1.01);
    border-color: rgba(255, 255, 255, 0.6);
    
    box-shadow: 
      0 20px 50px rgba(0, 0, 0, 0.4),
      0 10px 25px rgba(0, 0, 0, 0.3);
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
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
}
/* Mode showcase: image 50% */
.vf-carousel-container[data-display-mode="showcase"] .vf-carousel-image-container {
  padding-bottom: 50%;
}
/* Mode gallery: image 45% */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-image-container {
  padding-bottom: 45%;
}

@media (max-width: 768px) {
  .vf-carousel-image-container {
    padding-bottom: 60% !important;
  }
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

@media (min-width: 769px) {
  .vf-carousel-card:hover .vf-carousel-image {
    transform: scale(1.08);
  }
}
/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTENU                                                   */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-content {
  padding: 20px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  min-height: 160px;
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.98);
}
/* Mode gallery: contenu plus compact */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-content {
  padding: 16px;
  min-height: 130px;
  gap: 10px;
}
@media (max-width: 768px) {
  .vf-carousel-content {
    padding: 16px;
    min-height: 140px;
    gap: 10px;
  }
}
.vf-carousel-card-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.3;
  margin: 0;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-card-title {
  font-size: 15px;
}
@media (max-width: 768px) {
  .vf-carousel-card-title {
    font-size: 16px;
  }
}
/* ═══════════════════════════════════════════════════════════ */
/* ✅ DESCRIPTION                                               */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-description {
  font-size: 13px;
  color: #555 !important;
  line-height: 1.5;
  margin: 0;
  
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Showcase: 5 lignes */
.vf-carousel-container[data-display-mode="showcase"] .vf-carousel-description {
  -webkit-line-clamp: 5;
  font-size: 14px;
}
/* Gallery: 3 lignes */
.vf-carousel-container[data-display-mode="gallery"] .vf-carousel-description {
  -webkit-line-clamp: 3;
  font-size: 12px;
}
@media (max-width: 768px) {
  .vf-carousel-description {
    font-size: 13px;
    -webkit-line-clamp: 3;
  }
}
/* ═══════════════════════════════════════════════════════════ */
/* ✅ BOUTON CTA                                                */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-button {
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  color: white !important;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition-smooth);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  
  box-shadow: 
    0 4px 15px rgba(var(--rgb-1), 0.4);
  
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 44px;
}

@media (min-width: 769px) {
  .vf-carousel-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--rgb-1), 0.6);
  }
}

.vf-carousel-button:active {
  transform: translateY(0);
}
@media (max-width: 768px) {
  .vf-carousel-button {
    padding: 12px 18px;
    font-size: 13px;
    min-height: 46px;
    border-radius: 10px;
  }
}
/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTRÔLES NAVIGATION                                      */
/* ═══════════════════════════════════════════════════════════ */
.vf-carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  position: relative;
  z-index: 3;
  gap: 16px;
}

@media (max-width: 768px) {
  .vf-carousel-controls {
    margin-top: 12px;
    gap: 12px;
  }
}

/* Masquer si pas nécessaire */
.vf-carousel-container[data-display-mode="showcase"][data-items-count="1"] .vf-carousel-controls,
.vf-carousel-container[data-display-mode="gallery"][data-items-count="2"][data-cards-per-view="2"] .vf-carousel-controls,
.vf-carousel-container[data-display-mode="gallery"][data-items-count="3"][data-cards-per-view="3"] .vf-carousel-controls {
  display: none;
}

/* Sur mobile, toujours afficher les contrôles si plus d'1 item */
@media (max-width: 768px) {
  .vf-carousel-container[data-items-count="1"] .vf-carousel-controls {
    display: none !important;
  }
  
  .vf-carousel-container:not([data-items-count="1"]) .vf-carousel-controls {
    display: flex !important;
  }
}

.vf-carousel-nav-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid ${themeVars.navBtnBorder};
  background: ${themeVars.navBtnBg};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: ${themeVars.navBtnColor};
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  
  box-shadow: ${themeVars.navBtnShadow};
}

@media (min-width: 769px) {
  .vf-carousel-nav-button:hover:not(:disabled) {
    background: ${themeVars.navBtnHoverBg};
    color: ${themeVars.navBtnHoverColor};
    border-color: ${themeVars.navBtnHoverBg};
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }
}

.vf-carousel-nav-button:active:not(:disabled) {
  transform: scale(1);
}
.vf-carousel-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}
@media (max-width: 768px) {
  .vf-carousel-nav-button {
    width: 42px;
    height: 42px;
    font-size: 20px;
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

@media (max-width: 768px) {
  .vf-carousel-dots {
    gap: 10px;
  }
}

.vf-carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid ${themeVars.dotBorder};
  background: ${themeVars.dotBg};
  cursor: pointer;
  transition: var(--transition-smooth);
}

@media (max-width: 768px) {
  .vf-carousel-dot {
    width: 11px;
    height: 11px;
  }
}

.vf-carousel-dot:hover {
  background: ${themeVars.dotHoverBg};
  transform: scale(1.2);
}
.vf-carousel-dot.active {
  background: ${themeVars.dotActiveBg};
  border-color: ${themeVars.dotActiveBorder};
  transform: scale(1.3);
  box-shadow: ${themeVars.dotGlow};
}

@media (max-width: 768px) {
  .vf-carousel-dot.active {
    transform: scale(1.4);
  }
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
  animation: fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
      
      // Détection mobile
      const isMobile = () => window.innerWidth <= 768;
      
      const getSlidesPerView = () => {
        // Sur mobile, toujours 1 carte
        if (isMobile()) return 1;
        return slidesPerView;
      };
      
      const getMaxIndex = () => Math.max(0, items.length - getSlidesPerView());
      
      // Mise à jour position du carousel
      const updateCarouselPosition = () => {
        const track = container.querySelector('.vf-carousel-track');
        const currentSlidesPerView = getSlidesPerView();
        
        if (mode === 'showcase' || isMobile()) {
          const translateX = -(currentIndex * 100);
          track.style.transform = `translateX(${translateX}%)`;
        } else {
          const cardWidthPercent = 100 / currentSlidesPerView;
          const translateX = -(currentIndex * cardWidthPercent);
          track.style.transform = `translateX(${translateX}%)`;
        }
        
        const totalDots = isMobile() || mode === 'showcase' 
          ? items.length 
          : Math.ceil(items.length / currentSlidesPerView);
          
        container.querySelectorAll('.vf-carousel-dot').forEach((dot, index) => {
          dot.classList.toggle('active', index === currentIndex);
        });
        
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
        // Ne démarre QUE si autoplay est explicitement true
        const currentSlidesPerView = getSlidesPerView();
        if (autoplay === true && items.length > currentSlidesPerView) {
          autoplayInterval = setInterval(nextSlide, autoplayDelay);
          console.log('✅ Autoplay activé');
        }
      };
      
      const stopAutoplay = () => {
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          autoplayInterval = null;
          console.log('⏸️ Autoplay arrêté');
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
      
      // Contrôles
      const controls = document.createElement('div');
      controls.className = 'vf-carousel-controls';
      
      const prevBtn = document.createElement('button');
      prevBtn.className
