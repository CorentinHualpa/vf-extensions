export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("▶️ Démarrage MultiSelect (fix cercles)");

      // 1) Récupère le payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // utilitaire pour nettoyer du HTML
      const stripHTML = html => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || '';
      };

      // 2) Container + style
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* 2A) reset box-sizing */
        .multiselect-container,
        .multiselect-container * {
          box-sizing: border-box !important;
        }

        /* 2B) container principal */
        .multiselect-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
          font-size: 0.9em !important;
        }

        /* 2C) grille des sections (max 2 cols) */
        .multiselect-container .sections-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 16px !important;
        }
        .multiselect-container.one-section .sections-grid {
          grid-template-columns: 1fr !important;
        }

        /* 2D) chaque section */
        .multiselect-container .section-container {
          display: flex !important;
          flex-direction: column !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }

        /* 2E) titre de section */
        .multiselect-container .section-title {
          display: block !important;
          padding: 12px !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 1em !important;
          border-bottom: 1px solid rgba(255,255,255,0.3) !important;
          margin-bottom: 8px !important;
        }

        /* 2F) liste d'options */
        .multiselect-container .options-list {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        .multiselect-container .options-list.grid-2cols {
          grid-template-columns: 1fr 1fr !important;
        }

        /* 2G) bloc non‑cliquable */
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

        /* 2H) option cliquable */
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

        /* 2I) checkbox & radio — parfaitement ronds */
        .multiselect-container .option-container input[type="checkbox"],
        .multiselect-container .option-container input[type="radio"] {
          all: unset !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          flex: none !important;               /* ⇐ empêche l’étirement */
          width: 16px !important;
          height: 16px !important;
          border: 2px solid ${buttonColor} !important;
          border-radius: 50% !important;
          background-color: #fff !important;
          cursor: pointer !important;
          vertical-align: middle !important;
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

        /* 2J) boutons multi‑select */
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
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.85 !important;
        }

        /* 2K) lock UI */
        .multiselect-container.disabled-container {
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `;
      container.appendChild(styleEl);

      // 3) gestion du totalMaxSelect
      const updateTotalChecked = () => {
        const inputs = Array.from(container.querySelectorAll('input'));
        const count = inputs.filter(i => i.checked).length;
        if (totalMaxSelect>0 && count>=totalMaxSelect && multiselect) {
          inputs.forEach(i=>{ if(!i.checked) i.disabled=true; });
        } else {
          inputs.forEach(i=>{ if(!i.closest('.greyed-out-option')) i.disabled=false; });
        }
      };

      // 4) création récursive d'une option
      const createOptionElement = opt => {
        // bloc non‑cliquable si children
        if (opt.children?.length) {
          const b = document.createElement('div');
          b.classList.add('non-selectable-block');
          b.innerHTML = opt.name;
          const cc = document.createElement('div');
          cc.classList.add('children-options');
          opt.children.forEach(ch=> cc.appendChild(createOptionElement(ch)));
          b.appendChild(cc);
          return b;
        }
        // sinon option cliquable
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) inp.disabled = true;
        inp.addEventListener('change', ()=>{
          updateTotalChecked();
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type:'complete',
              payload:{ selection:opt.name, buttonPath:'Default' }
            });
          }
        });

        const lbl = document.createElement('label');
        lbl.appendChild(inp);
        const sp = document.createElement('span');
        sp.innerHTML = opt.name;
        lbl.appendChild(sp);
        wrap.appendChild(lbl);
        return wrap;
      };

      // 5) montage des sections
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach(sec=>{
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        if (sec.color) sc.style.backgroundColor = sec.color;

        // label s’il existe
        if (sec.label) {
          const h = document.createElement('div');
          h.classList.add('section-title');
          h.innerHTML = sec.label;
          sc.appendChild(h);
        }

        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if (sec.options.length>10) ol.classList.add('grid-2cols');
        sec.options.forEach(opt=> ol.appendChild(createOptionElement(opt)));
        sc.appendChild(ol);

        grid.appendChild(sc);
      });
      container.appendChild(grid);

      // 6) boutons (si multiselect)
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg=>{
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = cfg.text;
          b.addEventListener('click', ()=>{
            container.classList.add('disabled-container');
            // reconstruisez et envoyez votre payload ici si besoin
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      // 7) injecte
      element.appendChild(container);
      console.log("✅ MultiSelect prêt (avec cercles)");
    } catch(err) {
      console.error("Erreur MultiSelect:",err);
      window.voiceflow.chat.interact({
        type:'complete', payload:{ error:true, message:err.message }
      });
    }
  }
};
