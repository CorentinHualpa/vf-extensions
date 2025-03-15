export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // 1. Récupérer les paramètres depuis le bloc Voiceflow
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900,
      calendlyToken = '' // Votre token d'accès personnel
    } = trace.payload || {};

    // Variables globales pour stocker les informations de rendez-vous
    window.calendlyData = {
      dateSelected: '',
      timeSelected: '',
      dateTimeFormatted: '',
      name: '',
      email: '',
      eventName: '',
      eventType: '',
      eventCompleted: false,
      dateCaptured: false
    };

    console.log("[CalendlyExtension] Initialisation avec URL:", url);

    // 2. Injections de styles pour l'affichage
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .vfrc-message--extension-Calendly,
      .vfrc-message--extension-Calendly .vfrc-bubble,
      .vfrc-message--extension-Calendly .vfrc-bubble-content,
      .vfrc-message--extension-Calendly .vfrc-message-content,
      .vfrc-message.vfrc-message--extension-Calendly {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(styleEl);

    // 3. Créer un conteneur pour Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    element.appendChild(container);

    // 4. Ajuster la largeur de la bulle Voiceflow
    const adjustWidth = () => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
      
      const bubbleEl = element.closest('.vfrc-bubble');
      if (bubbleEl) {
        bubbleEl.style.width = '100%';
        bubbleEl.style.maxWidth = '100%';
      }
      
      const contentEl = element.closest('.vfrc-bubble-content, .vfrc-message-content');
      if (contentEl) {
        contentEl.style.width = '100%';
        contentEl.style.maxWidth = '100%';
      }
    };
    
    // Exécuter plusieurs fois pour s'assurer que ça prend effet
    adjustWidth();
    setTimeout(adjustWidth, 100);
    setTimeout(adjustWidth, 500);

    // 5. Fonction d'init Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url,
          parentElement: container
        });
        console.log("[CalendlyExtension] Widget initialisé avec succès");
      } else {
        setTimeout(initWidget, 100);
      }
    };

    // 6. Charger le script Calendly si nécessaire
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        console.log("[CalendlyExtension] Script Calendly chargé");
        initWidget();
      };
      script.onerror = () => console.warn("[CalendlyExtension] Erreur de chargement Calendly");
      document.head.appendChild(script);
    } else {
      console.log("[CalendlyExtension] Script Calendly déjà présent");
      initWidget();
    }

    // 7. Fonction utilitaire pour extraire l'UUID depuis l'URI Calendly
    function parseEventUuid(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    }

    // 8. Formatage de date
    function formatDateTime(dateStr) {
      try {
        const dateObj = new Date(dateStr);
        return {
          date: dateObj.toLocaleDateString("fr-FR"), 
          time: dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
          formatted: dateObj.toLocaleDateString("fr-FR") + " à " + 
                    dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
        };
      } catch (e) {
        console.error("[CalendlyExtension] Erreur formatage date:", e);
        return { date: "", time: "", formatted: "" };
      }
    }

    // 9. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      console.log("[CalendlyExtension] Événement reçu :", e.data.event);
      const details = e.data.payload || {};
      
      // ÉTAPE 1: Date et heure sélectionnées
      if (e.data.event === 'calendly.date_and_time_selected') {
        console.log("[CalendlyExtension] Date et heure sélectionnées :", details);
        
        // Extraire et formater la date/heure
        const startTime = details.event?.start_time || "";
        const formattedDate = formatDateTime(startTime);
        
        // Stocker les informations
        window.calendlyData.dateSelected = startTime;
        window.calendlyData.timeSelected = formattedDate.time;
        window.calendlyData.dateTimeFormatted = formattedDate.formatted;
        window.calendlyData.dateCaptured = true;
        window.calendlyData.eventName = details.event_type?.name || 'Rendez-vous';
        
        console.log("[CalendlyExtension] Date formatée:", formattedDate.formatted);
        
        // Envoyer l'événement à Voiceflow
        window.voiceflow.chat.interact({
          type: 'text',
          payload: `CALENDLY_DATE_SELECTED|${formattedDate.formatted}|${window.calendlyData.eventName}`
        });
        
        console.log("[CalendlyExtension] Notification de date envoyée à Voiceflow");
      }
      
      // ÉTAPE 2: Rendez-vous complet avec informations de contact
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("[CalendlyExtension] Rendez-vous programmé:", details);
        
        // Extraire les informations de base
        const eventUri = details.event?.uri; 
        const eventUuid = parseEventUuid(eventUri);
        const inviteeName = details.invitee?.name || '';
        const inviteeEmail = details.invitee?.email || '';
        const eventName = details.event_type?.name || 'Rendez-vous';
        const startTime = details.event?.start_time || window.calendlyData.dateSelected || '';
        const formattedDate = formatDateTime(startTime).formatted || window.calendlyData.dateTimeFormatted;
        
        // Mettre à jour les données globales
        window.calendlyData.name = inviteeName;
        window.calendlyData.email = inviteeEmail;
        window.calendlyData.eventName = eventName;
        window.calendlyData.dateTimeFormatted = formattedDate;
        window.calendlyData.eventCompleted = true;
        
        // Construire le payload complet
        const finalPayload = {
          event: 'scheduled',
          eventUri,
          eventName,
          inviteeEmail,
          inviteeName,
          startTime,
          formattedDateTime: formattedDate
        };

        // Si on a un token, essayer d'obtenir plus d'informations
        if (calendlyToken && eventUuid) {
          console.log("[CalendlyExtension] Appel Calendly API...");
          try {
            const inviteeRes = await fetch(
              `https://api.calendly.com/scheduled_events/${eventUuid}/invitees`,
              {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              }
            );
            if (inviteeRes.ok) {
              const inviteeData = await inviteeRes.json();
              if (inviteeData.collection && inviteeData.collection.length > 0) {
                const firstInvitee = inviteeData.collection[0];
                finalPayload.inviteeEmail = firstInvitee.email || finalPayload.inviteeEmail;
                finalPayload.inviteeName = firstInvitee.name || finalPayload.inviteeName;
                
                // Mettre à jour les données globales
                window.calendlyData.name = finalPayload.inviteeName;
                window.calendlyData.email = finalPayload.inviteeEmail;
              }
            }
          } catch (err) {
            console.error("[CalendlyExtension] Erreur API Calendly:", err);
          }
        }

        // Envoyer le payload à Voiceflow
        console.log("[CalendlyExtension] Envoi de la confirmation finale à Voiceflow");
        window.voiceflow.chat.interact({
          type: 'text',
          payload: `CALENDLY_CONFIRMED|${finalPayload.inviteeName}|${finalPayload.inviteeEmail}|${finalPayload.formattedDateTime}|${finalPayload.eventName}`
        });
      }
    };

    window.addEventListener('message', calendlyListener);
    
    // Retourner la fonction de nettoyage
    return () => {
      window.removeEventListener('message', calendlyListener);
    };
  }
};
