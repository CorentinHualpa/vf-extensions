export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Paramètres envoyés depuis Voiceflow
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900
    } = trace.payload || {};

    // Injecter du style pour occuper toute la largeur
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

    // Créer un conteneur Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    element.appendChild(container);

    // Ajuster la bulle Voiceflow après l'injection
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // Fonction d'init du widget Calendly inline
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

    // Charger le script Calendly si besoin
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // Écoute des événements Calendly
    const calendlyListener = (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;

      // On loggue le payload pour voir toutes les données
      console.log('[CalendlyExtension] event=', e.data.event, 'payload=', e.data.payload);

      // 1) Quand l’utilisateur sélectionne un créneau
      if (e.data.event === 'calendly.date_and_time_selected') {
        // => On envoie un événement "time_selected" à Voiceflow
        //    e.data.payload peut contenir la date/heure (selon Calendly)
        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: {
            event: 'time_selected',
            dateSelected: e.data.payload?.date || '',
            timeSelected: e.data.payload?.time || ''
            // Selon la doc Calendly, parfois c’est un champ "start_time"
          }
        });
      }

      // 2) Quand l’utilisateur confirme le rendez-vous
      if (e.data.event === 'calendly.event_scheduled') {
        // e.data.payload contient: event, event_type, invitee, uri, etc.
        window.removeEventListener('message', calendlyListener);

        const details = e.data.payload || {};
        // Exemples de champs : invitee.name, invitee.email, invitee.questions_and_answers
        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: {
            event: 'scheduled',
            startTime: details.event?.start_time || '',
            endTime: details.event?.end_time || '',
            eventName: details.event_type?.name || '',
            inviteeName: details.invitee?.name || '',
            inviteeEmail: details.invitee?.email || '',
            customAnswers: details.invitee?.questions_and_answers || [],
            uri: details.uri || ''
          }
        });
      }
    };
    window.addEventListener('message', calendlyListener);
  }
};
