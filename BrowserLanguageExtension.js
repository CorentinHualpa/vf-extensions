/**
 * BrowserLanguageExtension (safe / one-shot)
 * - Détecte langue + plateforme
 * - Optionnel: location / screen / network via payload
 * - Ne déclenche qu'une seule fois et attend que le chat soit prêt
 */

export const BrowserLanguageExtension = {
  // IMPORTANT: même nom que le node Voiceflow
  name: 'ext_browserLanguage',
  type: 'effect',

  // Ne réagit QUE sur ce trace d'extension
  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',

  effect: async ({ trace }) => {
    try {
      // Anti-doublon (hot reload, re-render webview, replays)
      if (window.__vf_lang_done) return;
      window.__vf_lang_done = true;

      // Options passées depuis le node (toutes facultatives)
      const cfg = trace?.payload || {};
      const includeLocation = !!cfg.includeLocation;
      const includeScreen   = !!cfg.includeScreen;   // par défaut: false
      const includeNetwork  = !!cfg.includeNetwork;  // par défaut: false

      // Laisse le widget respirer un tick pour éviter le cut du premier message
      await Promise.resolve();
      await new Promise(r => setTimeout(r, 0));

      // --- 1) Langues ---
      const langs = (() => {
        const arr = [];
        if (navigator.language) arr.push(navigator.language);
        if (Array.isArray(navigator.languages)) {
          for (const l of navigator.languages) if (!arr.includes(l)) arr.push(l);
        }
        if (navigator.userLanguage && !arr.includes(navigator.userLanguage)) arr.push(navigator.userLanguage);
        if (navigator.browserLanguage && !arr.includes(navigator.browserLanguage)) arr.push(navigator.browserLanguage);
        return arr.length ? arr : ['fr'];
      })();
      const primary = (langs[0] || 'fr').split('-')[0] || 'fr';

      // --- 2) Plateforme / device léger ---
      const ua = navigator.userAgent || '';
      const pf = navigator.platform || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (pf === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      const isMobile  = /Mobi|Android/i.test(ua) || isIOS;
      const isTablet  = /Tablet|iPad/.test(ua) || (isAndroid && !/Mobile/.test(ua)) || (isIOS && !/Mobi/.test(ua));
      const isDesktop = !isMobile && !isTablet;

      let platform = 'Unknown';
      if (isIOS) platform = 'iOS';
      else if (isAndroid) platform = 'Android';
      else if (/Win/.test(pf) || /Windows/.test(ua)) platform = 'Windows';
      else if (/Mac/.test(pf) && !isIOS) platform = 'macOS';
      else if (/Linux/.test(pf) && !isAndroid) platform = 'Linux';

      const timeInfo = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: Intl.DateTimeFormat().resolvedOptions().locale || langs[0] || 'fr',
        currentTime: new Date().toISOString()
      };

      // --- 3) Écran / réseau si demandé ---
      const screenInfo = includeScreen ? {
        w: screen?.width ?? null,
        h: screen?.height ?? null,
        dpr: window?.devicePixelRatio ?? 1
      } : undefined;

      const connection = (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
      const networkInfo = includeNetwork && connection ? {
        effectiveType: connection.effectiveType ?? null,
        downlink: connection.downlink ?? null,
        rtt: connection.rtt ?? null,
        saveData: !!connection.saveData
      } : undefined;

      // Fonction d’envoi unique
      const send = (extra = {}) => {
        const payload = {
          browserLanguage: langs[0],
          primaryLanguage: primary,
          supportedLanguages: langs,
          detectedLocale: timeInfo.locale,
          platform,
          deviceType: isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop',
          timezone: timeInfo.timezone,
          currentTime: timeInfo.currentTime,
          onlineStatus: !!navigator.onLine,
          ... (screenInfo ? { screen: screenInfo } : {}),
          ... (networkInfo ? { network: networkInfo } : {}),
          ...extra,
          ts: Date.now(),
          extVersion: '1.1.0'
        };

        // Sécurité: ne tente d'interagir que si l'API est prête
        if (window.voiceflow?.chat?.interact) {
          window.voiceflow.chat.interact({ type: 'complete', payload });
        } else {
          // Si l’API n’est pas prête (rare), retente très vite une seule fois
          setTimeout(() => {
            window.voiceflow?.chat?.interact?.({ type: 'complete', payload });
          }, 50);
        }
      };

      // --- 4) Géoloc si demandée ---
      if (includeLocation && navigator.geolocation) {
        const opts = { timeout: 5000, maximumAge: 300000, enableHighAccuracy: false };
        navigator.geolocation.getCurrentPosition(
          pos => send({
            location: {
              latitude:  pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy:  pos.coords.accuracy,
              at: pos.timestamp
            }
          }),
          err => send({ location: { error: true, message: err?.message ?? String(err), code: err?.code ?? null } }),
          opts
        );
      } else {
        send();
      }
    } catch (e) {
      // Fallback minimal et… une seule fois quand même
      window.voiceflow?.chat?.interact?.({
        type: 'complete',
        payload: {
          browserLanguage: 'fr',
          primaryLanguage: 'fr',
          platform: 'Unknown',
          deviceType: 'Unknown',
          error: true,
          errorMessage: e?.message ?? String(e),
          ts: Date.now()
        }
      });
    }
  }
};

export default BrowserLanguageExtension;
