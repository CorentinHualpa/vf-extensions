export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // 1. Récupérer les paramètres depuis le bloc Voiceflow
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 900,
      calendlyToken = '',
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    console.log("Extension Calendly initialisée");
    
    // 2. Injections de styles pour l'affichage
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

    // 3. Ajuster la largeur de la bulle Voiceflow
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // 4. Créer un conteneur pour le widget
    const container = document.createElement('div');
    container.id = 'calendly-container-' + Date.now();
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    container.style.border = '1px solid #e2e8f0';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = backgroundColor || '#ffffff';
    
    // Ajouter le conteneur à l'élément fourni par Voiceflow
    element.appendChild(container);

    // 5. Charger le script Calendly et initialiser le widget
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      console.log("Chargement du script Calendly...");
      
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        console.log("Script Calendly chargé, initialisation du widget");
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container
        });
      };
      document.head.appendChild(script);
    } else {
      console.log("Script Calendly déjà chargé, initialisation du widget");
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: container
      });
    }

    // 6. Fonction pour formater la date
    function formatDateTime(dateStr) {
      try {
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString("fr-FR") + 
               " à " + 
               dateObj.toLocaleTimeString("fr-FR", { 
                 hour: '2-digit', 
                 minute: '2-digit' 
               });
      } catch (error) {
        console.error("Erreur formatage date:", error);
        return dateStr;
      }
    }

    // 7. Écouter les événements de Calendly
    const calendlyListener = (e) => {
      // Vérifier que c'est bien un événement Calendly
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;
      
      console.log("Événement Calendly reçu:", e.data.event);
      
      // Traiter l'événement de prise de rendez-vous
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("Rendez-vous programmé détecté!");
        
        // Extraire les données de l'événement
        const eventData = e.data.payload || {};
        
        // Extraire les informations principales
        const inviteeName = eventData.invitee?.name || '';
        const inviteeEmail = eventData.invitee?.email || '';
        const startTime = eventData.event?.start_time || '';
        const eventName = eventData.event_type?.name || 'Rendez-vous';
        const formattedDateTime = startTime ? formatDateTime(startTime) : '';
        
        console.log("Détails du rendez-vous:");
        console.log("- Nom:", inviteeName);
        console.log("- Email:", inviteeEmail);
        console.log("- Date:", formattedDateTime);
        console.log("- Événement:", eventName);
        
        // Créer la charge utile à envoyer à Voiceflow
        const payload = {
          inviteeName: inviteeName,
          inviteeEmail: inviteeEmail,
          startTime: startTime,
          formattedDateTime: formattedDateTime,
          eventName: eventName,
          reason: ""
        };
        
        // Envoyer l'événement à Voiceflow
        try {
          console.log("Envoi de l'événement à Voiceflow");
          window.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: JSON.stringify(payload)  // Important: stringifier le payload
          });
          console.log("Événement envoyé avec succès");
        } catch (error) {
          console.error("Erreur lors de l'envoi à Voiceflow:", error);
        }
      }
    };
    
    // 8. Ajouter l'écouteur d'événements
    window.addEventListener('message', calendlyListener);
    
    // 9. Fonction de nettoyage
    return () => {
      window.removeEventListener('message', calendlyListener);
    };
  }
};
