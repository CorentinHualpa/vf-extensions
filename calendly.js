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
      calendlyToken = '' // Token d'accès personnel
    } = trace.payload || {};

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
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // 5. Fonction d'init Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url,
          parentElement: container
        });
      } else {
        setTimeout(initWidget, 100);
      }
    };

    // 6. Charger le script Calendly si nécessaire
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => initWidget();
      script.onerror = () => console.warn("Erreur de chargement Calendly");
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // 7. Fonction utilitaire pour extraire l'UUID depuis l'URI Calendly
    function parseEventUuid(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    }

    // 8. Stockage global pour les sélections Calendly
    if (!window.voiceflow) {
      window.voiceflow = {};
    }
    
    // 9. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      console.log("[CalendlyExtension] Événement reçu :", e.data.event, e.data);
      const details = e.data.payload || {};

      // Stocker la dernière sélection Calendly globalement
      window.voiceflow.lastCalendlySelection = details;
      
      // Lorsqu'un créneau est confirmé
      if (e.data.event === 'calendly.event_scheduled') {
        // Extraire l'event.uri pour obtenir l'UUID
        const eventUri = details.event?.uri || details.uri; 
        const eventUuid = parseEventUuid(eventUri);
        const inviteeUri = details.invitee?.uri;

        // Construire un payload de base
        const finalPayload = {
          event: 'scheduled',
          eventUri: eventUri,
          inviteeUri: inviteeUri,
          eventName: details.event_type?.name || 'Rendez-vous',
          inviteeEmail: details.invitee?.email || '',
          inviteeName: details.invitee?.name || '',
          inviteeQuestions: details.questions_and_answers || [],
          startTime: details.event?.start_time || details.scheduled_event?.start_time || '',
          endTime: details.event?.end_time || details.scheduled_event?.end_time || '',
          eventType: details.event_type?.name || '',
          reason: '',
          location: details.event?.location?.location || 'En ligne'
        };
        
        // Extraction de la raison du rendez-vous depuis les questions/réponses
        if (Array.isArray(details.questions_and_answers)) {
          const reasonQuestion = details.questions_and_answers.find(
            qa => qa.question.toLowerCase().includes('raison') || 
                  qa.question.toLowerCase().includes('motif') ||
                  qa.question.toLowerCase().includes('pourquoi')
          );
          
          if (reasonQuestion) {
            finalPayload.reason = reasonQuestion.answer || '';
          }
        }

        // 10. Si on a un token et un eventUuid, on va appeler l'API Calendly
        if (calendlyToken) {
          // Sauvegarder l'accès au token pour le script de capture
          window.voiceflow.calendlyToken = calendlyToken;
          
          console.log("[CalendlyExtension] Token Calendly disponible");
          
          // Si on a l'URI de l'invité, on récupère ses informations
          if (inviteeUri) {
            console.log("[CalendlyExtension] Appel Calendly API pour les détails de l'invité...");
            try {
              const inviteeRes = await fetch(inviteeUri, {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (inviteeRes.ok) {
                const inviteeData = await inviteeRes.json();
                console.log("[CalendlyExtension] Données invité récupérées:", inviteeData);
                
                // Mise à jour avec les données fraîches de l'API
                if (inviteeData.resource) {
                  finalPayload.inviteeEmail = inviteeData.resource.email || finalPayload.inviteeEmail;
                  finalPayload.inviteeName = inviteeData.resource.name || finalPayload.inviteeName;
                  
                  // Récupération des questions/réponses si disponibles
                  if (Array.isArray(inviteeData.resource.questions_and_answers)) {
                    finalPayload.inviteeQuestions = inviteeData.resource.questions_and_answers;
                    
                    // Chercher à nouveau la raison
                    const reasonQuestion = inviteeData.resource.questions_and_answers.find(
                      qa => qa.question.toLowerCase().includes('raison') || 
                            qa.question.toLowerCase().includes('motif') ||
                            qa.question.toLowerCase().includes('pourquoi')
                    );
                    
                    if (reasonQuestion) {
                      finalPayload.reason = reasonQuestion.answer || finalPayload.reason;
                    }
                  }
                }
              } else {
                console.warn("[CalendlyExtension] Échec de la requête invitee:", inviteeRes.status);
              }
            } catch (err) {
              console.error("[CalendlyExtension] Erreur appel API invitee:", err);
            }
          }
          
          // Si on a l'UUID de l'événement, on récupère ses détails
          if (eventUuid) {
            console.log("[CalendlyExtension] Appel Calendly API pour les détails de l'événement...");
            try {
              const eventRes = await fetch(`https://api.calendly.com/scheduled_events/${eventUuid}`, {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (eventRes.ok) {
                const eventData = await eventRes.json();
                console.log("[CalendlyExtension] Données événement récupérées:", eventData);
                
                // Mise à jour avec les données fraîches de l'API
                if (eventData.resource) {
                  finalPayload.startTime = eventData.resource.start_time || finalPayload.startTime;
                  finalPayload.endTime = eventData.resource.end_time || finalPayload.endTime;
                  finalPayload.location = eventData.resource.location?.location || finalPayload.location;
                  
                  // Récupérer le nom de l'event type si disponible
                  if (eventData.resource.event_type) {
                    finalPayload.eventType = eventData.resource.event_type;
                  }
                }
              } else {
                console.warn("[CalendlyExtension] Échec de la requête event:", eventRes.status);
              }
            } catch (err) {
              console.error("[CalendlyExtension] Erreur appel API event:", err);
            }
          }
        } else {
          console.log("[CalendlyExtension] Aucun token Calendly disponible.");
        }

        // 11. Stocker les informations pour le bloc de capture
        window.voiceflow.calendlyEventData = finalPayload;
        
        // 12. Envoyer le payload final à Voiceflow
        console.log("[CalendlyExtension] Rendez-vous confirmé. Payload final:", finalPayload);
        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: finalPayload
        });
      }
    };

    window.addEventListener('message', calendlyListener);
    
    // Nettoyer l'événement quand le composant est détruit
    return () => {
      window.removeEventListener('message', calendlyListener);
    };
  }
};
