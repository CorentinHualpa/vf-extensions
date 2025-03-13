export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Récupère l'URL Calendly et la hauteur voulue
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900
    } = trace.payload || {};

    // Injecte un style pour forcer la bulle Voiceflow à 100%
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

    // Crée un conteneur pour Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    element.appendChild(container);

    // Ajuste la largeur après l'injection
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // Fonction pour initialiser le widget Calendly inline
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

    // Écoute les événements Calendly, ignore tout sauf l'événement final
    const calendlyListener = (e) => {
      if (e.data && typeof e.data === 'object' && e.data.event) {
        // On log pour vérifier quel event arrive
        console.log('[CalendlyExtension] event=', e.data.event);

        // 1) NE RIEN FAIRE sur "date_and_time_selected"
        // ou tout autre event intermédiaire
        if (e.data.event === 'calendly.date_and_time_selected') {
          // Juste un log, pas d'appel à Voiceflow
          console.log('[CalendlyExtension] Créneau sélectionné (ignoré)');
          return;
        }

        // 2) Seule la confirmation "event_scheduled" envoie un message à Voiceflow
        if (e.data.event === 'calendly.event_scheduled') {
          // On supprime l'écouteur pour éviter double déclenchement
          window.removeEventListener('message', calendlyListener);

          const details = e.data.payload || {};
          console.log('[CalendlyExtension] Rendez-vous confirmé:', details);

          // (Optionnel) Vérifier si Calendly envoie parfois event_scheduled
          // avant la saisie d'email. Si c'est le cas, on peut tester :
          // if (!details.invitee?.email) return;

          // Envoi à Voiceflow
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
