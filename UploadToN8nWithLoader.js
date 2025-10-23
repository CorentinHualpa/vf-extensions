// UploadToN8nWithLoader.js - VERSION CORRIGÉE
export const UploadToN8nWithLoader = {
  name: 'UploadToN8nWithLoader',
  type: 'response',
  
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = (s) => /(^ext_)?UploadToN8nWithLoader$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[UploadToN8nWithLoader.match] error:', e);
      return false;
    }
  },

  render({ trace, element }) {
    if (!element) {
      console.error('[UploadToN8nWithLoader] Élément parent introuvable');
      return;
    }

    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    
    // UI upload
    const title            = p.title || 'Téléverser un ou plusieurs documents';
    const description      = p.description || 'Glissez-déposez des fichiers ici ou cliquez pour sélectionner';
    const allowMultiple    = p.allowMultiple !== false;
    const backgroundImage  = p.backgroundImage || null;
    const backgroundOpacity= typeof p.backgroundOpacity === 'number' ? p.backgroundOpacity : 0.15;
    const buttons          = Array.isArray(p.buttons) ? p.buttons : [];
    
    // Webhook n8n
    const webhook          = p.webhook || {};
    const webhookUrl       = webhook.url;
    const webhookMethod    = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders   = webhook.headers || {};
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 60000;
    const webhookRetries   = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    const sendFile         = webhook.sendFile !== false;
    
    // ✅ NOUVEAU : Nom du champ fichier configurable
    const fileFieldName    = webhook.fileFieldName || 'file'; // 'file' par défaut au lieu de 'files[]'
    const extra            = webhook.extra || {};
    
    // Attente / fin
    const awaitResponse    = p.awaitResponse !== false;
    const polling          = p.polling || {};
    const pollingEnabled   = !!polling.enabled;
    const pollingIntervalMs= Number.isFinite(polling.intervalMs) ? polling.intervalMs : 2000;
    const pollingMaxAttempts= Number.isFinite(polling.maxAttempts) ? polling.maxAttempts : 60;
    const pollingHeaders   = polling.headers || {};
    
    const pathSuccess      = p.pathSuccess || p.returnPathOnSuccess || 'Confirm_Upload';
    const pathError        = p.pathError   || p.returnPathOnCancel  || 'Cancel';
    
    const vfContext = {
      conversation_id: p.conversation_id || null,
      user_id: p.user_id || null,
      locale: p.locale || null,
    };

    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:12px;border-radius:10px;background:#fff1f0;border:1px solid #ffa39e;color:#a8071a">
        Erreur de configuration : <b>webhook.url</b> manquant.
      </div>`;
      element.appendChild(div);
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, error: 'WEBHOOK_URL_MISSING', path: pathError }
        });
      } catch {}
      return;
    }

    // ---------- UI (identique) ----------
    const root = document.createElement('div');
    root.style.position = 'relative';
    root.style.display = 'block';
    root.style.width = '100%';
    root.style.maxWidth = '100%';

    const card = document.createElement('div');
    card.style.border = '1px solid #e5e7eb';
    card.style.borderRadius = '12px';
    card.style.background = '#fff';
    card.style.padding = '16px';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    if (backgroundImage) {
      const bg = document.createElement('div');
      bg.style.position = 'absolute';
      bg.style.inset = '0';
      bg.style.backgroundImage = `url("${backgroundImage}")`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
      bg.style.opacity = String(backgroundOpacity);
      bg.style.pointerEvents = 'none';
      card.appendChild(bg);
    }

    const cardInner = document.createElement('div');
    cardInner.style.position = 'relative';
    cardInner.style.zIndex = '1';
    cardInner.innerHTML = `
      <div style="font-weight:700;font-size:16px;margin-bottom:6px">${title}</div>
      <div style="color:#4b5563;margin-bottom:12px;">${description}</div>
      <div class="upload-zone" style="
        border:2px dashed #93c5fd;background:rgba(255,255,255,0.95);
        border-radius:12px;padding:18px;text-align:center;cursor:pointer;">
        <div style="font-size:14px;">Déposer des fichiers ici ou cliquer</div>
        <input type="file" ${allowMultiple ? 'multiple' : ''} style="display:none" />
      </div>
      <div class="file-list" style="margin-top:10px;font-size:13px;color:#374151"></div>
      <div class="upload-actions" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        ${buttons.map(b => `
          <button class="back-button" data-path="${b.path || pathError}"
            style="appearance:none;border:0;cursor:pointer;padding:10px 12px;border-radius:10px;
                   background:${b.color || '#003761'};color:${b.textColor || '#fff'};font-weight:600;font-size:13px;">
            ${b.text || 'Annuler'}
          </button>
        `).join('')}
        <button class="send-button" disabled
          style="appearance:none;border:0;cursor:pointer;padding:10px 12px;border-radius:10px;
                 background:#0ea5e9;color:#fff;font-weight:700;font-size:13px;">
          Envoyer à n8n
        </button>
      </div>
      <div class="upload-status" style="margin-top:8px;font-size:13px;color:#374151"></div>
    `;
    card.appendChild(cardInner);

    const overlay = document.createElement('div');
    overlay.style.display = 'none';
    overlay.style.border = '1px solid #e5e7eb';
    overlay.style.borderRadius = '12px';
    overlay.style.background = '#0b0c10';
    overlay.style.padding = '16px';
    overlay.style.color = '#fff';
    overlay.style.marginTop = '12px';

    root.appendChild(card);
    root.appendChild(overlay);
    element.appendChild(root);

    // ---------- Sélecteurs ----------
    const uploadZone  = cardInner.querySelector('.upload-zone');
    const fileInput   = cardInner.querySelector('input[type="file"]');
    const fileList    = cardInner.querySelector('.file-list');
    const sendBtn     = cardInner.querySelector('.send-button');
    const backButtons = cardInner.querySelectorAll('.back-button');
    const statusDiv   = cardInner.querySelector('.upload-status');

    // ---------- Loader (identique) ----------
    function mountLoaderUI({
      message = p.loader?.message || 'Traitement en cours…',
      color   = p.loader?.color   || '#9C27B0',
      steps   = p.loader?.steps   || [
        { progress: 5,  text: 'Analyse du fichier' },
        { progress: 25, text: 'Prétraitement' },
        { progress: 50, text: 'Envoi au pipeline' },
        { progress: 75, text: 'Traitement modèle' },
        { progress: 90, text: 'Consolidation des résultats' },
        { progress: 100,text: 'Finalisation' }
      ],
      finalText       = p.loader?.finalText || 'Terminé ! Cliquez pour continuer',
      finalButtonIcon = p.loader?.finalButtonIcon || '🎯',
      height = p.loader?.height || 360,
      size   = p.loader?.size   || 180,
      strokeWidth = p.loader?.strokeWidth || 10
    } = {}) {
      overlay.innerHTML = '';
      overlay.style.display = 'block';
      overlay.style.minHeight = `${height}px`;

      const center = document.createElement('div');
      center.style.display = 'flex';
      center.style.flexDirection = 'column';
      center.style.alignItems = 'center';
      center.style.gap = '12px';
      overlay.appendChild(center);

      const msg = document.createElement('div');
      msg.textContent = message;
      msg.style.fontWeight = '800';
      msg.style.letterSpacing = '.3px';
      center.appendChild(msg);

      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      svg.style.width = `${size}px`;
      svg.style.height = `${size}px`;

      const bg = document.createElementNS('http://www.w3.org/2000/svg','circle');
      bg.setAttribute('cx', size/2); bg.setAttribute('cy', size/2); bg.setAttribute('r', radius);
      bg.setAttribute('stroke', 'rgba(255,255,255,0.12)');
      bg.setAttribute('stroke-width', strokeWidth); bg.setAttribute('fill','none');

      const fg = document.createElementNS('http://www.w3.org/2000/svg','circle');
      fg.setAttribute('cx', size/2); fg.setAttribute('cy', size/2); fg.setAttribute('r', radius);
      fg.setAttribute('stroke', color);
      fg.setAttribute('stroke-width', strokeWidth); fg.setAttribute('fill','none');
      fg.setAttribute('stroke-linecap','round');
      fg.setAttribute('transform', `rotate(-90 ${size/2} ${size/2})`);
      fg.style.strokeDasharray = `${circumference}`;
      fg.style.strokeDashoffset = `${circumference}`;

      const pct = document.createElement('div');
      pct.textContent = '0%';
      pct.style.position = 'relative';
      pct.style.top = '-110px';
      pct.style.fontWeight = '900';

      center.appendChild(svg);
      center.appendChild(pct);
      svg.appendChild(bg); svg.appendChild(fg);

      const stepText = document.createElement('div');
      stepText.style.opacity = '.9';
      center.appendChild(stepText);

      function setProgress(per) {
        const off = circumference - (per/100)*circumference;
        fg.style.strokeDashoffset = `${off}`;
        pct.textContent = `${Math.round(per)}%`;
        let chosen = steps[0];
        for (const s of steps) if (per >= s.progress) chosen = s;
        stepText.textContent = chosen?.text || '';
      }

      function showDone(onClick) {
        setProgress(100);
        const btn = document.createElement('button');
        btn.innerHTML = `<div style="font-size:24px">${finalButtonIcon}</div>${finalText}`;
        btn.style.marginTop = '8px';
        btn.style.padding = '12px 16px';
        btn.style.borderRadius = '999px';
        btn.style.border = '0'; btn.style.cursor = 'pointer';
        btn.style.fontWeight = '700'; btn.style.background = '#22c55e'; btn.style.color = '#fff';
        btn.onclick = onClick;
        center.appendChild(btn);
      }

      return { setProgress, showDone };
    }

    // ---------- Logiques ----------
    const state = { files: [] };

    function refreshFileList() {
      if (!state.files.length) {
        fileList.textContent = '';
        sendBtn.disabled = true;
        return;
      }
      fileList.innerHTML = state.files.map(f => `• ${f.name} (${(f.size/1024).toFixed(1)} KB)`).join('<br/>');
      sendBtn.disabled = false;
    }

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.background = 'rgba(230,240,255,0.95)'; });
    uploadZone.addEventListener('dragleave', () => { uploadZone.style.background = 'rgba(255,255,255,0.95)'; });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.background = 'rgba(255,255,255,0.95)';
      const files = Array.from(e.dataTransfer?.files || []);
      state.files = allowMultiple ? files : files.slice(0,1);
      refreshFileList();
    });

    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      state.files = allowMultiple ? files : files.slice(0,1);
      refreshFileList();
    });

    backButtons.forEach(b => b.addEventListener('click', () => {
      const path = b.getAttribute('data-path') || pathError;
      try {
        window?.voiceflow?.chat?.interact?.({ type: 'complete', payload: { webhookSuccess: false, path } });
      } catch {}
    }));

    sendBtn.addEventListener('click', async () => {
      if (!state.files.length) return;

      sendBtn.disabled = true;
      backButtons.forEach(b => b.disabled = true);
      statusDiv.textContent = 'Envoi au webhook…';

      const loader = mountLoaderUI();
      loader.setProgress(8);

      try {
        // ✅ CORRECTION MAJEURE : Construction du FormData comme dans KBUpload_n8n
        loader.setProgress(20);
        
        const resp = await postWithRetry({
          url: webhookUrl,
          method: webhookMethod,
          headers: webhookHeaders,
          timeoutMs: webhookTimeoutMs,
          retries: webhookRetries,
          sendFile,
          files: state.files,
          fileFieldName,  // ✅ Passer le nom du champ
          extra,
          vfContext
        });

        let finalData = resp?.data ?? null;

        if (awaitResponse) {
          const jobId = finalData?.jobId;
          const statusUrl = finalData?.statusUrl || polling?.statusUrl;
          
          if (pollingEnabled && (statusUrl || jobId)) {
            loader.setProgress(45);
            finalData = await pollStatus({
              statusUrl: statusUrl || `${webhookUrl.replace(/\/webhook(\/test)?\/.*/,'')}/rest/jobs/${jobId}`,
              headers: pollingHeaders,
              intervalMs: pollingIntervalMs,
              maxAttempts: pollingMaxAttempts,
              onTick: (i, total) => loader.setProgress(Math.min(90, 45 + Math.floor((i/total)*40)))
            });
          }
        }

        loader.setProgress(100);
        loader.showDone(() => {
          try {
            window?.voiceflow?.chat?.interact?.({
              type: 'complete',
              payload: {
                webhookSuccess: true,
                webhookResponse: finalData,
                filesCount: state.files.length,
                path: pathSuccess
              }
            });
          } catch {}
        });

      } catch (err) {
        overlay.style.display = 'none';
        statusDiv.innerHTML = `<div style="padding:10px;border-radius:10px;background:#fff1f0;border:1px solid #ffa39e;color:#a8071a">
          Erreur: ${String(err?.message || err)}
        </div>`;
        sendBtn.disabled = false;
        backButtons.forEach(b => b.disabled = false);
        
        try {
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: { webhookSuccess: false, error: String(err?.message || err), path: pathError }
          });
        } catch {}
      }
    });

    // ✅ ---------- FONCTION CORRIGÉE postWithRetry ----------
    async function postWithRetry({ url, method, headers, timeoutMs, retries, sendFile, files, fileFieldName, extra, vfContext }) {
      let lastErr;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const to = setTimeout(() => controller.abort(), timeoutMs);
          let resp;

          if (sendFile) {
            // ✅ Construction FormData EXACTEMENT comme KBUpload_n8n
            const fd = new FormData();
            
            // ✅ Ajouter les fichiers avec le bon nom de champ
            if (allowMultiple) {
              files.forEach((f, i) => {
                // Si multiple, ajouter un index : file_0, file_1, etc.
                fd.append(`${fileFieldName}_${i}`, f, f.name);
              });
            } else {
              // Si single, juste le nom du champ
              fd.append(fileFieldName, files[0], files[0].name);
            }
            
            // ✅ Ajouter les champs extra DIRECTEMENT (pas en JSON blob)
            Object.entries(extra).forEach(([k, v]) => {
              fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
            });
            
            // ✅ Ajouter le contexte VF
            if (vfContext.conversation_id) fd.append('conversation_id', vfContext.conversation_id);
            if (vfContext.user_id) fd.append('user_id', vfContext.user_id);
            if (vfContext.locale) fd.append('locale', vfContext.locale);
            
            // ✅ NE PAS définir Content-Type manuellement (le navigateur le fait avec boundary)
            const finalHeaders = { ...headers };
            delete finalHeaders['Content-Type']; // Important pour multipart/form-data
            
            resp = await fetch(url, { 
              method, 
              headers: finalHeaders, 
              body: fd, 
              signal: controller.signal 
            });
            
          } else {
            // Mode base64
            const filesBase64 = await Promise.all(files.map(async (f) => ({
              name: f.name, 
              type: f.type, 
              size: f.size, 
              base64: await toBase64(f)
            })));
            
            const body = {
              files: filesBase64,
              extra,
              context: vfContext
            };
            
            const merged = { 
              ...headers, 
              'Content-Type': 'application/json' 
            };
            
            resp = await fetch(url, { 
              method, 
              headers: merged, 
              body: JSON.stringify(body), 
              signal: controller.signal 
            });
          }

          clearTimeout(to);

          if (!resp.ok) {
            const t = await safeText(resp);
            throw new Error(`Webhook ${resp.status} ${resp.statusText} – ${t?.slice(0,400) || ''}`);
          }

          return { ok: true, data: await safeJson(resp) };

        } catch (e) {
          lastErr = e;
          if (attempt < retries) await new Promise(r => setTimeout(r, 600 * (attempt+1)));
        }
      }
      
      throw lastErr || new Error('Webhook failed');
    }

    // ---------- Helpers (identiques) ----------
    async function pollStatus({ statusUrl, headers, intervalMs, maxAttempts, onTick }) {
      for (let i = 1; i <= maxAttempts; i++) {
        onTick?.(i, maxAttempts);
        const r = await fetch(statusUrl, { headers });
        if (!r.ok) throw new Error(`Polling ${r.status} ${r.statusText}`);
        const j = await safeJson(r);
        if (j?.status === 'done')  return j?.data ?? j;
        if (j?.status === 'error') throw new Error(j?.error || 'Pipeline error');
        await new Promise(res => setTimeout(res, intervalMs));
      }
      throw new Error('Polling timeout');
    }

    function toBase64(file) {
      return new Promise((resolve, reject) => {
        const rd = new FileReader();
        rd.onload = () => {
          const s = String(rd.result || '');
          const comma = s.indexOf(',');
          resolve(comma >= 0 ? s.slice(comma+1) : s);
        };
        rd.onerror = reject;
        rd.readAsDataURL(file);
      });
    }

    async function safeJson(r){ try{ return await r.json(); } catch{ return null; } }
    async function safeText(r){ try{ return await r.text(); } catch{ return null; } }
  }
};

try { window.UploadToN8nWithLoader = UploadToN8nWithLoader; } catch {}
