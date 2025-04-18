export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect corrigé");

      // 1) Récupération du payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,     // comme vos autres menus
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // 2) utilitaire HTML→texte
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // 3) Création du container principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // 4) Injection des styles (gradient + overrides)
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* container principal */
        .multiselect-container {
          width:100%;
          max-width:100%;
          margin:0 auto;
          font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
          box-sizing:border-box;
          font-size:0.9em;
        }
        .multiselect-container * { box-sizing:border-box; }

        /* grille des sections */
        .multiselect-container .sections-grid {
          display:flex;
          flex-wrap:wrap;
          gap:16px;
          justify-content:center;
        }
        .multiselect-container .section-container {
          flex:0 1 calc(50% - 16px);
          min-width:300px;
          background-color:#673AB7; /* violet standard */
          border-radius:6px;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
          display:flex;
          flex-direction:column;
          overflow:hidden;
        }
        @media (max-width:800px) {
          .multiselect-container .section-container {
            flex:1 1 100%;
          }
        }

        /* TITRE DE SECTION avec gradient violet */
        .multiselect-container .section-title {
          color:transparent;
          background: linear-gradient(
            90deg,
            #C29BFF, /* lavande */
            #7E2BD4, /* violet princ. */
            #4A1B8E  /* violet prof. */
          );
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight:700;
          font-size:1.1em;
          margin:0;
          padding:12px 16px;
          border-bottom:1px solid rgba(255,255,255,0.3);
        }

        /* listes d'options */
        .multiselect-container .options-list {
          display:flex;
          flex-direction:column;
        }
        .multiselect-container .option-container {
          display:flex;
          align-items:center;
          padding:4px 8px;
        }
        .multiselect-container .option-container.greyed-out-option label {
          opacity:0.5;
          cursor:not-allowed;
        }
        .multiselect-container .option-container label {
          display:flex;
          align-items:center;
          gap:8px;
          width:100%;
          padding:8px;
          background:rgba(0,0,0,${backgroundOpacity});
          color:#fff;
          border-radius:4px;
          cursor:pointer;
          transition:background 0.2s;
        }
        .multiselect-container .option-container label:hover {
          background:rgba(0,0,0,${Math.min(backgroundOpacity+0.1,1)});
        }

        /* input checkbox/radio */
        .multiselect-container .option-container input {
          margin:0;
          padding:0;
          width:16px;
          height:16px;
          accent-color:${buttonColor};
          cursor:pointer;
        }
        .multiselect-container .option-container input[type="radio"] {
          appearance:radio;
          -webkit-appearance:radio;
          border-radius:50%;
        }

        /* quand c'est coché */
        .multiselect-container .option-container input:checked + label {
          background-color:${buttonColor};
        }

        /* boutons multi-select */
        .multiselect-container .buttons-container {
          display:flex;
          justify-content:center;
          gap:10px;
          padding:12px;
        }
        .multiselect-container .submit-btn {
          background:${buttonColor};
          color:#fff;
          border:none;
          border-radius:5px;
          padding:8px 15px;
          font-weight:600;
          cursor:pointer;
          transition:opacity 0.2s;
        }
        .multiselect-container .submit-btn:hover {
          opacity:0.9;
        }

        /* verrouillage après envoi */
        .multiselect-container.disabled-container {
          opacity:0.5;
          pointer-events:none;
        }
      `;
      container.appendChild(styleEl);

      // 5) Gestion du max select
      const updateTotalChecked = () => {
        const inputs = Array.from(container.querySelectorAll('input'));
        const n = inputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && n >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          inputs.forEach(i => {
            if (!i.closest('.greyed-out-option')) i.disabled = false;
          });
        }
      };

      // 6) Création récursive des options
      const createOptionElement = (opt, sectionIndex) => {
        // sous-bloc non-cliquable
        if (Array.isArray(opt.children) && opt.children.length) {
          const blk = document.createElement('div');
          blk.classList.add('non-selectable-block');
          blk.innerHTML = opt.name;
          const cw = document.createElement('div');
          cw.classList.add('children-options');
          opt.children.forEach(ch => cw.appendChild(createOptionElement(ch, sectionIndex)));
          blk.appendChild(cw);
          return blk;
        }
        // option cliquable
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

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

        wrap.appendChild(label);
        return wrap;
      };

      // 7) Construction des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');
      sections.forEach((section, i) => {
        const sDiv = document.createElement('div');
        sDiv.classList.add('section-container');
        if (section.color) sDiv.style.backgroundColor = section.color;

        // n’affiche le titre que si non vide
        const txt = stripHTML(section.label).trim();
        if (txt) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = txt;
          sDiv.appendChild(h2);
        }

        const optsList = document.createElement('div');
        optsList.classList.add('options-list');
        (section.options || []).forEach(opt => optsList.appendChild(createOptionElement(opt, i)));
        sDiv.appendChild(optsList);

        sectionsGrid.appendChild(sDiv);
      });
      container.appendChild(sectionsGrid);

      // 8) Boutons multi-select (si activé)
      if (multiselect && buttons.length) {
        const btnWrap = document.createElement('div');
        btnWrap.classList.add('buttons-container');
        buttons.forEach(bConf => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = bConf.text;
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
                buttonText: bConf.text,
                buttonPath: /Revenir|Return/.test(bConf.text) ? 'Previous_step' : (bConf.path || 'Default'),
                isEmpty: finalSections.every(s => s.selections.length === 0)
              }
            });
          });
          btnWrap.appendChild(b);
        });
        container.appendChild(btnWrap);
      }

      // 9) Injection finale
      element.appendChild(container);
      console.log("✅ MultiSelect corrigé prêt");
    } catch (err) {
      console.error("Erreur dans MultiSelect :", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
