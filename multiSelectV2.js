/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  MultiSelect – Voiceflow Response Extension               ║
 *  ║                                                           ║
 *  ║  • 1 seul champ "color" par section                       ║
 *  ║  • style, hover, selected centralisés en CSS             ║
 *  ║  • active/désactive le chat selon `chat`                 ║
 *  ║  • grise le widget si l'utilisateur écrit dans le chat    ║
 *  ║  • single-select utilise `action` comme `buttonPath`     ║
 *  ║  • champ libre bascule focus retour dans le chat         ║
 *  ║  • action="all" coche/décoche l'intégralité de la section║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  // Ne s'active que sur trace multi_select
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

      // Fonction pour convertir hex en rgba
      const hexToRgba = (hex, opacity) => {
        const num = parseInt(hex.replace('#',''), 16);
        const r = num >> 16;
        const g = (num >> 8) & 0xFF;
        const b = num & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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

      /* 4. CSS global - intégré */
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ===== CONFIGURATION GÉNÉRALE DES VARIABLES ===== */
/* Ces variables permettent de personnaliser facilement les couleurs, espacements et autres styles du composant */
.multiselect-container {
  --ms-accent: #4CAF50;         /* Couleur d'accent principale, utilisée pour les bordures des checkboxes et points de sélection */
  --ms-selected-bg: #3778F4;    /* Couleur de fond des options sélectionnées */
  --ms-hover-bg: rgba(55,120,244,0.3); /* Couleur de survol des options */
  --ms-bg-opacity: 0.8;         /* Opacité du fond des options non sélectionnées */
  --ms-gap: 8px;                /* Espacement standard entre les éléments */
  --ms-radius: 6px;             /* Rayon de bordure pour les éléments arrondis */
  --ms-shadow: 0 2px 6px rgba(0,0,0,.15); /* Ombre standard pour effets de profondeur */
  --ms-heading-fs: 16px;        /* Taille de police pour les titres */
  --ms-base-fs: 15px;           /* Taille de police de base */
  --ms-small-fs: 14px;          /* Taille de police réduite pour textes secondaires */
}

/* ===== STYLES DE BASE ET RESET ===== */
/* Assure que tous les éléments utilisent la même méthode de dimensionnement */
.multiselect-container, .multiselect-container * { 
  box-sizing:border-box!important; 
}

/* Configuration du conteneur principal - structure en colonne pour empiler les sections */
.multiselect-container { 
  display:flex!important; 
  flex-direction:column!important; 
  width:100%!important;
  font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif!important;
  font-size:var(--ms-base-fs)!important; 
  color:#fff!important;
}

/* ===== LAYOUT GLOBAL DES SECTIONS ===== */
/* Configuration de la grille pour organiser les sections sur deux colonnes */
.multiselect-container .sections-grid { 
  display:grid!important; 
  grid-template-columns:repeat(2,1fr)!important; /* Par défaut, deux colonnes de largeur égale */
  gap:var(--ms-gap)!important;
}

/* Modification pour une seule colonne si une seule section est présente */
.multiselect-container.one-section .sections-grid { 
  grid-template-columns:1fr!important; 
}

/* ===== STYLES DES CONTENEURS DE SECTION ===== */
/* Effet glassmorphism (fond translucide) avec bordures et ombres */
.multiselect-container .section-container { 
  backdrop-filter: blur(10px)!important;          /* Effet de flou pour le glassmorphism */
  -webkit-backdrop-filter: blur(10px)!important;  /* Support pour Safari */
  border: 1px solid rgba(255,255,255,0.15)!important;
  border-radius: 12px!important;
  overflow:hidden!important; 
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1)!important;
  transition: all .3s ease!important;             /* Animation fluide pour les interactions */
  margin-bottom: 16px!important;
  /* Le background est défini dynamiquement dans JavaScript */
}

/* Animation de survol pour les sections - légère élévation et ombre plus prononcée */
.multiselect-container .section-container:hover { 
  transform: translateY(-4px)!important;          /* Effet d'élévation au survol */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3)!important;
}

/* ===== STYLES DES TITRES DE SECTION ===== */
/* Design moderne avec dégradé subtil et animation de soulignement */
.multiselect-container .section-title { 
  padding: 16px 20px!important; 
  font-weight: 700!important;
  font-size: 18px!important;
  letter-spacing: -0.3px!important;
  background: linear-gradient(to right, rgba(255,255,255,0.1), transparent)!important; /* Dégradé léger */
  border-bottom: 1px solid rgba(255,255,255,0.1)!important;
  margin-bottom: 8px!important;
  position: relative!important;                  /* Nécessaire pour le pseudo-élément */
  overflow: hidden!important;
}

/* Ligne d'accentuation animée sous le titre */
.multiselect-container .section-title::before {
  content: ''!important;
  position: absolute!important;
  left: 0!important;
  bottom: 0!important;
  width: 60px!important;                         /* Largeur initiale de la ligne */
  height: 2px!important;
  background: #FFFFFF!important;
  transition: width 0.3s ease!important;         /* Animation de la largeur */
}

/* Animation d'extension complète de la ligne au survol */
.multiselect-container .section-container:hover .section-title::before {
  width: 100%!important;                         /* Extension à 100% de la largeur */
}

/* ===== STYLES DES LISTES D'OPTIONS ===== */
/* Grille flexible pour organiser les options */
.multiselect-container .options-list { 
  display:grid!important; 
  grid-template-columns:1fr!important;           /* Par défaut, une seule colonne */
  gap:calc(var(--ms-gap)/2)!important;           /* Espacement réduit entre options */
  padding:calc(var(--ms-gap)/2)!important;
}

/* Passage à deux colonnes pour les listes avec beaucoup d'options */
.multiselect-container .options-list.grid-2cols { 
  grid-template-columns:1fr 1fr!important;       /* Deux colonnes de largeur égale */
}

/* ===== STYLES DES BLOCS NON-SÉLECTIONNABLES ===== */
/* Conteneurs pour les titres de groupes et options enfants */
.multiselect-container .non-selectable-block { 
  background:rgba(0,0,0,.25)!important;
  border:1px solid rgba(255,255,255,.2)!important;
  border-radius:calc(var(--ms-radius)-2px)!important;
  padding:4px 8px!important; 
  font-size:var(--ms-small-fs)!important;
}

/* ===== STYLES DES CONTENEURS D'OPTIONS ===== */
/* Alignement et espacement des options individuelles */
.multiselect-container .option-container { 
  display:flex!important; 
  align-items:flex-start!important;
  gap:calc(var(--ms-gap)/2)!important;
}

/* Style des labels contenant les checkboxes/radios et le texte */
.multiselect-container .option-container label { 
  display:flex!important; 
  align-items:center!important;
  gap:calc(var(--ms-gap)/2)!important; 
  width:100%!important;
  padding:calc(var(--ms-gap)/2)!important;
  background:rgba(0,0,0,var(--ms-bg-opacity))!important;
  border-radius:var(--ms-radius)!important; 
  cursor:pointer!important;
  transition:background-color .2s, box-shadow .2s!important; /* Animation au survol */
}

/* Effet de survol pour les options */
.multiselect-container .option-container label:hover { 
  background:var(--ms-hover-bg)!important;
  box-shadow:var(--ms-shadow)!important;
}

/* Style pour les options désactivées (grisées) */
.multiselect-container .option-container.greyed-out-option label { 
  opacity:.5!important;
  cursor:not-allowed!important;
}

/* Style pour les options sélectionnées */
.multiselect-container .option-container label.selected { 
  background:var(--ms-selected-bg)!important; 
}

/* ===== STYLES DES CHECKBOXES ET RADIOS ===== */
/* Personnalisation complète des inputs avec reset et redéfinition */
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"] {
  all:unset!important;                           /* Reset complet des styles par défaut */
  width:16px!important; 
  height:16px!important;
  min-width:16px!important;                      /* Évite la compression sur petits écrans */
  min-height:16px!important;
  display:inline-flex!important; 
  align-items:center!important;
  justify-content:center!important; 
  border:2px solid var(--ms-accent)!important;
  border-radius:50%!important;                   /* Forme ronde pour checkbox et radio */
  background:#fff!important;
  transition:transform .1s ease!important;       /* Animation de grossissement au survol */
}

/* Animation de grossissement au survol */
.multiselect-container .option-container input:hover { 
  transform:scale(1.1)!important; 
}

/* Indicateur pour l'état checked - point central */
.multiselect-container .option-container input:checked::after {
  content:''!important; 
  width:8px!important; 
  height:8px!important;
  border-radius:50%!important; 
  background:var(--ms-accent)!important;
}

/* ===== STYLES DES CHAMPS DE SAISIE LIBRE ===== */
/* Conteneur pour les champs texte utilisateur */
.multiselect-container .user-input-container { 
  grid-column:1/-1!important;                    /* S'étend sur toutes les colonnes */
  margin-top:var(--ms-gap)!important; 
}

/* Étiquette du champ */
.multiselect-container .user-input-label { 
  font-size:var(--ms-small-fs)!important; 
  margin-bottom:16px!important; 
}

/* Style du champ de saisie */
.multiselect-container .user-input-field { 
  width:100%!important; 
  padding:6px!important;
  border-radius:var(--ms-radius)!important; 
  border:1px solid rgba(255,255,255,.3)!important;
  font-size:var(--ms-small-fs)!important; 
  transition:box-shadow .2s!important;           /* Animation lors du focus */
}

/* État focus du champ avec outline lumineux */
.multiselect-container .user-input-field:focus { 
  box-shadow:0 0 0 2px rgba(255,255,255,.4)!important;
  border-color:var(--ms-accent)!important;
}

/* ===== STYLES DES ZONES DE BOUTONS ===== */
/* Conteneur vertical pour bouton + message d'erreur */
.multiselect-container .button-wrapper { 
  display:flex; 
  flex-direction:column; 
  align-items:flex-start; 
}

/* Style du message d'erreur (invisible par défaut) */
.multiselect-container .minselect-error {
  color: #ff4444!important;
  font-size: var(--ms-small-fs)!important;
  margin-top:4px!important;
  visibility:hidden;                             /* Masqué par défaut, rendu visible en JS si besoin */
  white-space:nowrap!important;
}

/* Conteneur horizontal pour les boutons d'action */
.multiselect-container .buttons-container {
  display:flex!important; 
  justify-content:center!important;
  gap:var(--ms-gap)!important; 
  padding:var(--ms-gap)!important;
}

/* ===== STYLES DES BOUTONS D'ACTION ===== */
/* Design moderne style sci-fi/corporate avec effets */
.multiselect-container .submit-btn {
  position: relative!important;                  /* Nécessaire pour les effets de scan */
  background: #4CAF50!important;                 /* Vert par défaut */
  color: #fff!important;
  padding: 10px 24px!important; 
  border-radius: 8px!important;
  font-weight: 700!important; 
  letter-spacing: 0.5px!important;
  text-transform: uppercase!important;
  font-size: 14px!important;
  cursor: pointer!important;
  border: none!important;
  overflow: hidden!important;                    /* Pour contenir l'effet de scan */
  transition: all 0.3s ease!important;
  box-shadow: 0 4px 12px rgba(76,175,80,0.3),    /* Ombre extérieure */
              inset 0 3px 0 rgba(255,255,255,0.2), /* Highlight supérieur */
              inset 0 -3px 0 rgba(0,0,0,0.2)!important; /* Ombre inférieure pour effet 3D */
}

/* Animation d'élévation au survol */
.multiselect-container .submit-btn:hover {
  transform: translateY(-2px)!important;         /* Effet de flottement */
  box-shadow: 0 6px 20px rgba(76,175,80,0.4),    /* Ombre plus prononcée */
              inset 0 3px 0 rgba(255,255,255,0.3),
              inset 0 -3px 0 rgba(0,0,0,0.3)!important;
}

/* Animation au clic */
.multiselect-container .submit-btn:active {
  transform: translateY(1px)!important;          /* Effet d'enfoncement */
  box-shadow: 0 2px 6px rgba(76,175,80,0.3),     /* Ombre réduite */
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.1)!important;
}

/* Effet de scan lumineux qui traverse le bouton */
.multiselect-container .submit-btn::before {
  content: ''!important;
  position: absolute!important;
  top: -2px!important;
  left: -2px!important;
  width: calc(100% + 4px)!important;
  height: calc(100% + 4px)!important;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)!important;
  transform: translateX(-100%) rotate(45deg)!important; /* Position initiale hors vue */
  transition: transform 0.8s ease!important;
}

/* Animation de scan au survol - traversée complète */
.multiselect-container .submit-btn:hover::before {
  transform: translateX(100%) rotate(45deg)!important; /* Déplacement complet */
}

/* ===== ANIMATIONS SPÉCIALES ===== */
/* Animation de secousse pour erreur */
@keyframes shake-enhanced {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-6px); } /* Mouvement gauche */
  30%, 60%, 90% { transform: translateX(6px); }  /* Mouvement droite */
}

/* Style du bouton pendant l'animation de secousse */
.multiselect-container .submit-btn.shake {
  animation: shake-enhanced 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)!important;
  box-shadow: 0 0 0 4px rgba(255,68,68,0.5)!important;
}

/* Effet de lueur rouge pour les erreurs */
.multiselect-container .submit-btn.shake {
  background: #ff4433!important;                 /* Rouge pour signaler l'erreur */
  box-shadow: 0 0 10px #ff4433,                  /* Lueur externe */
              0 0 20px rgba(255,68,68,0.5),      /* Lueur secondaire */
              inset 0 3px 0 rgba(255,255,255,0.2),
              inset 0 -3px 0 rgba(0,0,0,0.2)!important;
}

/* Animation de pulsation pour focus */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.7); }   /* État initial */
  70% { box-shadow: 0 0 0 10px rgba(76,175,80,0); } /* Expansion maximale */
  100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); }   /* Retour à l'état initial */
}

/* Application de l'animation de pulsation */
.multiselect-container .submit-btn:focus {
  animation: pulse 1.5s infinite!important;      /* Répétition infinie */
}

/* Style pour boutons avec couleurs personnalisées (définies en JS) */
.multiselect-container .submit-btn[style*="background-color"] {
  box-shadow: 0 4px 12px rgba(var(--btn-r),var(--btn-g),var(--btn-b),0.3),
              inset 0 3px 0 rgba(255,255,255,0.2),
              inset 0 -3px 0 rgba(0,0,0,0.2)!important;
}

/* ===== ÉTATS SPÉCIAUX ===== */
/* État désactivé pour tout le conteneur */
.multiselect-container.disabled-container {
  opacity:.5!important;                          /* Semi-transparent */
  pointer-events:none!important;                 /* Désactive les interactions */
}

/* ===== STYLE DES CONTENEURS D'OPTIONS ENFANTS ===== */
/* Mise en forme hiérarchique pour les options de niveau 3 */
.multiselect-container .children-options {
  padding-left: 10px!important;                  /* Indentation pour visualiser la hiérarchie */
  margin-top: 5px!important;
  border-left: 1px dashed rgba(255,255,255,0.3)!important; /* Ligne verticale pour visualiser le groupe */
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
        // sync "all" box per section - maintenu pour rétrocompatibilité
        sections.forEach((_, idx) => {
          const secDom = grid.children[idx];
          const allInput = secDom.querySelector('input[data-action="all"]:not([data-parent-block])');
          if (!allInput) return;
          const others = Array.from(
            secDom.querySelectorAll('input[type="checkbox"], input[type="radio"]')
          ).filter(i => i.dataset.action !== 'all' && !i.dataset.parentBlock);
          const everyChecked = others.length > 0 && others.every(i => i.checked);
          allInput.checked = everyChecked;
          allInput.parentElement.classList.toggle('selected', everyChecked);
        });
      };

      /* 6. createOptionElement */
      const createOptionElement = (opt, sectionIdx, parentBlock = null) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const blk = document.createElement('div');
          blk.classList.add('non-selectable-block');
          blk.setAttribute('data-block-id', `block-${sectionIdx}-${Math.random().toString(36).substring(2, 9)}`);
          blk.innerHTML = opt.name;
          const wrap = document.createElement('div');
          wrap.classList.add('children-options');
          opt.children.forEach(ch => {
            // Passer l'ID du bloc parent pour les enfants
            wrap.append(createOptionElement(ch, sectionIdx, blk.getAttribute('data-block-id')));
          });
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
        
        // Stocker l'ID du bloc parent si présent
        if (parentBlock) {
          inp.dataset.parentBlock = parentBlock;
        }
        
        if (opt.grey) inp.disabled = true;

        const lbl = document.createElement('label');
        const txt = document.createElement('span');
        txt.innerHTML = opt.name;
        lbl.append(inp, txt);
        wrap.append(lbl);

        inp.addEventListener('change', () => {
          // Gestion du toggle visuel
          lbl.classList.toggle('selected', inp.checked);
          
          if (opt.action === 'all') {
            // Logique pour gérer les différents niveaux de "all"
            if (parentBlock) {
              // Si le bouton "all" a un parent bloc, il ne doit sélectionner que les options de ce bloc
              const parentElement = container.querySelector(`[data-block-id="${parentBlock}"]`);
              if (parentElement) {
                const blockOptions = Array.from(
                  parentElement.querySelectorAll('input[type="checkbox"], input[type="radio"]')
                ).filter(i => i.dataset.action !== 'all');
                
                blockOptions.forEach(i => {
                  i.checked = inp.checked;
                  i.parentElement.classList.toggle('selected', inp.checked);
                });
              }
            } else {
              // Comportement traditionnel - sélectionne tous les éléments de la section
              const secDom = grid.children[sectionIdx];
              const others = Array.from(
                secDom.querySelectorAll('input[type="checkbox"], input[type="radio"]')
              ).filter(i => i.dataset.action !== 'all');
              
              others.forEach(i => {
                i.checked = inp.checked;
                i.parentElement.classList.toggle('selected', inp.checked);
              });
            }
          }
          updateTotalChecked();

          // Gestion du mode single-select (radio) pour soumission automatique
          if (!multiselect) {
            // Réactiver le chat avant de désactiver le container
            enableChat();
            container.classList.add('disabled-container');
            // Ne pas désactiver le chat à nouveau - laisser juste le container grisé
            
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selection: opt.name,
                buttonPath: opt.action || 'Default'
              }
            });
            // Ne pas appeler setTimeout for focus ici - le chat est activé
          }
        });

        return wrap;
      };

      /* 7. build sections */
      grid = document.createElement('div');
      grid.classList.add('sections-grid');
      sections.forEach((sec, i) => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        
        // Définir un dégradé dynamique basé sur la couleur de la section
        const rgba1 = hexToRgba(bg, 0.9);
        const rgba2 = hexToRgba(bg, 0.7);
        sc.style.background = `linear-gradient(135deg, ${rgba1}, ${rgba2})`;
        
        sc.style.setProperty(
          '--section-bg',
          bg.replace(
            /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
            (_m, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.15)`
          )
        );
        // Utiliser la couleur de la section comme accent
        sc.style.setProperty('--ms-accent', lightenColor(bg, 0.3));

        // titre de section
        if (sec.label && stripHTML(sec.label).trim()) {
          const ttl = document.createElement('div');
          ttl.classList.add('section-title');
          ttl.innerHTML = sec.label;
          sc.append(ttl);
        }

        // liste d'options
        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options || []).length > 10) ol.classList.add('grid-2cols');

        sec.options.forEach(opt => {
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
            uiInp.addEventListener('keydown', e => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                // Réactiver le chat avant de griser le container
                enableChat();
                container.classList.add('disabled-container');
                // Ne pas désactiver le chat - laisser uniquement le container grisé
                
                // envoi
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: {
                    isUserInput: true,
                    userInput: e.target.value.trim(),
                    buttonPath: 'Default'
                  }
                });
                // Ne pas appeler setTimeout for focus - le chat est déjà activé
              }
            });
            uiWrap.append(uiLbl, uiInp);
            ol.append(uiWrap);
          } else {
            // case / radio standard
            ol.append(createOptionElement(opt, i));
          }
        });

        sc.append(ol);
        grid.append(sc);
      });
      container.append(grid);

      /* 8. buttons */
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');

        buttons.forEach(cfg => {
          // wrapper vertical : bouton + msg d'erreur
          const wrapper = document.createElement('div');
          wrapper.classList.add('button-wrapper');

          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          if (cfg.color) {
            btn.style.setProperty('background-color', cfg.color, 'important');
            btn.style.setProperty('border-color',     cfg.color, 'important');
            // Extraire les valeurs RGB pour le box-shadow
            const rgb = parseInt(cfg.color.replace('#',''), 16);
            const r = (rgb >> 16) & 255;
            const g = (rgb >> 8) & 255;
            const b = rgb & 255;
            btn.style.setProperty('--btn-r', r);
            btn.style.setProperty('--btn-g', g);
            btn.style.setProperty('--btn-b', b);
          }
          btn.textContent = cfg.text;

          // zone d'erreur sous le bouton
          const err = document.createElement('div');
          err.className = 'minselect-error';

          btn.addEventListener('click', () => {
            const min = cfg.minSelect || 0;

            // nombre de checkbox cochées hors "all"
            const checked = Array.from(
              container.querySelectorAll('input[type="checkbox"]:checked')
            ).filter(i => i.dataset.action !== 'all').length;

            // si seuil ≥1 et non atteint → shake+erreur
            if (min > 0 && checked < min) {
              btn.classList.add('shake');
              setTimeout(() => btn.classList.remove('shake'), 400);
              err.textContent = `Vous devez sélectionner au moins ${min} option${min>1?'s':''}.`;
              err.style.visibility = 'visible';
              return;
            }

            // sinon sélection OK → on cache l'erreur, on réactive le chat, on grise le container
            err.style.visibility = 'hidden';
            enableChat();  // Réactiver le chat
            container.classList.add('disabled-container');  // Griser uniquement le container
            // Ne pas désactiver le chat ici - laisser l'utilisateur interagir avec le chat

            const res = sections.map((s, i) => {
              const dom = grid.children[i];
              const sels = Array.from(dom.querySelectorAll('input:checked'))
                .filter(i => i.dataset.action !== 'all')
                .map(cb => cb.parentElement.querySelector('span').innerHTML.trim());
              const ui = dom.querySelector('.user-input-field')?.value || '';
              return { section: s.label, selections: sels, userInput: ui };
            }).filter(r => r.selections.length || r.userInput);

            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selections:  res,
                buttonText:  cfg.text,
                buttonPath:  cfg.path || 'Default',
                isEmpty:     res.every(r => !r.selections.length && !r.userInput)
              }
            });
            // Ne pas appeler setTimeout for focus - le chat reste activé
          });

          wrapper.append(btn, err);
          bc.append(wrapper);
        });

        container.append(bc);
      }

      /* 9. injecter dans le DOM */
      element.append(container);
      console.log('✅ MultiSelect prêt');
    } catch (err) {
      console.error('❌ MultiSelect Error :', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};
