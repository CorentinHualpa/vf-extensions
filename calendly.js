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
      calendlyToken = '' // Votre token d'accès personnel Calendly
    } = trace.payload || {};

    // S'assurer que l'objet voiceflow et log_details existent
    globalThis.voiceflow = globalThis.voiceflow || {};
    globalThis.voiceflow.log_details = globalThis.voiceflow.log_details || "";
    const log = (msg) => {
      console.log(msg);
      globalThis.voiceflow.log_details += msg + "\n";
    };

    log("Extension Calendly initialisée avec URL = " + url + " et height = " + height);
    log("Token Calendly : " + calendlyToken);

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

    // 3. Créer un conteneur pour le widget Calendly
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

    // 5. Fonction d'initialisation du widget Calendly
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

    // 6. Charger le script Calendly s'il n'est pas déjà présent
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        log("Script Calendly chargé");
        initWidget();
      };
      script.onerror = () => log("Erreur de chargement du script Calendly");
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // 7. Fonction utilitaire pour extraire l'UUID depuis une URI Calendly
    function parseEventUuid(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    }

    // 8. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      log("[CalendlyExtension] Événement reçu : " + e.data.event);
      const details = e.data.payload || {};

      if (e.data.event === 'calendly.event_scheduled') {
        // Extraire l'event.uri pour obtenir l'UUID
        const eventUri = details.event?.uri;
        const eventUuid = parseEventUuid(eventUri);
        log("Event URI : " + eventUri);
        log("Event UUID extrait : " + eventUuid);

        // Construire un payload partiel avec les données déjà disponibles
        const finalPayload = {
          event: 'scheduled',
          eventUri,
          eventName: details.event_type?.name || 'Rendez-vous',
          inviteeEmail: details.invitee?.email || '',
          inviteeName: details.invitee?.name || '',
          startTime: details.event?.start_time || ''
        };

        // Si on a un token et un eventUuid, on va compléter via l'API Calendly
        if (calendlyToken && eventUuid && details.invitee?.uri) {
          log("Appel de l'API Calendly pour récupérer les informations de l'invité...");
          try {
            const inviteeRes = await fetch(
              details.invitee.uri, // On peut utiliser directement l'URI de l'invité
              {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              }
            );
            if (inviteeRes.ok) {
              const inviteeData = await inviteeRes.json();
              log("Réponse inviteeData : " + JSON.stringify(inviteeData));
              finalPayload.inviteeEmail = inviteeData.resource.email || finalPayload.inviteeEmail;
              finalPayload.inviteeName = inviteeData.resource.name || finalPayload.inviteeName;
            } else {
              log("Échec de la requête invitees : " + inviteeRes.status);
            }
          } catch (err) {
            log("Erreur appel Calendly API (invitee) : " + err);
          }
        } else {
          log("Token, eventUuid ou invitee URI manquant, appel API ignoré.");
        }

        // Conversion de startTime en date/heure lisibles
        let rdv_start = "Date/heure non renseignée";
        if (finalPayload.startTime) {
          const dateObj = new Date(finalPayload.startTime);
          const appointmentDate = dateObj.toLocaleDateString("fr-FR");
          const appointmentTime = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
          rdv_start = appointmentDate + " à " + appointmentTime;
        }
        
        // Définir les variables globales attendues
        rdv_name = finalPayload.inviteeName;
        rdv_mail = finalPayload.inviteeEmail;
        rdv_start = rdv_start;
        rdv_message = "Rendez-vous confirmé : " + finalPayload.eventName +
                      " avec " + rdv_name +
                      " (" + rdv_mail + ") pour le " + rdv_start;

        log("[CalendlyExtension] rdv_message = " + rdv_message);
        log("[CalendlyExtension] Final payload envoyé à Voiceflow : " + JSON.stringify(finalPayload));

        // Envoyer le payload final à Voiceflow
        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: finalPayload
        });
      }
    };

    window.addEventListener('message', calendlyListener);
  }
};
