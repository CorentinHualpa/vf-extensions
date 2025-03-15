export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // 1. Récupérer les paramètres
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900,
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    console.log("Extension Calendly initialisée");
    
    // 2. Créer un conteneur pour le widget
    const container = document.createElement('div');
    container.id = 'calendly-container-' + Date.now();
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    container.style.border = '1px solid #e2e8f0';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = backgroundColor;
    
    // Ajouter le conteneur à l'élément
    element.appendChild(container);

    // 3. Créer et ajouter une iframe Calendly directe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'camera; microphone; fullscreen; clipboard-read; clipboard-write;';
    iframe.setAttribute('loading', 'lazy');
    container.appendChild(iframe);

    // 4. Écouter les messages pour capturer l'événement Calendly
    const messageListener = event => {
      // Vérifier si c'est un événement Calendly
      if (event.data && event.data.event && event.data.event === 'calendly.event_scheduled') {
        console.log("Rendez-vous Calendly détecté !", event.data);
        
        // Extraire les informations du rendez-vous
        const eventData = event.data.payload || {};
        const inviteeName = eventData.invitee?.name || '';
        const inviteeEmail = eventData.invitee?.email || '';
        const eventName = eventData.event_type?.name || 'Rendez-vous';
        
        // Formater la date
        let formattedDate = '';
        if (eventData.event && eventData.event.start_time) {
          try {
            const date = new Date(eventData.event.start_time);
            formattedDate = date.toLocaleDateString('fr-FR') + ' à ' + 
                            date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
          } catch (e) {
            console.error("Erreur de formatage de date:", e);
            formattedDate = "Date non disponible";
          }
        }
        
        // Envoyer la confirmation à Voiceflow
        try {
          window.voiceflow.chat.interact({
            type: 'text',
            payload: `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDate}|${eventName}`
          });
          console.log("Confirmation envoyée à Voiceflow");
        } catch (error) {
          console.error("Erreur lors de l'envoi à Voiceflow:", error);
        }
      }
    };
    
    // Ajouter l'écouteur d'événements
    window.addEventListener('message', messageListener);
    
    // Retourner une fonction de nettoyage
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }
};
