export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    console.log('Checking match for file_upload', trace);
    return (
      trace.type === 'ext_fileUpload' ||
      trace.payload?.name === 'ext_fileUpload' ||
      trace.payload?.name === 'file_upload'
    );
  },
  render: ({ trace, element }) => {
    try {
      console.log('FileUpload extension render', trace);

      // 1) Génération d'un ID unique
      const uniqueId = 'fileUpload_' + Date.now();
      console.log(`File upload id: ${uniqueId}`);

      // 2) Création du container + styles
      const container = document.createElement('div');
      container.classList.add('file-upload-extension-container');
      container.innerHTML = `
        <style>
          .file-upload-extension-container { width:100%; box-sizing:border-box; }
          .upload-container {
            padding:20px; border:2px dashed #ccc; border-radius:5px;
            text-align:center; margin-bottom:10px; cursor:pointer;
            transition:border-color .3s ease;
          }
          .upload-container:hover { border-color:#2e7ff1; }
          .upload-input { display:none; }
          .upload-label { display:block; margin-bottom:10px; color:#666; }
          .status-container {
            padding:10px; border-radius:5px; margin-top:10px;
            display:none;
          }
          .status-container.loading { background:#2196F3; color:#fff; }
          .status-container.success { background:#4CAF50; color:#fff; }
          .status-container.error   { background:#f44336; color:#fff; }
          .file-preview { margin-top:10px; max-height:200px; overflow-y:auto; }
          .file-item {
            display:flex; align-items:center; padding:5px;
            border-bottom:1px solid #eee;
          }
          .file-name { flex:1; margin-right:10px; text-overflow:ellipsis;
            overflow:hidden; white-space:nowrap;
          }
          .file-size { font-size:.9em; color:#333; }
        </style>
        <div class="upload-container">
          <input
            type="file"
            id="${uniqueId}"
            class="upload-input"
            multiple
          />
          <label for="${uniqueId}" class="upload-label">
            Cliquer ou glisser-déposer des fichiers
          </label>
          <div class="file-preview"></div>
        </div>
        <div class="status-container"></div>
      `;
      element.appendChild(container);

      // 3) Références DOM
      const uploadInput     = container.querySelector('.upload-input');
      const uploadContainer = container.querySelector('.upload-container');
      const statusContainer = container.querySelector('.status-container');
      const filePreview     = container.querySelector('.file-preview');

      // Affichage du status
      const showStatus = (msg, type) => {
        statusContainer.textContent   = msg;
        statusContainer.className     = 'status-container ' + type;
        statusContainer.style.display = 'block';
      };

      // 4) Fonction d'upload
      const handleUpload = async (files) => {
        if (!files.length) return;

        showStatus(`Téléversement de ${files.length} fichier(s)…`, 'loading');

        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append('files', f));

        try {
          const res  = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: formData }
          );
          const json = await res.json();
          console.log('Upload response:', json);

          if (!res.ok || !Array.isArray(json.urls) || !json.urls.length) {
            throw new Error(json.detail || 'Aucune URL retournée');
          }

          // Preview des URLs
          filePreview.innerHTML = '';
          json.urls.forEach((url) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `<div class="file-name">${url}</div>`;
            filePreview.appendChild(item);
          });

          showStatus(`Succès : ${json.urls.length} fichier(s) !`, 'success');
          uploadContainer.style.pointerEvents = 'none';
          uploadContainer.style.opacity       = '0.7';

          // 5) Terminer la Custom Action avec payload stringifié
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: true,
              urls: json.urls
            }),
          });

          // 6) Pousser un message proactif pour sortir le widget de l'attente
          window.voiceflow.chat.proactive.push({
            type: 'text',
            payload: { message: 'Vos documents ont bien été reçus !' },
          });
        } catch (err) {
          console.error('Upload error:', err);
          showStatus(`Erreur : ${err.message}`, 'error');

          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: false,
              error: err.message
            }),
          });
          window.voiceflow.chat.proactive.push({
            type: 'text',
            payload: { message: `Échec upload : ${err.message}` },
          });
        }
      };

      // 7) Listeners pour sélection et drag & drop
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
    } catch (error) {
      console.error('Error in FileUpload render:', error);
      // Assurer la fin du flow même en cas d'erreur
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: JSON.stringify({
          success: false,
          error: 'Erreur interne FileUpload'
        }),
      });
    }
  },
};
