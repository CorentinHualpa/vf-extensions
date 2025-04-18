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
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }
        .section-container {
          flex: 0 1 calc(50% - 16px);
          min-width: 300px;
          background-color: #673AB7;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          padding: 10px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 800px) {
          .section-container { flex: 1 1 100%; }
        }

        .section-title {
          color: white;
          font-size: 1em;
          font-weight: 600;
          margin: 0 0 8px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }

        .options-list {
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
          margin: 4px 0 0 20px;
        }

        .option-container {
          display: flex;
          align-items: center;
          margin: 0 6px;
        }
        .option-container.greyed-out-option label {
          opacity: 0.5;
          cursor: not-allowed;
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
          width: 100%;
          line-height: 1.3;
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
        /* forcer les radios en rond, même si le CSS parent les réinitialise */
        .option-container input[type="radio"] {
          border-radius: 50%;
          appearance: radio;
          -webkit-appearance: radio;
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
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9em;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          min-width: 130px;
        }
        .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        }
        .submit-btn:active { transform: translateY(0); }

        /* désactive tout le menu global quand on lock l'UI */
        .multiselect-container.disabled-container {
          opacity: 0.5;
          pointer-events: none;
        }
      `;
      container.appendChild(styleEl);

      // ───────────
      // 3) Fonction pour gérer le max de sélections
      const updateTotalChecked = () => {
        const checks = Array.from(container.querySelectorAll('input[type="checkbox"], input[type="radio"]'));
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
      // 4) Création récursive d’une option (et de ses éventuels children)
      const createOptionElement = (opt, sectionIndex) => {
        // niveau 2 = bloc non‑cliquable
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
        // niveau 3 = option cliquable (checkbox ou radio)
        const wrapper = document.createElement('div');
        wrapper.classList.add('option-container');

        const input = document.createElement('input');
        input.type = multiselect ? 'checkbox' : 'radio';

        // si grey = grisé et non‑sélectionnable
        if (opt.grey) {
          wrapper.classList.add('greyed-out-option');
          input.disabled = true;
        }

        input.addEventListener('change', () => {
          updateTotalChecked();
          // en single‑select, on envoie tout de suite et on lock l'UI
          if (!multiselect) {
            container.classList.add('disabled-container');
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

        // on insère l’HTML de l’option (strong, h3, etc.)
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

      sections.forEach((section, secIndex) => {
        const sDiv = document.createElement('div');
        sDiv.classList.add('section-container');
        if (section.color) sDiv.style.backgroundColor = section.color;

        // Only show label if it's defined & non‑vide
        const raw = section.label || '';
        const clean = stripHTML(raw).trim();
        if (clean) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = clean;
          sDiv.appendChild(h2);
        }

        const optsList = document.createElement('div');
        optsList.classList.add('options-list');
        (section.options || []).forEach(opt => {
          optsList.appendChild(createOptionElement(opt, secIndex));
        });
        sDiv.appendChild(optsList);

        sectionsGrid.appendChild(sDiv);
      });

      container.appendChild(sectionsGrid);

      // ───────────
      // 6) Boutons (uniquement en multi‑select)
      if (multiselect && buttons.length) {
        const btnWrap = document.createElement('div');
        btnWrap.classList.add('buttons-container');

        buttons.forEach(btn => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = btn.text;
          b.addEventListener('click', () => {
            // lock UI
            container.classList.add('disabled-container');

            // collecte du payload final
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

            window.voiceflow.chat.interact({ type: 'complete', payload });
          });
          btnWrap.appendChild(b);
        });

        container.appendChild(btnWrap);
      }

      // ───────────
      // 7) Injection dans le DOM
      element.appendChild(container);
      console.log("MultiSelect corrigé prêt");
    } catch (err) {
      console.error("Erreur dans MultiSelect :", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
