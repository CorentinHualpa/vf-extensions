export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect isolé");

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

      // 2) Création du container et du <style>
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* 1. RESET COMPLET pour tout isoler */
        .multiselect-container,
        .multiselect-container * {
          all: unset !important;
          box-sizing: border-box !important;
        }

        /* 2. Conteneur principal */
        .multiselect-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
          font-size: 0.9em !important;
          background: none !important;
        }

        /* 3. Grille des sections */
        .multiselect-container .sections-grid {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 16px !important;
          justify-content: center !important;
        }
        .multiselect-container .section-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 0 1 calc(50% - 16px) !important;
          min-width: 300px !important;
          background-color: #673AB7 !important;
          border-radius: 6px !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100% !important;
          }
        }

        /* 4. Titre de section */
        .multiselect-container .section-title {
          display: block !important;
          padding: 12px 16px !important;
          background: linear-gradient(90deg, #C29BFF, #7E2BD4, #4A1B8E) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          font-weight: 700 !important;
          font-size: 1em !important;
          border-bottom: 1px solid rgba(255,255,255,0.3) !important;
          margin-bottom: 8px !important;
        }

        /* 5. Liste d’options */
        .multiselect-container .options-list {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          width: 100% !important;
          padding: 8px !important;
        }
        .multiselect-container .non-selectable-block {
          background-color: rgba(0,0,0,0.3) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          border-radius: 4px !important;
          padding: 6px 10px !important;
          color: #fff !important;
        }
        .multiselect-container .children-options {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          margin: 4px 0 0 20px !important;
        }

        /* 6. Option container */
        .multiselect-container .option-container {
          display: flex !important;
          align-items: center !important;
          margin: 0 !important;
        }
        .multiselect-container .option-container.greyed-out-option label {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        /* 7. Labels et survol */
        .multiselect-container .option-container label {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          cursor: pointer !important;
          background-color: rgba(0,0,0,${backgroundOpacity}) !important;
          color: #fff !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
          transition: background 0.2s !important;
          width: 100% !important;
          line-height: 1.3 !important;
        }
        .multiselect-container .option-container label:hover {
          background-color: rgba(0,0,0,${Math.min(backgroundOpacity+0.1,1)}) !important;
        }

        /* 8. Checkbox & Radio parfaitement ronds */
        .multiselect-container .option-container input[type="checkbox"],
        .multiselect-container .option-container input[type="radio"] {
          appearance: auto !important;
          -webkit-appearance: auto !important;
          margin: 0 8px 0 0 !important;
          width: 16px !important;
          height: 16px !important;
          accent-color: ${buttonColor} !important;
          border-radius: 50% !important;
          cursor: pointer !important;
        }

        /* 9. État coché (on colorise tout le label) */
        .multiselect-container .option-container input:checked + label,
        .multiselect-container .option-container input:checked ~ span {
          background-color: ${buttonColor} !important;
          border-color: #fff !important;
          font-weight: 600 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
        }

        /* 10. Boutons multi-select */
        .multiselect-container .buttons-container {
          display: flex !important;
          justify-content: center !important;
          gap: 10px !important;
          padding: 12px !important;
        }
        .multiselect-container .submit-btn {
          all: unset !important;
          background-color: ${buttonColor} !important;
          color: #fff !important;
          padding: 8px 12px !important;
          border-radius: 4px !important;
          font-weight: 600 !important;
          text-align: center !important;
          cursor: pointer !important;
          transition: opacity 0.2s !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.85 !important;
        }

        /* 11. Lock UI */
        .multiselect-container.disabled-container {
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `;
      container.appendChild(styleEl);

      // 3) Gère la limite de sélections
      const updateTotalChecked = () => {
        const checks = Array.from(container.querySelectorAll('input'));
        const n = checks.filter(cb => cb.checked).length;
        if (totalMaxSelect > 0 && n >= totalMaxSelect && multiselect) {
          checks.forEach(cb => { if (!cb.checked) cb.disabled = true; });
        } else {
          checks.forEach(cb => {
            if (!cb.closest('.greyed-out-option')) cb.disabled = false;
          });
        }
      };

      // 4) Création récursive des options
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
        if (opt.grey) wrapper.classList.add('greyed-out-option');

        const input = document.createElement('input');
        input.type = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) input.disabled = true;
        input.addEventListener('change', () => {
          updateTotalChecked();
          if (!multiselect) {
            container.classList.add('disabled-container');
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
        wrapper.appendChild(label);
        return wrapper;
      };

      // 5) Montage des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');
      sections.forEach((section, secIndex) => {
        const sDiv = document.createElement('div');
        sDiv.classList.add('section-container');
        if (section.color) sDiv.style.backgroundColor = section.color;

        const raw = stripHTML(section.label);
        if (raw) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = raw;
          sDiv.appendChild(h2);
        }

        const optsList = document.createElement('div');
        optsList.classList.add('options-list');
        (section.options || []).forEach(opt => optsList.appendChild(createOptionElement(opt, secIndex)));
        sDiv.appendChild(optsList);
        sectionsGrid.appendChild(sDiv);
      });
      container.appendChild(sectionsGrid);

      // 6) Boutons (uniquement si multiselect)
      if (multiselect && buttons.length) {
        const btnWrap = document.createElement('div');
        btnWrap.classList.add('buttons-container');
        buttons.forEach(btnCfg => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = btnCfg.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const finalSections = sections.map((sec, idx) => {
              const dom = sectionsGrid.children[idx];
              const checked = Array.from(dom.querySelectorAll('input:checked'));
              let sels = [], hasAll = false;
              checked.forEach(cb => {
                if (cb.closest('.option-container').dataset.action === 'all') hasAll = true;
                else sels.push(cb.parentElement.querySelector('span').textContent.trim());
              });
              if (hasAll) {
                const allOpts = Array.from(dom.querySelectorAll('.option-container'))
                  .filter(d => d.dataset.action !== 'all')
                  .map(d => d.querySelector('span').textContent.trim());
                sels = Array.from(new Set([...sels, ...allOpts]));
              }
              return { section: sec.label, selections: sels, userInput: '' };
            }).filter(x => x);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: finalSections,
                buttonText: btnCfg.text,
                buttonPath: /Revenir|Return/.test(btnCfg.text) ? 'Previous_step' : (btnCfg.path || 'Default'),
                isEmpty: finalSections.every(s => s.selections.length === 0)
              }
            });
          });
          btnWrap.appendChild(b);
        });
        container.appendChild(btnWrap);
      }

      // 7) Injection dans le DOM
      element.appendChild(container);
      console.log("MultiSelect isolé prêt");
    } catch (err) {
      console.error("Erreur dans MultiSelect :", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
