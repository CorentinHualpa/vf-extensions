export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // On récupère les paramètres, en laissant par défaut une grande hauteur
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      // Mets la hauteur que tu veux, ex. 900 ou 1000 pour éviter le scroll
      height = 900,
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    // 1) Injecter un peu de CSS pour que la bulle Voiceflow fasse 100 % de largeur
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Forcer la bulle du chat à occuper 100% */
      .vfrc-message--extension-Calendly,
      .vfrc-message--extension-Calendly .vfrc-bubble,
      .vfrc-message--extension-Calendly .vfrc-bubble-content {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(styleElement);

    // 2) Créer un conteneur pour Calendly (100% de large, grande hauteur)
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.backgroundColor = backgroundColor;
    container.style.overflow = 'hidden'; // évite la barre de scroll
    element.appendChild(container);

    // 3) Fonction d'init du widget Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container,
          // Si tu veux pré-remplir, tu peux ajouter:
          // prefill: { name: 'John Doe', email: 'john@doe.com' },
        });
      } else {
        // Réessaye si le script Calendly n'est pas encore prêt
        setTimeout(initWidget, 100);
      }
    };

    // 4) Charger le script Calendly s'il n'est pas déjà présent
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

    // 5) (Facultatif) Écouter l’événement "calendly.event_scheduled" pour Voiceflow
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
          // Envoyer la complétion à Voiceflow
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              event: 'scheduled',
              uri: eventDetails.uri || '',
              inviteeUri: eventDetails.invitee?.uri || '',
              eventType: eventDetails.event_type?.name || '',
              eventDate: eventDetails.event?.start_time || ''
            }
          });
        }
      }
    };
    window.addEventListener('message', calendlyListener);
  }
};
