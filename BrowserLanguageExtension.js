/**
 * BrowserLanguageExtension v2.1.0 — Correction blocages
 */
export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',
  match: ({ trace }) =>
    (trace?.payload?.name === 'ext_browserLanguage'),
  
  effect: ({ trace, context }) => {
    // ✅ Idempotence par CONVERSATION (pas globale)
    const conversationId = context?.versionID || 'default';
    const flagKey = `__VF_LANG_${conversationId}__`;
    
    if (window[flagKey]) {
      console.log('⚠️ Extension déjà exécutée pour cette conversation');
      return;
    }
    window[flagKey] = true;

    const cfg = trace?.payload || {};
    const includeLocation = !!cfg.includeLocation;
    const includeScreen   = !!cfg.includeScreen;
    const includeNetwork  = !!cfg.includeNetwork;

    // Collecte synchrone
    const langs = (() => {
      const arr = [];
      if (navigator.language) arr.push(navigator.language);
      if (Array.isArray(navigator.languages)) {
        for (const l of navigator.languages) if (l && !arr.includes(l)) arr.push(l);
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
    const platform =
      isIOS ? 'iOS' :
      isAndroid ? 'Android' :
      /Win/.test(pf) ? 'Windows' :
      (/Mac/.test(pf) && !isIOS) ? 'macOS' :
      /Linux/.test(pf) ? 'Linux' : 'Unknown';

    const basePayload = {
      browserLanguage: langs[0],
      primaryLanguage: primary,
      supportedLanguages: langs,
      detectedLocale: Intl.DateTimeFormat().resolvedOptions().locale || langs[0] || 'fr',
      platform,
      deviceType: isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      currentTime: new Date().toISOString(),
      onlineStatus: !!navigator.onLine,
      ts: Date.now(),
      extVersion: '2.1.0'
    };

    if (includeScreen && typeof screen !== 'undefined') {
      basePayload.screen = {
        w: screen.width ?? null,
        h: screen.height ?? null,
        dpr: window.devicePixelRatio ?? 1
      };
    }

    if (includeNetwork) {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c) {
        basePayload.network = {
          effectiveType: c.effectiveType ?? null,
          downlink: c.downlink ?? null,
          rtt: c.rtt ?? null,
          saveData: !!c.saveData
        };
      }
    }

    // ✅ Attente plus robuste du widget
    const waitForVFReady = (timeoutMs = 8000) => new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 160; // 8s / 50ms
      
      const check = () => {
        attempts++;
        
        const isReady = !!(
          window.voiceflow?.chat?.interact &&
          typeof window.voiceflow.chat.interact === 'function' &&
          (window.voiceflow.chat.isLoaded || window.voiceflow.chat.state?.loaded)
        );
        
        if (isReady) {
          console.log('✅ Widget prêt après', attempts * 50, 'ms');
          return resolve();
        }
        
        if (attempts >= maxAttempts) {
          console.warn('⏱️ Timeout widget - envoi quand même');
          return resolve(); // On résout quand même pour ne pas bloquer
        }
        
        setTimeout(check, 50);
      };
      
      check();
    });

    // ✅ Fire & forget avec meilleur logging
    (async () => {
      try {
        await waitForVFReady();
        
        // Délai supplémentaire pour éviter texte coupé
        await new Promise(r => setTimeout(r, 100));
        
        console.log('📤 Envoi données navigateur:', basePayload);
        
        // Envoi du payload
        window.voiceflow?.chat?.interact?.({ 
          type: 'complete', 
          payload: basePayload 
        });
        
        console.log('✅ Extension exécutée avec succès');

        // Géolocalisation optionnelle
        if (includeLocation && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('📍 Géoloc reçue');
              window.voiceflow?.chat?.interact?.({
                type: 'event',
                payload: {
                  name: 'ext_browserLanguage:location',
                  data: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    at: pos.timestamp
                  }
                }
              });
            },
            (err) => {
              console.warn('⚠️ Géoloc refusée:', err.message);
              window.voiceflow?.chat?.interact?.({
                type: 'event',
                payload: {
                  name: 'ext_browserLanguage:location',
                  data: { error: true, message: err?.message ?? 'Location denied', code: err?.code ?? null }
                }
              });
            },
            { timeout: 5000, maximumAge: 300000, enableHighAccuracy: false }
          );
        }
      } catch (error) {
        console.error('❌ Erreur extension:', error);
      }
    })();
  }
};

export default BrowserLanguageExtension;
