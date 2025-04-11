export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },
  render: ({ trace, element }) => {
    try {
      console.log("Démarrage du rendu MultiSelect (mise en page harmonisée)");

      // Récupérer les données depuis le payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        textColor = '#FFFFFF',
        backgroundOpacity = 0.8,
        index = 1,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload;

      let totalChecked = 0;
      let userInputValues = {};

      // Créer un container principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      // Calculer le nombre total d’options (peu importe le niveau)
      const countOptionsRecursive = (options) => {
        return options.reduce((acc, opt) => {
          let sousTotal = (opt.children && Array.isArray(opt.children)) ? countOptionsRecursive(opt.children) : 0;
          return acc + 1 + sousTotal;
        }, 0);
      };
      let totalOptions = 0;
      sections.forEach((section) => {
        if (Array.isArray(section.options)) {
          totalOptions += countOptionsRecursive(section.options);
        }
      });

      // Injection des styles CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* Conteneur principal */
        .multiselect-container {
          width: 100%;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          max-width: 100%;
          margin: 0 auto;
          font-size: 0.9em;
        }
        .multiselect-container * {
          box-sizing: border-box;
        }
        
        /* Disposition des sections en "cartes" sur 2 colonnes */
        .multiselect-container .sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
          justify-content: center;
        }
        /* Chaque section occupe environ 50% de la largeur, avec un min-width */
        .multiselect-container .section-container {
          flex: 0 1 calc(50% - 16px);
          min-width: 300px;
          background-color: #673AB7;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          padding: 10px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* Mise en évidence du titre de section (niveau 1) */
        .multiselect-container .section-title h2 {
          border: 2px solid #fff;
          padding: 6px 8px;
          border-radius: 4px;
          text-align: center;
          margin: 0;
          color: #fff;
          background-color: transparent;
        }

        /* On conserve une disposition simple pour la liste d'options */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          flex-grow: 1;
        }

        /* Conteneurs d'options */
        .multiselect-container .option-container {
          margin: 0;
          width: 100%;
        }
        
        /* Options sélectionnables (dernier niveau) : case et texte alignés sur la même ligne */
        .multiselect-container .option-container.selectable {
          display: flex;
          align-items: center;
        }
        .multiselect-container .option-container.selectable input {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          cursor: pointer;
          accent-color: ${buttonColor};
        }
        .multiselect-container .option-container.selectable label {
          display: inline-flex;
          align-items: center;
          margin-left: 6px;
          cursor: pointer;
          font-size: 0.85em;
          border-radius: 4px;
          padding: 4px 6px;
          color: white;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          /* Affichage sur une seule ligne */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 31px;
          font-weight: 500;
          line-height: 1.3;
          max-width: 100%;
        }
        .multiselect-container .option-container.selectable label:hover {
          background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
          transform: translateY(-1px);
        }
        .multiselect-container input:checked + label {
          background-color: ${buttonColor};
          border-color: white;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .multiselect-container input:disabled + label {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Marges pour les niveaux imbriqués */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 10px;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 20px;
        }

        /* Options non-sélectionnables (niveaux intermédiaires) */
        .multiselect-container .option-container.non-selectable {
          display: block;
        }
        .multiselect-container .option-container.non-selectable span {
          cursor: default;
          color: #fff;
          background-color: rgba(0, 0, 0, 0.3);
          padding: 6px 8px;
          font-size: 0.85em;
          font-weight: bold;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          user-select: none;
          display: inline-block;
          min-height: 31px;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
          margin-bottom: 6px;
        }
        
        .multiselect-container .children-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Boutons */
        .multiselect-container .buttons-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
          flex-wrap: wrap;
        }
        .multiselect-container .submit-btn {
          background: ${buttonColor};
          color: white;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          border: none;
          font-weight: 600;
          font-size: 0.9em;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          text-align: center;
          min-width: 130px;
        }
        .multiselect-container .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
        }
        .multiselect-container .submit-btn:active {
          transform: translateY(0);
        }
        
        /* Champs user_input */
        .multiselect-container .user-input-container {
          margin-top: 10px;
          margin-bottom: 8px;
          width: 100%;
        }
        .multiselect-container .user-input-label {
          display: block;
          margin-bottom: 6px;
          color: white;
          font-weight: 500;
          font-size: 0.85em;
          line-height: 1.3;
        }
        .multiselect-container .user-input-field {
          width: 100%;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 0.85em;
          transition: all 0.2s ease;
          background-color: rgba(255, 255, 255, 0.9);
        }
        .multiselect-container .user-input-field:focus {
          border-color: ${buttonColor};
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
      `;
      container.appendChild(styleElement);

      // Fonction récursive pour créer les éléments d'option
      // Seule une option sans children (dernier niveau) est sélectionnable.
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = option.children && Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren; // dernier niveau => cliquable

        if (isSelectable) {
          optionDiv.classList.add('selectable');

          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          // On retire les balises HTML pour créer un id propre
          const sanitizedOptionName = option.name.replace(/<[^>]*>/g, '').replace(/\s+/g, '-');
          input.id = `${sectionLabel}-${sanitizedOptionName}-l${level}`;
          input.name = `option-${sectionLabel}`;

          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          // Interprétation du HTML (pour <strong> par exemple)
          label.innerHTML = option.name;

          // Gestion du changement
          input.addEventListener('change', () => {
            updateTotalChecked();
            if (!multiselect) {
              console.log("Envoi de sélection simple:", option.name);
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  selection: option.name,
                  buttonPath: 'Default'
                }
              });
            }
          });

          optionDiv.appendChild(input);
          optionDiv.appendChild(label);
        } else {
          // Option non-sélectionnable (ayant des children)
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name;
          optionDiv.appendChild(span);
        }

        // Traitement récursif pour les enfants
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.classList.add('children-options');
          option.children.forEach(child => {
            const childElement = createOptionElement(child, level + 1, sectionLabel);
            childrenContainer.appendChild(childElement);
          });
          optionDiv.appendChild(childrenContainer);
        }
        return optionDiv;
      };

      // Création des sections
      const sectionsGrid = document.createElement('div
