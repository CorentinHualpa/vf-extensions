/**
 * BrowserLanguageExtension v1.4.1 - Corrigé pour Voiceflow
 */
export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',
  
  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',
    
  effect: async ({ trace }) => {
    // Fonction utilitaire pour attendre le chargement de Voiceflow
    const waitForVoiceflowLoaded = async (maxAttempts = 50, interval = 200) => {
      console.log('⏳ Attente du chargement complet de Voiceflow...');
      
      for (let i = 0; i < maxAttempts; i++) {
        try {
          // Vérifier que Voiceflow existe
          if (window.voiceflow?.chat) {
            const chat = window.voiceflow.chat;
            
            // Vérifier les différents états possibles
            const hasInteract = typeof chat.interact === 'function';
            const hasLoad = typeof chat.load === 'function';
            const hasOpen = typeof chat.open === 'function';
            
            // Essayer de détecter si le chat est "loaded"
            const seemsLoaded = chat._loaded === true || 
                               chat.loaded === true || 
                               chat.isLoaded === true ||
                               chat.ready === true ||
                               (hasInteract && hasOpen);
            
            console.log(`Tentative ${i + 1}/${maxAttempts} - Interact:${hasInteract} Load:${hasLoad} Open:${hasOpen} Loaded:${seemsLoaded}`);
            
            // Si tout semble prêt
            if (hasInteract && seemsLoaded) {
              console.log('🎉 Voiceflow semble chargé ! Délai de sécurité...');
              await new Promise(resolve => setTimeout(resolve, 500));
              return true;
            }
            
            // Si on a au moins interact, on peut essayer après un délai plus long
            if (hasInteract && i > 10) {
              console.log('⚠️ Voiceflow partiellement prêt, on continue...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return true;
            }
          }
        } catch (error) {
          console.log(`Erreur lors de la vérification ${i + 1}: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      console.log('⚠️ Timeout atteint, utilisation du fallback');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return false;
    };

    try {
      // Anti-doublon par session
      const sessionId = trace?.timestamp || Date.now();
      const flagKey = `__vf_lang_session_${sessionId}`;
      
      if (window[flagKey]) return;
      window[flagKey] = true;
      
      const cfg = trace?.payload || {};
      const includeLocation = !!cfg.includeLocation;
      const includeScreen = !!cfg.includeScreen;
      const includeNetwork = !!cfg.includeNetwork;
      
      console.log('🌍 Extension démarrée, attente du chargement complet...');
      
      // Attendre que Voiceflow soit complètement chargé
      await waitForVoiceflowLoaded();
      
      console.log('✅ Voiceflow chargé, collecte des données...');
      
      // Collecte des données
      const langs = (() => {
        const arr = [];
        if (navigator.language) arr.push(navigator.language);
        if (Array.isArray(navigator.languages)) {
          for (const l of navigator.languages) if (!arr.includes(l)) arr.push(l);
        }
        return arr.length ? arr : ['fr'];
      })();
      
      const primary = (langs[0] || 'fr').split('-')[0] || 'fr';
      
      const ua = navigator.userAgent || '';
      const pf = navigator.platform || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (pf === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      const isMobile = /Mobi|Android/i.test(ua) || isIOS;
      const isTablet = /Tablet|iPad/.test(ua) || (isAndroid && !/Mobile/.test(ua));
      
      let platform = 'Unknown';
      if (isIOS) platform = 'iOS';
      else if (isAndroid) platform = 'Android';
      else if (/Win/.test(pf)) platform = 'Windows';
      else if (/Mac/.test(pf) && !isIOS) platform = 'macOS';
      else if (/Linux/.test(pf) && !isAndroid) platform = 'Linux';
      
      const timeInfo = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: Intl.DateTimeFormat().resolvedOptions().locale || langs[0] || 'fr',
        currentTime: new Date().toISOString()
      };
      
      const screenInfo = includeScreen ? {
        w: screen?.width ?? null,
        h: screen?.height ?? null,
        dpr: window?.devicePixelRatio ?? 1
      } : undefined;
      
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const networkInfo = includeNetwork && connection ? {
        effectiveType: connection.effectiveType ?? null,
        downlink: connection.downlink ?? null,
        rtt: connection.rtt ?? null,
        saveData: !!connection.saveData
      } : undefined;
      
      // Payload de base
      const basePayload = {
        browserLanguage: langs[0],
        primaryLanguage: primary,
        supportedLanguages: langs,
        detectedLocale: timeInfo.locale,
        platform,
        deviceType: isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop',
        timezone: timeInfo.timezone,
        currentTime: timeInfo.currentTime,
        onlineStatus: !!navigator.onLine,
        ...(screenInfo ? { screen: screenInfo } : {}),
        ...(networkInfo ? { network: networkInfo } : {}),
        ts: Date.now(),
        extVersion: '1.4.1'
      };
      
      // Fonction d'envoi
      const sendComplete = async (payload) => {
        console.log('📤 Envoi des données:', payload);
        
        // Délai de sécurité avant envoi
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (window.voiceflow?.chat?.interact) {
          window.voiceflow.chat.interact({ 
            type: 'complete', 
            payload 
          });
          console.log('✅ Données envoyées avec succès');
        } else {
          console.error('❌ Widget Voiceflow non disponible pour l\'envoi');
        }
      };
      
      // Géolocalisation si demandée
      if (includeLocation && navigator.geolocation) {
        console.log('📍 Demande de géolocalisation...');
        
        const opts = { 
          timeout: 5000, 
          maximumAge: 300000, 
          enableHighAccuracy: false 
        };
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            console.log('📍 Géolocalisation obtenue');
            await sendComplete({
              ...basePayload,
              location: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                at: pos.timestamp
              }
            });
          },
          async (err) => {
            console.log('📍 Géolocalisation refusée:', err?.message);
            await sendComplete({
              ...basePayload,
              location: { 
                error: true, 
                message: err?.message ?? 'Location denied',
                code: err?.code ?? null 
              }
            });
          },
          opts
        );
      } else {
        // Envoi direct sans géoloc
        await sendComplete(basePayload);
      }
      
    } catch (e) {
      console.error('❌ BrowserLanguageExtension error:', e);
      
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (window.voiceflow?.chat?.interact) {
        window.voiceflow.chat.interact({ 
          type: 'complete',
          payload: {
            browserLanguage: navigator.language || 'fr',
            primaryLanguage: (navigator.language || 'fr').split('-')[0] || 'fr',
            platform: 'Unknown',
            deviceType: 'Unknown',
            error: true,
            errorMessage: e?.message ?? String(e),
            ts: Date.now(),
            extVersion: '1.4.1'
          }
        });
      }
    }
  }
};

export default BrowserLanguageExtension;
