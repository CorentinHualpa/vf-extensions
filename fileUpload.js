try {
    // On tente de parser le texte reçu comme du JSON
    response = JSON.parse(last_event.payload);
    pdf_link = response.urls ? JSON.stringify(response.urls) : "[]";
} catch (error) {
    // Si ce n'est pas du JSON valide, on initialise avec des valeurs par défaut
    console.error("Erreur de parsing JSON:", error);
    response = { success: false };
    pdf_link = "[]";
}

// Vérifie si pdf_linkS existe déjà et contient des données sous forme de tableau
if (!pdf_linkS || !Array.isArray(pdf_linkS)) {
    // Si pdf_linkS n'existe pas ou n'est pas un tableau
    pdf_linkS = [pdf_link];  // On garde le tableau sans stringification
} else if (pdf_linkS.length === 0) {
    // Si pdf_linkS est un tableau vide
    pdf_linkS.push(pdf_link);  // On ajoute simplement l'élément
} else {
    // Si pdf_linkS est un tableau non vide
    // On vérifie d'abord s'il est déjà sous forme de chaîne
    let currentArray;
    if (typeof pdf_linkS === 'string') {
        try {
            currentArray = JSON.parse(pdf_linkS);
        } catch (e) {
            currentArray = [];
        }
    } else {
        currentArray = pdf_linkS;
    }
    // On s'assure que currentArray est bien un tableau
    if (!Array.isArray(currentArray)) {
        currentArray = [];
    }
    // On ajoute le nouveau pdf_link
    currentArray.push(pdf_link);
    
    // On met à jour pdf_linkS avec le tableau (sans stringification)
    pdf_linkS = currentArray;
}
