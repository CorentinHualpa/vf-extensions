/**
 * BrowserLanguageExtension v2.0.0 — non-bloquante
 * - Retourne immédiatement (pas d'await dans effect)
 * - Attend que le widget soit "loaded" avant d'appeler interact()
 * - Idempotence par page (anti double exécution)
 */
export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',

  match: ({ trace }) =>
    // ne traite que le Custom Action nommé "ext_browserLanguage"
    (trace?.payload?.name === 'ext_browserLanguage'),

  effect: ({ trace }) => {
    // --- Idempotence simple (évite doubles envois)
    if (window.__VF_LANG_DONE__) return;
    window.__VF_LANG_DONE__ = true;

    const cfg = trace?.payload || {};
    const includeLocation = !!cfg.includeLocation;
    const includeScreen   = !!cfg.includeScreen;
    const includeNetwork  = !!cfg.includeNetwork;

    // --- Collecte rapide (synchrone)
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
      extVersion: '2.0.0'
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

    // --- Helper: attendre le "loaded" du widget sans bloquer
    const waitForVFLoaded = (timeoutMs = 5000) => new Promise((resolve) => {
      const ok = () =>
        !!(window.voiceflow && window.voiceflow.chat &&
           (window.voiceflow.chat.isLoaded || window.voiceflow.chat.state?.loaded));

      if (ok()) return resolve();

      const onLoad = () => { if (ok()) { cleanup(); resolve(); } };

      const cleanup = () => {
        try {
          window.voiceflow.chat.off?.('load', onLoad);
          window.voiceflow.chat.off?.('ready', onLoad);
        } catch {}
        clearInterval(poll);
        clearTimeout(failsafe);
      };

      try {
        window.voiceflow.chat.on?.('load', onLoad);
        window.voiceflow.chat.on?.('ready', onLoad);
      } catch {}

      const poll = setInterval(onLoad, 50);
      const failsafe = setTimeout(() => { cleanup(); resolve(); }, timeoutMs);
    });

    // --- Fire & forget (ne bloque pas le return de effect)
    (async () => {
      await waitForVFLoaded();
      // micro-délai pour éviter le "texte coupé"
      await new Promise(r => setTimeout(r, 50));

      // 1) Débloque le flow immédiatement avec le payload principal
      window.voiceflow?.chat?.interact?.({ type: 'complete', payload: basePayload });

      // 2) Enrichissement géoloc (optionnel) en événement séparé (ne bloque rien)
      if (includeLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
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
    })();

    // IMPORTANT : pas d'await ici → l'extension ne bloque jamais l'init
  }
};

export default BrowserLanguageExtension;
