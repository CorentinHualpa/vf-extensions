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

    // 3. Création du conteneur principal
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

    // 5. Ajustement de tous les conteneurs parents pour assurer l'affichage correct
    const adjustContainers = () => {
      const elements = [
        element.closest('.vfrc-message'),
        element.closest('.vfrc-bubble'),
        element.closest('.vfrc-bubble-content'),
        element.closest('.vfrc-message-content')
      ];
      
      elements.forEach(el => {
        if (el) {
          el.style.width = '100%';
          el.style.maxWidth = '100%';
          el.style.margin = '0';
          el.style.padding = '0';
        }
      });
    };
    
    adjustContainers();
    setTimeout(adjustContainers, 100);
    setTimeout(adjustContainers, 500);

    // 6. Créer une iframe Calendly
    const createIframe = () => {
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
      
      container.innerHTML = '';
      container.appendChild(iframe);
      
      console.log("[Calendly] Iframe créée");
    };

    // 7. Fonction pour formater la date
    function formatDate(dateStr) {
      try {
        if (!dateStr) return "Date non disponible";
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Date non disponible";
        
        return date.toLocaleDateString('fr-FR') + ' à ' + 
               date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
      } catch (e) {
        console.error("[Calendly] Erreur formatage date:", e);
        return "Date non disponible";
      }
    }

    // 8. Fonction pour vérifier les événements Calendly
    function isCalendlyEvent(e) {
      return e.data && e.data.event && e.data.event.indexOf('calendly') === 0;
    }

    // 9. Gestionnaire d'événements Calendly
    const handleCalendlyEvent = (e) => {
      if (!isCalendlyEvent(e)) return;
      
      console.log("[Calendly] Événement reçu:", e.data.event);
      console.log("[Calendly] Détails complets:", JSON.stringify(e.data));
      
      // Étape 1: Lorsque l'utilisateur sélectionne une date et heure
      if (e.data.event === 'calendly.date_and_time_selected') {
        console.log("[Calendly] Date et heure sélectionnées");
        
        // Récupérer les informations
        const payload = e.data.payload || {};
        
        // Différentes façons dont la date peut être présente
        let startTime = payload.invitee_start_time || 
                        (payload.event && payload.event.start_time) || 
                        payload.start_time || "";
                        
        const eventName = (payload.event_type && payload.event_type.name) || "Rendez-vous";
        
        // Formater la date
        const formattedDate = formatDate(startTime);
        
        console.log("[Calendly] Date formatée:", formattedDate);
        console.log("[Calendly] Type d'événement:", eventName);
        
        // Stocker les données pour référence future
        window.calendlyData = {
          dateSelected: startTime,
          dateFormatted: formattedDate,
          eventName: eventName
        };
        
        // Envoyer à Voiceflow avec le chemin step1
        try {
          console.log("[Calendly] Envoi vers Voiceflow avec chemin step1");
          
          window.voiceflow.chat.interact({
            type: 'text',
            payload: `CALENDLY_DATE_SELECTED|${formattedDate}|${eventName}`
          }, "step1");
          
          console.log("[Calendly] Message envoyé avec succès");
        } catch (error) {
          console.error("[Calendly] Erreur d'envoi:", error);
        }
      }
      
      // Étape 2: Lorsque l'utilisateur confirme le rendez-vous
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("[Calendly] Rendez-vous confirmé");
        
        // Récupérer les informations
        const payload = e.data.payload || {};
        
        // Récupérer les données du contact
        const inviteeName = (payload.invitee && payload.invitee.name) || "";
        const inviteeEmail = (payload.invitee && payload.invitee.email) || "";
        
        // Récupérer les données de l'événement
        const eventName = (payload.event_type && payload.event_type.name) || 
                          window.calendlyData?.eventName || 
                          "Rendez-vous";
        
        // Récupérer la date (plusieurs sources possibles)
        let startTime = "";
        if (payload.event && payload.event.start_time) {
          startTime = payload.event.start_time;
        } else if (window.calendlyData && window.calendlyData.dateSelected) {
          startTime = window.calendlyData.dateSelected;
        }
        
        // Formater la date ou utiliser celle stockée précédemment
        const formattedDate = window.calendlyData?.dateFormatted || formatDate(startTime);
        
        console.log("[Calendly] Informations complètes:");
        console.log("- Nom:", inviteeName);
        console.log("- Email:", inviteeEmail);
        console.log("- Date:", formattedDate);
        console.log("- Type d'événement:", eventName);
        
        // Envoyer à Voiceflow avec le chemin step2
        try {
          console.log("[Calendly] Envoi vers Voiceflow avec chemin step2");
          
          window.voiceflow.chat.interact({
            type: 'text',
            payload: `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDate}|${eventName}`
          }, "step2");
          
          console.log("[Calendly] Message envoyé avec succès");
        } catch (error) {
          console.error("[Calendly] Erreur d'envoi:", error);
        }
      }
    };

    // 10. Ajouter l'écouteur d'événements et créer l'iframe
    window.addEventListener('message', handleCalendlyEvent);
    createIframe();
    
    // 11. Retourner la fonction de nettoyage
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }
};
