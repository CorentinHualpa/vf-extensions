/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  MultiSelect – Voiceflow Response Extension               ║
 *  ║                                                           ║
 *  ║  • Support pour 1, 2, 3, 4, 5, 6+ colonnes              ║
 *  ║  • Boutons harmonieux et responsive                       ║
 *  ║  • Taille de texte proportionnelle à buttonFontSize      ║
 *  ║  • Text-shadow pour visibilité optimale                  ║
 *  ║  • Champs texte adaptatifs améliorés                     ║
 *  ║  • Bouton global-all personnalisable                     ║
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
        chatDisabledText= '🚫',
        gridColumns     = 0,  // 0 = auto (par défaut), 1 = force une colonne, 2,3,4,5,6+ = nombre de colonnes
        optionsGap      = 12,  // Contrôle l'espacement entre les options (en px)
        global_button_color = '#9C27B0', // Couleur par défaut pour tous les boutons
        buttonFontSize  = 15, // Taille du texte des boutons (base pour tous les textes)
        useGlobalAll    = false,  // Option pour activer/désactiver l'option global-all
        globalAllSelectText = "Tout sélectionner", // ✅ Texte pour "sélectionner tout"
        globalAllDeselectText = "Tout désélectionner", // ✅ Texte pour "désélectionner tout"
        global_select_button_text = null, // ✅ Texte personnalisé pour le bouton principal de sélection
        instanceId      = null // Identifiant fourni dans le payload (facultatif)
      } = trace.payload;

      // NOUVEAU: Générer un identifiant unique pour cette instance
      const uniqueInstanceId = instanceId || `ms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
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
      
      // Variable pour suivre l'état d'activation du chat
      let chatEnabled = chat; // Initialiser avec l'état défini dans le payload
      
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
        chatEnabled = false; // Mettre à jour l'état du chat
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
        chatEnabled = true; // Mettre à jour l'état du chat
        
        // Vérification additionnelle pour s'assurer que le chat est activé
        setTimeout(() => {
          if (!chatEnabled) {
            enableChat(); // Réessayer l'activation si nécessaire
          }
        }, 100);
      }
      
      if (!chat) disableChat();

      /* 3. container + disable on chat interact */
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      
      // Ajouter l'ID unique à l'élément container
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);
      
      // Support complet pour n'importe quel nombre de colonnes
      if (gridColumns === 1 || sections.length === 1) {
        container.classList.add('one-section');
      } else if (gridColumns >= 2) {
        container.classList.add(`grid-${gridColumns}-cols`);
        container.setAttribute('data-grid-columns', gridColumns);
      }

      // si l'utilisateur écrit dans le chat, on grise tout
      if (chat && window.voiceflow?.chat?.interact) {
        const orig = window.voiceflow.chat.interact.bind(window.voiceflow.chat);
        window.voiceflow.chat.interact = args => {
          if (args.type === 'text') {
            container.classList.add('disabled-container');
            disableChat();
            
            // Réactiver le chat après soumission du texte
            setTimeout(() => {
              enableChat();
            }, 300);
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
            
            // Réactiver le chat après soumission par touche Entrée
            setTimeout(() => {
              enableChat();
            }, 300);
          }
        });
      }
      
      // clique sur icône envoyer
      const sendBtn = host.querySelector('#vfrc-send-message');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          container.classList.add('disabled-container');
          disableChat();
          
          // Réactiver le chat après le clic sur envoyer
          setTimeout(() => {
            enableChat();
          }, 300);
        });
      }

      /* 4. CSS global - intégré avec calculs proportionnels */
      const styleEl = document.createElement('style');
      
      // Extraction des valeurs RGB pour les variables CSS
      const globalBtnRgb = parseInt(global_button_color.replace('#',''), 16);
      const globalBtnR = (globalBtnRgb >> 16) & 255;
      const globalBtnG = (globalBtnRgb >> 8) & 255;
      const globalBtnB = globalBtnRgb & 255;
      
      // Calculs proportionnels basés sur buttonFontSize
      const baseFontSize = buttonFontSize;
      const h2Size = Math.round(baseFontSize * 1.5);    // 150%
      const h3Size = Math.round(baseFontSize * 1.2);    // 120%
      const h4Size = Math.round(baseFontSize * 1.1);    // 110%
      const h5Size = Math.round(baseFontSize * 1.05);   // 105%
      const emSize = Math.round(baseFontSize * 0.93);   // 93%
      const smallSize = Math.round(baseFontSize * 0.87); // 87%
      const lineHeightBase = 1.5;
      const gapProportional = Math.round(optionsGap * (baseFontSize / 15)); // Ajuste gap selon la taille
      
      styleEl.textContent = `
/* Variables CSS principales avec calculs proportionnels */
.multiselect-container {
  --ms-accent: #4CAF50;
  --ms-selected-bg: #3778F4;
  --ms-hover-bg: rgba(55,120,244,0.3);
  --ms-bg-opacity: 0.8;
  --ms-gap: ${gapProportional}px;
  --ms-radius: 10px;
  --ms-shadow: 0 2px 6px rgba(0,0,0,.15);
  --ms-heading-fs: ${h3Size}px;
  --ms-base-fs: ${baseFontSize}px;
  --ms-small-fs: ${smallSize}px;
  --ms-global-btn-color: ${global_button_color};
  --ms-global-btn-r: ${globalBtnR};
  --ms-global-btn-g: ${globalBtnG};
  --ms-global-btn-b: ${globalBtnB};
  --ms-btn-font-size: ${buttonFontSize}px;
  
  /* Nouvelles variables pour les tailles proportionnelles */
  --ms-h2-size: ${h2Size}px;
  --ms-h3-size: ${h3Size}px;
  --ms-h4-size: ${h4Size}px;
  --ms-h5-size: ${h5Size}px;
  --ms-em-size: ${emSize}px;
  --ms-small-size: ${smallSize}px;
  --ms-line-height: ${lineHeightBase};
  --ms-margin-base: ${Math.round(baseFontSize * 0.5)}px;
}

/* Styles pour tous les titres h2-h5 dans le conteneur */
.multiselect-container h2 {
  font-size: var(--ms-h2-size)!important;
  line-height: 1.3!important;
  margin: 0 0 var(--ms-margin-base) 0!important;
}

.multiselect-container h3 {
  font-size: var(--ms-h3-size)!important;
  line-height: 1.4!important;
  margin: 0 0 var(--ms-margin-base) 0!important;
}

.multiselect-container h4 {
  font-size: var(--ms-h4-size)!important;
  line-height: 1.4!important;
  margin: 0 0 calc(var(--ms-margin-base) * 0.8) 0!important;
}

.multiselect-container h5 {
  font-size: var(--ms-h5-size)!important;
  line-height: 1.4!important;
  margin: 0 0 calc(var(--ms-margin-base) * 0.7) 0!important;
}

/* Styles pour em et small avec proportions */
.multiselect-container em {
  font-size: var(--ms-em-size)!important;
  line-height: var(--ms-line-height)!important;
}

.multiselect-container small {
  font-size: var(--ms-small-size)!important;
  line-height: var(--ms-line-height)!important;
}

/* Ajustement des br pour l'espacement proportionnel */
.multiselect-container br {
  content: "";
  display: block!important;
  margin-top: calc(var(--ms-margin-base) * 0.3)!important;
}

/* Reset et styles de base */
.multiselect-container, .multiselect-container * { 
  box-sizing:border-box!important; 
}

.multiselect-container { 
  display:flex!important; 
  flex-direction:column!important; 
  width:100%!important;
  font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif!important;
  font-size:var(--ms-base-fs)!important; 
  color:#fff!important;
}

/* Layout des sections - Support pour n'importe quel nombre de colonnes */
.multiselect-container .sections-grid { 
  display:grid!important; 
  grid-template-columns:repeat(2,1fr)!important; /* Par défaut : 2 colonnes */
  gap:var(--ms-gap)!important;
}

.multiselect-container.one-section .sections-grid { 
  grid-template-columns:1fr!important; 
}

/* Support spécifique pour chaque nombre de colonnes */
.multiselect-container.grid-3-cols .sections-grid { 
  grid-template-columns:repeat(3,1fr)!important; 
}

.multiselect-container.grid-4-cols .sections-grid { 
  grid-template-columns:repeat(4,1fr)!important; 
}

.multiselect-container.grid-5-cols .sections-grid { 
  grid-template-columns:repeat(5,1fr)!important; 
}

.multiselect-container.grid-6-cols .sections-grid { 
  grid-template-columns:repeat(6,1fr)!important; 
}

/* Solution générique avec CSS custom properties pour 7+ colonnes */
.multiselect-container[data-grid-columns] .sections-grid {
  grid-template-columns: repeat(var(--grid-cols, 2), 1fr)!important;
}

/* Responsive design pour 3+ colonnes */
@media (max-width: 768px) {
  .multiselect-container[data-grid-columns] .sections-grid {
    grid-template-columns: 1fr!important; /* 1 colonne sur mobile */
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .multiselect-container[data-grid-columns="3"] .sections-grid,
  .multiselect-container[data-grid-columns="4"] .sections-grid,
  .multiselect-container[data-grid-columns="5"] .sections-grid,
  .multiselect-container[data-grid-columns="6"] .sections-grid {
    grid-template-columns: repeat(2, 1fr)!important; /* 2 colonnes sur tablette */
  }
}

/* Sections avec glassmorphism dynamique selon la couleur */
.multiselect-container .section-container { 
  backdrop-filter: blur(10px)!important;
  -webkit-backdrop-filter: blur(10px)!important;
  border: 1px solid rgba(255,255,255,0.15)!important;
  border-radius: 12px!important;
  overflow:hidden!important; 
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1)!important;
  transition: all .3s ease!important;
  margin-bottom: calc(var(--ms-gap) * 1.5)!important;
  /* Le background est défini dynamiquement dans JavaScript */
}

.multiselect-container .section-container:hover { 
  transform: translateY(-4px)!important; 
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3)!important;
}

/* Titres de section améliorés avec taille proportionnelle */
.multiselect-container .section-title { 
  padding: calc(var(--ms-gap) * 1.5) calc(var(--ms-gap) * 2)!important; 
  font-weight: 700!important;
  font-size: var(--ms-heading-fs)!important;
  letter-spacing: -0.3px!important;
  background: linear-gradient(to right, rgba(255,255,255,0.1), transparent)!important;
  border-bottom: 1px solid rgba(255,255,255,0.1)!important;
  margin-bottom: var(--ms-margin-base)!important;
  position: relative!important;
  overflow: hidden!important;
}

.multiselect-container .section-title::before {
  content: ''!important;
  position: absolute!important;
  left: 0!important;
  bottom: 0!important;
  width: 60px!important;
  height: 2px!important;
  background: #FFFFFF!important;
  transition: width 0.3s ease!important;
}

.multiselect-container .section-container:hover .section-title::before {
  width: 100%!important;
}

/* Liste d'options */
.multiselect-container .options-list { 
  display:grid!important; 
  grid-template-columns:1fr!important;
  gap:var(--ms-gap)!important; 
  padding:calc(var(--ms-gap) * 1.5)!important;
}

.multiselect-container .options-list.grid-2cols { 
  grid-template-columns:1fr 1fr!important; 
}

/* Blocs non-sélectionnables */
.multiselect-container .non-selectable-block { 
  background:rgba(0,0,0,.25)!important;
  border:1px solid rgba(255,255,255,.2)!important;
  border-radius:calc(var(--ms-radius)-2px)!important;
  padding:calc(var(--ms-gap) * 0.5) var(--ms-gap)!important; 
  font-size:var(--ms-small-fs)!important;
  margin-bottom: var(--ms-gap)!important;
}

/* Options conteneurs avec padding proportionnel */
.multiselect-container .option-container { 
  display:flex!important; 
  align-items:flex-start!important;
  gap:calc(var(--ms-gap)/2)!important;
  margin-bottom: var(--ms-gap)!important;
}

.multiselect-container .option-container label { 
  display:flex!important; 
  align-items:flex-start!important;
  gap:calc(var(--ms-gap) * 0.8)!important; 
  width:100%!important;
  padding:calc(var(--ms-gap) * 2) calc(var(--ms-gap) * 2.5)!important;
  background:rgba(0,0,0,var(--ms-bg-opacity))!important;
  border-radius:var(--ms-radius)!important; 
  cursor:pointer!important;
  transition:background-color .2s, box-shadow .2s!important;
  font-size: var(--ms-base-fs)!important;
  line-height: var(--ms-line-height)!important;
}

.multiselect-container .option-container label:hover { 
  background:var(--ms-hover-bg)!important;
  box-shadow:var(--ms-shadow)!important;
}

.multiselect-container .option-container.greyed-out-option label { 
  opacity:.5!important;
  cursor:not-allowed!important;
}

.multiselect-container .option-container label.selected { 
  background:var(--ms-selected-bg)!important; 
}

/* Styles spécifiques pour les options "all" */
.multiselect-container .option-container.all-option label {
  background: rgba(0, 0, 0, 0.5)!important;
  border: 1px dashed rgba(255, 255, 255, 0.3)!important;
  font-weight: 700!important;
  font-style: italic!important;
  padding: calc(var(--ms-gap) * 2) calc(var(--ms-gap) * 2.5)!important;
  border-radius: calc(var(--ms-radius) + 2px)!important;
  transition: all 0.3s ease!important;
}

.multiselect-container .option-container.all-option label:hover {
  background: var(--ms-hover-bg)!important;
  border-style: solid!important;
  transform: scale(1.02)!important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2)!important;
}

.multiselect-container .option-container.all-option label.selected {
  background: var(--ms-selected-bg)!important;
  border-color: rgba(255, 255, 255, 0.6)!important;
}

.multiselect-container .option-container.all-option label:before {
  content: "✓ "!important;
  font-weight: bold!important;
  opacity: 0.8!important;
}

/* Styles pour le global-all */
.multiselect-container .global-all-container {
  width: 100%!important;
  display: flex!important;
  justify-content: center!important;
  margin: calc(var(--ms-gap) * 1.5) 0!important;
  padding: var(--ms-gap)!important;
  position: relative!important;
}

.multiselect-container .global-all-container:before,
.multiselect-container .global-all-container:after {
  content: ""!important;
  position: absolute!important;
  height: 1px!important;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)!important;
  width: 80%!important;
  left: 10%!important;
}

.multiselect-container .global-all-container:before {
  top: 0!important;
}

.multiselect-container .global-all-container:after {
  bottom: 0!important;
}

.multiselect-container .global-all-button {
  background: linear-gradient(145deg, var(--ms-global-btn-color), 
              rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b), 0.8))!important;
  color: white!important;
  border: none!important;
  border-radius: 8px!important;
  padding: calc(var(--ms-gap) * 1) calc(var(--ms-gap) * 2)!important;
  font-weight: bold!important;
  font-size: var(--ms-base-fs)!important;
  cursor: pointer!important;
  transition: all 0.3s ease!important;
  box-shadow: 0 4px 12px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b), 0.3),
              inset 0 1px 0 rgba(255,255,255,0.2)!important;
  position: relative!important;
  overflow: hidden!important;
  display: flex!important;
  align-items: center!important;
  justify-content: center!important;
  gap: 8px!important;
}

.multiselect-container .global-all-button:hover {
  transform: translateY(-2px)!important;
  box-shadow: 0 6px 16px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b), 0.4),
              inset 0 1px 0 rgba(255,255,255,0.3)!important;
}

.multiselect-container .global-all-button:active {
  transform: translateY(1px)!important;
  box-shadow: 0 2px 8px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b), 0.3)!important;
}

.multiselect-container .global-all-button::before {
  content: ''!important;
  position: absolute!important;
  top: -10px!important;
  left: -10px!important;
  width: calc(100% + 20px)!important;
  height: calc(100% + 20px)!important;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)!important;
  transform: translateX(-100%) rotate(45deg)!important;
  transition: transform 0.6s ease!important;
}

.multiselect-container .global-all-button:hover::before {
  transform: translateX(100%) rotate(45deg)!important;
}

.multiselect-container .global-all-button .icon {
  font-size: calc(var(--ms-base-fs) * 1.2)!important;
}

.multiselect-container .global-all-button.active {
  background: linear-gradient(145deg, #4CAF50, #2E7D32)!important;
}

/* Checkbox/Radio styles avec taille proportionnelle */
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"] {
  all:unset!important; 
  width:calc(var(--ms-base-fs) * 1.1)!important; 
  height:calc(var(--ms-base-fs) * 1.1)!important;
  min-width:calc(var(--ms-base-fs) * 1.1)!important; 
  min-height:calc(var(--ms-base-fs) * 1.1)!important;
  display:inline-flex!important; 
  align-items:center!important;
  justify-content:center!important; 
  border:2px solid var(--ms-accent)!important;
  border-radius:50%!important; 
  background:#fff!important;
  transition:transform .1s ease!important;
  margin-top: 3px!important;
  flex-shrink: 0!important;
}

.multiselect-container .option-container input:hover { 
  transform:scale(1.1)!important; 
}

.multiselect-container .option-container input:checked::after {
  content:''!important; 
  width:calc(var(--ms-base-fs) * 0.55)!important; 
  height:calc(var(--ms-base-fs) * 0.55)!important;
  border-radius:50%!important; 
  background:var(--ms-accent)!important;
}

/* ✅ AMÉLIORATIONS POUR LES CHAMPS DE SAISIE UTILISATEUR */
.multiselect-container .user-input-container { 
  grid-column:1/-1!important; 
  margin-top:calc(var(--ms-gap) * 2)!important;
  padding: calc(var(--ms-gap) * 1.5)!important;
  background: rgba(255,255,255,0.08)!important;
  border-radius: 12px!important;
  border: 1px solid rgba(255,255,255,0.15)!important;
  backdrop-filter: blur(10px)!important;
  -webkit-backdrop-filter: blur(10px)!important;
}

.multiselect-container .user-input-label { 
  font-size: var(--ms-base-fs)!important;
  font-weight: 600!important;
  margin-bottom: calc(var(--ms-gap) * 1)!important;
  display: block!important;
  color: #ffffff!important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3)!important;
}

.multiselect-container .user-input-field { 
  width: 100%!important; 
  min-height: calc(var(--ms-base-fs) * 8)!important; /* ✅ Hauteur minimale proportionnelle */
  padding: calc(var(--ms-gap) * 1) calc(var(--ms-gap) * 1.5)!important;
  border-radius: 8px!important; 
  border: 2px solid rgba(255,255,255,0.3)!important;
  background: rgba(255,255,255,0.95)!important;
  color: #333!important;
  font-size: var(--ms-base-fs)!important;
  font-family: inherit!important;
  line-height: var(--ms-line-height)!important;
  resize: vertical!important; /* ✅ Permet le redimensionnement vertical */
  transition: all 0.3s ease!important;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1)!important;
}

/* ✅ État focus amélioré */
.multiselect-container .user-input-field:focus { 
  outline: none!important;
  border-color: var(--ms-accent)!important;
  box-shadow: 0 0 0 3px rgba(76,175,80,0.3), 
              inset 0 2px 4px rgba(0,0,0,0.1)!important;
  background: rgba(255,255,255,1)!important;
  transform: translateY(-2px)!important;
}

/* ✅ Placeholder styling */
.multiselect-container .user-input-field::placeholder {
  color: #666!important;
  font-style: italic!important;
  opacity: 0.8!important;
}

/* ✅ Auto-resize du textarea basé sur le contenu */
.multiselect-container .user-input-field[data-auto-resize] {
  overflow: hidden!important;
  min-height: calc(var(--ms-base-fs) * 4)!important;
  max-height: calc(var(--ms-base-fs) * 13)!important;
}

/* Wrapper boutons et erreurs */
.multiselect-container .button-wrapper { 
  display:flex; 
  flex-direction:column; 
  align-items:flex-start; 
}

.multiselect-container .minselect-error {
  color: #ff4444!important;
  font-size: var(--ms-small-fs)!important;
  margin-top:calc(var(--ms-gap) * 0.4)!important;
  visibility:hidden;
  white-space:nowrap!important;
}

/* Container des boutons harmonieux et responsive */
.multiselect-container .buttons-container {
  display: flex!important;
  flex-wrap: wrap!important;
  justify-content: center!important;
  align-items: stretch!important;
  gap: calc(var(--ms-gap) * 1)!important;
  padding: calc(var(--ms-gap) * 1.5)!important;
  width: 100%!important;
}

/* BOUTONS HARMONIEUX - Taille uniforme et flexible */
.multiselect-container .submit-btn {
  position: relative!important;
  background: var(--ms-global-btn-color)!important;
  color: #fff!important;
  padding: calc(var(--ms-gap) * 1.2) calc(var(--ms-gap) * 2)!important; 
  border-radius: 8px!important;
  font-weight: 700!important; 
  letter-spacing: 0.5px!important;
  font-size: var(--ms-btn-font-size)!important;
  line-height: 1.2!important;
  cursor: pointer!important;
  border: none!important;
  overflow: hidden!important;
  transition: all 0.3s ease!important;
  box-shadow: 0 4px 12px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b),0.3),
              inset 0 3px 0 rgba(255,255,255,0.2),
              inset 0 -3px 0 rgba(0,0,0,0.2)!important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.2)!important;
  text-align: center!important;
  display: flex!important;
  align-items: center!important;
  justify-content: center!important;
  
  /* CLÉS POUR L'HARMONIE */
  flex: 1 1 auto!important; /* Flex pour prendre l'espace disponible */
  min-width: calc(var(--ms-base-fs) * 13)!important; /* Largeur minimale proportionnelle */
  max-width: calc(var(--ms-base-fs) * 26)!important; /* Largeur maximale proportionnelle */
  height: calc(var(--ms-base-fs) * 4)!important; /* Hauteur proportionnelle */
  
  word-wrap: break-word!important;
  hyphens: auto!important;
  white-space: normal!important; /* Permet le retour à la ligne */
}

/* Responsive : Sur mobile, boutons pleine largeur */
@media (max-width: 768px) {
  .multiselect-container .buttons-container {
    flex-direction: column!important;
    gap: calc(var(--ms-gap) * 0.8)!important;
  }
  
  .multiselect-container .submit-btn {
    flex: 1 1 100%!important;
    max-width: none!important;
    min-width: auto!important;
  }
}

/* Pour 2 boutons : côte à côte harmonieux */
.multiselect-container .buttons-container:has(.button-wrapper:nth-child(2):last-child) .submit-btn {
  flex: 1 1 calc(50% - var(--ms-gap) / 2)!important;
}

/* Pour 3+ boutons : adaptation intelligente */
@media (min-width: 769px) {
  .multiselect-container .buttons-container:has(.button-wrapper:nth-child(n+3)) .submit-btn {
    flex: 1 1 calc(33.333% - var(--ms-gap) * 0.67)!important;
    min-width: calc(var(--ms-base-fs) * 16)!important;
  }
}

/* Effet hover conservé et amélioré */
.multiselect-container .submit-btn:hover {
  transform: translateY(-2px)!important;
  box-shadow: 0 6px 20px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b),0.4),
              inset 0 3px 0 rgba(255,255,255,0.3),
              inset 0 -3px 0 rgba(0,0,0,0.3)!important;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 0 6px rgba(0,0,0,0.3)!important;
}

/* Effet active (clic) conservé */
.multiselect-container .submit-btn:active {
  transform: translateY(1px)!important;
  box-shadow: 0 2px 6px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b),0.3),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.1)!important;
}

/* Effet de scan sci-fi conservé */
.multiselect-container .submit-btn::before {
  content: ''!important;
  position: absolute!important;
  top: -2px!important;
  left: -2px!important;
  width: calc(100% + 4px)!important;
  height: calc(100% + 4px)!important;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)!important;
  transform: translateX(-100%) rotate(45deg)!important;
  transition: transform 0.8s ease!important;
}

.multiselect-container .submit-btn:hover::before {
  transform: translateX(100%) rotate(45deg)!important;
}

/* Animation shake améliorée - conservée */
@keyframes shake-enhanced {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-6px); }
  30%, 60%, 90% { transform: translateX(6px); }
}

.multiselect-container .submit-btn.shake {
  animation: shake-enhanced 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)!important;
  box-shadow: 0 0 0 4px rgba(255,68,68,0.5)!important;
}

/* Effet de glow pour les erreurs - conservé */
.multiselect-container .submit-btn.shake {
  background: #ff4433!important;
  box-shadow: 0 0 10px #ff4433,
              0 0 20px rgba(255,68,68,0.5),
              inset 0 3px 0 rgba(255,255,255,0.2),
              inset 0 -3px 0 rgba(0,0,0,0.2)!important;
}

/* Effet de pulse conservé */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b),0.7); }
  70% { box-shadow: 0 0 0 10px rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b),0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--ms-global-btn-r),var(--ms-global-btn-g),var(--ms-global-btn-b),0); }
}

.multiselect-container .submit-btn:focus {
  animation: pulse 1.5s infinite!important;
}

/* Style pour boutons avec couleurs personnalisées - conservé */
.multiselect-container .submit-btn[style*="background-color"] {
  box-shadow: 0 4px 12px rgba(var(--btn-r),var(--btn-g),var(--btn-b),0.3),
              inset 0 3px 0 rgba(255,255,255,0.2),
              inset 0 -3px 0 rgba(0,0,0,0.2)!important;
}

/* État désactivé */
.multiselect-container.disabled-container {
  opacity:.5!important; 
  pointer-events:none!important;
}

/* Style pour container de groupe */
.multiselect-container .children-options {
  padding-left: calc(var(--ms-gap) * 1)!important;
  margin-top: calc(var(--ms-gap) * 0.5)!important;
  border-left: 1px dashed rgba(255,255,255,0.3)!important;
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
        
        // mise à jour du bouton global-all
        if (useGlobalAll) {
          const globalAllBtn = container.querySelector('.global-all-button');
          if (globalAllBtn) {
            const allCheckboxes = Array.from(
              container.querySelectorAll('input[type="checkbox"]:not([data-action="all"])')
            );
            const allChecked = allCheckboxes.length > 0 && allCheckboxes.every(i => i.checked);
            
            if (allChecked) {
              globalAllBtn.classList.add('active');
              globalAllBtn.innerHTML = '<span class="icon">☑</span> ' + globalAllDeselectText;
            } else {
              globalAllBtn.classList.remove('active');
              globalAllBtn.innerHTML = '<span class="icon">☐</span> ' + globalAllSelectText;
            }
          }
        }
      };

      /* 6. createOptionElement */
      const createOptionElement = (opt, sectionIdx, parentBlock = null) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const blk = document.createElement('div');
          blk.classList.add('non-selectable-block');
          blk.setAttribute('data-block-id', `block-${uniqueInstanceId}-${sectionIdx}-${Math.random().toString(36).substring(2, 9)}`);
          blk.innerHTML = opt.name;
          const wrap = document.createElement('div');
          wrap.classList.add('children-options');
          opt.children.forEach(ch => {
            wrap.append(createOptionElement(ch, sectionIdx, blk.getAttribute('data-block-id')));
          });
          blk.append(wrap);
          return blk;
        }
        const wrap = document.createElement('div');
        wrap.classList.add('option-container');
        
        // Ajouter la classe all-option pour les options "all"
        if (opt.action === 'all') {
          wrap.classList.add('all-option');
        }
        
        if (opt.grey) wrap.classList.add('greyed-out-option');

        const inp = document.createElement('input');
        inp.type = multiselect ? 'checkbox' : 'radio';
        inp.dataset.action = opt.action || '';
        inp.dataset.sectionIdx = sectionIdx;
        
        inp.id = `ms-${uniqueInstanceId}-${sectionIdx}-${Math.random().toString(36).substring(2, 9)}`;
        inp.name = multiselect ? `ms-group-${uniqueInstanceId}-${sectionIdx}` : `ms-group-${uniqueInstanceId}`;
        
        if (parentBlock) {
          inp.dataset.parentBlock = parentBlock;
        }
        
        if (opt.grey) inp.disabled = true;

        const lbl = document.createElement('label');
        lbl.setAttribute('for', inp.id);
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
            enableChat();
            container.classList.add('disabled-container');
            
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                selection: opt.name,
                buttonPath: opt.action || 'Default',
                instanceId: uniqueInstanceId
              }
            });
            
            setTimeout(() => {
              enableChat();
            }, 300);
          }
        });

        return wrap;
      };

      /* 7. build sections */
      grid = document.createElement('div');
      grid.classList.add('sections-grid');
      grid.id = `grid-${uniqueInstanceId}`;
      
      if (gridColumns >= 2) {
        grid.style.setProperty('--grid-cols', gridColumns);
      }
      
      sections.forEach((sec, i) => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');
        sc.id = `section-${uniqueInstanceId}-${i}`;
        
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        
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
        ol.id = `options-list-${uniqueInstanceId}-${i}`;
        
        if ((sec.options || []).length > 10) ol.classList.add('grid-2cols');

        sec.options.forEach((opt, optIdx) => {
          if (opt.action === 'user_input') {
            // ✅ CHAMP LIBRE AMÉLIORÉ
            const uiWrap = document.createElement('div');
            uiWrap.classList.add('user-input-container');
            uiWrap.id = `ui-container-${uniqueInstanceId}-${i}-${optIdx}`;
            
            const uiLbl = document.createElement('label');
            uiLbl.classList.add('user-input-label');
            uiLbl.textContent = opt.label;
            
            // ✅ UTILISER TEXTAREA AU LIEU D'INPUT POUR PLUS D'ESPACE
            const uiInp = document.createElement('textarea');
            uiInp.classList.add('user-input-field');
            uiInp.id = `ui-input-${uniqueInstanceId}-${i}-${optIdx}`;
            uiInp.placeholder = opt.placeholder || '';
            uiInp.rows = 3; // ✅ Nombre de lignes par défaut
            
            // ✅ AUTO-RESIZE DU TEXTAREA
            uiInp.addEventListener('input', function() {
              this.style.height = 'auto';
              this.style.height = Math.min(this.scrollHeight, 200) + 'px';
            });
            
            uiInp.addEventListener('keydown', e => {
              if (e.key === 'Enter' && e.ctrlKey && e.target.value.trim()) {
                // ✅ Ctrl+Enter pour soumettre
                enableChat();
                container.classList.add('disabled-container');
                
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: {
                    isUserInput: true,
                    userInput: e.target.value.trim(),
                    buttonPath: 'Default',
                    instanceId: uniqueInstanceId
                  }
                });
                
                setTimeout(() => {
                  enableChat();
                }, 300);
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
      
      /* Option global-all */
      if (useGlobalAll && multiselect) {
        const globalAllContainer = document.createElement('div');
        globalAllContainer.classList.add('global-all-container');
        globalAllContainer.id = `global-all-container-${uniqueInstanceId}`;
        
        const globalAllBtn = document.createElement('button');
        globalAllBtn.classList.add('global-all-button');
        globalAllBtn.id = `global-all-btn-${uniqueInstanceId}`;
        globalAllBtn.innerHTML = '<span class="icon">☐</span> ' + globalAllSelectText;
        
        globalAllBtn.addEventListener('click', () => {
          const allCheckboxes = Array.from(
            container.querySelectorAll('input[type="checkbox"]:not([data-action="all"])')
          ).filter(cb => !cb.disabled);
          
          const allChecked = allCheckboxes.length > 0 && allCheckboxes.every(cb => cb.checked);
          
          allCheckboxes.forEach(cb => {
            cb.checked = !allChecked;
            cb.parentElement.classList.toggle('selected', !allChecked);
          });
          
          updateTotalChecked();
        });
        
        globalAllContainer.appendChild(globalAllBtn);
        container.appendChild(globalAllContainer);
      }

      /* 8. buttons */
      if (buttons.length) {
        const bc = document.createElement('div');
        bc.classList.add('buttons-container');
        bc.id = `buttons-container-${uniqueInstanceId}`;

        buttons.forEach((cfg, btnIdx) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('button-wrapper');
          wrapper.id = `button-wrapper-${uniqueInstanceId}-${btnIdx}`;

          const btn = document.createElement('button');
          btn.classList.add('submit-btn');
          btn.id = `submit-btn-${uniqueInstanceId}-${btnIdx}`;
          
          if (cfg.color) {
            btn.style.setProperty('background-color', cfg.color, 'important');
            btn.style.setProperty('border-color',     cfg.color, 'important');
            const rgb = parseInt(cfg.color.replace('#',''), 16);
            const r = (rgb >> 16) & 255;
            const g = (rgb >> 8) & 255;
            const b = rgb & 255;
            btn.style.setProperty('--btn-r', r);
            btn.style.setProperty('--btn-g', g);
            btn.style.setProperty('--btn-b', b);
          }
          
          // ✅ NOUVEAU: Utiliser global_select_button_text si défini et que c'est le bouton principal
          let buttonText = cfg.text;
          if (global_select_button_text && (cfg.path === 'Default' || cfg.path === undefined)) {
            buttonText = global_select_button_text;
          }
          btn.textContent = buttonText;

          const err = document.createElement('div');
          err.className = 'minselect-error';
          err.id = `error-${uniqueInstanceId}-${btnIdx}`;

          btn.addEventListener('click', () => {
            const min = cfg.minSelect || 0;

            // ✅ CORRECTION : Compter les checkboxes cochées ET les champs de saisie remplis
            const checked = Array.from(
              container.querySelectorAll('input[type="checkbox"]:checked')
            ).filter(i => i.dataset.action !== 'all').length;

            // ✅ NOUVEAU: Vérifier aussi les champs de saisie utilisateur
            const userInputs = Array.from(
              container.querySelectorAll('.user-input-field')
            ).filter(field => field.value && field.value.trim() !== '').length;

            // ✅ MODIFIÉ: La validation prend en compte les deux types de sélection
            const totalSelections = checked + userInputs;

            if (min > 0 && totalSelections < min) {
              btn.classList.add('shake');
              setTimeout(() => btn.classList.remove('shake'), 400);
              
              // ✅ AMÉLIORÉ: Message d'erreur plus explicite
              if (userInputs > 0) {
                err.textContent = `Votre saisie personnalisée compte comme une sélection.`;
              } else {
                err.textContent = `Vous devez sélectionner au moins ${min} option${min>1?'s':''} ou saisir du texte.`;
              }
              err.style.visibility = 'visible';
              return;
            }

            err.style.visibility = 'hidden';
            enableChat();
            container.classList.add('disabled-container');

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
                buttonText:  buttonText, // ✅ Utiliser le texte personnalisé s'il existe
                buttonPath:  cfg.path || 'Default',
                isEmpty:     res.every(r => !r.selections.length && !r.userInput),
                instanceId:  uniqueInstanceId
              }
            });
            
            setTimeout(() => {
              enableChat();
            }, 300);
          });

          wrapper.append(btn, err);
          bc.append(wrapper);
        });

        container.append(bc);
      }

      /* 9. injecter dans le DOM */
      element.append(container);
      
      // Observer pour maintenir le chat actif
      const chatStateObserver = new MutationObserver((mutations) => {
        if (!container.classList.contains('disabled-container') && !chatEnabled) {
          setTimeout(() => {
            enableChat();
          }, 100);
        }
      });
      
      const chatInputContainer = host.querySelector('.vfrc-input-container');
      if (chatInputContainer) {
        chatStateObserver.observe(chatInputContainer, { 
          attributes: true, 
          subtree: true,
          childList: true
        });
      }
      
      if (useGlobalAll && multiselect) {
        updateTotalChecked();
      }
      
      return () => {
        chatStateObserver.disconnect();
      };
      
      console.log(`✅ MultiSelect prêt (ID: ${uniqueInstanceId}) avec ${gridColumns} colonnes${global_select_button_text ? ` et texte personnalisé: "${global_select_button_text}"` : ''}${globalAllSelectText !== "Tout sélectionner" ? ` et bouton global-all: "${globalAllSelectText}"/"${globalAllDeselectText}"` : ''}`);
    } catch (err) {
      console.error('❌ MultiSelect Error :', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};

export default MultiSelect;
