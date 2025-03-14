export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900,
      calendlyToken = '',
    } = trace.payload || {};

    globalThis.voiceflow = globalThis.voiceflow || {};
    globalThis.voiceflow.last_event = globalThis.voiceflow.last_event || null;

    const log = (msg) => {
      console.log(msg);
      globalThis.voiceflow.log_details = (globalThis.voiceflow.log_details || '') + msg + '\n';
    };

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .vfrc-message--extension-Calendly,
      .vfrc-message--extension-Calendly .vfrc-bubble,
      .vfrc-message--extension-Calendly .vfrc-bubble-content,
      .vfrc-message--extension-Calendly .vfrc-message-content {
        width: 100%!important;
        max-width: 100%!important;
        margin:0!important;
        padding:0!important;
        box-sizing:border-box!important;
      }
    `;
    document.head.appendChild(styleEl);

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    element.appendChild(container);

    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({ url, parentElement: container });
      } else {
        setTimeout(initWidget, 100);
      }
    };

    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => log('Erreur chargement Calendly widget');
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    const parseEventUuid = (eventUri) => eventUri?.match(/scheduled_events\/([^/]+)/)?.[1] || '';

    window.addEventListener('message', async (e) => {
      if (e.data.event === 'calendly.event_scheduled') {
        log('Événement Calendly détecté.');
        
        const { event, invitee, event_type } = e.data.payload;
        const eventUuid = parseEventUuid(event.uri);
        const inviteeUri = invitee.uri;

        let inviteeName = invitee.name;
        let inviteeEmail = invitee.email;
        let startTime = event.start_time;

        if (calendlyToken && eventUuid && inviteeUri) {
          try {
            const res = await fetch(inviteeUri, {
              headers: {
                Authorization: `Bearer ${calendlyToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (res.ok) {
              const inviteeData = await res.json();
              inviteeName = inviteeData.resource.name || inviteeName;
              inviteeEmail = inviteeData.resource.email || inviteeEmail;
              log('Infos invité récupérées depuis API Calendly.');
            } else {
              log('Erreur récupération invité : ' + res.status);
            }
          } catch (error) {
            log('Erreur fetch API Calendly : ' + error.message);
          }
        } else {
          log('Token Calendly ou URIs manquants, pas d’appel API effectué.');
        }

        const rdvDate = new Date(startTime).toLocaleDateString('fr-FR');
        const rdvHeure = new Date(startTime).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const finalPayload = {
          eventUuid,
          inviteeName,
          inviteeEmail,
          eventName: event_type.name,
          startTime,
          rdvDate,
          rdvHeure,
        };

        globalThis.voiceflow.last_event = finalPayload; // Stocker globalement

        log('Payload final envoyé à Voiceflow : ' + JSON.stringify(finalPayload));

        window.voiceflow.chat.interact({
          type: 'calendly_event',
          payload: finalPayload,
        });
      }
    });
  },
};
