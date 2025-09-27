/**
 * BrowserLanguageExtension v1.5.0 - Version non-bloquante
 */
export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',
  
  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',
    
  effect: ({ trace }) => {
    // IMPORTANT: On retourne immédiatement pour ne pas bloquer Voiceflow
    // Le travail se fait en arrière-plan
    
    const cfg = trace?.payload || {};
    const includeLocation = !!cfg.includeLocation;
    const includeScreen = !!cfg.includeScreen;
    const includeNetwork = !!cfg.includeNetwork;
    
    console.log('🌍 Extension démarrée en arrière-plan...');
    
    // Anti-doublon par session
    const sessionId = trace?.timestamp || Date.now();
    const flagKey = `__vf_lang_session_${sessionId}`;
    
    if (window[flagKey]) {
      console.log('🔄 Extension déjà exécutée pour cette session');
      return;
    }
    window[flagKey] = true;
    
    // Exécution en arrière-plan (ne bloque pas le flow)
    setTimeout(async () => {
      try {
        console.log('⏳ Début du traitement en arrière-plan...');
        
        // Attendre que Voiceflow soit complètement initialisé
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
          if (window.voiceflow?.chat?.interact) {
            console.log(`✅ Voiceflow disponible après ${attempts + 1} tentatives`);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ Timeout: Voiceflow non disponible après 15 secondes');
        }
        
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
          extVersion: '1.5.0'
        };
        
        // Fonction d'envoi
        const sendComplete = async (payload) => {
          console.log('📤 Envoi des données:', payload);
          
          if (window.voiceflow?.chat?.interact) {
            try {
              window.voiceflow.chat.interact({ 
                type: 'complete', 
                payload 
              });
              console.log('✅ Données envoyées avec succès');
            } catch (error) {
              console.error('❌ Erreur lors de l\'envoi:', error);
            }
          } else {
            console.error('❌ Widget Voiceflow non disponible');
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
        if (window.voiceflow?.chat?.interact) {
          try {
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
                extVersion: '1.5.0'
              }
            });
          } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError);
          }
        }
      }
    }, 100); // Démarrage très rapide en arrière-plan
    
    // L'extension retourne immédiatement - ne bloque pas Voiceflow
    console.log('🚀 Extension lancée en arrière-plan, Voiceflow peut continuer');
  }
};

export default BrowserLanguageExtension;
