export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_fileUpload' ||
    trace.payload?.name === 'ext_fileUpload' ||
    trace.payload?.name === 'file_upload',
  render: ({ trace, element }) => {
    try {
      console.log('FileUpload extension render', trace);

      // 1) Génération d'un ID unique
      const uniqueId = 'fileUpload_' + Date.now();

      // 2) Container + styles
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          .upload-container {
            padding:20px; border:2px dashed #ccc; border-radius:5px;
            text-align:center; cursor:pointer; transition:border-color .3s;
            margin-bottom:10px;
          }
          .upload-container:hover { border-color:#2e7ff1 }
          .upload-input { display:none }
          .upload-label { color:#666; margin-bottom:10px; display:block }
          .status { padding:10px; border-radius:5px; margin-top:10px; display:none }
          .status.loading { background:#2196F3; color:#fff }
          .status.success { background:#4CAF50; color:#fff }
          .status.error { background:#f44336; color:#fff }
          .file-preview { margin-top:10px; max-height:200px; overflow-y:auto }
          .file-item { display:flex; padding:5px; border-bottom:1px solid #eee }
          .file-name { flex:1; margin-right:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
          .file-size { font-size:.9em; color:#333 }
        </style>
        <div class="upload-container">
          <input
            id="${uniqueId}"
            class="upload-input"
            type="file"
            multiple
          />
          <label for="${uniqueId}" class="upload-label">
            Cliquez ou glissez vos fichiers ici
          </label>
          <div class="file-preview"></div>
        </div>
        <div class="status"></div>
      `;
      element.appendChild(container);

      // 3) Références
      const uploadInput     = container.querySelector('.upload-input');
      const uploadContainer = container.querySelector('.upload-container');
      const statusEl        = container.querySelector('.status');
      const filePreview     = container.querySelector('.file-preview');

      const showStatus = (msg, type) => {
        statusEl.textContent   = msg;
        statusEl.className     = 'status ' + type;
        statusEl.style.display = 'block';
      };

      // 4) Fonction d’upload
      const handleUpload = async (files) => {
        if (!files.length) return;

        // affiche loading
        showStatus(`🔄 Upload de ${files.length} fichier(s)…`, 'loading');

        const form = new FormData();
        Array.from(files).forEach((f) => form.append('files', f));

        try {
          const res  = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: form }
          );
          const json = await res.json();
          console.log('Upload response:', json);

          if (!res.ok || !Array.isArray(json.urls) || !json.urls.length) {
            throw new Error(json.detail || 'Aucune URL renvoyée');
          }

          // preview
          filePreview.innerHTML = '';
          json.urls.forEach((url) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `<div class="file-name">${url}</div>`;
            filePreview.appendChild(div);
          });

          showStatus(`✅ ${json.urls.length} fichier(s) uploadés !`, 'success');

          // 5) Envoi du payload stringifié pour ta JS‑step
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: true,
              urls: json.urls
            }),
          });

          // 6) On pousse aussi un message proactif pour sortir le widget de son état “attente”
          window.voiceflow.chat.proactive.push({
            type: 'text',
            payload: { message: 'Vos documents ont bien été reçus !' },
          });
        } catch (err) {
          console.error('Upload error:', err);
          showStatus(`❌ Erreur : ${err.message}`, 'error');

          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: false,
              error: err.message
            }),
          });

          // on peut aussi afficher proactif un message d’erreur
          window.voiceflow.chat.proactive.push({
            type: 'text',
            payload: { message: `Erreur lors de l’upload : ${err.message}` },
          });
        }
      };

      // 7) Listeners pour select + drag&drop
      uploadInput.addEventListener('change', (e) => handleUpload(e.target.files));
      ['dragenter','dragover'].forEach((ev) =>
        uploadContainer.addEventListener(ev, (e) => {
          e.preventDefault(); e.stopPropagation();
          uploadContainer.style.borderColor = '#2e7ff1';
        })
      );
      ['dragleave','drop'].forEach((ev) =>
        uploadContainer.addEventListener(ev, (e) => {
          e.preventDefault(); e.stopPropagation();
          uploadContainer.style.borderColor = '#ccc';
          if (ev === 'drop') handleUpload(e.dataTransfer.files);
        })
      );
    } catch (e) {
      console.error('Error in FileUpload render:', e);
      // on force un complete même en erreur
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: JSON.stringify({
          success: false,
          error: 'Erreur interne de FileUpload'
        }),
      });
    }
  },
};
