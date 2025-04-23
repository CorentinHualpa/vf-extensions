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
        totalMaxSelect = 0,
        multiselect = true,
      } = trace.payload;

      // Pour stocker la saisie libre
      const userInputValues = {};

      // utilitaire pour nettoyer un HTML échappé
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      // ─── 2) Création du container et injection du <style> ────────
      const container = document.createElement('div');
      container.classList.add('multiselect-container');
      if (sections.length === 1) container.classList.add('one-section');

      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* ────────────────────────────────────────────────────────── */
/* VARIABLES GLOBALES (TAILLES DE TEXTE, COULEURS, ESPACES) */
/* ────────────────────────────────────────────────────────── */
.multiselect-container {
  /* ► COULEUR PRINCIPALE (surcharge possible) */
  --ms-accent:       #4CAF50;

  /* ► OPACITÉ FOND DES OPTIONS (valeur entre 0 et 1) */
  --ms-bg-opacity:   0.8;

  /* ► TAILLE DE POLICE POUR LES TITRES DE SECTION */
  --ms-heading-fs:   16px;

  /* ► TAILLE DE POLICE POUR LES LABELS SECONDAIRES ET CHAMPS */
  --ms-small-fs:     15px;

 /* ► TAILLE DE POLICE PAR DÉFAUT (texte général) */
  --ms-base-fs:      14px;

  /* ► ESPACEMENT GÉNÉRAL ENTRE ÉLÉMENTS */
  --ms-gap:          8px;

  /* ► RAYON DES BORDS ARRONDIS */
  --ms-radius:       6px;

  /* ► OMBRE PORTÉE DISCRÈTE */
  --ms-shadow:       0 2px 6px rgba(0,0,0,0.15);
}

/* ────────────────────────────────────────────────────────── */
/* 1. RESET BOX-SIZING                                      */
/* ────────────────────────────────────────────────────────── */
.multiselect-container,
.multiselect-container * {
  box-sizing: border-box !important;
}

/* ────────────────────────────────────────────────────────── */
/* 2. CONTENEUR PRINCIPAL                                   */
/*    ► hérite de --ms-base-fs pour la taille du texte      */
/* ────────────────────────────────────────────────────────── */
.multiselect-container {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif !important;
  font-size: var(--ms-base-fs) !important; /* Texte général */
  color: #fff !important;
}

/* ────────────────────────────────────────────────────────── */
/* 3. GRILLE DES SECTIONS (2 COLONNES)                      */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .sections-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: var(--ms-gap) !important;
}
.multiselect-container.one-section .sections-grid {
  grid-template-columns: 1fr !important;
}

/* ────────────────────────────────────────────────────────── */
/* 4. CHAQUE SECTION                                        */
/*    ► boîte avec ombre & transition hover                 */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .section-container {
  background: inherit; /* injecté inline via JS */
  border-radius: var(--ms-radius) !important;
  overflow: hidden !important;
  box-shadow: var(--ms-shadow) !important;
  transition: transform .2s ease !important;
}
.multiselect-container .section-container:hover {
  transform: translateY(-2px) !important;
}

/* ────────────────────────────────────────────────────────── */
/* 5. TITRE DE SECTION                                      */
/*    ► taille et poids pour se distinguer                  */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .section-title {
  padding: var(--ms-gap) !important;
  font-weight: 700 !important;
  font-size: var(--ms-heading-fs) !important; /* Texte des titres */
  border-bottom: 2px solid rgba(255,255,255,0.3) !important;
  margin-bottom: var(--ms-gap) !important;
}

/* ────────────────────────────────────────────────────────── */
/* 6. LISTE D’OPTIONS                                       */
/*    ► structure en grid, petits gaps                      */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .options-list {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: calc(var(--ms-gap) / 2) !important;
  padding: calc(var(--ms-gap) / 2) !important;
}
.multiselect-container .options-list.grid-2cols {
  grid-template-columns: 1fr 1fr !important;
}

/* ────────────────────────────────────────────────────────── */
/* 7. BLOC NON-CLIQUABLE (LABEL ENFANT)                     */
/*    ► texte légèrement plus petit                          */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .non-selectable-block {
  background-color: rgba(0,0,0,0.25) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  border-radius: calc(var(--ms-radius) - 2px) !important;
  padding: 4px 8px !important;
  font-size: var(--ms-small-fs) !important; /* Texte secondaire */
}

/* ────────────────────────────────────────────────────────── */
/* 8. OPTION CLIQUABLE                                       */
/*    ► flex container + background injecté                   */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .option-container {
  display: flex !important;
  align-items: flex-start !important; /* aligne checkbox en haut */
  gap: calc(var(--ms-gap) / 2) !important;
}
.multiselect-container .option-container label {
  display: flex !important;
  align-items: center !important;
  gap: calc(var(--ms-gap) / 2) !important;
  width: 100% !important;
  padding: calc(var(--ms-gap) / 2) !important;
  background-color: var(
    --section-bg,
    rgba(0,0,0,var(--ms-bg-opacity))
  ) !important; /* fond léger de section */
  border-radius: var(--ms-radius) !important;
  cursor: pointer !important;
  transition: background-color .2s ease, box-shadow .2s ease !important;
}
.multiselect-container .option-container label:hover {
  background-color: rgba(0,0,0,calc(var(--ms-bg-opacity) + 0.1)) !important;
  box-shadow: var(--ms-shadow) !important;
}
.multiselect-container .option-container.greyed-out-option label {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* ────────────────────────────────────────────────────────── */
/* 9. CHECKBOX & RADIO                                       */
/*    ► dimension fixe, cercle parfait, feedback hover/click  */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .option-container input[type="checkbox"],
.multiselect-container .option-container input[type="radio"] {
  all: unset !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  box-sizing: border-box !important;

  width: 16px !important;                  /* largeur checkbox */
  height: 16px !important;                 /* hauteur checkbox */
  aspect-ratio: 1/1 !important;            /* cercle parfait */
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  border: 2px solid var(--ms-accent) !important;
  border-radius: 50% !important;           /* cercle */
  background-color: #fff !important;
  transition: transform .1s ease !important;
}
.multiselect-container .option-container input:hover {
  transform: scale(1.1) !important;        /* zoom léger */
}
.multiselect-container .option-container input:checked::after {
  content: '' !important;
  display: block !important;
  width: 8px !important;                   /* pastille interne */
  height: 8px !important;
  border-radius: 50% !important;
  background-color: var(--ms-accent) !important;
  margin: auto !important;
}

/* ────────────────────────────────────────────────────────── */
/* 10. CHAMP LIBRE (USER INPUT)                              */
/*     ► label + field à petit texte                         */
/* ────────────────────────────────────────────────────────── */
.multiselect-container .user-input-container {
  grid-column: 1 / -1 !important;
  margin-top: var(--ms-gap) !important;
  margin-bottom: 4px !important;
}
.multiselect-container .user-input-label {
  font-size: var(--ms-small-fs) !important; /* label input */
  margin-bottom: 4px !important;
}
.multiselect-container .user-input-field {
  width: 100% !important;
  padding: 6px !important;
  border-radius: var(--ms-radius) !important;
  border: 1px solid rgba(255,255,255,0.3) !important;
  font-size: var(--ms-small-fs) !important; /* texte input */
  transition: box-shadow .2s ease !important;
}
.multiselect-container .user-input-field:focus {
  box-shadow: 0 0 0 2px rgba(255,255,255,0.4) !important;
  border-color: var(--ms-accent) !important;
}

/* ────────────────────────────────────────────────────────── */
/* 11. BOUTONS MULTI-SELECT                                  */
/*     ► texte hérité de --ms-base-fs, effet hover           */
/* ────────────────────────────────────────────────────────── */
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
  background-color: rgba(0,0,0,0.1) !important;
  transform: translateY(-1px) !important;
}

/* ────────────────────────────────────────────────────────── */
/* 12. LOCK UI (DÉSACTIVATION)                               */
/* ────────────────────────────────────────────────────────── */
.multiselect-container.disabled-container {
  opacity: 0.5 !important;
  pointer-events: none !important;
}
`;
      container.appendChild(styleEl);

      // ─── 3) Gestion de la couleur de chaque section ─────────────
      sections.forEach(sec => {
        const sc = document.createElement('div');
        sc.classList.add('section-container');

        // récupère backgroundColor ou color
        const bg = sec.backgroundColor || sec.color || '#673AB7';
        sc.style.backgroundColor = bg;
        // injecte dans la var CSS pour les labels
        sc.style.setProperty('--section-bg', bg.replace(
          /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/,
          (_,$1,$2,$3) => {
            const [r,g,b] = [ $1,$2,$3 ].map(h => parseInt(h,16));
            return `rgba(${r},${g},${b},0.15)`;
          }
        ));

        // titre
        if (sec.label && stripHTML(sec.label).trim()) {
          const h2 = document.createElement('div');
          h2.classList.add('section-title');
          h2.innerHTML = sec.label;
          sc.appendChild(h2);
        }

        // options
        const ol = document.createElement('div');
        ol.classList.add('options-list');
        if ((sec.options||[]).length > 10) ol.classList.add('grid-2cols');
        sec.options.forEach(opt => {
          if (opt.action === 'user_input') {
            // … champ libre (inchangé) …
          } else {
            sc.appendChild(createOptionElement(opt));
          }
        });

        container.querySelector('.sections-grid')?.appendChild(sc);
      });

      // … le reste de votre logique (updateTotalChecked, createOptionElement,
      // montage des boutons, interaction, etc.) reste identique …
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
