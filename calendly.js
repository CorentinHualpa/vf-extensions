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

    // Fonction de log pour faciliter le débogage
    const log = (msg) => {
      console.log(`[Calendly] ${msg}`);
      if (window.voiceflow && window.voiceflow.log_details !== undefined) {
        window.voiceflow.log_details += `[Calendly] ${msg}\n`;
      }
    };

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
    container.style.backgroundColor = backgroundColor || '#ffffff';
    
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
      } catch (err) {
        log(`Erreur lors du formatage de la date: ${err.message}`);
        return dateStr;
      }
    }

    // 9. Écouter les événements de Calendly
    const calendlyListener = (e) => {
      // Vérifier que c'est bien un événement Calendly
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;
      
      log(`Événement Calendly reçu: ${e.data.event}`);
      
      // Traiter l'événement de prise de rendez-vous
      if (e.data.event === 'calendly.event_scheduled') {
        log("Rendez-vous programmé détecté!");
        
        // Récupérer les détails de l'événement
        const eventData = e.data.payload || {};
        
        // Extraire les informations principales
        const inviteeName = eventData.invitee?.name || '';
        const inviteeEmail = eventData.invitee?.email || '';
        const startTime = eventData.event?.start_time || '';
        const eventName = eventData.event_type?.name || 'Rendez-vous';
        const formattedDateTime = startTime ? formatDateTime(startTime) : '';
        
        log(`Détails du rendez-vous:`);
        log(`- Événement: ${eventName}`);
        log(`- Invité: ${inviteeName} (${inviteeEmail})`);
        log(`- Date/heure: ${formattedDateTime}`);
        
        // Créer la charge utile complète
        const payload = {
          event: 'scheduled',
          eventName: eventName,
          inviteeName: inviteeName,
          inviteeEmail: inviteeEmail,
          startTime: startTime,
          formattedDateTime: formattedDateTime,
          calendlyToken: calendlyToken,
          // Ajouter les URIs si disponibles
          uri: {
            event: eventData.event?.uri || '',
            invitee: eventData.invitee?.uri || ''
          }
        };
        
        // Stocker les données partout où c'est possible pour maximiser les chances de capture
        
        // 1. Variable globale standard pour Voiceflow
        if (window.rdv_data === undefined) window.rdv_data = {};
        window.rdv_data = {
          name: inviteeName,
          email: inviteeEmail,
          start: formattedDateTime,
          event_name: eventName,
          message: `Rendez-vous confirmé: ${eventName} avec ${inviteeName} (${inviteeEmail}) pour le ${formattedDateTime}`
        };
        
        // 2. Variable spécifique pour l'événement Calendly
        window.calendly_event = payload;
        
        // 3. Variables directes
        window.rdv_name = inviteeName;
        window.rdv_mail = inviteeEmail;
        window.rdv_start = formattedDateTime;
        window.rdv_event_name = eventName;
        
        // 4. LocalStorage pour persistance
        try {
          localStorage.setItem('calendly_event', JSON.stringify(payload));
        } catch (err) {
          log(`Erreur lors du stockage dans localStorage: ${err.message}`);
        }
        
        // 5. Stocker dans last_event global pour capture ultérieure
        window.last_event = {
          type: 'calendly_event',
          payload: payload
        };
        
        log("Données stockées dans toutes les variables disponibles");
        
        // Envoyer l'événement à Voiceflow
        try {
          log("Envoi de l'événement à Voiceflow...");
          
          if (window.voiceflow && window.voiceflow.chat && typeof window.voiceflow.chat.interact === 'function') {
            window.voiceflow.chat.interact({
              type: 'calendly_event',
              payload: payload
            });
            log("Événement envoyé à Voiceflow avec succès");
          } else {
            log("Fonction voiceflow.chat.interact non disponible");
          }
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
