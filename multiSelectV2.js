export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  // Ne sʼactive que sur trace multi_select
  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      /* ────────────────────────────────────────────────────────── */
      /* 0. lire le payload                                        */
      /* ────────────────────────────────────────────────────────── */
      const {
        sections         = [],
        buttons          = [],
        totalMaxSelect   = 0,
        minSelectDefault = 0,     // valeur par défaut si non fourni sur le bouton
        multiselect      = true,
        chat             = true,
        chatDisabledText = '🚫'
      } = trace.payload;

      /* ────────────────────────────────────────────────────────── */
      /* 1. utilitaires                                            */
      /* ────────────────────────────────────────────────────────── */
      const stripHTML = html => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return tmp.textContent || tmp.innerText || '';
      };
      const lightenColor = (hex, pct) => {
        const num = parseInt(hex.replace('#',''), 16);
        let r = num >> 16, g = (num >> 8) & 0xFF, b = num & 0xFF;
        r = Math.min(255, Math.floor(r + (255 - r) * pct));
        g = Math.min(255, Math.floor(g + (255 - g) * pct));
        b = Math.min(255, Math.floor(b + (255 - b) * pct));
        const toHex = c => c.toString(16).padStart(2,'0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      /* ────────────────────────────────────────────────────────── */
      /* 2. chat on/off                                            */
      /* ────────────────────────────────────────────────────────── */
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      function disableChat() {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '.5';
        ic.style.cursor  = 'not-allowed';
        ic.setAttribute('title', chatDisabledText);
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = true; ta.setAttribute('title', chatDisabledText); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = true; snd.setAttribute('title', chatDisabledText); }
      }
      function enableChat() {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '';
        ic.style.cursor  = '';
        ic.removeAttribute('title');
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = false; ta.removeAttribute('title'); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = false; snd.removeAttribute('title'); }
      }
      if (!chat) disableChat();

      /* ────────────────────────────────────────────────────────── */
      /* 3. container + disable on chat interact                   */
      /* ────────────────────────────────────────────────────────── */
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      if (chat && window.voiceflow?.chat?.interact) {
        const orig = window.voiceflow.chat.interact.bind(window.voiceflow.chat);
        window.voiceflow.chat.interact = args => {
          if (args.type === 'text') {
            container.classList.add('disabled-container');
            disableChat();
          }
          return orig(args);
        };
      }
      const chatInput = host.querySelector('textarea.vfrc-chat-input');
      if (chatInput) {
        chatInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            container.classList.add('disabled-container');
            disableChat();
          }
        });
      }
      const sendBtn = host.querySelector('#vfrc-send-message');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          container.classList.add('disabled-container');
          disableChat();
        });
      }

      /* ────────────────────────────────────────────────────────── */
      /* 4. CSS global (avec shake + erreur minSelect)            */
      /* ────────────────────────────────────────────────────────── */
      const styleEl = document.createElement('style');
      styleEl.textContent = `
.multiselect-container {
  /* variables par défaut */
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
.multiselect-container, .multiselect-container * { box-sizing:border-box!important; }
.multiselect-container {
  display:flex!important; flex-direction:column!important; width:100%!important;
  font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif!important;
  font-size:var(--ms-base-fs)!important; color:#fff!important;
}
.multiselect-container .sections-grid {
  display:grid!important; grid-template-columns:repeat(2,1fr)!important;
  gap:var(--ms-gap)!important;
}
.multiselect-container.one-section .sections-grid {
  grid-template-columns:1fr!important;
}
/* … autres styles originaux pour section-container, options-list, etc. … */
/* Styles pour animation “shake” et message d’erreur */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
.submit-btn.shake {
  animation: shake 0.3s ease;
}
.minselect-error {
  font-size: var(--ms-small-fs)!important;
  color: #ffdddd!important;
  margin-top: 4px!important;
}
      `;
      container.appendChild(styleEl);

      /* ────────────────────────────────────────────────────────── */
      /* 5. max-select + all toggle                               */
      /* ────────────────────────────────────────────────────────── */
      let grid;
      const updateTotalChecked = () => {
        const inputs = Array.from(
          container.querySelectorAll('input[type="checkbox"], input[type="radio"]')
        );
        const checkedCount = inputs.filter((i) => i.checked).length;

        // bloquer au-delà de totalMaxSelect
        if (totalMaxSelect > 0 && checkedCount >= totalMaxSelect && multiselect) {
          inputs.forEach((i) => {
            if (!i.checked) i.disabled = true;
          });
        } else {
          inputs.forEach((i) => {
            if (!i.closest('.greyed-out-option')) i.disabled = false;
          });
        }

        // synchroniser le "all" de chaque section
        sections.forEach((_, idx) => {
          const secDom    = grid.children[idx];
          const allInput  = secDom.querySelector('input[data-action="all"]');
          if (!allInput) return;
          const others    = Array.from(secDom.querySelectorAll('input[data-action=""]'));
          const everyChecked = others.length > 0 && others.every((i) => i.checked);
          allInput.checked = everyChecked;
          allInput.parentElement.classList.toggle('selected', everyChecked);
        });
      };

      /* ────────────────────────────────────────────────────────── */
      /* 6. createOptionElement                                   */
      /* ────────────────────────────────────────────────────────── */
      const createOptionElement = (opt, sectionIdx) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const blk = document.createElement('div');
          blk.classList.add('non-selectable-block');
          blk.innerHTML = opt.name;
          const wrap = document.createElement('div');
          wrap.classList.add('children-options');
          opt.children.forEach((ch) => wrap.append(createOptionElement(ch, sectionIdx)));
          blk.append(wrap);
          return blk;
        }

        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        inp.dataset.action     = opt.action || '';
        inp.dataset.sectionIdx = sectionIdx;
        if (opt.grey) inp.disabled = true;

        const lbl = document.createElement('label');
        const txt = document.createElement('span');
        txt.innerHTML = opt.name;
        lbl.append(inp, txt);
        wrap.append(lbl);

        inp.addEventListener('change', () => {
          // "all" toggle
          if (opt.action === 'all') {
            const secDom = grid.children[sectionIdx];
            const others = Array.from(secDom.querySelectorAll('input[data-action=""]'));
            others.forEach((i) => {
              i.checked = inp.checked;
              i.parentElement.classList.toggle('selected', inp.checked);
            });
          }
          updateTotalChecked();
          lbl.classList.toggle('selected', inp.checked);

          // si single-select, envoi direct
          if (!multiselect) {
            enableChat();
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selection:   opt.name,
                buttonPath:  opt.action || 'Default'
              }
            });
            // retour focus chat
            setTimeout(() => {
              const ta = host.querySelector('textarea.vfrc-chat-input');
              if (ta) ta.focus();
            }, 0);
          }
        });

        return wrap;
      };

      /* ────────────────────────────────────────────────────────── */
      /* 7. build sections                                        */
      /* ────────────────────────────────────────────────────────── */
      grid = document.createElement('div');
      grid.classList.add('sections-grid');

      sections.forEach((sec, i) => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        sc.style.setProperty(
          '--section-bg',
          bg.replace(
            /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
            (_, r, g, b) => `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)},0.15)`
          )
        );
        sc.style.setProperty('--ms-accent', lightenColor(bg, 0.3));

        if (sec.label && stripHTML(sec.label).trim()) {
          const ttl = document.createElement('div');
          ttl.classList.add('section-title');
          ttl.innerHTML = sec.label;
          sc.append(ttl);
        }

        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options || []).length > 10) ol.classList.add('grid-2cols');

        sec.options.forEach((opt) => {
          if (opt.action === 'user_input') {
            // champ libre
            const uiWrap = document.createElement('div');
            uiWrap.classList.add('user-input-container');
            const uiLbl = document.createElement('label');
            uiLbl.classList.add('user-input-label');
            uiLbl.textContent = opt.label;
            const uiInp = document.createElement('input');
            uiInp.type = 'text';
            uiInp.classList.add('user-input-field');
            uiInp.placeholder = opt.placeholder || '';
            uiInp.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                enableChat();
                container.classList.add('disabled-container');
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: {
                    isUserInput: true,
                    userInput:   e.target.value.trim(),
                    buttonPath: 'Default'
                  }
                });
                setTimeout(() => {
                  const ta = host.querySelector('textarea.vfrc-chat-input');
                  if (ta) ta.focus();
                }, 0);
              }
            });
            uiWrap.append(uiLbl, uiInp);
            ol.append(uiWrap);
          } else {
            ol.append(createOptionElement(opt, i));
          }
        });

        sc.append(ol);
        grid.append(sc);
      });

      container.append(grid);

      /* ────────────────────────────────────────────────────────── */
      /* 8. buttons (avec minSelect)                              */
      /* ────────────────────────────────────────────────────────── */
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');

        buttons.forEach((cfg) => {
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.textContent = cfg.text;
          // déterminer minSelect pour ce bouton
          const minSel = typeof cfg.minSelect === 'number' ? cfg.minSelect : minSelectDefault;

          btn.addEventListener('click', () => {
            // compter les cases cochées
            const totalSelected = Array.from(
              container.querySelectorAll('input[type="checkbox"]:checked')
            ).length;

            // si moins que minSelect → shake + message
            if (totalSelected < minSel) {
              btn.classList.add('shake');
              setTimeout(() => btn.classList.remove('shake'), 300);

              let err = bc.querySelector('.minselect-error');
              if (!err) {
                err = document.createElement('div');
                err.className = 'minselect-error';
                bc.append(err);
              }
              err.textContent = `Vous devez sélectionner au moins ${minSel} option${minSel > 1 ? 's' : ''}.`;
              return;
            }

            // validation OK → on envoie
            enableChat();
            container.classList.add('disabled-container');

            const res = sections
              .map((s, i) => {
                const dom = grid.children[i];
                const sels = Array.from(dom.querySelectorAll('input:checked')).map(
                  (cb) => cb.parentElement.querySelector('span').innerHTML.trim()
                );
                const ui = dom.querySelector('.user-input-field')?.value || '';
                return { section: s.label, selections: sels, userInput: ui };
              })
              .filter((r) => r.selections.length || r.userInput);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections: res,
                buttonText: cfg.text,
                buttonPath: cfg.path || 'Default',
                isEmpty: res.every((r) => !r.selections.length && !r.userInput),
              },
            });

            // retour focus chat
            setTimeout(() => {
              const ta = host.querySelector('textarea.vfrc-chat-input');
              if (ta) ta.focus();
            }, 0);
          });

          bc.append(btn);
        });

        container.append(bc);
      }

      /* ────────────────────────────────────────────────────────── */
      /* 9. injecter dans le DOM                                   */
      /* ────────────────────────────────────────────────────────── */
      element.append(container);
      console.log('✅ MultiSelect prêt avec minSelect');
    } catch (err) {
      console.error('❌ MultiSelect Error :', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message },
      });
    }
  },
};
