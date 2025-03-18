export const MultiSelect = {
    name: 'MultiSelect',
    type: 'response',
    match: ({trace}) => {
        return trace.payload && trace.type === 'multi_select';
    },
    render: ({trace, element}) => {
        try {
            console.log("Démarrage du rendu MultiSelect");

            // Récupérer les données depuis le payload
            const {
                sections = [],
                buttons = [],
                buttonColor = '#4CAF50',
                textColor = '#FFFFFF',
                backgroundOpacity = 0.7,
                index = 1,
                totalMaxSelect = 6,
                multiselect = true,
            } = trace.payload;

            let totalChecked = 0;
            let userInputValues = {};
            let hasUserInputField = false;

            // Créer un container principal
            const container = document.createElement('div');
            container.classList.add('multiselect-container');
            
            // Ajouter les styles avec support responsive
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .multiselect-container {
                    width: 100%;
                    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
                    box-sizing: border-box;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .multiselect-container * {
                    box-sizing: border-box;
                }
                
                /* Conteneur principal avec background violet */
                .multiselect-main {
                    background-color: #7E57C2;
                    border-radius: 10px;
                    padding: 15px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                /* Titre principal */
                .multiselect-title {
                    color: white;
                    font-size: 1.2em;
                    font-weight: 600;
                    margin: 0 0 15px 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }
                
                /* Grille pour les options */
                .multiselect-options-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 10px;
                }
                
                /* Classe pour activer la vue en deux colonnes */
                .multiselect-options-grid.two-columns {
                    grid-template-columns: 1fr 1fr;
                }
                
                @media (max-width: 500px) {
                    .multiselect-options-grid.two-columns {
                        grid-template-columns: 1fr;
                    }
                }
                
                /* Style des options */
                .option-item {
                    background-color: rgba(0, 0, 0, ${backgroundOpacity});
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                }
                
                .option-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }
                
                .option-item label {
                    display: block;
                    padding: 12px 15px;
                    color: white;
                    cursor: pointer;
                    font-weight: 500;
                    user-select: none;
                    width: 100%;
                    text-align: left;
                }
                
                .option-item input {
                    display: none;
                }
                
                /* Style pour l'option sélectionnée */
                .option-item input:checked + label {
                    background-color: ${buttonColor};
                    font-weight: 600;
                }
                
                /* Style pour option désactivée */
                .option-item.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                /* Styles des boutons */
                .buttons-container {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .submit-btn {
                    background: ${buttonColor};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    border: none;
                    font-weight: 600;
                    font-size: 1em;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                
                .submit-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
                }
                
                .submit-btn:active {
                    transform: translateY(0);
                }
                
                /* Styles pour les champs libres */
                .user-input-container {
                    margin-top: 15px;
                    grid-column: 1 / -1;
                }
                
                .user-input-label {
                    display: block;
                    margin-bottom: 8px;
                    color: white;
                    font-weight: 500;
                    font-size: 0.9em;
                }
                
                .user-input-field {
                    width: 100%;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    font-size: 0.95em;
                    transition: all 0.2s ease;
                    background-color: rgba(255, 255, 255, 0.9);
                }
                
                .user-input-field:focus {
                    border-color: ${buttonColor};
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
                }
                
                .error-message {
                    color: #ffcc00;
                    font-size: 0.85em;
                    margin-top: 6px;
                    display: block;
                }
            `;
            container.appendChild(styleElement);

            // Vérifier d'abord si nous avons des champs user_input
            sections.forEach(section => {
                if (Array.isArray(section.options)) {
                    section.options.forEach(option => {
                        if (option.action === 'user_input') {
                            hasUserInputField = true;
                        }
                    });
                }
            });

            // Créer le conteneur principal avec le background violet
            const mainContainer = document.createElement('div');
            mainContainer.classList.add('multiselect-main');

            // Ajouter le titre principal si présent dans la première section
            if (sections.length > 0) {
                const title = document.createElement('h2');
                title.classList.add('multiselect-title');
                title.textContent = sections[0].label.split(':')[0] || 'Choix du Secteur d\'activité';
                mainContainer.appendChild(title);
            }

            // Créer la grille d'options
            const optionsGrid = document.createElement('div');
            optionsGrid.classList.add('multiselect-options-grid');
            
            // Récupérer toutes les options des sections
            let allOptions = [];
            sections.forEach(section => {
                if (Array.isArray(section.options)) {
                    section.options.forEach(option => {
                        if (option.action !== 'user_input') {
                            allOptions.push({
                                name: option.name,
                                action: option.action,
                                section: section.label
                            });
                        }
                    });
                }
            });

            // Activer la vue en deux colonnes si plus de 10 options
            if (allOptions.length > 10) {
                optionsGrid.classList.add('two-columns');
            }

            // Compteur pour les IDs uniques
            let uniqueId = 0;

            // Création des options
            allOptions.forEach(option => {
                uniqueId++;
                const optionItem = document.createElement('div');
                optionItem.classList.add('option-item');
                
                const input = document.createElement('input');
                input.type = multiselect ? 'checkbox' : 'radio';
                input.name = multiselect ? `option-${uniqueId}` : 'option-group';
                input.id = `option-${uniqueId}`;
                input.dataset.section = option.section;
                input.dataset.name = option.name;
                input.dataset.action = option.action || '';
                
                const label = document.createElement('label');
                label.setAttribute('for', input.id);
                label.textContent = option.name;
                
                optionItem.appendChild(input);
                optionItem.appendChild(label);
                
                // Ajouter l'écouteur d'événement
                input.addEventListener('change', () => {
                    // Logique pour les options "all"
                    if (option.action === 'all' && input.checked) {
                        // Désactiver toutes les autres options de la même section
                        const sectionOptions = Array.from(optionsGrid.querySelectorAll(`input[data-section="${option.section}"]`));
                        sectionOptions.forEach(opt => {
                            if (opt !== input) {
                                opt.checked = false;
                                opt.parentElement.classList.add('disabled');
                            }
                        });
                    } else if (option.action === 'all' && !input.checked) {
                        // Réactiver les options de la section
                        const sectionOptions = Array.from(optionsGrid.querySelectorAll(`input[data-section="${option.section}"]`));
                        sectionOptions.forEach(opt => {
                            opt.parentElement.classList.remove('disabled');
                        });
                    }
                    
                    // Pour les sélections simples (non-multiselect)
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
                
                optionsGrid.appendChild(optionItem);
            });

            // Ajouter les champs de saisie utilisateur
            sections.forEach(section => {
                if (Array.isArray(section.options)) {
                    const userInputOptions = section.options.filter(option => option.action === 'user_input');
                    
                    userInputOptions.forEach(option => {
                        const userInputDiv = document.createElement('div');
                        userInputDiv.classList.add('user-input-container');
                        
                        const userInputLabel = document.createElement('label');
                        userInputLabel.classList.add('user-input-label');
                        userInputLabel.textContent = option.label || 'Indiquez votre option si aucune ne correspond';
                        
                        const userInputField = document.createElement('input');
                        userInputField.type = 'text';
                        userInputField.classList.add('user-input-field');
                        userInputField.placeholder = option.placeholder || 'Saisissez votre texte ici...';
                        userInputField.id = `${section.label}-user-input`;
                        
                        userInputValues[userInputField.id] = '';
                        
                        userInputField.addEventListener('input', (e) => {
                            userInputValues[userInputField.id] = e.target.value;
                        });
                        
                        userInputDiv.appendChild(userInputLabel);
                        userInputDiv.appendChild(userInputField);
                        optionsGrid.appendChild(userInputDiv);
                    });
                }
            });

            mainContainer.appendChild(optionsGrid);
            container.appendChild(mainContainer);

            // Ajouter les boutons de confirmation
            if (multiselect || hasUserInputField) {
                const buttonContainer = document.createElement('div');
                buttonContainer.classList.add('buttons-container');

                buttons.forEach(button => {
                    const buttonElement = document.createElement('button');
                    buttonElement.classList.add('submit-btn');
                    buttonElement.textContent = button.text;

                    buttonElement.addEventListener('click', () => {
                        // Recueillir les options sélectionnées
                        const selectedOptionsMap = {};
                        
                        // Récupérer toutes les cases cochées
                        const checkedInputs = Array.from(optionsGrid.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked'));
                        
                        // Organiser les sélections par section
                        checkedInputs.forEach(input => {
                            const sectionName = input.dataset.section;
                            const optionName = input.dataset.name;
                            
                            if (!selectedOptionsMap[sectionName]) {
                                selectedOptionsMap[sectionName] = {
                                    section: sectionName,
                                    selections: [],
                                    userInput: ""
                                };
                            }
                            
                            selectedOptionsMap[sectionName].selections.push(optionName);
                        });
                        
                        // Ajouter les saisies utilisateur
                        Object.keys(userInputValues).forEach(key => {
                            const sectionName = key.split('-user-input')[0];
                            const userInput = userInputValues[key];
                            
                            if (userInput && userInput.trim() !== "") {
                                if (!selectedOptionsMap[sectionName]) {
                                    selectedOptionsMap[sectionName] = {
                                        section: sectionName,
                                        selections: [],
                                        userInput: ""
                                    };
                                }
                                
                                selectedOptionsMap[sectionName].userInput = userInput.trim();
                            }
                        });
                        
                        // Convertir en tableau
                        const selectedOptions = Object.values(selectedOptionsMap);
                        
                        // Masquer tous les boutons après sélection
                        buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
                            btn.style.display = 'none';
                        });
                        
                        console.log("Envoi des sélections:", selectedOptions);
                        
                        // Construire un payload structuré pour Voiceflow
                        let payloadData = {};
                        const buttonPath = button.path || 'Default';

                        if (selectedOptions.length === 1 && 
                            selectedOptions[0].selections.length === 0 && 
                            selectedOptions[0].userInput.trim() !== "") {
                            
                            payloadData = {
                                userInput: selectedOptions[0].userInput.trim(),
                                buttonText: button.text,
                                buttonPath: buttonPath,
                                isEmpty: false,
                                isUserInput: true
                            };
                        } else if (selectedOptions.length > 0) {
                            payloadData = {
                                selections: selectedOptions,
                                buttonText: button.text,
                                buttonPath: buttonPath,
                                isEmpty: false,
                                isUserInput: false
                            };
                        } else {
                            payloadData = {
                                buttonText: button.text,
                                buttonPath: buttonPath,
                                isEmpty: true
                            };
                        }
                        
                        // Envoyer la réponse
                        window.voiceflow.chat.interact({
                            type: 'complete',
                            payload: payloadData
                        });
                    });

                    buttonContainer.appendChild(buttonElement);
                });

                container.appendChild(buttonContainer);
            }

            // Ajouter le conteneur final à l'élément parent
            element.appendChild(container);
            console.log("Rendu MultiSelect terminé");
            
        } catch (error) {
            console.error('Erreur lors du rendu de MultiSelect:', error);
            window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                    error: true,
                    message: error.message
                }
            });
        }
    },
};
