// KBUpload_n8n.js
// Extension Voiceflow pour téléverser un fichier vers un webhook n8n (sans authentification)

export const KBUpload_n8n = {
  name: 'KBUpload_n8n',        // <= nom de l’extension (garde "n8n")
  type: 'response',

  // Match robuste : supporte type 'ext_KBUpload_n8n' OU type 'extension' + payload.name
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = (s) => /(^ext_)?KBUpload_n8n$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[KBUpload_n8n.match] error:', e);
      return false;
    }
  },

  render(context) {
    try {
      const trace = context?.trace || {};
      const element = context?.element;
      if (!element) return console.error('[KBUpload_n8n] Élément parent introuvable');

      // ---- PARAMS depuis le payload ----
      const p = trace.payload || {};
      const title               = p.title || 'Téléverser un document';
      const description         = p.description || 'Glissez-déposez votre fichier ici ou cliquez pour sélectionner';
      const webhookURL          = p.webhookURL || '';     // <- URL du webhook n8n (obligatoire)
      const method              = (p.method || 'POST').toUpperCase();
      const fieldName           = p.fieldName || 'file';  // nom du champ fichier pour n8n
      const accept              = p.accept || '.pdf,.doc,.docx,.txt';
      const maxFileSizeMB       = Number(p.maxFileSizeMB || 25);
      const extraFields         = p.extraFields || {};    // { cle: valeur } => envoyés en FormData
      const backgroundImage     = p.backgroundImage || null;
      const backgroundOpacity   = p.backgroundOpacity ?? 0.12;
      const buttons             = Array.isArray(p.buttons) ? p.buttons : [];
      const returnPathOnSuccess = p.returnPathOnSuccess || 'Confirm_Upload';
      const returnPathOnCancel  = p.returnPathOnCancel  || 'Cancel';

      if (!webhookURL) {
        const err = document.createElement('div');
        err.innerHTML = `
          <div style="padding:12px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:8px;color:#842029">
            Erreur : <strong>webhookURL</strong> manquant dans le payload de l’extension.
          </div>`;
        element.appendChild(err);
        return;
      }
      if (method !== 'POST') {
        console.warn('[KBUpload_n8n] Méthode forcée en POST pour un upload de fichier.');
      }

      // ---- UI ----
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          .kb-n8n-wrap { position: relative; padding: 15px; border-radius: 10px; margin-bottom: 15px; overflow: hidden; }
          .kb-n8n-bg   { position:absolute; inset:0; border-radius:10px; ${backgroundImage ? `background-image:url('${backgroundImage}'); background-size:contain; background-position:center; background-repeat:no-repeat; opacity:${backgroundOpacity};` : 'background:rgba(240,240,240,.35);'} }
          .kb-n8n-ctn  { position:relative; z-index:1; }
          .kb-n8n-h3   { margin:0 0 12px; font-weight:600; color:#333; }
          .kb-n8n-zone { border:2px dashed #2E6EE1; padding:20px; border-radius:8px; text-align:center; cursor:pointer; background:rgba(255,255,255,.75); transition:.2s; }
          .kb-n8n-zone:hover { background:rgba(255,255,255,.95); border-color:#1E5ECA; }
          .kb-n8n-sts  { margin-top:10px; min-height:40px; background:rgba(255,255,255,.7); padding:8px; border-radius:6px; font-size:14px; color:#333; }
          .kb-n8n-btns { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
          .kb-n8n-btn  { padding:8px 14px; border-radius:6px; border:none; cursor:pointer; font-weight:500; opacity:.85; }
          .kb-n8n-btn:hover { opacity:1; transform:translateY(-1px); }
          .kb-n8n-btn:disabled { opacity:.5; cursor:not-allowed; }
        </style>
        <div class="kb-n8n-wrap">
          <div class="kb-n8n-bg"></div>
          <div class="kb-n8n-ctn">
            <h3 class="kb-n8n-h3">${title}</h3>
            <div class="kb-n8n-zone">${description}</div>
            <div class="kb-n8n-sts"></div>
            <div class="kb-n8n-btns">
              ${buttons.map(b => `
                <button class="kb-n8n-btn kb-n8n-back"
                        style="background:${b.color || '#9E9E9E'}; color:${b.textColor || '#fff'}"
                        data-path="${b.path || returnPathOnCancel}">
                  ${b.text || 'Retour'}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <input type="file" style="display:none;" accept="${accept}">
      `;

      const zone      = container.querySelector('.kb-n8n-zone');
      const statusDiv = container.querySelector('.kb-n8n-sts');
      const input     = container.querySelector('input[type="file"]');
      const backBtns  = container.querySelectorAll('.kb-n8n-back');

      const setStatus = (html) => { statusDiv.innerHTML = html; };
      const fmtSize = (bytes) => {
        if (!bytes) return '0 B';
        const k=1024, u=['B','KB','MB','GB']; const i=Math.floor(Math.log(bytes)/Math.log(k));
        return `${(bytes/Math.pow(k,i)).toFixed(2)} ${u[i]}`;
      };

      // Boutons retour
      backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const path = btn.getAttribute('data-path') || returnPathOnCancel;
          window.voiceflow?.chat?.interact?.({ type:'complete', payload:{ uploadSuccess:false, path, buttonPath:path } });
        });
      });

      // Sélecteur
      zone.addEventListener('click', () => input.click());

      // Drag & drop
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.background='rgba(230,240,255,.95)'; });
      zone.addEventListener('dragleave', () => { zone.style.background='rgba(255,255,255,.75)'; });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.background='rgba(255,255,255,.75)';
        if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]);
      });

      input.addEventListener('change', () => {
        if (input.files?.length) handleFile(input.files[0]);
      });

      // Upload => n8n
      async function handleFile(file) {
        if (!file) return;
        // contraintes basiques
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
          return setStatus(`<span style="color:#b00020">Fichier trop volumineux (${fmtSize(file.size)}). Limite : ${maxFileSizeMB} MB.</span>`);
        }

        setStatus(`Téléversement en cours : <strong>${file.name}</strong> (${fmtSize(file.size)})…`);
        zone.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" width="50" height="50" alt="upload">`;
        disableButtons(true);

        try {
          const fd = new FormData();
          fd.append(fieldName, file, file.name);
          // extraFields (stringify objets)
          Object.entries(extraFields).forEach(([k,v]) => {
            fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
          });

          const res = await fetch(webhookURL, { method: 'POST', body: fd });
          const text = await res.text(); // n8n peut renvoyer JSON ou texte
          const ok = res.ok;

          setStatus(ok
            ? `<span style="color:green">✓ Document envoyé à n8n.</span>`
            : `<span style="color:#b00020">Erreur n8n ${res.status} : ${res.statusText}</span>`
          );

          if (ok) {
            setTimeout(() => {
              window.voiceflow?.chat?.interact?.({
                type: 'complete',
                payload: {
                  uploadSuccess: true,
                  path: returnPathOnSuccess,
                  file: { name: file.name, size: file.size, type: file.type },
                  webhookStatus: res.status,
                  webhookResponse: text?.slice(0, 2000) || '' // évite payloads géants
                }
              });
            }, 800);
            zone.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif" width="50" height="50" alt="done">`;
          } else {
            zone.textContent = description;
            disableButtons(false);
          }
        } catch (err) {
          console.error('[KBUpload_n8n] fetch error:', err);
          setStatus(`<span style="color:#b00020">Erreur réseau : ${(err && err.message) || err}</span>`);
          zone.textContent = description;
          disableButtons(false);
        }
      }

      function disableButtons(disabled) {
        backBtns.forEach(b => (b.disabled = disabled));
      }

      element.appendChild(container);
    } catch (e) {
      console.error('[KBUpload_n8n.render] error:', e);
      try {
        window.voiceflow?.chat?.interact?.({ type:'complete', payload:{ uploadSuccess:false, error:String(e) } });
      } catch { /* ignore */ }
    }
  }
};
