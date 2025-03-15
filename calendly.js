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

    // Fonction de journalisation
    const log = (message) => {
      console.log(`[Calendly] ${message}`);
    };

    log("Extension Calendly initialisée");
    log(`URL: ${url}`);
    log(`Hauteur: ${height}px`);

    // 2. Variables d'état
    const state = {
      eventInfo: null,
      userInfo: null
    };

    // 3. Styles pour l'affichage
    const styles = {
      container: {
        width: '100%',
        height: `${height}px`,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: backgroundColor || '#ffffff'
      },
      loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '16px',
        color: '#4a5568',
        textAlign: 'center'
      },
      spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        borderLeftColor: '#4a5568',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'calendly-spin 1s linear infinite',
        marginBottom: '16px'
      },
      error: {
        color: '#e53e3e',
        textAlign: 'center',
        padding: '20px'
      }
    };

    // 4. Créer l'animation sans utiliser de style inline
    const keyframesEl = document.createElement('style');
    keyframesEl.textContent = `
      @keyframes calendly-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(keyframesEl);

    // 5. Ajuster le contexte de Voiceflow
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // 6. Créer un conteneur pour le widget
    const container = document.createElement('div');
    container.id = 'calendly-container-' + Date.now();
    Object.assign(container.style, styles.container);
    element.appendChild(container);

    // 7. Ajouter un indicateur de chargement
    const loadingContainer = document.createElement('div');
    Object.assign(loadingContainer.style, styles.loading);
    
    const spinner = document.createElement('div');
    Object.assign(spinner.style, styles.spinner);
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Chargement du calendrier...';
    
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingText);
    container.appendChild(loadingContainer);

    // 8. Utiliser une iframe directe plutôt que le script Calendly
    const createIframe = () => {
      try {
        log("Création de l'iframe Calendly");
        
        // Supprimer l'indicateur de chargement
        if (loadingContainer.parentNode) {
          loadingContainer.parentNode.removeChild(loadingContainer);
        }
        
        // Créer une iframe qui pointe directement vers l'URL Calendly
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'microphone; camera; autoplay; encrypted-media; fullscreen';
        
        // Ajouter des attributs pour permettre la communication entre domaines
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('loading', 'lazy');
        
        // Ajouter l'iframe au conteneur
        container.appendChild(iframe);
        
        // Configurer l'écouteur d'événements pour l'iframe
        window.addEventListener('message', handleCalendlyEvent);
        
        log("Iframe Calendly créée avec succès");
      } catch (error) {
        log(`Erreur lors de la création de l'iframe: ${error.message}`);
        displayError("Impossible de charger le calendrier. Veuillez réessayer.");
      }
    };

    // 9. Fonction pour afficher une erreur
    const displayError = (message) => {
      // Supprimer l'indicateur de chargement
      if (loadingContainer.parentNode) {
        loadingContainer.parentNode.removeChild(loadingContainer);
      }
      
      // Créer un message d'erreur
      const errorContainer = document.createElement('div');
      Object.assign(errorContainer.style, styles.error);
      errorContainer.textContent = message;
      container.appendChild(errorContainer);
    };

    // 10. Formater une date
    const formatDateTime = (dateStr) => {
      try {
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString("fr-FR") + 
               " à " + 
               dateObj.toLocaleTimeString("fr-FR", { 
                 hour: '2-digit', 
                 minute: '2-digit' 
               });
      } catch (error) {
        log(`Erreur formatage date: ${error.message}`);
        return dateStr;
      }
    };

    // 11. Gérer les événements Calendly
    const handleCalendlyEvent = (event) => {
      // Vérifier que c'est bien un événement Calendly
      if (!event.data || typeof event.data !== 'object' || !event.data.event) return;
      if (!event.data.event.startsWith('calendly')) return;
      
      log(`Événement Calendly reçu: ${event.data.event}`);
      
      // Traiter l'événement de prise de rendez-vous
      if (event.data.event === 'calendly.event_scheduled') {
        log("Rendez-vous programmé détecté!");
        
        // Extraire les données de l'événement
        const eventData = event.data.payload || {};
        state.eventInfo = eventData;
        
        // Extraire les informations principales
        const inviteeName = eventData.invitee?.name || '';
        const inviteeEmail = eventData.invitee?.email || '';
        const startTime = eventData.event?.start_time || '';
        const eventName = eventData.event_type?.name || 'Rendez-vous';
        const formattedDateTime = startTime ? formatDateTime(startTime) : '';
        
        log("Détails du rendez-vous:");
        log(`- Nom: ${inviteeName}`);
        log(`- Email: ${inviteeEmail}`);
        log(`- Date: ${formattedDateTime}`);
        log(`- Type: ${eventName}`);
        
        // Envoyer l'événement à Voiceflow
        try {
          log("Envoi du rendez-vous à Voiceflow");
          window.voiceflow.chat.interact({
            type: 'text',
            payload: `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDateTime}|${eventName}`
          });
          log("Événement envoyé avec succès");
        } catch (error) {
          log(`Erreur lors de l'envoi à Voiceflow: ${error.message}`);
        }
      }
    };

    // 12. Créer l'iframe Calendly
    createIframe();
    
    // 13. Retourner une fonction de nettoyage
    return () => {
      log("Nettoyage de l'extension Calendly");
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }
};
