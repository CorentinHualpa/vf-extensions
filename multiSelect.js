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
            let hasUserInputField = false;  // Flag pour vérifier si un champ libre existe
            
            // Créer un container principal
            const container = document.createElement('div');
            container.classList.add('multiselect-container');
            
            // Analyser le nombre total d'options pour déterminer la mise en page
            let totalOptions = 0;
            sections.forEach(section => {
                if (Array.isArray(section.options)) {
                    totalOptions += section.options.length;
                }
            });
            
            // Ajouter les styles avec support responsive et dimensions réduites
            const styleElement = document.createElement('style');
            styleElement.textContent = `
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
                
                /* Grille pour les sections principales */
                .multiselect-container .sections-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    width: 100%;
                }
                
                @media (max-width: 500px) {
                    .multiselect-container .sections-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .multiselect-container .options-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                /* Style des sections */
                .multiselect-container .section-container {
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 0;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background-color: #673AB7;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .multiselect-container .section-title {
                    color: white;
                    font-size: 1em;
                    font-weight: 600;
                    margin-top: 0;
                    margin-bottom: 8px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
                }
                
                /* Liste d'options normale (moins de 10 éléments) */
                .multiselect-container .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 100%;
                    flex-grow: 1;
                }
                
                /* Grille d'options (plus de 10 éléments) */
                .multiselect-container .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    width: 100%;
                    flex-grow: 1;
                }
                
                /* Style pour les conteneurs d'options */
                .multiselect-container .option-container {
                    display: flex;
                    align-items: center;
                    margin: 0;
                    width: 100%;
                }
                
                /* Style pour les inputs */
                .multiselect-container .option-container input[type="checkbox"],
                .multiselect-container .option-container input[type="radio"] {
                    height: 16px;
                    width: 16px;
                    border-radius: 3px;
                    margin-right: 6px;
                    cursor: pointer;
                    accent-color: ${buttonColor};
                }
                
                /* Style pour les labels */
                .multiselect-container .option-container label {
                    cursor: pointer;
                    font-size: 0.85em;
                    border-radius: 4px;
                    padding: 6px 8px;
                    color: white;
                    background-color: rgba(0, 0, 0, ${backgroundOpacity});
                    user-select: none;
                    display: block;
                    width: 100%;
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-weight: 500;
                    line-height: 1.3;
                }
                
                .multiselect-container .option-container label:hover {
                    background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
                    transform: translateY(-1px);
                }
                
                .multiselect-container .option-container input:checked + label {
                    background-color: ${buttonColor};
                    border-color: white;
                    font-weight: 600;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                
                .multiselect-container .option-container input:disabled + label {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Styles des boutons */
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
                }
                
                .multiselect-container .submit-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
                }
                
                .multiselect-container .submit-btn:active {
                    transform: translateY(0);
                }
                
                /* Styles pour les champs libres */
                .multiselect-container .user-input-container {
                    margin-top: 10px;
                    margin-bottom: 8px;
                    width: 100%;
                    grid-column: 1 / -1; /* Prend toute la largeur en mode grille */
                }
                
                .multiselect-container .user-input-label {
                    display: block;
                    margin-bottom: 6px;
                    color: white;
                    font-weight: 500;
                    font-size: 0.85em;
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
                
                .multiselect-container .error-message {
                    color: #ffcc00;
                    font-size: 0.75em;
                    margin-top: 4px;
                    display: block;
                }
                
                /* Limiter la taille maximale des labels longs */
                .multiselect-container .option-container label {
                    max-width: 100%;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    height: auto;
                    white-space: normal;
                }
            `;
            container.appendChild(styleElement);

            // Fonction pour obtenir les détails des cases cochées
            const getCheckedDetails = () => {
                const sectionsElements = Array.from(container.querySelectorAll('.section-container'));
                const details = sectionsElements.map(section => {
                    const allCheckboxes = Array.from(section.querySelectorAll('input[type="checkbox"]'));
                    const checkedCheckboxes = allCheckboxes.filter(checkbox => checkbox.checked);
                    const checkedNormal = checkedCheckboxes.filter(checkbox => !checkbox.id.includes("-all-"));
                    const checkedAll = checkedCheckboxes.filter(checkbox => checkbox.id.includes("-all-"));

                    return {
                        sectionLabel: section.querySelector('.section-title').textContent,
                        sectionSize: allCheckboxes.length - 1,
                        checkedNormal: checkedNormal.map(checkbox => checkbox.id),
                        checkedAll: checkedAll.map(checkbox => checkbox.id),
                    };
                });

                return details;
            };

            // Fonction pour mettre à jour le compte total de cases cochées
            const updateTotalChecked = () => {
                const details = getCheckedDetails();
                totalChecked = 0;

                details.forEach((detail) => {
                    if (detail.checkedAll.length > 0) {
                        totalChecked += detail.sectionSize;
                    } else {
                        totalChecked += detail.checkedNormal.length;
                    }
                });

                if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
                    Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(checkbox => {
                        if (!checkbox.checked) {
                            checkbox.disabled = true;
                        }
                    });
                } else {
                    Array.from(container.querySelectorAll('.section-container')).forEach((section, sectionIndex) => {
                        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
                        
                        if (details[sectionIndex]) {
                            const { checkedNormal, checkedAll, sectionSize } = details[sectionIndex];
                            const sectionCheckedCount = checkedAll.length > 0 ? sectionSize : checkedNormal.length;
                            const sectionMaxSelect = sections[sectionIndex].maxSelect || Infinity;

                            if (sectionCheckedCount >= sectionMaxSelect || checkedAll.length > 0) {
                                checkboxes.forEach(checkbox => {
                                    if (!checkbox.checked) {
                                        checkbox.disabled = true;
                                    }
                                });
                            } else {
                                checkboxes.forEach(checkbox => {
                                    checkbox.disabled = false;
                                });
                            }

                            checkboxes.forEach(checkbox => {
                                const isAllCheckbox = checkbox.id.includes("-all-");
                                const errorSpan = checkbox.parentElement.querySelector('.error-message');

                                if (isAllCheckbox && totalChecked + sectionSize - checkedNormal.length > totalMaxSelect && !checkbox.checked) {
                                    if (!errorSpan) {
                                        const span = document.createElement('span');
                                        span.classList.add('error-message');
                                        span.textContent = "Trop de cases cochées pour cocher celle-ci";
                                        checkbox.parentElement.appendChild(span);
                                    }
                                    checkbox.disabled = true;
                                } else {
                                    if (errorSpan) {
                                        errorSpan.remove();
                                    }
                                }
                            });
                        }
                    });
                }
            };

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

            // Créer un conteneur grid pour les sections
            const sectionsGrid = document.createElement('div');
            sectionsGrid.classList.add('sections-grid');

            // Création des sections avec les options
            sections.forEach((section, sectionIndex) => {
                const {maxSelect = 200} = section;
                const sectionDiv = document.createElement('div');
                sectionDiv.classList.add('section-container');
                
                // Utiliser la couleur de section directement pour un meilleur contraste
                if (section.color) {
                    sectionDiv.style.backgroundColor = section.color;
                }

                const sectionLabel = document.createElement('h3');
                sectionLabel.classList.add('section-title');
                sectionLabel.textContent = section.label;
                sectionDiv.appendChild(sectionLabel);

                // Déterminer le nombre d'options pour cette section
                let sectionOptionsCount = 0;
                if (Array.isArray(section.options)) {
                    sectionOptionsCount = section.options.length;
                }

                // Créer un conteneur pour les options
                // Utiliser une grille si plus de 10 options dans cette section
                const optionsContainer = document.createElement('div');
                optionsContainer.classList.add(sectionOptionsCount > 10 ? 'options-grid' : 'options-list');

                // Ajouter les options standard
                if (Array.isArray(section.options)) {
                    const standardOptions = section.options.filter(option => option.action !== 'user_input');
                    
                    standardOptions.forEach(option => {
                        const optionDiv = document.createElement('div');
                        optionDiv.classList.add('option-container');
                        
                        const input = document.createElement('input');
                        input.type = multiselect ? 'checkbox' : 'radio';
                        if (!multiselect) {
                            input.style.display = 'none';
                        }
                        input.name = `option-${section.label}-${index}`;
                        input.id = `${section.label}-${option.name}-${option.action}-${section.id || ''}`;
                        
                        const label = document.createElement('label');
                        label.setAttribute('for', input.id);
                        label.textContent = option.name;
                        label.title = option.name; // Pour afficher le texte complet au survol
                        
                        optionDiv.appendChild(input);
                        optionDiv.appendChild(label);

                        input.addEventListener('change', () => {
                            updateTotalChecked();
                            const allCheckboxes = sectionDiv.querySelectorAll('input[type="checkbox"]');
                            const checkedCount = Array.from(allCheckboxes).filter(checkbox => checkbox.checked).length;

                            if (option.action === 'all' && input.checked) {
                                allCheckboxes.forEach(checkbox => {
                                    if (checkbox !== input) {
                                        checkbox.disabled = true;
                                        checkbox.checked = false;
                                    }
                                });
                            } else if (option.action === 'all' && !input.checked) {
                                allCheckboxes.forEach(checkbox => {
                                    checkbox.disabled = false;
                                });
                            } else if (checkedCount >= maxSelect) {
                                allCheckboxes.forEach(checkbox => {
                                    if (!checkbox.checked) {
                                        checkbox.disabled = true;
                                    }
                                });
                            } else {
                                if (totalMaxSelect === 0) {
                                    allCheckboxes.forEach(checkbox => {
                                        checkbox.disabled = false;
                                    });
                                }
                            }

                            if (!multiselect) {
                                // Pour les sélections simples (radio buttons/selection unique)
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

                        optionsContainer.appendChild(optionDiv);
                    });
                    
                    // Ajouter le champ libre à la fin
                    const userInputOptions = section.options.filter(option => option.action === 'user_input');
                    
                    userInputOptions.forEach(option => {
                        // Créer un conteneur pour le champ de saisie utilisateur
                        const userInputDiv = document.createElement('div');
                        userInputDiv.classList.add('user-input-container');
                        
                        // Créer le libellé du champ
                        const userInputLabel = document.createElement('label');
                        userInputLabel.classList.add('user-input-label');
                        // Utiliser le texte par défaut si non spécifié
                        userInputLabel.textContent = option.label || 'Indiquez votre option si aucune ne correspond';
                        
                        // Créer le champ de saisie
                        const userInputField = document.createElement('input');
                        userInputField.type = 'text';
                        userInputField.classList.add('user-input-field');
                        userInputField.placeholder = option.placeholder || 'Saisissez votre texte ici...';
                        userInputField.id = `${section.label}-user-input-${section.id || ''}`;
                        
                        // Stocker la référence à ce champ pour récupérer sa valeur plus tard
                        userInputValues[userInputField.id] = '';
                        
                        // Mettre à jour la valeur stockée à chaque modification
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

            // Toujours afficher les boutons si multiselect est true OU s'il y a un champ user_input
            if (multiselect || hasUserInputField) {
                const buttonContainer = document.createElement('div');
                buttonContainer.setAttribute('data-index', index);
                buttonContainer.classList.add('buttons-container');

                buttons.forEach(button => {
                    const buttonElement = document.createElement('button');
                    buttonElement.classList.add('submit-btn');
                    buttonElement.textContent = button.text;

                    buttonElement.addEventListener('click', () => {
                        const selectedOptions = sections.map((section, idx) => {
                            const sectionElement = container.querySelectorAll('.section-container')[idx];
                            if (!sectionElement) return null;
                            
                            // Récupérer les cases cochées
                            const sectionSelections = Array.from(
                                sectionElement.querySelectorAll('input[type="checkbox"]:checked')
                            ).map(checkbox => checkbox.nextElementSibling.innerText);
                            
                            // Récupérer les valeurs des champs de saisie utilisateur
                            const userInputFields = {};
                            const userInputId = `${section.label}-user-input-${section.id || ''}`;
                            if (userInputValues[userInputId] !== undefined) {
                                userInputFields.userInput = userInputValues[userInputId];
                            }
                            
                            return {
                                section: section.label, 
                                selections: sectionSelections,
                                userInput: userInputFields.userInput || ""
                            };
                        }).filter(section => section && (section.selections.length > 0 || section.userInput));

                        // Masquer tous les boutons après sélection
                        buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
                            btn.style.display = 'none';
                        });
                        
                        console.log("Envoi des sélections:", selectedOptions);
                        
                        // Construire un payload structuré pour Voiceflow
                        let payloadData = {};
                        const buttonPath = button.path || 'Default';

                        // Si nous avons une seule section avec uniquement un champ libre
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
                        
                        // Envoyer la réponse avec type 'complete'
                        window.voiceflow.chat.interact({
                            type: 'complete',
                            payload: payloadData
                        });
                    });

                    buttonContainer.appendChild(buttonElement);
                });

                container.appendChild(buttonContainer);
            }

            // Ajouter au conteneur parent
            element.appendChild(container);
            console.log("Rendu MultiSelect terminé avec", totalOptions, "options au total");
            
        } catch (error) {
            console.error('Erreur lors du rendu de MultiSelect:', error);
            // En cas d'erreur, envoyer une interaction pour continuer le flow
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
