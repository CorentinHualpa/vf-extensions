export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  // On ne veut gérer QUE les multi_select qui ont un vrai payload.sections à afficher.
  match: ({ trace }) =>
    trace.type === 'multi_select' &&
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

      // ─── 2) Création du container et injection du <style> ────────
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* … vos styles inchangés … */

        /* === Styles pour le champ libre === */
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
      `;
      container.appendChild(styleEl);

      // ─── 3) Gestion du max de sélection ─────────────────────────
      const updateTotalChecked = () => {
        const allInputs = Array.from(container.querySelectorAll('input'));
        const checkedCount = allInputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checkedCount >= totalMaxSelect && multiselect) {
          allInputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          allInputs.forEach(i => { i.disabled = false; });
        }
      };

      // ─── 4) Création d’une option (children ou clickable) ────────
      const createOptionElement = opt => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const block = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;
          const childWrap = document.createElement('div');
          childWrap.classList.add('children-options');
          opt.children.forEach(ch => childWrap.appendChild(createOptionElement(ch)));
          block.appendChild(childWrap);
          return block;
        }
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        wrap.appendChild(inp);
        const lbl = document.createElement('label');
        // On conserve le HTML d'origine (emoji, balises…)
        lbl.innerHTML = opt.name;
        wrap.appendChild(lbl);

        inp.addEventListener('change', () => {
          updateTotalChecked();
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                // on renvoie opt.name brut, avec son HTML
                selection: opt.name,
                buttonPath: 'Default'
              }
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

        // Titre
        if (sec.label) {
          const h = document.createElement('div');
          h.classList.add('section-title');
          h.innerHTML = sec.label;
          sc.appendChild(h);
        }

        // Bloc options
        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if (sec.options.length > 10) ol.classList.add('grid-2cols');

        sec.options.forEach(opt => {
          if (opt.action === 'user_input') {
            // champ libre
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
                  payload: {
                    isUserInput: true,
                    userInput: v,
                    buttonPath: 'Default'
                  }
                });
              }
            });
            divUI.append(lbl, inp);
            ol.appendChild(divUI);
          } else {
            ol.appendChild(createOptionElement(opt));
          }
        });

        sc.appendChild(ol);
        grid.appendChild(sc);
      });

      container.appendChild(grid);

      // ─── 6) Boutons custom (uniquement si VOUS en avez besoin) ────
      //    Cette partie n’empêche plus jamais les quick-replies natives
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const b = document.createElement('button');
          b.classList.add('submit-btn');
          b.textContent = cfg.text;
          b.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const finalSections = sections.map((sec, idx) => {
              const domSec = grid.children[idx];
              const checked = Array.from(domSec.querySelectorAll('input:checked'));
              const sels = checked.map(cb =>
                // on récupère le HTML brut
                cb.parentElement.querySelector('label').innerHTML.trim()
              );
              return {
                section: sec.label,
                selections: sels,
                userInput: userInputValues[sec.label] || ''
              };
            }).filter(s => s.selections.length || s.userInput);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: finalSections,
                buttonText: cfg.text,
                buttonPath: cfg.path || 'Default',
                isEmpty: finalSections.every(s => !s.selections.length && !s.userInput)
              }
            });
          });
          bc.appendChild(b);
        });
        container.appendChild(bc);
      }

      // ─── 7) On ajoute notre UI… et on s’arrête là
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
