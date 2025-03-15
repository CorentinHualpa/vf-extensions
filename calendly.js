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
      backgroundColor = '#992D00',
      minWidth = '320px',
      calendlyToken = ''
    } = trace.payload || {};

    console.log("[Calendly] Initialisation avec URL:", url);

    // 2. Styles pour optimiser l'affichage
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
      
      @keyframes calendly-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
    `;
    document.head.appendChild(styleEl);

    // 3. Création du conteneur principal avec styles explicites
    const container = document.createElement('div');
    container.id = 'calendly-container-' + Date.now();
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.minWidth = minWidth;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    container.style.border = '1px solid #e2e8f0';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = backgroundColor;
    element.appendChild(container);

    // 4. Indicateur de chargement
    const loaderContainer = document.createElement('div');
    loaderContainer.style.display = 'flex';
    loaderContainer.style.flexDirection = 'column';
    loaderContainer.style.alignItems = 'center';
    loaderContainer.style.justifyContent = 'center';
    loaderContainer.style.height = '100%';
    loaderContainer.style.color = '#ffffff';
    
    const spinner = document.createElement('div');
    spinner.className = 'calendly-spinner';
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Chargement du calendrier...';
    
    loaderContainer.appendChild(spinner);
    loaderContainer.appendChild(loadingText);
    container.appendChild(loaderContainer);

    // 5. Fonction pour ajuster manuellement tous les éléments parents
    const adjustContainers = () => {
      // Trouver tous les parents pour ajuster leur largeur
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
      
      const bubbleContentEl = element.closest('.vfrc-bubble-content');
      if (bubbleContentEl) {
        bubbleContentEl.style.width = '100%';
        bubbleContentEl.style.maxWidth = '100%';
        bubbleContentEl.style.margin = '0';
        bubbleContentEl.style.padding = '0';
      }
      
      const messageContentEl = element.closest('.vfrc-message-content');
      if (messageContentEl) {
        messageContentEl.style.width = '100%';
        messageContentEl.style.maxWidth = '100%';
        messageContentEl.style.margin = '0';
        messageContentEl.style.padding = '0';
      }
    };
    
    // Exécuter plusieurs fois pour s'assurer que ça prend effet
    adjustContainers();
    setTimeout(adjustContainers, 100);
    setTimeout(adjustContainers, 500);

    // 6. Variables globales pour stocker les données du rendez-vous
    window.calendlyData = {
      dateSelected: '',
      dateTimeFormatted: '',
      name: '',
      email: '',
      eventName: '',
      dateCaptured: false,
      eventCompleted: false
    };

    // 7. Fonction pour charger le script Calendly ou utiliser l'iframe directe
    const loadCalendly = () => {
      // Méthode 1: Utiliser une iframe directe (plus compatible avec les restrictions CSP)
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.frameBorder = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.allow = 'camera; microphone; fullscreen; clipboard-read; clipboard-write;';
      
      // Remplacer le loader par l'iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      console.log("[Calendly] Iframe créée");
    };

    // 8. Fonction pour vérifier si c'est un événement Calendly (selon la doc)
    function isCalendlyEvent(e) {
      return e.data.event && e.data.event.indexOf('calendly') === 0;
    }

    // 9. Fonction pour formater la date correctement
    function formatDate(dateStr) {
      try {
        if (!dateStr) return "Date non disponible";
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Date non disponible";
        
        return date.toLocaleDateString('fr-FR') + ' à ' + 
               date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
      } catch (e) {
        console.error("[Calendly] Erreur de formatage de date:", e);
        return "Date non disponible";
      }
    }

    // 10. Écouter les événements Calendly (basé sur la documentation officielle)
    const handleCalendlyEvent = function(e) {
      if (!isCalendlyEvent(e)) return;
      
      console.log("[Calendly] Événement reçu:", e.data.event);
      console.log("[Calendly] Détails:", e.data);
      
      // ÉTAPE 1: Date et heure sélectionnées
      if (e.data.event === 'calendly.date_and_time_selected') {
        console.log("[Calendly] Sélection de date et heure détectée");
        
        // Récupérer les données du payload
        const payload = e.data.payload || {};
        let inviteeStartTime = "";
        
        // Essayer de récupérer la date depuis différentes sources possibles
        if (payload.invitee_start_time) {
          inviteeStartTime = payload.invitee_start_time;
        } else if (payload.event && payload.event.start_time) {
          inviteeStartTime = payload.event.start_time;
        } else if (payload.start_time) {
          inviteeStartTime = payload.start_time;
        }
        
        const eventName = payload.event_type?.name || "Rendez-vous";
        
        // Formater la date
        const formattedDate = formatDate(inviteeStartTime);
        
        // Stocker les données
        window.calendlyData = {
          ...window.calendlyData,
          dateSelected: inviteeStartTime,
          dateTimeFormatted: formattedDate,
          eventName: eventName,
          dateCaptured: true
        };
        
        console.log("[Calendly] Date sélectionnée:", formattedDate);
        console.log("[Calendly] Type d'événement:", eventName);
        
        // Stocker aussi dans des variables individuelles pour compatibilité
        window.rdv_date = inviteeStartTime;
        window.rdv_date_formatted = formattedDate;
        window.rdv_event_name = eventName;
        
        // Envoyer l'événement à Voiceflow avec le format événement
        window.voiceflow.chat.interact({
          type: 'event',
          name: 'CALENDLY_DATE_SELECTED',
          payload: {
            date: formattedDate,
            eventName: eventName
          }
        });
        
        console.log("[Calendly] Événement CALENDLY_DATE_SELECTED envoyé à Voiceflow");
      }
      
      // ÉTAPE 2: Rendez-vous confirmé
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("[Calendly] Rendez-vous confirmé");
        
        // Récupérer les données du payload
        const payload = e.data.payload || {};
        
        // Récupérer le nom de l'événement (plusieurs sources possibles)
        const eventName = payload.event_type?.name || 
                         window.rdv_event_name || 
                         window.calendlyData.eventName || 
                         "Rendez-vous";
                         
        // Récupérer les informations de l'invité
        const inviteeEmail = payload.invitee?.email || "";
        const inviteeName = payload.invitee?.name || "";
        
        // Récupérer la date (plusieurs sources possibles)
        let startTime = "";
        let formattedDate = "Date non disponible";
        
        if (payload.event && payload.event.start_time) {
          startTime = payload.event.start_time;
          formattedDate = formatDate(startTime);
        } else if (window.rdv_date_formatted) {
          formattedDate = window.rdv_date_formatted;
        } else if (window.calendlyData.dateTimeFormatted) {
          formattedDate = window.calendlyData.dateTimeFormatted;
        } else if (payload.scheduled_event && payload.scheduled_event.start_time) {
          startTime = payload.scheduled_event.start_time;
          formattedDate = formatDate(startTime);
        }
        
        // Mettre à jour les données dans l'objet global
        window.calendlyData = {
          ...window.calendlyData,
          name: inviteeName,
          email: inviteeEmail,
          dateTimeFormatted: formattedDate,
          eventName: eventName,
          eventCompleted: true
        };
        
        // Stocker aussi dans des variables individuelles pour compatibilité
        window.rdv_name = inviteeName;
        window.rdv_mail = inviteeEmail;
        window.rdv_start = formattedDate;
        window.rdv_event_name = eventName;
        
        console.log("[Calendly] Données complètes du rendez-vous:");
        console.log("- Nom:", inviteeName);
        console.log("- Email:", inviteeEmail);
        console.log("- Date:", formattedDate);
        console.log("- Type:", eventName);
        
        // Envoyer l'événement à Voiceflow avec le format événement
        window.voiceflow.chat.interact({
          type: 'event',
          name: 'CALENDLY_CONFIRMED',
          payload: {
            name: inviteeName,
            email: inviteeEmail,
            date: formattedDate,
            eventName: eventName
          }
        });
        
        console.log("[Calendly] Événement CALENDLY_CONFIRMED envoyé à Voiceflow");
      }
    };
    
    // 11. Ajouter l'écouteur d'événements et charger Calendly
    window.addEventListener('message', handleCalendlyEvent);
    loadCalendly();
    
    // 12. Retourner la fonction de nettoyage
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }
};
