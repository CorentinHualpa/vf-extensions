export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect");

      // ─── payload ───────────────────────────────────────────────────────────
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        textColor = '#FFFFFF',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // utilitaire pour nettoyer les labels de tout HTML échappé
      const stripHTML = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // ─── container principal + styles ───────────────────────────────────────
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .multiselect-container { /* idem */
          width: 100%; max-width: 100%; margin: 0 auto;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
          box-sizing: border-box; font-size: 0.9em;
        }
        .multiselect-container * { box-sizing: border-box; }

        .sections-grid {
          display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;
        }
        .section-container {
          flex: 0 1 calc(50% - 16px); min-width: 300px;
          background-color: #673AB7; border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          padding: 10px; display: flex; flex-direction: column;
        }
        @media (max-width: 800px) {
          .section-container { flex: 1 1 100%; }
        }

        .section-title {
          color: white; font-size: 1em; font-weight: 600;
          margin: 0 0 8px 0; padding-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }

        .options-list {
          display: flex; flex-direction: column; gap: 8px; width: 100%;
        }
        .non-selectable-block {
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px; padding: 6px 10px; color: #fff;
        }
        .children-options {
          display: flex; flex-direction: column; gap: 6px;
          margin: 4px 0 0 20px;
        }
        .option-container {
          position: relative; margin: 0 6px; display: flex; align-items: center;
        }
        .option-container.greyed-out-option label {
          opacity: 0.5; cursor: not-allowed;
        }
        .option-container label {
          display: inline-flex; align-items: center; cursor: pointer;
          font-size: 0.85em; border-radius: 4px; padding: 6px 8px;
          color: #fff; background-color: rgba(0,0,0,${backgroundOpacity});
          transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.1);
          width: 100%; line-height: 1.3;
        }
        .option-container label:hover {
          background-color: rgba(0,0,0,${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }
        .option-container input[type="checkbox"],
        .option-container input[type="radio"] {
          cursor: pointer; margin-right: 8px; width: 16px; height: 16px;
          accent-color: ${buttonColor};
        }
        .option-container input:checked + label {
          background-color: ${buttonColor}; border-color: #fff;
          font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .option-container input:disabled + label {
          opacity: 0.5; cursor: not-allowed;
        }

        .buttons-container {
          display: flex; justify-content: center; gap: 10px; margin-top: 15px;
        }
        .submit-btn {
          background: ${buttonColor}; color: #fff; padding: 8px 15px;
          border-radius: 5px; cursor: pointer; border: none;
          font-weight: 600; font-size: 0.9em; transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2); min-width: 130px;
        }
        .submit-btn:hover {
          opacity: 0.9; transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        }
        .submit-btn:active { transform: translateY(0); }

        /* quand on désactive tout le menu après envoi */
        .multiselect-container.disabled-container {
          opacity: 0.5; pointer-events: none;
        }
      `;
      container.appendChild(styleEl);

      // ─── gérer max select ────────────────────────────────────────────────────
      const updateTotalChecked = () => {
        const checks = [...container.querySelectorAll('input[type="checkbox"],input[type="radio"]')];
        const n = checks.filter(cb => cb.checked).length;
        if (totalMaxSelect > 0 && n >= totalMaxSelect && multiselect) {
          checks.forEach(cb => { if (!cb.checked) cb.disabled = true; });
        } else {
          checks.forEach(cb => { if (!cb.closest('.greyed-out-option')) cb.disabled = false; });
        }
      };

      // ─── création récursive des options ──────────────────────────────────────
      const createOptionElement = (opt, sectionIndex) => {
        const hasChildren = Array.isArray(opt.children) && opt.children.length;
        if (hasChildren) {
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const c = document.createElement('div');
          c.classList.add('children-options');
          opt.children.forEach(ch => c.appendChild(createOptionElement(ch, sectionIndex)));
          block.appendChild(c);
          return block;
        }
        // sinon niveau 3
        const divOpt = document.createElement('div');
        divOpt.classList.add('option-container');
        const input = document.createElement('input');
        input.type = multiselect ? 'checkbox' : 'radio';
        // grey ? on grise et on désactive
        if (opt.grey) {
          divOpt.classList.add('greyed-out-option');
          input.disabled = true;
        }
        // event change
        input.addEventListener('change', () => {
          // on grise tout le menu
          container.classList.add('disabled-container');
          updateTotalChecked();
          if (!multiselect) {
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: { selection: opt.name, buttonPath: 'Default' }
            });
          }
        });

        const label = document.createElement('label');
        label.appendChild(input);
        const span = document.createElement('span');
        span.innerHTML = opt.name;
        label.appendChild(span);
        divOpt.appendChild(label);
        return divOpt;
      };

      // ─── génération des sections ─────────────────────────────────────────────
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section, i) => {
        const sDiv = document.createElement('div');
        sDiv.classList.add('section-container');
        if (section.color) sDiv.style.backgroundColor = section.color;

        // vrai <h2> pour le titre
        const title = document.createElement('h2');
        title.classList.add('section-title');
        title.textContent = stripHTML(section.label);
        sDiv.appendChild(title);

        const opts = document.createElement('div');
        opts.classList.add('options-list');
        (section.options||[]).forEach(opt => opts.appendChild(createOptionElement(opt, i)));
        sDiv.appendChild(opts);
        sectionsGrid.appendChild(sDiv);
      });

      container.appendChild(sectionsGrid);

      // ─── boutons de validation ───────────────────────────────────────────────
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(btn => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = btn.text;
          b.addEventListener('click', () => {
            // on grise tout le menu
            container.classList.add('disabled-container');
            // on construit le payload final
            const finalSections = sections.map((sec, idx) => {
              const sDom = sectionsGrid.children[idx];
              const checked = [...sDom.querySelectorAll('input:checked')];
              let selections = [], hasAll = false;
              checked.forEach(cb => {
                if (cb.closest('.option-container').dataset.action==='all') hasAll = true;
                else selections.push(cb.parentNode.querySelector('span').textContent.trim());
              });
              if (hasAll) {
                const all = [...sDom.querySelectorAll('.option-container')]
                  .filter(d=>d.dataset.action!=='all')
                  .map(d=>d.querySelector('span').textContent.trim());
                selections = [...new Set([...selections, ...all])];
              }
              return { section: sec.label, selections, userInput: '' };
            }).filter(x=>x);
            const payload = {
              selections: finalSections,
              buttonText: btn.text,
              buttonPath: /Revenir|Return/.test(btn.text) ? 'Previous_step' : (btn.path||'Default'),
              isEmpty: finalSections.every(s=>s.selections.length===0)
            };
            window.voiceflow.chat.interact({ type:'complete', payload });
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      element.appendChild(container);
      console.log("MultiSelect ready");

    } catch (err) {
      console.error("Erreur MultiSelect:", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
