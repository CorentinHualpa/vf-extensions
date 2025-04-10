export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },
  render: ({ trace, element }) => {
    try {
      console.log("Démarrage du rendu MultiSelect (3 niveaux supportés)");

      // Récupérer les données depuis le payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        textColor = '#FFFFFF',
        backgroundOpacity = 0.7,
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

      // Ajouter les styles CSS (avec styles pour les niveaux imbriqués)
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
        
        /* Liste d'options et grille (pour de nombreuses options) */
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
        
        /* Style pour les conteneurs d'options */
        .multiselect-container .option-container {
          display: flex;
          flex-direction: column;
          margin: 0;
          width: 100%;
        }
        
        /* Styles pour les inputs */
        .multiselect-container .option-container input[type="checkbox"],
        .multiselect-container .option-container input[type="radio"] {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          margin-right: 6px;
          cursor: pointer;
          accent-color: ${buttonColor};
          margin-top: 6px;
        }
        
        /* Style pour les labels */
        .multiselect-container .option-container label {
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
          white-space: normal;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
          min-height: 31px;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .multiselect-container .option-container label:hover {
          background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }
        
        .multiselect-container .option-container input:checked + label {
          background-color: ${buttonColor};
          border-color: white;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .multiselect-container .option-container input:disabled + label {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Styles pour les niveaux imbriqués */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 20px;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 40px;
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
          white-space: normal;
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

      // Fonction récursive pour créer les éléments d'option (pour niveaux 1, 2, 3, …)
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);
        
        // Créer l'input (checkbox ou radio)
        const input = document.createElement('input');
        input.type = multiselect ? 'checkbox' : 'radio';
        // Utilisation d'un nom commun par section pour les radios (ou checkbox en multi-select)
        input.name = `option-${sectionLabel}`;
        // Générer un id unique en se basant sur le label de la section, le nom de l’option et le niveau
        const sanitizedOptionName = option.name.replace(/<[^>]*>/g, '').replace(/\s+/g, '-');
        input.id = `${sectionLabel}-${sanitizedOptionName}-l${level}`;
        
        // Créer le label
        const label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.innerHTML = option.name;
        label.title = option.name.replace(/<[^>]*>/g, '');
        
        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        
        // Écoute du changement
        input.addEventListener('change', () => {
          updateTotalChecked();
          // Comportement pour des sélections simples : envoyer immédiatement la sélection
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
        
        // Si l'option possède des "children", générer récursivement les sous-options
        if (option.children && Array.isArray(option.children)) {
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

      // Fonction qui récupère les détails de toutes les cases cochées, dans toutes les sections et niveaux
      const getCheckedDetails = () => {
        // On récupère tous les checkbox cochés dans le conteneur principal
        const checkedInputs = Array.from(container.querySelectorAll('input[type="checkbox"]'))
          .filter(input => input.checked);
        // On construit un tableau simple avec l'info utile (vous pouvez étendre ici pour renvoyer la hiérarchie)
        const details = checkedInputs.map(input => {
          // Récupère le texte correspondant (via le label associé)
          const optionText = input.nextElementSibling ? input.nextElementSibling.innerHTML : '';
          return optionText;
        });
        return details;
      };

      // Fonction pour mettre à jour le compte total de cases cochées, et désactiver celles non cochées si le max est atteint
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

      // Vérifier si on a des champs "user_input"
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
        
        // Déterminer le nombre d'options dans la section (les options enfants sont comptées dans le total via la fonction récursive)
        let sectionOptionsCount = Array.isArray(section.options) ? section.options.length : 0;
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add(sectionOptionsCount > 10 ? 'options-grid' : 'options-list');

        if (Array.isArray(section.options)) {
          // Séparer les options standards (possiblement hiérarchisées) des éventuels champs user_input
          const standardOptions = section.options.filter(option => option.action !== 'user_input');
          
          // Pour chaque option standard, utiliser la fonction récursive pour créer l’élément (niveau 1)
          standardOptions.forEach(option => {
            const optionElement = createOptionElement(option, 1, section.label);
            optionsContainer.appendChild(optionElement);
          });
          
          // Ajouter les champs "user_input" s'il y en a dans la section
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

      // Ajout et configuration des boutons (si définis dans le payload)
      if (buttons && buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-index', index);
        buttonContainer.classList.add('buttons-container');

        buttons.forEach(button => {
          const buttonElement = document.createElement('button');
          buttonElement.classList.add('submit-btn');
          buttonElement.textContent = button.text;

          buttonElement.addEventListener('click', () => {
            // Récupérer toutes les sélections cochées (pour tous les niveaux)
            const selectedOptions = sections.map((section, idx) => {
              const sectionElement = container.querySelectorAll('.section-container')[idx];
              if (!sectionElement) return null;
              // Pour simplifier, on récupère ici le contenu des labels des inputs cochés
              const selections = Array.from(sectionElement.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
                return cb.nextElementSibling ? cb.nextElementSibling.innerHTML : '';
              });
              
              // Récupération de l'eventuel champ user_input
              const userInputId = `${section.label}-user-input-${section.id || ''}`;
              const userInputValue = userInputValues[userInputId] !== undefined ? userInputValues[userInputId] : "";
              
              return {
                section: section.label,
                selections,
                userInput: userInputValue.trim()
              };
            }).filter(section => section && (section.selections.length > 0 || section.userInput));
            
            // Masquer les boutons après clic
            buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
              btn.style.display = 'none';
            });
            
            console.log("Envoi des sélections:", selectedOptions);
            
            // Construire le payload pour Voiceflow
            let payloadData = {};
            const buttonPath = button.path || 'Default';
            
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
              payloadData = {
                selections: selectedOptions,
                buttonText: button.text,
                buttonPath: buttonPath,
                isEmpty: false,
                isUserInput: false
              };
            } else {
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
