// ==========================================
// SCRIPT DE CAPTURE CALENDLY
// ==========================================

try {
    // 1. INITIALISATION DES VARIABLES
    // -------------------------------
    let rdv_name = "";                // Nom de l'invité
    let rdv_mail = "";                // Email de l'invité
    let rdv_start = "";               // Date et heure du rendez-vous
    let rdv_reason = "";              // Raison du rendez-vous
    let rdv_message = "";             // Message récapitulatif
    let rdv_event_name = "Rendez-vous"; // Type de rendez-vous par défaut
    
    // 2. RÉCUPÉRATION DE LA RÉPONSE
    // ----------------------------
    
    // Vérifier d'abord last_event.payload
    let selectionRaw = '';
    if (last_event && last_event.type === 'text' && last_event.payload) {
        selectionRaw = last_event.payload;
        console.log("Payload trouvé dans last_event:", selectionRaw);
    } 
    // Fallback sur last_utterance si nécessaire
    else if (last_utterance) {
        selectionRaw = last_utterance;
        console.log("Utilisation de last_utterance:", selectionRaw);
    }
    
    // 3. TRAITEMENT DE LA RÉPONSE CALENDLY
    // -----------------------------------
    
    // Vérifier si c'est bien une confirmation Calendly
    if (selectionRaw.startsWith('CALENDLY_CONFIRMED')) {
        console.log("Confirmation Calendly détectée");
        
        // Découper la chaîne aux séparateurs |
        const parts = selectionRaw.split('|');
        
        // Extraire les données
        if (parts.length > 1) rdv_name = parts[1] || "";
        if (parts.length > 2) rdv_mail = parts[2] || "";
        if (parts.length > 3) rdv_start = parts[3] || "";
        if (parts.length > 4) rdv_event_name = parts[4] || "Rendez-vous";
        
        console.log("Données extraites:");
        console.log("- Nom:", rdv_name);
        console.log("- Email:", rdv_mail);
        console.log("- Date:", rdv_start);
        console.log("- Événement:", rdv_event_name);
    } else {
        console.log("Ce n'est pas une confirmation Calendly:", selectionRaw);
    }
    
    // 4. CONSTRUCTION DU MESSAGE
    // -------------------------
    
    // Construire le message de confirmation
    rdv_message = `Rendez-vous ${rdv_event_name} confirmé`;
    
    if (rdv_name) {
        rdv_message += ` avec ${rdv_name}`;
        if (rdv_mail) {
            rdv_message += ` (${rdv_mail})`;
        }
    }
    
    if (rdv_start) {
        rdv_message += ` pour le ${rdv_start}`;
    }
    
    if (rdv_reason) {
        rdv_message += `. Motif: ${rdv_reason}`;
    }
    
    // Préparation des valeurs par défaut si non définies
    rdv_name = rdv_name || "Non renseigné";
    rdv_mail = rdv_mail || "Non renseigné";
    rdv_start = rdv_start || "Non renseigné";
    rdv_reason = rdv_reason || "";
    
    // 5. RETOUR DES VARIABLES
    // ----------------------
    
    console.log("Résultat final:");
    console.log("- rdv_name:", rdv_name);
    console.log("- rdv_mail:", rdv_mail);
    console.log("- rdv_start:", rdv_start);
    console.log("- rdv_message:", rdv_message);
    
    // Retourner toutes les variables
    return {
        rdv_name,
        rdv_mail,
        rdv_start,
        rdv_reason,
        rdv_message,
        rdv_event_name
    };
    
} catch (error) {
    console.error("Erreur lors de la capture Calendly:", error);
    
    // En cas d'erreur, retourner des valeurs par défaut
    return {
        rdv_name: "Non renseigné",
        rdv_mail: "Non renseigné",
        rdv_start: "Non renseigné",
        rdv_reason: "",
        rdv_message: "Une erreur est survenue lors de la récupération des informations du rendez-vous: " + error.message,
        error: error.message
    };
}
