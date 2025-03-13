export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900
    } = trace.payload || {};

    // Style global pour la bulle
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

    // Conteneur
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    element.appendChild(container);

    setTimeout(() => {
      const messageElement = element.closest('.vfrc-message');
      if (messageElement) {
        messageElement.style.width = '100%';
        messageElement.style.maxWidth = '100%';
      }
    }, 0);

    // Initialisation Calendly
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
      if (e.data && typeof e.data === 'object' && e.data.event?.startsWith('calendly')) {
        console.log('[CalendlyExtension] Reçu:', e.data.event);

        // NE FAIT RIEN sur date_and_time_selected
        if (e.data.event === 'calendly.date_and_time_selected') {
          console.log('Créneau sélectionné, on attend la confirmation...');
        }

        // On envoie seulement l'événement final
        if (e.data.event === 'calendly.event_scheduled') {
          window.removeEventListener('message', calendlyListener);
          const details = e.data.payload || {};
          window.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: {
              event: 'scheduled',
              eventDate: details.event?.start_time || '',
              eventType: details.event_type?.name || '',
              inviteeUri: details.invitee?.uri || '',
              uri: details.uri || ''
            }
          });
        }
      }
    };
    window.addEventListener('message', calendlyListener);
  }
};
