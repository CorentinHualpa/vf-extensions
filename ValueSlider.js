/**
 * ValueSlider - Extension Voiceflow Améliorée
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
 * - submitText: Texte du bouton de confirmation (défaut: "Confirmer")
 * - submitPath: Chemin à suivre lors de la confirmation (défaut: "Select_Continue")
 * - backText: Texte du bouton retour (facultatif)
 * - backPath: Chemin à suivre pour le retour (défaut: "Previous_step")
 * - instanceId: Identifiant unique pour cette instance (facultatif, généré automatiquement sinon)
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
        chatDisabledText = '🚫 Veuillez faire une sélection',
        submitText = 'Confirmer',
        submitPath = 'Select_Continue',
        backText = null,  // Null si pas de bouton retour
        backPath = 'Previous_step',
        instanceId = null // Identifiant fourni dans le payload (facultatif)
      } = payload;
      
      // Générer un identifiant unique pour cette instance
      const uniqueInstanceId = instanceId || `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variable pour suivre si le slider a été soumis
      let isSubmitted = false;
      
      // Récupérer le root pour accéder au chat
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      
      // Fonctions pour gérer le chat
      function disableChat() {
        // Ne pas désactiver si déjà soumis
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
      }
      
      function enableChat() {
        // Marquer comme soumis pour éviter une désactivation future
        isSubmitted = true;
        
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        
        // Force réinitialisation complète des styles
        ic.style.removeProperty('opacity');
        ic.style.removeProperty('cursor');
        ic.removeAttribute('title');
        
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { 
          ta.disabled = false; 
          ta.removeAttribute('title');
          // Assure-toi que le textarea est prêt à recevoir la saisie
          ta.style.pointerEvents = 'auto';
        }
        
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { 
          snd.disabled = false;
          snd.removeAttribute('title');
          // Assure-toi que le bouton est prêt à être cliqué
          snd.style.pointerEvents = 'auto';
        }
        
        // S'assurer que tous les contrôles sont vraiment activés
        setTimeout(() => {
          if (ta) ta.disabled = false;
          if (snd) snd.disabled = false;
          // Vérifier aussi si d'autres éléments du chat sont désactivés
          const chatElements = host.querySelectorAll('.vfrc-chat-input, #vfrc-send-message, .vfrc-input-container *');
          chatElements.forEach(elem => {
            if (elem) {
              elem.disabled = false;
              elem.style.pointerEvents = 'auto';
            }
          });
        }, 100);
      }
      
      // Désactiver le chat dès l'affichage du slider
      disableChat();

      // Création du conteneur principal avec ID unique
      const container = document.createElement('div');
      container.className = 'value-slider-container';
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);
      
      // Définir la largeur à 100% sur l'élément parent
      if (element && element.parentElement) {
        element.style.width = '100%';
        element.style.maxWidth = '100%';
        element.style.boxSizing = 'border-box';
      }
      
      // Extraction des valeurs RGB pour les variables CSS
      const hexToRgba = (hex, opacity) => {
        const num = parseInt(hex.replace('#',''), 16);
        const r = num >> 16;
        const g = (num >> 8) & 0xFF;
        const b = num & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };
      
      const primaryRgb = parseInt(primaryColor.replace('#',''), 16);
      const primaryR = (primaryRgb >> 16) & 255;
      const primaryG = (primaryRgb >> 8) & 255;
      const primaryB = primaryRgb & 255;
      
      // Création des éléments HTML
      const headerEl = document.createElement('h2');
      headerEl.className = 'value-slider-header';
      headerEl.innerHTML = title;
      
      const valueDisplayContainer = document.createElement('div');
      valueDisplayContainer.className = 'value-slider-value-display';
      
      const subtitleEl = document.createElement('span');
      subtitleEl.className = 'value-slider-subtitle';
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
        stepLabel.textContent = step;
        
        stepEl.appendChild(stepLabel);
        stepsContainer.appendChild(stepEl);
      });

      // Conteneur pour les boutons (comme dans MultiSelect)
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'value-slider-buttons-container';
      buttonsContainer.id = `buttons-container-${uniqueInstanceId}`;
      
      // Bouton de validation
      const submitBtnWrapper = document.createElement('div');
      submitBtnWrapper.className = 'value-slider-button-wrapper';
      
      const submitBtn = document.createElement('button');
      submitBtn.className = 'value-slider-submit';
      submitBtn.textContent = submitText;
      submitBtn.id = `submit-btn-${uniqueInstanceId}`;
      submitBtn.setAttribute('data-path', submitPath);
      
      submitBtnWrapper.appendChild(submitBtn);
      buttonsContainer.appendChild(submitBtnWrapper);
      
      // Bouton de retour (optionnel)
      if (backText) {
        const backBtnWrapper = document.createElement('div');
        backBtnWrapper.className = 'value-slider-button-wrapper';
        
        const backBtn = document.createElement('button');
        backBtn.className = 'value-slider-back';
        backBtn.textContent = backText;
        backBtn.id = `back-btn-${uniqueInstanceId}`;
        backBtn.setAttribute('data-path', backPath);
        
        backBtnWrapper.appendChild(backBtn);
        buttonsContainer.appendChild(backBtnWrapper);
      }
      
      // Construction de la hiérarchie des éléments
      valueDisplayContainer.appendChild(subtitleEl);
      valueContainer.appendChild(valueEl);
      valueDisplayContainer.appendChild(valueContainer);
      valueDisplayContainer.appendChild(unitEl);
      valueDisplayContainer.appendChild(descriptionEl);
      
      sliderContainer.appendChild(progressBar);
      sliderContainer.appendChild(sliderInput);
      
      container.appendChild(headerEl);
      container.appendChild(valueDisplayContainer);
      container.appendChild(sliderContainer);
      container.appendChild(stepsContainer);
      container.appendChild(buttonsContainer);
      
      // Styles CSS harmonisés avec MultiSelect
      const style = document.createElement('style');
      style.textContent = `
        .value-slider-container {
          --vs-primary: ${primaryColor};
          --vs-primary-r: ${primaryR};
          --vs-primary-g: ${primaryG};
          --vs-primary-b: ${primaryB};
          --vs-accent: ${primaryColor};
          --vs-hover-bg: ${hexToRgba(primaryColor, 0.3)};
          --vs-radius: 10px;
          --vs-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          --vs-heading-fs: 18px;
          --vs-base-fs: 15px;
          --vs-small-fs: 14px;
          
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
          color: #fff !important;
          padding: 1.5rem !important;
          border-radius: 12px !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          background: linear-gradient(135deg, ${hexToRgba(primaryColor, 0.85)}, ${hexToRgba(primaryColor, 0.65)}) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          transition: all 0.3s ease !important;
          display: block !important;
          overflow: hidden !important;
          position: relative !important;
        }
        
        .value-slider-container:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* État désactivé après confirmation */
        .value-slider-container.disabled {
          opacity: 0.6 !important;
          pointer-events: none !important;
          filter: grayscale(30%) !important;
          user-select: none !important;
          transform: none !important;
        }
        
        .value-slider-header {
          font-size: var(--vs-heading-fs) !important;
          font-weight: 700 !important;
          margin: 0 0 1.5rem 0 !important;
          text-align: center !important;
          color: #fff !important;
          width: 100% !important;
          display: block !important;
          letter-spacing: -0.3px !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          position: relative !important;
          overflow: hidden !important;
          padding-bottom: 10px !important;
        }
        
        .value-slider-header::before {
          content: '' !important;
          position: absolute !important;
          left: 0 !important;
          bottom: 0 !important;
          width: 60px !important;
          height: 2px !important;
          background: #FFFFFF !important;
          transition: width 0.3s ease !important;
        }
        
        .value-slider-container:hover .value-slider-header::before {
          width: 100% !important;
        }
        
        .value-slider-value-display {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          margin-bottom: 2rem !important;
          font-size: 1.1rem !important;
          line-height: 1.5 !important;
          text-align: center !important;
          width: 100% !important;
        }
        
        .value-slider-subtitle {
          margin-right: 0.5rem !important;
        }
        
        /* Conteneur de valeur à largeur fixe */
        .value-slider-value-container {
          display: inline-block !important;
          min-width: 100px !important; /* Largeur minimale fixe */
          text-align: center !important;
        }
        
        .value-slider-value {
          font-family: 'Roboto Mono', monospace !important; /* Police monospace pour que tous les chiffres aient la même largeur */
          font-weight: 700 !important;
          background-color: rgba(0, 0, 0, 0.2) !important;
          padding: 0.25rem 0.75rem !important;
          border-radius: 50px !important;
          margin: 0 0.35rem !important;
          display: inline-block !important;
          min-width: 60px !important; /* Largeur minimale pour contenir les plus grands nombres */
          text-align: center !important;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .value-slider-description {
          margin-left: 0.5rem !important;
          font-weight: 600 !important;
        }
        
        .value-slider-unit {
          margin-left: 0.35rem !important;
          margin-right: 0.5rem !important;
        }
        
        .value-slider-slider-container {
          position: relative !important;
          height: 8px !important;
          background-color: rgba(0, 0, 0, 0.25) !important;
          border-radius: 10px !important;
          margin: 2rem 0 !important;
          width: 100% !important;
          left: 0 !important;
          right: 0 !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .value-slider-progress {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          height: 100% !important;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3)) !important;
          border-radius: 10px !important;
          pointer-events: none !important;
          width: 0 !important; /* Sera défini dynamiquement */
          max-width: 100% !important;
        }
        
        .value-slider-input {
          position: absolute !important;
          top: -8px !important;
          left: 0 !important;
          width: 100% !important;
          height: 24px !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          background: transparent !important;
          outline: none !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 2 !important;
          box-sizing: border-box !important;
        }
        
        .value-slider-input::-webkit-slider-thumb {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 24px !important;
          height: 24px !important;
          background-color: white !important;
          border: 2px solid rgba(var(--vs-primary-r), var(--vs-primary-g), var(--vs-primary-b), 0.8) !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
          transition: all 0.2s ease !important;
        }
        
        .value-slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.15) !important;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
        }
        
        .value-slider-input::-moz-range-thumb {
          appearance: none !important;
          width: 20px !important;
          height: 20px !important;
          background-color: white !important;
          border: 2px solid rgba(var(--vs-primary-r), var(--vs-primary-g), var(--vs-primary-b), 0.8) !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
          transition: all 0.2s ease !important;
        }
        
        .value-slider-input::-moz-range-thumb:hover {
          transform: scale(1.15) !important;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
        }
        
        .value-slider-steps {
          display: flex !important;
          justify-content: space-between !important;
          margin-bottom: 2rem !important;
          position: relative !important;
          padding: 0 12px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        
        .value-slider-step {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          position: relative !important;
          flex: 1 !important;
        }
        
        .value-slider-step-label {
          font-size: var(--vs-small-fs) !important;
          color: rgba(255, 255, 255, 0.9) !important;
          padding-top: 0.5rem !important;
          font-weight: 600 !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
        }
        
        /* Conteneur de boutons */
        .value-slider-buttons-container {
          display: flex !important;
          justify-content: center !important;
          gap: 16px !important;
          padding: 1rem 0 0 !important;
          width: 100% !important;
        }
        
        .value-slider-button-wrapper {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        
        /* BOUTONS CORPORATES/SCI-FI - STYLE COHÉRENT AVEC MULTISELECT */
        .value-slider-submit, .value-slider-back {
          position: relative !important;
          color: #fff !important;
          padding: 10px 24px !important; 
          border-radius: 8px !important;
          font-weight: 700 !important; 
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
          font-size: 14px !important;
          cursor: pointer !important;
          border: none !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                    inset 0 3px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -3px 0 rgba(0, 0, 0, 0.2) !important;
        }
        
        /* Bouton de validation (principal) */
        .value-slider-submit {
          background: linear-gradient(145deg, #FFFFFF, rgba(255, 255, 255, 0.8)) !important;
          color: var(--vs-primary) !important;
          min-width: 160px !important;
        }
        
        /* Bouton retour (secondaire) */
        .value-slider-back {
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)) !important;
          min-width: 160px !important;
        }
        
        /* Effet hover */
        .value-slider-submit:hover, .value-slider-back:hover {
          transform: translateY(-2px) !important;
        }
        
        .value-slider-submit:hover {
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2),
                    inset 0 3px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -3px 0 rgba(0, 0, 0, 0.1) !important;
        }
        
        .value-slider-back:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
                    inset 0 3px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -3px 0 rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Effet active (clic) */
        .value-slider-submit:active, .value-slider-back:active {
          transform: translateY(1px) !important;
        }
        
        .value-slider-submit:active {
          box-shadow: 0 2px 6px rgba(255, 255, 255, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1) !important;
        }
        
        .value-slider-back:active {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Effet de scan sci-fi */
        .value-slider-submit::before, .value-slider-back::before {
          content: '' !important;
          position: absolute !important;
          top: -2px !important;
          left: -2px !important;
          width: calc(100% + 4px) !important;
          height: calc(100% + 4px) !important;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent) !important;
          transform: translateX(-100%) rotate(45deg) !important;
          transition: transform 0.8s ease !important;
        }
        
        .value-slider-submit:hover::before, .value-slider-back:hover::before {
          transform: translateX(100%) rotate(45deg) !important;
        }
        
        /* Effet de pulse */
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        
        .value-slider-submit:focus {
          animation: pulse 1.5s infinite !important;
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
      
      // Fonction pour envoyer la réponse à Voiceflow
      function sendResponse(path) {
        const selectedValue = parseInt(sliderInput.value, 10);
        const selectedDescription = getClosestDescription(selectedValue);
        
        // Désactiver le slider (ajouter la classe disabled)
        container.classList.add('disabled');
        
        // Désactiver explicitement les éléments interactifs
        sliderInput.disabled = true;
        const allButtons = container.querySelectorAll('button');
        allButtons.forEach(btn => btn.disabled = true);
        
        // IMPORTANT: Réactiver le chat AVANT d'envoyer l'interaction
        enableChat();
        
        // Attendre un court moment pour s'assurer que le chat est bien réactivé
        setTimeout(() => {
          // Envoi des données à Voiceflow avec les informations complètes
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              value: selectedValue,
              description: selectedDescription,
              unit: unit,
              formatted: `${selectedValue} ${unit} ${selectedDescription}`,
              buttonPath: path, // Important: chemin pour le routing dans le script
              instanceId: uniqueInstanceId // Ajouter l'ID unique dans le payload
            }
          });
          
          // S'assurer à nouveau que le chat est réactivé après l'envoi
          setTimeout(enableChat, 300);
        }, 100);
      }
      
      // Gestionnaire d'événements pour le bouton de soumission
      submitBtn.addEventListener('click', () => {
        sendResponse(submitPath);
      });
      
      // Gestionnaire d'événements pour le bouton de retour (si présent)
      if (backText) {
        const backBtn = container.querySelector(`#back-btn-${uniqueInstanceId}`);
        if (backBtn) {
          backBtn.addEventListener('click', () => {
            sendResponse(backPath);
          });
        }
      }
      
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
        <div style="color: #fff; background-color: rgba(220, 53, 69, 0.8); padding: 1rem; border-radius: 8px; margin: 1rem 0; backdrop-filter: blur(5px);">
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
