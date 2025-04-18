export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      console.log("Démarrage MultiSelect isolé");

      // 1) Payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      // Strip HTML échappé
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // 2) Création du container + style reset + style perso
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* RESET TOTAL pour tout isoler */
        .multiselect-container,
        .multiselect-container * {
          all: unset !important;
          box-sizing: border-box !important;
        }

        /* Container */
        .multiselect-container {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
          font-size: 0.9em !important;
        }

        /* Grille des sections */
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
          margin: 8px !important;
        }
        @media (max-width:800px){
          .multiselect-container .section-container {
            flex: 1 1 100% !important;
          }
        }

        /* TITRE (en blanc, plus de gradient) */
        .multiselect-container .section-title {
          all: unset !important;
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
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
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

        /* Option container */
        .multiselect-container .option-container {
          display: flex !important;
          align-items: center !important;
        }
        .multiselect-container .option-container.greyed-out-option label {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        /* Label d’option */
        .multiselect-container .option-container label {
          all: unset !important;
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

        /* Checkbox & radio RONDS */
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
        /* Point intérieur quand checked */
        .multiselect-container .option-container input:checked::after {
          content: '' !important;
          display: block !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background-color: ${buttonColor} !important;
          position: relative !important;
          left: 3px !important;
          top: 3px !important;
        }

        /* Boutons (multi-select) */
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

        /* Lock UI */
        .multiselect-container.disabled-container {
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `;
      container.appendChild(styleEl);

      // 3) max select handler
      const updateTotalChecked = () => {
        const inputs = Array.from(container.querySelectorAll('input'));
        const checkedCount = inputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checkedCount >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          inputs.forEach(i => {
            if (!i.closest('.greyed-out-option')) i.disabled = false;
          });
        }
      };

      // 4) création récursive d’une option
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

      // 5) montage des sections
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');
      sections.forEach((section, idx) => {
        const secDiv = document.createElement('div');
        secDiv.classList.add('section-container');
        if (section.color) secDiv.style.backgroundColor = section.color;

        const titleText = stripHTML(section.label).trim();
        if (titleText) {
          const h2 = document.createElement('h2');
          h2.classList.add('section-title');
          h2.textContent = titleText;
          secDiv.appendChild(h2);
        }

        const optsList = document.createElement('div');
        optsList.classList.add('options-list');
        (section.options||[]).forEach(opt => optsList.appendChild(createOptionElement(opt, idx)));
        secDiv.appendChild(optsList);
        sectionsGrid.appendChild(secDiv);
      });
      container.appendChild(sectionsGrid);

      // 6) boutons (si multi-select)
      if (multiselect && buttons.length) {
        const btnWrap = document.createElement('div');
        btnWrap.classList.add('buttons-container');
        buttons.forEach(bCfg => {
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.textContent = bCfg.text;
          btn.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const final = sections.map((sec,i) => {
              const dom = sectionsGrid.children[i];
              const checked = Array.from(dom.querySelectorAll('input:checked'));
              let sels = [], hasAll = false;
              checked.forEach(cb => {
                if (cb.closest('.option-container').dataset.action==='all') hasAll = true;
                else sels.push(cb.parentElement.querySelector('span').textContent.trim());
              });
              if (hasAll) {
                const allOpts = Array.from(dom.querySelectorAll('.option-container'))
                  .filter(d=>d.dataset.action!=='all')
                  .map(d=>d.querySelector('span').textContent.trim());
                sels = Array.from(new Set([...sels, ...allOpts]));
              }
              return { section: sec.label, selections: sels, userInput: '' };
            }).filter(x=>x);
            window.voiceflow.chat.interact({
              type:'complete',
              payload:{
                selections: final,
                buttonText: bCfg.text,
                buttonPath: /Revenir|Return/.test(bCfg.text)?'Previous_step':(bCfg.path||'Default'),
                isEmpty: final.every(r=>r.selections.length===0)
              }
            });
          });
          btnWrap.appendChild(btn);
        });
        container.appendChild(btnWrap);
      }

      // 7) injecte
      element.appendChild(container);
      console.log("MultiSelect isolé prêt");
    } catch (err) {
      console.error("Erreur MultiSelect :", err);
      window.voiceflow.chat.interact({
        type:'complete',
        payload:{ error: true, message: err.message }
      });
    }
  }
};
