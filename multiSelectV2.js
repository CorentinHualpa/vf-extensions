export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  // On ne veut gérer QUE les traces multi_select qui contiennent VRAIMENT notre payload.sections
  match: ({ trace }) =>
    trace.type === 'multi_select' &&
    trace.payload &&
    Array.isArray(trace.payload.sections) &&
    trace.payload.sections.length > 0,

  render: ({ trace, element }) => {
    try {
      console.log("▶️ Démarrage MultiSelect corrigé");

      // ─── 1) Extraction du payload ─────────────────────────────
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 0,
        multiselect = true,
      } = trace.payload;

      // Pour stocker la saisie libre
      const userInputValues = {};

      // ─── 2) Création du container + injection des styles ───────
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* RESET box-sizing */
        .multiselect-container,
        .multiselect-container * {
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
        /* Grille des sections (max 2 colonnes) */
        .multiselect-container .sections-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 16px !important;
        }
        .multiselect-container.one-section .sections-grid {
          grid-template-columns: 1fr !important;
        }
        /* Chaque section */
        .multiselect-container .section-container {
          display: flex !important;
          flex-direction: column !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }
        /* Titre de section */
        .multiselect-container .section-title {
          display: block !important;
          padding: 12px !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 1em !important;
          border-bottom: 1px solid rgba(255,255,255,0.3) !important;
          margin-bottom: 8px !important;
        }
        /* Liste d'options */
        .multiselect-container .options-list {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        .multiselect-container .options-list.grid-2cols {
          grid-template-columns: 1fr 1fr !important;
        }
        /* Bloc non-cliquable (children) */
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
        /* Option cliquable */
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
          background-color: rgba(0,0,0,${Math.min(backgroundOpacity + 0.1,1)}) !important;
        }
        /* Checkbox & radio rondes */
        .multiselect-container .option-container input[type="checkbox"],
        .multiselect-container .option-container input[type="radio"] {
          all: unset !important;
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
        /* Champ libre */
        .multiselect-container .user-input-container {
          margin-top: 8px !important;
          grid-column: 1 / -1 !important;
        }
        .multiselect-container .user-input-label {
          display: block !important;
          margin-bottom: 4px !important;
          color: #fff !important;
          font-weight: 500 !important;
          font-size: 0.85em !important;
        }
        .multiselect-container .user-input-field {
          width: 100% !important;
          padding: 6px !important;
          border-radius: 4px !important;
          border: 1px solid rgba(255,255,255,0.3) !important;
          font-size: 0.85em !important;
        }
        .multiselect-container .user-input-field:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.3) !important;
          border-color: ${buttonColor} !important;
        }
        /* Boutons custom */
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

      // ─── 3) Gestion du maxSelect ────────────────────────────────
      const updateTotalChecked = () => {
        const inputs = Array.from(container.querySelectorAll('input'));
        const count = inputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && count >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          inputs.forEach(i => i.disabled = false);
        }
      };

      // ─── 4) Création d'une option (children ou clickable) ───────
      const createOptionElement = opt => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const cw = document.createElement('div');
          cw.classList.add('children-options');
          opt.children.forEach(ch => cw.appendChild(createOptionElement(ch)));
          block.appendChild(cw);
          return block;
        }
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        wrap.appendChild(inp);
        const lbl = document.createElement('label');
        lbl.innerHTML = opt.name; // On conserve l'HTML
        wrap.appendChild(lbl);

        inp.addEventListener('change', () => {
          updateTotalChecked();
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: { selection: opt.name, buttonPath: 'Default' }
            });
          }
        });
        return wrap;
      };

      // ─── 5) Montage des sections + options ──────────────────────
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach(sec => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        if (sec.color) sc.style.backgroundColor = sec.color;

        // titre
        if (sec.label) {
          const h = document.createElement('div');
          h.classList.add('section-title');
          h.innerHTML = sec.label;
          sc.appendChild(h);
        }

        // options
        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if (sec.options.length > 10) ol.classList.add('grid-2cols');

        sec.options.forEach(opt => {
          if (opt.action === 'user_input') {
            userInputValues[sec.label] = '';
            const ui = document.createElement('div');
            ui.classList.add('user-input-container');
            const lab = document.createElement('label');
            lab.classList.add('user-input-label');
            lab.textContent = opt.label;
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.classList.add('user-input-field');
            inp.placeholder = opt.placeholder || '';
            inp.addEventListener('input', e => {
              userInputValues[sec.label] = e.target.value;
            });
            inp.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                const v = inp.value.trim();
                if (!v) return;
                container.classList.add('disabled-container');
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: { isUserInput: true, userInput: v, buttonPath: 'Default' }
                });
              }
            });
            ui.append(lab, inp);
            ol.appendChild(ui);
          } else {
            ol.appendChild(createOptionElement(opt));
          }
        });

        sc.appendChild(ol);
        grid.appendChild(sc);
      });
      container.appendChild(grid);

      // ─── 6) Boutons custom (n’interfèrent plus avec les quick-replies natifs) ─
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = cfg.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const out = sections.map((sec, i) => {
              const ds = grid.children[i];
              const ck = Array.from(ds.querySelectorAll('input:checked'));
              const sels = ck.map(cb => 
                cb.closest('.option-container').querySelector('label').innerHTML.trim()
              );
              return {
                section: sec.label,
                selections: sels,
                userInput: userInputValues[sec.label] || ''
              };
            }).filter(x => x.selections.length || x.userInput);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: out,
                buttonText: cfg.text,
                buttonPath: cfg.path || 'Default',
                isEmpty: out.every(x=>!x.selections.length && !x.userInput)
              }
            });
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      // ─── 7) Injection finale ─────────────────────────────────────
      element.appendChild(container);
      console.log("✅ MultiSelect prêt");
    } catch (err) {
      console.error("❌ Erreur MultiSelect :", err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
