export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect avec option 'all' gérée");

      // Récupération du payload
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

      // Styles minimaux
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .multiselect-container {
          width: 100%;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
          box-sizing: border-box;
          max-width: 100%;
          margin: 0 auto;
          font-size: 0.9em;
        }
        .multiselect-container * {
          box-sizing: border-box;
        }

        .sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }
        .section-container {
          flex: 0 1 calc(50% - 16px);
          min-width: 300px;
          background-color: #673AB7;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 800px) {
          .section-container {
            flex: 1 1 100%;
          }
        }

        .section-title {
          margin-top: 0;
          margin-bottom: 8px;
          color: #fff;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .option-container {
          display: flex;
          align-items: flex-start;
          margin: 0 4px;
        }

        .option-container input[type="checkbox"] {
          accent-color: ${buttonColor};
          margin-right: 6px;
          margin-top: 6px;
          cursor: pointer;
        }
        .option-container label {
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
          flex: 1;
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

        .user-input-container {
          margin-top: 10px;
          margin-bottom: 8px;
          width: 100%;
        }
        .user-input-label {
          display: block;
          margin-bottom: 6px;
          color: #fff;
          font-weight: 500;
          font-size: 0.85em;
          line-height: 1.3;
        }
        .user-input-field {
          width: 100%;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.3);
          font-size: 0.85em;
          background-color: rgba(255,255,255,0.9);
        }
      `;
      container.appendChild(styleElement);

      // updateTotalChecked => si totalMaxSelect atteint => disable
      const updateTotalChecked = () => {
        const allChecks = container.querySelectorAll('input[type="checkbox"]');
        totalChecked = [...allChecks].filter(cb => cb.checked).length;

        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          allChecks.forEach(cb => {
            if (!cb.checked) {
              cb.disabled = true;
            }
          });
        } else {
          allChecks.forEach(cb => {
            cb.disabled = false;
          });
        }
      };

      // Créer la grille des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section, sectionIndex) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');
        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Titre
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label; // ex. <h2>Analyse…</h2>
        sectionDiv.appendChild(sectionTitle);

        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        // On parcourt section.options
        if (Array.isArray(section.options)) {
          // Filtrer les user_input
          const normalOptions = section.options.filter(o => o.action !== 'user_input');

          normalOptions.forEach((opt, optIndex) => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('option-container');
            // Stocket l'action
            // ex. data-action="all" si c’est l’option “all”
            optionDiv.dataset.action = opt.action || "";

            const input = document.createElement('input');
            input.type = multiselect ? "checkbox" : "radio";
            // Pour identifier la section => name unique
            input.name = `option-${sectionIndex}`;

            const label = document.createElement('label');
            label.innerHTML = opt.name;

            // Gérer le changement
            input.addEventListener('change', () => {
              updateTotalChecked();
              if (!multiselect) {
                // single select => envoi direct (facultatif)
                console.log("Sélection simple:", opt.name);
                // => vous pouvez griser le menu
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: {
                    selection: opt.name,
                    buttonPath: 'Default'
                  }
                });
              }
            });

            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            optionsContainer.appendChild(optionDiv);
          });

          // Gérer d’éventuels champs user_input
          const userInputOpts = section.options.filter(o => o.action === 'user_input');
          userInputOpts.forEach(opt => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');

            const lbl = document.createElement('label');
            lbl.classList.add('user-input-label');
            lbl.textContent = opt.label || "Compléter si besoin";

            const fld = document.createElement('input');
            fld.type = 'text';
            fld.classList.add('user-input-field');
            fld.placeholder = opt.placeholder || '…';

            fld.addEventListener('input', e => {
              userInputValues[opt.label || `userInput-${sectionIndex}`] = e.target.value;
            });

            userInputDiv.appendChild(lbl);
            userInputDiv.appendChild(fld);
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

          // Au clic final => on construit le payload
          buttonElem.addEventListener('click', () => {
            const selectedOptions = sections.map((section, idx) => {
              const sectionElement = sectionsGrid.querySelectorAll('.section-container')[idx];
              if (!sectionElement) return null;

              // Récupérer tous les checkboxes cochés
              let checkedInputs = Array.from(sectionElement.querySelectorAll('input[type="checkbox"]:checked'));
              let normalSelections = [];
              let hasAll = false;

              // On parcourt chacun
              checkedInputs.forEach(chk => {
                // Vérifier l’action associée 
                const action = chk.parentElement.dataset.action || "";
                const labelEl = chk.nextElementSibling;
                const labelText = labelEl ? labelEl.innerHTML : "";

                if (action === "all") {
                  hasAll = true;
                } else {
                  normalSelections.push(labelText);
                }
              });

              // Si “all” est coché => on récupère la liste complète des chapitres “action: ""”
              // c.-à-d. tous les inputs dans la section dont dataset.action = ""
              if (hasAll) {
                const allChapters = Array.from(sectionElement.querySelectorAll('.option-container'))
                  .filter(div => (div.dataset.action === "")) // chapitre normal
                  .map(div => {
                    const lbl = div.querySelector('label');
                    return lbl ? lbl.innerHTML : "";
                  });
                // On fusionne tout
                normalSelections = [...new Set([...normalSelections, ...allChapters])];
              }

              // Récupération d’un éventuel userInput
              let userInputVal = "";
              // Si on a des champs user_input
              const userInputsForSection = sectionElement.querySelectorAll('.user-input-container');
              if (userInputsForSection) {
                userInputsForSection.forEach(u => {
                  const fld = u.querySelector('input.user-input-field');
                  if (fld && fld.value.trim() !== "") {
                    userInputVal += (userInputVal ? " | " : "") + fld.value.trim();
                  }
                });
              }

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

            // Payload final => Voiceflow
            const finalPayload = {
              selections: selectedOptions,
              buttonText: btn.text,
              buttonPath: btn.path || 'Default',
              isEmpty: selectedOptions.every(sec => (sec.selections.length === 0 && !sec.userInput)),
            };

            // Si "Revenir" ou "Return"
            if (btn.text.includes("Revenir") || btn.text.includes("Return")) {
              finalPayload.buttonPath = "Previous_step";
            }

            console.log("Envoi payload final => Voiceflow:", finalPayload);

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
      console.log("Rendu MultiSelect terminé (option 'all' => injection de tous les chapitres)");
    } catch (err) {
      console.error("Erreur MultiSelect:", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  },
};
