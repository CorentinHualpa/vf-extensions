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
            
            // Créer un container principal
            const container = document.createElement('div');
            container.classList.add('multiselect-container');
            
            // Ajouter les styles
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .multiselect-container .section-container {
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .multiselect-container .option-container { 
                    display: flex; 
                    align-items: center;
                    margin: 8px 0;
                }
                .multiselect-container .option-container input[type="checkbox"] {
                    height: 20px;
                    width: 20px;
                    border-radius: 30px;
                    margin-right: 10px;
                }
                .multiselect-container .active-btn {
                    background: ${textColor};
                    color: ${buttonColor};
                    border: 2px solid ${buttonColor};
                }
                .multiselect-container .option-container label {
                    cursor: pointer; 
                    font-size: 0.9em;
                    border-radius: 5px;
                    padding: 6px;
                    color: ${textColor};
                    background-color: rgba(0, 0, 0, ${backgroundOpacity});
                    user-select: none;
                }
                .multiselect-container .submit-btn {
                    background: ${buttonColor};
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    border: none;
                }
                .multiselect-container .submit-btn:hover {
                    opacity: 0.8;
                }
                .multiselect-container .title {
                    color: ${textColor} !important;
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
                        sectionLabel: section.querySelector('h3').textContent,
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
                                        span.style.color = 'red';
                                        span.style.marginLeft = '10px';
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
                        }
                    });
                }
            };

            // Création des sections avec les options
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
                        
                        const input = document.createElement('input');
                        input.type = multiselect ? 'checkbox' : 'radio';
                        input.style.display = multiselect ? 'block' : 'none';
                        input.name = `option-${index}`;
                        input.id = `${section.label}-${option.name}-${option.action}-${section.id || ''}`;
                        
                        const label = document.createElement('label');
                        label.setAttribute('for', input.id);
                        label.textContent = option.name;
                        
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
                                
                                const selectedOption = {
                                    section: section.label,
                                    selections: [option.name]
                                };

                                // Approche simplifiée qui fonctionne avec vos autres extensions
                                console.log("Envoi de sélection simple:", selectedOption);
                                window.voiceflow.chat.interact({
                                    type: 'text',
                                    payload: option.name
                                });
                            }
                        });

                        sectionDiv.appendChild(optionDiv);
                    });
                }

                container.appendChild(sectionDiv);
            });

            // Si `multiselect` est vrai, ajoutez les boutons
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
                            if (!sectionElement) return null;
                            
                            const sectionSelections = Array.from(
                                sectionElement.querySelectorAll('input[type="checkbox"]:checked')
                            ).map(checkbox => checkbox.nextElementSibling.innerText);

                            return {
                                section: section.label, 
                                selections: sectionSelections
                            };
                        }).filter(section => section && section.selections.length > 0);

                        // Masquer tous les boutons après sélection
                        buttonContainer.querySelectorAll('.submit-btn').forEach(btn => {
                            btn.style.display = 'none';
                        });
                        
                        // Utiliser le même format simpliste que FormExtension
                        console.log("Envoi des sélections:", selectedOptions);
                        window.voiceflow.chat.interact({
                            type: 'text',
                            payload: button.text
                        });
                    });

                    buttonContainer.appendChild(buttonElement);
                });

                container.appendChild(buttonContainer);
            }

            element.appendChild(container);
            console.log("Rendu MultiSelect terminé");
            
        } catch (error) {
            console.error('Erreur lors du rendu de MultiSelect:', error);
        }
    },
};
