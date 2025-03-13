export const MultiSelect = {
    name: 'MultiSelect',
    type: 'response',
    match: ({trace}) => {
        return trace.payload && trace.type === 'multi_select';
    },
    render: ({trace, element, runtime}) => {
        try {
            // Variable pour enregistrer les logs de débogage
            let log_details = [];
            
            // Fonction pour enregistrer les logs
            const logDebug = (message, data) => {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    message: message,
                    data: data
                };
                log_details.push(logEntry);
                console.log(`LOG: ${message}`, data);
            };

            logDebug("MultiSelect initialisé", { trace_type: trace.type });
            
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

            logDebug("Configuration chargée", { 
                sectionsCount: sections.length, 
                buttonsCount: buttons.length, 
                multiselect: multiselect 
            });

            let totalChecked = 0;

            const getCheckedDetails = (container) => {
                const sections = Array.from(container.querySelectorAll('.section-container'));
                const details = sections.map(section => {
                    const allCheckboxes = Array.from(section.querySelectorAll('input[type="checkbox"]'));
                    const checkedCheckboxes = allCheckboxes.filter(checkbox => checkbox.checked);
                    const checkedNormal = checkedCheckboxes.filter(checkbox => !checkbox.id.includes("-all-"));
                    const checkedAll = checkedCheckboxes.filter(checkbox => checkbox.id.includes("-all-"));

                    return {
                        sectionLabel: section.querySelector('h3').textContent,
                        sectionSize: allCheckboxes.length - 1,
                        checkedNormal: checkedNormal.map(checkbox => checkbox.id),
                        checkedAll: checkedAll.map(checkbox => checkbox.id),
                    };
                });

                return details;
            };

            const updateTotalChecked = () => {
                const details = getCheckedDetails(container);
                totalChecked = 0;

                details.forEach((detail) => {
                    if (detail.checkedAll.length > 0) {
                        totalChecked += detail.sectionSize;
                    } else {
                        totalChecked += detail.checkedNormal.length;
                    }
                });

                logDebug("Mise à jour du total de cases cochées", { totalChecked });

                if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
                    Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(checkbox => {
                        if (!checkbox.checked) {
                            checkbox.disabled = true;
                        }
                    });
                } else {
                    Array.from(container.querySelectorAll('.section-container')).forEach((section, sectionIndex) => {
                        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
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
                                    span.style.color = 'red';
                                    span.style.marginLeft= '10px';
                                    span.style.display = 'block';
                                    checkbox.parentElement.appendChild(span);
                                }
                                checkbox.disabled = true;
                            } else {
                                if (errorSpan) {
                                    errorSpan.remove();
                                }
                            }
                        });
                    });
                }
            };

            if (!Array.isArray(sections)) {
                logDebug("Erreur: sections n'est pas un tableau", sections);
                return;
            }

            const container = document.createElement('div');
            container.innerHTML = `
            <style>
                .section-container {
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .option-container { 
                    display: flex; 
                    align-items: center;
                    margin: 8px 0;
                }
                .option-container input[type="checkbox"] {
                    height: 20px;
                    width: 20px;
                    border-radius: 30px;
                    margin-right: 10px;
                }
                 .active-btn {
                    background: ${textColor};
                    color: ${buttonColor};
                    border: 2px solid ${buttonColor};
                }
                .option-container label {
                    cursor: pointer; 
                    font-size: 0.9em;
                    border-radius: 5px;
                    padding: 6px;
                    color: ${textColor};
                    background-color: rgba(0, 0, 0, ${backgroundOpacity});
                    user-select: none;
                }
                .submit-btn {
                    background: ${buttonColor};
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    border: none;
                }
                .submit-btn:hover {
                    opacity: 0.8;
                }
                .title {
                    color: ${textColor} !important;
                }
            </style>
        `;

            logDebug("Conteneur HTML créé");

            sections.forEach((section, sectionIndex) => {
                const {maxSelect = 200} = section;
                const sectionDiv = document.createElement('div');
                sectionDiv.classList.add('section-container');
                sectionDiv.style.backgroundColor = section.color;

                const sectionLabel = document.createElement('h3');
                sectionLabel.classList.add('title');
                sectionLabel.textContent = section.label;
                sectionDiv.appendChild(sectionLabel);

                if (Array.isArray(section.options)) {
                    section.options.forEach(option => {
                        const optionDiv = document.createElement('div');
                        optionDiv.classList.add('option-container');
                        optionDiv.innerHTML = `
                            <input
                                type="${multiselect ? 'checkbox' : 'radio'}" 
                                style="display: ${multiselect ? 'block' : 'none'}" 
                                name="option-${index}" 
                                id="${section.label}-${option.name}-${option.action}-${section.id}" 
                            />
                            <label for="${section.label}-${option.name}-${option.action}-${section.id}">${option.name}</label>
                        `;

                        const input = optionDiv.querySelector(`input[type="${multiselect ? 'checkbox' : 'radio'}"]`);

                        input.addEventListener('change', () => {
                            updateTotalChecked();
                            const allCheckboxes = sectionDiv.querySelectorAll('input[type="checkbox"]');
                            const checkedCount = Array.from(allCheckboxes).filter(checkbox => checkbox.checked).length;

                            logDebug("Changement de sélection détecté", { 
                                option: option.name, 
                                checked: input.checked, 
                                checkedCount 
                            });

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
                                const selectedOption = {
                                    section: section.label,
                                    selections: [option.name],
                                };

                                input.labels[0].style.backgroundColor = textColor;
                                input.labels[0].style.color = buttonColor;

                                // Tester les différentes méthodes d'envoi
                                logDebug("Tentative d'envoi (mode radio)", { 
                                    selectedOption,
                                    runtimeExists: !!runtime,
                                    runtimeInteractExists: runtime && typeof runtime.interact === 'function',
                                    windowVoiceflowExists: !!window.voiceflow,
                                    windowVoiceflowChatExists: window.voiceflow && !!window.voiceflow.chat
                                });

                                // Méthode 1: Envoi d'un simple message texte avec le texte du bouton
                                try {
                                    if (runtime && typeof runtime.interact === 'function') {
                                        logDebug("Utilisation de runtime.interact avec type text", { option: option.name });
                                        runtime.interact({
                                            type: 'text',
                                            payload: {
                                                message: option.name
                                            }
                                        });
                                    } else if (window.voiceflow && window.voiceflow.chat) {
                                        logDebug("Utilisation de window.voiceflow.chat.interact avec type text", { option: option.name });
                                        window.voiceflow.chat.interact({
                                            type: 'text',
                                            payload: {
                                                message: option.name
                                            }
                                        });
                                    } else {
                                        logDebug("Aucune méthode d'interaction disponible");
                                    }
                                } catch (error) {
                                    logDebug("Erreur lors de l'envoi", { error: error.toString() });
                                }
                            }
                        });

                        sectionDiv.appendChild(optionDiv);
                    });
                } else {
                    logDebug("Erreur: options n'est pas un tableau dans la section", section);
                }

                container.appendChild(sectionDiv);
            });

            if (multiselect) {
                const buttonContainer = document.createElement('div');
                buttonContainer.setAttribute('data-index', index);
                buttonContainer.style.display = 'flex';
                buttonContainer.style.justifyContent = 'center';
                buttonContainer.style.gap = '10px';
                buttonContainer.style.marginTop = '20px';

                buttons.forEach(button => {
                    const buttonElement = document.createElement('button');
                    buttonElement.classList.add('submit-btn');
                    buttonElement.textContent = button.text;

                    buttonElement.addEventListener('click', () => {
                        logDebug("Bouton cliqué", { button: button.text, path: button.path });

                        const selectedOptions = sections.map((section, idx) => {
                            const sectionElement = container.querySelectorAll('.section-container')[idx];
                            const sectionSelections = Array.from(
                                sectionElement.querySelectorAll('input[type="checkbox"]:checked')
                            ).map(checkbox => checkbox.nextElementSibling.innerText);

                            return {section: section.label, selections: sectionSelections};
                        }).filter(section => section.selections.length > 0);

                        const currentContainer = container.querySelector(`[data-index="${index}"]`);
                        if (currentContainer) {
                            const allButtons = currentContainer.querySelectorAll('.submit-btn');
                            allButtons.forEach(btn => (btn.style.display = 'none'));
                        }

                        logDebug("Sélections à envoyer", { selectedOptions });

                        // Tester les différentes méthodes d'envoi
                        logDebug("Vérification des méthodes d'envoi disponibles", { 
                            runtimeExists: !!runtime,
                            runtimeInteractExists: runtime && typeof runtime.interact === 'function',
                            windowVoiceflowExists: !!window.voiceflow,
                            windowVoiceflowChatExists: window.voiceflow && !!window.voiceflow.chat
                        });

                        // Méthode 1: Envoi d'un simple message texte avec le texte du bouton
                        try {
                            if (runtime && typeof runtime.interact === 'function') {
                                logDebug("Utilisation de runtime.interact avec type text", { button: button.text });
                                runtime.interact({
                                    type: 'text',
                                    payload: {
                                        message: button.text
                                    }
                                });
                            } else if (window.voiceflow && window.voiceflow.chat) {
                                logDebug("Utilisation de window.voiceflow.chat.interact avec type text", { button: button.text });
                                window.voiceflow.chat.interact({
                                    type: 'text',
                                    payload: {
                                        message: button.text
                                    }
                                });
                            } else {
                                logDebug("Aucune méthode d'interaction disponible");
                            }
                        } catch (error) {
                            logDebug("Erreur lors de l'envoi", { error: error.toString(), stack: error.stack });
                        }
                    });

                    buttonContainer.appendChild(buttonElement);
                });

                container.appendChild(buttonContainer);
            }

            element.appendChild(container);
            
            // Stocker les logs dans une variable globale pour y accéder depuis Voiceflow
            if (typeof window !== 'undefined') {
                window.multiSelectLogs = log_details;
            }
            
            logDebug("Rendu du MultiSelect terminé");
            
        } catch (error) {
            console.error('Erreur lors du rendu de MultiSelect:', error);
            // En cas d'erreur, on essaie quand même de sauvegarder les logs
            if (typeof window !== 'undefined') {
                window.multiSelectLogs = window.multiSelectLogs || [];
                window.multiSelectLogs.push({
                    timestamp: new Date().toISOString(),
                    message: "Erreur fatale",
                    data: { error: error.toString(), stack: error.stack }
                });
            }
        }
    },
};
