export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  // On matche si le bloc a pour type "ext_calendly" ou payload.name "ext_calendly"
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Récupérer les paramètres avec des valeurs par défaut
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 700,
      minWidth = '320px',
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    // Créer un conteneur pour le widget Calendly
    const container = document.createElement('div');
    container.style.backgroundColor = backgroundColor;
    container.style.width = '100%';

    // Créer la div Calendly inline widget (inspirée du code embed officiel)
    const calendlyDiv = document.createElement('div');
    calendlyDiv.className = 'calendly-inline-widget';
    calendlyDiv.setAttribute('data-url', url);
    calendlyDiv.style.minWidth = minWidth;
    calendlyDiv.style.height = `${height}px`;

    container.appendChild(calendlyDiv);
    element.appendChild(container);

    // Attacher immédiatement un écouteur d'événements pour capter les messages Calendly
    const calendlyListener = (e) => {
      if (
        e.data &&
        typeof e.data === 'object' &&
        e.data.event &&
        e.data.event.indexOf('calendly') === 0
      ) {
        console.log('[CalendlyExtension] Message reçu :', e.data);
        if (e.data.event === 'calendly.event_scheduled') {
          // On retire l'écouteur pour éviter les appels multiples
          window.removeEventListener('message', calendlyListener);

          const eventDetails = e.data.payload || {};
          // Notifier Voiceflow que le rendez-vous est programmé
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              event: 'scheduled',
              uri: eventDetails.uri || '',
              inviteeUri: eventDetails.invitee ? eventDetails.invitee.uri : '',
              eventType: eventDetails.event_type ? eventDetails.event_type.name : '',
              eventDate: eventDetails.event ? eventDetails.event.start_time : ''
            }
          });
        }
      }
    };

    // Attache l'écouteur dès maintenant (avant que le widget ne soit chargé)
    window.addEventListener('message', calendlyListener);

    // Charger le script Calendly s'il n'est pas déjà présent
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }
};
