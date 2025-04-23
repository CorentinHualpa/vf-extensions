export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  /* ——————————————————————————————————————————————————————————— */
  /* 1) Cette extension ne se déclenche que sur les traces        */
  /*    de type "multi_select"                                    */
  /* ——————————————————————————————————————————————————————————— */
  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  /* ——————————————————————————————————————————————————————————— */
  /* 2) RENDER                                                    */
  /* ——————————————————————————————————————————————————————————— */
  render: ({ trace, element }) => {
    try {
      console.log('▶️ Démarrage MultiSelect');

      /* ────────────────────────────────────────────────────── */
      /* 2-A  Désérialisation du payload                       */
      /* ────────────────────────────────────────────────────── */
      const {
        sections        = [],
        buttons         = [],
        totalMaxSelect  = 0,
        multiselect     = true,
      } = trace.payload;

      /* Stocke les valeurs de saisie libre (inputs texte) */
      const userInputValues = {};

      /* Petit helper pour retirer le HTML éventuel dans les labels */
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      /* ────────────────────────────────────────────────────── */
      /* 2-B  Création du container racine                     */
      /* ────────────────────────────────────────────────────── */
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      /* ────────────────────────────────────────────────────── */
      /* 2-C  Injection du <style>                             */
      /*      → Toutes les tailles et couleurs sont variables  */
      /* ────────────────────────────────────────────────────── */
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ╔════════════════════════════════════════════════════════════╗ */
/* ║               VARIABLES GLOBALES & TYPO                    ║ */
/* ╚════════════════════════════════════════════════════════════╝ */
.multiselect-container {
  --ms-accent:       #4CAF50;            /* ► couleur boutons / checkbox   */
  --ms-bg-opacity:   0.80;               /* ► opacité fond option           */

  /* ÉCHELLE TYPO : du plus grand au plus petit */
  --ms-heading-fs:   16px;               /* ► TITRES de section             */
  --ms-base-fs:      15px;               /* ► Texte général                 */
  --ms-small-fs:     14px;               /* ► Labels, champs, secondaires   */

  /* ESPACEMENTS & STYLES */
  --ms-gap:          8px;                /* ► marge/padding de référence    */
  --ms-radius:       6px;                /* ► arrondi générique             */
  --ms-shadow:       0 2px 6px rgba(0,0,0,0.15); /* ► ombre cartes      */
}

/* ╔════════════════════════════════════════════════════════════╗ */
/* ║ 1. RESET BOX-SIZING                                        ║ */
/* ╚════════════════════════════════════════════════════════════╝ */
.multiselect-container,
.multiselect-container * { box-sizing: border-box !important; }

/* ╔════════════════════════════════════════════════════════════╗ */
/* ║ 2. CONTENEUR PRINCIPAL (taille texte = --ms-base-fs)       ║ */
/* ╚════════════════════════════════════════════════════════════╝ */
.multiselect-container {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
  font-size: var(--ms-base-fs) !important;
  color: #fff !important;
}

/* ╔══════════════════════╗ */
/* ║ 3. GRILLE DE SECTIONS ║ */
/* ╚══════════════════════╝ */
.multiselect-container .sections-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: var(--ms-gap) !important;
}
.multiselect-container.one-section .sections-grid { grid-template-columns: 1fr !important; }

/* ╔══════════════════════╗ */
/* ║ 4. SECTION (carte)   ║ */
/* ╚══════════════════════╝ */
.multiselect-container .section-container{
  background: inherit;                       /* couleur injectée en JS  */
  border-radius: var(--ms-radius) !important;
  overflow: hidden !important;
  box-shadow: var(--ms-shadow) !important;
  transition: transform .2s ease !important;
}
.multiselect-container .section-container:hover { transform: translateY(-2px) !important; }

/* ╔══════════════════════╗ */
/* ║ 5. TITRE DE SECTION  ║ */
/* ╚══════════════════════╝ */
.multiselect-container .section-title{
  padding: var(--ms-gap) !important;
  font-weight: 700 !important;
  font-size: var(--ms-heading-fs) !important;
  border-bottom:2px solid rgba(255,255,255,.3) !important;
  margin-bottom: var(--ms-gap) !important;
}

/* ╔══════════════════════╗ */
/* ║ 6. LISTE D’OPTIONS   ║ */
/* ╚══════════════════════╝ */
.multiselect-container .options-list{
  display: grid !important;
  grid-template-columns:1fr !important;
  gap: calc(var(--ms-gap)/2) !important;
  padding: calc(var(--ms-gap)/2) !important;
}
.multiselect-container .options-list.grid-2cols{ grid-template-columns:1fr 1fr !important; }

/* ╔══════════════════════════════════╗ */
/* ║ 7. BLOC NON CLIQUABLE (children) ║ */
/* ╚══════════════════════════════════╝ */
.multiselect-container .non-selectable-block{
  background:rgba(0,0,0,.25)!important;
  border:1px solid rgba(255,255,255,.2)!important;
  border-radius:calc(var(--ms-radius)-2px)!important;
  padding:4px 8px !important;
  font-size:var(--ms-small-fs)!important;
}

/* ╔══════════════════════╗ */
/* ║ 8. OPTION CLIQUABLE  ║ */
/* ╚══════════════════════╝ */
.multiselect-container .option-container{
  display:flex !important;
  align-items:flex-start !important;
  gap:calc(var(--ms-gap)/2) !important;
}

/* ── 8-A  état normal ───────────────────────────────────── */
.multiselect-container .option-container label{
  display:flex !important;
  align-items:center !important;
  gap:calc(var(--ms-gap)/2) !important;
  width:100% !important;
  padding:calc(var(--ms-gap)/2) !important;

  /* ▼ Fond noir 80 % d’opacité (variable) */
  background-color:rgba(0,0,0,var(--ms-bg-opacity)) !important; 
  border-radius:var(--ms-radius) !important;
  cursor:pointer !important;
  transition:background-color .2s ease, box-shadow .2s ease !important;
}

/* ── 8-B  état hover : +0.1 d’opacité ───────────────────── */
.multiselect-container .option-container label:hover{
  background-color:rgba(
    0,0,0,
    calc(var(--ms-bg-opacity) + 0.1)
  ) !important;
  box-shadow:var(--ms-shadow) !important;
}

/* ── 8-C  option grisée / inactive ───────────────────────── */
.multiselect-container .option-container.greyed-out-option label{
  opacity:.5 !important;
  cursor:not-allowed !important;
}

/* ╔══════════════════════╗ */
/* ║ 9. CHECKBOX / RADIO  ║ */
/* ╚══════════════════════╝ */
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"]{
  all:unset !important;
  width:16px !important; height:16px !important; aspect-ratio:1/1!important;
  display:inline-flex !important; align-items:center!important; justify-content:center!important;
  border:2px solid var(--ms-accent)!important; border-radius:50%!important;
  background:#fff!important; transition:transform .1s ease!important;
}
.multiselect-container .option-container input:hover{ transform:scale(1.1)!important; }
.multiselect-container .option-container input:checked::after{
  content:''!important; width:8px!important; height:8px!important; border-radius:50%!important;
  background:var(--ms-accent)!important; margin:auto!important;
}

/* ╔═════════════════════════════════════════════╗ */
/* ║ 10. CHAMP LIBRE (USER INPUT) – ESPACEMENTS  ║ */
/* ╚═════════════════════════════════════════════╝ */
.multiselect-container .user-input-container{
  grid-column:1/-1!important;
  margin-top:var(--ms-gap)!important;              /* espace AVANT le label   */
}
.multiselect-container .user-input-label{
  font-size:var(--ms-small-fs)!important;
  margin-bottom:16px!important;                    /* espace label → champ    */
}
.multiselect-container .user-input-field{
  width:100%!important; padding:6px!important;
  border-radius:var(--ms-radius)!important;
  border:1px solid rgba(255,255,255,.3)!important;
  font-size:var(--ms-small-fs)!important;
  transition:box-shadow .2s ease!important;
}
.multiselect-container .user-input-field:focus{
  box-shadow:0 0 0 2px rgba(255,255,255,.4)!important;
  border-color:var(--ms-accent)!important;
}

/* ╔══════════════════════╗ */
/* ║ 11. BOUTONS ACTION   ║ */
/* ╚══════════════════════╝ */
.multiselect-container .buttons-container{
  display:flex!important; justify-content:center!important;
  gap:var(--ms-gap)!important; padding:var(--ms-gap)!important;
}
.multiselect-container .submit-btn{
  background:var(--ms-accent)!important; color:#fff!important;
  padding:8px 14px!important; border-radius:var(--ms-radius)!important;
  font-weight:600!important; cursor:pointer!important;
  transition:background-color .2s, transform .1s!important;
}
.multiselect-container .submit-btn:hover{ background:rgba(0,0,0,.1)!important; transform:translateY(-1px)!important; }

/* ╔══════════════════════╗ */
/* ║ 12. LOCK / DISABLED  ║ */
/* ╚══════════════════════╝ */
.multiselect-container.disabled-container{
  opacity:.5!important; pointer-events:none!important;
}
      `;
      container.appendChild(styleEl);

      /* ────────────────────────────────────────────────────── */
      /* 2-D  Fonction max sélection (multi-select)            */
      /* ────────────────────────────────────────────────────── */
      const updateTotalChecked = () => {
        const allInputs = [...container.querySelectorAll('input')];
        const nbChecked = allInputs.filter(i => i.checked).length;
        if (totalMaxSelect > 0 && nbChecked >= totalMaxSelect && multiselect) {
          allInputs.forEach(i => { if (!i.checked) i.disabled = true; });
        } else {
          allInputs.forEach(i => { if (!i.closest('.greyed-out-option')) i.disabled = false; });
        }
      };

      /* ────────────────────────────────────────────────────── */
      /* 2-E  Factory d’une OPTION (récursif pour children)     */
      /* ────────────────────────────────────────────────────── */
      const createOptionElement = opt => {
        /* bloc non-cliquable avec children ------------------ */
        if (Array.isArray(opt.children) && opt.children.length) {
          const block     = document.createElement('div');
          block.classList.add('non-selectable-block');
          block.innerHTML = opt.name;

          const wrapChild = document.createElement('div');
          wrapChild.classList.add('children-options');
          opt.children.forEach(ch => wrapChild.appendChild(createOptionElement(ch)));
          block.appendChild(wrapChild);
          return block;
        }

        /* option standard (checkbox / radio) ---------------- */
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp = document.createElement('input');
        inp.type  = multiselect ? 'checkbox' : 'radio';
        if (opt.grey) inp.disabled = true;

        inp.addEventListener('change', () => {
          updateTotalChecked();
          /* single-select : envoi immédiat */
          if (!multiselect) {
            container.classList.add('disabled-container');
            window.voiceflow.chat.interact({ type:'complete', payload:{ selection: opt.name, buttonPath:'Default' }});
          }
        });

        const lbl = document.createElement('label');
        lbl.appendChild(inp);
        const sp = document.createElement('span'); sp.innerHTML = opt.name;
        lbl.appendChild(sp);
        wrap.appendChild(lbl);
        return wrap;
      };

      /* ────────────────────────────────────────────────────── */
      /* 2-F  Montage de toutes les sections                   */
      /* ────────────────────────────────────────────────────── */
      const grid = document.createElement('div');
      grid.classList.add('sections-grid');

      sections.forEach(sec => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');

        /* couleur de section (background + var CSS pour options) */
        const bg = sec.backgroundColor || sec.color || '#455A64';
        sc.style.backgroundColor = bg;
        sc.style.setProperty('--section-bg', bg.replace(
          /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
          (_,r,g,b)=>`rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.15)`
        ));

        /* Titre de section */
        if (sec.label && stripHTML(sec.label).trim()) {
          const title = document.createElement('div');
          title.classList.add('section-title');
          title.innerHTML = sec.label;
          sc.appendChild(title);
        }

        /* Liste d’options */
        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options||[]).length > 10) ol.classList.add('grid-2cols');

        (sec.options||[]).forEach(opt=>{
          if(opt.action==='user_input'){
            /* Champ texte libre -------------------------------- */
            userInputValues[sec.label]='';
            const uiWrap = document.createElement('div');
            uiWrap.classList.add('user-input-container');

            const uiLbl  = document.createElement('label');
            uiLbl.classList.add('user-input-label');
            uiLbl.textContent = opt.label;

            const uiInp = document.createElement('input');
            uiInp.type  = 'text';
            uiInp.classList.add('user-input-field');
            uiInp.placeholder = opt.placeholder || '';

            uiInp.addEventListener('input',e=>{ userInputValues[sec.label]=e.target.value; });
            uiInp.addEventListener('keydown',e=>{
              if(e.key==='Enter'){
                const v=e.target.value.trim(); if(!v) return;
                container.classList.add('disabled-container');
                window.voiceflow.chat.interact({ type:'complete', payload:{ isUserInput:true, userInput:v, buttonPath:'Default' }});
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

      /* ────────────────────────────────────────────────────── */
      /* 2-G  Boutons de validation (multi-select)             */
      /* ────────────────────────────────────────────────────── */
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');

        buttons.forEach(cfg=>{
          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.textContent = cfg.text;

          btn.addEventListener('click',()=>{
            container.classList.add('disabled-container');

            const finalSections = sections.map((sec,idx)=>{
              const secsDom = grid.children[idx];
              const sels = [...secsDom.querySelectorAll('input:checked')]
                           .map(cb=>cb.parentElement.querySelector('span').innerHTML.trim());
              return { section:sec.label, selections:sels, userInput:userInputValues[sec.label]||'' };
            }).filter(s=>s.selections.length||s.userInput);

            window.voiceflow.chat.interact({
              type:'complete',
              payload:{
                selections:finalSections,
                buttonText:cfg.text,
                buttonPath:cfg.path||'Default',
                isEmpty:finalSections.every(s=>!s.selections.length&&!s.userInput)
              }
            });
          });

          bc.appendChild(btn);
        });

        container.appendChild(bc);
      }

      /* ────────────────────────────────────────────────────── */
      /* 2-H  On insère le composant dans la WebApp Voiceflow  */
      /* ────────────────────────────────────────────────────── */
      element.appendChild(container);
      console.log('✅ MultiSelect prêt');

    } catch (err) {
      console.error('❌ Erreur MultiSelect :', err);
      window.voiceflow.chat.interact({ type:'complete', payload:{ error:true, message:err.message }});
    }
  }
};
