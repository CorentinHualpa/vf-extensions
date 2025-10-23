export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  
  // Support Custom Action ET Custom Extension
  match: ({ trace }) => {
    return trace.type === 'ext_calendly' || 
           trace.payload?.name === 'ext_calendly' ||
           (trace.type === 'custom_action' && trace.payload?.action === 'ext_calendly');
  },
  
  render: ({ trace, element }) => {
    // ✅ Extraction des données (Custom Action ou Extension)
    let config = trace.payload || {};
    
    // Si c'est un Custom Action, les données sont dans body
    if (config.body) {
      try {
        config = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
      } catch (e) {
        console.error('[Calendly] Erreur parsing body:', e);
      }
    }
    
    // 1. Récupérer les paramètres depuis le bloc Voiceflow
    const {
      url,
      height = 900,
      minWidth = '320px',
      backgroundColor = '#ffffff',
      calendlyToken = '',
      prefillName = '',
      prefillEmail = '',
      prefillPhone = '',
      customAnswers = {}
    } = config;
    
    // Validation URL
    if (!url) {
      console.error('[Calendly] Erreur: URL manquante');
      element.innerHTML = '<div style="padding:20px;color:#c62828;background:#ffebee;border-radius:8px;">❌ Erreur: URL Calendly manquante</div>';
      return;
    }
    
    console.log('[Calendly] Configuration:', { url, height, hasToken: !!calendlyToken });
    
    // Construction URL avec préchargement
    const buildUrl = () => {
      try {
        const urlObj = new URL(url);
        
        if (prefillName) urlObj.searchParams.set('name', prefillName);
        if (prefillEmail) urlObj.searchParams.set('email', prefillEmail);
        if (prefillPhone) urlObj.searchParams.set('phone_number', prefillPhone);
        
        if (customAnswers && typeof customAnswers === 'object') {
          Object.keys(customAnswers).forEach(key => {
            const value = customAnswers[key];
            if (value && String(value).trim() !== '') {
              urlObj.searchParams.set(key, String(value));
            }
          });
        }
        
        return urlObj.toString();
      } catch (e) {
        console.error('[Calendly] Erreur URL:', e);
        return url;
      }
    };
    
    const finalUrl = buildUrl();
    console.log('[Calendly] URL finale:', finalUrl);
    
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
      
      .calendly-inline-widget {
        min-width: ${minWidth} !important;
        background-color: ${backgroundColor} !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // 3. Créer un conteneur pour Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    element.appendChild(container);
    
    // 4. Ajuster la largeur de la bulle Voiceflow
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);
    
    // 5. Fonction d'init Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        window.Calendly.initInlineWidget({
          url: finalUrl,
          parentElement: container
        });
        console.log('[Calendly] Widget initialisé');
      } else {
        setTimeout(initWidget, 100);
      }
    };
    
    // 6. Charger le script Calendly si nécessaire
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => initWidget();
      script.onerror = () => console.warn("Erreur de chargement Calendly");
      document.head.appendChild(script);
    } else {
      initWidget();
    }
    
    // 7. Fonction utilitaire pour extraire l'UUID depuis l'URI Calendly
    function parseEventUuid(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    }
    
    // 8. Stockage global pour les sélections Calendly
    if (!window.voiceflow) {
      window.voiceflow = {};
    }
    
    // Fonction pour extraire les questions/réponses importantes
    function extractImportantInfo(details) {
      const result = {
        reason: "",
        phone: "",
        website: ""
      };
      
      if (details.questions_and_answers && Array.isArray(details.questions_and_answers)) {
        for (const qa of details.questions_and_answers) {
          if (!qa || !qa.question) continue;
          
          const question = qa.question.toLowerCase();
          const answer = qa.answer || "";
          
          // Site internet
          if (question.includes("site") && (question.includes("internet") || question.includes("web"))) {
            result.website = answer;
          }
          
          // Raison
          if (question.includes("partager") || question.includes("préparation") || 
              question.includes("raison") || question.includes("motif") || 
              question.includes("pourquoi") || question.includes("sujet") ||
              question.includes("utile")) {
            result.reason = answer;
          }
          
          // Téléphone
          if (question.includes("sms") || question.includes("téléphone") || 
              question.includes("portable") || question.includes("mobile") ||
              question.includes("phone")) {
            result.phone = answer;
          }
        }
      }
      
      if (!result.phone && details.invitee && details.invitee.text_reminder_number) {
        result.phone = details.invitee.text_reminder_number;
      }
      
      return result;
    }
    
    // 9. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;
      
      console.log("[Calendly] Événement reçu:", e.data.event, e.data);
      const details = e.data.payload || {};
      
      // Stocker la dernière sélection Calendly globalement
      window.voiceflow.lastCalendlySelection = details;
      
      // Lorsqu'un créneau est confirmé
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("[Calendly] 🎉 Rendez-vous confirmé");
        
        // Extraire l'event.uri pour obtenir l'UUID
        const eventUri = details.event?.uri || details.uri; 
        const eventUuid = parseEventUuid(eventUri);
        const inviteeUri = details.invitee?.uri;
        
        // Extraire infos importantes
        const importantInfo = extractImportantInfo(details);
        
        // Construire un payload de base
        const finalPayload = {
          event: 'scheduled',
          eventUri: eventUri,
          inviteeUri: inviteeUri,
          eventName: details.event_type?.name || 'Rendez-vous',
          inviteeEmail: details.invitee?.email || '',
          inviteeName: details.invitee?.name || '',
          inviteeQuestions: details.questions_and_answers || [],
          startTime: details.event?.start_time || details.scheduled_event?.start_time || '',
          endTime: details.event?.end_time || details.scheduled_event?.end_time || '',
          eventType: details.event_type?.name || '',
          reason: importantInfo.reason || '',
          phone: importantInfo.phone || '',
          website: importantInfo.website || '',
          location: details.event?.location?.location || 'En ligne'
        };
        
        // 10. Si on a un token et un eventUuid, on va appeler l'API Calendly
        if (calendlyToken) {
          window.voiceflow.calendlyToken = calendlyToken;
          console.log("[Calendly] Token disponible");
          
          // Récupérer les détails de l'invité
          if (inviteeUri) {
            console.log("[Calendly] Appel API invitee...");
            try {
              const inviteeRes = await fetch(inviteeUri, {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (inviteeRes.ok) {
                const inviteeData = await inviteeRes.json();
                console.log("[Calendly] Données invité récupérées");
                
                if (inviteeData.resource) {
                  finalPayload.inviteeEmail = inviteeData.resource.email || finalPayload.inviteeEmail;
                  finalPayload.inviteeName = inviteeData.resource.name || finalPayload.inviteeName;
                  
                  if (inviteeData.resource.text_reminder_number) {
                    finalPayload.phone = inviteeData.resource.text_reminder_number || finalPayload.phone;
                  }
                  
                  if (Array.isArray(inviteeData.resource.questions_and_answers)) {
                    finalPayload.inviteeQuestions = inviteeData.resource.questions_and_answers;
                    
                    const apiInfo = extractImportantInfo({questions_and_answers: inviteeData.resource.questions_and_answers});
                    
                    if (apiInfo.reason && !finalPayload.reason) {
                      finalPayload.reason = apiInfo.reason;
                    }
                    if (apiInfo.phone && !finalPayload.phone) {
                      finalPayload.phone = apiInfo.phone;
                    }
                    if (apiInfo.website && !finalPayload.website) {
                      finalPayload.website = apiInfo.website;
                    }
                  }
                }
              } else {
                console.warn("[Calendly] Échec requête invitee:", inviteeRes.status);
              }
            } catch (err) {
              console.error("[Calendly] Erreur API invitee:", err);
            }
          }
          
          // Récupérer les détails de l'événement
          if (eventUuid) {
            console.log("[Calendly] Appel API event...");
            try {
              const eventRes = await fetch(`https://api.calendly.com/scheduled_events/${eventUuid}`, {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (eventRes.ok) {
                const eventData = await eventRes.json();
                console.log("[Calendly] Données événement récupérées");
                
                if (eventData.resource) {
                  finalPayload.startTime = eventData.resource.start_time || finalPayload.startTime;
                  finalPayload.endTime = eventData.resource.end_time || finalPayload.endTime;
                  finalPayload.location = eventData.resource.location?.location || finalPayload.location;
                  
                  if (eventData.resource.event_type) {
                    finalPayload.eventType = eventData.resource.event_type;
                  }
                }
              } else {
                console.warn("[Calendly] Échec requête event:", eventRes.status);
              }
            } catch (err) {
              console.error("[Calendly] Erreur API event:", err);
            }
          }
        } else {
          console.log("[Calendly] Pas de token");
        }
        
        // 11. Stocker les informations pour le bloc de capture
        window.voiceflow.calendlyEventData = finalPayload;
        
        console.log("[Calendly] Données finales:", {
          nom: finalPayload.inviteeName,
          email: finalPayload.inviteeEmail,
          phone: finalPayload.phone,
          reason: finalPayload.reason,
          website: finalPayload.website,
          startTime: finalPayload.startTime
        });
        
        // 12. Envoyer le payload final à Voiceflow avec type 'complete'
        console.log("[Calendly] Envoi à Voiceflow...");
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: finalPayload
        });
      }
    };
    
    window.addEventListener('message', calendlyListener);
    
    // Nettoyer l'événement quand le composant est détruit
    return () => {
      window.removeEventListener('message', calendlyListener);
    };
  }
};
