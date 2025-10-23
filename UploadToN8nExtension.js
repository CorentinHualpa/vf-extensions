// UploadToN8nExtension.js
// Upload fichier -> Webhook n8n (multipart ou JSON base64)
// Auteur: Corentin | Evolution Agency

export const UploadToN8nExtension = {
  name: 'UploadToN8n',
  type: 'response',

  match: function (context) {
    try {
      const t = context?.trace;
      return !!(t && (t.type === 'ext_UploadToN8n' || t?.payload?.name === 'ext_UploadToN8n'));
    } catch (e) {
      console.error('[UploadToN8n] match error:', e);
      return false;
    }
  },

  render: function (context) {
    const element = context?.element;
    const payload = context?.trace?.payload || {};
    if (!element) {
      console.error('[UploadToN8n] Élément parent manquant');
      return;
    }

    // ==== CONFIG UI ====
    const title = payload.title || 'Téléverser un document';
    const description = payload.description || 'Glissez-déposez votre fichier ici ou cliquez pour sélectionner';
    const backgroundImage = payload.backgroundImage || null;
    const backgroundOpacity = typeof payload.backgroundOpacity === 'number' ? payload.backgroundOpacity : 0.15;
    const buttons = Array.isArray(payload.buttons) ? payload.buttons : [];

    // ==== CONFIG WEBHOOK n8n ====
    const webhook = payload.webhook || {};
    const webhookUrl = webhook.url || null;                 // REQUIS
    const webhookMethod = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders = webhook.headers || {};           // ex: { "x-api-key": "..." }
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 20000;
    const webhookRetries = Number.isFinite(webhook.retries) ? webhook.retries : 2;
    const sendFile = webhook.sendFile !== false;            // true = multipart (recommandé), false = JSON base64

    // Données supplémentaires à joindre au webhook
    const extra = webhook.extra || {};                      // objet libre
    const contextInfo = {
      conversation_id: payload.conversation_id || null,
      user_id: payload.user_id || null,
      locale: payload.locale || null,
    };

    // Paths de routage côté VF
    const pathSuccess = payload.pathSuccess || 'UploadN8n_Success';
    const pathError   = payload.pathError   || 'UploadN8n_Error';

    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:12px;border-radius:10px;background:#fff1f0;border:1px solid #ffa39e;color:#a8071a">
        Erreur de configuration : URL du webhook n8n manquante.
      </div>`;
      element.appendChild(div);
      window?.voiceflow?.chat?.interact?.({
        type: 'complete',
        payload: { webhookSuccess: false, error: 'WEBHOOK_URL_MISSING', path: pathError }
      });
      return;
    }

    // ==== UI ====
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.padding = '16px';
    container.style.border = '1px solid #e5e7eb';
    container.style.borderRadius = '12px';
    container.style.background = '#ffffff';
    container.style.overflow = 'hidden';

    if (backgroundImage) {
      const bg = document.createElement('div');
      bg.style.position = 'absolute';
      bg.style.inset = '0';
      bg.style.backgroundImage = `url("${backgroundImage}")`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
      bg.style.opacity = String(backgroundOpacity);
      bg.style.pointerEvents = 'none';
      container.appendChild(bg);
    }

    const content = document.createElement('div');
    content.style.position = 'relative';
    content.style.zIndex = '1';
    content.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
        <div style="font-weight:700;font-size:16px;">${title}</div>
      </div>
      <div style="color:#4b5563;margin-bottom:12px;">${description}</div>

      <div class="upload-zone" style="
        border:2px dashed #93c5fd;
        background: rgba(255,255,255,0.9);
        border-radius:12px;
        padding:18px;
        text-align:center;
        cursor:pointer;
        transition: all .2s ease;
      ">
        <div style="font-size:14px;">Déposer un fichier ici ou cliquer</div>
        <input type="file" style="display:none" />
      </div>

      <div class="upload-status" style="margin-top:12px;font-size:13px;color:#374151;"></div>

      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        ${buttons.map(btn => `
          <button class="back-button" data-path="${btn.path || 'Cancel'}"
            style="appearance:none;border:0;cursor:pointer;padding:10px 12px;border-radius:10px;
                   background:${btn.color || '#003761'};color:${btn.textColor || '#ffffff'};
                   font-weight:600;font-size:13px;">
            ${btn.text || 'Retour'}
          </button>
        `).join('')}
      </div>
    `;
    container.appendChild(content);
    element.appendChild(container);

    const uploadZone = content.querySelector('.upload-zone');
    const statusDiv  = content.querySelector('.upload-status');
    const fileInput  = content.querySelector('input[type="file"]');
    const backButtons = content.querySelectorAll('.back-button');

    backButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const path = this.getAttribute('data-path') || 'Cancel';
        window.voiceflow.chat.interact({ type: 'complete', payload: { webhookSuccess: false, path } });
      });
    });

    // Helpers
    const setBusy = (busy) => {
      backButtons.forEach(b => b.disabled = !!busy);
      uploadZone.style.opacity = busy ? '0.7' : '1';
      uploadZone.style.pointerEvents = busy ? 'none' : 'auto';
    };
    const updateStatus = (html) => { statusDiv.innerHTML = html; };
    const formatSize = (bytes) => {
      if (!Number.isFinite(bytes)) return '';
      const k = 1024, u = ['B','KB','MB','GB','TB'];
      const i = Math.floor(Math.log(bytes)/Math.log(k));
      return `${(bytes/Math.pow(k,i)).toFixed(2)} ${u[i]}`;
    };

    // DnD + click
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.background = 'rgba(230,240,255,0.95)'; });
    uploadZone.addEventListener('dragleave', () => { uploadZone.style.background = 'rgba(255,255,255,0.9)'; });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.background = 'rgba(255,255,255,0.9)';
      if (e.dataTransfer?.files?.length) {
        fileInput.files = e.dataTransfer.files;
        handleFile(fileInput.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) handleFile(fileInput.files[0]);
    });

    async function handleFile(file) {
      if (!file) return;
      setBusy(true);
      updateStatus(`Téléversement : <b>${file.name}</b> (${formatSize(file.size)})…`);

      try {
        const payloadForN8n = {
          file: { name: file.name, type: file.type, size: file.size, lastModified: file.lastModified || null },
          extra,
          context: contextInfo
        };

        const resp = await postToWebhookWithRetry({
          url: webhookUrl,
          method: webhookMethod,
          headers: webhookHeaders,
          timeoutMs: webhookTimeoutMs,
          retries: webhookRetries,
          sendFile,
          file,
          json: payloadForN8n
        });

        updateStatus(`✅ Webhook n8n déclenché`);
        setBusy(false);

        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            webhookSuccess: true,
            webhookResponse: resp?.data || null,
            path: pathSuccess
          }
        });

      } catch (err) {
        console.error('[UploadToN8n] error', err);
        updateStatus(`<div style="margin-top:8px;padding:10px;border-radius:10px;background:#fff1f0;border:1px solid #ffa39e;color:#a8071a">
          Erreur: ${err?.message || err}
        </div>`);
        setBusy(false);

        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            webhookSuccess: false,
            error: String(err?.message || err),
            path: pathError
          }
        });
      }
    }

    // POST helper avec timeout + retry + support multipart ou JSON
    async function postToWebhookWithRetry({ url, method, headers, timeoutMs, retries, sendFile, file, json }) {
      let attempt = 0, lastErr = null;

      while (attempt <= retries) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          let resp;
          if (sendFile) {
            // multipart/form-data : 'file' (binaire) + 'payload' (JSON)
            const fd = new FormData();
            fd.append('file', file, file.name);
            fd.append('payload', new Blob([JSON.stringify(json || {})], { type: 'application/json' }));
            resp = await fetch(url, { method, headers, body: fd, signal: controller.signal });
          } else {
            // JSON: fichier en base64 dans json.fileBase64
            const base64 = await toBase64(file);
            const mergedHeaders = Object.assign({}, headers, { 'Content-Type': 'application/json' });
            const body = Object.assign({}, json, { fileBase64: base64 });
            resp = await fetch(url, { method, headers: mergedHeaders, body: JSON.stringify(body), signal: controller.signal });
          }

          clearTimeout(timer);

          if (!resp.ok) {
            const txt = await safeText(resp);
            throw new Error(`Webhook ${resp.status} ${resp.statusText} – ${txt?.slice(0, 500) || ''}`);
          }

          const data = await safeJson(resp);
          return { ok: true, data };

        } catch (e) {
          lastErr = e;
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          }
          attempt++;
        }
      }
      throw lastErr || new Error('Webhook failed (unknown)');
    }

    async function safeJson(resp) { try { return await resp.json(); } catch { return null; } }
    async function safeText(resp) { try { return await resp.text(); } catch { return null; } }

    function toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result;
          // reader.result est un DataURL "data:...;base64,XXXXX"
          const comma = String(res).indexOf(',');
          resolve(comma >= 0 ? String(res).slice(comma + 1) : String(res));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};
