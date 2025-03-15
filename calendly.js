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

    // S'assurer que l'objet voiceflow existe globalement
    if (!globalThis.voiceflow) {
      globalThis.voiceflow = {};
    }
    
    // Initialiser le log_details s'il n'existe pas
    if (!globalThis.voiceflow.log_details) {
      globalThis.voiceflow.log_details = "";
    }
    
    // Fonction de log pour faciliter le débogage
    const log = (msg) => {
      console.log(`[Calendly] ${msg}`);
      globalThis.voiceflow.log_details += `[Calendly] ${msg}\n`;
    };

    // Initialiser l'objet rdv_data pour stocker les données du rendez-vous
    if (!globalThis.rdv_data) {
      globalThis.rdv_data = {
        name: "",
        email: "",
        start: "",
        message: "",
        reason: ""
      };
    }

    log("Extension Calendly initialisée");
    log(`URL: ${url}`);
    log(`Height: ${height}px`);
    log(`Token présent: ${calendlyToken ? "Oui" : "Non"}`);

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
      
      .calendly-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-left-color: #4a5568;
        animation: calendly-spin 1s linear infinite;
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
    container.style.backgroundColor = backgroundColor;
    
    // Ajouter le conteneur à l'élément fourni par Voiceflow
    element.appendChild(container);

    // 5. Ajouter un indicateur de chargement
    const loaderContainer = document.createElement('div');
    loaderContainer.style.display = 'flex';
    loaderContainer.style.flexDirection = 'column';
    loaderContainer.style.alignItems = 'center';
    loaderContainer.style.justifyContent = 'center';
    loaderContainer.style.height = '100%';
    loaderContainer.style.fontSize = '16px';
    loaderContainer.style.color = '#4a5568';
    
    const spinner = document.createElement('div');
    spinner.className = 'calendly-spinner';
    spinner.style.marginBottom = '16px';
    
    const loaderText = document.createElement('div');
    loaderText.textContent = 'Chargement du calendrier...';
    
    loaderContainer.appendChild(spinner);
    loaderContainer.appendChild(loaderText);
    container.appendChild(loaderContainer);

    // 6. Fonction d'initialisation du widget Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        log("Initialisation du widget Calendly");
        
        // Supprimer l'indicateur de chargement
        if (loaderContainer.parentNode) {
          loaderContainer.parentNode.removeChild(loaderContainer);
        }
        
        // Initialiser le widget
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container,
          prefill: {},
          utm: {}
        });
        
        log("Widget Calendly initialisé avec succès");
      } else {
        log("Attente de chargement du script Calendly...");
        setTimeout(initWidget, 100);
      }
    };

    // 7. Charger le script Calendly
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      log("Chargement du script Calendly...");
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        log("Script Calendly chargé avec succès");
        initWidget();
      };
      script.onerror = (e) => {
        log(`Erreur de chargement du script Calendly: ${e.type}`);
        loaderText.textContent = "Impossible de charger le calendrier. Veuillez réessayer.";
        loaderText.style.color = '#e53e3e';
        spinner.style.display = 'none';
      };
      document.head.appendChild(script);
    } else {
      log("Script Calendly déjà chargé");
      initWidget();
    }

    // 8. Fonction pour extraire les informations d'un événement
    function parseEventDetails(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    }

    // 9. Écouter les événements de Calendly
    const calendlyListener = async (e) => {
      // Vérifier que c'est bien un événement Calendly
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;
      
      log(`Événement Calendly reçu: ${e.data.event}`);
      log(`Données complètes: ${JSON.stringify(e.data, null, 2)}`);
      
      // Récupérer les détails de l'événement
      const eventData = e.data.payload || {};
      
      // Traiter l'événement de prise de rendez-vous
      if (e.data.event === 'calendly.event_scheduled') {
        log("Rendez-vous programmé détecté!");
        
        // Extraire les informations principales
        const eventUri = eventData.event?.uri || '';
        const eventId = parseEventDetails(eventUri);
        const startTime = eventData.event?.start_time || '';
        const inviteeEmail = eventData.invitee?.email || '';
        const inviteeName = eventData.invitee?.name || '';
        const eventName = eventData.event_type?.name || 'Rendez-vous';
        const inviteeUri = eventData.invitee?.uri || '';
        
        log(`Détails du rendez-vous:`);
        log(`- ID: ${eventId}`);
        log(`- Événement: ${eventName}`);
        log(`- Invité: ${inviteeName} (${inviteeEmail})`);
        log(`- Date/heure: ${startTime}`);
        log(`- URI invitee: ${inviteeUri}`);
        
        // Formater la date et l'heure
        let formattedDateTime = "Date non spécifiée";
        if (startTime) {
          try {
            const dateObj = new Date(startTime);
            formattedDateTime = dateObj.toLocaleDateString("fr-FR") + 
                              " à " + 
                              dateObj.toLocaleTimeString("fr-FR", { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              });
          } catch (err) {
            log(`Erreur lors du formatage de la date: ${err.message}`);
            formattedDateTime = startTime;
          }
        }
        
        // Créer un objet avec toutes les données de l'événement
        const completEventData = {
          event: 'scheduled',
          eventName: eventName,
          inviteeName: inviteeName,
          inviteeEmail: inviteeEmail,
          startTime: startTime,
          formattedDateTime: formattedDateTime,
          eventId: eventId,
          calendlyToken: calendlyToken,
          uri: {
            event: eventUri,
            invitee: inviteeUri
          },
          raw: eventData
        };
        
        // Stocker l'événement complet dans les variables globales
        globalThis.calendly_event = completEventData;
        globalThis.last_event = {
          type: 'calendly_event',
          payload: completEventData
        };
        
        // Mettre à jour aussi rdv_data pour compatibilité
        globalThis.rdv_data = {
          name: inviteeName,
          email: inviteeEmail,
          start: formattedDateTime,
          event_name: eventName,
          message: `Rendez-vous confirmé: ${eventName} avec ${inviteeName} (${inviteeEmail}) pour le ${formattedDateTime}`,
          reason: ""
        };
        
        log("Données stockées dans les variables globales:");
        log("- calendly_event: Stocké");
        log("- last_event: Stocké");
        log("- rdv_data: Stocké");
        
        // Envoyer l'événement à Voiceflow
        try {
          log("Envoi de l'événement à Voiceflow...");
          window.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: completEventData
          });
          log("Événement envoyé à Voiceflow avec succès");
        } catch (err) {
          log(`Erreur lors de l'envoi à Voiceflow: ${err.message}`);
        }
      }
    };
    
    // 10. Ajouter l'écouteur d'événements
    window.addEventListener('message', calendlyListener);
    log("Écouteur d'événements Calendly ajouté");
    
    // 11. Fonction de nettoyage
    return () => {
      log("Nettoyage de l'extension Calendly");
      window.removeEventListener('message', calendlyListener);
    };
  }
};
