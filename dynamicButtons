export const DynamicButtonMenuExtension = {
  name: 'DynamicButtonMenu',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_dynamicButtonMenu' || trace.payload?.name === 'ext_dynamicButtonMenu',
  render: ({ trace, element }) => {
    try {
      // On attend que le payload dynamique soit dans trace.payload.dynamicPayload
      // Il peut être sous forme de chaîne JSON ou d'objet
      const dynamicPayload =
        typeof trace.payload.dynamicPayload === 'string'
          ? JSON.parse(trace.payload.dynamicPayload)
          : trace.payload.dynamicPayload;
      
      // Création d'un conteneur principal
      const container = document.createElement('div');
      container.style.backgroundColor = `rgba(55, 120, 244, ${dynamicPayload.backgroundOpacity || 0.3})`;
      container.style.padding = '10px';
      container.style.borderRadius = '5px';
      
      // Création des boutons de navigation (optionnels)
      if (dynamicPayload.buttons && Array.isArray(dynamicPayload.buttons)) {
        const navContainer = document.createElement('div');
        navContainer.style.display = 'flex';
        navContainer.style.gap = '5px';
        dynamicPayload.buttons.forEach((btn) => {
          const button = document.createElement('button');
          button.textContent = btn.text;
          button.style.backgroundColor = dynamicPayload.buttonColor || '#3778F4';
          button.style.color = dynamicPayload.textColor || '#FFFFFF';
          button.style.border = 'none';
          button.style.borderRadius = '3px';
          button.style.padding = '5px 10px';
          button.addEventListener('click', () => {
            window.voiceflow.chat.interact({ type: 'complete', payload: { action: btn.path } });
          });
          navContainer.appendChild(button);
        });
        container.appendChild(navContainer);
      }
      
      // Création des sections
      if (dynamicPayload.sections && Array.isArray(dynamicPayload.sections)) {
        dynamicPayload.sections.forEach((section) => {
          // Conteneur de section
          const sectionContainer = document.createElement('div');
          sectionContainer.style.marginTop = '10px';
          
          // Libellé de la section
          if (section.label) {
            const label = document.createElement('div');
            label.textContent = section.label;
            label.style.fontWeight = 'bold';
            label.style.color = section.color || '#000000';
            label.style.marginBottom = '5px';
            sectionContainer.appendChild(label);
          }
          
          // Conteneur des options/boutons
          const optionsContainer = document.createElement('div');
          optionsContainer.style.display = 'flex';
          optionsContainer.style.flexWrap = 'wrap';
          optionsContainer.style.gap = '5px';
          
          if (section.options && Array.isArray(section.options)) {
            section.options.forEach((option) => {
              const optionButton = document.createElement('button');
              optionButton.textContent = option.name;
              optionButton.style.backgroundColor = dynamicPayload.buttonColor || '#3778F4';
              optionButton.style.color = dynamicPayload.textColor || '#FFFFFF';
              optionButton.style.border = 'none';
              optionButton.style.borderRadius = '3px';
              optionButton.style.padding = '5px 10px';
              // On utilise une opacité pour indiquer la sélection
              optionButton.style.opacity = '1';
              // Attribut pour suivre l'état de sélection
              optionButton.dataset.selected = 'false';
              
              optionButton.addEventListener('click', () => {
                if (!dynamicPayload.multiselect) {
                  // Mode single select : désélectionner tous les boutons de cette section
                  optionsContainer.querySelectorAll('button').forEach((btn) => {
                    btn.style.opacity = '1';
                    btn.dataset.selected = 'false';
                  });
                  optionButton.style.opacity = '0.6';
                  optionButton.dataset.selected = 'true';
                  // Retourner immédiatement la sélection
                  window.voiceflow.chat.interact({
                    type: 'complete',
                    payload: { selected: option.name, index: dynamicPayload.index },
                  });
                } else {
                  // Mode multi select : basculer l'état du bouton
                  const isSelected = optionButton.dataset.selected === 'true';
                  optionButton.dataset.selected = isSelected ? 'false' : 'true';
                  optionButton.style.opacity = isSelected ? '1' : '0.6';
                }
              });
              optionsContainer.appendChild(optionButton);
            });
          }
          sectionContainer.appendChild(optionsContainer);
          container.appendChild(sectionContainer);
        });
      }
      
      // Si le mode multi sélection est activé, ajouter un bouton de validation
      if (dynamicPayload.multiselect) {
        const submitButton = document.createElement('button');
        submitButton.textContent =
          (dynamicPayload.buttons &&
            dynamicPayload.buttons[0] &&
            dynamicPayload.buttons[0].text) ||
          'Submit';
        submitButton.style.backgroundColor = dynamicPayload.buttonColor || '#3778F4';
        submitButton.style.color = dynamicPayload.textColor || '#FFFFFF';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '3px';
        submitButton.style.padding = '5px 10px';
        submitButton.style.marginTop = '10px';
        submitButton.addEventListener('click', () => {
          const selectedOptions = [];
          // Recherche dans l'ensemble du conteneur des boutons sélectionnés
          container.querySelectorAll('button[data-selected="true"]').forEach((btn) => {
            selectedOptions.push(btn.textContent);
          });
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: { selected: selectedOptions, index: dynamicPayload.index },
          });
        });
        container.appendChild(submitButton);
      }
      
      element.appendChild(container);
    } catch (error) {
      console.error('DynamicButtonMenuExtension – Erreur lors du rendu:', error);
      element.textContent = 'Erreur lors du rendu du menu dynamique.';
    }
  },
};
