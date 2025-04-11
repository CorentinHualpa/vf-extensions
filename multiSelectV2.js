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

      // Ajouter les styles CSS adaptés
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
          overflow-x: hidden;
          position: relative;
        }
        
        .multiselect-container .section-title {
          /* On n'utilise plus textContent mais innerHTML pour interpréter le <h2>, <h3>, etc. */
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
        
        /* Alignement input + label sur la même ligne (niveau 3) */
        .multiselect-container .option-container.selectable {
          display: flex;
          align-items: center; /* Aligne la case et le texte au milieu */
        }
        
        /* On retire le display: block et width:100% sur le label pour le laisser sur la même ligne que l'input */
        .multiselect-container .option-container.selectable label {
          display: inline-flex;
          align-items: center;
          margin-left: 6px;  /* léger espacement entre la case et le texte */
          cursor: pointer;
          font-size: 0.85em;
          border-radius: 4px;
          padding: 4px 6px;
          color: white;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
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
        
        .multiselect-container input[type="checkbox"],
        .multiselect-container input[type="radio"] {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          cursor: pointer;
          accent-color: ${buttonColor};
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
          margin-left: 10px;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 15px;
        }
        
        /* Options non-sélectionnables (niveaux intermédiaires) */
        .multiselect-container .option-container.non-selectable {
          display: block;
        }
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
          display: inline-block;
          transition: all 0.2s ease;
          min-height: 31px;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
          margin-bottom: 6px;
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
        const isSelectable = !hasChildren; // dernier niveau => cliquable

        if (isSelectable) {
          optionDiv.classList.add('selectable');
          
          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          input.name = `option-${sectionLabel}`;
          
          // Nettoyage des balises pour créer un id convenable
          const sanitizedOptionName = option.name.replace(/<[^>]*>/g, '').replace(/\s+/g, '-');
          input.id = `${sectionLabel}-${sanitizedOptionName}-l${level}`;

          // label
          const label = document.createElement('label');
          // On interprète l'HTML dans option.name :
          label.innerHTML = option.name; 
          label.setAttribute('for', input.id);

          // Ajouts DOM
          optionDiv.appendChild(input);
          optionDiv.appendChild(label);

          // Event : mise à jour du total coché
          input.addEventListener('change', () => {
            updateTotalChecked();
            // Si pas multiselect, on envoie immédiatement
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
          // On interprète l'HTML dans option.name :
          span.innerHTML = option.name;
          optionDiv.appendChild(span);
        }

        // Générer récursivement les children
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

      // Fonction qui récupère les détails des cases cochées
      const getCheckedDetails = () => {
        const checkedInputs = Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(input => input.checked);
        const details = checkedInputs.map(input => {
          const optionText = input.nextElementSibling ? input.nextElementSibling.innerHTML : '';
          return optionText;
        });
        return details;
      };

      // Mise à jour du nombre de cases cochées
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
        
        // Interpréter l'HTML dans label (pour que <h2> etc. soient rendus)
        const sectionLabel = document.createElement('div');
        sectionLabel.classList.add('section-title');
        sectionLabel.innerHTML = section.label;
        sectionDiv.appendChild(sectionLabel);
        
        const sectionOptionsCount = Array.isArray(section.options) ? section.options.length : 0;
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add(sectionOptionsCount > 10 ? 'options-grid' : 'options-list');

        if (Array.isArray(section.options)) {
          // Créer chaque option
          const standardOptions = section.options.filter(option => option.action !== 'user_input');
          standardOptions.forEach(option => {
            const optionElement = createOptionElement(option, 1, section.label.replace(/<[^>]*>/g, ''));
            optionsContainer.appendChild(optionElement);
          });
          
          // Ajouter les champs "user_input"
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
                section: section.label.replace(/<[^>]*>/g, ''), // Supprimez les balises pour n'envoyer que le texte
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
            
            // Cas unique userInput
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
              // Aucun choix
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
