export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // 1) Injecter du style global pour forcer la bulle à 100%
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
      /* Forcer la bulle Calendly à 100% de largeur, sans marge/padding */
      .vfrc-message--extension-Calendly,
      .vfrc-message--extension-Calendly .vfrc-bubble {
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      /* S'assurer que le contenu interne prend toute la largeur */
      .vfrc-message--extension-Calendly .vfrc-bubble-content {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }

      /* Forcer le message-content à 100% également */
      .vfrc-message--extension-Calendly .vfrc-message-content {
        width: 100% !important;
        max-width: 100% !important;
      }

      /* Enfin, la classe globale de la bulle */
      .vfrc-message.vfrc-message--extension-Calendly {
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
    document.head.appendChild(globalStyle);

    // 2) Récupérer les paramètres
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900,              // Grande hauteur pour éviter la scrollbar
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    // 3) Créer un conteneur pour Calendly, 100% large, overflow hidden
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.height = `${height}px`;
    container.style.backgroundColor = backgroundColor;
    container.style.overflow = 'hidden'; // pas de scrollbar
    container.style.boxSizing = 'border-box';
    element.appendChild(container);

    // 4) Forcer après coup la largeur du message
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

    // 5) Fonction d'init du widget Calendly (initInlineWidget)
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container,
          // ex: prefill: { name: 'John Doe', email: 'john@doe.com' }
        });
      } else {
        // Le script Calendly peut ne pas être prêt, on retente
        setTimeout(initWidget, 100);
      }
    };

    // 6) Charger le script Calendly s'il n'est pas déjà là
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

    // 7) (Facultatif) Écouter "calendly.event_scheduled" pour Voiceflow
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
