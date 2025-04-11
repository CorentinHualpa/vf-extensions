export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },

  render: ({ trace, element }) => {
    try {
      console.log('Démarrage du rendu MultiSelect (case visible)');

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
      const userInputValues = {};

      // Conteneur principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Styles
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

        /* Grille 2 colonnes pour les sections (niveau 1) */
        .multiselect-container .sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          width: 100%;
        }
        .multiselect-container .section-container {
          flex: 0 1 calc(50% - 16px);
          min-width: 300px;
          background-color: #673AB7;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* Titre h2 (niveau 1) */
        .multiselect-container .section-title {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .multiselect-container .section-title h2 {
          border: 2px solid #fff;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 0;
          color: #fff;
        }

        /* Liste unique pour les options */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        /* Niveau 2 non cliquable */
        .multiselect-container .option-container.non-selectable {
          background-color: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 6px 10px;
          margin: 0 6px;
        }
        .multiselect-container .option-container.non-selectable span {
          color: #fff;
          font-size: 0.95em;
          font-weight: bold;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          display: block;
        }

        /* Niveau 3 cliquable */
        .multiselect-container .option-container.selectable {
          margin: 0 12px; 
          position: relative;
        }
        
        /* Le label occupe toute la largeur, padding-left pour l'espace de la case */
        .multiselect-container .option-container.selectable label {
          display: block;
          position: relative;
          padding: 6px 8px 6px 34px; /* 34px de marge à gauche pour la case */
          font-size: 0.85em;
          border-radius: 4px;
          color: #fff;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.1);
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          font-weight: 500;
          line-height: 1.3;
          margin-bottom: 4px;
          cursor: pointer;
          min-height: 36px;
          box-sizing: border-box;
        }
        .multiselect-container .option-container.selectable label:hover {
          background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }

        /* La case est placée en absolu dans la marge de gauche */
        .multiselect-container .option-container.selectable input {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          margin: 0;
          accent-color: ${buttonColor};
          cursor: pointer;
        }

        /* Sélectionnée */
        .multiselect-container input:checked + label {
          background-color: ${buttonColor};
          border-color: #fff;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .multiselect-container input:disabled + label {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Imbrication (niveaux 2,3) */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 0 !important;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 24px !important;
        }
        .multiselect-container .children-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
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
          color: #fff;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          border: none;
          font-weight: 600;
          font-size: 0.9em;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          text-align: center;
          min-width: 130px;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
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
          color: #fff;
          font-weight: 500;
          font-size: 0.85em;
          line-height: 1.3;
        }
        .multiselect-container .user-input-field {
          width: 100%;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.3);
          font-size: 0.85em;
          transition: all 0.2s ease;
          background-color: rgba(255,255,255,0.9);
        }
        .multiselect-container .user-input-field:focus {
          border-color: ${buttonColor};
          outline: none;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
        }
      `;
      container.appendChild(styleElement);

      /**
       * Fonction récursive pour créer les options
       * Seule une option sans children (niveau 3) est cliquable.
       */
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren;

        if (isSelectable) {
          // Option niveau 3 => cliquable
          optionDiv.classList.add('selectable');

          // Input
          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';

          // Label
          const label = document.createElement('label');
          // ID unique
          const uniqueId = `opt-${Math.random().toString(36).slice(2)}`;
          input.id = uniqueId;
          label.setAttribute('for', uniqueId);

          // Contenu HTML
          label.innerHTML = option.name;

          // Event
          input.addEventListener('change', () => {
            updateTotalChecked();
            if (!multiselect) {
              // Sélection simple => envoi direct
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
          // Niveau 2 => non sélectionnable
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name;
          optionDiv.appendChild(span);
        }

        // Enfants
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.classList.add('children-options');
          option.children.forEach(child => {
            const childElem = createOptionElement(child, level + 1, sectionLabel);
            childrenContainer.appendChild(childElem);
          });
          optionDiv.appendChild(childrenContainer);
        }

        return optionDiv;
      };

      /**
       * Mise à jour du nombre total de cases cochées
       */
      const updateTotalChecked = () => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        totalChecked = [...checkboxes].filter(cb => cb.checked).length;
        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          checkboxes.forEach(cb => {
            if (!cb.checked) {
              cb.disabled = true;
            }
          });
        } else {
          checkboxes.forEach(cb => {
            cb.disabled = false;
          });
        }
      };

      // Conteneur sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');

        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Titre h2
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label;
        sectionDiv.appendChild(sectionTitle);

        // Options
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        if (Array.isArray(section.options)) {
          const normalOpts = section.options.filter(opt => opt.action !== 'user_input');
          normalOpts.forEach(opt => {
            const sanitized = section.label.replace(/<[^>]*>/g, '').trim();
            const optElem = createOptionElement(opt, 1, sanitized);
            optionsContainer.appendChild(optElem);
          });

          // user_input
          const userInputOpts = section.options.filter(opt => opt.action === 'user_input');
          userInputOpts.forEach(opt => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');

            const userInputLabel = document.createElement('label');
            userInputLabel.classList.add('user-input-label');
            userInputLabel.textContent = opt.label || 'Compléter si besoin';

            const userInputField = document.createElement('input');
            userInputField.type = 'text';
            userInputField.classList.add('user-input-field');
            userInputField.placeholder = opt.placeholder || 'Saisir un texte…';

            userInputField.addEventListener('input', e => {
              userInputValues[opt.label || 'user_input'] = e.target.value;
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

      // Boutons
      if (buttons && buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-index', index);
        buttonContainer.classList.add('buttons-container');

        buttons.forEach(btn => {
          const buttonElem = document.createElement('button');
          buttonElem.classList.add('submit-btn');
          buttonElem.textContent = btn.text;

          buttonElem.addEventListener('click', () => {
            // Récupérer les cases cochées
            const checked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
            const selections = checked.map(cb => {
              const lbl = cb.nextElementSibling;
              return lbl ? lbl.innerHTML : '';
            });

            // Récupérer user_input
            const userInputs = Object.entries(userInputValues)
              .filter(([_, val]) => val && val.trim() !== '')
              .map(([key, val]) => ({ label: key, value: val.trim() }));

            const finalPayload = {
              selections,
              userInputs,
              buttonText: btn.text,
              buttonPath: btn.path || 'Default',
              isEmpty: (selections.length === 0 && userInputs.length === 0),
            };

            // Si "Revenir"
            if (btn.text.includes("Revenir") || btn.text.includes("Return")) {
              finalPayload.buttonPath = "Previous_step";
            }

            console.log("Envoi payload:", finalPayload);

            buttonContainer.querySelectorAll('.submit-btn').forEach(b => {
              b.style.display = 'none';
            });

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: finalPayload
            });
          });

          buttonContainer.appendChild(buttonElem);
        });

        container.appendChild(buttonContainer);
      }

      element.appendChild(container);
      console.log("MultiSelect rendu complet - case visible");
    } catch (err) {
      console.error("Erreur MultiSelect:", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          error: true,
          message: err.message
        }
      });
    }
  },
};
