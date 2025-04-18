export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect vFinal");

      // 1) Récupération du payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // utilitaire strip HTML
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // 2) Création du container
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // 3) Styles (clairs, multi‐ligne)
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* ── RESET ── */
        .multiselect-container,
        .multiselect-container * {
          all: unset !important;
          box-sizing: border-box !important;
        }

        /* ── CONTENEUR PRINCIPAL ── */
        .multiselect-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
          font-size: 0.9em !important;
        }

        /* ── GRILLE DES SECTIONS ── */
        .multiselect-container .sections-grid {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 16px !important;
          justify-content: center !important;
        }
        /* Si une seule section, on force full width */
        .multiselect-container.one-section .section-container {
          flex: 1 1 100% !important;
        }
        .multiselect-container .section-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 0 1 calc(50% - 16px) !important;
          min-width: 300px !important;
          background-color: #673AB7 !important;
          border-radius: 6px !important;
          margin: 8px !important;
        }
        @media (max-width:800px) {
          .multiselect-container .section-container {
            flex: 1 1 100% !important;
          }
        }

        /* ── TITRE ── en blanc */
        .multiselect-container .section-title {
          display: block !important;
          padding: 12px !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 1em !important;
          border-bottom: 1px solid rgba(255,255,255,0.3) !important;
          margin-bottom: 8px !important;
        }

        /* ── OPTIONS ── */
        .multiselect-container .options-list {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        /* si >10 on passe en 2 colonnes */
        .multiselect-container .options-list.grid-2cols {
          grid-template-columns: 1fr 1fr !important;
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

        /* ── OPTION ── */
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

        /* ── CASES & RADIOS RONDS ── */
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

        /* ── BOUTONS ── */
        .multiselect-container .buttons-container {
          display: flex !important;
          justify-content: center !important;
          gap: 10px !important;
          padding: 12px !important;
        }
        .multiselect-container .submit-btn {
          all: unset !important;
          display: inline-block !important;
          background-color: ${buttonColor} !important;
          color: #fff !important;
          padding: 8px 12px !important;
          border-radius: 4px !important;
          font-weight: 600 !important;
          text-align: center !important;
          cursor: pointer !important;
          transition: opacity 0.2s !important;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.85 !important;
        }

        /* ── LOCK UI ── */
        .multiselect-container.disabled-container {
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `;
      container.appendChild(styleEl);

      // 4) Gestion du max-select
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

      // 5) Création récursive d’une option
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
              type:'complete',
              payload:{ selection: opt.name, buttonPath:'Default' }
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

      // 6) Montage des sections
      container.classList.toggle('one-section', sections.length === 1);
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach((sec, idx) => {
        const sd = document.createElement('div');
        sd.classList.add('section-container');
        if (sec.color) sd.style.backgroundColor = sec.color;

        const txt = stripHTML(sec.label).trim();
        if (txt) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = txt;
          sd.appendChild(h2);
        }

        const opts = document.createElement('div');
        opts.classList.add('options-list');
        // si >10 options => 2 colonnes
        if ((sec.options||[]).length > 10) {
          opts.classList.add('grid-2cols');
        }
        (sec.options||[]).forEach(opt => opts.appendChild(createOptionElement(opt, idx)));
        sd.appendChild(opts);
        grid.appendChild(sd);
      });
      container.appendChild(grid);

      // 7) Montage des boutons (multi-select)
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(bcCfg => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = bcCfg.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const result = sections.map((s,i) => {
              const dom = grid.children[i];
              const ck = Array.from(dom.querySelectorAll('input:checked'));
              let sels = [], all=false;
              ck.forEach(cb=>{
                if (cb.closest('.option-container').dataset.action==='all') all=true;
                else sels.push(cb.parentElement.querySelector('span').textContent.trim());
              });
              if(all){
                const allOpts = Array.from(dom.querySelectorAll('.option-container'))
                  .filter(d=>d.dataset.action!=='all')
                  .map(d=>d.querySelector('span').textContent.trim());
                sels = Array.from(new Set([...sels,...allOpts]));
              }
              return { section: s.label, selections: sels, userInput: '' };
            }).filter(x=>x);
            window.voiceflow.chat.interact({
              type:'complete',
              payload:{
                selections: result,
                buttonText: bcCfg.text,
                buttonPath: /Revenir|Return/.test(bcCfg.text)?'Previous_step':(bcCfg.path||'Default'),
                isEmpty: result.every(r=>r.selections.length===0)
              }
            });
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      // 8) Injection
      element.appendChild(container);
      console.log("✅ MultiSelect vFinal prêt");
    } catch(err) {
      console.error("MultiSelect vFinal erreur:", err);
      window.voiceflow.chat.interact({
        type:'complete',
        payload:{ error:true, message:err.message }
      });
    }
  }
};
