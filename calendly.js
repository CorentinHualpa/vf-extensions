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
      backgroundColor = '#ffffff'
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
    `;
    document.head.appendChild(styleEl);

    // 3. Création du conteneur principal avec styles explicites
    const container = document.createElement('div');
    container.id = 'calendly-container-' + Date.now();
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    container.style.border = '1px solid #e2e8f0';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = backgroundColor;
    element.appendChild(container);

    // 4. Fonction pour ajuster manuellement tous les éléments parents
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

    // 5. Création de l'iframe Calendly
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
    container.appendChild(iframe);

    // 6. Fonction pour vérifier si c'est un événement Calendly (selon la doc)
    function isCalendlyEvent(e) {
      return e.data.event && e.data.event.indexOf('calendly') === 0;
    }

    // 7. Fonction pour formater la date correctement
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

    // 8. Écouter les événements Calendly (basé sur la documentation officielle)
    const handleCalendlyEvent = function(e) {
      if (!isCalendlyEvent(e)) return;
      
      console.log("[Calendly] Événement reçu:", e.data.event);
      console.log("[Calendly] Détails:", e.data);
      
      // ÉTAPE 1: Date et heure sélectionnées
      if (e.data.event === 'calendly.date_and_time_selected') {
        console.log("[Calendly] Sélection de date et heure détectée");
        
        // Récupérer les données du payload
        const payload = e.data.payload || {};
        const inviteeStartTime = payload.invitee_start_time || "";
        const eventName = payload.event_type?.name || "Rendez-vous";
        
        // Formater la date
        const formattedDate = formatDate(inviteeStartTime);
        
        // Stocker pour référence future
        window.rdv_date = inviteeStartTime;
        window.rdv_date_formatted = formattedDate;
        window.rdv_event_name = eventName;
        
        console.log("[Calendly] Date sélectionnée:", formattedDate);
        console.log("[Calendly] Type d'événement:", eventName);
        
        // Envoyer à Voiceflow
        window.voiceflow.chat.interact({
          type: 'text',
          payload: `CALENDLY_DATE_SELECTED|${formattedDate}|${eventName}`
        });
      }
      
      // ÉTAPE 2: Rendez-vous confirmé
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("[Calendly] Rendez-vous confirmé");
        
        // Récupérer les données du payload
        const payload = e.data.payload || {};
        const eventName = payload.event_type?.name || window.rdv_event_name || "Rendez-vous";
        const inviteeEmail = payload.invitee?.email || "";
        const inviteeName = payload.invitee?.name || "";
        
        // Utiliser la date de l'étape 1 si disponible, sinon utiliser celle de l'événement actuel
        let startTime = "";
        if (payload.event && payload.event.start_time) {
          startTime = payload.event.start_time;
        } else if (window.rdv_date) {
          startTime = window.rdv_date;
        }
        
        // Formater la date
        const formattedDate = window.rdv_date_formatted || formatDate(startTime);
        
        // Stocker les informations pour référence future
        window.rdv_name = inviteeName;
        window.rdv_mail = inviteeEmail;
        window.rdv_start = formattedDate;
        window.rdv_event_name = eventName;
        
        console.log("[Calendly] Données complètes du rendez-vous:");
        console.log("- Nom:", inviteeName);
        console.log("- Email:", inviteeEmail);
        console.log("- Date:", formattedDate);
        console.log("- Type:", eventName);
        
        // Envoyer à Voiceflow
        window.voiceflow.chat.interact({
          type: 'text',
          payload: `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDate}|${eventName}`
        });
      }
    };
    
    // Ajouter l'écouteur d'événements selon la documentation Calendly
    window.addEventListener('message', handleCalendlyEvent);
    
    // Retourner la fonction de nettoyage
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }
};
