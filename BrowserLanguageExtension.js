/**
 * BrowserLanguageExtension v1.3 — restart-safe + stopOnAction-safe
 * - COMPLETE pour CHAQUE trace "ext_browserLanguage" (pas one-shot)
 * - Anti-doublon par id de trace
 * - Aucun await: envoie immédiatement (compatible Stop on action)
 */

export const BrowserLanguageExtension = {
  name: 'ext_browserLanguage',
  type: 'effect',

  match: ({ trace }) =>
    trace?.type === 'ext_browserLanguage' ||
    trace?.payload?.name === 'ext_browserLanguage',

  effect: ({ trace }) => {
    try {
      // --- Anti-doublon par trace ---
      const traceId =
        trace?.id ||
        trace?.payload?.traceId ||
        // fallback si pas d'id: hash léger du payload
        (trace?.payload ? JSON.stringify(trace.payload).slice(0, 64) : 't:' + Date.now());

      window.__vf_blang_seen = window.__vf_blang_seen || new Set();
      if (window.__vf_blang_seen.has(traceId)) return;
      window.__vf_blang_seen.add(traceId);

      // --- Données langue / environnement (légères) ---
      const browserLanguage = navigator.language || navigator.userLanguage || 'fr';
      const supported = Array.isArray(navigator.languages) && navigator.languages.length
        ? Array.from(new Set([browserLanguage, ...navigator.languages]))
        : [browserLanguage];
      const primaryLanguage = (browserLanguage.split('-')[0]) || 'fr';

      const pf = navigator.platform || '';
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (pf === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      const deviceType = isIOS || /Mobi|Android/i.test(ua) ? 'Mobile'
                        : (/Tablet|iPad/.test(ua) || (isAndroid && !/Mobile/.test(ua)) ? 'Tablet' : 'Desktop');

      let platform = 'Unknown';
      if (isIOS) platform = 'iOS';
      else if (isAndroid) platform = 'Android';
      else if (/Win/.test(pf) || /Windows/.test(ua)) platform = 'Windows';
      else if (/Mac/.test(pf)) platform = 'macOS';
      else if (/Linux/.test(pf)) platform = 'Linux';

      const payload = {
        browserLanguage,
        primaryLanguage,
        supportedLanguages: supported,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        currentTime: new Date().toISOString(),
        platform,
        deviceType,
        onlineStatus: !!navigator.onLine,
        extVersion: '1.3.0'
      };

      // --- COMPLETE immédiatement (stopOnAction OK) ---
      if (window.voiceflow?.chat?.interact) {
        window.voiceflow.chat.interact({ type: 'complete', payload });
      } else {
        // Rare: si interact pas prêt, on tente dans une micro-tâche
        Promise.resolve().then(() =>
          window.voiceflow?.chat?.interact?.({ type: 'complete', payload })
        );
      }
    } catch (e) {
      // Fallback minimal
      window.voiceflow?.chat?.interact?.({
        type: 'complete',
        payload: {
          browserLanguage: 'fr',
          primaryLanguage: 'fr',
          error: true,
          message: e?.message || String(e),
          extVersion: '1.3.0'
        }
      });
    }
  }
};

export default BrowserLanguageExtension;
