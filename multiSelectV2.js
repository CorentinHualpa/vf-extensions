export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect (toute zone cliquable + all => tous chapitres)");

      // Récupération du payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        textColor = '#FFFFFF',
        backgroundOpacity = 0.8,
        index = 1,
        totalMaxSelect = 6,
        multiselect = true
      } = trace.payload;

      let userInputValues = {};
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

        /* Grille de sections (2 colonnes) */
        .multiselect-container .sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
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

        /* Titre de section */
        .multiselect-container .section-title {
          margin-top: 0;
          margin-bottom: 8px;
          color: #fff;
        }

        /* Liste unique pour les options */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        /* Container d'option => label + input dans un même bloc */
        .option-container {
          margin: 0 6px;
          position: relative;
        }
        .option-container label {
          display: inline-flex; /* Pour mettre la case et le texte sur la même ligne */
          align-items: center;
          cursor: pointer;
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
          width: 100%;
        }
        .option-container label:hover {
          background-color: rgba(0,0,0,${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }

        /* Input => case standard, blanche => bleue => personnalisation via accent-color */
        .option-container input[type="checkbox"] {
          margin-right: 8px;
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: ${buttonColor};
        }
        /* Sur textColor ou autre si besoin */

        /* Cohérence en checked => label */
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

        /* Boutons */
        .multiselect-container .buttons-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
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

        /* user_input (optionnel) */
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
          background-color: rgba(255,255,255,0.9);
        }
      `;
      container.appendChild(styleElement);

      // Fonction => compte le nb total de checks et désactive si on atteint totalMaxSelect
      const updateTotalChecked = () => {
        const checks = container.querySelectorAll('input[type="checkbox"]');
        totalChecked = [...checks].filter(c => c.checked).length;
        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          checks.forEach(c => {
            if (!c.checked) {
              c.disabled = true;
            }
          });
        } else {
          checks.forEach(c => {
            c.disabled = false;
          });
        }
      };

      // Créer un conteneur sections-grid
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      // Parcourir chaque section
      sections.forEach((section, sectionIndex) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');

        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Titre
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label; // ex. <h2>…</h2>
        sectionDiv.appendChild(sectionTitle);

        // Liste d'options
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        if (Array.isArray(section.options)) {
          // Filtrer user_input
          const normalOptions = section.options.filter(opt => opt.action !== 'user_input');
          
          normalOptions.forEach((opt, optIndex) => {
            // Container
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('option-container');
            // On stocke data-action => "all" ou ""
            optionDiv.dataset.action = opt.action || "";

            // Label
            const label = document.createElement('label');
            // Input
            const input = document.createElement('input');
            input.type = multiselect ? "checkbox" : "radio";
            // On met input + text dans le même label => tout le label est cliquable
            label.appendChild(input);

            // Ajouter le texte
            const textSpan = document.createElement('span');
            textSpan.innerHTML = " " + opt.name; // un petit espace
            label.appendChild(textSpan);

            // Au changement => update total checks
            input.addEventListener('change', () => {
              updateTotalChecked();
              if (!multiselect) {
                // single select => envoi direct ? (facultatif)
                console.log("Sélection simple:", opt.name);
                // On pourrait griser le menu, etc.
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: {
                    selection: opt.name,
                    buttonPath: 'Default'
                  }
                });
              }
            });

            optionDiv.appendChild(label);
            optionsContainer.appendChild(optionDiv);
          });

          // Gérer user_input
          const userInputOptions = section.options.filter(o => o.action === 'user_input');
          userInputOptions.forEach(opt => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');

            const userInputLabel = document.createElement('label');
            userInputLabel.classList.add('user-input-label');
            userInputLabel.textContent = opt.label || 'Compléter si besoin';

            const userInputField = document.createElement('input');
            userInputField.type = 'text';
            userInputField.classList.add('user-input-field');
            userInputField.placeholder = opt.placeholder || '…';

            userInputField.addEventListener('input', (e) => {
              userInputValues[opt.label || `userInput-${sectionIndex}`] = e.target.value;
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
        buttonContainer.classList.add('buttons-container');

        buttons.forEach(btn => {
          const buttonElem = document.createElement('button');
          buttonElem.classList.add('submit-btn');
          buttonElem.textContent = btn.text;

          buttonElem.addEventListener('click', () => {
            // Récupérer la sélection
            const finalSections = sections.map((section, idx) => {
              const sectionElement = sectionsGrid.querySelectorAll('.section-container')[idx];
              if (!sectionElement) return null;

              // On repère tous les checkboxes cochés
              const checkedBoxes = Array.from(sectionElement.querySelectorAll('input[type="checkbox"]:checked'));
              let normalSelections = [];
              let hasAll = false;

              checkedBoxes.forEach(chk => {
                // action => chk.parentElement.parentElement.dataset.action
                // car on a input => label => div.option-container
                const optDiv = chk.closest('.option-container');
                const actionVal = optDiv ? optDiv.dataset.action : "";
                const labelText = chk.parentElement.querySelector('span')?.innerHTML?.trim() || "";
                
                if (actionVal === "all") {
                  hasAll = true;
                } else {
                  normalSelections.push(labelText);
                }
              });

              // Si "all" coché => on ajoute tous les chapitres standard
              if (hasAll) {
                // Tous les .option-container => action=""
                const allChapters = Array.from(sectionElement.querySelectorAll('.option-container'))
                  .filter(div => (div.dataset.action === ""))  // chap normal
                  .map(div => {
                    const sp = div.querySelector('span');
                    return sp ? sp.innerHTML.trim() : "";
                  });
                // On fusionne
                normalSelections = [...new Set([...normalSelections, ...allChapters])];
              }

              // Gérer userInput
              let userInputVal = "";
              const userInputContainers = sectionElement.querySelectorAll('.user-input-container');
              userInputContainers.forEach(cont => {
                const fld = cont.querySelector('.user-input-field');
                if (fld && fld.value.trim() !== "") {
                  if (userInputVal) userInputVal += " | ";
                  userInputVal += fld.value.trim();
                }
              });

              return {
                section: section.label,
                selections: normalSelections,
                userInput: userInputVal
              };
            }).filter(sec => sec);

            // On masque les boutons
            buttonContainer.querySelectorAll('.submit-btn').forEach(b => {
              b.style.display = 'none';
            });

            // Construit le payload
            const finalPayload = {
              selections: finalSections,
              buttonText: btn.text,
              buttonPath: btn.path || 'Default',
              isEmpty: finalSections.every(s => s.selections.length === 0 && !s.userInput),
            };

            // Si "Revenir" ou "Return"
            if (btn.text.includes("Revenir") || btn.text.includes("Return")) {
              finalPayload.buttonPath = "Previous_step";
            }

            console.log("Envoi final => Voiceflow:", finalPayload);
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
      console.log("MultiSelect rendu OK (entièrement cliquable, 'all' => injecte chapitres)");
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
