export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // S'assurer que l'objet global voiceflow existe
    globalThis.voiceflow = globalThis.voiceflow || {};
    globalThis.voiceflow.log_details = globalThis.voiceflow.log_details || "";

    const log = (msg) => {
      console.log(msg);
      globalThis.voiceflow.log_details += msg + "\n";
    };

    try {
      const {
        url = 'https://calendly.com/corentin-hualpa/echange-30-minutes?hide_event_type_details=1&hide_gdpr_banner=1',
        height = 900
      } = trace.payload || {};

      log("CalendlyExtension: Initialisation avec URL = " + url + " et height = " + height);

      // Injection des styles pour forcer l'affichage sur 100%
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
      container.style.overflow = 'hidden';
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

      // Charger le script Calendly si nécessaire
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

      // Initialiser une variable globale pour stocker la sélection temporaire
      globalThis.lastCalendlySelection = {};

      // Écoute des événements Calendly
      const calendlyListener = (e) => {
        if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
        if (!e.data.event.startsWith('calendly')) return;

        log("CalendlyExtension: Événement reçu : " + e.data.event);
        log("CalendlyExtension: Payload reçu : " + JSON.stringify(e.data.payload));

        if (e.data.event === 'calendly.date_and_time_selected') {
          globalThis.lastCalendlySelection = {
            dateSelected: e.data.payload?.date || '',
            timeSelected: e.data.payload?.time || '',
            rawPayload: e.data.payload
          };
          log("CalendlyExtension: Sélection temporaire enregistrée : " + JSON.stringify(globalThis.lastCalendlySelection));
        }

        if (e.data.event === 'calendly.event_scheduled') {
          globalThis.removeEventListener('message', calendlyListener);
          const details = e.data.payload || {};
          const finalPayload = {
            event: 'scheduled',
            startTime: details.event?.start_time || globalThis.lastCalendlySelection.dateSelected || '',
            eventName: details.event_type?.name || '',
            inviteeName: details.invitee?.name || '',
            inviteeEmail: details.invitee?.email || '',
            customAnswers: details.invitee?.questions_and_answers || [],
            uri: details.uri || '',
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
