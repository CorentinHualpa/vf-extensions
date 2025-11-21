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
      height = 900,
      minWidth = '320px',
      backgroundColor = '#ffffff',
      calendlyToken = '',
      prefillName = '',
      prefillEmail = '',
      prefillPhone = '',
      customAnswers = {}     // 🔥 Ici on utilisera prefill.customAnswers
    } = config;

    if (!url) {
      element.innerHTML = `
        <div style="padding:20px;color:#c62828;background:#ffebee;border-radius:8px;">
          ❌ Erreur: URL Calendly manquante
        </div>`;
      return;
    }

    console.log('[Calendly] === CONFIG ===', config);

    // ---------------------------
    //  STYLE
    // ---------------------------
    const styleEl = document.createElement('style');
    styleEl.textContent = `
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

      .calendly-inline-widget {
        min-width: ${minWidth} !important;
        background-color: ${backgroundColor} !important;
      }
    `;
    document.head.appendChild(styleEl);

    // ---------------------------
    //  CONTENEUR
    // ---------------------------
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    element.appendChild(container);

    // ---------------------------
    //  WIDGET INITIALIZER
    // ---------------------------
    const initWidget = () => {
      if (!window.Calendly || !window.Calendly.initInlineWidget) {
        return setTimeout(initWidget, 100);
      }

      // 🔥 PRÉFILL PROPRE (pas via URL)
      const prefillObj = {};

      if (prefillName)  prefillObj.name  = prefillName;
      if (prefillEmail) prefillObj.email = prefillEmail;
      if (prefillPhone) prefillObj.phone_number = prefillPhone;

      if (customAnswers && typeof customAnswers === 'object') {
        prefillObj.customAnswers = {};
        Object.keys(customAnswers).forEach(key => {
          const val = customAnswers[key];
          if (val && String(val).trim() !== '') {
            prefillObj.customAnswers[key] = String(val);   // 👈 aucun encodage URL
          }
        });
      }

      console.log('[Calendly] PREFILL utilisé :', prefillObj);

      window.Calendly.initInlineWidget({
        url: url,
        parentElement: container,
        prefill: prefillObj   // 🔥🔥🔥
      });

      console.log('[Calendly] Widget initialisé proprement sans + dans les champs.');
    };

    // ---------------------------
    //  CHARGEMENT SCRIPT CALENDLY
    // ---------------------------
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => console.warn("[Calendly] Impossible de charger le script Calendly");
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

      console.log("[Calendly] EVT:", e.data.event, e.data);
      const details = e.data.payload || {};

      if (e.data.event === "calendly.event_scheduled") {
        console.log("[Calendly] RDV confirmé");

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

        // 🔥 API Calendly si token fourni
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
              console.error("[Calendly] Erreur API invité :", err);
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
              console.error("[Calendly] Erreur API event :", err);
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
