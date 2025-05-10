/**
 * ValueSlider - Extension Voiceflow
 * 
 * Cette extension affiche un slider personnalisable permettant de sélectionner une valeur 
 * et de voir une description correspondante.
 * 
 * Paramètres du payload:
 * - title: Titre principal
 * - subtitle: Texte avant la valeur sélectionnée (ex: "J'ai besoin de")
 * - descriptions: Tableau d'objets {value, text} pour les descriptions selon la valeur
 * - min: Valeur minimale
 * - max: Valeur maximale
 * - steps: Tableau des valeurs à afficher sous le slider
 * - defaultValue: Valeur par défaut sélectionnée
 * - primaryColor: Couleur principale (par défaut: #3778F4)
 * - unit: Unité à afficher après la valeur (ex: "mots", "€", etc.)
 */

export const ValueSlider = {
  name: 'ValueSlider',
  type: 'response',
  
  // Correspond aux traces de type 'value_slider' ou avec payload.type === 'value_slider'
  match: ({ trace }) => trace.type === 'value_slider' || trace.payload?.type === 'value_slider',
  
  render: ({ trace, element }) => {
    try {
      // Extraction du payload
      const payload = typeof trace.payload === 'string' 
        ? JSON.parse(trace.payload) 
        : trace.payload || {};
      
      // Paramètres avec valeurs par défaut
      const {
        title = 'Sélectionnez une valeur',
        subtitle = 'J\'ai besoin de',
        descriptions = [],
        min = 0,
        max = 1000,
        steps = [0, 250, 500, 750, 1000],
        defaultValue = min,
        primaryColor = '#3778F4',
        unit = ''
      } = payload;
      
      // Création du conteneur principal
      const container = document.createElement('div');
      container.className = 'value-slider-container';
      
      // Création des éléments HTML
      const headerEl = document.createElement('h2');
      headerEl.className = 'value-slider-header';
      headerEl.textContent = title;
      
      const valueDisplayContainer = document.createElement('div');
      valueDisplayContainer.className = 'value-slider-value-display';
      
      const subtitleEl = document.createElement('span');
      subtitleEl.className = 'value-slider-subtitle';
      subtitleEl.textContent = subtitle;
      
      const valueEl = document.createElement('span');
      valueEl.className = 'value-slider-value';
      
      const descriptionEl = document.createElement('span');
      descriptionEl.className = 'value-slider-description';
      
      const unitEl = document.createElement('span');
      unitEl.className = 'value-slider-unit';
      unitEl.textContent = unit;
      
      // Création du slider
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'value-slider-slider-container';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'value-slider-progress';
      
      const sliderInput = document.createElement('input');
      sliderInput.type = 'range';
      sliderInput.min = min;
      sliderInput.max = max;
      sliderInput.value = defaultValue;
      sliderInput.className = 'value-slider-input';
      
      // Création des marqueurs pour les steps
      const stepsContainer = document.createElement('div');
      stepsContainer.className = 'value-slider-steps';
      
      steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'value-slider-step';
        
        const stepLabel = document.createElement('span');
        stepLabel.className = 'value-slider-step-label';
        stepLabel.textContent = step;
        
        stepEl.appendChild(stepLabel);
        stepsContainer.appendChild(stepEl);
      });
      
      // Bouton de validation
      const submitBtn = document.createElement('button');
      submitBtn.className = 'value-slider-submit';
      submitBtn.textContent = 'Confirmer';
      
      // Construction de la hiérarchie des éléments
      valueDisplayContainer.appendChild(subtitleEl);
      valueDisplayContainer.appendChild(valueEl);
      valueDisplayContainer.appendChild(unitEl);
      valueDisplayContainer.appendChild(descriptionEl);
      
      sliderContainer.appendChild(progressBar);
      sliderContainer.appendChild(sliderInput);
      
      container.appendChild(headerEl);
      container.appendChild(valueDisplayContainer);
      container.appendChild(sliderContainer);
      container.appendChild(stepsContainer);
      container.appendChild(submitBtn);
      
      // Styles CSS
      const style = document.createElement('style');
      style.textContent = `
        .value-slider-container {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          color: #333;
          padding: 1.5rem;
          border-radius: 12px;
          background-color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          width: 100%;
          box-sizing: border-box;
        }
        
        .value-slider-header {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
          text-align: center;
          color: #222;
        }
        
        .value-slider-value-display {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          font-size: 1.5rem;
          line-height: 1.5;
          text-align: center;
        }
        
        .value-slider-subtitle {
          margin-right: 0.5rem;
        }
        
        .value-slider-value {
          font-weight: 700;
          background-color: #F0F2F5;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          margin: 0 0.35rem;
        }
        
        .value-slider-description {
          margin-left: 0.5rem;
          font-weight: 600;
        }
        
        .value-slider-unit {
          margin-left: 0.35rem;
          margin-right: 0.5rem;
        }
        
        .value-slider-slider-container {
          position: relative;
          height: 6px;
          background-color: #E0E5EC;
          border-radius: 10px;
          margin: 2rem 0;
        }
        
        .value-slider-progress {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background-color: ${primaryColor};
          border-radius: 10px;
          pointer-events: none;
        }
        
        .value-slider-input {
          position: absolute;
          top: -8px;
          left: 0;
          width: 100%;
          height: 20px;
          appearance: none;
          background: transparent;
          outline: none;
          margin: 0;
          z-index: 2;
        }
        
        .value-slider-input::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background-color: white;
          border: 2px solid ${primaryColor};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .value-slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        
        .value-slider-input::-moz-range-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background-color: white;
          border: 2px solid ${primaryColor};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .value-slider-input::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
        
        .value-slider-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          position: relative;
          padding: 0 12px;
        }
        
        .value-slider-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
