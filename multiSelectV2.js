/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  MultiSelect – Voiceflow Response Extension               ║
 *  ║                                                           ║
 *  ║  • Single “color” per section, dynamic accent color       ║
 *  ║  • Light/hover/selected backgrounds adjusted              ║
 *  ║  • Configurable default chat-lock with hover text         ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  // Trigger only on Voiceflow trace type 'multi_select'
  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      /* ══ 0. Utility functions – MUST come first ═══════════════════════ */
      // Strip HTML tags from a string
      const stripHTML = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html ?? '';
        return tmp.textContent || tmp.innerText || '';
      };
      // Lighten a hex color by a percentage (0–1)
      const lightenColor = (hex, percent) => {
        const num = parseInt(hex.replace('#',''), 16);
        let r = num >> 16,
            g = (num >> 8) & 0xFF,
            b = num & 0xFF;
        r = Math.min(255, Math.floor(r + (255 - r) * percent));
        g = Math.min(255, Math.floor(g + (255 - g) * percent));
        b = Math.min(255, Math.floor(b + (255 - b) * percent));
        const toHex = (c) => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      /* ══ 1. Read payload, including `chat` flag & hover text ═════════════ */
      const {
        sections         = [],
        buttons          = [],
        totalMaxSelect   = 0,
        multiselect      = true,
        chat             = true,       // allow free-text chat?
        chatDisabledText = '🚫'        // tooltip when chat disabled
      } = trace.payload;

      /* ══ 2. Create container early so patchInteract can reference it ═══════ */
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      /* ══ 3. Helpers to disable/enable the built-in chat input ═════════════ */
      const disableChatInput = () => {
        const root = element.getRootNode();
        const ic = root.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.pointerEvents = 'none';
        ic.style.opacity       = '.5';
        ic.style.cursor        = 'not-allowed';
        ic.setAttribute('title', chatDisabledText);
        const ta  = ic.querySelector('textarea, input');
        if (ta) {
          ta.disabled = true;
          ta.setAttribute('title', chatDisabledText);
        }
        const btn = root.querySelector('#vfrc-send-message');
        if (btn) btn.setAttribute('title', chatDisabledText);
      };
      const enableChatInput = () => {
        const root = element.getRootNode();
        const ic = root.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.pointerEvents = '';
        ic.style.opacity       = '';
        ic.style.cursor        = '';
        ic.removeAttribute('title');
        const ta  = ic.querySelector('textarea, input');
        if (ta) {
          ta.disabled = false;
          ta.removeAttribute('title');
        }
        const btn = root.querySelector('#vfrc-send-message');
        if (btn) btn.removeAttribute('title');
      };

      /* ══ 4. If chat is disabled in payload → lock the input ═══════════════ */
      if (!chat) disableChatInput();

      /* ══ 5. Patch chat.interact to grey-out widget when user bypasses ═════ */
      if (chat && window.voiceflow?.chat?.interact) {
        const originalInteract = window.voiceflow.chat.interact.bind(window.voiceflow.chat);
        window.voiceflow.chat.interact = (args) => {
          if (args.type === 'text' && args.payload?.text) {
            container.classList.add('disabled-container');
          }
          return originalInteract(args);
        };
      }

      /* ══ 6. Inject our widget’s CSS (variables, layout, styles) ══════════ */
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* GLOBAL VARS */
.multiselect-container {
  --ms-accent: #4CAF50;
  --ms-selected-bg: #3778F4;
  --ms-hover-bg: rgba(55,120,244,0.3);
  --ms-bg-opacity: 0.8;
  --ms-gap: 8px;
  --ms-radius: 6px;
  --ms-shadow: 0 2px 6px rgba(0,0,0,.15);
  --ms-heading-fs: 16px;
  --ms-base-fs: 15px;
  --ms-small-fs: 14px;
}
.multiselect-container, .multiselect-container * {
  box-sizing: border-box!important;
}
.multiselect-container {
  display: flex!important;
  flex-direction: column!important;
  width: 100%!important;
  font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif!important;
  font-size:var(--ms-base-fs)!important;
  color:#fff!important;
}
/* GRID & SECTIONS */
.multiselect-container .sections-grid {
  display: grid!important;
  grid-template-columns: repeat(2,1fr)!important;
  gap: var(--ms-gap)!important;
}
.multiselect-container.one-section .sections-grid {
  grid-template-columns: 1fr!important;
}
.multiselect-container .section-container {
  background: inherit;
  border-radius: var(--ms-radius)!important;
  overflow: hidden!important;
  box-shadow: var(--ms-shadow)!important;
  transition: transform .2s ease!important;
}
.multiselect-container .section-container:hover {
  transform: translateY(-2px)!important;
}
/* TITLES */
.multiselect-container .section-title {
  padding: var(--ms-gap)!important;
  font-weight: 700!important;
  font-size: var(--ms-heading-fs)!important;
  border-bottom: 2px solid rgba(255,255,255,.3)!important;
  margin-bottom: var(--ms-gap)!important;
}
/* OPTIONS */
.multiselect-container .options-list {
  display: grid!important;
  grid-template-columns: 1fr!important;
  gap: calc(var(--ms-gap)/2)!important;
  padding: calc(var(--ms-gap)/2)!important;
}
.multiselect-container .options-list.grid-2cols {
  grid-template-columns: 1fr 1fr!important;
}
/* NON-CLICKABLE */
.multiselect-container .non-selectable-block {
  background: rgba(0,0,0,.25)!important;
  border: 1px solid rgba(255,255,255,.2)!important;
  border-radius: calc(var(--ms-radius)-2px)!important;
  padding: 4px 8px!important;
  font-size: var(--ms-small-fs)!important;
}
/* LABELS */
.multiselect-container .option-container {
  display: flex!important;
  align-items: flex-start!important;
  gap: calc(var(--ms-gap)/2)!important;
}
.multiselect-container .option-container label {
  display: flex!important;
  align-items: center!important;
  gap: calc(var(--ms-gap)/2)!important;
  width: 100%!important;
  padding: calc(var(--ms-gap)/2)!important;
  background: rgba(0,0,0,var(--ms-bg-opacity))!important;
  border-radius: var(--ms-radius)!important;
  cursor: pointer!important;
  transition: background-color .2s, box-shadow .2s!important;
}
.multiselect-container .option-container label:hover {
  background: var(--ms-hover-bg)!important;
  box-shadow: var(--ms-shadow)!important;
}
.multiselect-container .option-container.greyed-out-option label {
  opacity: .5!important;
  cursor: not-allowed!important;
}
.multiselect-container .option-container label.selected {
  background: var(--ms-selected-bg)!important;
}
/* CHECKBOX / RADIO */
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"] {
  all: unset!important;
  width: 16px!important;
  height: 16px!important;
  min-width:16px!important;
  min-height:16px!important;
  flex-shrink:0!important;
  display: inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:2px solid var(--ms-accent)!important;
  border-radius:50%!important;
  background:#fff!important;
  transition: transform .1s ease!important;
}
.multiselect-container .option-container input:hover {
  transform: scale(1.1)!important;
}
.multiselect-container .option-container input:checked::after {
  content: ''!important;
  width: 8px!important;
  height: 8px!important;
  border-radius:50%!important;
  background: var(--ms-accent)!important;
}
/* USER INPUT */
.multiselect-container .user-input-container {
  grid-column: 1 / -1!important;
  margin-top: var(--ms-gap)!important;
}
.multiselect-container .user-input-label {
  font-size: var(--ms-small-fs)!important;
  margin-bottom: 16px!important;
}
.multiselect-container .user-input-field {
  width:100%!important;
  padding:6px!important;
  border-radius:var(--ms-radius)!important;
  border:1px solid rgba(255,255,255,.3)!important;
  font-size:var(--ms-small-fs)!important;
  transition: box-shadow .2s!important;
}
.multiselect-container .user-input-field:focus {
  box-shadow:0 0 0 2px rgba(255,255,255,.4)!important;
  border-color:var(--ms-accent)!important;
}
/* BUTTONS */
.multiselect-container .buttons-container {
  display:flex!important;
  justify-content:center!important;
  gap:var(--ms-gap)!important;
  padding:var(--ms-gap)!important;
}
.multiselect-container .submit-btn {
  background: var(--ms-accent)!important;
  color:#fff!important;
  padding:8px 14px!important;
  border-radius:var(--ms-radius)!important;
  font-weight:600!important;
  cursor:pointer!important;
  transition: background-color .2s, transform .1s!important;
}
.multiselect-container .submit-btn:hover {
  transform: translateY(-1px)!important;
}
/* DISABLE WIDGET */
.multiselect-container.disabled-container {
  opacity:.5!important;
  pointer-events:none!important;
}
      `;
      container.appendChild(styleEl);

      /* ══ 7. max-select logic ═════════════════════════════════════════════ */
      const updateTotalChecked = () => {
        const inputs   = [...container.querySelectorAll('input')];
        const checkedN = inputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checkedN >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          inputs.forEach(i => { if (!i.closest('.greyed-out-option')) i.disabled = false; });
        }
      };

      /* ══ 8. Factory to create each option ═════════════════════════════════ */
      const createOptionElement = (opt) => {
        // nested block?
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
        // leaf option
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) inp.disabled = true;

        const lbl = document.createElement('label');
        const txt = document.createElement('span');
        txt.innerHTML = opt.name;
        lbl.append(inp, txt);
        wrap.appendChild(lbl);

        inp.addEventListener('change', () => {
          updateTotalChecked();
          const sectionRoot = wrap.closest('.options-list');
          [...sectionRoot.querySelectorAll('.option-container label')]
            .forEach(l => l.classList.toggle('selected', l.querySelector('input').checked));
          if (!multiselect) {
            enableChatInput();
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: { selection: opt.name, buttonPath: 'Default' }
            });
          }
        });

        return wrap;
      };

      /* ══ 9. Build the sections grid ═══════════════════════════════════════ */
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach((sec) => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');

        // background + chromatic accent
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        sc.style.setProperty('--section-bg',
          bg.replace(/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
            (_,r,g,b)=>`rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.15)`));
        sc.style.setProperty('--ms-accent', lightenColor(bg, 0.3));

        if (sec.label && stripHTML(sec.label).trim()) {
          const ttl = document.createElement('div');
          ttl.classList.add('section-title');
          ttl.innerHTML = sec.label;
          sc.appendChild(ttl);
        }

        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options||[]).length > 10) ol.classList.add('grid-2cols');

        const userValues = {};
        (sec.options||[]).forEach(opt => {
          if (opt.action === 'user_input') {
            userValues[sec.label] = '';
            const uiWrap = document.createElement('div');
            uiWrap.classList.add('user-input-container');
            const uiLbl = document.createElement('label');
            uiLbl.classList.add('user-input-label');
            uiLbl.textContent = opt.label;
            const uiInp = document.createElement('input');
            uiInp.type = 'text';
            uiInp.classList.add('user-input-field');
            uiInp.placeholder = opt.placeholder || '';
            uiInp.addEventListener('input', e => userValues[sec.label] = e.target.value);
            uiInp.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                const v = e.target.value.trim();
                if (!v) return;
                enableChatInput();
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

      /* ══ 10. Multiselect submission buttons ═════════════════════════════ */
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.textContent = cfg.text;
          btn.addEventListener('click', () => {
            enableChatInput();
            container.classList.add('disabled-container');
            const res = sections.map((s,i) => {
              const dom = grid.children[i];
              const sels = [...dom.querySelectorAll('input:checked')]
                .map(cb => cb.parentElement.querySelector('span').innerHTML.trim());
              return {
                section: s.label,
                selections: sels,
                userInput: dom.querySelector('.user-input-field')?.value||''
              };
            }).filter(r=>r.selections.length||r.userInput);
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: res,
                buttonText: cfg.text,
                buttonPath: cfg.path||'Default',
                isEmpty: res.every(r=>!r.selections.length&&!r.userInput)
              }
            });
          });
          bc.appendChild(btn);
        });
        container.appendChild(bc);
      }

      /* ══ 11. Append to the page ═════════════════════════════════════════ */
      element.appendChild(container);
      console.log('✅ MultiSelect ready');
    } catch (err) {
      console.error('❌ MultiSelect Error:', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
