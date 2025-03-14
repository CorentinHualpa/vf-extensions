export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Initialiser globalThis.voiceflow et log_details si nécessaire
    globalThis.voiceflow = globalThis.voiceflow || {};
    globalThis.voiceflow.log_details = globalThis.voiceflow.log_details || "";
    const log = (msg) => {
      console.log(msg);
      globalThis.voiceflow.log_details += msg + "\n";
    };

    try {
      // Récupérer les paramètres envoyés depuis Voiceflow
      const {
        url = 'https://calendly.com/corentin-hualpa/echange-30-minutes?hide_event_type_details=1&hide_gdpr_banner=1',
        height = 900
      } = trace.payload || {};

      log("CalendlyExtension: Initialisation avec URL = " + url + " et height = " + height);

      // Injecter les styles pour forcer la bulle à occuper 100%
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

      // Créer un conteneur pour le widget Calendly
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = `${height}px`;
      container.style.overflow = 'hidden'; // pour éviter la scrollbar interne
      container.style.boxSizing = 'border-box';
      element.appendChild(container);

      // Ajuster la largeur de la bulle Voiceflow
      setTimeout(() => {
        const messageEl = element.closest('.vfrc-message');
        if (messageEl) {
          messageEl.style.width = '100%';
          messageEl.style.maxWidth = '100%';
        }
      }, 0);

      // Fonction pour initialiser le widget Calendly en mode inline
      const initWidget = () => {
        if (globalThis.Calendly && typeof globalThis.Calendly.initInlineWidget === 'function') {
          log("CalendlyExtension: Appel de Calendly.initInlineWidget");
          globalThis.Calendly.initInlineWidget({
            url,
            parentElement: container
          });
        } else {
          setTimeout(initWidget, 100);
        }
      };

      // Charger le script Calendly s'il n'est pas déjà présent
      if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          log("CalendlyExtension: Script Calendly chargé");
          initWidget();
        };
        script.onerror = () => {
          log("CalendlyExtension: Erreur de chargement du script Calendly");
        };
        document.head.appendChild(script);
      } else {
        initWidget();
      }

      // Stocker la sélection temporaire dans globalThis.lastCalendlySelection
      globalThis.lastCalendlySelection = {};

      // Écouter les événements Calendly via postMessage
      const calendlyListener = (e) => {
        if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
        if (!e.data.event.startsWith('calendly')) return;

        log("CalendlyExtension: Événement reçu : " + e.data.event);
        log("CalendlyExtension: Payload reçu : " + JSON.stringify(e.data.payload));

        // Lorsque l'utilisateur sélectionne un créneau (avant confirmation)
        if (e.data.event === 'calendly.date_and_time_selected') {
          globalThis.lastCalendlySelection = {
            dateSelected: e.data.payload?.date || '',
            timeSelected: e.data.payload?.time || '',
            rawPayload: e.data.payload
          };
          log("CalendlyExtension: Sélection temporaire enregistrée : " + JSON.stringify(globalThis.lastCalendlySelection));
        }

        // Lorsque l'utilisateur confirme le rendez-vous
        if (e.data.event === 'calendly.event_scheduled') {
          globalThis.removeEventListener('message', calendlyListener);
          const details = e.data.payload || {};
          // Construction du payload final en se basant sur la doc Calendly API
          const finalPayload = {
            event: 'scheduled',
            rdv_name: details.name || "Rendez-vous",       // Le nom de l'événement
            rdv_start: details.start_time || globalThis.lastCalendlySelection.dateSelected || '',
            rdv_invitee: (details.event_memberships && details.event_memberships[0] && details.event_memberships[0].user_name) || '',
            rdv_mail: (details.event_memberships && details.event_memberships[0] && details.event_memberships[0].user_email) || '',
            rdv_uri: details.uri || '',
            dateSelected: globalThis.lastCalendlySelection.dateSelected || '',
            timeSelected: globalThis.lastCalendlySelection.timeSelected || ''
          };
          log("CalendlyExtension: Rendez-vous confirmé. Payload final : " + JSON.stringify(finalPayload));
          globalThis.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: finalPayload
          });
        }
      };

      globalThis.addEventListener('message', calendlyListener);
    } catch (err) {
      console.error("CalendlyExtension: Erreur :", err);
      globalThis.voiceflow.log_details += "CalendlyExtension: Erreur : " + err.message + "\n";
    }
  }
};
