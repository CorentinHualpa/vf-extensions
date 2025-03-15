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
      
      if (window.voiceflow && window.voiceflow.log_details !== undefined) {
        window.voiceflow.log_details += `[Calendly] ${message}\n`;
      }
    };

    log("Extension Calendly initialisée");
    log(`URL: ${url}`);
    log(`Hauteur: ${height}px`);
    log("Token présent: " + (calendlyToken ? "Oui" : "Non"));

    // 2. Variables d'état pour l'extension
    const state = {
      userInfo: null,
      userURI: null,
      lastEvent: null,
      apiLoaded: false
    };

    // 3. Injections de styles pour l'affichage
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
      
      .calendly-error {
        color: #e53e3e;
        text-align: center;
        padding: 20px;
      }
    `;
    document.head.appendChild(styleEl);

    // 4. Ajuster la largeur de la bulle Voiceflow
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);

    // 5. Créer un conteneur pour le widget
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

    // 6. Ajouter un indicateur de chargement
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'calendly-loading';
    
    const spinner = document.createElement('div');
    spinner.className = 'calendly-spinner';
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Chargement du calendrier...';
    
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingText);
    container.appendChild(loadingContainer);

    // 7. Fonctions API Calendly
    
    // Récupérer les infos de l'utilisateur
    const getUserInfo = async () => {
      try {
        log("Récupération des informations utilisateur...");
        const response = await fetch("https://api.calendly.com/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${calendlyToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          log(`Erreur API utilisateur: ${response.status} - ${errorText}`);
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        const userData = await response.json();
        log(`Utilisateur identifié: ${userData.resource.name} (${userData.resource.email})`);
        state.userInfo = userData.resource;
        state.userURI = userData.resource.uri;
        
        return userData.resource;
      } catch (error) {
        log(`Erreur getUserInfo: ${error.message}`);
        throw error;
      }
    };
    
    // Récupérer les événements programmés
    const getScheduledEvents = async (userURI, limit = 1) => {
      try {
        log(`Récupération des événements pour l'utilisateur: ${userURI}`);
        const response = await fetch(`https://api.calendly.com/scheduled_events?user=${userURI}&count=${limit}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${calendlyToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          log(`Erreur API événements: ${response.status} - ${errorText}`);
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        const eventsData = await response.json();
        log(`${eventsData.collection.length} événements récupérés`);
        
        return eventsData.collection;
      } catch (error) {
        log(`Erreur getScheduledEvents: ${error.message}`);
        throw error;
      }
    };
    
    // Récupérer les détails d'un événement
    const getEventDetails = async (eventURI) => {
      try {
        log(`Récupération des détails de l'événement: ${eventURI}`);
        const response = await fetch(eventURI, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${calendlyToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          log(`Erreur API détails événement: ${response.status} - ${errorText}`);
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        const eventData = await response.json();
        log("Détails de l'événement récupérés");
        
        return eventData.resource;
      } catch (error) {
        log(`Erreur getEventDetails: ${error.message}`);
        throw error;
      }
    };
    
    // Récupérer les invités d'un événement
    const getEventInvitees = async (eventURI) => {
      try {
        // Extraire l'UUID de l'événement
        const eventUUID = eventURI.split('/').pop();
        log(`Récupération des invités pour l'événement: ${eventUUID}`);
        
        const response = await fetch(`https://api.calendly.com/scheduled_events/${eventUUID}/invitees`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${calendlyToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          log(`Erreur API invités: ${response.status} - ${errorText}`);
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        const inviteesData = await response.json();
        log(`${inviteesData.collection.length} invités récupérés`);
        
        return inviteesData.collection;
      } catch (error) {
        log(`Erreur getEventInvitees: ${error.message}`);
        throw error;
      }
    };
    
    // Récupérer les détails d'un invité
    const getInviteeDetails = async (inviteeURI) => {
      try {
        log(`Récupération des détails de l'invité: ${inviteeURI}`);
        const response = await fetch(inviteeURI, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${calendlyToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          log(`Erreur API détails invité: ${response.status} - ${errorText}`);
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        const inviteeData = await response.json();
        log("Détails de l'invité récupérés");
        
        return inviteeData.resource;
      } catch (error) {
        log(`Erreur getInviteeDetails: ${error.message}`);
        throw error;
      }
    };
    
    // Récupérer les événements programmés pour l'utilisateur
    const getAllEvents = async () => {
      try {
        // 1. Obtenir les informations de l'utilisateur
        const userInfo = await getUserInfo();
        
        // 2. Obtenir les événements programmés
        const events = await getScheduledEvents(userInfo.uri);
        
        return events;
      } catch (error) {
        log(`Erreur getAllEvents: ${error.message}`);
        throw error;
      }
    };

    // 8. Fonctions utilitaires
    
    // Formater une date
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
    
    // Traiter un nouvel événement programmé
    const processNewEvent = async (eventData) => {
      try {
        log("Traitement d'un nouvel événement programmé");
        
        // Extraire les données de base
        const eventURI = eventData.event?.uri || '';
        const inviteeURI = eventData.invitee?.uri || '';
        const inviteeName = eventData.invitee?.name || '';
        const inviteeEmail = eventData.invitee?.email || '';
        const startTime = eventData.event?.start_time || '';
        const eventName = eventData.event_type?.name || 'Rendez-vous';
        const formattedDateTime = startTime ? formatDateTime(startTime) : '';
        
        log("Informations de base:");
        log(`- Nom: ${inviteeName}`);
        log(`- Email: ${inviteeEmail}`);
        log(`- Date: ${formattedDateTime}`);
        log(`- Type: ${eventName}`);
        
        // Rechercher des informations supplémentaires si les URIs sont disponibles
        let reason = "";
        
        if (inviteeURI && calendlyToken) {
          try {
            log("Récupération des informations détaillées de l'invité");
            const inviteeDetails = await getInviteeDetails(inviteeURI);
            
            // Vérifier s'il y a des questions/réponses
            if (inviteeDetails.questions_and_answers && inviteeDetails.questions_and_answers.length > 0) {
              log(`${inviteeDetails.questions_and_answers.length} questions/réponses trouvées`);
              
              // Chercher la raison du rendez-vous
              for (const qa of inviteeDetails.questions_and_answers) {
                if (qa.question.toLowerCase().includes("raison") || 
                    qa.question.toLowerCase().includes("motif")) {
                  reason = qa.answer;
                  log(`Raison trouvée: ${reason}`);
                  break;
                }
              }
            }
          } catch (detailsError) {
            log(`Impossible de récupérer les détails de l'invité: ${detailsError.message}`);
          }
        }
        
        // Envoyer l'événement à Voiceflow
        log("Envoi de l'événement à Voiceflow");
        window.voiceflow.chat.interact({
          type: 'text',
          payload: `CALENDLY_CONFIRMED|${inviteeName}|${inviteeEmail}|${formattedDateTime}|${eventName}|${reason}`
        });
        
        log("Événement envoyé avec succès");
        
      } catch (error) {
        log(`Erreur lors du traitement de l'événement: ${error.message}`);
      }
    };

    // 9. Charger le script Calendly et initialiser le widget
    const loadCalendly = async () => {
      try {
        // Essayer de charger les informations utilisateur en parallèle
        if (calendlyToken) {
          getUserInfo().catch(error => {
            log(`Erreur lors de la récupération des informations utilisateur: ${error.message}`);
          });
        }
        
        // Charger le script Calendly
        if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
          log("Chargement du script Calendly...");
          
          const script = document.createElement('script');
          script.src = 'https://assets.calendly.com/assets/external/widget.js';
          script.async = true;
          
          const scriptLoaded = new Promise((resolve, reject) => {
            script.onload = () => {
              log("Script Calendly chargé avec succès");
              resolve();
            };
            script.onerror = (e) => {
              const errorMsg = "Erreur de chargement du script Calendly";
              log(errorMsg);
              reject(new Error(errorMsg));
            };
          });
          
          document.head.appendChild(script);
          await scriptLoaded;
        } else {
          log("Script Calendly déjà chargé");
        }
        
        // Initialiser le widget
        initCalendlyWidget();
        
      } catch (error) {
        log(`Erreur lors du chargement de Calendly: ${error.message}`);
        
        // Afficher l'erreur à l'utilisateur
        loadingText.textContent = "Impossible de charger le calendrier. Veuillez réessayer.";
        loadingText.style.color = '#e53e3e';
        spinner.style.display = 'none';
      }
    };
    
    // Initialiser le widget Calendly
    const initCalendlyWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        log("Initialisation du widget Calendly");
        
        // Supprimer l'indicateur de chargement
        if (loadingContainer.parentNode) {
          loadingContainer.parentNode.removeChild(loadingContainer);
        }
        
        // Initialiser le widget avec les options
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container,
          prefill: {},
          utm: {}
        });
        
        state.apiLoaded = true;
        log("Widget Calendly initialisé avec succès");
      } else {
        log("Attente de l'objet Calendly...");
        setTimeout(initCalendlyWidget, 100);
      }
    };

    // 10. Écouter les événements Calendly
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
        state.lastEvent = eventData;
        
        // Traiter l'événement
        processNewEvent(eventData);
      }
    };
    
    // 11. Ajouter l'écouteur d'événements et démarrer le chargement
    window.addEventListener('message', calendlyListener);
    loadCalendly();
    
    // 12. Fonction de nettoyage
    return () => {
      log("Nettoyage de l'extension Calendly");
      window.removeEventListener('message', calendlyListener);
    };
  }
};
