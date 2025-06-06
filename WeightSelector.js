/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  WeightSelector – Voiceflow Response Extension            ║
 *  ║                                                           ║
 *  ║  • Sections et sous-sections avec sliders de pondération ║
 *  ║  • Redistribution automatique proportionnelle            ║
 *  ║  • Barres de progression colorées                        ║
 *  ║  • Design glassmorphisme cohérent                        ║
 *  ║  • Support responsive multi-colonnes                     ║
 *  ║  • Chat configurable (défaut: désactivé)                 ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const WeightSelector = {
  name: 'WeightSelector',
  type: 'response',

  // S'active sur les traces weight_selector
  match: ({ trace }) => trace.type === 'weight_selector' || trace.payload?.type === 'weight_selector',

  render: ({ trace, element }) => {
    try {
      /* 0. Lecture du payload */
      const payload = typeof trace.payload === 'string' 
        ? JSON.parse(trace.payload) 
        : trace.payload || {};

      const {
        title = 'Pondération des éléments',
        subtitle = 'Ajustez l\'importance de chaque élément (total = 100%)',
        sections = [],
        sliderLevel = 'section', // 'section' ou 'subsection'
        chat = false,
        chatDisabledText = '🚫 Veuillez effectuer vos pondérations',
        gridColumns = 0, // 0 = auto, 1,2,3,4,5,6+ = nombre de colonnes
        global_button_color = '#7928CA',
        buttons = [],
        instanceId = null
      } = payload;

      // Générer un identifiant unique
      const uniqueInstanceId = instanceId || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      /* 1. Utilitaires */
      const stripHTML = html => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return tmp.textContent || tmp.innerText || '';
      };

      const hexToRgba = (hex, opacity) => {
        const num = parseInt(hex.replace('#',''), 16);
        const r = num >> 16;
        const g = (num >> 8) & 0xFF;
        const b = num & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      /* 2. Gestion du chat */
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      
      let chatEnabled = chat;
      let isSubmitted = false;
      
      function disableChat() {
        if (isSubmitted) return;
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '.5';
        ic.style.cursor = 'not-allowed';
        ic.setAttribute('title', chatDisabledText);
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = true; ta.setAttribute('title', chatDisabledText); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = true; snd.setAttribute('title', chatDisabledText); }
        chatEnabled = false;
      }
      
      function enableChat() {
        isSubmitted = true;
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.removeProperty('opacity');
        ic.style.removeProperty('cursor');
        ic.removeAttribute('title');
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { 
          ta.disabled = false; 
          ta.removeAttribute('title');
          ta.style.pointerEvents = 'auto';
        }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { 
          snd.disabled = false;
          snd.removeAttribute('title');
          snd.style.pointerEvents = 'auto';
        }
        chatEnabled = true;
        
        setTimeout(() => {
          if (ta) ta.disabled = false;
          if (snd) snd.disabled = false;
          const chatElements = host.querySelectorAll('.vfrc-chat-input, #vfrc-send-message, .vfrc-input-container *');
          chatElements.forEach(elem => {
            if (elem) {
              elem.disabled = false;
              elem.style.pointerEvents = 'auto';
            }
          });
        }, 100);
      }
      
      if (!chat) disableChat();

      /* 3. Container principal */
      const container = document.createElement('div');
      container.className = 'weight-selector-container';
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);
      
      // Configuration des colonnes
      if (gridColumns === 1 || sections.length === 1) {
        container.classList.add('one-section');
      } else if (gridColumns >= 2) {
        container.classList.add(`grid-${gridColumns}-cols`);
        container.setAttribute('data-grid-columns', gridColumns);
      }

      /* 4. Structure des données et initialisation des poids */
      let weights = new Map(); // Stockage des poids (clé: ID unique, valeur: poids)
      let sliderElements = new Map(); // Stockage des éléments slider
      let progressBars = new Map(); // Stockage des barres de progression
      
      // Initialiser les poids selon le niveau de slider
      function initializeWeights() {
        let totalItems = 0;
        let itemsToWeight = [];

        sections.forEach((section, sectionIdx) => {
          if (sliderLevel === 'section') {
            if (section.hasSlider !== false) { // Par défaut true si non spécifié
              const id = `section_${sectionIdx}`;
              itemsToWeight.push({
                id,
                defaultWeight: section.defaultWeight || null
              });
              totalItems++;
            }
          } else if (sliderLevel === 'subsection') {
            if (section.subsections && Array.isArray(section.subsections)) {
              section.subsections.forEach((subsection, subIdx) => {
                if (subsection.hasSlider !== false) {
                  const id = `subsection_${sectionIdx}_${subIdx}`;
                  itemsToWeight.push({
                    id,
                    defaultWeight: subsection.defaultWeight || null
                  });
                  totalItems++;
                }
              });
            }
          }
        });

        // Calcul des poids par défaut
        const defaultWeight = 1.0 / totalItems;
        
        itemsToWeight.forEach(item => {
          weights.set(item.id, item.defaultWeight || defaultWeight);
        });

        // Normaliser pour être sûr que le total = 1.0
        normalizeWeights();
      }

      // Normalisation des poids pour total = 1.0
      function normalizeWeights() {
        const total = Array.from(weights.values()).reduce((sum, weight) => sum + weight, 0);
        if (total > 0) {
          for (let [id, weight] of weights) {
            weights.set(id, weight / total);
          }
        }
      }

      // Redistribution proportionnelle
      function redistributeWeights(changedId, newValue) {
        const oldValue = weights.get(changedId) || 0;
        const otherIds = Array.from(weights.keys()).filter(id => id !== changedId);
        
        if (otherIds.length === 0) {
          weights.set(changedId, 1.0);
          return;
        }

        // Calculer le total des autres poids
        const otherTotalOld = otherIds.reduce((sum, id) => sum + weights.get(id), 0);
        const remainingWeight = 1.0 - newValue;
        
        // Redistribuer proportionnellement
        if (otherTotalOld > 0) {
          otherIds.forEach(id => {
            const oldWeight = weights.get(id);
            const newWeight = (oldWeight / otherTotalOld) * remainingWeight;
            weights.set(id, newWeight);
          });
        } else {
          // Si tous les autres étaient à 0, répartir équitablement
          const equalWeight = remainingWeight / otherIds.length;
          otherIds.forEach(id => {
            weights.set(id, equalWeight);
          });
        }
        
        weights.set(changedId, newValue);
      }

      // Mise à jour de l'affichage
      function updateDisplay() {
        for (let [id, weight] of weights) {
          const slider = sliderElements.get(id);
          const progressBar = progressBars.get(id);
          
          if (slider) {
            slider.value = Math.round(weight * 100);
            const valueDisplay = slider.parentElement.querySelector('.weight-value');
            if (valueDisplay) {
              valueDisplay.textContent = `${Math.round(weight * 100)}%`;
            }
          }
          
          if (progressBar) {
            progressBar.style.width = `${weight * 100}%`;
            // Ajuster l'opacité en fonction du poids (plus de poids = plus opaque)
            const opacity = 0.3 + (weight * 0.7); // Entre 0.3 et 1.0
            progressBar.style.opacity = opacity;
          }
        }
      }

      /* 5. CSS Styles */
      const globalBtnRgb = parseInt(global_button_color.replace('#',''), 16);
      const globalBtnR = (globalBtnRgb >> 16) & 255;
      const globalBtnG = (globalBtnRgb >> 8) & 255;
      const globalBtnB = globalBtnRgb & 255;
      
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* Variables CSS principales */
.weight-selector-container {
  --ws-accent: ${global_button_color};
  --ws-accent-r: ${globalBtnR};
  --ws-accent-g: ${globalBtnG};
  --ws-accent-b: ${globalBtnB};
  --ws-radius: 10px;
  --ws-shadow: 0 4px 12px rgba(0,0,0,.15);
  --ws-heading-fs: 18px;
  --ws-base-fs: 15px;
  --ws-small-fs: 14px;
  --ws-gap: 16px;
}

/* Reset et styles de base */
.weight-selector-container, .weight-selector-container * { 
  box-sizing: border-box !important; 
}

.weight-selector-container { 
  display: flex !important; 
  flex-direction: column !important; 
  width: 100% !important;
  font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
  font-size: var(--ws-base-fs) !important; 
  color: #fff !important;
  padding: 1.5rem !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  background: linear-gradient(135deg, 
    rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.85), 
    rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.65)) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s ease !important;
}

.weight-selector-container:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
}

/* Titre principal */
.weight-selector-header {
  font-size: var(--ws-heading-fs) !important;
  font-weight: 700 !important;
  margin: 0 0 1rem 0 !important;
  text-align: center !important;
  color: #fff !important;
  letter-spacing: -0.3px !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  position: relative !important;
  padding-bottom: 10px !important;
}

.weight-selector-header::before {
  content: '' !important;
  position: absolute !important;
  left: 50% !important;
  bottom: 0 !important;
  transform: translateX(-50%) !important;
  width: 60px !important;
  height: 2px !important;
  background: #FFFFFF !important;
  transition: width 0.3s ease !important;
}

.weight-selector-container:hover .weight-selector-header::before {
  width: 120px !important;
}

/* Sous-titre */
.weight-selector-subtitle {
  font-size: var(--ws-base-fs) !important;
  text-align: center !important;
  margin-bottom: 2rem !important;
  opacity: 0.9 !important;
  font-weight: 500 !important;
}

/* Layout des sections */
.weight-selector-sections-grid { 
  display: grid !important; 
  grid-template-columns: repeat(2, 1fr) !important;
  gap: var(--ws-gap) !important;
  margin-bottom: 2rem !important;
}

.weight-selector-container.one-section .weight-selector-sections-grid { 
  grid-template-columns: 1fr !important; 
}

.weight-selector-container.grid-3-cols .weight-selector-sections-grid { 
  grid-template-columns: repeat(3, 1fr) !important; 
}

.weight-selector-container.grid-4-cols .weight-selector-sections-grid { 
  grid-template-columns: repeat(4, 1fr) !important; 
}

.weight-selector-container.grid-5-cols .weight-selector-sections-grid { 
  grid-template-columns: repeat(5, 1fr) !important; 
}

.weight-selector-container.grid-6-cols .weight-selector-sections-grid { 
  grid-template-columns: repeat(6, 1fr) !important; 
}

.weight-selector-container[data-grid-columns] .weight-selector-sections-grid {
  grid-template-columns: repeat(var(--grid-cols, 2), 1fr) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .weight-selector-container[data-grid-columns] .weight-selector-sections-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .weight-selector-container[data-grid-columns="3"] .weight-selector-sections-grid,
  .weight-selector-container[data-grid-columns="4"] .weight-selector-sections-grid,
  .weight-selector-container[data-grid-columns="5"] .weight-selector-sections-grid,
  .weight-selector-container[data-grid-columns="6"] .weight-selector-sections-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

/* Section container */
.weight-selector-section { 
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  border-radius: 12px !important;
  overflow: hidden !important; 
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  transition: all .3s ease !important;
  position: relative !important;
}

.weight-selector-section:hover { 
  transform: translateY(-2px) !important; 
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
}

/* Titre de section */
.weight-selector-section-title { 
  padding: 16px 20px !important; 
  font-weight: 700 !important;
  font-size: 16px !important;
  letter-spacing: -0.3px !important;
  background: linear-gradient(to right, rgba(255,255,255,0.1), transparent) !important;
  border-bottom: 1px solid rgba(255,255,255,0.1) !important;
  margin: 0 !important;
  position: relative !important;
  overflow: hidden !important;
}

.weight-selector-section-title::before {
  content: '' !important;
  position: absolute !important;
  left: 0 !important;
  bottom: 0 !important;
  width: 60px !important;
  height: 2px !important;
  background: #FFFFFF !important;
  transition: width 0.3s ease !important;
}

.weight-selector-section:hover .weight-selector-section-title::before {
  width: 100% !important;
}

/* Barre de progression de pondération */
.weight-selector-progress-container {
  position: relative !important;
  height: 6px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  margin: 0 20px 16px !important;
  border-radius: 3px !important;
  overflow: hidden !important;
}

.weight-selector-progress-bar {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  height: 100% !important;
  background: linear-gradient(90deg, #FFFFFF, rgba(255, 255, 255, 0.8)) !important;
  border-radius: 3px !important;
  transition: all 0.3s ease !important;
  width: 0% !important;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3) !important;
}

/* Container de slider */
.weight-selector-slider-container {
  padding: 0 20px 20px !important;
}

.weight-selector-slider-wrapper {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
}

.weight-selector-slider-label {
  font-size: var(--ws-small-fs) !important;
  font-weight: 600 !important;
  min-width: 80px !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

.weight-selector-slider-input {
  flex: 1 !important;
  height: 6px !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 3px !important;
  outline: none !important;
  margin: 0 !important;
  cursor: pointer !important;
}

.weight-selector-slider-input::-webkit-slider-thumb {
  appearance: none !important;
  -webkit-appearance: none !important;
  width: 18px !important;
  height: 18px !important;
  background: white !important;
  border: 2px solid rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.8) !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
  transition: all 0.2s ease !important;
}

.weight-selector-slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15) !important;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
}

.weight-selector-slider-input::-moz-range-thumb {
  appearance: none !important;
  width: 14px !important;
  height: 14px !important;
  background: white !important;
  border: 2px solid rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.8) !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
  transition: all 0.2s ease !important;
}

.weight-value {
  font-family: 'Roboto Mono', monospace !important;
  font-weight: 700 !important;
  background: rgba(0, 0, 0, 0.3) !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  min-width: 50px !important;
  text-align: center !important;
  font-size: var(--ws-small-fs) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Sous-sections */
.weight-selector-subsections {
  padding: 0 20px 20px !important;
}

.weight-selector-subsection {
  background: rgba(0, 0, 0, 0.2) !important;
  border-radius: 8px !important;
  padding: 12px !important;
  margin-bottom: 8px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.weight-selector-subsection-title {
  font-size: var(--ws-small-fs) !important;
  font-weight: 600 !important;
  margin-bottom: 8px !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Boutons - Style cohérent */
.weight-selector-buttons-container {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: stretch !important;
  gap: 12px !important;
  padding: 16px 0 0 !important;
  width: 100% !important;
}

.weight-selector-button-wrapper {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}

.weight-selector-submit-btn {
  position: relative !important;
  background: var(--ws-accent) !important;
  color: #fff !important;
  padding: 14px 20px !important; 
  border-radius: 8px !important;
  font-weight: 700 !important; 
  letter-spacing: 0.5px !important;
  font-size: 14px !important;
  line-height: 1.2 !important;
  cursor: pointer !important;
  border: none !important;
  overflow: hidden !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(var(--ws-accent-r),var(--ws-accent-g),var(--ws-accent-b),0.3),
              inset 0 3px 0 rgba(255,255,255,0.2),
              inset 0 -3px 0 rgba(0,0,0,0.2) !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.2) !important;
  text-align: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 1 1 auto !important;
  min-width: 200px !important;
  max-width: 400px !important;
  height: 60px !important;
  word-wrap: break-word !important;
  hyphens: auto !important;
  white-space: normal !important;
}

@media (max-width: 768px) {
  .weight-selector-buttons-container {
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  .weight-selector-submit-btn {
    flex: 1 1 100% !important;
    max-width: none !important;
    min-width: auto !important;
  }
}

.weight-selector-buttons-container:has(.weight-selector-button-wrapper:nth-child(2):last-child) .weight-selector-submit-btn {
  flex: 1 1 calc(50% - 6px) !important;
}

@media (min-width: 769px) {
  .weight-selector-buttons-container:has(.weight-selector-button-wrapper:nth-child(n+3)) .weight-selector-submit-btn {
    flex: 1 1 calc(33.333% - 8px) !important;
    min-width: 250px !important;
  }
}

.weight-selector-submit-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(var(--ws-accent-r),var(--ws-accent-g),var(--ws-accent-b),0.4),
              inset 0 3px 0 rgba(255,255,255,0.3),
              inset 0 -3px 0 rgba(0,0,0,0.3) !important;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 0 6px rgba(0,0,0,0.3) !important;
}

.weight-selector-submit-btn:active {
  transform: translateY(1px) !important;
  box-shadow: 0 2px 6px rgba(var(--ws-accent-r),var(--ws-accent-g),var(--ws-accent-b),0.3),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.1) !important;
}

.weight-selector-submit-btn::before {
  content: '' !important;
  position: absolute !important;
  top: -2px !important;
  left: -2px !important;
  width: calc(100% + 4px) !important;
  height: calc(100% + 4px) !important;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent) !important;
  transform: translateX(-100%) rotate(45deg) !important;
  transition: transform 0.8s ease !important;
}

.weight-selector-submit-btn:hover::before {
  transform: translateX(100%) rotate(45deg) !important;
}

/* État désactivé */
.weight-selector-container.disabled {
  opacity: 0.6 !important;
  pointer-events: none !important;
  filter: grayscale(30%) !important;
  user-select: none !important;
  transform: none !important;
}
      `;
      container.appendChild(styleEl);

      /* 6. Construction de l'interface */
      // Initialiser les poids
      initializeWeights();

      // Titre principal
      if (title) {
        const headerEl = document.createElement('h2');
        headerEl.className = 'weight-selector-header';
        headerEl.innerHTML = title;
        container.appendChild(headerEl);
      }

      // Sous-titre
      if (subtitle) {
        const subtitleEl = document.createElement('div');
        subtitleEl.className = 'weight-selector-subtitle';
        subtitleEl.innerHTML = subtitle;
        container.appendChild(subtitleEl);
      }

      // Grid des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.className = 'weight-selector-sections-grid';
      sectionsGrid.id = `sections-grid-${uniqueInstanceId}`;
      
      if (gridColumns >= 2) {
        sectionsGrid.style.setProperty('--grid-cols', gridColumns);
      }

      // Créer les sections
      sections.forEach((section, sectionIdx) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'weight-selector-section';
        sectionEl.id = `section-${uniqueInstanceId}-${sectionIdx}`;
        
        // Couleur de section
        const sectionColor = section.color || global_button_color;
        const rgba1 = hexToRgba(sectionColor, 0.9);
        const rgba2 = hexToRgba(sectionColor, 0.7);
        sectionEl.style.background = `linear-gradient(135deg, ${rgba1}, ${rgba2})`;
        
        // Titre de section
        if (section.label) {
          const titleEl = document.createElement('div');
          titleEl.className = 'weight-selector-section-title';
          titleEl.innerHTML = section.label;
          sectionEl.appendChild(titleEl);
        }

        // Barre de progression de section (si slider au niveau section)
        if (sliderLevel === 'section' && section.hasSlider !== false) {
          const progressContainer = document.createElement('div');
          progressContainer.className = 'weight-selector-progress-container';
          
          const progressBar = document.createElement('div');
          progressBar.className = 'weight-selector-progress-bar';
          
          progressContainer.appendChild(progressBar);
          sectionEl.appendChild(progressContainer);
          
          const sectionId = `section_${sectionIdx}`;
          progressBars.set(sectionId, progressBar);
        }

        // Slider de section (si niveau = section)
        if (sliderLevel === 'section' && section.hasSlider !== false) {
          const sliderContainer = document.createElement('div');
          sliderContainer.className = 'weight-selector-slider-container';
          
          const sliderWrapper = document.createElement('div');
          sliderWrapper.className = 'weight-selector-slider-wrapper';
          
          const label = document.createElement('div');
          label.className = 'weight-selector-slider-label';
          label.textContent = 'Poids:';
          
          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = 0;
          slider.max = 100;
          slider.className = 'weight-selector-slider-input';
          slider.id = `slider-${uniqueInstanceId}-section-${sectionIdx}`;
          
          const valueDisplay = document.createElement('div');
          valueDisplay.className = 'weight-value';
          
          const sectionId = `section_${sectionIdx}`;
          sliderElements.set(sectionId, slider);
          
          // Événement de changement
          slider.addEventListener('input', () => {
            const newWeight = parseInt(slider.value) / 100;
            redistributeWeights(sectionId, newWeight);
            updateDisplay();
          });
          
          sliderWrapper.append(label, slider, valueDisplay);
          sliderContainer.appendChild(sliderWrapper);
          sectionEl.appendChild(sliderContainer);
        }

        // Sous-sections
        if (section.subsections && Array.isArray(section.subsections)) {
          const subsectionsContainer = document.createElement('div');
          subsectionsContainer.className = 'weight-selector-subsections';
          
          section.subsections.forEach((subsection, subIdx) => {
            const subsectionEl = document.createElement('div');
            subsectionEl.className = 'weight-selector-subsection';
            
            // Titre de sous-section
            if (subsection.label) {
              const subTitleEl = document.createElement('div');
              subTitleEl.className = 'weight-selector-subsection-title';
              subTitleEl.innerHTML = subsection.label;
              subsectionEl.appendChild(subTitleEl);
            }

            // Barre de progression de sous-section (si slider au niveau subsection)
            if (sliderLevel === 'subsection' && subsection.hasSlider !== false) {
              const progressContainer = document.createElement('div');
              progressContainer.className = 'weight-selector-progress-container';
              
              const progressBar = document.createElement('div');
              progressBar.className = 'weight-selector-progress-bar';
              
              progressContainer.appendChild(progressBar);
              subsectionEl.appendChild(progressContainer);
              
              const subsectionId = `subsection_${sectionIdx}_${subIdx}`;
              progressBars.set(subsectionId, progressBar);
            }

            // Slider de sous-section (si niveau = subsection)
            if (sliderLevel === 'subsection' && subsection.hasSlider !== false) {
              const sliderWrapper = document.createElement('div');
              sliderWrapper.className = 'weight-selector-slider-wrapper';
              
              const label = document.createElement('div');
              label.className = 'weight-selector-slider-label';
              label.textContent = 'Poids:';
              
              const slider = document.createElement('input');
              slider.type = 'range';
              slider.min = 0;
              slider.max = 100;
              slider.className = 'weight-selector-slider-input';
              slider.id = `slider-${uniqueInstanceId}-subsection-${sectionIdx}-${subIdx}`;
              
              const valueDisplay = document.createElement('div');
              valueDisplay.className = 'weight-value';
              
              const subsectionId = `subsection_${sectionIdx}_${subIdx}`;
              sliderElements.set(subsectionId, slider);
              
              // Événement de changement
              slider.addEventListener('input', () => {
                const newWeight = parseInt(slider.value) / 100;
                redistributeWeights(subsectionId, newWeight);
                updateDisplay();
              });
              
              sliderWrapper.append(label, slider, valueDisplay);
              subsectionEl.appendChild(sliderWrapper);
            }
            
            subsectionsContainer.appendChild(subsectionEl);
          });
          
          sectionEl.appendChild(subsectionsContainer);
        }
        
        sectionsGrid.appendChild(sectionEl);
      });

      container.appendChild(sectionsGrid);

      /* 7. Boutons */
      if (buttons.length) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'weight-selector-buttons-container';
        buttonsContainer.id = `buttons-container-${uniqueInstanceId}`;

        buttons.forEach((buttonConfig, btnIdx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'weight-selector-button-wrapper';
          wrapper.id = `button-wrapper-${uniqueInstanceId}-${btnIdx}`;

          const btn = document.createElement('button');
          btn.className = 'weight-selector-submit-btn';
          btn.id = `submit-btn-${uniqueInstanceId}-${btnIdx}`;
          
          if (buttonConfig.color) {
            btn.style.setProperty('background-color', buttonConfig.color, 'important');
            btn.style.setProperty('border-color', buttonConfig.color, 'important');
            const rgb = parseInt(buttonConfig.color.replace('#',''), 16);
            const r = (rgb >> 16) & 255;
            const g = (rgb >> 8) & 255;
            const b = rgb & 255;
            btn.style.setProperty('--ws-accent-r', r);
            btn.style.setProperty('--ws-accent-g', g);
            btn.style.setProperty('--ws-accent-b', b);
          }
          
          btn.textContent = buttonConfig.text || 'Confirmer';

          btn.addEventListener('click', () => {
            // Désactiver l'interface
            container.classList.add('disabled');
            
            // Créer l'objet de résultat
            const result = {
              sliderLevel,
              weights: Object.fromEntries(weights),
              sections: sections.map((section, sectionIdx) => {
                const sectionResult = {
                  label: section.label,
                  weight: sliderLevel === 'section' ? weights.get(`section_${sectionIdx}`) || 0 : null,
                  subsections: []
                };
                
                if (section.subsections) {
                  sectionResult.subsections = section.subsections.map((subsection, subIdx) => ({
                    label: subsection.label,
                    weight: sliderLevel === 'subsection' ? weights.get(`subsection_${sectionIdx}_${subIdx}`) || 0 : null
                  }));
                }
                
                return sectionResult;
              }),
              buttonText: buttonConfig.text,
              buttonPath: buttonConfig.path || 'Default',
              instanceId: uniqueInstanceId
            };

            // Réactiver le chat
            enableChat();
            
            setTimeout(() => {
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: result
              });
              
              setTimeout(enableChat, 300);
            }, 100);
          });

          wrapper.appendChild(btn);
          buttonsContainer.appendChild(wrapper);
        });

        container.appendChild(buttonsContainer);
      }

      /* 8. Initialisation finale */
      updateDisplay();
      
      // Ajout au DOM
      element.appendChild(container);
      
      console.log(`✅ WeightSelector prêt (ID: ${uniqueInstanceId}) - ${sliderLevel} level - ${sections.length} sections`);
      
    } catch (error) {
      console.error('❌ WeightSelector Error:', error);
      
      const errorEl = document.createElement('div');
      errorEl.innerHTML = `
        <div style="color: #fff; background-color: rgba(220, 53, 69, 0.8); padding: 1rem; border-radius: 8px; backdrop-filter: blur(5px);">
          <p>Erreur lors du chargement de WeightSelector:</p>
          <p>${error.message}</p>
        </div>
      `;
      element.appendChild(errorEl);
      
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: error.message }
      });
    }
  }
};

export default WeightSelector;
