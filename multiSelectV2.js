export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },
  render: ({ trace, element }) => {
    try {
      console.log("Démarrage du rendu MultiSelect (gestion dernier niveau sélectionnable)");

      // Récupérer les données depuis le payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        textColor = '#FFFFFF',
        backgroundOpacity = 0.8,
        index = 1,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      let totalChecked = 0;
      let userInputValues = {};
      let hasUserInputField = false;  // Pour les champs "user_input"

      // Créer un container principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Calculer le nombre total d’options (peu importe le niveau)
      const countOptionsRecursive = (options) => {
        return options.reduce((acc, opt) => {
          let sousTotal = (opt.children && Array.isArray(opt.children)) ? countOptionsRecursive(opt.children) : 0;
          return acc + 1 + sousTotal;
        }, 0);
      };
      let totalOptions = 0;
      sections.forEach(section => {
        if (Array.isArray(section.options)) {
          totalOptions += countOptionsRecursive(section.options);
        }
      });

      // Ajouter les styles CSS avec les modifications pour éviter les débordements
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .multiselect-container {
          width: 100%;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          max-width: 100%;
          margin: 0 auto;
          font-size: 0.9em;
        }
        .multiselect-container * {
          box-sizing: border-box;
        }
        
        /* Grille pour les sections principales */
        .multiselect-container .sections-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
        }
        @media (max-width: 500px) {
          .multiselect-container .sections-grid {
            grid-template-columns: 1fr;
          }
          .multiselect-container .options-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        /* Style des sections */
        .multiselect-container .section-container {
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #673AB7;
          border: 1px solid rgba(255, 255, 255, 0.2);
          /* Empêche le contenu de déborder horizontalement : */
          overflow-x: hidden;
          position: relative;
        }
        
        .multiselect-container .section-title {
          color: white;
          font-size: 1em;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
        }
        
        /* Liste d'options et grille */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          flex-grow: 1;
        }
        .multiselect-container .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          width: 100%;
          flex-grow: 1;
        }
        
        /* Conteneurs d'options */
        .multiselect-container .option-container {
          display: flex;
          flex-direction: column;
          margin: 0;
          width: 100%;
        }
        
        /* Options sélectionnables (dernier niveau) */
        .multiselect-container input[type="checkbox"],
        .multiselect-container input[type="radio"] {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          margin-right: 6px;
          cursor: pointer;
          accent-color: ${buttonColor};
          margin-top: 6px;
        }
        .multiselect-container .option-container.selectable label {
          cursor: pointer;
          font-size: 0.85em;
          border-radius: 4px;
          padding: 6px 8px;
          color: white;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          display: block;
          width: 100%;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          /* Empêcher le label de sortir du conteneur */
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          min-height: 31px;
          font-weight: 500;
          line-height: 1.3;
          max-width: 100%;
        }
        .multiselect-container .option-container.selectable label:hover {
          background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }
        .multiselect-container input:checked + label {
          background-color: ${buttonColor};
          border-color: white;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .multiselect-container input:disabled + label {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Styles pour les niveaux imbriqués - marges réduites */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 10px; /* Réduction pour éviter le débordement */
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 15px; /* Réduction pour éviter le débordement */
        }
        
        /* Options non-sélectionnables (niveaux intermédiaires) */
        .multiselect-container .option-container.non-selectable span {
          cursor: default;
          color: #fff;
          background-color: rgba(0, 0, 0, 0.3);
          opacity: 1;
          padding: 6px 8px;
          font-size: 0.85em;
          font-weight: bold;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          user-select: none;
          display: block;
          transition: all 0.2s ease;
          min-height: 31px;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }
        
        .multiselect-container .children-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        /* Styles des boutons */
        .multiselect-container .buttons-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
          flex-wrap: wrap;
        }
        .multiselect-container .submit-btn {
          background: ${buttonColor};
          color: white;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          border: none;
          font-weight: 600;
          font-size: 0.9em;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          text-align: center;
          min-width: 130px;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
        }
        .multiselect-container .submit-btn:active {
          transform: translateY(0);
        }
        
        /* Styles pour les champs user_input */
        .multiselect-container .user-input-container {
          margin-top: 10px;
          margin-bottom: 8px;
          width: 100%;
          grid-column: 1 / -1;
        }
        .multiselect-container .user-input-label {
          display: block;
          margin-bottom: 6px;
          color: white;
          font-weight: 500;
          font-size: 0.85em;
          line-height: 1.3;
        }
        .multiselect-container .user-input-field {
          width: 100%;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 0.85em;
          transition: all 0.2s ease;
          background-color: rgba(255, 255, 255, 0.9);
        }
        .multiselect-container .user-input-field:focus {
          border-color: ${buttonColor};
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        .multiselect-container .error-message {
          color: #ffcc00;
          font-size: 0.75em;
          margin-top: 4px;
          display: block;
        }
      `;
      container.appendChild(styleElement);

      // Fonction récursive pour créer les éléments d'option
      // Seule une option sans children (dernier niveau) est sélectionnable.
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = option.children && Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren;  // Pas d'enfants => dernier niveau => cliquable

        if (isSelectable) {
          optionDiv.classList.add('selectable');
          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          input.name = `option-${sectionLabel}`;
          const sanitizedOptionName = option.name.replace(/<[^>]*>/g, '').replace(/\s+/g, '-');
          input.id = `${sectionLabel}-${sanitizedOptionName}-l${level}`;

          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.innerHTML = option.name;
          label.title = option.name.replace(/<[^>]*>/g, '');
          
          optionDiv.appendChild(input);
          optionDiv.appendChild(label);

          // Mise à jour du total coché
          input.addEventListener('change', () => {
            updateTotalChecked();
            // Si pas multiselect, on envoie immédiatement le choix
            if (!multiselect) {
              console.log("Envoi de sélection simple:", option.name);
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  selection: option.name,
                  buttonPath: 'Default'
                }
              });
            }
          });
        } else {
          // Option non-sélectionnable (ayant des children)
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name;
          span.title = option.name.replace(/<[^>]*>/g, '');
          optionDiv.appendChild(span);
        }

        // Enfants éventuels
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.classList.add('children-options');
          option.children.forEach(child => {
            const childElement = createOptionElement(child, level + 1, sectionLabel);
            childrenContainer.appendChild(childElement);
          });
          optionDiv.appendChild(childrenContainer);
        }
        return optionDiv;
      };

      // Fonction qui récupère les détails des cases cochées (options du dernier niveau)
      const getCheckedDetails = () => {
        const checkedInputs = Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(input => input.checked);
        const details = checkedInputs.map(input => {
          const optionText = input.nextElementSibling ? input.nextElementSibling.innerHTML : '';
          return optionText;
        });
        return details;
      };

      // Mise à jour du nombre de cases cochées (et désactivation si max atteint)
      const updateTotalChecked = () => {
        const allCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        totalChecked = allCheckboxes.filter(cb => cb.checked).length;
        
        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          allCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
              checkbox.disabled = true;
            }
          });
        } else {
          allCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
          });
        }
      };

      // Vérifier la présence de champs "user_input"
      sections.forEach(section => {
        if (Array.isArray(section.options)) {
          section.options.forEach(option => {
            if (option.action === 'user_input') {
              hasUserInputField = true;
            }
          });
        }
      });

      // Créer le conteneur grid pour les sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      // Boucler sur chaque section
      sections.forEach((section, sectionIndex) => {
        const { maxSelect = 200 } = section;
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');
        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }
        
        const sectionLabel = document.createElement('h3');
        sectionLabel.classList.add('section-title');
        sectionLabel.textContent = section.label;
        sectionDiv.appendChild(sectionLabel);
        
        const sectionOptionsCount = Array.isArray(section.options) ? section.options.length : 0;
        const optionsContainer = document.createElement('div');
        // Si la section a plus de 10 options, on l'affiche en grille 2 colonnes
        optionsContainer.classList.add(sectionOptionsCount > 10 ? 'options-grid' : 'options-list');

        if (Array.isArray(section.options)) {
          const standardOptions = section.options.filter(option => option.action !== 'user_input');
          standardOptions.forEach(option => {
            const optionElement = createOptionElement(option, 1, section.label);
            optionsContainer.appendChild(optionElement);
          });
          
          // Ajouter les champs "user_input", le cas échéant
          const userInputOptions = section.options.filter(option => option.action === 'user_input');
          userInputOptions.forEach(option => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');
            
            const userInputLabel = document.createElement('label');
            userInputLabel.classList.add('user-input-label');
            userInputLabel.textContent = option.label || 'Indiquez votre option si aucune ne correspond';
            
            const userInputField = document.createElement('input');
            userInputField.type = 'text';
            userInputField.classList.add('user-input-field');
            userInputField.placeholder = option.placeholder || 'Saisissez votre texte ici...';
            userInputField.id = `${section.label}-user-input-${section.id || ''}`;
            
            userInputValues[userInputField.id] = '';
            userInputField.addEventListener('input', (e) => {
              userInputValues[userInputField.id] = e.target.value;
            });
            
            userInputDiv.appendChild(userInputLabel);
            userInputDiv.appendChild(userInputField);
            optionsContainer.appendChild(userInputDiv);
          });
        }

        sectionDiv.appendChild(optionsContainer);
        sectionsGrid.appendChild(sectionDiv);
      });

      container.appendChild(sectionsGrid);

      // Ajout des boutons de validation
      if (buttons && buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-index', index);
        buttonContainer.classList.add('buttons-container');

        buttons.forEach(button => {
          const buttonElement = document.createElement('button');
          buttonElement.classList.add('submit-btn');
          buttonElement.textContent = button.text;

          buttonElement.addEventListener('click', () => {
            // Récupérer les sélections
            const selectedOptions = sections.map((section, idx) => {
              const sectionElement = container.querySelectorAll('.section-container')[idx];
              if (!sectionElement) return null;
              const selections = Array.from(sectionElement.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
                return cb.nextElementSibling ? cb.nextElementSibling.innerHTML : '';
              });
              
              const userInputId = `${section.label}-user-input-${section.id || ''}`;
              const userInputValue = userInputValues[userInputId] !== undefined ? userInputValues[userInputId] : "";
              
              return {
                section: section.label,
                selections,
                userInput: userInputValue.trim()
              };
            }).filter(section => section && (section.selections.length > 0 || section.userInput));

            // Masquer tous les boutons après le clic
            buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
              btn.style.display = 'none';
            });
            
            console.log("Envoi des sélections:", selectedOptions);
            
            let payloadData = {};
            const buttonPath = button.path || 'Default';
            
            // Cas avec un unique userInput
            if (selectedOptions.length === 1 &&
                selectedOptions[0].selections.length === 0 &&
                selectedOptions[0].userInput !== "") {
              payloadData = {
                userInput: selectedOptions[0].userInput,
                buttonText: button.text,
                buttonPath: buttonPath,
                isEmpty: false,
                isUserInput: true
              };
            } else if (selectedOptions.length > 0) {
              // Cas standard avec sélections
              payloadData = {
                selections: selectedOptions,
                buttonText: button.text,
                buttonPath: buttonPath,
                isEmpty: false,
                isUserInput: false
              };
            } else {
              // Cas sans sélection
              payloadData = {
                buttonText: button.text,
                buttonPath: buttonPath,
                isEmpty: true
              };
            }
            
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: payloadData
            });
          });

          buttonContainer.appendChild(buttonElement);
        });

        container.appendChild(buttonContainer);
      }

      // Ajouter le conteneur principal à l'élément parent
      element.appendChild(container);
      console.log("Rendu MultiSelect terminé avec", totalOptions, "options au total");
      
    } catch (error) {
      console.error('Erreur lors du rendu de MultiSelect:', error);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          error: true,
          message: error.message
        }
      });
    }
  },
};
