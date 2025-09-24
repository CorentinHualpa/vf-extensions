/**
 * BrowserLanguageExtension v1.3.0 - Avec délai pour éviter le texte tronqué 
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
      
      // IMPORTANT: Délai pour laisser le widget respirer
      // Cela évite le texte tronqué
      await new Promise(resolve => setTimeout(resolve, 250));
      
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
        extVersion: '1.3.0'
      };
      
      // Fonction d'envoi avec délai supplémentaire
      const sendComplete = async (payload) => {
        // Petit délai supplémentaire avant l'envoi pour éviter le cut
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (window.voiceflow?.chat?.interact) {
          window.voiceflow.chat.interact({ 
            type: 'complete', 
            payload 
          });
        }
      };
      
      // Géolocalisation si demandée
      if (includeLocation && navigator.geolocation) {
        const opts = { 
          timeout: 5000, 
          maximumAge: 300000, 
          enableHighAccuracy: false 
        };
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
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
      console.error('BrowserLanguageExtension error:', e);
      
      // Fallback avec délai aussi
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
            extVersion: '1.3.0'
          }
        });
      }
    }
  }
};

export default BrowserLanguageExtension;
