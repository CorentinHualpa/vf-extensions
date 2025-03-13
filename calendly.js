export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) => trace.type === 'calendly' || trace.payload?.type === 'calendly',
  
  render: ({ trace, element }) => {
    try {
      console.log("Démarrage du rendu de l'extension Calendly");
      
      // Récupérer les paramètres depuis le payload
      const {
        url = 'https://calendly.com/votre-compte',  // URL Calendly par défaut
        height = 650,                               // Hauteur par défaut
        width = '100%',                             // Largeur par défaut
        backgroundColor = '#ffffff',                // Couleur de fond
        textColor = '#333333',                      // Couleur du texte
        primaryColor = '#3A87AD',                   // Couleur primaire (boutons)
        hideCookieBanner = true,                    // Masquer la bannière de cookies
        hideEventTypeDetails = false,               // Afficher les détails des types d'événements
        hideGdprBanner = true,                      // Masquer la bannière GDPR
        hidePrerequisiteBanner = true               // Masquer la bannière des prérequis
      } = trace.payload || {};
      
      // Styles globaux pour optimiser l'espace
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .vfrc-message--extension-Calendly,
        .vfrc-message--extension-Calendly .vfrc-bubble {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        .vfrc-message--extension-Calendly .vfrc-bubble-content {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
        }
        
        .calendly-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .calendly-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
          color: ${primaryColor};
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .calendly-spinner::after {
          content: '';
          width: 24px;
          height: 24px;
          border: 4px solid rgba(0,0,0,0.1);
          border-left-color: ${primaryColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `;
      document.head.appendChild(styleElement);
      
      // Créer le conteneur principal
      const container = document.createElement('div');
      container.classList.add('calendly-container');
      container.style.backgroundColor = backgroundColor;
      container.style.color = textColor;
      
      // Ajouter un spinner de chargement
      const loadingSpinner = document.createElement('div');
      loadingSpinner.classList.add('calendly-spinner');
      loadingSpinner.textContent = "";
      container.appendChild(loadingSpinner);
      
      // Créer l'iframe pour Calendly
      const calendlyIframe = document.createElement('iframe');
      calendlyIframe.style.width = width;
      calendlyIframe.style.height = `${height}px`;
      calendlyIframe.style.border = 'none';
      calendlyIframe.style.display = 'none';  // Caché jusqu'au chargement
      
      // Construire l'URL avec les paramètres
      let calendlyUrl = url;
      if (url.indexOf('?') === -1) {
        calendlyUrl += '?';
      } else {
        calendlyUrl += '&';
      }
      
      calendlyUrl += `hide_gdpr_banner=${hideCookieBanner}`;
      calendlyUrl += `&hide_cookie_banner=${hideCookieBanner}`;
      calendlyUrl += `&hide_event_type_details=${hideEventTypeDetails}`;
      calendlyUrl += `&hide_prerequisite_banner=${hidePrerequisiteBanner}`;
      calendlyUrl += `&primary_color=${encodeURIComponent(primaryColor.replace('#', ''))}`;
      calendlyUrl += `&background_color=${encodeURIComponent(backgroundColor.replace('#', ''))}`;
      calendlyUrl += `&text_color=${encodeURIComponent(textColor.replace('#', ''))}`;
      
      calendlyIframe.src = calendlyUrl;
      
      // Événement de chargement de l'iframe
      calendlyIframe.addEventListener('load', () => {
        loadingSpinner.style.display = 'none';
        calendlyIframe.style.display = 'block';
        
        // Redimensionnement du conteneur parent si nécessaire
        setTimeout(() => {
          const messageElement = element.closest('.vfrc-message');
          if (messageElement) {
            messageElement.style.width = '100%';
            messageElement.style.maxWidth = '100%';
          }
        }, 100);
      });
      
      container.appendChild(calendlyIframe);
      element.appendChild(container);
      
      // Intégrer le script Calendly pour les événements
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      
      // Écouter les événements Calendly
      script.onload = () => {
        window.addEventListener('message', (e) => {
          if (e.data.event && e.data.event.indexOf('calendly') === 0) {
            // Traiter les événements Calendly
            console.log('Événement Calendly reçu:', e.data.event);
            
            // Capture des événements de prise de rendez-vous
            if (e.data.event === 'calendly.event_scheduled') {
              const eventDetails = e.data.payload;
              console.log('Rendez-vous programmé:', eventDetails);
              
              // Envoyer l'information à Voiceflow
              window.voiceflow.chat.interact({
                type: 'calendly_event',
                payload: {
                  event: 'scheduled',
                  uri: eventDetails.uri,
                  inviteeUri: eventDetails.invitee.uri,
                  eventType: eventDetails.event_type.name,
                  eventDate: eventDetails.event.start_time
                }
              });
            }
          }
        });
      };
      
      document.head.appendChild(script);
      
      console.log("Rendu de l'extension Calendly terminé");
      
    } catch (error) {
      console.error("Erreur lors du rendu de l'extension Calendly:", error);
      // Afficher un message d'erreur à l'utilisateur
      element.innerHTML = `
        <div style="color: red; padding: 15px; border: 1px solid red; border-radius: 5px;">
          Impossible de charger le calendrier. Veuillez réessayer plus tard.
        </div>
      `;
    }
  }
};
