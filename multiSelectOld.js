// Modifier la partie du payload dans l'extension MultiSelect
// (Cherchez la section qui gère les boutons)

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
    const payloadData = {
        count: selectedOptions.reduce((sum, section) => sum + section.selections.length, 0),
        selections: selectedOptions,
        path: button.path || 'Default'  // POINT CRUCIAL: Inclure explicitement le chemin
    };
    
    // IMPORTANT: Convertir en JSON string comme dans l'exemple fonctionnel
    const payloadString = JSON.stringify(payloadData);
    console.log("Payload envoyé:", payloadString);
    
    // Envoyer avec le payload au format chaîne JSON
    window.voiceflow.chat.interact({
        type: 'complete',
        payload: payloadString
    });
});
