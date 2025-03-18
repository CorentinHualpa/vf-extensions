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
                textColor = '#0000FF',
                backgroundOpacity = 0.3,
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
            
            // Ajouter les styles avec support responsive
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .multiselect-container {
                    width: 100%;
                    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
                    box-sizing: border-box;
                }
                
                .multiselect-container * {
                    box-sizing: border-box;
                }
                
                .multiselect-container .sections-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 15px;
                    width: 100%;
                }
                
                .multiselect-container .section-container {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .multiselect-container .section-title {
                    color: ${textColor} !important;
                    font-size: 1.1em;
                    font-weight: 600;
                    margin-top: 0;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .multiselect-container .options-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 8px;
                    width: 100%;
                    flex-grow: 1;
                }
                
                .multiselect-container .option-container {
                    display: flex;
                    align-items: center;
                    margin: 0;
                }
                
                .multiselect-container .option-container input[type="checkbox"],
                .multiselect-container .option-container input[type="radio"] {
                    height: 18px;
                    width: 18px;
                    border-radius: 4px;
                    margin-right: 8px;
                    cursor: pointer;
                    accent-color: ${buttonColor};
                }
                
                .multiselect-container .option-container label {
                    cursor: pointer;
                    font-size: 0.9em;
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: ${textColor};
                    background-color: rgba(0, 0, 0, ${backgroundOpacity});
                    user-select: none;
                    display: block;
                    width: 100%;
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .multiselect-container .option-container label:hover {
                    background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
                    transform: translateY(-1px);
                }
                
                .multiselect-container .option-container input:checked + label {
                    background-color: ${buttonColor}22;
                    border-color: ${buttonColor};
                    font-weight: 500;
                }
                
                .multiselect-container .option-container input:disabled + label {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .multiselect-container .active-btn {
                    background: ${textColor};
                    color: ${buttonColor};
                    border: 2px solid ${buttonColor};
                }
                
                .multiselect-container .buttons-container {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .multiselect-container .submit-btn {
                    background: ${buttonColor};
                    color: white;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    border: none;
                    font-weight: 500;
                    font-size: 0.95em;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .multiselect-container .submit-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }
                
                .multiselect-container .submit-btn:active {
                    transform: translateY(0);
                }
                
                .multiselect-container .user-input-container {
                    margin-top: 15px;
                    margin-bottom: 10px;
                    grid-column: 1 / -1;
                }
                
                .multiselect-container .user-input-label {
                    display: block;
                    margin-bottom: 8px;
                    color: ${textColor};
                    font-weight: 500;
                    font-size: 0.9em;
                }
                
                .multiselect-container .user-input-field {
                    width: 100%;
                    padding: 10px;
                    border-radius: 6px;
                    border: 1px solid #ccc;
                    font-size: 0.95em;
                    transition: all 0.2s ease;
                }
                
                .multiselect-container .user-input-field:focus {
                    border-color: ${buttonColor};
                    outline: none;
                    box-shadow: 0 0 0 2px ${buttonColor}33;
                }
                
                .multiselect-container .error-message {
                    color: #f44336;
                    font-size: 0.85em;
                    margin-top: 6px;
                    display: block;
                }
                
                @media (max-width: 600px) {
                    .multiselect-container .sections-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .multiselect-container .options-grid {
                        grid-template-columns: 1fr;
                    }
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
                
                // Appliquer la couleur de section comme propriété personnalisée
                // Utiliser une version plus subtile de la couleur
                const sectionColor = section.color;
                const backgroundColor = sectionColor + '22'; // Ajouter une transparence
                sectionDiv.style.backgroundColor = backgroundColor;
                sectionDiv.style.borderColor = sectionColor;

                const sectionLabel = document.createElement('h3');
                sectionLabel.classList.add('section-title');
                sectionLabel.textContent = section.label;
                sectionDiv.appendChild(sectionLabel);

                // Créer un conteneur grid pour les options
                const optionsGrid = document.createElement('div');
                optionsGrid.classList.add('options-grid');

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
                                label.style.backgroundColor = textColor;
                                label.style.color = buttonColor;
                                
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

                        optionsGrid.appendChild(optionDiv);
                    });
                    
                    // Ajouter le champ libre à la fin (toujours pleine largeur)
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
                        optionsGrid.appendChild(userInputDiv);
                    });
                }

                sectionDiv.appendChild(optionsGrid);
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
            console.log("Rendu MultiSelect terminé");
            
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
