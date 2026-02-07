/**
 *  Calendly – Voiceflow Extension v3.2
 *  DEBUG VERSION — Logs extensifs + loader simplifié
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
    console.log('[CAL-DEBUG] ====== RENDER START ======');
    console.log('[CAL-DEBUG] element:', element);
    console.log('[CAL-DEBUG] element.tagName:', element?.tagName);
    console.log('[CAL-DEBUG] element.className:', element?.className);
    console.log('[CAL-DEBUG] element.parentElement:', element?.parentElement);
    console.log('[CAL-DEBUG] element.parentElement.className:', element?.parentElement?.className);
    console.log('[CAL-DEBUG] element computed style:', element ? window.getComputedStyle(element).display : 'N/A');
    console.log('[CAL-DEBUG] element offsetWidth:', element?.offsetWidth);
    console.log('[CAL-DEBUG] element offsetHeight:', element?.offsetHeight);
    console.log('[CAL-DEBUG] trace.type:', trace.type);
    console.log('[CAL-DEBUG] trace.payload:', JSON.stringify(trace.payload));

    let config = trace.payload || {};
    if (config.body) {
      try {
        config = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        console.log('[CAL-DEBUG] Parsed body config:', JSON.stringify(config));
      } catch (e) {
        console.error('[CAL-DEBUG] Parse error:', e);
      }
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

    console.log('[CAL-DEBUG] url:', url);
    console.log('[CAL-DEBUG] height:', height);

    if (!url) {
      element.innerHTML = '<div style="padding:20px;color:red;">❌ URL manquante</div>';
      return;
    }

    // ── STYLES ──
    const styleId = 'vf-cal-v32';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
/* Pleine largeur */
.vfrc-message--extension-Calendly,
.vfrc-message--extension-Calendly .vfrc-bubble,
.vfrc-message--extension-Calendly .vfrc-bubble-content,
.vfrc-message--extension-Calendly .vfrc-message-content,
.vfrc-message.vfrc-message--extension-Calendly {
  width: 100% !important; max-width: 100% !important;
  margin: 0 !important; padding: 0 !important;
}

/* Container racine */
.vf-cal-root {
  width: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.06);
}

/* ═══ LOADER ═══ */
.vf-cal-loader-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: #ffffff;
  transition: opacity 0.5s ease, max-height 0.5s ease;
  overflow: hidden;
}
.vf-cal-loader-screen.hiding {
  opacity: 0;
  max-height: 0 !important;
  padding: 0 !important;
}

/* Icone calendrier */
.vf-cal-anim {
  width: 56px; height: 56px; position: relative;
}
.vf-cal-anim-clip {
  width: 4px; height: 10px; background: #bbb;
  border-radius: 2px; position: absolute; top: 0;
}
.vf-cal-anim-clip.left { left: 14px; }
.vf-cal-anim-clip.right { right: 14px; }
.vf-cal-anim-body {
  width: 56px; height: 50px; position: absolute; bottom: 0;
  background: #f8f9fa; border: 2px solid #e0e0e0;
  border-radius: 10px; overflow: hidden;
}
.vf-cal-anim-hd {
  height: 15px; background: var(--vf-brand, #E91E63);
}
.vf-cal-anim-dots {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 5px; padding: 8px 10px 0;
}
.vf-cal-anim-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #d5d5d5;
  animation: vfDotBounce 1.4s ease-in-out infinite;
}
.vf-cal-anim-dot:nth-child(1) { animation-delay: 0s; }
.vf-cal-anim-dot:nth-child(2) { animation-delay: 0.15s; }
.vf-cal-anim-dot:nth-child(3) { animation-delay: 0.3s; }
.vf-cal-anim-dot:nth-child(4) { animation-delay: 0.1s; }
.vf-cal-anim-dot:nth-child(5) { animation-delay: 0.25s; }
.vf-cal-anim-dot:nth-child(6) { animation-delay: 0.4s; }
@keyframes vfDotBounce {
  0%,100% { background: #d5d5d5; transform: scale(1); }
  50% { background: var(--vf-brand, #E91E63); transform: scale(1.35); }
}

.vf-cal-loader-txt {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px; font-weight: 500; color: #757575;
}

/* Progress bar */
.vf-cal-pbar-bg {
  width: 200px; height: 4px; background: #eee;
  border-radius: 4px; overflow: hidden;
}
.vf-cal-pbar {
  height: 100%; width: 0%; border-radius: 4px;
  background: linear-gradient(90deg, var(--vf-brand, #E91E63), #ff6090);
  transition: width 0.15s linear;
}

/* ═══ WIDGET ═══ */
.vf-cal-widget-area {
  width: 100%; display: none;
}
.vf-cal-widget-area.visible {
  display: block;
}
.vf-cal-widget-area .calendly-inline-widget,
.vf-cal-widget-area .calendly-inline-widget iframe {
  width: 100% !important; min-width: 100% !important; border: none !important;
}
      `;
      document.head.appendChild(s);
      console.log('[CAL-DEBUG] Styles injected');
    }

    // ── DOM ──
    const root = document.createElement('div');
    root.className = 'vf-cal-root';
    root.style.setProperty('--vf-brand', brandColor);

    // Loader (PAS en position absolute — en flow normal)
    const loaderScreen = document.createElement('div');
    loaderScreen.className = 'vf-cal-loader-screen';
    loaderScreen.style.height = height + 'px';
    loaderScreen.innerHTML = `
      <div class="vf-cal-anim">
        <div class="vf-cal-anim-clip left"></div>
        <div class="vf-cal-anim-clip right"></div>
        <div class="vf-cal-anim-body">
          <div class="vf-cal-anim-hd"></div>
          <div class="vf-cal-anim-dots">
            <div class="vf-cal-anim-dot"></div><div class="vf-cal-anim-dot"></div><div class="vf-cal-anim-dot"></div>
            <div class="vf-cal-anim-dot"></div><div class="vf-cal-anim-dot"></div><div class="vf-cal-anim-dot"></div>
          </div>
        </div>
      </div>
      <span class="vf-cal-loader-txt">${loaderText}</span>
      <div class="vf-cal-pbar-bg"><div class="vf-cal-pbar"></div></div>
    `;
    root.appendChild(loaderScreen);

    // Widget (hidden initially)
    const widgetArea = document.createElement('div');
    widgetArea.className = 'vf-cal-widget-area';
    widgetArea.style.height = height + 'px';
    root.appendChild(widgetArea);

    element.appendChild(root);

    console.log('[CAL-DEBUG] DOM built. root:', root);
    console.log('[CAL-DEBUG] root.offsetWidth:', root.offsetWidth);
    console.log('[CAL-DEBUG] root.offsetHeight:', root.offsetHeight);
    console.log('[CAL-DEBUG] loaderScreen.offsetWidth:', loaderScreen.offsetWidth);
    console.log('[CAL-DEBUG] loaderScreen.offsetHeight:', loaderScreen.offsetHeight);

    // Vérifier après un tick que le loader est visible
    requestAnimationFrame(() => {
      console.log('[CAL-DEBUG] [RAF] root.offsetWidth:', root.offsetWidth);
      console.log('[CAL-DEBUG] [RAF] root.offsetHeight:', root.offsetHeight);
      console.log('[CAL-DEBUG] [RAF] loaderScreen.offsetWidth:', loaderScreen.offsetWidth);
      console.log('[CAL-DEBUG] [RAF] loaderScreen.offsetHeight:', loaderScreen.offsetHeight);
      console.log('[CAL-DEBUG] [RAF] loaderScreen computed display:', window.getComputedStyle(loaderScreen).display);
      console.log('[CAL-DEBUG] [RAF] loaderScreen computed visibility:', window.getComputedStyle(loaderScreen).visibility);
      console.log('[CAL-DEBUG] [RAF] loaderScreen computed opacity:', window.getComputedStyle(loaderScreen).opacity);
      console.log('[CAL-DEBUG] [RAF] root parent chain:');
      let el = root;
      for (let i = 0; i < 8 && el; i++) {
        const cs = window.getComputedStyle(el);
        console.log(`[CAL-DEBUG]   [${i}] ${el.tagName}.${el.className} | display:${cs.display} | width:${cs.width} | height:${cs.height} | overflow:${cs.overflow} | visibility:${cs.visibility} | opacity:${cs.opacity}`);
        el = el.parentElement;
      }
    });

    // ── PROGRESS BAR (JS) ──
    const bar = loaderScreen.querySelector('.vf-cal-pbar');
    let pct = 0;
    const pInterval = setInterval(() => {
      if (pct < 25) pct += 2.5;
      else if (pct < 50) pct += 1.5;
      else if (pct < 75) pct += 0.8;
      else if (pct < 90) pct += 0.3;
      bar.style.width = Math.min(pct, 92) + '%';
    }, 100);

    console.log('[CAL-DEBUG] Progress bar started');

    // ── REVEAL ──
    const reveal = () => {
      console.log('[CAL-DEBUG] === REVEAL called ===');
      clearInterval(pInterval);
      bar.style.width = '100%';
      setTimeout(() => {
        loaderScreen.classList.add('hiding');
        widgetArea.classList.add('visible');
        console.log('[CAL-DEBUG] Loader hidden, widget visible');
      }, 500);
    };

    // ── LOAD CALENDLY ──
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
      console.log('[CAL-DEBUG] Calendly CSS added');
    }

    const startCalendly = () => {
      console.log('[CAL-DEBUG] startCalendly called');
      console.log('[CAL-DEBUG] window.Calendly exists:', !!window.Calendly);
      console.log('[CAL-DEBUG] initInlineWidget exists:', !!window.Calendly?.initInlineWidget);

      if (!window.Calendly || !window.Calendly.initInlineWidget) {
        console.log('[CAL-DEBUG] Calendly not ready, retrying in 200ms...');
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

      console.log('[CAL-DEBUG] Calling initInlineWidget with url:', url);
      console.log('[CAL-DEBUG] widgetArea dimensions:', widgetArea.offsetWidth, 'x', widgetArea.offsetHeight);

      window.Calendly.initInlineWidget({
        url: url,
        parentElement: widgetArea,
        prefill: prefillObj
      });

      console.log('[CAL-DEBUG] initInlineWidget called, polling for iframe...');

      const poll = setInterval(() => {
        const iframe = widgetArea.querySelector('iframe');
        console.log('[CAL-DEBUG] Polling... iframe found:', !!iframe);
        if (iframe) {
          clearInterval(poll);
          console.log('[CAL-DEBUG] iframe found! src:', iframe.src);
          console.log('[CAL-DEBUG] iframe dimensions:', iframe.offsetWidth, 'x', iframe.offsetHeight);

          iframe.addEventListener('load', () => {
            console.log('[CAL-DEBUG] iframe LOAD event fired!');
            reveal();
          });

          // Fallback
          setTimeout(() => {
            if (!loaderScreen.classList.contains('hiding')) {
              console.log('[CAL-DEBUG] FALLBACK reveal (8s timeout)');
              reveal();
            }
          }, 8000);
        }
      }, 200);
    };

    // Délai pour que le loader soit bien visible
    console.log('[CAL-DEBUG] Scheduling Calendly load in 1000ms...');
    setTimeout(() => {
      console.log('[CAL-DEBUG] Loading Calendly script now...');
      if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          console.log('[CAL-DEBUG] Calendly script LOADED');
          startCalendly();
        };
        script.onerror = (err) => {
          console.error('[CAL-DEBUG] Calendly script FAILED to load:', err);
          clearInterval(pInterval);
          loaderScreen.innerHTML = '<div style="color:red;padding:20px;text-align:center;">❌ Erreur chargement</div>';
        };
        document.head.appendChild(script);
      } else {
        console.log('[CAL-DEBUG] Calendly script already in DOM');
        startCalendly();
      }
    }, 1000);

    // ── EVENT CAPTURE ──
    const calendlyListener = async (e) => {
      if (!e.data?.event || !e.data.event.startsWith("calendly")) return;
      console.log("[CAL-DEBUG] Calendly event:", e.data.event);
      const details = e.data.payload || {};

      if (e.data.event === "calendly.event_scheduled") {
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
