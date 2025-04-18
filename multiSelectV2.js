export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect corrigé");

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

      // 2) Création du container et des styles
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .multiselect-container { /* … vos styles ici … */ }
        /* supprimez tout usage de !important pour grid, couleurs inline sont privilégiées */
        /* … */
      `;
      container.appendChild(styleEl);

      // 3) Fonction de mise à jour du nombre de cochés
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

      // 4) Création récursive d’une option (checkbox/radio ou bloc non‑sélectionnable)
      const createOptionElement = (opt, sectionIndex) => {
        // children = bloc non‑cliquable
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

        // option radio/checkbox
        const wrapper = document.createElement('div');
        wrapper.classList.add('option-container');
        if (opt.grey) {
          wrapper.classList.add('greyed-out-option');
        }

        const input = document.createElement('input');
        input.type = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) input.disabled = true;

        input.addEventListener('change', () => {
          updateTotalChecked();

          // single‑select immédiat
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type: 'action',
              payload: {
                selection: stripHTML(opt.name),
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

      // 5) Montage des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');
      if (sections.length === 1) sectionsGrid.classList.add('one-section');

      sections.forEach((section, idx) => {
        const sDiv = document.createElement('div');
        sDiv.classList.add('section-container');
        if (section.color) sDiv.style.backgroundColor = section.color;

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
        // si beaucoup d'options, on passe en 2 colonnes
        if ((section.options||[]).length > 10) optsList.classList.add('grid-2cols');

        (section.options || []).forEach(opt => {
          optsList.appendChild(createOptionElement(opt, idx));
        });
        sDiv.appendChild(optsList);

        sectionsGrid.appendChild(sDiv);
      });
      container.appendChild(sectionsGrid);

      // 6) Boutons (multi‑select)
      if (multiselect && buttons.length) {
        const btnWrap = document.createElement('div');
        btnWrap.classList.add('buttons-container');

        buttons.forEach(btn => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = btn.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');

            // collecte du payload
            const finalSections = sections.map((sec, sIdx) => {
              const dom = sectionsGrid.children[sIdx];
              const checked = Array.from(dom.querySelectorAll('input:checked'));
              let sels = [], hasAll = false;

              checked.forEach(cb => {
                const txt = cb.parentElement.querySelector('span').textContent.trim();
                if (cb.closest('.option-container').dataset.action === 'all') hasAll = true;
                else sels.push(txt);
              });

              if (hasAll) {
                const all = Array.from(dom.querySelectorAll('.option-container'))
                                .map(w => w.querySelector('span').textContent.trim());
                sels = Array.from(new Set([...sels, ...all]));
              }

              return { section: sec.label, selections: sels, userInput: '' };
            }).filter(x => x.selections.length);

            const payload = {
              selections: finalSections,
              buttonText: btn.text,
              buttonPath: btn.path || 'Default',
              isEmpty: finalSections.length === 0
            };

            window.voiceflow.chat.interact({
              type: 'action',
              payload
            });
          });
          btnWrap.appendChild(b);
        });

        container.appendChild(btnWrap);
      }

      // 7) Injection
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
