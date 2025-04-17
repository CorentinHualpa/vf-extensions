export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect (bloc cliquable + 'all' => injection)");

      // ───────────
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

      // utilitaire pour stripper tout HTML/entités des labels
      const stripHTML = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // Variables
      let totalChecked = 0;

      // Conteneur principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Styles (inchangés de ton code d’origine)
      const styleEl = document.createElement('style');
      styleEl.textContent = `
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
          }
        }
        .multiselect-container .section-title {
          color: white;
          font-size: 1em;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .non-selectable-block {
          background-color: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 6px 10px;
          color: #fff;
        }
        .children-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-left: 20px;
          margin-top: 4px;
        }
        .option-container {
          position: relative;
          margin: 0 6px;
        }
        .option-container label {
          display: inline-flex;
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
        .option-container input[type="checkbox"],
        .option-container input[type="radio"] {
          cursor: pointer;
          margin-right: 8px;
          width: 16px;
          height: 16px;
          accent-color: ${buttonColor};
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
      `;
      container.appendChild(styleEl);

      // Fonction pour gérer le max de sélection
      const updateTotalChecked = () => {
        const checks = container.querySelectorAll('input[type="checkbox"], input[type="radio"]');
        const checkedCount = [...checks].filter(cb => cb.checked).length;
        if (totalMaxSelect > 0 && checkedCount >= totalMaxSelect && multiselect) {
          checks.forEach(cb => {
            if (!cb.checked) cb.disabled = true;
          });
        } else {
          checks.forEach(cb => cb.disabled = false);
        }
      };

      // Création récursive des options (niveau 2 + 3)
      const createOptionElement = (opt, sectionIndex) => {
        const hasChildren = Array.isArray(opt.children) && opt.children.length > 0;
        if (hasChildren) {
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const childrenDiv = document.createElement('div');
          childrenDiv.classList.add('children-options');
          opt.children.forEach(child => {
            childrenDiv.appendChild(createOptionElement(child, sectionIndex));
          });
          block.appendChild(childrenDiv);
          return block;
        } else {
          const optionDiv = document.createElement('div');
          optionDiv.classList.add('option-container');
          optionDiv.dataset.action = opt.action || "";

          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          input.addEventListener('change', () => {
            updateTotalChecked();
            if (!multiselect) {
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  selection: opt.name,
                  buttonPath: 'Default'
                }
              });
            }
          });

          const label = document.createElement('label');
          label.appendChild(input);
          const textSpan = document.createElement('span');
          textSpan.innerHTML = opt.name;
          label.appendChild(textSpan);

          optionDiv.appendChild(label);
          return optionDiv;
        }
      };

      // Conteneur des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section, secIndex) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');
        if (section.color) sectionDiv.style.backgroundColor = section.color;

        // ** Ici on injecte un vrai <h2> **
        const sectionTitle = document.createElement('h2');
        sectionTitle.classList.add('section-title');
        sectionTitle.textContent = stripHTML(section.label);
        sectionDiv.appendChild(sectionTitle);

        const optionsList = document.createElement('div');
        optionsList.classList.add('options-list');
        if (Array.isArray(section.options)) {
          section.options.forEach(opt => {
            optionsList.appendChild(createOptionElement(opt, secIndex));
          });
        }
        sectionDiv.appendChild(optionsList);
        sectionsGrid.appendChild(sectionDiv);
      });

      container.appendChild(sectionsGrid);

      // Boutons de validation
      if (buttons.length > 0) {
        const btnContainer = document.createElement('div');
        btnContainer.classList.add('buttons-container');
        buttons.forEach(btn => {
          const buttonElem = document.createElement('button');
          buttonElem.classList.add('submit-btn');
          buttonElem.textContent = btn.text;
          buttonElem.addEventListener('click', () => {
            const finalSections = sections.map((section, sIdx) => {
              const sDiv = sectionsGrid.children[sIdx];
              const checked = [...sDiv.querySelectorAll('input:checked')];
              let sel = [], hasAll = false;
              checked.forEach(chk => {
                const actionVal = chk.closest('.option-container')?.dataset.action;
                const txt = chk.parentNode.querySelector('span').textContent.trim();
                if (actionVal === 'all') hasAll = true;
                else sel.push(txt);
              });
              if (hasAll) {
                const allOpts = [...sDiv.querySelectorAll('.option-container')]
                  .filter(d => d.dataset.action === '')
                  .map(d => d.querySelector('span').textContent.trim());
                sel = [...new Set([...sel, ...allOpts])];
              }
              return { section: section.label, selections: sel, userInput: '' };
            }).filter(s => s);

            btnContainer.querySelectorAll('.submit-btn').forEach(b => b.style.display = 'none');
            const finalPayload = {
              selections: finalSections,
              buttonText: btn.text,
              buttonPath: btn.text.match(/Revenir|Return/) ? 'Previous_step' : btn.path || 'Default',
              isEmpty: finalSections.every(s => s.selections.length === 0)
            };

            console.log("Envoi final => Voiceflow:", finalPayload);
            window.voiceflow.chat.interact({ type: 'complete', payload: finalPayload });
          });
          btnContainer.appendChild(buttonElem);
        });
        container.appendChild(btnContainer);
      }

      element.appendChild(container);
      console.log("MultiSelect final => ok");
    } catch (err) {
      console.error("Erreur MultiSelect:", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
