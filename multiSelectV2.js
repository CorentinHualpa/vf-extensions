/**
 * MultiSelect - Extension Voiceflow
 * Permet la sélection multiple (ou simple) de contenus organisés par sections (niveau 1),
 * sous-catégories (niveau 2) et options (dernier niveau).
 *
 * Seules les options de dernier niveau (pas de children) sont cliquables.
 * Les sections (niveau 1) sont affichées en deux colonnes, chaque section dans une "carte".
 * Les sous-catégories (niveau 2) sont affichées en texte non cliquable.
 * Les options de dernier niveau (niveau 3) sont affichées avec une case à cocher (ou radio).
 *
 * Le code gère :
 *   - L'interprétation du HTML dans "label" et "name"
 *   - Le retour à la ligne pour les textes trop longs
 *   - L'affichage d'un bouton (ou plusieurs) pour valider la sélection
 *   - Le passage de la sélection via window.voiceflow.chat.interact
 *
 * Compatible Voiceflow - 2023
 */

export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => {
    return trace.payload && trace.type === 'multi_select';
  },

  render: ({ trace, element }) => {
    try {
      console.log('Démarrage du rendu MultiSelect (final)');

      /**
       * Récupération des données depuis le payload
       */
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

      // Conteneur principal
      const container = document.createElement('div');
      container.classList.add('multiselect-container');

      /**
       * Calcul du nombre total d’options
       * (juste pour logs ou vérifs - pas impératif)
       */
      const countOptionsRecursive = (options) => {
        return options.reduce((acc, opt) => {
          const subCount = (opt.children && Array.isArray(opt.children))
            ? countOptionsRecursive(opt.children)
            : 0;
          return acc + 1 + subCount;
        }, 0);
      };
      let totalOptions = 0;
      sections.forEach((section) => {
        if (Array.isArray(section.options)) {
          totalOptions += countOptionsRecursive(section.options);
        }
      });

      /**
       * Ajout des styles CSS
       */
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .multiselect-container {
          width: 100%;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          margin: 0 auto;
          max-width: 100%;
          font-size: 0.9em;
        }
        .multiselect-container * {
          box-sizing: border-box;
        }

        /* Disposition en cartes pour les sections (2 colonnes) */
        .multiselect-container .sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          width: 100%;
        }
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
          overflow: hidden;
        }
        @media (max-width: 800px) {
          .multiselect-container .section-container {
            flex: 1 1 100%;
            min-width: auto;
          }
        }

        /* Titre de section (niveau 1) */
        .multiselect-container .section-title {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .multiselect-container .section-title h2 {
          border: 2px solid #fff;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 0;
          color: #fff;
        }

        /* Disposition unique (liste) pour les options (niveaux 2 et 3) */
        .multiselect-container .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        /* Sous-titres (niveau 2) non cliquables */
        .multiselect-container .option-container.non-selectable {
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 6px 10px;
          margin: 0 6px;
        }
        .multiselect-container .option-container.non-selectable span {
          color: #fff;
          font-size: 0.95em;
          font-weight: bold;
          white-space: normal;
          word-break: break-word;
          line-height: 1.3;
          display: block;
        }

        /* Options de dernier niveau (sélectionnables) */
        .multiselect-container .option-container.selectable {
          display: flex;
          align-items: flex-start;
          margin: 0 12px;
        }
        .multiselect-container .option-container.selectable input {
          height: 16px;
          width: 16px;
          border-radius: 3px;
          cursor: pointer;
          accent-color: ${buttonColor};
          margin-top: 4px;
        }
        .multiselect-container .option-container.selectable label {
          display: inline-flex;
          align-items: flex-start;
          margin-left: 8px;
          cursor: pointer;
          font-size: 0.85em;
          border-radius: 4px;
          padding: 4px 6px;
          color: white;
          background-color: rgba(0, 0, 0, ${backgroundOpacity});
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
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

        /* Imbrication de niveaux : marges supplémentaires */
        .multiselect-container .option-container.option-level-2 {
          margin-left: 0 !important;
        }
        .multiselect-container .option-container.option-level-3 {
          margin-left: 24px !important;
        }

        .multiselect-container .children-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
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
          color: #fff;
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

        /* user_input */
        .multiselect-container .user-input-container {
          margin-top: 10px;
          margin-bottom: 8px;
          width: 100%;
        }
        .multiselect-container .user-input-label {
          display: block;
          margin-bottom: 6px;
          color: #fff;
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

      /**
       * Fonction récursive pour créer les éléments d'option
       * Seule une option sans children est sélectionnable.
       */
      const createOptionElement = (option, level, sectionLabel) => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-container', `option-level-${level}`);

        const hasChildren = Array.isArray(option.children) && option.children.length > 0;
        const isSelectable = !hasChildren; // Dernier niveau => cliquable

        if (isSelectable) {
          // Option cliquable
          optionDiv.classList.add('selectable');

          const input = document.createElement('input');
          input.type = multiselect ? 'checkbox' : 'radio';
          // Nettoyage du label pour fabriquer un id
          const sanitized = sectionLabel.replace(/<[^>]+>/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();

          // Id unique
          input.id = `${sanitized}-${Math.random().toString(36).slice(2)}`;

          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          // On interprète le HTML de l'option (ex. <strong>…</strong>)
          label.innerHTML = option.name;

          input.addEventListener('change', () => {
            updateTotalChecked();
            // Si single select => envoi immédiat
            if (!multiselect) {
              console.log('Envoi sélection simple:', option.name);
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  selection: option.name,
                  buttonPath: 'Default',
                },
              });
            }
          });

          optionDiv.appendChild(input);
          optionDiv.appendChild(label);
        } else {
          // Sous-titre (niveau 2)
          optionDiv.classList.add('non-selectable');
          const span = document.createElement('span');
          span.innerHTML = option.name;
          optionDiv.appendChild(span);
        }

        // Ajout des enfants récursivement
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.classList.add('children-options');

          option.children.forEach((child) => {
            const childElement = createOptionElement(child, level + 1, sectionLabel);
            childrenContainer.appendChild(childElement);
          });

          optionDiv.appendChild(childrenContainer);
        }
        return optionDiv;
      };

      /**
       * Fonction de mise à jour du nombre total de cases cochées
       */
      const updateTotalChecked = () => {
        const allCheckboxes = container.querySelectorAll('input[type="checkbox"]');
        totalChecked = Array.from(allCheckboxes).filter(cb => cb.checked).length;

        // Désactiver les cases en trop si on atteint la limite
        if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
          allCheckboxes.forEach((checkbox) => {
            if (!checkbox.checked) {
              checkbox.disabled = true;
            }
          });
        } else {
          allCheckboxes.forEach((checkbox) => {
            checkbox.disabled = false;
          });
        }
      };

      /**
       * Création des sections dans .sections-grid
       */
      const sectionsGrid = document.createElement('div');
      sectionsGrid.classList.add('sections-grid');

      sections.forEach((section) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('section-container');

        // Couleur de fond custom si précisé
        if (section.color) {
          sectionDiv.style.backgroundColor = section.color;
        }

        // Ajout du titre de la section (HTML interprété)
        const sectionTitle = document.createElement('div');
        sectionTitle.classList.add('section-title');
        sectionTitle.innerHTML = section.label; // ex. <h2>…</h2>
        sectionDiv.appendChild(sectionTitle);

        // Conteneur d'options
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-list');

        if (Array.isArray(section.options)) {
          // Filtrer les options userInput
          const normalOptions = section.options.filter(opt => opt.action !== 'user_input');

          // Générer chaque option
          normalOptions.forEach((opt) => {
            // Nettoyage du label pour identifiant
            const sanitizedSectionLabel = section.label.replace(/<[^>]+>/g, '')
              .replace(/\s+/g, ' ')
              .trim();

            const optionElement = createOptionElement(opt, 1, sanitizedSectionLabel);
            optionsContainer.appendChild(optionElement);
          });

          // user_input
          const userInputOptions = section.options.filter(opt => opt.action === 'user_input');
          userInputOptions.forEach((opt) => {
            const userInputDiv = document.createElement('div');
            userInputDiv.classList.add('user-input-container');

            const userInputLabel = document.createElement('label');
            userInputLabel.classList.add('user-input-label');
            userInputLabel.textContent = opt.label || 'Compléter si besoin';

            const userInputField = document.createElement('input');
            userInputField.type = 'text';
            userInputField.classList.add('user-input-field');
            userInputField.placeholder = opt.placeholder || 'Saisir un texte…';
            userInputField.id = `${sanitizedSectionLabel}-userInput-${Math.random()
              .toString(36)
              .slice(2)}`;

            userInputField.addEventListener('input', (e) => {
              userInputValues[userInputField.id] = e.target.value;
            });

            userInputDiv.appendChild(userInputLabel);
            userInputDiv.appendChild(userInputField);
            optionsContainer.appendChild(userInputDiv);
          });
        }

        sectionDiv.appendChild(optionsContainer);
        sectionsGrid.appendChild(sectionDiv);
      });

      container.appendChild(sectionsGrid);

      /**
       * Ajout des boutons de validation
       */
      if (buttons && buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-index', index);
        buttonContainer.classList.add('buttons-container');

        buttons.forEach((btn) => {
          const buttonElement = document.createElement('button');
          buttonElement.classList.add('submit-btn');
          buttonElement.textContent = btn.text;

          buttonElement.addEventListener('click', () => {
            // Récupérer les options cochées
            const checkedBoxes = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
            const selections = checkedBoxes.map((cb) => {
              const lbl = cb.nextElementSibling;
              if (lbl) {
                return lbl.innerHTML; // Récupère le contenu HTML (ex. <strong>…</strong>)
              }
              return '';
            });

            // Récupération des champs userInput non vides
            const userInputEntries = Object.entries(userInputValues).filter(([_, val]) => val && val.trim() !== '');
            // Format final => un tableau d'objets { section, userInput }
            // ou plus simple => on concatène tout dans un tableau
            // Selon vos besoins, adaptez ce format
            const userInputs = userInputEntries.map(([id, val]) => `${id}: ${val}`);

            // On peut reconstituer la structure [ { section, selections, userInput } ] si besoin
            // Mais ici on fait simple
            const finalPayload = {
              selections: selections,   // Les cases cochées
              userInputs: userInputs,   // Les user_input
              buttonText: btn.text,
              buttonPath: btn.path || 'Default',
              isEmpty: selections.length === 0 && userInputs.length === 0,
            };

            // Si "Revenir" dans le texte, on envoie un path différent
            if (btn.text.includes("Revenir") || btn.text.includes("Return")) {
              finalPayload.buttonPath = 'Previous_step';
            }

            console.log('Envoi des sélections:', JSON.stringify(finalPayload, null, 2));

            // Masquer les boutons après clic
            buttonContainer.querySelectorAll('.submit-btn').forEach((b) => {
              b.style.display = 'none';
            });

            // Interaction Voiceflow
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: finalPayload,
            });
          });

          buttonContainer.appendChild(buttonElement);
        });

        container.appendChild(buttonContainer);
      }

      // Injection dans la page
      element.appendChild(container);

      console.log('Rendu MultiSelect terminé avec', totalOptions, 'options au total');
    } catch (error) {
      console.error('Erreur lors du rendu de MultiSelect:', error);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          error: true,
          message: error.message,
        },
      });
    }
  },
};
