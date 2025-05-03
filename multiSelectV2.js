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

  // Ne sʼactive que sur trace multi_select
  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      /* 0. lire le payload */
      const {
        sections        = [],
        buttons         = [],
        totalMaxSelect  = 0,
        multiselect     = true,
        chat            = true,
        chatDisabledText= '🚫'
      } = trace.payload;

      /* 1. utilitaires */
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

      /* 2. chat on/off */
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

      /* 3. container + disable on chat interact */
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      // si l'utilisateur écrit dans le chat, on grise tout
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
      // touche Entrée dans champ libre
      const chatInput = host.querySelector('textarea.vfrc-chat-input');
      if (chatInput) {
        chatInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            container.classList.add('disabled-container');
            disableChat();
          }
        });
      }
      // clique sur icône envoyer
      const sendBtn = host.querySelector('#vfrc-send-message');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          container.classList.add('disabled-container');
          disableChat();
        });
      }

      /* 4. CSS global */
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
.multiselect-container, .multiselect-container * { box-sizing:border-box!important; }
.multiselect-container { display:flex!important; flex-direction:column!important; width:100%!important;
  font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif!important;
  font-size:var(--ms-base-fs)!important; color:#fff!important;
}
.multiselect-container .sections-grid { display:grid!important; grid-template-columns:repeat(2,1fr)!important;
  gap:var(--ms-gap)!important;
}
.multiselect-container.one-section .sections-grid { grid-template-columns:1fr!important; }
.multiselect-container .section-container { background:inherit; border-radius:var(--ms-radius)!important;
  overflow:hidden!important; box-shadow:var(--ms-shadow)!important;
  transition:transform .2s ease!important;
}
.multiselect-container .section-container:hover { transform:translateY(-2px)!important; }
.multiselect-container .section-title { padding:var(--ms-gap)!important; font-weight:700!important;
  font-size:var(--ms-heading-fs)!important;
  border-bottom:2px solid rgba(255,255,255,.3)!important;
  margin-bottom:var(--ms-gap)!important;
}
.multiselect-container .options-list { display:grid!important; grid-template-columns:1fr!important;
  gap:calc(var(--ms-gap)/2)!important; padding:calc(var(--ms-gap)/2)!important;
}
.multiselect-container .options-list.grid-2cols { grid-template-columns:1fr 1fr!important; }
.multiselect-container .non-selectable-block { background:rgba(0,0,0,.25)!important;
  border:1px solid rgba(255,255,255,.2)!important;
  border-radius:calc(var(--ms-radius)-2px)!important;
  padding:4px 8px!important; font-size:var(--ms-small-fs)!important;
}
.multiselect-container .option-container { display:flex!important; align-items:flex-start!important;
  gap:calc(var(--ms-gap)/2)!important;
}
.multiselect-container .option-container label { display:flex!important; align-items:center!important;
  gap:calc(var(--ms-gap)/2)!important; width:100%!important;
  padding:calc(var(--ms-gap)/2)!important;
  background:rgba(0,0,0,var(--ms-bg-opacity))!important;
  border-radius:var(--ms-radius)!important; cursor:pointer!important;
  transition:background-color .2s, box-shadow .2s!important;
}
.multiselect-container .option-container label:hover { background:var(--ms-hover-bg)!important;
  box-shadow:var(--ms-shadow)!important;
}
.multiselect-container .option-container.greyed-out-option label { opacity:.5!important;
  cursor:not-allowed!important;
}
.multiselect-container .option-container label.selected { background:var(--ms-selected-bg)!important; }
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"] {
  all:unset!important; width:16px!important; height:16px!important;
  min-width:16px!important; min-height:16px!important;
  display:inline-flex!important; align-items:center!important;
  justify-content:center!important; border:2px solid var(--ms-accent)!important;
  border-radius:50%!important; background:#fff!important;
  transition:transform .1s ease!important;
}
.multiselect-container .option-container input:hover { transform:scale(1.1)!important; }
.multiselect-container .option-container input:checked::after {
  content:''!important; width:8px!important; height:8px!important;
  border-radius:50%!important; background:var(--ms-accent)!important;
}
.multiselect-container .user-input-container { grid-column:1/-1!important; margin-top:var(--ms-gap)!important; }
.multiselect-container .user-input-label { font-size:var(--ms-small-fs)!important; margin-bottom:16px!important; }
.multiselect-container .user-input-field { width:100%!important; padding:6px!important;
  border-radius:var(--ms-radius)!important; border:1px solid rgba(255,255,255,.3)!important;
  font-size:var(--ms-small-fs)!important; transition:box-shadow .2s!important;
}
.multiselect-container .user-input-field:focus { box-shadow:0 0 0 2px rgba(255,255,255,.4)!important;
  border-color:var(--ms-accent)!important;
}

/* on réserve un espace pour chaque bouton + son message */
.multiselect-container .button-wrapper { display:flex; flex-direction:column; align-items:flex-start; }
.multiselect-container .minselect-error {
  color: #ff4444!important;     /* rouge vif */
  font-size: var(--ms-small-fs)!important;
  margin-top:4px!important;
  visibility:hidden;             /* caché par défaut */
  white-space:nowrap!important;
}

.multiselect-container .buttons-container {
  display:flex!important; justify-content:center!important;
  gap:var(--ms-gap)!important; padding:var(--ms-gap)!important;
}
.multiselect-container .submit-btn {
  background:var(--ms-accent)!important; color:#fff!important;
  padding:8px 14px!important; border-radius:var(--ms-radius)!important;
  font-weight:600!important; cursor:pointer!important;
  border:1px solid rgba(0,0,0,.1)!important;                /* biseau léger */
  transition:background-color .2s, transform .1s!important;
}
.multiselect-container .submit-btn:hover { transform:translateY(-1px)!important; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-4px); }
  40%,80% { transform: translateX(4px); }
}
.multiselect-container .submit-btn.shake {
  animation: shake 0.3s ease!important;
}

.multiselect-container.disabled-container {
  opacity:.5!important; pointer-events:none!important;
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
        // sync “all” box per section
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

(Le script continue sans autre modification jusqu’à la fin de votre `render()`.)
