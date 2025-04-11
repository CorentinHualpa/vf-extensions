export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },
  render: ({ trace, element }) => {
    try {
      console.log("Démarrage du rendu MultiSelect (mise à jour finale)");

      // Récupération des données depuis le payload
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

      // Conteneur principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Calcul du total d'options
      const countOptionsRecursive = (options) => {
        return options.reduce((acc, opt) => {
          const sousTotal = (opt.children && Array.isArray(opt.children)) 
            ? countOptionsRecursive(opt.children) 
            : 0;
          return acc + 1 + sousTotal;
        }, 0);
      };
      let totalOptions = 0;
      sections.forEach((section) => {
        if (Array.isArray(section.options)) {
          totalOptions += countOptionsRecursive(section.options);
        }
      });

      // Injection des styles
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* --- Conteneur principal --- */
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

        /* --- Disposition des sections en cartes sur 2 colonnes --- */
        .multiselect-container .sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
          justify-content: center;
        }
        .multiselect-container .section-container {
          flex: 0 1 calc(50% - 16px);
          min-width: 300px;
          background-color: #673AB7;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          padding: 10px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* --- Titre de section (niveau 1) --- */
        .multiselect-container .section-title {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .multiselect-container .section-title h2 {
          border: 2px solid white;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 0;
          color: white;
        }

        /* --- Options en liste unique --- */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          flex-grow: 1;
        }

        /* --- Conteneur d'option --- */
        .multiselect-container .option-container {
          margin: 0;
          width: 100%;
        }
        
        /* Dernier niveau sélectionnable : retour à la ligne autorisé */
        .multiselect-container .option-container.selectable {
          display: flex;
          align-items: flex-start; /* Optionnel, pour aligner la case sur la 1ère ligne */
        }
        .multiselect-container .option-container.selectable input {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          cursor: pointer;
          accent-color: ${buttonColor};
          margin-top: 4px;
        }
        .multiselect-container .option-container.selectable label {
          display: inline-flex;
          align-items: flex-start; /* Permet au texte de passer à la ligne */
          margin-left: 6px;
          cursor: pointer;
          font-size: 0.85em;
          border-radius: 4px;
          padding: 4px 6px;
          color: white;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);

          /* Autoriser le texte à se répartir sur plusieurs lignes */
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

        /* --- Marges pour niveaux imbriqués --- */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 10px;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 20px;
        }

        /* Options intermédiaires (non sélectionnables) */
        .multiselect-container .option-container.non-selectable {
          display: block;
        }
        .multiselect-container .option-container.non-selectable span {
          cursor: default;
          color: #fff;
          background-color: rgba(0, 0, 0, 0.3);
          padding: 6px 8px;
          font-size: 0.85em;
          font-weight: bold;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          user-select: none;
          display: inline-block;
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

        /* --- Boutons --- */
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

        /* --- Champs user_input --- */
        .multiselect-container .user-input-container {
          margin-top: 10px;
          margin-bottom: 8px;
          width: 100%;
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
      `;
      container.appendChild(styleElement);

      // Fonction récursive pour créer les options
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = option.children && Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren; // dernier niveau => cliquable

        if (isSelectable) {
          optionDiv.classList.add('selectable');
          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          const sanitizedOptionName = option.name.replace(/<[^>]*>/g, '').replace(/\s+/g, '-');
          input.id = `${sectionLabel}-${sanitizedOptionName}-l${level}`;
          input.name = `option-${sectionLabel}`;

          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.innerHTML = option.name;

          input.addEventListener('change', () => {
            updateTotalChecked();
            if (!multiselect) {
              // sélection unique => envoi immédiat
              console.log("Envoi sélection simple:", option.name);
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  selection: option.name,
                  buttonPath: 'Default'
                }
              });
            }
          });

          optionDiv.appendChild(input);
          optionDiv.appendChild(label);
        } else {
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name;
          optionDiv.appendChild(span);
        }

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

      // Mise à jour du nombre de cases cochées
      const updateTotalChecked = () => {
        const allCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        totalChecked = allCheckboxes.filter(cb => cb.checked).length;

        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          allCheckboxes.forEach((checkbox) => {
            if (!checkbox.checked) {
              checkbox.disabled = true;
            }
          });
        } else {
          allCheckboxes.forEach((checkbox) => {
            checkbox.disabled = false;
          });
        }
      };

      // Conteneur pour toutes les sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');
        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Titre de la section
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label; // Interprète <h2>, etc.
        sectionDiv.appendChild(sectionTitle);

        // Conteneur d'options
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        if (Array.isArray(section.options)) {
          const standardOptions = section.options.filter(opt => opt.action !== 'user_input');
          standardOptions.forEach(opt => {
            const sanitizedSectionLabel = section.label.replace(/<[^>]*>/g, '');
            const optionElement = createOptionElement(opt, 1, sanitizedSectionLabel);
            optionsContainer.appendChild(optionElement);
          });

          // Champs user_input
          const userInputOptions = section.options.filter(opt => opt.action === 'user_input');
          userInputOptions.forEach(opt => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');

            const userInputLabel = document.createElement('label');
            userInputLabel.classList.add('user-input-label');
            userInputLabel.textContent = opt.label || 'Indiquez votre option si aucune ne correspond';

            const userInputField = document.createElement('input');
            userInputField.type = 'text';
            userInputField.classList.add('user-input-field');
            userInputField.placeholder = opt.placeholder || 'Saisissez votre texte ici...';
            userInputField.id = `${section.label}-user-input-${opt.id || ''}`;

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

      // Boutons de validation
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
              const sectionElement = sectionsGrid.querySelectorAll('.section-container')[idx];
              if (!sectionElement) return null;

              const selections = Array.from(sectionElement.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => (cb.nextElementSibling ? cb.nextElementSibling.innerHTML : ''));

              const userInputId = `${section.label}-user-input-${section.id || ''}`;
              const userInputValue = userInputValues[userInputId] || "";

              return {
                section: section.label.replace(/<[^>]*>/g, ''),
                selections,
                userInput: userInputValue.trim()
              };
            }).filter(sec => sec && (sec.selections.length > 0 || sec.userInput));

            // Masquer les boutons après clic
            buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
              btn.style.display = 'none';
            });

            console.log("Envoi des sélections:", selectedOptions);

            let payloadData = {};
            const buttonPath = button.path || 'Default';

            if (
              selectedOptions.length === 1 &&
              selectedOptions[0].selections.length === 0 &&
              selectedOptions[0].userInput !== ""
            ) {
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
  }
};
