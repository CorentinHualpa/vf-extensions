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
      calendlyToken = '' // Ton token d'accès personnel
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
    //    (ex: "https://api.calendly.com/scheduled_events/ABC123" => "ABC123")
    function parseEventUuid(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\\/([^\\/]+)/);
      return match ? match[1] : null;
    }

    // 8. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      console.log("[CalendlyExtension] Événement reçu :", e.data.event);
      const details = e.data.payload || {};

      // Lorsqu'un créneau est confirmé
      if (e.data.event === 'calendly.event_scheduled') {
        // Extraire l'event.uri pour obtenir l'UUID
        const eventUri = details.event?.uri; 
        const eventUuid = parseEventUuid(eventUri);

        // Construire un payload partiel
        const finalPayload = {
          event: 'scheduled',
          eventUri,
          eventName: details.event_type?.name || 'Rendez-vous',
          inviteeEmail: details.invitee?.email || '',
          inviteeName: details.invitee?.name || '',
          startTime: details.event?.start_time || ''
        };

        // 9. Si on a un token et un eventUuid, on va appeler l'API Calendly
        if (calendlyToken && eventUuid) {
          console.log("[CalendlyExtension] Appel Calendly API pour lister les invitees...");
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
              // On prend le premier invitee (s'il y en a un)
              if (inviteeData.collection && inviteeData.collection.length > 0) {
                const firstInvitee = inviteeData.collection[0];
                finalPayload.inviteeEmail = firstInvitee.email || finalPayload.inviteeEmail;
                finalPayload.inviteeName = firstInvitee.name || finalPayload.inviteeName;
                // On pourrait récupérer d'autres champs (first_name, last_name, questions_and_answers, etc.)
              }
            } else {
              console.warn("Échec de la requête invitees:", inviteeRes.status);
            }
          } catch (err) {
            console.error("Erreur appel Calendly API:", err);
          }
        }

        // 10. Envoyer le payload final à Voiceflow
        console.log("[CalendlyExtension] Rendez-vous confirmé. Payload final :", finalPayload);
        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: finalPayload
        });
      }
    };

    window.addEventListener('message', calendlyListener);
  }
};
