/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  WeightSelector – Voiceflow Response Extension            ║
 *  ║                                                           ║
 *  ║  • Design moderne avec fond blanc et bordures colorées    ║
 *  ║  • Effets visuels dynamiques selon les pondérations       ║
 *  ║  • Animations fluides et feedback visuel amélioré         ║
 *  ║  • Support responsive multi-colonnes                      ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const WeightSelector = {
  name: 'WeightSelector',
  type: 'response',

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
        sliderLevel = 'section',
        chat = false,
        chatDisabledText = '🚫 Veuillez effectuer vos pondérations',
        gridColumns = 0,
        global_button_color = '#7928CA',
        buttons = [],
        instanceId = null
      } = payload;

      const uniqueInstanceId = instanceId || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      /* 1. Utilitaires de couleur */
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
      
      const getLuminance = (hex) => {
        const rgb = parseInt(hex.replace('#',''), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        return (0.299 * r + 0.587 * g + 0.114 * b);
      };
      
      const adjustColorBrightness = (hex, factor) => {
        const rgb = parseInt(hex.replace('#',''), 16);
        let r = (rgb >> 16) & 255;
        let g = (rgb >> 8) & 255;
        let b = rgb & 255;
        
        if (factor > 0) {
          r = Math.min(255, Math.floor(r + (255 - r) * factor));
          g = Math.min(255, Math.floor(g + (255 - g) * factor));
          b = Math.min(255, Math.floor(b + (255 - b) * factor));
        } else {
          r = Math.max(0, Math.floor(r * (1 + factor)));
          g = Math.max(0, Math.floor(g * (1 + factor)));
          b = Math.max(0, Math.floor(b * (1 + factor)));
        }
        
        const toHex = c => c.toString(16).padStart(2,'0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      
      const getContrastTextColor = (bgColor) => {
        const luminance = getLuminance(bgColor);
        return luminance > 128 ? '#333333' : '#FFFFFF';
      };
      
      const globalBtnRgb = parseInt(global_button_color.replace('#',''), 16);
      const globalBtnR = (globalBtnRgb >> 16) & 255;
      const globalBtnG = (globalBtnRgb >> 8) & 255;
      const globalBtnB = globalBtnRgb & 255;

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
      
      if (gridColumns === 1 || sections.length === 1) {
        // 1 colonne
      } else if (gridColumns >= 2) {
        container.classList.add(`grid-${gridColumns}-cols`);
        container.setAttribute('data-grid-columns', gridColumns);
      } else if (gridColumns === 0) {
        if (sections.length <= 2) {
          container.classList.add('grid-2-cols');
        } else if (sections.length <= 4) {
          container.classList.add('grid-2-cols');
        } else if (sections.length <= 6) {
          container.classList.add('grid-3-cols');
        } else {
          container.classList.add('grid-3-cols');
        }
      }

      /* 4. Structure des données et initialisation des poids */
      let weights = new Map();
      let sliderElements = new Map();
      let progressBars = new Map();
      
      function initializeWeights() {
        let totalItems = 0;
        let itemsToWeight = [];

        sections.forEach((section, sectionIdx) => {
          if (sliderLevel === 'section') {
            if (section.hasSlider !== false) {
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

        const defaultWeight = 1.0 / totalItems;
        
        itemsToWeight.forEach(item => {
          weights.set(item.id, item.defaultWeight || defaultWeight);
        });

        normalizeWeights();
      }

      function normalizeWeights() {
        const total = Array.from(weights.values()).reduce((sum, weight) => sum + weight, 0);
        if (total > 0) {
          for (let [id, weight] of weights) {
            weights.set(id, weight / total);
          }
        }
      }

      function redistributeWeights(changedId, newValue) {
        const oldValue = weights.get(changedId) || 0;
        const otherIds = Array.from(weights.keys()).filter(id => id !== changedId);
        
        if (otherIds.length === 0) {
          weights.set(changedId, 1.0);
          return;
        }

        const otherTotalOld = otherIds.reduce((sum, id) => sum + weights.get(id), 0);
        const remainingWeight = 1.0 - newValue;
        
        if (otherTotalOld > 0) {
          otherIds.forEach(id => {
            const oldWeight = weights.get(id);
            const newWeight = (oldWeight / otherTotalOld) * remainingWeight;
            weights.set(id, newWeight);
          });
        } else {
          const equalWeight = remainingWeight / otherIds.length;
          otherIds.forEach(id => {
            weights.set(id, equalWeight);
          });
        }
        
        weights.set(changedId, newValue);
      }

      function updateDisplay() {
        const weightValues = Array.from(weights.values());
        const averageWeight = weightValues.reduce((sum, w) => sum + w, 0) / weightValues.length;
        const maxWeight = Math.max(...weightValues);
        const minWeight = Math.min(...weightValues);
        
        for (let [id, weight] of weights) {
          const slider = sliderElements.get(id);
          const progressBar = progressBars.get(id);
          
          if (slider) {
            slider.value = Math.round(weight * 100);
            const valueDisplay = slider.parentElement.querySelector('.weight-value');
            if (valueDisplay) {
              valueDisplay.textContent = `${Math.round(weight * 100)}%`;
            }
            
            let weightClass = 'weight-medium';
            if (weight >= maxWeight * 0.9 && weight > averageWeight * 1.2) {
              weightClass = 'weight-high';
            } else if (weight <= minWeight * 1.1 && weight < averageWeight * 0.8) {
              weightClass = 'weight-low';
            }
            
            const sliderWrapper = slider.closest('.weight-selector-slider-wrapper');
            if (sliderWrapper) {
              sliderWrapper.className = `weight-selector-slider-wrapper ${weightClass}`;
            }
            
            const sectionElement = slider.closest('.weight-selector-section');
            if (sectionElement) {
              sectionElement.className = `weight-selector-section ${weightClass}`;
              
              // Mise à jour de l'intensité de la bordure
              const sectionColor = sectionElement.getAttribute('data-section-color') || global_button_color;
              const intensity = 0.3 + (weight * 0.7);
              sectionElement.style.borderColor = hexToRgba(sectionColor, intensity);
              sectionElement.style.boxShadow = `0 0 ${20 * intensity}px ${hexToRgba(sectionColor, intensity * 0.4)}, inset 0 0 ${15 * intensity}px ${hexToRgba(sectionColor, intensity * 0.1)}`;
            }
          }
          
          if (progressBar) {
            progressBar.style.width = `${weight * 100}%`;
            const intensity = 0.3 + (weight * 0.7);
            progressBar.style.opacity = intensity;
          }
        }
      }

      /* 5. CSS Styles */
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* Variables CSS principales */
.weight-selector-container {
  --ws-accent: ${global_button_color};
  --ws-accent-r: ${globalBtnR};
  --ws-accent-g: ${globalBtnG};
  --ws-accent-b: ${globalBtnB};
  --ws-radius: 16px;
  --ws-shadow: 0 10px 40px rgba(0,0,0,.08);
  --ws-heading-fs: 24px;
  --ws-base-fs: 16px;
  --ws-small-fs: 14px;
  --ws-gap: 20px;
}

/* Reset et styles de base */
.weight-selector-container, .weight-selector-container * { 
  box-sizing: border-box !important; 
}

.weight-selector-container { 
  display: flex !important; 
  flex-direction: column !important; 
  width: 100% !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  font-size: var(--ws-base-fs) !important; 
  color: #1a1a1a !important;
  padding: 2rem !important;
  border-radius: 20px !important;
  background: #ffffff !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08) !important;
  position: relative !important;
  overflow: hidden !important;
}

.weight-selector-container::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 4px !important;
  background: linear-gradient(90deg, var(--ws-accent), ${adjustColorBrightness(global_button_color, 0.3)}, var(--ws-accent)) !important;
  background-size: 200% 100% !important;
  animation: shimmer 3s ease-in-out infinite !important;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Titre principal */
.weight-selector-header {
  font-size: var(--ws-heading-fs) !important;
  font-weight: 700 !important;
  margin: 0 0 0.5rem 0 !important;
  text-align: center !important;
  color: #1a1a1a !important;
  letter-spacing: -0.5px !important;
}

/* Sous-titre */
.weight-selector-subtitle {
  font-size: var(--ws-base-fs) !important;
  text-align: center !important;
  margin-bottom: 2.5rem !important;
  color: #666 !important;
  font-weight: 400 !important;
}

/* Layout des sections */
.weight-selector-sections-grid { 
  display: grid !important; 
  grid-template-columns: 1fr !important;
  gap: var(--ws-gap) !important;
  margin-bottom: 2.5rem !important;
}

.weight-selector-container.grid-2-cols .weight-selector-sections-grid { 
  grid-template-columns: repeat(2, 1fr) !important; 
}

.weight-selector-container.grid-3-cols .weight-selector-sections-grid { 
  grid-template-columns: repeat(3, 1fr) !important; 
}

@media (max-width: 768px) {
  .weight-selector-sections-grid {
    grid-template-columns: 1fr !important;
  }
}

/* Section container avec bordures colorées */
.weight-selector-section { 
  background: #ffffff !important;
  border: 3px solid !important;
  border-radius: 16px !important;
  overflow: hidden !important; 
  transition: all .4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
}

.weight-selector-section::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: radial-gradient(circle at top left, transparent, rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.03)) !important;
  opacity: 0 !important;
  transition: opacity 0.3s ease !important;
}

.weight-selector-section:hover::before {
  opacity: 1 !important;
}

.weight-selector-section:hover { 
  transform: translateY(-4px) !important; 
}

/* Classes de poids avec effets visuels */
.weight-selector-section.weight-high {
  transform: scale(1.02) !important;
  z-index: 10 !important;
}

.weight-selector-section.weight-high:hover {
  transform: translateY(-6px) scale(1.02) !important;
}

.weight-selector-section.weight-low {
  opacity: 0.85 !important;
}

.weight-selector-section.weight-low:hover {
  opacity: 1 !important;
}

/* Titre de section */
.weight-selector-section-title { 
  padding: 20px 24px !important; 
  font-weight: 600 !important;
  font-size: 18px !important;
  letter-spacing: -0.3px !important;
  background: linear-gradient(135deg, #f8f9fa, #ffffff) !important;
  border-bottom: 1px solid #e9ecef !important;
  margin: 0 !important;
  color: #1a1a1a !important;
}

/* Barre de progression */
.weight-selector-progress-container {
  position: relative !important;
  height: 8px !important;
  background: #f0f0f0 !important;
  margin: 0 24px 20px !important;
  border-radius: 4px !important;
  overflow: hidden !important;
}

.weight-selector-progress-bar {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  height: 100% !important;
  background: linear-gradient(90deg, var(--ws-accent), ${adjustColorBrightness(global_button_color, 0.2)}) !important;
  border-radius: 4px !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  width: 0% !important;
}

/* Container de slider */
.weight-selector-slider-container {
  padding: 0 24px 24px !important;
}

.weight-selector-slider-wrapper {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  margin-bottom: 16px !important;
  padding: 16px !important;
  background: #f8f9fa !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.weight-selector-slider-wrapper:hover {
  background: #f0f1f3 !important;
}

/* Effet sur les wrappers selon le poids */
.weight-selector-slider-wrapper.weight-high {
  background: linear-gradient(135deg, #f8f9fa, #ffffff) !important;
  box-shadow: 0 4px 12px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.15) !important;
}

.weight-selector-slider-wrapper.weight-low {
  opacity: 0.7 !important;
}

.weight-selector-slider-wrapper.weight-low:hover {
  opacity: 1 !important;
}

.weight-selector-slider-label {
  font-size: var(--ws-small-fs) !important;
  font-weight: 500 !important;
  min-width: 60px !important;
  color: #495057 !important;
}

/* Slider moderne */
.weight-selector-slider-input {
  flex: 1 !important;
  height: 8px !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  background: #e9ecef !important;
  border-radius: 4px !important;
  outline: none !important;
  margin: 0 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
}

.weight-selector-slider-input::-webkit-slider-thumb {
  appearance: none !important;
  -webkit-appearance: none !important;
  width: 24px !important;
  height: 24px !important;
  background: #ffffff !important;
  border: 3px solid var(--ws-accent) !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease !important;
}

.weight-selector-slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2) !important;
  box-shadow: 0 4px 16px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.3) !important;
}

.weight-selector-slider-input::-webkit-slider-thumb:active {
  transform: scale(1.1) !important;
}

/* Track du slider avec remplissage progressif */
.weight-selector-slider-input::-webkit-slider-runnable-track {
  width: 100% !important;
  height: 8px !important;
  cursor: pointer !important;
  background: linear-gradient(to right, var(--ws-accent) 0%, var(--ws-accent) var(--value, 0%), #e9ecef var(--value, 0%), #e9ecef 100%) !important;
  border-radius: 4px !important;
}

.weight-value {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace !important;
  font-weight: 600 !important;
  background: var(--ws-accent) !important;
  color: white !important;
  padding: 6px 12px !important;
  border-radius: 8px !important;
  min-width: 60px !important;
  text-align: center !important;
  font-size: var(--ws-small-fs) !important;
  box-shadow: 0 2px 8px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.25) !important;
  transition: all 0.3s ease !important;
}

/* Variations de la valeur selon le poids */
.weight-selector-slider-wrapper.weight-high .weight-value {
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.4) !important;
}

.weight-selector-slider-wrapper.weight-low .weight-value {
  transform: scale(0.9) !important;
  opacity: 0.8 !important;
}

/* Sous-sections */
.weight-selector-subsections {
  padding: 0 24px 20px !important;
}

.weight-selector-subsection {
  background: #f8f9fa !important;
  border-radius: 12px !important;
  padding: 16px !important;
  margin-bottom: 12px !important;
  border: 1px solid #e9ecef !important;
  transition: all 0.3s ease !important;
}

.weight-selector-subsection:hover {
  background: #f0f1f3 !important;
  border-color: #dee2e6 !important;
}

.weight-selector-subsection-title {
  font-size: var(--ws-small-fs) !important;
  font-weight: 500 !important;
  margin-bottom: 12px !important;
  color: #495057 !important;
}

/* Boutons modernes */
.weight-selector-buttons-container {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  gap: 16px !important;
  padding-top: 20px !important;
  width: 100% !important;
}

.weight-selector-submit-btn {
  background: var(--ws-accent) !important;
  color: white !important;
  padding: 16px 32px !important; 
  border-radius: 12px !important;
  font-weight: 600 !important; 
  font-size: 16px !important;
  cursor: pointer !important;
  border: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 16px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.25) !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 200px !important;
}

.weight-selector-submit-btn::before {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 0 !important;
  height: 0 !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 50% !important;
  transform: translate(-50%, -50%) !important;
  transition: width 0.6s, height 0.6s !important;
}

.weight-selector-submit-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 24px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.35) !important;
}

.weight-selector-submit-btn:hover::before {
  width: 300px !important;
  height: 300px !important;
}

.weight-selector-submit-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 8px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.25) !important;
}

/* Boutons clairs */
.weight-selector-submit-btn.light-button {
  background: #f8f9fa !important;
  color: var(--ws-accent) !important;
  border: 2px solid var(--ws-accent) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
}

.weight-selector-submit-btn.light-button:hover {
  background: var(--ws-accent) !important;
  color: white !important;
  box-shadow: 0 6px 24px rgba(var(--ws-accent-r), var(--ws-accent-g), var(--ws-accent-b), 0.35) !important;
}

/* État désactivé */
.weight-selector-container.disabled {
  opacity: 0.6 !important;
  pointer-events: none !important;
  filter: grayscale(30%) !important;
}

/* Animations supplémentaires */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.weight-selector-section.weight-high .weight-selector-section-title {
  animation: pulse 2s ease-in-out infinite !important;
}
      `;
      container.appendChild(styleEl);

      /* 6. Construction de l'interface */
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
        sectionEl.setAttribute('data-section-color', sectionColor);
        sectionEl.style.borderColor = hexToRgba(sectionColor, 0.5);
        sectionEl.style.setProperty('--ws-accent', sectionColor);
        
        // Convertir la couleur en RGB pour les animations
        const sectionRgb = parseInt(sectionColor.replace('#',''), 16);
        const sectionR = (sectionRgb >> 16) & 255;
        const sectionG = (sectionRgb >> 8) & 255;
        const sectionB = sectionRgb & 255;
        sectionEl.style.setProperty('--ws-accent-r', sectionR);
        sectionEl.style.setProperty('--ws-accent-g', sectionG);
        sectionEl.style.setProperty('--ws-accent-b', sectionB);
        
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
          progressBar.style.background = `linear-gradient(90deg, ${sectionColor}, ${adjustColorBrightness(sectionColor, 0.2)})`;
          
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
          valueDisplay.style.background = sectionColor;
          
          const sectionId = `section_${sectionIdx}`;
          sliderElements.set(sectionId, slider);
          
          // Mettre à jour le style du track en fonction de la valeur
          slider.addEventListener('input', () => {
            const newWeight = parseInt(slider.value) / 100;
            redistributeWeights(sectionId, newWeight);
            updateDisplay();
            
            // Mettre à jour le remplissage du slider
            slider.style.setProperty('--value', `${slider.value}%`);
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
              progressBar.style.background = `linear-gradient(90deg, ${sectionColor}, ${adjustColorBrightness(sectionColor, 0.2)})`;
              
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
              valueDisplay.style.background = sectionColor;
              
              const subsectionId = `subsection_${sectionIdx}_${subIdx}`;
              sliderElements.set(subsectionId, slider);
              
              // Événement de changement
              slider.addEventListener('input', () => {
                const newWeight = parseInt(slider.value) / 100;
                redistributeWeights(subsectionId, newWeight);
                updateDisplay();
                
                // Mettre à jour le remplissage du slider
                slider.style.setProperty('--value', `${slider.value}%`);
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
          
          btn.textContent = buttonConfig.text || 'Confirmer';

          // Gestion des couleurs de bouton
          if (buttonConfig.color) {
            const buttonLuminance = getLuminance(buttonConfig.color);
            
            if (buttonLuminance > 200) {
              // Bouton clair - inversion automatique
              btn.classList.add('light-button');
              btn.style.setProperty('--ws-accent', global_button_color);
            } else {
              // Bouton foncé - style normal
              btn.style.setProperty('--ws-accent', buttonConfig.color);
              const rgb = parseInt(buttonConfig.color.replace('#',''), 16);
              const r = (rgb >> 16) & 255;
              const g = (rgb >> 8) & 255;
              const b = rgb & 255;
              btn.style.setProperty('--ws-accent-r', r);
              btn.style.setProperty('--ws-accent-g', g);
              btn.style.setProperty('--ws-accent-b', b);
            }
          }

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
      
      // Initialiser les valeurs de remplissage des sliders
      for (let [id, slider] of sliderElements) {
        slider.style.setProperty('--value', `${slider.value}%`);
      }
      
      // Ajout au DOM
      element.appendChild(container);
      
      console.log(`✅ WeightSelector prêt (ID: ${uniqueInstanceId}) - ${sliderLevel} level - ${sections.length} sections`);
      
    } catch (error) {
      console.error('❌ WeightSelector Error:', error);
      
      const errorEl = document.createElement('div');
      errorEl.innerHTML = `
        <div style="color: #721c24; background-color: #f8d7da; padding: 1rem; border-radius: 8px; border: 1px solid #f5c6cb;">
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
