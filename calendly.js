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
    
    // 2. Ajouter des styles pour assurer que l'élément prend toute la largeur
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

    // 3. Ajuster manuellement la largeur du message parent
    const adjustContainer = () => {
      // Trouver tous les parents possibles et ajuster leur largeur
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
        messageEl.style.margin = '0';
        messageEl.style.padding = '0';
      }
      
      const bubbleEl = element.closest('.vfrc-bubble');
      if (bubbleEl) {
        bubbleEl.style.width = '100%';
        bubbleEl.style.maxWidth = '100%';
        bubbleEl.style.margin = '0';
        bubbleEl.style.padding = '0';
      }
      
      const contentEl = element.closest('.vfrc-bubble-content, .vfrc-message-content');
      if (contentEl) {
        contentEl.style.width = '100%';
        contentEl.style.maxWidth = '100%';
        contentEl.style.margin = '0';
        contentEl.style.padding = '0';
      }
    };
    
    // Exécuter l'ajustement immédiatement et après un court délai
    adjustContainer();
    setTimeout(adjustContainer, 100);
    setTimeout(adjustContainer, 500); // Parfois nécessaire pour les éléments chargés lentement
    
    // 4. Créer un conteneur pour le widget
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

    // 5. Créer et ajouter une iframe Calendly directe
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

    // 6. Stocker les données de rendez-vous dans une variable globale
    window.calendlyData = {
      received: false,
      name: '',
      email: '',
      start: '',
      event_name: ''
    };

    // 7. Écouter les messages pour capturer l'événement Calendly
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
        
        // Stocker les données dans la variable globale
        window.calendlyData = {
          received: true,
          name: inviteeName,
          email: inviteeEmail,
          start: formattedDate,
          event_name: eventName
        };
        
        // Stocker aussi comme variables globales directes pour compatibilité
        window.rdv_name = inviteeName;
        window.rdv_mail = inviteeEmail;
        window.rdv_start = formattedDate;
        window.rdv_event_name = eventName;
        
        // Envoyer la confirmation à Voiceflow
        try {
          const payload = `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDate}|${eventName}`;
          console.log("Envoi du payload à Voiceflow:", payload);
          
          window.voiceflow.chat.interact({
            type: 'text',
            payload: payload
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
