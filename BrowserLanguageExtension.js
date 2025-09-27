/**
 * BrowserLanguageExtension v1.3.1 - Avec vérification d'état du widget améliorée
 */
export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',
  
  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',
    
  effect: async ({ trace }) => {
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
      
      console.log('🌍 Extension démarrée, vérification widget...');
      
      // NOUVEAU: Attendre que le widget soit vraiment prêt
      await this.waitForWidgetReady();
      
      console.log('✅ Widget prêt, collecte des données...');
      
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
        extVersion: '1.3.1'
      };
      
      // Fonction d'envoi avec délai supplémentaire
      const sendComplete = async (payload) => {
        console.log('📤 Envoi des données:', payload);
        
        // Petit délai supplémentaire avant l'envoi pour éviter le cut
        await new Promise(resolve => setTimeout(resolve, 150));
        
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
      
      // Fallback avec délai aussi
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
            extVersion: '1.3.1'
          }
        });
      }
    }
  },
  
  // NOUVELLE MÉTHODE: Vérification d'état du widget
  waitForWidgetReady: async function(maxAttempts = 25, interval = 200) {
    console.log('⏳ Attente de la disponibilité du widget...');
    
    for (let i = 0; i < maxAttempts; i++) {
      // Vérifier si le widget est prêt
      const hasVoiceflow = !!window.voiceflow?.chat?.interact;
      const hasElement = !!document.querySelector('[data-vf-chat]');
      const isNotLoading = !document.querySelector('[data-vf-chat] .loading, [data-vf-chat] .spinner');
      
      console.log(`Tentative ${i + 1}/${maxAttempts} - VF:${hasVoiceflow} Element:${hasElement} Ready:${isNotLoading}`);
      
      if (hasVoiceflow && hasElement && isNotLoading) {
        console.log('🎉 Widget prêt ! Délai de sécurité...');
        // Délai supplémentaire pour être sûr
        await new Promise(resolve => setTimeout(resolve, 400));
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    console.log('⚠️ Timeout atteint, utilisation du fallback');
    // Fallback si pas prêt après tous les essais
    await new Promise(resolve => setTimeout(resolve, 800));
    return false;
  }
};

export default BrowserLanguageExtension;
