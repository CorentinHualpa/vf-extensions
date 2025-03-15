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

    // 8. Formatage de date amélioré pour gérer les cas d'erreur
    function formatDateTime(dateStr) {
      try {
        // Vérifier si la date est valide
        if (!dateStr || dateStr === "undefined" || dateStr === "null") {
          console.warn("[CalendlyExtension] Date invalide reçue:", dateStr);
          return { date: "Date non disponible", time: "Heure non disponible", formatted: "Date et heure non disponibles" };
        }
        
        const dateObj = new Date(dateStr);
        
        // Vérifier si la date est valide après parsing
        if (isNaN(dateObj.getTime())) {
          console.warn("[CalendlyExtension] Date invalide après parsing:", dateStr);
          return { date: "Date non disponible", time: "Heure non disponible", formatted: "Date et heure non disponibles" };
        }
        
        // Formater la date et l'heure
        const formattedDate = dateObj.toLocaleDateString("fr-FR");
        const formattedTime = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
        
        return {
          date: formattedDate, 
          time: formattedTime,
          formatted: `${formattedDate} à ${formattedTime}`
        };
      } catch (e) {
        console.error("[CalendlyExtension] Erreur formatage date:", e, "Date reçue:", dateStr);
        return { date: "Date non disponible", time: "Heure non disponible", formatted: "Date et heure non disponibles" };
      }
    }

    // 9. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      console.log("[CalendlyExtension] Événement reçu :", e.data.event, e.data);
      const details = e.data.payload || {};
      
      // ÉTAPE 1: Date et heure sélectionnées
      if (e.data.event === 'calendly.date_and_time_selected') {
        console.log("[CalendlyExtension] Date et heure sélectionnées :", details);
        
        // Extraire les informations importantes
        const eventName = details.event_type?.name || 'Rendez-vous';
        let formattedDate = { formatted: "Date non disponible" };
        
        // Essayer de récupérer la date de plusieurs manières possibles
        if (details.event && details.event.start_time) {
          formattedDate = formatDateTime(details.event.start_time);
        } else if (details.start_time) {
          formattedDate = formatDateTime(details.start_time);
        } else if (details.invitee_start_time) {
          formattedDate = formatDateTime(details.invitee_start_time);
        } else {
          console.warn("[CalendlyExtension] Aucune date trouvée dans l'événement", details);
        }
        
        // Afficher les informations pour debug
        console.log("[CalendlyExtension] Informations de date extraites:", {
          eventName,
          formattedDate,
          rawDetails: details
        });
        
        // Stocker les informations
        window.calendlyData = {
          ...window.calendlyData,
          dateSelected: details.event?.start_time || details.start_time || "",
          timeSelected: formattedDate.time,
          dateTimeFormatted: formattedDate.formatted,
          dateCaptured: true,
          eventName: eventName
        };
        
        // Envoyer l'événement à Voiceflow
        const payload = `CALENDLY_DATE_SELECTED|${formattedDate.formatted}|${eventName}`;
        console.log("[CalendlyExtension] Envoi du payload à Voiceflow:", payload);
        
        window.voiceflow.chat.interact({
          type: 'text',
          payload: payload
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
        
        // Récupérer et formater la date
        let startTime = "";
        let formattedDate = { formatted: "Date non disponible" };
        
        if (details.event && details.event.start_time) {
          startTime = details.event.start_time;
          formattedDate = formatDateTime(startTime);
        } else if (window.calendlyData.dateSelected) {
          startTime = window.calendlyData.dateSelected;
          formattedDate = formatDateTime(startTime);
        } else if (details.scheduled_event && details.scheduled_event.start_time) {
          startTime = details.scheduled_event.start_time;
          formattedDate = formatDateTime(startTime);
        }
        
        // Utiliser la date formatée de l'étape 1 si disponible
        if (window.calendlyData.dateTimeFormatted && window.calendlyData.dateTimeFormatted !== "Date et heure non disponibles") {
          formattedDate.formatted = window.calendlyData.dateTimeFormatted;
        }
        
        // Mettre à jour les données globales
        window.calendlyData = {
          ...window.calendlyData,
          name: inviteeName,
          email: inviteeEmail,
          eventName: eventName,
          dateTimeFormatted: formattedDate.formatted,
          eventCompleted: true
        };
        
        // Afficher les informations complètes pour debug
        console.log("[CalendlyExtension] Informations finales:", window.calendlyData);
        
        // Construire le payload complet
        const finalPayload = {
          event: 'scheduled',
          eventUri,
          eventName,
          inviteeEmail,
          inviteeName,
          startTime,
          formattedDateTime: formattedDate.formatted
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
        const payload = `CALENDLY_CONFIRMED|${finalPayload.inviteeName}|${finalPayload.inviteeEmail}|${finalPayload.formattedDateTime}|${finalPayload.eventName}`;
        console.log("[CalendlyExtension] Envoi de la confirmation finale à Voiceflow:", payload);
        
        window.voiceflow.chat.interact({
          type: 'text',
          payload: payload
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
