export const MultiSelect = {
    name: 'MultiSelect',
    type: 'response',
    match: ({trace}) => {
        return trace.payload && trace.type === 'multi_select';
    },
    render: ({trace, element}) => {
        try {
            // Récupérer les données depuis le payload
            const {
                sections = [],
                buttons = [],
                buttonColor = '#4CAF50',
                textColor = '#FFFFFF',  // Modifié pour un meilleur contraste
                backgroundOpacity = 0.7, // Augmenté pour une meilleure lisibilité
                index = 1,
                totalMaxSelect = 6,
                multiselect = true,
            } = trace.payload;

            let totalChecked = 0;
            let userInputValues = {};
            let hasUserInputField = false;  // Flag pour vérifier si un champ libre existe

            const getCheckedDetails = (container) => {
                const sections = Array.from(container.querySelectorAll('.section-container'));
                const details = sections.map(section => {
                    const allCheckboxes = Array.from(section.querySelectorAll('input[type="checkbox"]'));
                    const checkedCheckboxes = allCheckboxes.filter(checkbox => checkbox.checked);
                    const checkedNormal = checkedCheckboxes.filter(checkbox => !checkbox.id.includes("-all-"));
                    const checkedAll = checkedCheckboxes.filter(checkbox => checkbox.id.includes("-all-"));

                    return {
                        sectionLabel: section.querySelector('.section-title').textContent, // Nom de la section
                        sectionSize: allCheckboxes.length - 1, // Nombre total de checkbox dans la section
                        checkedNormal: checkedNormal.map(checkbox => checkbox.id), // IDs des checkboxes normales cochées
                        checkedAll: checkedAll.map(checkbox => checkbox.id), // IDs des checkboxes "all" cochées
                    };
                });

                return details;
            };

            const updateTotalChecked = () => {
                const details = getCheckedDetails(container);
                totalChecked = 0;

                // Calculer le nombre total de cases cochées dans toutes les sections
                details.forEach((detail) => {
                    if (detail.checkedAll.length > 0) {
                        totalChecked += detail.sectionSize; // Si "all" est coché, toutes les cases de la section sont comptées
                    } else {
                        totalChecked += detail.checkedNormal.length; // Sinon, seules les cases normales cochées sont comptées
                    }
                });

                // Désactiver toutes les cases non cochées si la limite globale est atteinte
                if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
                    Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(checkbox => {
                        if (!checkbox.checked) {
                            checkbox.disabled = true;
                        }
                    });
                } else {
                    // Réactiver les cases si la limite globale n'est pas atteinte
                    Array.from(container.querySelectorAll('.section-container')).forEach((section, sectionIndex) => {
                        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
                        const uncheckedCheckboxes = Array.from(checkboxes).filter(checkbox => !checkbox.checked);

                        // Obtenir les détails de la section actuelle
                        const { checkedNormal, checkedAll, sectionSize } = details[sectionIndex];
                        const sectionCheckedCount = checkedAll.length > 0 ? sectionSize : checkedNormal.length;
                        const sectionMaxSelect = sections[sectionIndex].maxSelect || Infinity; // Limite max de la section

                        if (sectionCheckedCount >= sectionMaxSelect || checkedAll.length > 0) {
                            // Désactiver les cases non cochées si la limite de la section est atteinte
                            checkboxes.forEach(checkbox => {
                                if (!checkbox.checked) {
                                    checkbox.disabled = true;
                                }
                            });
                        } else {
                            // Réactiver les cases de la section si la limite de la section n'est pas atteinte
                            checkboxes.forEach(checkbox => {
                                checkbox.disabled = false;
                            });
                        }

                        // Gérer les messages d'erreur pour les cases "-all-" uniquement
                        checkboxes.forEach(checkbox => {
                            const isAllCheckbox = checkbox.id.includes("-all-");
                            const errorSpan = checkbox.parentElement.querySelector('.error-message');

                            if (isAllCheckbox && totalChecked + sectionSize - checkedNormal.length > totalMaxSelect && !checkbox.checked) {
                                if (!errorSpan) {
                                    const span = document.createElement('span');
                                    span.classList.add('error-message');
                                    span.textContent = "Trop de cases cochées pour cocher celle-ci";
                                    span.style.color = '#ffcc00';
                                    span.style.marginLeft = '10px';
                                    span.style.display = 'block';
                                    span.style.fontSize = '0.75em';
                                    span.style.marginTop = '4px';
                                    checkbox.parentElement.appendChild(span);
                                }
                                checkbox.disabled = true;
                            } else {
                                // Supprimer le message d'erreur si la checkbox devient réactivable
                                if (errorSpan) {
                                    errorSpan.remove();
                                }
                            }
                        });
                    });
                }
            };

            // Vérifier que sections est un tableau
            if (!Array.isArray(sections)) {
                console.error('Erreur : `sections` n\'est pas un tableau', sections);
                return;
            }

            // Vérifier si des sections ont des champs user_input
            sections.forEach(section => {
                if (Array.isArray(section.options)) {
                    section.options.forEach(option => {
                        if (option.action === 'user_input') {
                            hasUserInputField = true;
                        }
                    });
                }
            });

            // Analyser le nombre total d'options pour une meilleure mise en page
            let totalOptions = 0;
            sections.forEach(section => {
                if (Array.isArray(section.options)) {
                    totalOptions += section.options.length;
                }
            });

            // Container principal avec styles avancés
            const container = document.createElement('div');
            container.classList.add('multiselect-container');

            // Styles CSS améliorés
            container.innerHTML = `
            <style>
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
                
                /* Section grid layout */
                .sections-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    width: 100%;
                }
                
                @media (max-width: 500px) {
                    .sections-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .options-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                /* Section containers */
                .section-container {
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 0;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .section-title {
                    color: ${textColor};
                    font-size: 1em;
                    font-weight: 600;
                    margin-top: 0;
                    margin-bottom: 8px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
                }
                
                /* Options layouts */
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 100%;
                    flex-grow: 1;
                }
                
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    width: 100%;
                    flex-grow: 1;
                }
                
                /* Option containers */
                .option-container {
                    display: flex;
                    align-items: flex-start;
                    margin: 0;
                    width: 100%;
                }
                
                /* Checkbox/Radio styling */
                .option-container input[type="checkbox"],
                .option-container input[type="radio"] {
                    height: 16px;
                    width: 16px;
                    border-radius: 3px;
                    margin-right: 6px;
                    cursor: pointer;
                    accent-color: ${buttonColor};
                    margin-top: 6px;
                }
                
                /* Label styling */
                .option-container label {
                    cursor: pointer;
                    font-size: 0.85em;
                    border-radius: 4px;
                    padding: 6px 8px;
                    color: ${textColor};
                    background-color: rgba(0, 0, 0, ${backgroundOpacity});
                    user-select: none;
                    display: block;
                    width: 100%;
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    white-space: normal;
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-word;
                    hyphens: auto;
                    min-height: 31px;
                    font-weight: 500;
                    line-height: 1.3;
                }
                
                .option-container label:hover {
                    background-color: rgba(0, 0, 0, ${backgroundOpacity + 0.1});
                    transform: translateY(-1px);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .option-container input:checked + label {
                    background-color: ${buttonColor};
                    border-color: white;
                    font-weight: 600;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                
                .option-container input:disabled + label {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Button container */
                .buttons-container {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }
                
                /* Button styling */
                .submit-btn {
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
                    white-space: normal;
                    text-align: center;
                    min-width: 130px;
                }
                
                .submit-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
                }
                
                .submit-btn:active {
                    transform: translateY(0);
                }
                
                /* User input field styles */
                .user-input-container {
                    margin-top: 10px;
                    margin-bottom: 8px;
                    width: 100%;
                    grid-column: 1 / -1;
                }
                
                .user-input-label {
                    display: block;
                    margin-bottom: 6px;
                    color: ${textColor};
                    font-weight: 500;
                    font-size: 0.85em;
                    line-height: 1.3;
                }
                
                .user-input-field {
                    width: 100%;
                    padding: 6px 8px;
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    font-size: 0.85em;
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
                    font-size: 0.75em;
                    margin-top: 4px;
                    display: block;
                }
            </style>
            `;

            // Conteneur de grid pour les sections
            const sectionsGrid = document.createElement('div');
            sectionsGrid.classList.add('sections-grid');

            // Création des sections avec les options
            sections.forEach((section, sectionIndex) => {
                const {maxSelect = 200} = section; // Définir maxSelect pour chaque section
                const sectionDiv = document.createElement('div');
                sectionDiv.classList.add('section-container');
                
                // Utiliser la couleur de section si elle est définie
                if (section.color) {
                    sectionDiv.style.backgroundColor = section.color;
                } else {
                    sectionDiv.style.backgroundColor = '#673AB7'; // Couleur par défaut
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

                if (Array.isArray(section.options)) {
                    // Séparer les options standard des champs user_input
                    const standardOptions = section.options.filter(option => option.action !== 'user_input');
                    const userInputOptions = section.options.filter(option => option.action === 'user_input');

                    // Ajouter les options standard
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

                        // Gestion de la sélection et des actions spéciales
                        input.addEventListener('change', () => {
                            updateTotalChecked();
                            const allCheckboxes = sectionDiv.querySelectorAll('input[type="checkbox"]');
                            const checkedCount = Array.from(allCheckboxes).filter(checkbox => checkbox.checked).length;

                            if (option.action === 'all' && input.checked) {
                                // Désactiver et décocher toutes les autres cases dans cette section
                                allCheckboxes.forEach(checkbox => {
                                    if (checkbox !== input) {
                                        checkbox.disabled = true;
                                        checkbox.checked = false;
                                    }
                                });
                            } else if (option.action === 'all' && !input.checked) {
                                // Réactiver toutes les cases de cette section si décoché
                                allCheckboxes.forEach(checkbox => {
                                    checkbox.disabled = false;
                                });
                            } else if (checkedCount >= maxSelect) {
                                // Limitation par maxSelect dans cette section
                                allCheckboxes.forEach(checkbox => {
                                    if (!checkbox.checked) {
                                        checkbox.disabled = true;
                                    }
                                });
                            } else {
                                // Réactiver toutes les cases de cette section si limite non atteinte
                                if (totalMaxSelect === 0) {
                                    allCheckboxes.forEach(checkbox => {
                                        checkbox.disabled = false;
                                    });
                                }
                            }

                            // Envoi immédiat pour sélection unique
                            if (!multiselect) {
                                const selectedOption = {
                                    section: section.label,
                                    selections: [option.name],
                                };

                                input.labels[0].style.backgroundColor = buttonColor;
                                input.labels[0].style.color = textColor;
                                window.voiceflow.chat.interact({
                                    type: 'complete',
                                    payload: JSON.stringify({
                                        count: 1,
                                        selections: [selectedOption],
                                    }),
                                });
                            }
                        });

                        optionsContainer.appendChild(optionDiv);
                    });

                    // Ajouter les champs de saisie utilisateur
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
                } else {
                    console.error('Erreur : `options` n\'est pas un tableau dans la section', section);
                }

                sectionDiv.appendChild(optionsContainer);
                sectionsGrid.appendChild(sectionDiv);
            });

            container.appendChild(sectionsGrid);

            // Si `multiselect` est vrai ou s'il y a un champ user_input, ajoutez les boutons
            if (multiselect || hasUserInputField) {
                // Créer un conteneur pour les boutons
                const buttonContainer = document.createElement('div');
                buttonContainer.setAttribute('data-index', index);
                buttonContainer.classList.add('buttons-container');

                // Parcourir les boutons définis dans le payload
                buttons.forEach(button => {
                    const buttonElement = document.createElement('button');
                    buttonElement.classList.add('submit-btn');
                    buttonElement.textContent = button.text; // Texte du bouton

                    // Ajouter un événement "click" pour chaque bouton
                    buttonElement.addEventListener('click', () => {
                        const selectedOptions = sections.map((section, idx) => {
                            const sectionElement = container.querySelectorAll('.section-container')[idx];
                            if (!sectionElement) return null;
                            
                            // Récupérer les cases cochées
                            const sectionSelections = Array.from(
                                sectionElement.querySelectorAll('input[type="checkbox"]:checked')
                            ).map(checkbox => checkbox.nextElementSibling.innerText);
                            
                            // Récupérer les valeurs des champs user_input
                            const userInputId = `${section.label}-user-input-${section.id || ''}`;
                            const userInput = userInputValues[userInputId] || "";
                            
                            return {
                                section: section.label, 
                                selections: sectionSelections,
                                userInput: userInput
                            };
                        }).filter(section => section && (section.selections.length > 0 || section.userInput));

                        // Masquer tous les boutons après sélection
                        buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
                            btn.style.display = 'none';
                        });

                        // Construire le payload avec le path associé au bouton cliqué
                        let jsonPayload = {};
                        const buttonPath = button.path || 'Default';
                        
                        // Format du payload selon le contenu
                        if (selectedOptions.length === 1 && 
                            selectedOptions[0].selections.length === 0 && 
                            selectedOptions[0].userInput.trim() !== "") {
                            
                            // Si uniquement un champ texte est rempli
                            jsonPayload = {
                                userInput: selectedOptions[0].userInput.trim(),
                                buttonText: button.text,
                                buttonPath: buttonPath,
                                isEmpty: false,
                                isUserInput: true
                            };
                        } else if (selectedOptions.length > 0) {
                            // Si des sélections normales sont faites
                            jsonPayload = {
                                count: selectedOptions.reduce((sum, section) => sum + section.selections.length, 0),
                                selections: selectedOptions,
                                buttonText: button.text,
                                buttonPath: buttonPath,
                                isEmpty: false,
                                isUserInput: false
                            };
                        } else {
                            // Si aucune sélection
                            jsonPayload = {
                                buttonText: button.text,
                                buttonPath: buttonPath,
                                isEmpty: true
                            };
                        }

                        // Conserver la compatibilité avec le code existant
                        jsonPayload.path = buttonPath;

                        window.voiceflow.chat.interact({
                            type: 'complete',
                            payload: JSON.stringify(jsonPayload),
                        });
                    });

                    // Ajouter le bouton au conteneur des boutons
                    buttonContainer.appendChild(buttonElement);
                });

                // Ajouter le conteneur des boutons au conteneur principal
                container.appendChild(buttonContainer);
            }

            element.appendChild(container);
        } catch (error) {
            console.error('Erreur lors du rendu de MultiSelect:', error);
        }
    },
};
