export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect vGrid+CouleursPayload");

      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* RESET */
        .multiselect-container, .multiselect-container * {
          all: unset !important;
          box-sizing: border-box !important;
        }

        /* Conteneur principal */
        .multiselect-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
          font-size: 0.9em !important;
        }

        /*  ── Grille responsive des sections ── */
        .multiselect-container .sections-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
          gap: 16px !important;
        }

        .multiselect-container .section-container {
          display: flex !important;
          flex-direction: column !important;
          /* PLUS de background-color: ici on laisse l’inline style ! */
          border-radius: 6px !important;
          margin: 8px !important;
          overflow: hidden !important;
        }

        /* Titre en blanc */
        .multiselect-container .section-title {
          display: block !important;
          padding: 12px !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 1em !important;
          border-bottom: 1px solid rgba(255,255,255,0.3) !important;
          margin-bottom: 8px !important;
        }

        /* Liste d’options */
        .multiselect-container .options-list {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        .multiselect-container .options-list.grid-2cols {
          grid-template-columns: 1fr 1fr !important;
        }

        /* Options non‑cliquables */
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

        /* Case & radio ronds */
        .multiselect-container .option-container input[type="checkbox"],
        .multiselect-container .option-container input[type="radio"] {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 16px !important;
          height: 16px !important;
          border: 2px solid ${buttonColor} !important;
          border-radius: 50% !important;
          background-color: #fff !important;
          cursor: pointer !important;
        }
        .multiselect-container .option-container input:checked::after {
          content: '' !important;
          display: block !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background-color: ${buttonColor} !important;
          margin: auto !important;
        }

        /* Label d’option */
        .multiselect-container .option-container label {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          width: 100% !important;
          padding: 8px !important;
          background-color: rgba(0,0,0,${backgroundOpacity}) !important;
          color: #fff !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          transition: background 0.2s !important;
        }
        .multiselect-container .option-container label:hover {
          background-color: rgba(0,0,0,${Math.min(backgroundOpacity + 0.1,1)}) !important;
        }
        .multiselect-container .option-container.greyed-out-option label {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        /* Boutons multi‑select */
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
          cursor: pointer !important;
          transition: opacity 0.2s !important;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.85 !important;
        }

        /* Lock UI */
        .multiselect-container.disabled-container {
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `;
      container.appendChild(styleEl);

      // handler max‑select
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

      // création récursive d’une option
      const createOptionElement = (opt, sectionIndex) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const cw = document.createElement('div');
          cw.classList.add('children-options');
          opt.children.forEach(ch => cw.appendChild(createOptionElement(ch, sectionIndex)));
          block.appendChild(cw);
          return block;
        }
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

      // montage des sections
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach((sec, i) => {
        const secDiv = document.createElement('div');
        secDiv.classList.add('section-container');
        // **inline** : couleur depuis ton payload
        if (sec.color) secDiv.style.backgroundColor = sec.color;

        const txt = stripHTML(sec.label).trim();
        if (txt) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = txt;
          secDiv.appendChild(h2);
        }

        const optsList = document.createElement('div');
        optsList.classList.add('options-list');
        // si >10 options → 2 colonnes
        if ((sec.options || []).length > 10) {
          optsList.classList.add('grid-2cols');
        }
        (sec.options || []).forEach(opt => optsList.appendChild(createOptionElement(opt, i)));
        secDiv.appendChild(optsList);

        grid.appendChild(secDiv);
      });
      container.appendChild(grid);

      // montage des boutons (si multi‑select)
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.textContent = cfg.text;
          btn.addEventListener('click', () => {
            container.classList.add('disabled-container');
            // collecte & envoi identique à avant...
          });
          bc.appendChild(btn);
        });
        container.appendChild(bc);
      }

      element.appendChild(container);
      console.log("✅ MultiSelect vGrid+CouleursPayload prêt");
    } catch (err) {
      console.error(err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
