(async () => {
  // Initialisation des variables globales
  globalThis.voiceflow = globalThis.voiceflow || {};
  globalThis.voiceflow.log_details = globalThis.voiceflow.log_details || "";

  // Fonction utilitaire pour logger et sauvegarder dans log_details
  function log(msg) {
    console.log(msg);
    globalThis.voiceflow.log_details += msg + "\n";
  }

  try {
    // 1. Chercher les données dans plusieurs sources possibles
    log("DEBUG: Vérification des sources de données Calendly...");
    
    // Source principale : l'événement last_event
    const last_event = globalThis.last_event || {};
    log("DEBUG: globalThis.last_event = " + JSON.stringify(last_event));
    
    // Source secondaire : les données stockées par l'extension
    const stored_event = globalThis.voiceflow.calendlyEventData || {};
    log("DEBUG: globalThis.voiceflow.calendlyEventData = " + JSON.stringify(stored_event));
    
    // Source tertiaire : la dernière sélection Calendly
    const last_selection = globalThis.voiceflow.lastCalendlySelection || {};
    log("DEBUG: globalThis.voiceflow.lastCalendlySelection = " + JSON.stringify(last_selection));
    
    // 2. Vérification que nous avons bien un rendez-vous
    if ((!last_event || !last_event.payload || last_event.payload.event !== 'scheduled') &&
        (!stored_event || !stored_event.event)) {
      throw new Error("Aucun rendez-vous confirmé détecté dans les sources disponibles.");
    }
    
    // 3. Extraction du payload - priorité à l'événement puis aux données stockées
    const payload = last_event.payload || stored_event || {};
    log("DEBUG: Payload final utilisé = " + JSON.stringify(payload));
    
    // 4. Extraction des URIs pour les appels API éventuels
    const eventUri = payload.eventUri || payload.uri || "";
    const inviteeUri = payload.inviteeUri || "";
    log("DEBUG: eventUri = " + eventUri);
    log("DEBUG: inviteeUri = " + inviteeUri);
    
    // 5. Extraction des informations de base depuis le payload combiné
    // Nom du rendez-vous / type d'événement
    let rdv_name = payload.eventName ||
                  payload.eventType ||
                  (payload.event_type && payload.event_type.name) ||
                  (payload.scheduled_event && payload.scheduled_event.event_type && payload.scheduled_event.event_type.name) ||
                  "Nom non renseigné";
    
    // Email de l'invité
    let rdv_mail = payload.inviteeEmail ||
                  (payload.invitee && payload.invitee.email) ||
                  (payload.scheduled_event && payload.scheduled_event.invitee && payload.scheduled_event.invitee.email) ||
                  "Email non renseigné";
    
    // Nom de l'invité
    let rdv_contact_name = payload.inviteeName ||
                          (payload.invitee && payload.invitee.name) ||
                          (payload.scheduled_event && payload.scheduled_event.invitee && payload.scheduled_event.invitee.name) ||
                          "Nom non renseigné";
    
    // Raison du rendez-vous
    let rdv_reason = payload.reason || "";
    
    // Si pas de raison mais que nous avons des questions/réponses, cherchons dedans
    if (!rdv_reason && payload.inviteeQuestions && Array.isArray(payload.inviteeQuestions)) {
      const reasonQuestion = payload.inviteeQuestions.find(
        qa => qa.question.toLowerCase().includes('raison') || 
              qa.question.toLowerCase().includes('motif') ||
              qa.question.toLowerCase().includes('pourquoi')
      );
      
      if (reasonQuestion) {
        rdv_reason = reasonQuestion.answer || "";
      }
    }
    
    if (!rdv_reason) {
      rdv_reason = "Raison non précisée";
    }
    
    // Date et heure du rendez-vous
    let startTime = payload.startTime ||
                   payload.dateSelected ||
                   (payload.scheduled_event && payload.scheduled_event.start_time) ||
                   (last_selection && last_selection.dateSelected) ||
                   "";
    
    log("DEBUG: rdv_name = " + rdv_name);
    log("DEBUG: rdv_mail = " + rdv_mail);
    log("DEBUG: rdv_contact_name = " + rdv_contact_name);
    log("DEBUG: rdv_reason = " + rdv_reason);
    log("DEBUG: startTime = " + startTime);
    
    // 6. Récupération du token Calendly depuis les sources disponibles
    // La variable trace n'est pas disponible dans ce contexte, on utilise uniquement la variable globale
    const calendlyToken = globalThis.voiceflow.calendlyToken || "";
    
    // 7. Appels API Calendly si nécessaire pour compléter les informations manquantes
    if (calendlyToken) {
      log("DEBUG: Token Calendly disponible, tentative de compléter les informations...");
      
      // Appel pour l'invité si on a son URI et qu'il nous manque des informations
      if (inviteeUri && (rdv_contact_name === "Nom non renseigné" || rdv_mail === "Email non renseigné" || rdv_reason === "Raison non précisée")) {
        try {
          log("DEBUG: Appel API pour les détails de l'invité...");
          const inviteeRes = await fetch(inviteeUri, {
            headers: {
              "Authorization": "Bearer " + calendlyToken,
              "Content-Type": "application/json"
            }
          });
          
          if (inviteeRes.ok) {
            const inviteeData = await inviteeRes.json();
            log("DEBUG: Réponse inviteeData = " + JSON.stringify(inviteeData));
            
            if (inviteeData.resource) {
              // Mise à jour du nom et email si disponibles
              if (rdv_contact_name === "Nom non renseigné") {
                rdv_contact_name = inviteeData.resource.name || rdv_contact_name;
              }
              
              if (rdv_mail === "Email non renseigné") {
                rdv_mail = inviteeData.resource.email || rdv_mail;
              }
              
              // Recherche de la raison dans les questions/réponses
              if (rdv_reason === "Raison non précisée" && 
                  inviteeData.resource.questions_and_answers && 
                  Array.isArray(inviteeData.resource.questions_and_answers)) {
                
                const reasonQuestion = inviteeData.resource.questions_and_answers.find(
                  qa => qa.question.toLowerCase().includes('raison') || 
                        qa.question.toLowerCase().includes('motif') ||
                        qa.question.toLowerCase().includes('pourquoi')
                );
                
                if (reasonQuestion) {
                  rdv_reason = reasonQuestion.answer || rdv_reason;
                }
              }
            }
          } else {
            log("WARN: Échec de la requête invitee: " + inviteeRes.status);
          }
        } catch (err) {
          log("ERROR: Erreur appel API invitee: " + err.message);
        }
      }
      
      // Appel pour l'événement si on a son UUID et qu'il nous manque des informations
      if (eventUri && (!startTime || rdv_name === "Nom non renseigné")) {
        try {
          const eventUuid = eventUri.match(/scheduled_events\/([^\/]+)/);
          
          if (eventUuid && eventUuid[1]) {
            log("DEBUG: Appel API pour les détails de l'événement...");
            const eventRes = await fetch(`https://api.calendly.com/scheduled_events/${eventUuid[1]}`, {
              headers: {
                "Authorization": "Bearer " + calendlyToken,
                "Content-Type": "application/json"
              }
            });
            
            if (eventRes.ok) {
              const eventData = await eventRes.json();
              log("DEBUG: Réponse eventData = " + JSON.stringify(eventData));
              
              if (eventData.resource) {
                // Mise à jour du type d'événement si manquant
                if (rdv_name === "Nom non renseigné" && eventData.resource.event_type_name) {
                  rdv_name = eventData.resource.event_type_name;
                }
                
                // Mise à jour de la date/heure si manquante
                if (!startTime && eventData.resource.start_time) {
                  startTime = eventData.resource.start_time;
                }
              }
            } else {
              log("WARN: Échec de la requête event: " + eventRes.status);
            }
          }
        } catch (err) {
          log("ERROR: Erreur appel API event: " + err.message);
        }
      }
    } else {
      log("DEBUG: Aucun token Calendly disponible pour les appels API.");
    }
    
    // 8. Conversion de startTime en date et heure lisibles
    let rdv_start = "Date/heure non renseignée";
    
    if (startTime) {
      try {
        const dateObj = new Date(startTime);
        const appointmentDate = dateObj.toLocaleDateString("fr-FR", {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        const appointmentTime = dateObj.toLocaleTimeString("fr-FR", { 
          hour: '2-digit', 
          minute: '2-digit'
        });
        rdv_start = appointmentDate + " à " + appointmentTime;
      } catch (err) {
        log("WARN: Erreur lors de la conversion de la date: " + err.message);
      }
    }
    
    // 9. Création du message récapitulatif
    rdv_message = "Rendez-vous confirmé : " + rdv_name +
                  " avec " + rdv_contact_name +
                  " (" + rdv_mail + ")" +
                  " pour le " + rdv_start +
                  (rdv_reason ? "\nRaison du rendez-vous : " + rdv_reason : "");
    
    // 10. Stockage des informations dans des variables globales pour Voiceflow
    globalThis.rdv_name = rdv_name;
    globalThis.rdv_mail = rdv_mail;
    globalThis.rdv_contact_name = rdv_contact_name;
    globalThis.rdv_reason = rdv_reason;
    globalThis.rdv_datetime = rdv_start;
    globalThis.rdv_timestamp = startTime;
    
    log("[Voiceflow] rdv_message = " + rdv_message);
  } catch (error) {
    console.error("Erreur dans le bloc de capture Calendly:", error);
    rdv_message = "Erreur dans la capture du rendez-vous :\n" +
                  "Message d'erreur : " + error.message + "\n" +
                  "Stack trace : " + (error.stack || "Aucune stack disponible");
    log("Erreur dans le bloc de capture Calendly: " + error.message);
  }
})();
