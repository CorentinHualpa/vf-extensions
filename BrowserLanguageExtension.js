/**
 * BrowserLanguageExtension v1.2.0 - Version corrigée
 * - Gestion améliorée du flag anti-doublon par session
 * - Meilleur timing pour éviter les blocages
 */
export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',
  
  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',
    
  effect: async ({ trace }) => {
    try {
      // Génère un ID unique pour cette trace/session
      const traceId = `${trace?.id || Date.now()}_${Math.random()}`;
      
      // Utilise un flag spécifique à cette session de chat
      const flagKey = `__vf_lang_${traceId}`;
      
      // Vérifie si déjà traité pour CETTE trace spécifique
      if (window[flagKey]) return;
      window[flagKey] = true;
      
      // Nettoie les anciens flags (garde seulement les 5 derniers)
      const flags = Object.keys(window).filter(k => k.startsWith('__vf_lang_'));
      if (flags.length > 5) {
        flags.slice(0, -5).forEach(k => delete window[k]);
      }
      
      // Configuration
      const cfg = trace?.payload || {};
      const includeLocation = !!cfg.includeLocation;
      const includeScreen = !!cfg.includeScreen;
      const includeNetwork = !!cfg.includeNetwork;
      
      // Attendre que le widget soit vraiment prêt
      let attempts = 0;
      const waitForReady = async () => {
        while (!window.voiceflow?.chat?.interact && attempts < 20) {
          await new Promise(r => setTimeout(r, 50));
          attempts++;
        }
      };
      await waitForReady();
      
      // --- Collecte des données ---
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
      
      // Fonction d'envoi avec retry
      const sendWithRetry = async (payload, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            if (window.voiceflow?.chat?.interact) {
              window.voiceflow.chat.interact({ type: 'complete', payload });
              
              // Marque comme envoyé avec succès
              window[`${flagKey}_sent`] = true;
              return true;
            }
          } catch (e) {
            console.warn(`BrowserLanguageExtension: Tentative ${i + 1} échouée`, e);
          }
          
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 100 * (i + 1)));
          }
        }
        return false;
      };
      
      // Prépare le payload de base
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
        extVersion: '1.2.0'
      };
      
      // Géolocalisation si demandée
      if (includeLocation && navigator.geolocation) {
        const opts = { timeout: 5000, maximumAge: 300000, enableHighAccuracy: false };
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await sendWithRetry({
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
            await sendWithRetry({
              ...basePayload,
              location: { 
                error: true, 
                message: err?.message ?? 'Location error',
                code: err?.code ?? null 
              }
            });
          },
          opts
        );
      } else {
        // Envoi direct sans géoloc
        await sendWithRetry(basePayload);
      }
      
    } catch (e) {
      console.error('BrowserLanguageExtension error:', e);
      
      // Fallback minimal avec retry
      const fallbackPayload = {
        browserLanguage: navigator.language || 'fr',
        primaryLanguage: (navigator.language || 'fr').split('-')[0] || 'fr',
        platform: 'Unknown',
        deviceType: 'Unknown',
        error: true,
        errorMessage: e?.message ?? String(e),
        ts: Date.now()
      };
      
      // Tente d'envoyer le fallback
      for (let i = 0; i < 3; i++) {
        if (window.voiceflow?.chat?.interact) {
          try {
            window.voiceflow.chat.interact({ type: 'complete', payload: fallbackPayload });
            break;
          } catch {}
        }
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }
};

export default BrowserLanguageExtension;
