// Variable globale pour accumuler les logs
let log_details = "";

// Fonction d'ajout de log
function addLog(message) {
  log_details += message + "\n";
  console.log(message);
}

try {
  let selection = "";

  // Vérifier la présence d'un payload dans last_event
  if (!last_event || !last_event.payload) {
    addLog("Aucun payload trouvé dans last_event.");
    path = "Fail";
  } else {
    // Si le payload est un objet structuré
    if (typeof last_event.payload === "object") {
      // Cas de saisie libre par l'utilisateur
      if (
        last_event.payload.isUserInput === true &&
        last_event.payload.userInput &&
        last_event.payload.userInput.trim() !== ""
      ) {
        addLog("Entrée utilisateur détectée: " + last_event.payload.userInput);
        selection = last_event.payload.userInput;
        path = last_event.payload.buttonPath || "Default";
      }
      // Cas d'une sélection simple (on utilise directement le HTML reçu)
      else if (
        last_event.payload.selection &&
        last_event.payload.selection.trim().toLowerCase() !== "sélectionner"
      ) {
        addLog("Sélection simple détectée: " + last_event.payload.selection);
        // *** On affecte directement le HTML tel quel ***
        selection = last_event.payload.selection;
        path = last_event.payload.buttonPath || "Default";
      }
      // Cas d'une sélection multiple
      else if (
        last_event.payload.selections &&
        Array.isArray(last_event.payload.selections) &&
        last_event.payload.selections.length > 0
      ) {
        addLog(
          "Sélections multiples détectées: " +
            JSON.stringify(last_event.payload.selections)
        );
        // On reconstruit une chaîne en gardant le HTML intact
        selection = last_event.payload.selections
          .map(s => {
            // si l’utilisateur a tapé du texte libre dans cette section,
            // on renvoie s.userInput, sinon on renvoie le tableau s.selections
            if (s.userInput && s.userInput.trim() !== "") {
              return s.userInput;
            }
            return s.selections.join(", ");
          })
          .filter(v => v)
          .join(" | ");
        if (
          last_event.payload.buttonText &&
          (last_event.payload.buttonText.includes("Revenir") ||
            last_event.payload.buttonText.includes("Return"))
        ) {
          path = "Previous_step";
        } else {
          path = last_event.payload.buttonPath || "Default";
        }
      }
      // Fallback : utiliser buttonText si ce n'est pas juste "Sélectionner"
      else if (
        last_event.payload.buttonText &&
        last_event.payload.buttonText.trim().toLowerCase() !== "sélectionner"
      ) {
        addLog(
          "Utilisation de buttonText comme sélection: " +
            last_event.payload.buttonText
        );
        selection = last_event.payload.buttonText;
        path = last_event.payload.buttonPath || "Default";
      }
    }
    // Si le payload est une chaîne simple
    else if (typeof last_event.payload === "string") {
      selection = last_event.payload;
      path = "Default";
    }

    // Autres fallbacks
    if (!selection && last_event && last_event.type === "text") {
      selection = last_event.payload || "";
      path = "Default";
    } else if (!selection && last_utterance) {
      selection = last_utterance;
      path = "Default";
    }

    // Nettoyer la sélection uniquement des espaces superflus, sans toucher au HTML
    if (selection) {
      selection = selection.trim();
    }

    // Si la sélection est un objet, on la convertit en chaîne JSON
    if (typeof selection === "object") {
      selection = JSON.stringify(selection);
    }

    addLog("Sélection capturée: " + selection);

    // Si la sélection est vide, c'est un échec
    if (!selection) {
      addLog("Aucune sélection valide capturée");
      path = "Fail";
    } else {
      // Sauvegarder la sélection pour la suite du flow
      usecase_selection = selection;

      // Détection d'un “retour en arrière”
      if (selection.includes("Revenir") || selection.includes("Return")) {
        addLog("Action de retour détectée");
        path = "Previous_step";
      }
    }
  }
} catch (error) {
  addLog("Erreur lors de la capture de la sélection: " + error);
  addLog("Détails de l'erreur: " + error.message);
  addLog(
    "Payload reçu: " +
      (last_event ? JSON.stringify(last_event.payload) : "undefined")
  );
  path = "Fail";
}
