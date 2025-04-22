export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    // On matche soit le type, soit le payload.name
    return (
      trace.type === 'ext_fileUpload' ||
      trace.payload?.name === 'ext_fileUpload' ||
      trace.payload?.name === 'file_upload'
    );
  },
  render: ({ trace, element }) => {
    try {
      console.log('FileUpload extension render');

      // Génération d'un ID unique
      const uniqueId = 'fileUpload_' + Date.now();
      console.log(`File upload id: ${uniqueId}`);

      // Récupération des options éventuelles
      const {
        maxSize = 100,              // Mo
        acceptedTypes = '*',        // ex: '.pdf,image/*'
        buttonText =
          'Cliquer pour téléverser ou glisser-déposer des fichiers',
        multiple = true
      } = trace.payload || {};

      // Création du container et injection HTML + CSS
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
            padding:10px; border-radius:5px; margin-top:10px; display:none;
          }
          .status-container.loading { background:#2196F3; color:#fff; }
          .status-container.success { background:#4CAF50; color:#fff; }
          .status-container.error { background:#f44336; color:#fff; }
          .file-preview { margin-top:10px; max-height:200px; overflow-y:auto; }
          .file-item {
            display:flex; align-items:center; padding:5px; border-bottom:1px solid #eee;
          }
          .file-name { flex:1; margin-right:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .file-size { font-size:0.9em; color:#333; }
        </style>

        <div class="upload-container">
          <input
            type="file"
            id="${uniqueId}"
            class="upload-input"
            ${multiple ? 'multiple' : ''}
            accept="${acceptedTypes}"
          />
          <label for="${uniqueId}" class="upload-label">
            ${buttonText}
          </label>
          <div class="file-preview"></div>
        </div>
        <div class="status-container"></div>
      `;
      element.appendChild(container);

      // Références DOM
      const uploadInput     = container.querySelector('.upload-input');
      const uploadContainer = container.querySelector('.upload-container');
      const statusContainer = container.querySelector('.status-container');
      const filePreview     = container.querySelector('.file-preview');

      // Affichage du statut
      const showStatus = (msg, type) => {
        statusContainer.textContent = msg;
        statusContainer.className = 'status-container ' + type;
        statusContainer.style.display = 'block';
      };

      // Fonction d'upload
      const handleUpload = async (files) => {
        if (!files.length) return;

        // Vérification taille
        for (const f of files) {
          if (f.size > maxSize * 1024 * 1024) {
            return showStatus(`❌ ${f.name} > ${maxSize} Mo`, 'error');
          }
        }

        // Preview
        filePreview.innerHTML = '';
        Array.from(files).forEach((f) => {
          const item = document.createElement('div');
          item.className = 'file-item';
          item.innerHTML = `
            <div class="file-name">${f.name}</div>
            <div class="file-size">${(f.size/(1024*1024)).toFixed(2)} Mo</div>
          `;
          filePreview.appendChild(item);
        });

        showStatus(`🔄 Upload de ${files.length} fichier(s)…`, 'loading');

        // Envoi au serveur
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
            throw new Error(json.detail || 'Aucune URL renvoyée');
          }

          showStatus(`✅ ${json.urls.length} fichier(s) uploadés !`, 'success');
          uploadContainer.style.pointerEvents = 'none';
          uploadContainer.style.opacity       = '0.6';

          // Envoi du résultat sous forme de JSON stringifié
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: true,
              urls: json.urls
            }),
          });
        } catch (err) {
          console.error('Upload error:', err);
          showStatus(`❌ Erreur: ${err.message}`, 'error');

          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: false,
              error: err.message
            }),
          });
        }
      };

      // Événements : change + drag&drop
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
      // En cas d’erreur fatale, on complète quand même pour ne pas bloquer le flow
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
