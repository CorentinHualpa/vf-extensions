export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },

  render: ({ trace, element }) => {
    try {
      console.log('Démarrage du rendu MultiSelect (version unifiée)');

      // Récupération des données
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

      // Variables utiles
      let totalChecked = 0;
      const userInputValues = {};

      // Conteneur principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Ajout des styles
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

        /* -- Disposition en cartes pour les sections (2 colonnes) -- */
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
          position: relative;
          overflow: hidden; 
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* -- Titre (niveau 1) -- */
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

        /* -- Liste unique pour les options (niveaux 2,3) -- */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        /* -- Niveaux 2 non cliquables -- */
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

        /* -- Options de dernier niveau (cliquables) -- */
        .multiselect-container .option-container.selectable {
          /* On affiche input + label en bloc unique */
          margin: 0 12px; 
        }
        /* Input sur une ligne, label en bloc suivant, autorisant retour à la ligne */
        .multiselect-container .option-container.selectable input[type="checkbox"],
        .multiselect-container .option-container.selectable input[type="radio"] {
          vertical-align: middle;
          cursor: pointer;
          accent-color: ${buttonColor};
          margin-right: 6px;
          margin-bottom: 2px;
        }
        .multiselect-container .option-container.selectable label {
          font-size: 0.85em;
          border-radius: 4px;
          padding: 4px 6px;
          color: #fff;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);

          display: inline-block;       /* Sur la même ligne que le input */
          white-space: normal;         /* Autorise le retour à la ligne */
          word-break: break-word;
          overflow-wrap: break-word;
          vertical-align: middle;      /* Aligne le texte avec la case */
          max-width: calc(100% - 24px);
        }
        .multiselect-container .option-container.selectable label:hover {
          background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }
        .multiselect-container input[type="checkbox"]:checked + label,
        .multiselect-container input[type="radio"]:checked + label {
          background-color: ${buttonColor};
          border-color: #fff;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .multiselect-container input[type="checkbox"]:disabled + label,
        .multiselect-container input[type="radio"]:disabled + label {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* -- Imbrication (niveaux 2,3) -- */
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

        /* -- Boutons -- */
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

        /* -- user_input -- */
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
       * Fonction récursive qui crée un <div> pour chaque option
       * Seule une option sans children est sélectionnable (dernier niveau).
       */
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren; // Pas de children => dernier niveau => cliquable

        if (isSelectable) {
          // On rend l'option cliquable
          optionDiv.classList.add('selectable');
          // Input
          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          input.name = `option-${sectionLabel}`;

          // Label
          const label = document.createElement('label');
          // On interprète le HTML (ex. "<strong>…</strong>")
          label.innerHTML = option.name;

          // Ajout event
          input.addEventListener('change', () => {
            updateTotalChecked();
            // Si single-select => on envoie tout de suite
            if (!multiselect) {
              console.log('Envoi de sélection simple:', option.name);
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
          // Sous-catégorie (niveau 2)
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name;  
          optionDiv.appendChild(span);
        }

        // Si l’option a des enfants, générer récursivement
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
       * Mise à jour du nombre de cases cochées
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

      // Conteneur des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      // Construire chaque section
      sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');

        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Titre de la section
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label; // ex. <h2>…</h2>
        sectionDiv.appendChild(sectionTitle);

        // Conteneur des options
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        if (Array.isArray(section.options)) {
          // On sépare (ou pas) les user_input
          const normalOptions = section.options.filter(opt => opt.action !== 'user_input');
          normalOptions.forEach(opt => {
            // Nettoyer le label de la section
            const sanitizedSectionLabel = section.label
              .replace(/<[^>]+>/g, '')
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-');

            // Créer l'option
            const optionElement = createOptionElement(opt, 1, sanitizedSectionLabel);
            optionsContainer.appendChild(optionElement);
          });

          // user_input
          const userInputOptions = section.options.filter(opt => opt.action === 'user_input');
          userInputOptions.forEach(opt => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');

            const userInputLabel = document.createElement('label');
            userInputLabel.classList.add('user-input-label');
            userInputLabel.textContent = opt.label || 'Compléter si besoin';

            const userInputField = document.createElement('input');
            userInputField.type = 'text';
            userInputField.classList.add('user-input-field');
            userInputField.placeholder = opt.placeholder || 'Saisir un texte…';

            userInputField.addEventListener('input', (e) => {
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

      // Ajout des boutons
      if (buttons && buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-index', index);
        buttonContainer.classList.add('buttons-container');

        buttons.forEach(button => {
          const buttonElement = document.createElement('button');
          buttonElement.classList.add('submit-btn');
          buttonElement.textContent = button.text;

          buttonElement.addEventListener('click', () => {
            // Récupérer les cases cochées
            const checkedInputs = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
            const selected = checkedInputs.map(cb => {
              const label = cb.nextElementSibling;
              return label ? label.innerHTML : '';
            });

            // user_input
            const userInputs = Object.entries(userInputValues)
              .filter(([_, val]) => val && val.trim() !== '')
              .map(([k, v]) => ({ label: k, value: v.trim() }));

            // Construire le payload
            const finalPayload = {
              selections: selected,       // ex: [ "<strong>Maintenance…</strong> etc." , "…", … ]
              userInputs,                // ex: [ { label: "xxx", value: "yyy" }, … ]
              buttonText: button.text,
              buttonPath: button.path || 'Default',
              isEmpty: selected.length === 0 && userInputs.length === 0,
            };

            // Si "Revenir" dans le texte, chemin différent
            if (button.text.includes("Revenir") || button.text.includes("Return")) {
              finalPayload.buttonPath = 'Previous_step';
            }

            console.log("Envoi du payload:", finalPayload);

            // Masquer les boutons
            buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
              btn.style.display = 'none';
            });

            // Interagir avec Voiceflow
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: finalPayload
            });
          });

          buttonContainer.appendChild(buttonElement);
        });

        container.appendChild(buttonContainer);
      }

      element.appendChild(container);
      console.log('MultiSelect rendu terminé');
    } catch (error) {
      console.error('Erreur MultiSelect:', error);
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
