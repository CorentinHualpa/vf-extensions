/**
 * ValueSlider - Extension Voiceflow
 * 
 * Cette extension affiche un slider personnalisable permettant de sélectionner une valeur 
 * et de voir une description correspondante.
 * 
 * Paramètres du payload:
 * - title: Titre principal (peut contenir du HTML)
 * - subtitle: Texte avant la valeur sélectionnée (peut contenir du HTML)
 * - descriptions: Tableau d'objets {value, text} pour les descriptions selon la valeur (text peut contenir du HTML)
 * - min: Valeur minimale
 * - max: Valeur maximale
 * - steps: Tableau des valeurs à afficher sous le slider
 * - defaultValue: Valeur par défaut sélectionnée
 * - primaryColor: Couleur principale (par défaut: #3778F4)
 * - unit: Unité à afficher après la valeur (peut contenir du HTML)
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
        unit = '',
        chatDisabledText = '🚫 Veuillez faire une sélection'
      } = payload;
      
      // Récupérer le root pour accéder au chat
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      
      // Fonctions pour gérer le chat
      function disableChat() {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '.5';
        ic.style.cursor = 'not-allowed';
        ic.setAttribute('title', chatDisabledText);
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = true; ta.setAttribute('title', chatDisabledText); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = true; snd.setAttribute('title', chatDisabledText); }
      }
      
      function enableChat() {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '';
        ic.style.cursor = '';
        ic.removeAttribute('title');
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = false; ta.removeAttribute('title'); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = false; snd.removeAttribute('title'); }
      }
      
      // Désactiver le chat dès l'affichage du slider
      disableChat();
      
      // Création du conteneur principal
      const container = document.createElement('div');
      container.className = 'value-slider-container';
      
      // Définir la largeur à 100% sur l'élément parent
      if (element && element.parentElement) {
        element.style.width = '100%';
        element.style.maxWidth = '100%';
        element.style.boxSizing = 'border-box';
      }
      
      // Création des éléments HTML
      const headerEl = document.createElement('h2');
      headerEl.className = 'value-slider-header';
      // Utiliser innerHTML pour interpréter le HTML dans le titre
      headerEl.innerHTML = title;
      
      const valueDisplayContainer = document.createElement('div');
      valueDisplayContainer.className = 'value-slider-value-display';
      
      const subtitleEl = document.createElement('span');
      subtitleEl.className = 'value-slider-subtitle';
      // Utiliser innerHTML pour interpréter le HTML dans le sous-titre
      subtitleEl.innerHTML = subtitle;
      
      // Créer un conteneur à largeur fixe pour la valeur
      const valueContainer = document.createElement('div');
      valueContainer.className = 'value-slider-value-container';
      
      const valueEl = document.createElement('span');
      valueEl.className = 'value-slider-value';
      
      const descriptionEl = document.createElement('span');
      descriptionEl.className = 'value-slider-description';
      
      const unitEl = document.createElement('span');
      unitEl.className = 'value-slider-unit';
      // Utiliser innerHTML pour interpréter le HTML dans l'unité
      unitEl.innerHTML = unit;
      
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
        // Pour les steps, on peut garder textContent car ce sont des valeurs numériques
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
      valueContainer.appendChild(valueEl); // Mettre valueEl dans valueContainer
      valueDisplayContainer.appendChild(valueContainer);
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
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
          margin: 0;
          padding: 1.5rem;
          transition: opacity 0.3s ease;
          display: block;
          overflow: hidden;
        }
        
        /* État désactivé après confirmation */
        .value-slider-container.disabled {
          opacity: 0.6;
          pointer-events: none;
          filter: grayscale(70%);
          user-select: none;
        }
        
        .value-slider-header {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
          text-align: center;
          color: #222;
          width: 100%;
          display: block;
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
          width: 100%;
        }
        
        .value-slider-subtitle {
          margin-right: 0.5rem;
        }
        
        /* Conteneur de valeur à largeur fixe */
        .value-slider-value-container {
          display: inline-block;
          min-width: 100px; /* Largeur minimale fixe */
          text-align: center;
        }
        
        .value-slider-value {
          font-family: 'Roboto Mono', monospace; /* Police monospace pour que tous les chiffres aient la même largeur */
          font-weight: 700;
          background-color: #F0F2F5;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          margin: 0 0.35rem;
          display: inline-block;
          min-width: 60px; /* Largeur minimale pour contenir les plus grands nombres */
          text-align: center;
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
          width: 100%;
          left: 0;
          right: 0;
          box-sizing: border-box;
          overflow: visible;
        }
        
        .value-slider-progress {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background-color: ${primaryColor};
          border-radius: 10px;
          pointer-events: none;
          width: 0; /* Sera défini dynamiquement */
          max-width: 100%;
        }
        
        .value-slider-input {
          position: absolute;
          top: -8px;
          left: 0;
          width: 100%;
          height: 20px;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          outline: none;
          margin: 0;
          padding: 0;
          z-index: 2;
          box-sizing: border-box;
        }
        
        .value-slider-input::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
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
          width: 100%;
          box-sizing: border-box;
          overflow: visible;
        }
        
        .value-slider-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        
        .value-slider-step-label {
          font-size: 0.85rem;
          color: #666;
          padding-top: 0.5rem;
        }
        
        .value-slider-submit {
          display: block;
          width: 100%;
          max-width: 200px;
          margin: 1rem auto 0;
          padding: 0.75rem 1.5rem;
          background-color: ${primaryColor};
          color: white;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(55, 120, 244, 0.25);
          position: relative;
        }
        
        .value-slider-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(55, 120, 244, 0.35);
        }
        
        .value-slider-submit:active {
          transform: translateY(0);
        }
      `;
      
      container.appendChild(style);
      
      // Fonctions de mise à jour
      function updateSliderProgress() {
        const percentage = ((sliderInput.value - min) / (max - min)) * 100;
        progressBar.style.width = `${percentage}%`;
      }
      
      function getClosestDescription(value) {
        if (!descriptions.length) return '';
        
        // Trier les descriptions par différence absolue avec la valeur actuelle
        const closest = [...descriptions].sort((a, b) => {
          return Math.abs(a.value - value) - Math.abs(b.value - value);
        })[0];
        
        return closest.text;
      }
      
      function updateDisplay() {
        const value = parseInt(sliderInput.value, 10);
        valueEl.textContent = value;
        // Utiliser innerHTML pour interpréter le HTML dans la description
        descriptionEl.innerHTML = getClosestDescription(value);
        updateSliderProgress();
      }

       // Initialisation
      updateDisplay();
      
      // Événements
      sliderInput.addEventListener('input', updateDisplay);
      
      submitBtn.addEventListener('click', () => {
        const selectedValue = parseInt(sliderInput.value, 10);
        const selectedDescription = getClosestDescription(selectedValue);
        
        // Désactiver le slider (ajouter la classe disabled)
        container.classList.add('disabled');
        
        // Désactiver explicitement les éléments interactifs
        sliderInput.disabled = true;
        submitBtn.disabled = true;
        
        // Réactiver le chat
        enableChat();
        
        // Envoi des données à Voiceflow
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            value: selectedValue,
            description: selectedDescription,
            unit: unit,
            formatted: `${selectedValue} ${unit} ${selectedDescription}`
          }
        });
      });
      
      // Gestion de la largeur totale
      function updateSliderWidth() {
        // Forcer la largeur à 100% du parent
        if (container.parentElement) {
          container.style.width = '100%';
        }
      }
      
      // Appliquer immédiatement et à chaque redimensionnement
      updateSliderWidth();
      window.addEventListener('resize', updateSliderWidth);
      
      // Ajout au DOM
      element.appendChild(container);
      
      // Retourner une fonction de nettoyage pour supprimer l'écouteur d'événements
      return () => {
        window.removeEventListener('resize', updateSliderWidth);
      };
      
    } catch (error) {
      console.error('Erreur dans l\'extension ValueSlider:', error);
      
      // Formulaire de secours en cas d'erreur
      const errorMsg = document.createElement('div');
      errorMsg.innerHTML = `
        <div style="color: #721c24; background-color: #f8d7da; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p>Une erreur est survenue lors du chargement du slider. Veuillez saisir votre valeur manuellement:</p>
          <input type="number" id="value-slider-fallback" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ccc; border-radius: 4px;">
          <button id="value-slider-fallback-btn" style="background: #3778F4; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Confirmer</button>
        </div>
      `;
      
      element.appendChild(errorMsg);
      
      document.getElementById('value-slider-fallback-btn').addEventListener('click', () => {
        const value = document.getElementById('value-slider-fallback').value;
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: { value: parseInt(value, 10) }
        });
      });
    }
  }
};

// Exportation par défaut également
export default ValueSlider;
