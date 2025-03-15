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
      calendlyToken = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQxOTE5ODMwLCJqdGkiOiI0NWVkN2IyMy04ZTc3LTQ5YzMtOGVjZC0yYjc2YjQzNzQ3NjYiLCJ1c2VyX3V1aWQiOiI3NDBiMzJjNy1iYzA0LTQ5YWMtYmYxOS04OThmNzYxNjQ2MTgifQ.BEZsBGyBl6bXR9HXBja_c821gMOxzTpPVKqCp9uDqj_U4G0jWZ8sztOzEqXsNMcN1JDDLwXbwFJtC2IbW8eXZA',
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    console.log("Extension Calendly initialisée");
    console.log("URL:", url);
    console.log("Hauteur:", height);
    
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
      
      .calendly-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 16px;
        color: #4a5568;
      }
      
      .calendly-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: #4a5568;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: calendly-spin 1s linear infinite;
        margin-bottom: 16px;
      }
      
      @keyframes calendly-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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

    // 5. Ajouter un indicateur de chargement
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'calendly-loading';
    
    const spinner = document.createElement('div');
    spinner.className = 'calendly-spinner';
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Chargement du calendrier...';
    
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingText);
    container.appendChild(loadingContainer);

    // 6. Charger le script Calendly
    const loadCalendly = () => {
      if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
        console.log("Chargement du script Calendly...");
        
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          console.log("Script Calendly chargé");
          initWidget();
        };
        script.onerror = (e) => {
          console.error("Erreur de chargement du script Calendly:", e);
          loadingText.textContent = "Impossible de charger le calendrier. Veuillez réessayer.";
          loadingText.style.color = 'red';
          spinner.style.display = 'none';
        };
        document.head.appendChild(script);
      } else {
        console.log("Script Calendly déjà chargé");
        initWidget();
      }
    };

    // 7. Initialiser le widget Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        console.log("Initialisation du widget Calendly");
        
        // Supprimer l'indicateur de chargement
        if (loadingContainer.parentNode) {
          loadingContainer.parentNode.removeChild(loadingContainer);
        }
        
        // Initialiser le widget
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container
        });
        
        console.log("Widget Calendly initialisé avec succès");
      } else {
        console.log("Attente de l'objet Calendly...");
        setTimeout(initWidget, 100);
      }
    };

    // 8. Fonction pour formater la date
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

    // 9. Écouter les événements de Calendly
    const calendlyListener = (e) => {
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
        
        // Envoyer l'événement au format attendu par le script de capture
        try {
          console.log("Envoi du rendez-vous à Voiceflow");
          window.voiceflow.chat.interact({
            type: 'text',
            payload: `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDateTime}|${eventName}`
          });
          console.log("Événement envoyé avec succès");
        } catch (error) {
          console.error("Erreur lors de l'envoi à Voiceflow:", error);
        }
      }
    };
    
    // 10. Ajouter l'écouteur d'événements
    window.addEventListener('message', calendlyListener);
    
    // 11. Charger Calendly
    loadCalendly();
    
    // 12. Fonction de nettoyage
    return () => {
      window.removeEventListener('message', calendlyListener);
    };
  }
};
