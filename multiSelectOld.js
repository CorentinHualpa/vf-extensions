export const MultiSelect = {
    name: 'MultiSelect',
    type: 'response',
    match: ({trace}) => {
        return trace.payload && trace.type === 'multi_select';
    },
    render: ({trace, element}) => {
        try {
            // Création d'un écouteur d'événements pour détecter les saisies textuelles
            const messageListener = (event) => {
                if (event && event.detail && event.detail.type === 'user-message') {
                    console.log('Saisie utilisateur détectée:', event.detail.payload.message);
                    
                    // Envoyer immédiatement un payload spécial pour gérer la saisie de texte
                    window.voiceflow.chat.interact({
                        type: 'complete',
                        payload: {
                            userTextInput: event.detail.payload.message,
                            path: 'Fail'  // Chemin explicite pour les saisies textuelles
                        }
                    });
                }
            };
            
            // Ajouter l'écouteur au document
            document.addEventListener('vfrc:message', messageListener);
            
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

                if (totalMaxSelect > 0 && totalChecked >= totalMaxSelect) {
                    Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(checkbox => {
                        if (!checkbox.checked) {
                            checkbox.disabled = true;
                        }
                    });
                } else {
                    Array.from(container.querySelectorAll('.section-container')).forEach((section, sectionIndex) => {
                        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
                        const uncheckedCheckboxes = Array.from(checkboxes).filter(checkbox => !checkbox.checked);

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
                console.error('Erreur : `sections` n\'est pas un tableau', sections);
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
                                window.voiceflow.chat.interact({
                                    type: 'complete',
                                    payload: {
                                        count: 1,
                                        selections: [selectedOption],
                                        path: 'Default'  // Chemin par défaut pour les sélections uniques
                                    }
                                });
                            }
                        });

                        sectionDiv.appendChild(optionDiv);
                    });
                } else {
                    console.error('Erreur : `options` n\'est pas un tableau dans la section', section);
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
                        const selectedOptions = sections.map((section, idx) => {
                            const sectionElement = container.querySelectorAll('.section-container')[idx];
                            const sectionSelections = Array.from(
                                sectionElement.querySelectorAll('input[type="checkbox"]:checked')
                            ).map(checkbox => checkbox.nextElementSibling.innerText);

                            return {section: section.label, selections: sectionSelections};
                        }).filter(section => section.selections.length > 0);

                        // Utiliser OBJECT pour le payload au lieu de JSON
                        const jsonPayload = {
                            count: selectedOptions.reduce((sum, section) => sum + section.selections.length, 0),
                            selections: selectedOptions,
                            path: button.path
                        };

                        const currentContainer = container.querySelector(`[data-index="${index}"]`);
                        if (currentContainer) {
                            const allButtons = currentContainer.querySelectorAll('.submit-btn');
                            allButtons.forEach(btn => (btn.style.display = 'none'));
                        } else {
                            console.error(`Conteneur avec data-index="${index}" introuvable.`);
                        }

                        window.voiceflow.chat.interact({
                            type: 'complete',
                            payload: jsonPayload  // Envoyer l'objet directement, pas de JSON.stringify
                        });
                    });

                    buttonContainer.appendChild(buttonElement);
                });

                container.appendChild(buttonContainer);
            }

            element.appendChild(container);
            
            // Retourner une fonction de nettoyage pour supprimer l'écouteur
            return () => {
                document.removeEventListener('vfrc:message', messageListener);
            };
        } catch (error) {
            console.error('Erreur lors du rendu de MultiSelect:', error);
        }
    },
};
