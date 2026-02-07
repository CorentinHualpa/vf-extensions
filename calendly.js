/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Calendly – Voiceflow Response Extension                  ║
 *  ║  VERSION 3.1 - LOADER FIRST, THEN CALENDLY               ║
 *  ╚═══════════════════════════════════════════════════════════╝
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
    let config = trace.payload || {};
    if (config.body) {
      try {
        config = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
      } catch (e) { console.error('[Calendly] parse error:', e); }
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
      element.innerHTML = '<div style="padding:20px;color:#c62828;background:#ffebee;border-radius:8px;">❌ URL Calendly manquante</div>';
      return;
    }

    // ── STYLES ──
    const styleId = 'vf-cal-v31';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
.vfrc-message--extension-Calendly,
.vfrc-message--extension-Calendly .vfrc-bubble,
.vfrc-message--extension-Calendly .vfrc-bubble-content,
.vfrc-message--extension-Calendly .vfrc-message-content,
.vfrc-message.vfrc-message--extension-Calendly {
  width: 100% !important; max-width: 100% !important;
  margin: 0 !important; padding: 0 !important;
}
.vf-cal-root {
  width: 100%; border-radius: 16px; overflow: hidden;
  background: #fff; position: relative;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.06);
  animation: vfCalIn 0.3s ease-out;
}
@keyframes vfCalIn {
  from { opacity:0; transform:translateY(6px); }
  to { opacity:1; transform:translateY(0); }
}

/* ── LOADER : on top ── */
.vf-cal-loader {
  position: absolute; inset: 0; z-index: 50;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: #ffffff; gap: 20px;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}
.vf-cal-loader.out {
  opacity: 0; visibility: hidden; pointer-events: none;
}

/* Animated calendar icon */
.vf-cal-ico { width:52px; height:52px; position:relative; }
.vf-cal-ico-clip {
  width:4px; height:10px; background:#bbb; border-radius:2px;
  position:absolute; top:0;
}
.vf-cal-ico-clip:first-child { left:13px; }
.vf-cal-ico-clip:last-child { right:13px; }
.vf-cal-ico-body {
  width:52px; height:48px; position:absolute; bottom:0;
  background:#f8f9fa; border:2px solid #e0e0e0; border-radius:10px;
  overflow:hidden;
}
.vf-cal-ico-hd { height:14px; background: var(--brand); }
.vf-cal-ico-grid {
  display:grid; grid-template-columns:repeat(3,1fr);
  gap:5px; padding:7px 9px 0;
}
.vf-cal-ico-dot {
  width:7px; height:7px; border-radius:50%; background:#d5d5d5;
  animation: dotPop 1.4s ease-in-out infinite;
}
.vf-cal-ico-dot:nth-child(1){animation-delay:0s}
.vf-cal-ico-dot:nth-child(2){animation-delay:.15s}
.vf-cal-ico-dot:nth-child(3){animation-delay:.3s}
.vf-cal-ico-dot:nth-child(4){animation-delay:.1s}
.vf-cal-ico-dot:nth-child(5){animation-delay:.25s}
.vf-cal-ico-dot:nth-child(6){animation-delay:.4s}
@keyframes dotPop {
  0%,100% { background:#d5d5d5; transform:scale(1); }
  50% { background:var(--brand); transform:scale(1.4); }
}

.vf-cal-txt {
  font-family:'Inter',-apple-system,sans-serif;
  font-size:14px; font-weight:500; color:#757575;
}

/* Progress bar */
.vf-cal-bar-wrap {
  width:180px; height:4px; background:#eee; border-radius:4px; overflow:hidden;
}
.vf-cal-bar {
  height:100%; width:0%; border-radius:4px;
  background: linear-gradient(90deg, var(--brand), #ff6090);
}

/* ── WIDGET : behind loader ── */
.vf-cal-widget {
  width:100%; position:relative; z-index:10;
}
.vf-cal-widget .calendly-inline-widget,
.vf-cal-widget .calendly-inline-widget iframe {
  width:100% !important; min-width:100% !important; border:none !important;
}
      `;
      document.head.appendChild(s);
    }

    // ── BUILD DOM ──
    const root = document.createElement('div');
    root.className = 'vf-cal-root';
    root.style.setProperty('--brand', brandColor);
    root.style.height = height + 'px';

    // Loader
    const loader = document.createElement('div');
    loader.className = 'vf-cal-loader';
    loader.innerHTML = `
      <div class="vf-cal-ico">
        <div class="vf-cal-ico-clip"></div>
        <div class="vf-cal-ico-clip"></div>
        <div class="vf-cal-ico-body">
          <div class="vf-cal-ico-hd"></div>
          <div class="vf-cal-ico-grid">
            <div class="vf-cal-ico-dot"></div><div class="vf-cal-ico-dot"></div><div class="vf-cal-ico-dot"></div>
            <div class="vf-cal-ico-dot"></div><div class="vf-cal-ico-dot"></div><div class="vf-cal-ico-dot"></div>
          </div>
        </div>
      </div>
      <span class="vf-cal-txt">${loaderText}</span>
      <div class="vf-cal-bar-wrap"><div class="vf-cal-bar"></div></div>
    `;
    root.appendChild(loader);

    // Widget (vide pour l'instant)
    const widget = document.createElement('div');
    widget.className = 'vf-cal-widget';
    widget.style.height = height + 'px';
    root.appendChild(widget);

    element.appendChild(root);

    // ── PROGRESS BAR ANIMATION (JS pour contrôle précis) ──
    const bar = loader.querySelector('.vf-cal-bar');
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 30) progress += 3;
      else if (progress < 60) progress += 2;
      else if (progress < 85) progress += 0.5;
      else if (progress < 92) progress += 0.2;
      // Plafonne à 92% — le 100% viendra quand Calendly est prêt
      bar.style.width = Math.min(progress, 92) + '%';
    }, 100);

    // ── REVEAL ──
    const reveal = () => {
      clearInterval(progressInterval);
      bar.style.transition = 'width 0.3s ease';
      bar.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('out');
        console.log('[Calendly v3.1] ✅ Revealed');
      }, 500);
    };

    // ── LOAD CSS + JS CALENDLY ──
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    const startCalendly = () => {
      if (!window.Calendly || !window.Calendly.initInlineWidget) {
        return setTimeout(startCalendly, 100);
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
          iframe.addEventListener('load', () => reveal());
          // Fallback
          setTimeout(() => {
            if (!loader.classList.contains('out')) reveal();
          }, 8000);
        }
      }, 150);
    };

    // Charger le script Calendly, MAIS ne pas init immédiatement
    // On attend un mini délai pour que le loader soit bien visible
    const loadAndInit = () => {
      if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => startCalendly();
        script.onerror = () => {
          clearInterval(progressInterval);
          loader.innerHTML = `
            <div style="color:#c62828;padding:20px;text-align:center;font-family:Inter,sans-serif;">
              ❌ Impossible de charger l'agenda<br>
              <a href="${url}" target="_blank" style="color:${brandColor};margin-top:8px;display:inline-block;">
                Ouvrir Calendly →
              </a>
            </div>`;
        };
        document.head.appendChild(script);
      } else {
        startCalendly();
      }
    };

    // Délai de 800ms pour que le loader + barre soient bien visibles
    setTimeout(loadAndInit, 800);

    // ── EVENT CAPTURE ──
    const calendlyListener = async (e) => {
      if (!e.data?.event || !e.data.event.startsWith("calendly")) return;
      const details = e.data.payload || {};

      if (e.data.event === "calendly.event_scheduled") {
        console.log("[Calendly v3.1] ✅ RDV confirmé");
        const eventUri = details.event?.uri || details.uri;
        const inviteeUri = details.invitee?.uri;
        const parseUuid = (uri) => uri?.match(/scheduled_events\/([^\/]+)/)?.[1] || null;

        const payload = {
          event: "scheduled",
          eventUri,
          inviteeUri,
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
          } catch (err) { console.error("[Calendly] API err:", err); }
        }

        if (calendlyToken && parseUuid(eventUri)) {
          try {
            const r = await fetch(`https://api.calendly.com/scheduled_events/${parseUuid(eventUri)}`, { headers: { Authorization: `Bearer ${calendlyToken}` } });
            if (r.ok) { const d = await r.json(); payload.startTime = d.resource.start_time || payload.startTime; payload.endTime = d.resource.end_time || payload.endTime; }
          } catch (err) { console.error("[Calendly] API err:", err); }
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
