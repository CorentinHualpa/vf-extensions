// Code à mettre dans votre bloc JavaScript Voiceflow
try {
    let responseData;
    
    // Déterminer si le payload est une chaîne JSON ou déjà un objet
    if (typeof last_event.payload === 'string') {
        try {
            // Tenter de parser la chaîne JSON
            responseData = JSON.parse(last_event.payload);
        } catch (parseError) {
            console.error("Erreur lors du parsing JSON:", parseError);
            responseData = { success: false, error: "Format JSON invalide" };
        }
    } else {
        // Le payload est déjà un objet
        responseData = last_event.payload;
    }
    
    // Extraire et traiter les URLs
    if (responseData && responseData.success && responseData.urls) {
        // Convertir les URLs en chaîne JSON pour stocker dans pdf_link
        pdf_link = JSON.stringify(responseData.urls);
        
        // Gestion du tableau pdf_linkS (s'il existe déjà)
        if (!pdf_linkS || !Array.isArray(pdf_linkS)) {
            // Initialiser pdf_linkS comme un tableau avec le premier élément
            pdf_linkS = [pdf_link];
        } else if (pdf_linkS.length === 0) {
            // Ajouter au tableau vide
            pdf_linkS.push(pdf_link);
        } else {
            // Ajouter à un tableau existant
            let currentArray;
            
            // Vérifier si pdf_linkS est une chaîne ou un tableau
            if (typeof pdf_linkS === 'string') {
                try {
                    currentArray = JSON.parse(pdf_linkS);
                } catch (e) {
                    currentArray = [];
                }
            } else {
                currentArray = pdf_linkS;
            }
            
            // S'assurer que c'est bien un tableau
            if (!Array.isArray(currentArray)) {
                currentArray = [];
            }
            
            // Ajouter le nouveau lien et mettre à jour pdf_linkS
            currentArray.push(pdf_link);
            pdf_linkS = currentArray;
        }
    } else {
        // En cas d'absence de données ou d'erreur
        pdf_link = "[]";
        console.error("Données manquantes ou erreur:", responseData);
    }
} catch (globalError) {
    // Gestion des erreurs globales
    console.error("Erreur globale:", globalError);
    pdf_link = "[]";
    pdf_linkS = pdf_linkS || [];
}

// Afficher des informations de débogage dans la console
console.log("pdf_link:", pdf_link);
console.log("pdf_linkS:", pdf_linkS);
