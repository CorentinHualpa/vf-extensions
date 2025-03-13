export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // 1) Injecter des styles pour forcer la bulle à occuper toute la largeur
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
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
    document.head.appendChild(globalStyle);

    // 2) Récupérer les paramètres (défaut avec masquage des détails d'événement et bannière GDPR)
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes?hide_event_type_details=1&hide_gdpr_banner=1',
      height = 900,
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    // 3) Créer un conteneur pour le widget Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.height = `${height}px`;  // Adaptez cette valeur pour éviter le scroll interne
    container.style.backgroundColor = backgroundColor;
    container.style.overflow = 'hidden'; // pas de scrollbar interne
    container.style.boxSizing = 'border-box';
    element.appendChild(container);

    // 4) Forcer la largeur de la bulle Voiceflow
    setTimeout(() => {
      const messageElement = element.closest('.vfrc-message');
      if (messageElement) {
        messageElement.style.width = '100%';
        messageElement.style.maxWidth = '100%';
        const bubbleContent = messageElement.querySelector('.vfrc-bubble-content');
        if (bubbleContent) {
          bubbleContent.style.width = '100%';
          bubbleContent.style.maxWidth = '100%';
        }
      }
    }, 0);

    // 5) Fonction d'initialisation du widget Calendly en mode inline
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container
          // Vous pouvez ajouter ici "prefill" ou "utm" si nécessaire
        });
      } else {
        setTimeout(initWidget, 100);
      }
    };

    // 6) Charger le script Calendly s'il n'est pas déjà présent
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // 7) Écouter les événements Calendly via window.postMessage
    const calendlyListener = (e) => {
      if (e.data && typeof e.data === 'object' && e.data.event && e.data.event.indexOf('calendly') === 0) {
        console.log('[CalendlyExtension] Event reçu:', e.data.event, e.data.payload);

        // Lorsque l'utilisateur sélectionne une date/heure (avant confirmation)
        if (e.data.event === 'calendly.date_and_time_selected') {
          window.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: {
              action: 'time_selected',
              details: e.data.payload
            }
          });
        }

        // Lorsque l'utilisateur confirme et planifie le rendez-vous
        if (e.data.event === 'calendly.event_scheduled') {
          window.removeEventListener('message', calendlyListener);
          const payload = e.data.payload || {};
          window.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: {
              action: 'event_scheduled',
              uri: payload.uri || '',
              inviteeUri: payload.invitee ? payload.invitee.uri : '',
              eventType: payload.event_type ? payload.event_type.name : '',
              eventDate: payload.event ? payload.event.start_time : ''
            }
          });
        }
      }
    };
    window.addEventListener('message', calendlyListener);
  }
};
