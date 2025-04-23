export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

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

      // utilitaire pour nettoyer un HTML échappé (uniquement pour existence de label)
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // ─── 2) Création du container et injection du <style> ────────
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

const accentColor      = trace.payload.buttonColor      // si présent
                       || trace.payload.color           // ou la couleur de section
                       || '#4CAF50';                     // fallback
const bgOpacityDefault = 0.8;                           // par défaut

      
const styleEl = document.createElement('style');

styleEl.textContent = `
  /* ─── VARIABLES CSS GLOBALES ────────────────────────── */
  .multiselect-container {
    --ms-accent:        ${accentColor} !important;
    --ms-bg-opacity:    ${bgOpacityDefault} !important;
    --ms-base-fs:       15px;
    --ms-heading-fs:    16px;
    --ms-small-fs:      14px;
    --ms-gap:           8px;
    --ms-radius:        6px;
    --ms-shadow:        0 2px 6px rgba(0,0,0,0.15);
  }

  /* ─── 1. RESET BOX-SIZING ───────────────────────────── */
  .multiselect-container,
  .multiselect-container * {
    box-sizing: border-box !important;
  }

  /* ─── 2. CONTENEUR PRINCIPAL ────────────────────────── */
  .multiselect-container {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
    font-size: var(--ms-base-fs) !important;
    color: #fff;
  }

  /* ─── 3. GRILLE (2 COLS) ───────────────────────────── */
  .multiselect-container .sections-grid {
    display: grid !important;
    grid-template-columns: repeat(2,1fr) !important;
    gap: var(--ms-gap) !important;
  }
  .multiselect-container.one-section .sections-grid {
    grid-template-columns: 1fr !important;
  }

  /* ─── 4. SECTION ────────────────────────────────────── */
  .multiselect-container .section-container {
    background: inherit;               /* palette inline via element.style.backgroundColor */
    border-radius: var(--ms-radius) !important;
    overflow: hidden !important;
    box-shadow: var(--ms-shadow) !important;
    transition: transform .2s ease !important;
  }
  .multiselect-container .section-container:hover {
    transform: translateY(-2px) !important;
  }

  /* ─── 5. TITRE ─────────────────────────────────────── */
  .multiselect-container .section-title {
    padding: var(--ms-gap) !important;
    font-weight: 700 !important;
    font-size: var(--ms-heading-fs) !important;
    border-bottom: 2px solid rgba(255,255,255,0.3) !important;
    margin-bottom: var(--ms-gap) !important;
  }

  /* ─── 6. OPTIONS-LIST ───────────────────────────────── */
  .multiselect-container .options-list {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: calc(var(--ms-gap)/2) !important;
    padding: calc(var(--ms-gap)/2) !important;
  }
  .multiselect-container .options-list.grid-2cols {
    grid-template-columns: 1fr 1fr !important;
  }

  /* ─── 7. BLOC NON-CLIQUABLE ────────────────────────── */
  .multiselect-container .non-selectable-block {
    background-color: rgba(0,0,0,0.25) !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
    border-radius: calc(var(--ms-radius) - 2px) !important;
    padding: 4px 8px !important;
    font-size: var(--ms-small-fs) !important;
  }

  /* ─── 8. OPTION CLIQUABLE ─────────────────────────── */
  .multiselect-container .option-container {
    display: flex !important;
    align-items: flex-start !important;
    gap: calc(var(--ms-gap)/2) !important;
  }
  .multiselect-container .option-container label {
    display: flex !important;
    align-items: center !important;
    gap: calc(var(--ms-gap)/2) !important;
    width: 100% !important;
    padding: calc(var(--ms-gap)/2) !important;
    background-color: rgba(0,0,0,var(--ms-bg-opacity)) !important;
    border-radius: var(--ms-radius) !important;
    cursor: pointer !important;
    transition: background-color .2s ease, box-shadow .2s ease !important;
  }
  .multiselect-container .option-container label:hover {
    background-color: rgba(0,0,0,calc(var(--ms-bg-opacity)+0.1)) !important;
    box-shadow: var(--ms-shadow) !important;
  }
  .multiselect-container .option-container.greyed-out-option label {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }

  /* ─── 9. CHECKBOX & RADIO ──────────────────────────── */
  .multiselect-container .option-container input[type="checkbox"],
  .multiselect-container .option-container input[type="radio"] {
    all: unset !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    box-sizing: border-box !important;

    width: 16px !important;
    height: 16px !important;
    aspect-ratio: 1/1 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;

    border: 2px solid var(--ms-accent) !important;
    border-radius: 50% !important;
    background-color: #fff !important;
    transition: transform .1s ease !important;
  }
  .multiselect-container .option-container input:hover {
    transform: scale(1.1) !important;
  }
  .multiselect-container .option-container input:checked::after {
    content: '' !important;
    display: block !important;
    width: 8px !important;
    height: 8px !important;
    border-radius: 50% !important;
    background-color: var(--ms-accent) !important;
    margin: auto !important;
  }

  /* ─── 10. USER INPUT ────────────────────────────────── */
  .multiselect-container .user-input-container {
    grid-column: 1/-1 !important;
    margin-top: var(--ms-gap) !important;
  }
  .multiselect-container .user-input-label {
    font-size: var(--ms-small-fs) !important;
    margin-bottom: 4px !important;
  }
  .multiselect-container .user-input-field {
    width: 100% !important;
    padding: 6px !important;
    border-radius: var(--ms-radius) !important;
    border: 1px solid rgba(255,255,255,0.3) !important;
    font-size: var(--ms-small-fs) !important;
    transition: box-shadow .2s ease !important;
  }
  .multiselect-container .user-input-field:focus {
    box-shadow: 0 0 0 2px rgba(255,255,255,0.4) !important;
    border-color: var(--ms-accent) !important;
  }

  /* ─── 11. BOUTONS ───────────────────────────────────── */
  .multiselect-container .buttons-container {
    display: flex !important;
    justify-content: center !important;
    gap: var(--ms-gap) !important;
    padding: var(--ms-gap) !important;
  }
  .multiselect-container .submit-btn {
    background-color: var(--ms-accent) !important;
    color: #fff !important;
    padding: 8px 14px !important;
    border-radius: var(--ms-radius) !important;
    font-weight: 600 !important;
    text-align: center !important;
    cursor: pointer !important;
    transition: background-color .2s ease, transform .1s ease !important;
  }
  .multiselect-container .submit-btn:hover {
    background-color: darken(var(--ms-accent),10%) !important;
    transform: translateY(-1px) !important;
  }

  /* ─── 12. LOCK UI ───────────────────────────────────── */
  .multiselect-container.disabled-container {
    opacity: 0.5 !important;
    pointer-events: none !important;
  }
`;

      container.appendChild(styleEl);

      // ─── 3) Gestion du max de sélection ─────────────────────────
      const updateTotalChecked = () => {
        const allInputs = Array.from(container.querySelectorAll('input'));
        const checkedCount = allInputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checkedCount >= totalMaxSelect && multiselect) {
          allInputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          allInputs.forEach(i => {
            if (!i.closest('.greyed-out-option')) i.disabled = false;
          });
        }
      };

      // ─── 4) Création récursive d’une option (children ou clickable) ─
      const createOptionElement = opt => {
        if (Array.isArray(opt.children) && opt.children.length) {
          // bloc non-cliquable
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const childWrap = document.createElement('div');
          childWrap.classList.add('children-options');
          opt.children.forEach(ch => childWrap.appendChild(createOptionElement(ch)));
          block.appendChild(childWrap);
          return block;
        }
        // option cliquable
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) inp.disabled = true;

        inp.addEventListener('change', () => {
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

        const lbl = document.createElement('label');
        lbl.appendChild(inp);
        const sp = document.createElement('span');
        sp.innerHTML = opt.name;
        lbl.appendChild(sp);
        wrap.appendChild(lbl);
        return wrap;
      };

      // ─── 5) Montage des sections + options ──────────────────────
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach(sec => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        if (sec.color) sc.style.backgroundColor = sec.color;

        if (sec.label && stripHTML(sec.label).trim()) {
          const h2 = document.createElement('div');
          h2.classList.add('section-title');
          h2.innerHTML = sec.label;
          sc.appendChild(h2);
        }

        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options||[]).length > 10) ol.classList.add('grid-2cols');

        (sec.options||[]).forEach(opt => {
          if (opt.action === 'user_input') {
            userInputValues[sec.label] = '';
            const divUI = document.createElement('div');
            divUI.classList.add('user-input-container');
            const lbl = document.createElement('label');
            lbl.classList.add('user-input-label');
            lbl.textContent = opt.label;
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
            divUI.appendChild(lbl);
            divUI.appendChild(inp);
            ol.appendChild(divUI);
          } else {
            ol.appendChild(createOptionElement(opt));
          }
        });

        sc.appendChild(ol);
        grid.appendChild(sc);
      });
      container.appendChild(grid);

      // ─── 6) Boutons pour multiselect=true ───────────────────────
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = cfg.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const finalSections = sections
              .map((sec, idx) => {
                const domSec = grid.children[idx];
                const sels = Array.from(domSec.querySelectorAll('input:checked'))
                  .map(cb => cb.parentElement.querySelector('span').innerHTML.trim());
                return { section: sec.label, selections: sels, userInput: userInputValues[sec.label] || '' };
              })
              .filter(s => s.selections.length > 0 || s.userInput);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: finalSections,
                buttonText: cfg.text,
                buttonPath: cfg.path || 'Default',
                isEmpty: finalSections.every(s => s.selections.length === 0 && !s.userInput)
              },
            });
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      // ─── 7) Insertion dans le DOM Voiceflow ────────────────────
      element.appendChild(container);
      console.log("✅ MultiSelect prêt");
    } catch (err) {
      console.error("❌ Erreur MultiSelect :", err);
      window.voiceflow.chat.interact({ type: 'complete', payload: { error: true, message: err.message } });
    }
  }
};
