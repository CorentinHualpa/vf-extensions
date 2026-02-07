/**
 *  Calendly – Voiceflow Extension v3.3
 *  Style inline dans le container (comme LoaderExtension)
 *  Loader visible → swap vers Calendly
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
      loaderText = 'Chargement de l\'agenda...',
      brandColor = '#E91E63'
    } = config;

    if (!url) {
      element.innerHTML = '<div style="padding:20px;color:red;">❌ URL Calendly manquante</div>';
      return;
    }

    // ── CONTAINER UNIQUE ──
    const container = document.createElement('div');
    container.classList.add('cal-ext-root');

    // ── STYLE INLINE (dans le container, pas dans <head>) ──
    const styleEl = document.createElement('style');
    styleEl.textContent = `
.cal-ext-root {
  width: 100% !important;
  max-width: 100% !important;
  position: relative !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
  border: 1px solid rgba(0,0,0,0.06) !important;
  height: ${height}px !important;
  box-sizing: border-box !important;
}

/* ═══ LOADER ═══ */
.cal-ext-loader {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
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

/* Icône calendrier animée */
.cal-ext-icon {
  width: 56px !important;
  height: 56px !important;
  position: relative !important;
  display: block !important;
}
.cal-ext-clip {
  width: 4px !important;
  height: 10px !important;
  background: #bbb !important;
  border-radius: 2px !important;
  position: absolute !important;
  top: 0 !important;
  display: block !important;
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
  display: block !important;
}
.cal-ext-hd {
  height: 15px !important;
  background: ${brandColor} !important;
  display: block !important;
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
  display: block !important;
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

/* Texte */
.cal-ext-txt {
  font-family: 'Inter', -apple-system, sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #757575 !important;
  display: block !important;
  text-align: center !important;
}

/* Barre de progression */
.cal-ext-bar-bg {
  width: 200px !important;
  height: 4px !important;
  background: #eee !important;
  border-radius: 4px !important;
  overflow: hidden !important;
  display: block !important;
}
.cal-ext-bar {
  height: 100% !important;
  width: 0% !important;
  border-radius: 4px !important;
  background: linear-gradient(90deg, ${brandColor}, #ff6090) !important;
  transition: width 0.15s linear !important;
  display: block !important;
}

/* ═══ WIDGET CALENDLY ═══ */
.cal-ext-widget {
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 10 !important;
}
.cal-ext-widget .calendly-inline-widget {
  width: 100% !important;
  min-width: 100% !important;
  height: 100% !important;
}
.cal-ext-widget .calendly-inline-widget iframe {
  width: 100% !important;
  min-width: 100% !important;
  border: none !important;
}
    `;
    container.appendChild(styleEl);

    // ── LOADER HTML ──
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

    // ── WIDGET (derrière le loader, z-index inférieur) ──
    const widget = document.createElement('div');
    widget.className = 'cal-ext-widget';
    container.appendChild(widget);

    // ── INJECT ──
    element.appendChild(container);

    console.log('[CAL] DOM injected, container:', container.offsetWidth, 'x', container.offsetHeight);
    console.log('[CAL] loader:', loader.offsetWidth, 'x', loader.offsetHeight);

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
      setTimeout(() => {
        loader.classList.add('fade-out');
        console.log('[CAL] Loader faded out');
      }, 500);
    };

    // ── LOAD + INIT CALENDLY ──
    // CSS Calendly
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    const startCalendly = () => {
      if (!window.Calendly || !window.Calendly.initInlineWidget) {
        return setTimeout(startCalendly, 200);
      }

      const prefillObj = {};
      if (prefillName) prefillObj.name = prefillName;
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
        url: url,
        parentElement: widget,
        prefill: prefillObj
      });

      // Detect iframe load
      const poll = setInterval(() => {
        const iframe = widget.querySelector('iframe');
        if (iframe) {
          clearInterval(poll);
          console.log('[CAL] iframe found');
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
        }
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
          loader.innerHTML = `<div style="color:#c62828;padding:20px;text-align:center;font-family:Inter,sans-serif;">
            ❌ Impossible de charger l'agenda<br>
            <a href="${url}" target="_blank" style="color:${brandColor};margin-top:8px;display:inline-block;">Ouvrir Calendly →</a>
          </div>`;
        };
        document.head.appendChild(script);
      } else {
        startCalendly();
      }
    }, 800);

    // ── EVENT CAPTURE ──
    const calendlyListener = async (e) => {
      if (!e.data?.event || !e.data.event.startsWith("calendly")) return;
      const details = e.data.payload || {};

      if (e.data.event === "calendly.event_scheduled") {
        console.log("[CAL] ✅ RDV confirmé");
        const eventUri = details.event?.uri || details.uri;
        const inviteeUri = details.invitee?.uri;
        const parseUuid = (uri) => uri?.match(/scheduled_events\/([^\/]+)/)?.[1] || null;

        const payload = {
          event: "scheduled", eventUri, inviteeUri,
          eventName: details.event_type?.name || "",
          inviteeEmail: details.invitee?.email || "",
          inviteeName: details.invitee?.name || "",
          inviteeQuestions: details.questions_and_answers || [],
          startTime: details.event?.start_time || "",
          endTime: details.event?.end_time || "",
        };

        if (calendlyToken && inviteeUri) {
          try {
            const r = await fetch(inviteeUri, { headers: { Authorization: `Bearer ${calendlyToken}` } });
            if (r.ok) { const d = await r.json(); payload.inviteeEmail = d.resource.email || payload.inviteeEmail; payload.inviteeName = d.resource.name || payload.inviteeName; }
          } catch (err) { /* */ }
        }
        if (calendlyToken && parseUuid(eventUri)) {
          try {
            const r = await fetch(`https://api.calendly.com/scheduled_events/${parseUuid(eventUri)}`, { headers: { Authorization: `Bearer ${calendlyToken}` } });
            if (r.ok) { const d = await r.json(); payload.startTime = d.resource.start_time || payload.startTime; payload.endTime = d.resource.end_time || payload.endTime; }
          } catch (err) { /* */ }
        }

        window.voiceflow.calendlyEventData = payload;
        window.voiceflow.chat.interact({ type: "complete", payload });
      }
    };

    window.addEventListener("message", calendlyListener);
    return () => window.removeEventListener("message", calendlyListener);
  }
};

export default CalendlyExtension;
