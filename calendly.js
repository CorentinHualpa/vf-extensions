export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  // On matche si le bloc a pour type "ext_calendly" ou payload.name "ext_calendly"
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Récupérer les paramètres depuis le payload (avec des valeurs par défaut)
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 700,
      minWidth = '320px',
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    // Créer un conteneur pour accueillir le widget Calendly
    const container = document.createElement('div');
    container.style.backgroundColor = backgroundColor;
    container.style.minWidth = minWidth;
    container.style.height = `${height}px`;
    // On peut ajouter d'autres styles si besoin (margin, border, etc.)
    element.appendChild(container);

    // Fonction qui initialise l'embed inline Calendly dans le conteneur
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container,
          // Vous pouvez ajouter ici d'éventuels paramètres de prefill ou utm, par exemple :
          // prefill: { name: 'John Doe', email: 'john.doe@example.com' },
          // utm: { utm_campaign: 'myCampaign', utm_source: 'mySource' }
        });
      } else {
        // Si le script Calendly n'est pas encore chargé, on réessaie après 100ms
        setTimeout(initWidget, 100);
      }
    };

    // Charger le script Calendly s'il n'est pas déjà présent
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        initWidget();
      };
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // Optionnel : attacher un écouteur d'événements pour capter par exemple l'événement "calendly.event_scheduled"
    const calendlyListener = (e) => {
      if (
        e.data &&
        typeof e.data === 'object' &&
        e.data.event &&
        e.data.event.indexOf('calendly') === 0
      ) {
        console.log('[CalendlyExtension] Message reçu :', e.data);
        if (e.data.event === 'calendly.event_scheduled') {
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

    window.addEventListener('message', calendlyListener);
  }
};
