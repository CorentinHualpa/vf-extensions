export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Récupérer les paramètres depuis le payload
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes?hide_event_type_details=1&hide_gdpr_banner=1',
      height = 900
    } = trace.payload || {};

    // Injecter des styles pour que la bulle Voiceflow occupe toute la largeur
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

    // Créer un conteneur pour Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden'; // Pour éviter la scrollbar interne
    container.style.boxSizing = 'border-box';
    element.appendChild(container);

    // Forcer la largeur du message dans Voiceflow
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // Fonction d'initialisation du widget Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url,
          parentElement: container
          // Vous pouvez ajouter ici "prefill" ou "utm" si besoin.
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
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // --------------- Gérer la capture des événements ----------------
    // On utilise une variable globale pour stocker temporairement la sélection (date/heure)
    window.lastCalendlySelection = {};

    const calendlyListener = (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      console.log('[CalendlyExtension] Événement reçu:', e.data.event, 'Payload:', e.data.payload);

      // Quand l'utilisateur sélectionne un créneau, on stocke localement (sans interagir avec Voiceflow)
      if (e.data.event === 'calendly.date_and_time_selected') {
        window.lastCalendlySelection = {
          dateSelected: e.data.payload?.date || '',
          timeSelected: e.data.payload?.time || '',
          rawPayload: e.data.payload
        };
        console.log('[CalendlyExtension] Sélection enregistrée:', window.lastCalendlySelection);
      }

      // Quand l'utilisateur confirme le rendez-vous, on envoie l'info à Voiceflow
      if (e.data.event === 'calendly.event_scheduled') {
        window.removeEventListener('message', calendlyListener);
        const details = e.data.payload || {};

        // Combiner les infos stockées (date/heure) avec les détails confirmés
        const scheduledPayload = {
          event: 'scheduled',
          // Priorité à l'info confirmée, sinon la sélection stockée
          startTime: details.event?.start_time || window.lastCalendlySelection.dateSelected || '',
          eventName: details.event_type?.name || '',
          inviteeName: details.invitee?.name || '',
          inviteeEmail: details.invitee?.email || '',
          customAnswers: details.invitee?.questions_and_answers || [],
          uri: details.uri || '',
          // On peut aussi transmettre ce qui avait été sélectionné
          dateSelected: window.lastCalendlySelection.dateSelected || '',
          timeSelected: window.lastCalendlySelection.timeSelected || ''
        };

        // Envoyer uniquement l'événement final à Voiceflow
        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: scheduledPayload
        });
      }
    };

    window.addEventListener('message', calendlyListener);
  }
};
