/**
 *  Calendly – Voiceflow Extension v3.5
 *  - Fix largeur : utilise element.closest() sur les containers VF connus
 *  - Hide event type details + GDPR banner par défaut
 *  - Prefill nom / email / téléphone
 */
export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  match: ({ trace }) => {
    return trace.type === 'ext_calendly'
      || trace.payload?.name === 'ext_calendly'
      || (trace.type === 'custom_action' && trace.payload?.action === 'ext_calendly');
  },
  render: ({ trace, element }) => {
    console.log('[CAL] render start');

    let config = trace.payload || {};
    if (config.body) {
      try {
        config = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
      } catch (e) { console.error('[CAL] parse error:', e); }
    }

    const {
      url,
      height = 580,
      calendlyToken = '',
      prefillName = '',
      prefillEmail = '',
      prefillPhone = '',
      customAnswers = {},
      loaderText = "Chargement de l'agenda...",
      brandColor = '#E91E63',
      hideEventTypeDetails = true,
      hideGdprBanner = true,
    } = config;

    if (!url) {
      element.innerHTML = '<div style="padding:20px;color:red;">❌ URL Calendly manquante</div>';
      return;
    }

    // ── CONSTRUIRE L'URL FINALE AVEC PARAMS ──
    let finalUrl = url;
    try {
      const u = new URL(url);
      if (hideEventTypeDetails) u.searchParams.set('hide_event_type_details', '1');
      if (hideGdprBanner)       u.searchParams.set('hide_gdpr_banner', '1');
      finalUrl = u.toString();
    } catch (e) {
      // URL invalide, on garde telle quelle
      finalUrl = url;
    }
    console.log('[CAL] finalUrl:', finalUrl);

    // ── CONTAINER ──
    const container = document.createElement('div');
    container.classList.add('cal-ext-root');

    // ── STYLE ──
    const styleEl = document.createElement('style');
    styleEl.textContent = `
.cal-ext-root {
  display: block !important;
  position: relative !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  margin: 0 auto !important;
  min-height: ${height}px !important;
  height: auto !important;
  box-sizing: border-box !important;
}
.cal-ext-loader {
  position: absolute !important;
  inset: 0 !important;
  z-index: 100 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 20px !important;
  background: #ffffff !important;
  transition: opacity 0.6s ease !important;
}
.cal-ext-loader.fade-out {
  opacity: 0 !important;
  pointer-events: none !important;
}
.cal-ext-icon {
  width: 56px !important;
  height: 56px !important;
  position: relative !important;
}
.cal-ext-clip {
  width: 4px !important;
  height: 10px !important;
  background: #bbb !important;
  border-radius: 2px !important;
  position: absolute !important;
  top: 0 !important;
}
.cal-ext-clip-l { left: 14px !important; }
.cal-ext-clip-r { right: 14px !important; }
.cal-ext-body {
  width: 56px !important;
  height: 50px !important;
  position: absolute !important;
  bottom: 0 !important;
  background: #f8f9fa !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 10px !important;
  overflow: hidden !important;
}
.cal-ext-hd {
  height: 15px !important;
  background: ${brandColor} !important;
  width: 100% !important;
}
.cal-ext-dots {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 5px !important;
  padding: 8px 10px 0 !important;
}
.cal-ext-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: #d5d5d5 !important;
  animation: calDotPop 1.4s ease-in-out infinite !important;
}
.cal-ext-dot:nth-child(1) { animation-delay: 0s !important; }
.cal-ext-dot:nth-child(2) { animation-delay: 0.15s !important; }
.cal-ext-dot:nth-child(3) { animation-delay: 0.3s !important; }
.cal-ext-dot:nth-child(4) { animation-delay: 0.1s !important; }
.cal-ext-dot:nth-child(5) { animation-delay: 0.25s !important; }
.cal-ext-dot:nth-child(6) { animation-delay: 0.4s !important; }
@keyframes calDotPop {
  0%, 100% { background: #d5d5d5; transform: scale(1); }
  50% { background: ${brandColor}; transform: scale(1.4); }
}
.cal-ext-txt {
  font-family: -apple-system, sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #757575 !important;
  text-align: center !important;
}
.cal-ext-bar-bg {
  width: 200px !important;
  height: 4px !important;
  background: #eee !important;
  border-radius: 4px !important;
  overflow: hidden !important;
}
.cal-ext-bar {
  height: 100% !important;
  width: 0% !important;
  border-radius: 4px !important;
  background: linear-gradient(90deg, ${brandColor}, #ff6090) !important;
  transition: width 0.15s linear !important;
}
.cal-ext-widget {
  position: relative !important;
  width: 100% !important;
  z-index: 10 !important;
}
.cal-ext-widget .calendly-inline-widget {
  width: 100% !important;
  display: block !important;
}
.cal-ext-widget .calendly-inline-widget iframe {
  width: 100% !important;
  display: block !important;
  border: none !important;
}
    `;
    container.appendChild(styleEl);

    // ── LOADER ──
    const loader = document.createElement('div');
    loader.className = 'cal-ext-loader';
    loader.innerHTML = `
      <div class="cal-ext-icon">
        <div class="cal-ext-clip cal-ext-clip-l"></div>
        <div class="cal-ext-clip cal-ext-clip-r"></div>
        <div class="cal-ext-body">
          <div class="cal-ext-hd"></div>
          <div class="cal-ext-dots">
            <div class="cal-ext-dot"></div><div class="cal-ext-dot"></div><div class="cal-ext-dot"></div>
            <div class="cal-ext-dot"></div><div class="cal-ext-dot"></div><div class="cal-ext-dot"></div>
          </div>
        </div>
      </div>
      <span class="cal-ext-txt">${loaderText}</span>
      <div class="cal-ext-bar-bg"><div class="cal-ext-bar"></div></div>
    `;
    container.appendChild(loader);

    // ── WIDGET ──
    const widget = document.createElement('div');
    widget.className = 'cal-ext-widget';
    container.appendChild(widget);

    // ── FORCE WIDTH SUR ELEMENT ET SON PARENT ──
    // Sans ça, margin: 0 auto n'a rien à centrer
    element.style.display = 'block';
    element.style.width = '100%';
    if (element.parentElement) {
      element.parentElement.style.display = 'block';
      element.parentElement.style.width = '100%';
    }

    // ── INJECT ──
    element.appendChild(container);

    // ──────────────────────────────────────────────────────────────
    // FIX WIDTH DÉFINITIF
    // Stratégie : utiliser element.closest() pour trouver le bon
    // conteneur VF, puis mesurer sa largeur réelle avec getBoundingClientRect
    // ──────────────────────────────────────────────────────────────
    const applyWidth = () => {
      // Sélecteurs VF connus (du plus précis au plus large)
      const selectors = [
        '[class*="vfrc-system-response--container"]',
        '[class*="vfrc-message--container"]',
        '[class*="vfrc-chat--dialogue"]',
        '[class*="vfrc-chat-window"]',
        '[class*="vfrc-chat"]',
        '[class*="vfrc-widget"]',
      ];

      let refEl = null;

      // 1. Essayer element.closest() — le plus fiable
      for (const sel of selectors) {
        try {
          const found = element.closest(sel);
          if (found) {
            const rect = found.getBoundingClientRect();
            if (rect.width > 100) {
              refEl = found;
              console.log(`[CAL] closest(${sel}) → ${rect.width}px`);
              break;
            }
          }
        } catch(e) {}
      }

      // 2. Fallback : querySelector global
      if (!refEl) {
        for (const sel of selectors) {
          const found = document.querySelector(sel);
          if (found) {
            const rect = found.getBoundingClientRect();
            if (rect.width > 100) {
              refEl = found;
              console.log(`[CAL] querySelector(${sel}) → ${rect.width}px`);
              break;
            }
          }
        }
      }

      // 3. Fallback : remonter le DOM manuellement
      if (!refEl) {
        let el = element.parentElement;
        for (let i = 0; i < 15; i++) {
          if (!el || el === document.body) break;
          const rect = el.getBoundingClientRect();
          if (rect.width > 100) {
            refEl = el;
            console.log(`[CAL] ancestor fallback[${i}] → ${rect.width}px`);
            break;
          }
          el = el.parentElement;
        }
      }

      if (!refEl) {
        console.log('[CAL] aucun ref trouvé, skip');
        return;
      }

      const refRect = refEl.getBoundingClientRect();
      const refStyle = window.getComputedStyle(refEl);
      const paddingH = parseFloat(refStyle.paddingLeft || 0) + parseFloat(refStyle.paddingRight || 0);

      // Largeur utilisable = largeur du container - ses paddings - 4px de sécurité
      const usableWidth = Math.max(refRect.width - paddingH - 4, 280);
      console.log(`[CAL] refWidth=${refRect.width} paddingH=${paddingH} → usable=${usableWidth}px`);

      container.style.width = usableWidth + 'px';
      container.style.minWidth = usableWidth + 'px';
      container.style.maxWidth = usableWidth + 'px';

      const iframe = widget.querySelector('iframe');
      if (iframe) {
        iframe.style.width = usableWidth + 'px';
        iframe.style.minWidth = usableWidth + 'px';
      }
    };

    // Appliquer en RAF (layout calculé) + double RAF (rendu finalisé)
    requestAnimationFrame(() => {
      applyWidth();
      requestAnimationFrame(applyWidth);
    });

    // ── FIX SCROLL : forcer overflow sur les parents VF ──
    // L'iframe cross-origin ne bubble pas les events touch/wheel
    // → on force overflow-y: auto sur la chaîne VF jusqu'au dialogue
    const fixParentScroll = () => {
      const scrollSelectors = [
        '[class*="vfrc-chat--dialogue"]',
        '[class*="vfrc-chat-window"]',
        '[class*="vfrc-chat"]',
      ];
      for (const sel of scrollSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.style.overflowY = 'auto';
          el.style.webkitOverflowScrolling = 'touch';
        }
      }
      // Remonter depuis element aussi
      let el = element.parentElement;
      for (let i = 0; i < 10; i++) {
        if (!el || el === document.body) break;
        const cs = window.getComputedStyle(el);
        if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') {
          el.style.overflowY = 'auto';
        }
        el = el.parentElement;
      }
    };
    fixParentScroll();

    // ── FIX SCROLL IFRAME CROSS-ORIGIN ──
    // Pas d'overlay (cause double-clic). On intercepte au niveau window en capture
    // phase uniquement quand la souris/touch est au-dessus du container.
    const getScrollParent = () => {
      let el = element.parentElement;
      for (let i = 0; i < 15; i++) {
        if (!el || el === document.body) return document.documentElement;
        const cs = window.getComputedStyle(el);
        if (/auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) return el;
        el = el.parentElement;
      }
      return document.documentElement;
    };

    const isOverContainer = () => {
      const rect = container.getBoundingClientRect();
      const x = _lastX, y = _lastY;
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    let _lastX = 0, _lastY = 0;
    window.addEventListener('mousemove', (e) => { _lastX = e.clientX; _lastY = e.clientY; }, { passive: true });

    // Wheel capturé au niveau window avant que l'iframe ne l'absorbe
    const wheelHandler = (e) => {
      if (!isOverContainer()) return;
      e.preventDefault();
      getScrollParent()?.scrollBy({ top: e.deltaY * 1.5, behavior: 'smooth' });
    };
    window.addEventListener('wheel', wheelHandler, { passive: false, capture: true });

    // Touch : même approche
    let _ty = 0;
    const touchStartHandler = (e) => {
      const rect = container.getBoundingClientRect();
      const t = e.touches[0];
      if (t.clientX < rect.left || t.clientX > rect.right || t.clientY < rect.top || t.clientY > rect.bottom) return;
      _ty = t.clientY;
    };
    const touchMoveHandler = (e) => {
      if (!_ty) return;
      const rect = container.getBoundingClientRect();
      const t = e.touches[0];
      if (t.clientX < rect.left || t.clientX > rect.right) return;
      e.preventDefault();
      const dy = _ty - t.clientY;
      _ty = t.clientY;
      getScrollParent()?.scrollBy({ top: dy, behavior: 'auto' });
    };
    window.addEventListener('touchstart', touchStartHandler, { passive: true, capture: true });
    window.addEventListener('touchmove', touchMoveHandler, { passive: false, capture: true });

    // Cleanup au démontage
    const cleanup = () => {
      window.removeEventListener('wheel', wheelHandler, { capture: true });
      window.removeEventListener('touchstart', touchStartHandler, { capture: true });
      window.removeEventListener('touchmove', touchMoveHandler, { capture: true });
    };

    // ResizeObserver pour s'adapter aux changements de taille
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => applyWidth());
      ro.observe(document.documentElement);
      setTimeout(() => ro.disconnect(), 60000);
    }

    // ── PROGRESS BAR ──
    const bar = loader.querySelector('.cal-ext-bar');
    let pct = 0;
    const pInterval = setInterval(() => {
      if (pct < 25) pct += 2.5;
      else if (pct < 50) pct += 1.5;
      else if (pct < 75) pct += 0.8;
      else if (pct < 90) pct += 0.3;
      if (bar) bar.style.width = Math.min(pct, 92) + '%';
    }, 100);

    // ── REVEAL ──
    const reveal = () => {
      console.log('[CAL] REVEAL');
      clearInterval(pInterval);
      if (bar) bar.style.width = '100%';
      setTimeout(() => loader.classList.add('fade-out'), 500);
    };

    // ── CSS CALENDLY ──
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    const startCalendly = () => {
      if (!window.Calendly?.initInlineWidget) {
        return setTimeout(startCalendly, 200);
      }

      const prefillObj = {};
      if (prefillName)  prefillObj.name = prefillName;
      if (prefillEmail) prefillObj.email = prefillEmail;
      if (prefillPhone) prefillObj.phone_number = prefillPhone;
      if (customAnswers && typeof customAnswers === 'object') {
        prefillObj.customAnswers = {};
        Object.keys(customAnswers).forEach(k => {
          const v = customAnswers[k];
          if (v && String(v).trim()) prefillObj.customAnswers[k] = String(v);
        });
      }

      console.log('[CAL] initInlineWidget...');
      window.Calendly.initInlineWidget({
        url: finalUrl,
        parentElement: widget,
        prefill: prefillObj,
        resize: true,  // Active le redimensionnement automatique natif
      });

      // Detecter l'iframe
      const poll = setInterval(() => {
        const iframe = widget.querySelector('iframe');
        if (!iframe) return;
        clearInterval(poll);
        console.log('[CAL] iframe found');

        // Hauteur initiale de l'iframe (avant le premier page_height)
        iframe.style.height = height + 'px';
        iframe.style.minHeight = height + 'px';

        // Forcer la width sur l'iframe après layout
        requestAnimationFrame(() => {
          applyWidth();
        });

        iframe.addEventListener('load', () => {
          console.log('[CAL] iframe loaded');
          reveal();
        });

        // Fallback 8s
        setTimeout(() => {
          if (!loader.classList.contains('fade-out')) {
            console.log('[CAL] fallback reveal');
            reveal();
          }
        }, 8000);
      }, 200);
    };

    // Délai 800ms pour voir le loader
    setTimeout(() => {
      console.log('[CAL] Loading script...');
      if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          console.log('[CAL] Script loaded');
          startCalendly();
        };
        script.onerror = () => {
          clearInterval(pInterval);
          loader.innerHTML = `<div style="color:#c62828;padding:20px;text-align:center;font-family:sans-serif;">
            ❌ Impossible de charger l'agenda<br>
            <a href="${finalUrl}" target="_blank" style="color:${brandColor};margin-top:8px;display:inline-block;">Ouvrir Calendly →</a>
          </div>`;
        };
        document.head.appendChild(script);
      } else {
        startCalendly();
      }
    }, 800);

    // ── EVENT CAPTURE ──
    const calendlyListener = async (e) => {
      if (!e.data?.event?.startsWith('calendly')) return;
      const details = e.data.payload || {};

      // Logger TOUS les events Calendly pour debug
      console.log('[CAL EVENT]', e.data.event, JSON.stringify(e.data.payload));

      // Adapter la hauteur dynamiquement selon le contenu Calendly
      if (e.data.event === 'calendly.page_height') {
        // Calendly envoie payload.height comme string "NNNpx" ou number
        const raw = e.data.payload?.height ?? e.data.payload?.size;
        const newHeight = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
        console.log(`[CAL] page_height raw="${raw}" parsed=${newHeight}px`);
        if (newHeight && newHeight > 50) {
          const iframe = widget.querySelector('iframe');
          if (iframe) {
            iframe.style.height = newHeight + 'px';
            iframe.style.minHeight = newHeight + 'px';
          }
          container.style.minHeight = newHeight + 'px';

        }
        return;
      }

      if (e.data.event === 'calendly.event_scheduled') {
        console.log('[CAL] ✅ RDV confirmé');
        const eventUri   = details.event?.uri || details.uri;
        const inviteeUri = details.invitee?.uri;
        const parseUuid  = (uri) => uri?.match(/scheduled_events\/([^/]+)/)?.[1] || null;

        const payload = {
          event: 'scheduled',
          eventUri,
          inviteeUri,
          eventName:       details.event_type?.name || '',
          inviteeEmail:    details.invitee?.email || '',
          inviteeName:     details.invitee?.name || '',
          inviteeQuestions: details.questions_and_answers || [],
          startTime:       details.event?.start_time || '',
          endTime:         details.event?.end_time || '',
        };

        if (calendlyToken && inviteeUri) {
          try {
            const r = await fetch(inviteeUri, { headers: { Authorization: `Bearer ${calendlyToken}` } });
            if (r.ok) {
              const d = await r.json();
              payload.inviteeEmail = d.resource?.email || payload.inviteeEmail;
              payload.inviteeName  = d.resource?.name  || payload.inviteeName;
            }
          } catch (err) { /* silencieux */ }
        }

        if (calendlyToken && parseUuid(eventUri)) {
          try {
            const r = await fetch(`https://api.calendly.com/scheduled_events/${parseUuid(eventUri)}`, {
              headers: { Authorization: `Bearer ${calendlyToken}` }
            });
            if (r.ok) {
              const d = await r.json();
              payload.startTime = d.resource?.start_time || payload.startTime;
              payload.endTime   = d.resource?.end_time   || payload.endTime;
            }
          } catch (err) { /* silencieux */ }
        }

        window.voiceflow.calendlyEventData = payload;
        window.voiceflow.chat.interact({ type: 'complete', payload });
      }
    };

    window.addEventListener('message', calendlyListener);
    return () => window.removeEventListener('message', calendlyListener);
  }
};

export default CalendlyExtension;
