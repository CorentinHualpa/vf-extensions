/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  MultiSelect – Voiceflow Response Extension               ║
 *  ║                                                           ║
 *  ║  • Single “color” per section, dynamic accent color       ║
 *  ║  • Light/hover/selected backgrounds adjusted              ║
 *  ║  • Optional default chat input enable/disable             ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  // Only trigger on Voiceflow trace with type 'multi_select'
  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      /* ══ 1. Read payload, including new `chat` flag ═════════════════ */
      const {
        sections        = [],
        buttons         = [],
        totalMaxSelect  = 0,
        multiselect     = true,
        chat            = true   // new: enable/disable default chat input
      } = trace.payload;

      /* ══ 2. Create root container for the widget ═════════════════════ */
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      /* ══ 3. If default chat is disabled, inject global CSS to hide it ══ */
      if (!chat) {
        const chatStyle = document.createElement('style');
        chatStyle.textContent = `
          /* Hide Voiceflow chat input so user can only use this widget */
          .vfrc-footer, .vfrc-input, .vfrc-chat-input--button {
            display: none !important;
          }
        `;
        document.head.appendChild(chatStyle);
      }

      /* ══ 4. Patch chat.interact to auto-disable widget on user chat ══ */
      if (chat && window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
        const originalInteract = window.voiceflow.chat.interact.bind(window.voiceflow.chat);
        window.voiceflow.chat.interact = (args) => {
          // If user sends text via default chat, grey out this widget
          if (args.type === 'text' && args.payload && typeof args.payload.text === 'string') {
            container.classList.add('disabled-container');
          }
          return originalInteract(args);
        };
      }

      /* ══ 5. Helper to strip HTML from labels ═════════════════════════ */
      const stripHTML = html => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html ?? '';
        return tmp.textContent || tmp.innerText || '';
      };

      /* ══ 6. Helper to compute a lighter accent color for checkboxes ══ */
      const lightenColor = (hex, percent) => {
        // Remove '#' and parse
        const num = parseInt(hex.replace('#',''), 16);
        let r = (num >> 16),
            g = (num >> 8) & 0x00FF,
            b = num & 0x0000FF;
        // Increase each channel towards 255 by given percentage
        r = Math.min(255, Math.floor(r + (255 - r) * percent));
        g = Math.min(255, Math.floor(g + (255 - g) * percent));
        b = Math.min(255, Math.floor(b + (255 - b) * percent));
        // Convert back to hex
        const toHex = c => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      /* ══ 7. Inject widget-specific CSS and variables ══════════════════ */
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ────────────────────────────────────────────────────────── */
/* GLOBAL VARIABLES: adjust opacities, radii, fonts, etc.     */
/* ────────────────────────────────────────────────────────── */
.multiselect-container {
  /* default accent & selected colors (overridden per-section) */
  --ms-accent           : #4CAF50;    /* checkbox border & buttons */
  --ms-selected-bg      : #3778F4;    /* selected option background */
  --ms-hover-bg         : rgba(55,120,244,0.3); /* greyed blue on hover */

  --ms-bg-opacity       : 0.8;        /* default opaque black */
  --ms-heading-fs       : 16px;       /* section title font-size */
  --ms-base-fs          : 15px;       /* base font-size */
  --ms-small-fs         : 14px;       /* small font-size (notes) */

  --ms-gap              : 8px;        /* grid & padding gap */
  --ms-radius           : 6px;        /* rounded corners */
  --ms-shadow           : 0 2px 6px rgba(0,0,0,.15); /* subtle shadow */
}

/* RESET box-sizing */
.multiselect-container, .multiselect-container * {
  box-sizing: border-box !important;
}

/* MAIN CONTAINER */
.multiselect-container {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
  font-size: var(--ms-base-fs) !important;
  color: #fff !important;
}

/* GRID OF SECTIONS */
.multiselect-container .sections-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: var(--ms-gap) !important;
}
.multiselect-container.one-section .sections-grid {
  grid-template-columns: 1fr !important;
}

/* SECTION CARD */
.multiselect-container .section-container {
  background: inherit;
  border-radius: var(--ms-radius) !important;
  overflow: hidden !important;
  box-shadow: var(--ms-shadow) !important;
  transition: transform .2s ease !important;
}
.multiselect-container .section-container:hover {
  transform: translateY(-2px) !important;
}

/* SECTION TITLE */
.multiselect-container .section-title {
  padding: var(--ms-gap) !important;
  font-weight: 700 !important;
  font-size: var(--ms-heading-fs) !important;
  border-bottom: 2px solid rgba(255,255,255,.3) !important;
  margin-bottom: var(--ms-gap) !important;
}

/* OPTIONS LIST */
.multiselect-container .options-list {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: calc(var(--ms-gap)/2) !important;
  padding: calc(var(--ms-gap)/2) !important;
}
.multiselect-container .options-list.grid-2cols {
  grid-template-columns: 1fr 1fr !important;
}

/* NON-CLICKABLE BLOCK */
.multiselect-container .non-selectable-block {
  background: rgba(0,0,0,.25) !important;
  border: 1px solid rgba(255,255,255,.2) !important;
  border-radius: calc(var(--ms-radius)-2px) !important;
  padding: 4px 8px !important;
  font-size: var(--ms-small-fs) !important;
}

/* CLICKABLE OPTION CONTAINER */
.multiselect-container .option-container {
  display: flex !important;
  align-items: flex-start !important;
  gap: calc(var(--ms-gap)/2) !important;
}

/* NORMAL STATE */
.multiselect-container .option-container label {
  display: flex !important;
  align-items: center !important;
  gap: calc(var(--ms-gap)/2) !important;
  width: 100% !important;
  padding: calc(var(--ms-gap)/2) !important;
  background: rgba(0,0,0,var(--ms-bg-opacity)) !important;
  border-radius: var(--ms-radius) !important;
  cursor: pointer !important;
  transition: background-color .2s, box-shadow .2s !important;
}

/* HOVER: greyed blue tint */
.multiselect-container .option-container label:hover {
  background: var(--ms-hover-bg) !important;
  box-shadow: var(--ms-shadow) !important;
}

/* DISABLED OPTION */
.multiselect-container .option-container.greyed-out-option label {
  opacity: .5 !important;
  cursor: not-allowed !important;
}

/* SELECTED STATE */
.multiselect-container .option-container label.selected {
  background: var(--ms-selected-bg) !important;
}

/* CHECKBOX / RADIO */
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"] {
  /* reset native styles, create custom circle */
  all: unset !important;
  width: 16px !important;
  height: 16px !important;
  aspect-ratio: 1/1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 2px solid var(--ms-accent) !important; /* dynamic accent */
  border-radius: 50% !important;
  background: #fff !important;
  transition: transform .1s ease !important;
}
.multiselect-container .option-container input:hover {
  transform: scale(1.1) !important;
}
.multiselect-container .option-container input:checked::after {
  content: '' !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: var(--ms-accent) !important;
}

/* USER TEXT INPUT FIELD */
.multiselect-container .user-input-container {
  grid-column: 1 / -1 !important;
  margin-top: var(--ms-gap) !important;
}
.multiselect-container .user-input-label {
  font-size: var(--ms-small-fs) !important;
  margin-bottom: 16px !important;
}
.multiselect-container .user-input-field {
  width: 100% !important;
  padding: 6px !important;
  border-radius: var(--ms-radius) !important;
  border: 1px solid rgba(255,255,255,.3) !important;
  font-size: var(--ms-small-fs) !important;
  transition: box-shadow .2s !important;
}
.multiselect-container .user-input-field:focus {
  box-shadow: 0 0 0 2px rgba(255,255,255,.4) !important;
  border-color: var(--ms-accent) !important;
}

/* BUTTONS CONTAINER */
.multiselect-container .buttons-container {
  display: flex !important;
  justify-content: center !important;
  gap: var(--ms-gap) !important;
  padding: var(--ms-gap) !important;
}
.multiselect-container .submit-btn {
  background: var(--ms-accent) !important;
  color: #fff !important;
  padding: 8px 14px !important;
  border-radius: var(--ms-radius) !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: background-color .2s, transform .1s !important;
}
.multiselect-container .submit-btn:hover {
  transform: translateY(-1px) !important;
}

/* DISABLE ENTIRE WIDGET */
.multiselect-container.disabled-container {
  opacity: .5 !important;
  pointer-events: none !important;
}
      `;
      container.appendChild(styleEl);

      /* ══ 8. Manage max-selection logic ═════════════════════════════ */
      const updateTotalChecked = () => {
        const inputs   = [...container.querySelectorAll('input')];
        const checkedN = inputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checkedN >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          inputs.forEach(i => { if (!i.closest('.greyed-out-option')) i.disabled = false; });
        }
      };

      /* ══ 9. Factory to create each option (recursive for children) ══ */
      const createOptionElement = opt => {
        // Nested non-clickable block
        if (Array.isArray(opt.children) && opt.children.length) {
          const blk = document.createElement('div');
          blk.classList.add('non-selectable-block');
          blk.innerHTML = opt.name;
          const wrapCh = document.createElement('div');
          wrapCh.classList.add('children-options');
          opt.children.forEach(ch => wrapCh.appendChild(createOptionElement(ch)));
          blk.appendChild(wrapCh);
          return blk;
        }
        // Leaf option: checkbox or radio
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp  = document.createElement('input');
        inp.type   = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) inp.disabled = true;

        const lbl  = document.createElement('label');
        const txt  = document.createElement('span');
        txt.innerHTML = opt.name;
        lbl.append(inp, txt);
        wrap.appendChild(lbl);

        // Handle selection change: style toggle + max-select + single-select auto-complete
        inp.addEventListener('change', () => {
          updateTotalChecked();

          // Toggle 'selected' class on label
          const sectionRoot = wrap.closest('.options-list');
          [...sectionRoot.querySelectorAll('.option-container label')].forEach(l =>
            l.classList.toggle('selected', l.querySelector('input').checked)
          );

          // If single-select, send complete immediately
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type   : 'complete',
              payload: { selection: opt.name, buttonPath: 'Default' }
            });
          }
        });

        return wrap;
      };

      /* ══ 10. Build sections grid with dynamic accent per section ══ */
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');

      sections.forEach(sec => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');

        // Section background color (semi-transparent overlay)
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        sc.style.setProperty(
          '--section-bg',
          bg.replace(
            /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
            (_, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.15)`
          )
        );

        // Compute and set dynamic accent color (lighter metallic/chromatic) for checkboxes & buttons
        const accent = lightenColor(bg, 0.3);
        sc.style.setProperty('--ms-accent', accent);

        // Section label
        if (sec.label && stripHTML(sec.label).trim()) {
          const ttl = document.createElement('div');
          ttl.classList.add('section-title');
          ttl.innerHTML = sec.label;
          sc.appendChild(ttl);
        }

        // Options list
        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options||[]).length > 10) ol.classList.add('grid-2cols');

        // Track free-text inputs per section
        const userInputValues = {};
        (sec.options||[]).forEach(opt => {
          if (opt.action === 'user_input') {
            userInputValues[sec.label] = '';
            const uiWrap = document.createElement('div');
            uiWrap.classList.add('user-input-container');

            const uiLbl = document.createElement('label');
            uiLbl.classList.add('user-input-label');
            uiLbl.textContent = opt.label;

            const uiInp = document.createElement('input');
            uiInp.type = 'text';
            uiInp.classList.add('user-input-field');
            uiInp.placeholder = opt.placeholder || '';

            // Capture input value
            uiInp.addEventListener('input', e => {
              userInputValues[sec.label] = e.target.value;
            });
            // On Enter: complete with user input
            uiInp.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                const v = e.target.value.trim();
                if (!v) return;
                container.classList.add('disabled-container');
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: { isUserInput: true, userInput: v, buttonPath: 'Default' }
                });
              }
            });

            uiWrap.append(uiLbl, uiInp);
            ol.appendChild(uiWrap);
          } else {
            ol.appendChild(createOptionElement(opt));
          }
        });

        sc.appendChild(ol);
        grid.appendChild(sc);
      });

      container.appendChild(grid);

      /* ══ 11. Add buttons for multiselect submission ═══════════════ */
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');

        buttons.forEach(cfg => {
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.textContent = cfg.text;

          btn.addEventListener('click', () => {
            container.classList.add('disabled-container');
            const res = sections.map((s,i) => {
              const dom = grid.children[i];
              const sels = [...dom.querySelectorAll('input:checked')]
                .map(cb => cb.parentElement.querySelector('span').innerHTML.trim());
              return {
                section: s.label,
                selections: sels,
                userInput: (dom.querySelector('.user-input-field')?.value || '')
              };
            }).filter(r => r.selections.length || r.userInput);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: res,
                buttonText: cfg.text,
                buttonPath: cfg.path || 'Default',
                isEmpty: res.every(r => !r.selections.length && !r.userInput)
              }
            });
          });

          bc.appendChild(btn);
        });

        container.appendChild(bc);
      }

      /* ══ 12. Insert widget into the page ══════════════════════════ */
      element.appendChild(container);
      console.log('✅ MultiSelect ready with custom modifications');
    } catch (err) {
      console.error('❌ MultiSelect Error:', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
