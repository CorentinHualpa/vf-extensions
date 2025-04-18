export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      // ─── 1) PAYLOAD ──────────────────────────
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // ─── 2) CONTENEUR + STYLE RESET ──────────
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* RESET DU CONTENEUR (sans toucher aux sections) */
        .multiselect-container {
          all: unset !important;
          box-sizing: border-box !important;
        }

        /* RESET UNIQUEMENT POUR LES OPTIONS & BOUTONS */
        .multiselect-container .option-container,
        .multiselect-container .option-container *,
        .multiselect-container .buttons-container,
        .multiselect-container .buttons-container * {
          all: unset !important;
          box-sizing: border-box !important;
        }

        /* Container principal */
        .multiselect-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
          font-size: 0.9em !important;
        }

        /* GRID DES SECTIONS */
        .multiselect-container .sections-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(300px,1fr)) !important;
          gap: 16px !important;
        }
        .multiselect-container.one-section .sections-grid {
          grid-template-columns: 1fr !important;
        }

        /* CHAQUE SECTION (couleur inline via style attribute) */
        .multiselect-container .section-container {
          display: flex !important;
          flex-direction: column !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }

        /* TITRE (on injecte directement ton <h2>…) */
        .multiselect-container .section-title {
          display: block !important;
          padding: 12px !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 1em !important;
          border-bottom: 1px solid rgba(255,255,255,0.3) !important;
          margin-bottom: 8px !important;
        }

        /* LISTE D’OPTIONS */
        .multiselect-container .options-list {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        .multiselect-container .options-list.grid-2cols {
          grid-template-columns: 1fr 1fr !important;
        }

        /* BLOC NON-CLIQUABLE */
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

        /* OPTION CLIQUABLE */
        .multiselect-container .option-container {
          display: flex !important;
          align-items: center !important;
        }
        .multiselect-container .option-container.greyed-out-option label {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
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
          background-color: rgba(0,0,0,${Math.min(backgroundOpacity+0.1,1)}) !important;
        }

        /* CASES & RADIOS RONDS */
        .multiselect-container .option-container input[type="checkbox"],
        .multiselect-container .option-container input[type="radio"] {
          display: inline-block !important;
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

        /* BOUTONS MULTI‑SELECT */
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
          text-align: center !important;
          transition: opacity 0.2s !important;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.85 !important;
        }

        /* LOCK UI */
        .multiselect-container.disabled-container {
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `;
      container.appendChild(styleEl);

      // ─── 3) Gestion du max‑select ───────────────
      const updateTotalChecked = () => {
        const inputs = Array.from(container.querySelectorAll('input'));
        const checked = inputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checked >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          inputs.forEach(i => {
            if (!i.closest('.greyed-out-option')) i.disabled = false;
          });
        }
      };

      // ─── 4) Création récursive d’une option ─────
      const createOptionElement = (opt, sectionIndex) => {
        // bloc non‑cliquable ?
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
        // sinon Checkbox/Radio
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
              payload: {
                selection: opt.name,
                buttonPath: 'Default'
              }
            });
          }
        });

        const label = document.createElement('label');
        label.appendChild(input);
        const span  = document.createElement('span');
        span.innerHTML = opt.name;
        label.appendChild(span);
        wrap.appendChild(label);
        return wrap;
      };

      // ─── 5) Montage des sections ───────────────
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach((sec, idx) => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        if (sec.color) sc.style.backgroundColor = sec.color;

        // **on INJECTE LE HTML** du label (ça affiche ton <h2>…</h2>)
        if (sec.label) {
          const hdr = document.createElement('div');
          hdr.classList.add('section-title');
          hdr.innerHTML = sec.label;
          sc.appendChild(hdr);
        }

        const opts = document.createElement('div');
        opts.classList.add('options-list');
        if ((sec.options||[]).length > 10) opts.classList.add('grid-2cols');
        sec.options.forEach(opt => opts.appendChild(createOptionElement(opt, idx)));
        sc.appendChild(opts);

        grid.appendChild(sc);
      });
      container.appendChild(grid);

      // ─── 6) Montage des boutons ───────────────
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = cfg.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');
            // … collecte & interact()
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      // ─── 7) Injection finale ─────────────────
      element.appendChild(container);
      console.log("✅ MultiSelect prêt et couleurs respectées");

    } catch (err) {
      console.error("Erreur MultiSelect :", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
