/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Calendly – Voiceflow Response Extension                  ║
 *  ║  VERSION 2.0 - FULL WIDTH + HIDE HEADER                  ║
 *  ║                                                           ║
 *  ║  • Pleine largeur dans le chat Voiceflow                 ║
 *  ║  • Header Calendly masqué (profil + description)         ║
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
      height = 700,
      backgroundColor = '#ffffff',
      calendlyToken = '',
      prefillName = '',
      prefillEmail = '',
      prefillPhone = '',
      customAnswers = {},
      hideHeader = true,
      hideEventType = false,
      hideLandingPageDetails = false
    } = config;

    if (!url) {
      element.innerHTML = `
        <div style="padding:20px;color:#c62828;background:#ffebee;border-radius:8px;">
          ❌ Erreur: URL Calendly manquante
        </div>`;
      return;
    }

    console.log('[Calendly v2] === CONFIG ===', config);

    // ---------------------------
    //  STYLE — FORCER PLEINE LARGEUR
    // ---------------------------
    const styleId = 'vf-calendly-ext-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
/* ═══════════════════════════════════════════════════════════ */
/* ✅ FORCER PLEINE LARGEUR — TOUS LES CONTAINERS PARENTS     */
/* ═══════════════════════════════════════════════════════════ */
.vfrc-message--extension-Calendly {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}
.vfrc-message--extension-Calendly > span,
.vfrc-message--extension-Calendly > div,
.vfrc-message--extension-Calendly .vfrc-bubble,
.vfrc-message--extension-Calendly .vfrc-bubble-content,
.vfrc-message--extension-Calendly .vfrc-message-content {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  display: block !important;
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ CONTAINER CALENDLY                                       */
/* ═══════════════════════════════════════════════════════════ */
.vf-calendly-container {
  width: 100% !important;
  min-width: 100% !important;
  box-sizing: border-box !important;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ IFRAME CALENDLY — PLEINE LARGEUR                         */
/* ═══════════════════════════════════════════════════════════ */
.vf-calendly-container .calendly-inline-widget {
  width: 100% !important;
  min-width: 100% !important;
  position: relative !important;
}

.vf-calendly-container .calendly-inline-widget iframe {
  width: 100% !important;
  min-width: 100% !important;
  border: none !important;
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ MASQUER LE HEADER CALENDLY (profil + description)        */
/* ═══════════════════════════════════════════════════════════ */
.vf-calendly-container.hide-header .calendly-inline-widget {
  /* Décaler l'iframe vers le haut pour cacher le header */
  margin-top: -68px !important;
  clip-path: inset(68px 0 0 0) !important;
}

/* Version alternative si clip-path ne marche pas dans certains navigateurs */
@supports not (clip-path: inset(0)) {
  .vf-calendly-container.hide-header {
    overflow: hidden !important;
  }
  .vf-calendly-container.hide-header .calendly-inline-widget {
    margin-top: -68px !important;
    position: relative !important;
    top: 0 !important;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ ANIMATION                                                */
/* ═══════════════════════════════════════════════════════════ */
@keyframes calendlyFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.vf-calendly-container {
  animation: calendlyFadeIn 0.4s ease-out;
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ LOADER PENDANT CHARGEMENT                                */
/* ═══════════════════════════════════════════════════════════ */
.vf-calendly-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  z-index: 10;
  transition: opacity 0.3s ease;
}

.vf-calendly-loader.hidden {
  opacity: 0;
  pointer-events: none;
}

.vf-calendly-loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #6C5CE7;
  border-radius: 50%;
  animation: calendlySpin 0.8s linear infinite;
}

@keyframes calendlySpin {
  to { transform: rotate(360deg); }
}
      `;
      document.head.appendChild(styleEl);
    }

    // ---------------------------
    //  CONTENEUR
    // ---------------------------
    const container = document.createElement('div');
    container.className = `vf-calendly-container${hideHeader ? ' hide-header' : ''}`;

    // Hauteur : si on cache le header, on ajoute le décalage pour compenser
    const effectiveHeight = hideHeader ? height + 68 : height;
    container.style.height = `${height}px`;

    // Loader
    const loader = document.createElement('div');
    loader.className = 'vf-calendly-loader';
    loader.innerHTML = '<div class="vf-calendly-loader-spinner"></div>';
    container.appendChild(loader);

    // Inner div pour le widget Calendly
    const widgetContainer = document.createElement('div');
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = `${effectiveHeight}px`;
    container.appendChild(widgetContainer);

    element.appendChild(container);

    // ---------------------------
    //  CONSTRUCTION URL CALENDLY
    // ---------------------------
    const buildCalendlyUrl = () => {
      const urlObj = new URL(url);

      // Paramètres d'affichage
      if (hideEventType) {
        urlObj.searchParams.set('hide_event_type_details', '1');
      }
      if (hideLandingPageDetails) {
        urlObj.searchParams.set('hide_landing_page_details', '1');
      }

      return urlObj.toString();
    };

    // ---------------------------
    //  WIDGET INITIALIZER
    // ---------------------------
    const initWidget = () => {
      if (!window.Calendly || !window.Calendly.initInlineWidget) {
        return setTimeout(initWidget, 100);
      }

      // Préfill propre
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

      console.log('[Calendly v2] PREFILL :', prefillObj);
      console.log('[Calendly v2] URL :', buildCalendlyUrl());

      window.Calendly.initInlineWidget({
        url: buildCalendlyUrl(),
        parentElement: widgetContainer,
        prefill: prefillObj
      });

      // Cacher le loader quand l'iframe est chargée
      const checkIframe = setInterval(() => {
        const iframe = widgetContainer.querySelector('iframe');
        if (iframe) {
          iframe.addEventListener('load', () => {
            loader.classList.add('hidden');
            console.log('[Calendly v2] Widget chargé');
          });
          // Fallback : cacher le loader après 3s même si load event ne fire pas
          setTimeout(() => loader.classList.add('hidden'), 3000);
          clearInterval(checkIframe);
        }
      }, 200);

      console.log('[Calendly v2] Widget initialisé');
    };

    // ---------------------------
    //  CHARGEMENT SCRIPT + CSS CALENDLY
    // ---------------------------
    // CSS Calendly
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    // JS Calendly
    if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => {
        console.warn("[Calendly v2] Impossible de charger le script Calendly");
        loader.innerHTML = '<div style="color:#c62828;padding:20px;">❌ Erreur de chargement Calendly</div>';
      };
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // ---------------------------
    //  CAPTURE DES ÉVÉNEMENTS
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

      console.log("[Calendly v2] EVT:", e.data.event, e.data);

      const details = e.data.payload || {};

      if (e.data.event === "calendly.event_scheduled") {
        console.log("[Calendly v2] ✅ RDV confirmé");

        const eventUri  = details.event?.uri || details.uri;
        const inviteeUri = details.invitee?.uri;
        const eventUuid = parseEventUuid(eventUri);
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

        // API Calendly si token fourni
        if (calendlyToken) {
          if (inviteeUri) {
            try {
              const res = await fetch(inviteeUri, {
                headers: { Authorization: `Bearer ${calendlyToken}` }
              });
              if (res.ok) {
                const data = await res.json();
                finalPayload.inviteeEmail = data.resource.email || finalPayload.inviteeEmail;
                finalPayload.inviteeName = data.resource.name || finalPayload.inviteeName;
              }
            } catch (err) {
              console.error("[Calendly v2] Erreur API invité :", err);
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
                finalPayload.endTime = data.resource.end_time || finalPayload.endTime;
              }
            } catch (err) {
              console.error("[Calendly v2] Erreur API event :", err);
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
