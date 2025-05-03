/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  MultiSelect – Voiceflow Response Extension               ║
 *  ║                                                           ║
 *  ║  • 1 seul champ “color” par section                       ║
 *  ║  • style, hover, selected centralisés en CSS             ║
 *  ║  • active/désactive le chat selon `chat`                 ║
 *  ║  • grise le widget si l’utilisateur écrit dans le chat    ║
 *  ║  • single-select utilise `action` comme `buttonPath`     ║
 *  ║  • champ libre bascule focus retour dans le chat         ║
 *  ║  • action="all" coche/décoche l’intégralité de la section║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      const {
        sections        = [],
        buttons         = [],
        totalMaxSelect  = 0,
        multiselect     = true,
        chat            = true,
        chatDisabledText= '🚫'
      } = trace.payload;

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

      const styleEl = document.createElement('style');
      styleEl.textContent = `
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
/* ... (le reste du CSS reste inchangé jusqu’aux boutons) ... */
/* boutons */
.multiselect-container .buttons-container {
  display: flex!important;
  justify-content: center!important;
  gap: var(--ms-gap)!important;
  padding: var(--ms-gap)!important;
  flex-wrap: nowrap!important;
}
.multiselect-container .submit-btn {
  background: var(--ms-accent);
  border: 2px solid var(--ms-accent);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3),
              inset 0 -1px 0 rgba(0,0,0,0.2);
  color: #fff!important;
  padding: 8px 14px!important;
  border-radius: var(--ms-radius)!important;
  font-weight: 600!important;
  cursor: pointer!important;
  transition: background-color .2s, transform .1s!important;
  flex-shrink: 0!important;
}
.multiselect-container .submit-btn:hover {
  transform: translateY(-1px)!important;
}
.multiselect-container .submit-btn:active {
  transform: none!important;
}
/* override couleur inline */
.multiselect-container .submit-btn[data-has-color] {
  /* inline-style backgroundColor & borderColor override */
}
/* stop toute animation pour minSelect=0 */
.multiselect-container .submit-btn.min-zero:active {
  transform: none!important;
  animation: none!important;
}
.multiselect-container .minselect-error {
  color: #ffdddd!important;
  font-size: var(--ms-small-fs)!important;
  margin-top: 4px!important;
}
.multiselect-container.disabled-container {
  opacity: .5!important;
  pointer-events: none!important;
}
      `;
      container.appendChild(styleEl);

      /* 5. max-select + all toggle */
      let grid;
      const updateTotalChecked = () => {
        const allInputs = Array.from(
          container.querySelectorAll('input[type="checkbox"], input[type="radio"]')
        );
        const checkedCount = allInputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && checkedCount >= totalMaxSelect && multiselect) {
          allInputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          allInputs.forEach(i => { if (!i.closest('.greyed-out-option')) i.disabled = false; });
        }
        sections.forEach((_, idx) => {
          const secDom = grid.children[idx];
          const allInput = secDom.querySelector('input[data-action="all"]');
          if (!allInput) return;
          const others = Array.from(
            secDom.querySelectorAll('input[type="checkbox"], input[type="radio"]')
          ).filter(i => i.dataset.action !== 'all');
          const everyChecked = others.length > 0 && others.every(i => i.checked);
          allInput.checked = everyChecked;
          allInput.parentElement.classList.toggle('selected', everyChecked);
        });
      };

      /* 6. createOptionElement */
      const createOptionElement = (opt, sectionIdx) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const blk = document.createElement('div');
          blk.classList.add('non-selectable-block');
          blk.innerHTML = opt.name;
          const wrap = document.createElement('div');
          wrap.classList.add('children-options');
          opt.children.forEach(ch => wrap.append(createOptionElement(ch, sectionIdx)));
          blk.append(wrap);
          return blk;
        }
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');
        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        inp.dataset.action = opt.action || '';
        inp.dataset.sectionIdx = sectionIdx;
        if (opt.grey) inp.disabled = true;
        const lbl = document.createElement('label');
        const txt = document.createElement('span');
        txt.innerHTML = opt.name;
        lbl.append(inp, txt);
        wrap.append(lbl);

        inp.addEventListener('change', () => {
          if (opt.action === 'all') {
            const secDom = grid.children[sectionIdx];
            const others = Array.from(
              secDom.querySelectorAll('input[type="checkbox"], input[type="radio"]')
            ).filter(i => i.dataset.action !== 'all');
            others.forEach(i => {
              i.checked = inp.checked;
              i.parentElement.classList.toggle('selected', inp.checked);
            });
          }
          updateTotalChecked();
          lbl.classList.toggle('selected', inp.checked);

          if (!multiselect) {
            enableChat();
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({
              type:'complete',
              payload:{ selection: opt.name, buttonPath: opt.action||'Default' }
            });
            setTimeout(() => {
              const ta = host.querySelector('textarea.vfrc-chat-input');
              if (ta) ta.focus();
            },0);
          }
        });

        return wrap;
      };

      /* 7. build sections */
      grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach((sec,i) => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        sc.style.setProperty('--ms-accent', lightenColor(bg,0.3));
        if (sec.label && stripHTML(sec.label).trim()) {
          const ttl = document.createElement('div');
          ttl.classList.add('section-title');
          ttl.innerHTML = sec.label;
          sc.append(ttl);
        }
        const ol = document.createElement('div');
        ol.classList.add((sec.options||[]).length>10?'options-list grid-2cols':'options-list');
        sec.options.forEach(opt => ol.append(createOptionElement(opt,i)));
        sc.append(ol);
        grid.append(sc);
      });
      container.append(grid);

      /* 8. buttons */
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        buttons.forEach(cfg => {
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          if (cfg.color) {
            btn.setAttribute('data-has-color','1');
            btn.style.setProperty('background-color', cfg.color, 'important');
            btn.style.setProperty('border-color',     cfg.color, 'important');
          }
          // Ajouter une classe spécifique si minSelect=0
          if ((cfg.minSelect || 0) === 0) {
            btn.classList.add('min-zero');
          }
          btn.textContent = cfg.text;
          btn.addEventListener('click', () => {
            const checked = Array.from(
              container.querySelectorAll('input[type="checkbox"]:checked')
            ).filter(i=>i.dataset.action!=='all').length;
            const min = cfg.minSelect||0;
            // si minSelect=0, on ne fait absolument rien
            if (min === 0) return;
            // sinon si sélection insuffisante → shake + message
            if (checked < min) {
              btn.classList.add('shake');
              setTimeout(()=>btn.classList.remove('shake'),300);
              let err = btn.nextElementSibling;
              if (!err || !err.classList.contains('minselect-error')) {
                err = document.createElement('div');
                err.className = 'minselect-error';
                btn.insertAdjacentElement('afterend', err);
              }
              err.textContent = `Vous devez sélectionner au moins ${min} option${min>1?'s':''}.`;
              return;
            }
            // sélection valide → envoi
            enableChat();
            container.classList.add('disabled-container');
            const res = sections.map((s,i) => {
              const dom = grid.children[i];
              const sels = Array.from(dom.querySelectorAll('input:checked'))
                .filter(i=>i.dataset.action!=='all')
                .map(cb=>cb.parentElement.querySelector('span').innerHTML.trim());
              const ui = dom.querySelector('.user-input-field')?.value||'';
              return { section:s.label, selections:sels, userInput:ui };
            }).filter(r=>r.selections.length||r.userInput);
            window.voiceflow.chat.interact({
              type:'complete',
              payload:{
                selections:res,
                buttonText:cfg.text,
                buttonPath:cfg.path||'Default',
                isEmpty:res.every(r=>!r.selections.length&&!r.userInput)
              }
            });
            setTimeout(()=>{
              const ta = host.querySelector('textarea.vfrc-chat-input');
              if(ta) ta.focus();
            },0);
          });
          bc.append(btn);
        });
        container.append(bc);
      }

      /* 9. injecter dans le DOM */
      element.append(container);
      console.log('✅ MultiSelect prêt');
    } catch (err) {
      console.error('❌ MultiSelect Error :', err);
      window.voiceflow.chat.interact({
        type:'complete',
        payload:{ error:true, message:err.message }
      });
    }
  }
};
