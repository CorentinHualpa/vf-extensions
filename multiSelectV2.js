export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect corrigé");

      // ───────────
      // 1) Récupère le payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // utilitaire pour nettoyer un HTML échappé
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // ───────────
      // 2) Création du container et des styles
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

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
        .multiselect-container * { box-sizing: border-box; }

        .sections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px,1fr));
          gap: 16px;
        }
        .multiselect-container.one-section .sections-grid {
          grid-template-columns: 1fr;
        }
        .section-container {
          background-color: #673AB7;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .section-title {
          color: white;
          font-size: 1em;
          font-weight: 600;
          margin: 0;
          padding: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.3);
        }

        .options-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          padding: 8px;
        }
        /* si >10 options, on passe à deux colonnes */
        .options-list.grid-2cols {
          grid-template-columns: 1fr 1fr;
        }

        .non-selectable-block {
          background-color: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 6px 10px;
          color: #fff;
        }
        .children-options {
          margin: 4px 0 0 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .option-container {
          display: flex;
          align-items: center;
        }
        .option-container.greyed-out-option label {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .option-container label {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px;
          background-color: rgba(0,0,0,${backgroundOpacity});
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .option-container label:hover {
          background-color: rgba(0,0,0,${Math.min(backgroundOpacity+0.1,1)});
        }

        .option-container input[type="checkbox"],
        .option-container input[type="radio"] {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid ${buttonColor};
          border-radius: 50%;
          background-color: #fff;
          cursor: pointer;
          position: relative;
        }
        .option-container input:checked::after {
          content: '';
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${buttonColor};
          position: absolute;
          left: 3px;
          top: 3px;
        }

        .buttons-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 15px 0;
        }
        .submit-btn {
          background: ${buttonColor};
          color: #fff;
          padding: 8px 15px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9em;
          transition: all 0.2s ease;
        }
        .submit-btn:hover {
          opacity: 0.9;
        }

        .disabled-container {
          opacity: 0.5;
          pointer-events: none;
        }
      `;
      container.appendChild(styleEl);

      // ───────────
      // 3) Gestion du maxSelect
      const updateTotalChecked = () => {
        const checks = Array.from(
          container.querySelectorAll('input[type="checkbox"], input[type="radio"]')
        );
        const n = checks.filter(cb => cb.checked).length;
        if (totalMaxSelect > 0 && n >= totalMaxSelect && multiselect) {
          checks.forEach(cb => { if (!cb.checked) cb.disabled = true; });
        } else {
          checks.forEach(cb => {
            if (!cb.closest('.greyed-out-option')) cb.disabled = false;
          });
        }
      };

      // ───────────
      // 4) Création d’une option (+children)
      const createOptionElement = (opt, sectionIndex) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const childWrap = document.createElement('div');
          childWrap.classList.add('children-options');
          opt.children.forEach(ch => childWrap.appendChild(createOptionElement(ch, sectionIndex)));
          block.appendChild(childWrap);
          return block;
        }
        const wrapper = document.createElement('div');
        wrapper.classList.add('option-container');

        const input = document.createElement('input');
        input.type = multiselect ? 'checkbox' : 'radio';

        if (opt.grey) {
          wrapper.classList.add('greyed-out-option');
          input.disabled = true;
        }

        input.addEventListener('change', () => {
          updateTotalChecked();
          // single-select → envoi direct & lock UI
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type: 'action',
              payload: {
                selection: opt.name,
                buttonPath: 'Default'
              }
            });
          }
        });

        const label = document.createElement('label');
        label.appendChild(input);
        const span = document.createElement('span');
        span.innerHTML = opt.name;
        label.appendChild(span);
        wrapper.appendChild(label);
        return wrapper;
      };

      // ───────────
      // 5) Construction des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');
      if (sections.length === 1) container.classList.add('one-section');

      sections.forEach((section, secIndex) => {
        const sDiv = document.createElement('div');
        sDiv.classList.add('section-container');
        if (section.color) sDiv.style.backgroundColor = section.color;

        const rawLabel = section.label || '';
        const cleanLabel = stripHTML(rawLabel).trim();
        if (cleanLabel) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = cleanLabel;
          sDiv.appendChild(h2);
        }

        const optsList = document.createElement('div');
        optsList.classList.add('options-list');
        // si plus de 10 éléments, deux colonnes
        if ((section.options||[]).length > 10) {
          optsList.classList.add('grid-2cols');
        }
        (section.options || []).forEach(opt => {
          optsList.appendChild(createOptionElement(opt, secIndex));
        });
        sDiv.appendChild(optsList);
        sectionsGrid.appendChild(sDiv);
      });

      container.appendChild(sectionsGrid);

      // ───────────
      // 6) Les boutons “Valider” (uniquement en multi‑select)
      if (multiselect && buttons.length) {
        const btnWrap = document.createElement('div');
        btnWrap.classList.add('buttons-container');
        buttons.forEach(btn => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = btn.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');

            // on collecte les sélections
            const finalSections = sections.map((sec, idx) => {
              const dom = sectionsGrid.children[idx];
              const checked = Array.from(dom.querySelectorAll('input:checked'));
              let sels = [], hasAll = false;
              checked.forEach(cb => {
                if (cb.closest('.option-container').dataset.action === 'all') {
                  hasAll = true;
                } else {
                  sels.push(cb.parentElement.querySelector('span').textContent.trim());
                }
              });
              if (hasAll) {
                const all = Array.from(dom.querySelectorAll('.option-container'))
                  .filter(w => w.dataset.action !== 'all')
                  .map(w => w.querySelector('span').textContent.trim());
                sels = Array.from(new Set([...sels, ...all]));
              }
              return { section: sec.label, selections: sels, userInput: '' };
            }).filter(x => x);

            const payload = {
              selections: finalSections,
              buttonText: btn.text,
              buttonPath: /Revenir|Return/.test(btn.text) ? 'Previous_step' : (btn.path || 'Default'),
              isEmpty: finalSections.every(s => s.selections.length === 0)
            };

            // <-- ici on déclenche bien un EVENT de type "action"
            window.voiceflow.chat.interact({
              type: 'action',
              payload
            });
          });
          btnWrap.appendChild(b);
        });
        container.appendChild(btnWrap);
      }

      // ───────────
      // 7) On injecte
      element.appendChild(container);
      console.log("MultiSelect corrigé prêt");
    } catch (err) {
      console.error("Erreur dans MultiSelect :", err);
      window.voiceflow.chat.interact({
        type: 'action',
        payload: { error: true, message: err.message }
      });
    }
  }
};
