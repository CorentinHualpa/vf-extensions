export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },
  render: ({ trace, element }) => {
    try {
      console.log("Démarrage du rendu MultiSelect (mise en page harmonisée)");

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
      sections.forEach((section) => {
        if (Array.isArray(section.options)) {
          totalOptions += countOptionsRecursive(section.options);
        }
      });

      // Injection des styles CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* -- Conteneur principal -- */
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
        
        /* -- Disposition des sections en "cartes" sur 2 colonnes -- */
        .multiselect-container .sections-grid {
          display: flex;
          flex-wrap: wrap;       /* Permet de passer à la ligne si ça déborde */
          gap: 16px;             /* Espace horizontal/vertical entre sections */
          width: 100%;
          justify-content: center; /* Centrage horizontal des sections */
        }

        /* Chaque section occupe ~50% de la largeur, avec minimum 300px */
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
          /* Sur petits écrans, on repasse en 1 colonne */
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* Titre de la section (HTML interprété via innerHTML) */
        .multiselect-container .section-title {
          margin-top: 0;
          margin-bottom: 8px;
        }

        /* Liste unique pour les options, plus de grid interne pour éviter la complexité */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        /* Option container commun */
        .multiselect-container .option-container {
          margin: 0;
          width: 100%;
        }
        
        /* Dernier niveau sélectionnable (case + texte sur la même ligne) */
        .multiselect-container .option-container.selectable {
          display: flex;
          align-items: center;
        }
        .multiselect-container .option-container.selectable input {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          cursor: pointer;
          accent-color: ${buttonColor};
        }
        .multiselect-container .option-container.selectable label {
          display: inline-flex;
          align-items: center;
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
        
        /* Niveaux imbriqués : marges plus ou moins grandes */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 10px;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 20px;
        }

        /* Niveaux intermédiaires (non sélectionnables) */
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

        /* Boutons */
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
        
        /* Champs user_input */
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

      // Fonction récursive pour créer les éléments d'option (niveaux 2-3)
      // Seule une option sans children (dernier niveau) est sélectionnable
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = option.children && Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren; // dernier niveau => cliquable

        if (isSelectable) {
          // Cas d'une option sélectionnable (dernier niveau)
          optionDiv.classList.add('selectable');

          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          // Retire les balises HTML pour créer un id "propre"
          const sanitizedOptionName = option.name.replace(/<[^>]*>/g, '').replace(/\s+/g, '-');
          input.id = `${sectionLabel}-${sanitizedOptionName}-l${level}`;
          input.name = `option-${sectionLabel}`;

          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.innerHTML = option.name; // Interprète l'HTML (ex. <strong>…)

          // Gestion du changement
          input.addEventListener('change', () => {
            updateTotalChecked();
            if (!multiselect) {
              // Sélection simple => envoi immédiat
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
          // Cas d'une option non-sélectionnable (ayant des enfants)
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name; // Interprétation du HTML (ex. <h3>…)
          optionDiv.appendChild(span);
        }

        // Ajouter récursivement les enfants
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.classList.add('children-options');
          option.children.forEach((child) => {
            const childElement = createOptionElement(child, level + 1, sectionLabel);
            childrenContainer.appendChild(childElement);
          });
          optionDiv.appendChild(childrenContainer);
        }
        return optionDiv;
      };

      // Met à jour le nombre total de cases cochées
      // et désactive si on atteint totalMaxSelect
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

      // Création du conteneur pour toutes les sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');
        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Interpréter l'HTML dans label (ex. <h2>, <h3>)
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label;
        sectionDiv.appendChild(sectionTitle);

        // Options en liste unique
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        if (Array.isArray(section.options)) {
          // Filtrer les options user_input (si besoin)
          const standardOptions = section.options.filter(opt => opt.action !== 'user_input');

          // Créer chaque option
          standardOptions.forEach(opt => {
            const sanitizedSectionLabel = section.label.replace(/<[^>]*>/g, '');
            const optionElement = createOptionElement(opt, 1, sanitizedSectionLabel);
            optionsContainer.appendChild(optionElement);
          });

          // Ajouter user_input si présent
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

      // Gestion des boutons (validation)
      if (buttons && buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-index', index);
        buttonContainer.classList.add('buttons-container');

        buttons.forEach(button => {
          const buttonElement = document.createElement('button');
          buttonElement.classList.add('submit-btn');
          buttonElement.textContent = button.text;

          buttonElement.addEventListener('click', () => {
            // Récupérer la liste des sélections
            const selectedOptions = sections.map((section, idx) => {
              const sectionElement = sectionsGrid.querySelectorAll('.section-container')[idx];
              if (!sectionElement) return null;

              const selections = Array.from(sectionElement.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => (cb.nextElementSibling ? cb.nextElementSibling.innerHTML : ''));

              // Récupérer un éventuel champ user_input
              const userInputId = `${section.label}-user-input-${section.id || ''}`;
              const userInputValue = userInputValues[userInputId] || "";

              return {
                section: section.label.replace(/<[^>]*>/g, ''), // Nettoyer le HTML
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

            // Cas : un unique userInput, sans sélection
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
              // Cas standard
              payloadData = {
                selections: selectedOptions,
                buttonText: button.text,
                buttonPath: buttonPath,
                isEmpty: false,
                isUserInput: false
              };
            } else {
              // Aucune sélection
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
