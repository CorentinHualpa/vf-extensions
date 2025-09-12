/**
 * BrowserLanguageExtension v1.3 — restart-safe + stopOnAction-safe
 * - Traite CHAQUE trace ext_browserLanguage (dédup par trace)
 * - COMPLETE de façon synchrone (compatible stopOnAction)
 * - Retry ultra-court si interact() pas encore prêt
 * - Payload léger (+ screen / network optionnels)
 */

export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',

  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',

  effect: ({ trace }) => {
    try {
      // --- Dédup par trace (et cap mémoire) ---
      const store =
        window.__vf_blang_store ||
        (window.__vf_blang_store = { seen: new Set() });

      const traceKey =
        trace?.id ||
        trace?.payload?.traceId ||
        (trace?.payload ? JSON.stringify(trace.payload).slice(0, 64) : `t-${Date.now()}`);

      if (store.seen.has(traceKey)) return;
      store.seen.add(traceKey);
      if (store.seen.size > 500) store.seen = new Set(); // reset si trop d'entrées

      // --- Options depuis le node (toutes facultatives) ---
      const cfg = trace?.payload || {};
      const includeScreen  = !!cfg.includeScreen;   // false par défaut
      const includeNetwork = !!cfg.includeNetwork;  // false par défaut

      // --- Langues ---
      const languages = (() => {
        const arr = [];
        if (navigator.language) arr.push(navigator.language);
        if (Array.isArray(navigator.languages)) {
          for (const l of navigator.languages) if (!arr.includes(l)) arr.push(l);
        }
        if (navigator.userLanguage && !arr.includes(navigator.userLanguage)) arr.push(navigator.userLanguage);
        if (navigator.browserLanguage && !arr.includes(navigator.browserLanguage)) arr.push(navigator.browserLanguage);
        return arr.length ? arr : ['fr'];
      })();

      const browserLanguage = languages[0];
      const primaryLanguage = (browserLanguage || 'fr').split('-')[0] || 'fr';

      // --- Device très léger (synchrone) ---
      const pf = navigator.platform || '';
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (pf === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      const isMobile  = /Mobi|Android/i.test(ua) || isIOS;
      const isTablet  = /Tablet|iPad/.test(ua) || (isAndroid && !/Mobile/.test(ua)) || (isIOS && !/Mobi/.test(ua));
      const deviceType = isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop';

      const payload = {
        // Langue
        browserLanguage,
        primaryLanguage,
        supportedLanguages: languages,
        // Contexte
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        deviceType,
        onlineStatus: !!navigator.onLine,
        ts: Date.now(),
        extVersion: '1.3.0'
      };

      if (includeScreen) {
        payload.screen = {
          w:  screen?.width ?? null,
          h:  screen?.height ?? null,
          dpr: window?.devicePixelRatio ?? 1
        };
      }

      if (includeNetwork) {
        const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (c) {
          payload.network = {
            effectiveType: c.effectiveType ?? null,
            downlink: c.downlink ?? null,
            rtt: c.rtt ?? null,
            saveData: !!c.saveData
          };
        }
      }

      // --- COMPLETE (synchrone si possible, sinon retry ultra-court) ---
      const send = () =>
        window.voiceflow?.chat?.interact?.({ type: 'complete', payload });

      if (window.voiceflow?.chat?.interact) {
        // StopOnAction-friendly
        send();
      } else {
        // Rare: si l'API n'est pas prête, retry 20x toutes les 25ms
        let tries = 0;
        const id = setInterval(() => {
          tries++;
          if (window.voiceflow?.chat?.interact) { clearInterval(id); send(); }
          else if (tries > 20) { clearInterval(id); /* abandon silencieux */ }
        }, 25);
      }
    } catch (e) {
      // Fallback minimal qui libère quand même le flow
      window.voiceflow?.chat?.interact?.({
        type: 'complete',
        payload: {
          browserLanguage: 'fr',
          primaryLanguage: 'fr',
          error: true,
          message: e?.message || String(e),
          ts: Date.now(),
          extVersion: '1.3.0'
        }
      });
    }
  }
};

export default BrowserLanguageExtension;
