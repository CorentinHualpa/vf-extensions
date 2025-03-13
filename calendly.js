export const CalendlyExtension = {
  // 1) Nom interne de l'extension (affiché dans la console, par ex.)
  name: 'Calendly',

  // 2) Type "response" pour afficher quelque chose dans le chat
  type: 'response',

  // 3) On matche "ext_calendly" pour être cohérent avec les autres extensions 
  //    (ex: "ext_map", "ext_video", etc.). Si tu préfères un autre nom, tu peux changer.
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload.name === 'ext_calendly',

  // 4) La fonction qui construit et insère l'iframe Calendly dans le chat
  render: ({ trace, element }) => {
    // Récupérer les paramètres depuis le payload
    const {
      url = 'https://calendly.com/ton-compte',
      height = 650,
      width = '100%',
      backgroundColor = '#ffffff',
      textColor = '#333333',
      primaryColor = '#3A87AD',
      hideCookieBanner = true,
      hideEventTypeDetails = false,
      hideGdprBanner = true,
      hidePrerequisiteBanner = true,
    } = trace.payload || {};

    // Conteneur principal
    const container = document.createElement('div');
    container.style.backgroundColor = backgroundColor;
    container.style.color = textColor;
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.borderRadius = '8px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    container.style.margin = '8px 0';

    // Spinner de chargement
    const spinner = document.createElement('div');
    spinner.style.display = 'flex';
    spinner.style.justifyContent = 'center';
    spinner.style.alignItems = 'center';
    spinner.style.height = '80px';
    spinner.innerHTML = `
      <div style="width:24px; height:24px; border:4px solid rgba(0,0,0,0.1); 
                  border-left-color:${primaryColor}; border-radius:50%; 
                  animation: spin 1s linear infinite;"></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    container.appendChild(spinner);

    // Construire l'URL Calendly avec les paramètres
    let calendlyUrl = url;
    if (calendlyUrl.indexOf('?') === -1) {
      calendlyUrl += '?';
    } else {
      calendlyUrl += '&';
    }
    calendlyUrl += `hide_gdpr_banner=${hideGdprBanner}`;
    calendlyUrl += `&hide_cookie_banner=${hideCookieBanner}`;
    calendlyUrl += `&hide_event_type_details=${hideEventTypeDetails}`;
    calendlyUrl += `&hide_prerequisite_banner=${hidePrerequisiteBanner}`;
    calendlyUrl += `&primary_color=${encodeURIComponent(primaryColor.replace('#', ''))}`;
    calendlyUrl += `&background_color=${encodeURIComponent(backgroundColor.replace('#', ''))}`;
    calendlyUrl += `&text_color=${encodeURIComponent(textColor.replace('#', ''))}`;

    // Créer l'iframe
    const iframe = document.createElement('iframe');
    iframe.src = calendlyUrl;
    iframe.style.width = width;
    iframe.style.height = `${height}px`;
    iframe.style.border = 'none';
    iframe.style.display = 'none'; // on le cache jusqu'au "load"

    // Quand l'iframe a fini de charger, on cache le spinner et on l'affiche
    iframe.addEventListener('load', () => {
      spinner.style.display = 'none';
      iframe.style.display = 'block';
    });

    container.appendChild(iframe);
    element.appendChild(container);

    // Charger le script Calendly pour écouter les events (facultatif)
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;

    script.onload = () => {
      // Sur écoute "postMessage" pour détecter calendly.event_scheduled
      window.addEventListener('message', (e) => {
        if (e.data.event && e.data.event.indexOf('calendly') === 0) {
          console.log('[CalendlyExtension] Event reçu:', e.data.event);

          if (e.data.event === 'calendly.event_scheduled') {
            // Rendez-vous programmé
            const eventDetails = e.data.payload;
            console.log('[CalendlyExtension] Rendez-vous:', eventDetails);

            // Notifier Voiceflow (facultatif)
            window.voiceflow.chat.interact({
              type: 'calendly_event',
              payload: {
                event: 'scheduled',
                uri: eventDetails.uri,
                inviteeUri: eventDetails.invitee.uri,
                eventType: eventDetails.event_type.name,
                eventDate: eventDetails.event.start_time
              }
            });
          }
        }
      });
    };

    document.head.appendChild(script);
  },
};
