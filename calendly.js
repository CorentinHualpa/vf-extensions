// Fonction utilitaire pour reconnaître les événements Calendly
function isCalendlyEvent(e) {
  return e.origin === "https://calendly.com" 
    && e.data 
    && e.data.event 
    && e.data.event.indexOf("calendly.") === 0;
}

// Gestionnaire d'événement pour les messages Calendly
function handleCalendlyMessage(e) {
  if (!isCalendlyEvent(e)) return;  // Ignore les messages non Calendly

  const calendlyEvent = e.data.event;
  const payload = e.data.payload || {};

  try {
    switch (calendlyEvent) {
      case "calendly.date_and_time_selected":
        console.log("[Calendly] Date et heure séléctionnées ▶", payload);
        // Ici, vous pouvez éventuellement traiter la sélection (ex: afficher un récapitulatif à l'utilisateur).
        break;
      case "calendly.event_scheduled":
        console.log("[Calendly] Rendez-vous confirmé ▶", payload);
        // Envoi d’un événement personnalisé à Voiceflow pour signaler la confirmation du rendez-vous.
        if (window.voiceflow && window.voiceflow.chat) {
          window.voiceflow.chat.interact({
            type: "event",
            payload: { event: { name: "appointment_booked", data: payload } }
          }).catch(err => {
            console.error("[Calendly] Échec de transmission à Voiceflow:", err);
          });
        }
        break;
      default:
        // Autres événements Calendly potentiels (profile view, etc.)
        console.log("[Calendly] Événement capturé ▶", calendlyEvent, payload);
        break;
    }
  } catch (err) {
    console.error("[Calendly] Erreur lors du traitement de l'événement:", calendlyEvent, err);
  }
}

// Installation de l'écouteur dès que l’iframe Calendly est chargé
window.addEventListener("message", handleCalendlyMessage, false);
