export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect (3 niveaux : section > sous-titre > option)");

      // Récupération du payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        textColor = '#FFFFFF',
        backgroundOpacity = 0.8,
        index = 1,
        totalMaxSelect = 6,
        multiselect = false   // Par défaut false => single select (radio)
      } = trace.payload;

      let totalChecked = 0;

      // Conteneur principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Styles
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .multiselect-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
          box-sizing: border-box;
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
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* Titre (niveau 1) => label de la section */
        .multiselect-container .section-title {
          margin-top: 0;
          margin-bottom: 8px;
          color: #fff;
        }

        /* Conteneur pour les options (niveaux 2 et 3) */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        /* Option container commun */
        .option-container {
          margin-left: 8px;
          position: relative;
        }

        /* Niveau 2 => non-cliquable => on affiche un “titre” */
        .option-container.non-selectable {
          background-color: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 6px 10px;
          color: #fff;
          margin-bottom: 4px;
        }

        /* Niveau 3 => cliquable (checkbox/radio) */
        .option-container.selectable {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }

        /* Input => checkbox ou radio */
        .option-container input[type="checkbox"],
        .option-container input[type="radio"] {
          margin-right: 8px;
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: ${buttonColor};
        }

        /* Label => zone de texte */
        .option-container label {
          display: inline-block;
          font-size: 0.85em;
          border-radius: 4px;
          padding: 6px 8px;
          color: #fff;
          background-color: rgba(0,0,0,${backgroundOpacity});
          transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.1);
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          line-height: 1.3;
          flex: 1;
        }
        .option-container label:hover {
          background-color: rgba(0,0,0,${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }
        .option-container input:checked + label {
          background-color: ${buttonColor};
          border-color: #fff;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .option-container input:disabled + label {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Indentation pour les enfants */
        .children-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-left: 20px;
          margin-top: 4px;
        }

        /* Boutons */
        .buttons-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }
        .submit-btn {
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
        .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
      `;
      container.appendChild(styleElement);

      // updateTotalChecked => désactiver les non cochés si totalMaxSelect atteint
      const updateTotalChecked = () => {
        const allChecks = container.querySelectorAll('input[type="checkbox"]');
        totalChecked = [...allChecks].filter(c => c.checked).length;
        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          allChecks.forEach(c => {
            if (!c.checked) {
              c.disabled = true;
            }
          });
        } else {
          allChecks.forEach(c => {
            c.disabled = false;
          });
        }
      };

      /**
       * Fonction récursive pour créer un conteneur d'option
       * - Si `children` existe => c’est un **niveau 2** => non-selectable
       * - Sinon => c’est un **niveau 3** => selectable
       */
      const createOptionElement = (option) => {
        const hasChildren = Array.isArray(option.children) && option.children.length > 0;

        const optionDiv = document.createElement('div');
        if (hasChildren) {
          // Niveau 2 => simple bloc non cliquable
          optionDiv.classList.add('option-container','non-selectable');
          
          // On affiche le name sous forme de HTML
          const span = document.createElement('span');
          span.innerHTML = option.name; 
          optionDiv.appendChild(span);

          // On crée un conteneur pour les enfants
          const childrenDiv = document.createElement('div');
          childrenDiv.classList.add('children-options');
          option.children.forEach(child => {
            const childElement = createOptionElement(child);
            childrenDiv.appendChild(childElement);
          });
          optionDiv.appendChild(childrenDiv);

        } else {
          // Niveau 3 => selectable
          optionDiv.classList.add('option-container','selectable');

          // Input => checkbox ou radio
          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';

          // Label => le texte
          const label = document.createElement('label');
          label.innerHTML = option.name;

          // Sur changement => update
          input.addEventListener('change', () => {
            updateTotalChecked();
            if (!multiselect) {
              // single => envoi direct ? (facultatif)
              console.log("Sélection simple:", option.name);
              // ex:
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
        }
        return optionDiv;
      };

      // Créer la grille de sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section, idxSection) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');
        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Titre de la section (HTML)
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label; 
        sectionDiv.appendChild(sectionTitle);

        // Conteneur => options-list
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        // Créer chaque option
        if (Array.isArray(section.options)) {
          section.options.forEach(opt => {
            const optElem = createOptionElement(opt);
            optionsContainer.appendChild(optElem);
          });
        }

        sectionDiv.appendChild(optionsContainer);
        sectionsGrid.appendChild(sectionDiv);
      });

      container.appendChild(sectionsGrid);

      // Boutons
      if (buttons && buttons.length > 0) {
        const btnContainer = document.createElement('div');
        btnContainer.classList.add('buttons-container');

        buttons.forEach(btn => {
          const buttonElem = document.createElement('button');
          buttonElem.classList.add('submit-btn');
          buttonElem.textContent = btn.text;

          buttonElem.addEventListener('click', () => {
            // Récupérer la sélection => 
            // On parcourt chaque "section-container", 
            // on descend récursivement ou on lit tous les "input[type=checkbox]:checked"
            // On renvoie un payload standard

            const finalSections = sections.map((section, idx) => {
              const sdiv = sectionsGrid.querySelectorAll('.section-container')[idx];
              if (!sdiv) return null;

              // Collecter tous les inputs cochés
              const checkedInputs = sdiv.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
              const chosen = [...checkedInputs].map(chk => {
                // On suppose que "chk.nextSibling" = label, ou on fait:
                const lbl = chk.nextElementSibling;
                return lbl ? lbl.innerHTML : '';
              });

              return {
                section: section.label,   // ex. <h2>…</h2>
                selections: chosen,
                userInput: "" // si on en avait
              };
            }).filter(sec => sec);

            // On masque les boutons
            btnContainer.querySelectorAll('.submit-btn').forEach(b => {
              b.style.display = 'none';
            });

            const finalPayload = {
              selections: finalSections,
              buttonText: btn.text,
              buttonPath: btn.path || 'Default',
              isEmpty: finalSections.every(s => s.selections.length === 0)
            };

            console.log("Envoi final => Voiceflow:", finalPayload);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: finalPayload
            });
          });

          btnContainer.appendChild(buttonElem);
        });

        container.appendChild(btnContainer);
      }

      element.appendChild(container);
      console.log("Rendu complet MultiSelect (3 niveaux)");
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
  }
};
