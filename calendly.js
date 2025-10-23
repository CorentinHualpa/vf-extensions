export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload?.name === 'ext_calendly',
  render: ({ trace, element }) => {
    console.log('[CalendlyExtension] ===== DÉMARRAGE =====');
    console.log('[CalendlyExtension] Trace reçu:', trace);
    console.log('[CalendlyExtension] Payload reçu:', trace.payload);
    
    // ✅ VALIDATION: L'URL est OBLIGATOIRE
    if (!trace.payload || !trace.payload.url) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'padding: 20px; background: #ffebee; color: #c62828; border-radius: 8px; border: 2px solid #ef5350;';
      errorDiv.innerHTML = `
        <strong>❌ Erreur Calendly:</strong><br>
        L'URL Calendly est obligatoire mais n'a pas été fournie.<br>
        <small>Vérifiez votre configuration Voiceflow.</small>
      `;
      element.appendChild(errorDiv);
      console.error('[CalendlyExtension] URL manquante dans le payload');
      return;
    }
    
    // 1. Récupérer les paramètres depuis le bloc Voiceflow
    const {
      url,  // ✅ PLUS de valeur par défaut !
      height = 800,
      minWidth = '320px',
      backgroundColor = '#ffffff',
      calendlyToken = '',
      // Paramètres pour précharger les données
      prefillName = '',
      prefillEmail = '',
      prefillReason = '',
      prefillPhone = '',
      customAnswers = {} // Objet pour réponses personnalisées
    } = trace.payload;
    
    console.log('[CalendlyExtension] URL à utiliser:', url);
    console.log('[CalendlyExtension] Token présent:', !!calendlyToken);
    console.log('[CalendlyExtension] Custom answers:', customAnswers);
    
    // ✅ VALIDATION: Vérifier que l'URL est bien une URL Calendly valide
    if (!url.includes('calendly.com')) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'padding: 20px; background: #ffebee; color: #c62828; border-radius: 8px; border: 2px solid #ef5350;';
      errorDiv.innerHTML = `
        <strong>❌ Erreur Calendly:</strong><br>
        L'URL fournie n'est pas une URL Calendly valide.<br>
        <small>URL reçue: ${url}</small>
      `;
      element.appendChild(errorDiv);
      console.error('[CalendlyExtension] URL invalide:', url);
      return;
    }
    
    // 2. Construction de l'URL avec préchargement
    const buildCalendlyUrl = () => {
      let urlObj;
      
      try {
        urlObj = new URL(url);
      } catch (err) {
        console.error('[CalendlyExtension] Erreur parsing URL:', err);
        return url;
      }
      
      console.log('[CalendlyExtension] Construction URL avec préchargement...');
      
      // Préchargement uniquement si les valeurs existent et ne sont pas vides
      if (prefillName && prefillName.trim() !== '') {
        urlObj.searchParams.set('name', prefillName);
        console.log('[CalendlyExtension] - Ajout name:', prefillName);
      }
      if (prefillEmail && prefillEmail.trim() !== '') {
        urlObj.searchParams.set('email', prefillEmail);
        console.log('[CalendlyExtension] - Ajout email:', prefillEmail);
      }
      if (prefillPhone && prefillPhone.trim() !== '') {
        urlObj.searchParams.set('phone_number', prefillPhone);
        console.log('[CalendlyExtension] - Ajout phone:', prefillPhone);
      }
      
      // Préchargement des questions personnalisées (customAnswers)
      if (customAnswers && typeof customAnswers === 'object') {
        Object.keys(customAnswers).forEach((key) => {
          const value = customAnswers[key];
          if (value && String(value).trim() !== '') {
            urlObj.searchParams.set(key, String(value));
            console.log(`[CalendlyExtension] - Ajout customAnswer ${key}:`, value);
          }
        });
      }
      
      return urlObj.toString();
    };
    
    const finalUrl = buildCalendlyUrl();
    console.log('[CalendlyExtension] ✅ URL finale avec préchargement:', finalUrl);
    
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
      
      .calendly-inline-widget {
        min-width: ${minWidth} !important;
        background-color: ${backgroundColor} !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // 4. Créer un conteneur pour Calendly
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    container.style.minWidth = minWidth;
    element.appendChild(container);
    
    // 5. Ajuster la largeur de la bulle Voiceflow
    setTimeout(() => {
      const messageEl = element.closest('.vfrc-message');
      if (messageEl) {
        messageEl.style.width = '100%';
        messageEl.style.maxWidth = '100%';
      }
    }, 0);
    
    // 6. Fonction d'init Calendly
    const initWidget = () => {
      if (window.Calendly && typeof window.Calendly.initInlineWidget === 'function') {
        console.log('[CalendlyExtension] Initialisation du widget Calendly...');
        
        window.Calendly.initInlineWidget({
          url: finalUrl,
          parentElement: container
        });
        
        console.log('[CalendlyExtension] ✅ Widget initialisé avec succès');
      } else {
        console.log('[CalendlyExtension] En attente du chargement de Calendly...');
        setTimeout(initWidget, 100);
      }
    };
    
    // 7. Charger le script Calendly si nécessaire
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      console.log('[CalendlyExtension] Chargement du script Calendly...');
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        console.log('[CalendlyExtension] ✅ Script Calendly chargé');
        initWidget();
      };
      script.onerror = () => {
        console.error('[CalendlyExtension] ❌ Erreur de chargement du script Calendly');
      };
      document.head.appendChild(script);
    } else {
      console.log('[CalendlyExtension] Script Calendly déjà présent');
      initWidget();
    }
    
    // 8. Fonction utilitaire pour extraire l'UUID depuis l'URI Calendly
    function parseEventUuid(eventUri) {
      if (!eventUri) return null;
      const match = eventUri.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    }
    
    // 9. Stockage global pour les sélections Calendly
    if (!window.voiceflow) {
      window.voiceflow = {};
    }
    
    // Fonction pour extraire les questions et réponses importantes
    function extractImportantInfo(details) {
      const result = {
        reason: "",
        phone: "",
        website: ""
      };
      
      // Chercher dans les questions_and_answers
      if (details.questions_and_answers && Array.isArray(details.questions_and_answers)) {
        console.log("[CalendlyExtension] Analyse des questions_and_answers:", details.questions_and_answers);
        
        for (const qa of details.questions_and_answers) {
          if (!qa || !qa.question) continue;
          
          const question = qa.question.toLowerCase();
          const answer = qa.answer || "";
          
          // Recherche du site internet
          if (question.includes("site") && 
              (question.includes("internet") || question.includes("web"))) {
            console.log("[CalendlyExtension] Site internet trouvé:", answer);
            result.website = answer;
          }
          
          // Recherche du champ de préparation de réunion
          if (question.includes("partager") && 
              (question.includes("préparation") || question.includes("réunion")) || 
              question.includes("utile")) {
            console.log("[CalendlyExtension] Raison (préparation réunion) trouvée:", answer);
            result.reason = answer;
          }
          
          // Recherche explicite de la raison
          if (question.includes("raison") || 
              question.includes("motif") || 
              question.includes("pourquoi") || 
              question.includes("sujet")) {
            console.log("[CalendlyExtension] Raison explicite trouvée:", answer);
            result.reason = answer;
          }
          
          // Recherche du numéro de téléphone
          if (question.includes("sms") || 
              question.includes("téléphone") || 
              question.includes("portable") ||
              question.includes("mobile") ||
              question.includes("phone")) {
            console.log("[CalendlyExtension] Numéro de téléphone trouvé:", answer);
            result.phone = answer;
          }
        }
      }
      
      // Chercher également dans d'autres champs possibles
      if (!result.phone && details.invitee && details.invitee.text_reminder_number) {
        result.phone = details.invitee.text_reminder_number;
        console.log("[CalendlyExtension] Téléphone trouvé dans text_reminder_number:", result.phone);
      }
      
      return result;
    }
    
    // 10. Écoute des événements Calendly
    const calendlyListener = async (e) => {
      if (!e.data || typeof e.data !== 'object' || !e.data.event) return;
      if (!e.data.event.startsWith('calendly')) return;
      
      console.log("[CalendlyExtension] ===== ÉVÉNEMENT CALENDLY =====");
      console.log("[CalendlyExtension] Type:", e.data.event);
      console.log("[CalendlyExtension] Données:", e.data);
      
      const details = e.data.payload || {};
      
      // Stocker la dernière sélection Calendly globalement
      window.voiceflow.lastCalendlySelection = details;
      
      // Lorsqu'un créneau est confirmé
      if (e.data.event === 'calendly.event_scheduled') {
        console.log("[CalendlyExtension] 🎉 RENDEZ-VOUS CONFIRMÉ");
        
        // Extraire l'event.uri pour obtenir l'UUID
        const eventUri = details.event?.uri || details.uri; 
        const eventUuid = parseEventUuid(eventUri);
        const inviteeUri = details.invitee?.uri;
        
        console.log("[CalendlyExtension] - Event URI:", eventUri);
        console.log("[CalendlyExtension] - Event UUID:", eventUuid);
        console.log("[CalendlyExtension] - Invitee URI:", inviteeUri);
        
        // Extraire les informations importantes (raison, téléphone, website)
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
        
        // 11. Si on a un token et un eventUuid, on va appeler l'API Calendly
        if (calendlyToken && calendlyToken.trim() !== '') {
          console.log("[CalendlyExtension] Token Calendly disponible, appel API...");
          
          // Sauvegarder l'accès au token pour le script de capture
          window.voiceflow.calendlyToken = calendlyToken;
          
          // Si on a l'URI de l'invité, on récupère ses informations
          if (inviteeUri) {
            console.log("[CalendlyExtension] Récupération des détails de l'invité via API...");
            try {
              const inviteeRes = await fetch(inviteeUri, {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (inviteeRes.ok) {
                const inviteeData = await inviteeRes.json();
                console.log("[CalendlyExtension] ✅ Données invité récupérées:", inviteeData);
                
                // Mise à jour avec les données fraîches de l'API
                if (inviteeData.resource) {
                  finalPayload.inviteeEmail = inviteeData.resource.email || finalPayload.inviteeEmail;
                  finalPayload.inviteeName = inviteeData.resource.name || finalPayload.inviteeName;
                  
                  // Mise à jour du téléphone si disponible
                  if (inviteeData.resource.text_reminder_number) {
                    finalPayload.phone = inviteeData.resource.text_reminder_number || finalPayload.phone;
                  }
                  
                  // Récupération des questions/réponses si disponibles
                  if (Array.isArray(inviteeData.resource.questions_and_answers)) {
                    finalPayload.inviteeQuestions = inviteeData.resource.questions_and_answers;
                    
                    // Mise à jour des infos importantes
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
                console.warn("[CalendlyExtension] ⚠️ Échec de la requête invitee:", inviteeRes.status);
              }
            } catch (err) {
              console.error("[CalendlyExtension] ❌ Erreur appel API invitee:", err);
            }
          }
          
          // Si on a l'UUID de l'événement, on récupère ses détails
          if (eventUuid) {
            console.log("[CalendlyExtension] Récupération des détails de l'événement via API...");
            try {
              const eventRes = await fetch(`https://api.calendly.com/scheduled_events/${eventUuid}`, {
                headers: {
                  "Authorization": `Bearer ${calendlyToken}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (eventRes.ok) {
                const eventData = await eventRes.json();
                console.log("[CalendlyExtension] ✅ Données événement récupérées:", eventData);
                
                // Mise à jour avec les données fraîches de l'API
                if (eventData.resource) {
                  finalPayload.startTime = eventData.resource.start_time || finalPayload.startTime;
                  finalPayload.endTime = eventData.resource.end_time || finalPayload.endTime;
                  finalPayload.location = eventData.resource.location?.location || finalPayload.location;
                  
                  // Récupérer le nom de l'event type si disponible
                  if (eventData.resource.event_type) {
                    finalPayload.eventType = eventData.resource.event_type;
                  }
                }
              } else {
                console.warn("[CalendlyExtension] ⚠️ Échec de la requête event:", eventRes.status);
              }
            } catch (err) {
              console.error("[CalendlyExtension] ❌ Erreur appel API event:", err);
            }
          }
        } else {
          console.log("[CalendlyExtension] Aucun token Calendly - données limitées au webhook");
        }
        
        // 12. Stocker les informations pour le bloc de capture
        window.voiceflow.calendlyEventData = finalPayload;
        
        // Journalisation détaillée des données capturées
        console.log("[CalendlyExtension] ===== DONNÉES FINALES CAPTURÉES =====");
        console.log("- Nom:", finalPayload.inviteeName);
        console.log("- Email:", finalPayload.inviteeEmail);
        console.log("- Téléphone:", finalPayload.phone);
        console.log("- Site web:", finalPayload.website);
        console.log("- Raison:", finalPayload.reason);
        console.log("- Date/heure:", finalPayload.startTime);
        console.log("- Type événement:", finalPayload.eventType);
        console.log("- Location:", finalPayload.location);
        console.log("- Questions/réponses:", finalPayload.inviteeQuestions);
        console.log("=============================================");
        
        // 13. Envoyer le payload final à Voiceflow
        console.log("[CalendlyExtension] 📤 Envoi du payload à Voiceflow...");
        
        if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
          window.voiceflow.chat.interact({
            type: 'calendly_event',
            payload: finalPayload
          });
          console.log("[CalendlyExtension] ✅ Payload envoyé à Voiceflow");
        } else {
          console.error("[CalendlyExtension] ❌ Impossible d'envoyer le payload - window.voiceflow.chat.interact non disponible");
        }
      }
    };
    
    window.addEventListener('message', calendlyListener);
    
    console.log('[CalendlyExtension] ✅ Listener d\'événements activé');
    
    // Nettoyer l'événement quand le composant est détruit
    return () => {
      window.removeEventListener('message', calendlyListener);
      console.log('[CalendlyExtension] Listener supprimé');
    };
  }
};
