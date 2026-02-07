/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Calendly – Voiceflow Response Extension                  ║
 *  ║  VERSION 3.0 - ANIMATED LOADER + FULL WIDTH              ║
 *  ║                                                           ║
 *  ║  • Barre de chargement animée pendant le load             ║
 *  ║  • Pleine largeur dans le chat Voiceflow                 ║
 *  ║  • Prefill propre (name, email, phone, customAnswers)    ║
 *  ║  • Capture événement RDV + API Calendly                  ║
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

    // Cas Custom Action
    if (config.body) {
      try {
        config = typeof config.body === 'string'
          ? JSON.parse(config.body)
          : config.body;
      } catch (e) {
        console.error('[Calendly] Erreur parsing body:', e);
      }
    }

    // Lecture des paramètres
    const {
      url,
      height = 580,
      backgroundColor = '#ffffff',
      calendlyToken = '',
      prefillName = '',
      prefillEmail = '',
      prefillPhone = '',
      customAnswers = {},
      loaderText = 'Chargement de l\'agenda...',
      brandColor = '#E91E63'
    } = config;

    if (!url) {
      element.innerHTML = `
        <div style="padding:20px;color:#c62828;background:#ffebee;border-radius:8px;">
          ❌ Erreur: URL Calendly manquante
        </div>`;
      return;
    }

    console.log('[Calendly v3] === CONFIG ===', config);

    // ---------------------------
    //  STYLE
    // ---------------------------
    const styleId = 'vf-calendly-ext-v3-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
/* ═══════════════════════════════════════ */
/* PLEINE LARGEUR VOICEFLOW               */
/* ═══════════════════════════════════════ */
.vfrc-message--extension-Calendly,
.vfrc-message--extension-Calendly .vfrc-bubble,
.vfrc-message--extension-Calendly .vfrc-bubble-content,
.vfrc-message--extension-Calendly .vfrc-message-content,
.vfrc-message.vfrc-message--extension-Calendly {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* ═══════════════════════════════════════ */
/* CONTAINER PRINCIPAL                     */
/* ═══════════════════════════════════════ */
.vf-calendly-wrap {
  width: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  animation: vfCalFadeIn 0.4s ease-out;
}

@keyframes vfCalFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ═══════════════════════════════════════ */
/* LOADER OVERLAY                          */
/* ═══════════════════════════════════════ */
.vf-cal-loader {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  gap: 24px;
  transition: opacity 0.5s ease, visibility 0.5s ease;
}

.vf-cal-loader.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Icône calendrier animée */
.vf-cal-icon {
  width: 56px;
  height: 56px;
  position: relative;
}

.vf-cal-icon-body {
  width: 56px;
  height: 52px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  position: absolute;
  bottom: 0;
  overflow: hidden;
}

.vf-cal-icon-header {
  height: 16px;
  background: var(--vf-cal-brand, ${brandColor});
  width: 100%;
}

.vf-cal-icon-dots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 8px 10px 0;
}

.vf-cal-icon-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d0d0d0;
  animation: vfCalDotPulse 1.5s ease-in-out infinite;
}

.vf-cal-icon-dot:nth-child(1) { animation-delay: 0s; }
.vf-cal-icon-dot:nth-child(2) { animation-delay: 0.2s; }
.vf-cal-icon-dot:nth-child(3) { animation-delay: 0.4s; }
.vf-cal-icon-dot:nth-child(4) { animation-delay: 0.15s; }
.vf-cal-icon-dot:nth-child(5) { animation-delay: 0.35s; }
.vf-cal-icon-dot:nth-child(6) { animation-delay: 0.55s; }

@keyframes vfCalDotPulse {
  0%, 100% { background: #d0d0d0; transform: scale(1); }
  50% { background: var(--vf-cal-brand, ${brandColor}); transform: scale(1.3); }
}

/* Clips du haut du calendrier */
.vf-cal-icon-clip {
  width: 4px;
  height: 12px;
  background: #bdbdbd;
  border-radius: 2px;
  position: absolute;
  top: 0;
}
.vf-cal-icon-clip:first-of-type { left: 14px; }
.vf-cal-icon-clip:last-of-type { right: 14px; }

/* Texte loader */
.vf-cal-loader-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #757575;
  letter-spacing: -0.01em;
}

/* Barre de progression */
.vf-cal-progress-wrap {
  width: 200px;
  height: 4px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.vf-cal-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--vf-cal-brand, ${brandColor}), #ff6090);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: vfCalProgress 4s ease-in-out forwards;
}

@keyframes vfCalProgress {
  0%   { width: 0%; }
  15%  { width: 15%; }
  40%  { width: 40%; }
  60%  { width: 55%; }
  80%  { width: 70%; }
  90%  { width: 82%; }
  100% { width: 90%; }
}

/* ═══════════════════════════════════════ */
/* WIDGET CALENDLY                         */
/* ═══════════════════════════════════════ */
.vf-cal-widget {
  width: 100%;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.vf-cal-widget.loaded {
  opacity: 1;
}

.vf-cal-widget .calendly-inline-widget {
  width: 100% !important;
  min-width: 100% !important;
}

.vf-cal-widget .calendly-inline-widget iframe {
  width: 100% !important;
  min-width: 100% !important;
  border: none !important;
}
      `;
      document.head.appendChild(styleEl);
    }

    // ---------------------------
    //  HTML STRUCTURE
    // ---------------------------
    const container = document.createElement('div');
    container.className = 'vf-calendly-wrap';
    container.style.setProperty('--vf-cal-brand', brandColor);
    container.style.height = `${height}px`;

    // Loader
    container.innerHTML = `
      <div class="vf-cal-loader">
        <div class="vf-cal-icon">
          <div class="vf-cal-icon-clip"></div>
          <div class="vf-cal-icon-clip"></div>
          <div class="vf-cal-icon-body">
            <div class="vf-cal-icon-header"></div>
            <div class="vf-cal-icon-dots">
              <div class="vf-cal-icon-dot"></div>
              <div class="vf-cal-icon-dot"></div>
              <div class="vf-cal-icon-dot"></div>
              <div class="vf-cal-icon-dot"></div>
              <div class="vf-cal-icon-dot"></div>
              <div class="vf-cal-icon-dot"></div>
            </div>
          </div>
        </div>
        <span class="vf-cal-loader-text">${loaderText}</span>
        <div class="vf-cal-progress-wrap">
          <div class="vf-cal-progress-bar"></div>
        </div>
      </div>
    `;

    // Widget container
    const widgetEl = document.createElement('div');
    widgetEl.className = 'vf-cal-widget';
    widgetEl.style.height = `${height}px`;
    container.appendChild(widgetEl);

    element.appendChild(container);

    // ---------------------------
    //  REVEAL FUNCTION
    // ---------------------------
    const revealCalendly = () => {
      const loader = container.querySelector('.vf-cal-loader');
      const progressBar = container.querySelector('.vf-cal-progress-bar');

      // Terminer la barre à 100%
      if (progressBar) {
        progressBar.style.animation = 'none';
        progressBar.style.width = '100%';
      }

      // Petit délai pour que le 100% soit visible
      setTimeout(() => {
        if (loader) loader.classList.add('hidden');
        widgetEl.classList.add('loaded');
        console.log('[Calendly v3] ✅ Widget révélé');
      }, 400);
    };

    // ---------------------------
    //  INIT WIDGET
    // ---------------------------
    const initWidget = () => {
      if (!window.Calendly || !window.Calendly.initInlineWidget) {
        return setTimeout(initWidget, 100);
      }

      // Préfill
      const prefillObj = {};
      if (prefillName)  prefillObj.name  = prefillName;
      if (prefillEmail) prefillObj.email = prefillEmail;
      if (prefillPhone) prefillObj.phone_number = prefillPhone;

      if (customAnswers && typeof customAnswers === 'object') {
        prefillObj.customAnswers = {};
        Object.keys(customAnswers).forEach(key => {
          const val = customAnswers[key];
          if (val && String(val).trim() !== '') {
            prefillObj.customAnswers[key] = String(val);
          }
        });
      }

      console.log('[Calendly v3] PREFILL :', prefillObj);

      window.Calendly.initInlineWidget({
        url: url,
        parentElement: widgetEl,
        prefill: prefillObj
      });

      // Détecter quand l'iframe est chargée
      const checkIframe = setInterval(() => {
        const iframe = widgetEl.querySelector('iframe');
        if (iframe) {
          clearInterval(checkIframe);

          iframe.addEventListener('load', () => {
            console.log('[Calendly v3] iframe loaded');
            revealCalendly();
          });

          // Fallback : reveal après 6s max
          setTimeout(() => {
            if (!widgetEl.classList.contains('loaded')) {
              console.log('[Calendly v3] Fallback reveal (timeout)');
              revealCalendly();
            }
          }, 6000);
        }
      }, 150);
    };

    // ---------------------------
    //  LOAD SCRIPTS
    // ---------------------------
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => {
        console.warn("[Calendly v3] Impossible de charger le script");
        const loader = container.querySelector('.vf-cal-loader');
        if (loader) {
          loader.innerHTML = `
            <div style="color:#c62828;padding:20px;text-align:center;">
              ❌ Impossible de charger l'agenda.<br>
              <a href="${url}" target="_blank" style="color:#E91E63;margin-top:8px;display:inline-block;">
                Ouvrir Calendly directement →
              </a>
            </div>`;
        }
      };
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // ---------------------------
    //  EVENT CAPTURE
    // ---------------------------
    const parseEventUuid = (eventUri) => {
      const match = eventUri?.match(/scheduled_events\/([^\/]+)/);
      return match ? match[1] : null;
    };

    const extractImportantInfo = (details) => {
      const result = { reason: "", phone: "", website: "" };
      if (details.questions_and_answers) {
        for (const qa of details.questions_and_answers) {
          if (!qa?.question) continue;
          const q = qa.question.toLowerCase();
          const a = qa.answer || "";
          if (q.includes("web") || q.includes("site")) result.website = a;
          if (q.includes("pourquoi") || q.includes("motif") || q.includes("raison")) result.reason = a;
          if (q.includes("téléphone") || q.includes("mobile")) result.phone = a;
        }
      }
      if (details.invitee?.text_reminder_number) {
        result.phone = details.invitee.text_reminder_number;
      }
      return result;
    };

    const calendlyListener = async (e) => {
      if (!e.data?.event || !e.data.event.startsWith("calendly")) return;

      console.log("[Calendly v3] EVT:", e.data.event, e.data);
      const details = e.data.payload || {};

      if (e.data.event === "calendly.event_scheduled") {
        console.log("[Calendly v3] ✅ RDV confirmé");

        const eventUri   = details.event?.uri || details.uri;
        const inviteeUri = details.invitee?.uri;
        const eventUuid  = parseEventUuid(eventUri);
        const importantInfo = extractImportantInfo(details);

        const finalPayload = {
          event: "scheduled",
          eventUri,
          inviteeUri,
          eventName: details.event_type?.name || "",
          inviteeEmail: details.invitee?.email || "",
          inviteeName: details.invitee?.name || "",
          inviteeQuestions: details.questions_and_answers || [],
          startTime: details.event?.start_time || "",
          endTime: details.event?.end_time || "",
          reason: importantInfo.reason,
          phone: importantInfo.phone,
          website: importantInfo.website
        };

        // API Calendly si token
        if (calendlyToken) {
          if (inviteeUri) {
            try {
              const res = await fetch(inviteeUri, {
                headers: { Authorization: `Bearer ${calendlyToken}` }
              });
              if (res.ok) {
                const data = await res.json();
                finalPayload.inviteeEmail = data.resource.email || finalPayload.inviteeEmail;
                finalPayload.inviteeName  = data.resource.name  || finalPayload.inviteeName;
              }
            } catch (err) {
              console.error("[Calendly v3] Erreur API invité :", err);
            }
          }

          if (eventUuid) {
            try {
              const resEvent = await fetch(`https://api.calendly.com/scheduled_events/${eventUuid}`, {
                headers: { Authorization: `Bearer ${calendlyToken}` }
              });
              if (resEvent.ok) {
                const data = await resEvent.json();
                finalPayload.startTime = data.resource.start_time || finalPayload.startTime;
                finalPayload.endTime   = data.resource.end_time   || finalPayload.endTime;
              }
            } catch (err) {
              console.error("[Calendly v3] Erreur API event :", err);
            }
          }
        }

        window.voiceflow.calendlyEventData = finalPayload;
        window.voiceflow.chat.interact({
          type: "complete",
          payload: finalPayload
        });
      }
    };

    window.addEventListener("message", calendlyListener);

    return () => {
      window.removeEventListener("message", calendlyListener);
    };
  }
};

export default CalendlyExtension;
