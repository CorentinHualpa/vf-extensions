export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    console.log('Checking match for file_upload', trace);
    return trace.payload?.name === 'file_upload';
  },
  render: ({ trace, element }) => {
    try {
      console.log('FileUpload extension render', trace);

      const uniqueId = 'fileUpload_' + Date.now();
      const container = document.createElement('div');
      container.innerHTML = `
        <!-- tes styles ici -->
        <div class="upload-container">
          <input type="file" id="${uniqueId}" class="upload-input" multiple>
          <label for="${uniqueId}">Cliquer pour téléverser ou glisser-déposer</label>
        </div>
        <div class="status-container"></div>
      `;
      element.appendChild(container);

      const uploadInput     = container.querySelector('.upload-input');
      const statusContainer = container.querySelector('.status-container');
      const uploadContainer = container.querySelector('.upload-container');
      const showStatus = (msg, type) => {
        statusContainer.textContent = msg;
        statusContainer.className = 'status-container ' + type;
        statusContainer.style.display = 'block';
      };

      const handleUpload = async (files) => {
        if (!files.length) return;
        showStatus(`Téléversement de ${files.length} fichier(s)…`, 'loading');

        const form = new FormData();
        Array.from(files).forEach(f => form.append('files', f));
        try {
          const res  = await fetch('https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/', {
            method: 'POST', body: form
          });
          const json = await res.json();
          console.log('Upload response:', json);

          if (!res.ok || !Array.isArray(json.urls) || !json.urls.length) {
            throw new Error(json.detail || 'Aucune URL');
          }

          showStatus(`Succès : ${json.urls.length} fichier(s) !`, 'success');
          uploadContainer.style.pointerEvents = 'none';
          uploadContainer.style.opacity       = '0.7';

          // ————————> Envoi objet pur, pas stringifié
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              success: true,
              urls: json.urls
            }
          });
        } catch (err) {
          console.error('Upload error:', err);
          showStatus(`Erreur : ${err.message}`, 'error');

          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              success: false,
              error: err.message
            }
          });
        }
      };

      uploadInput.addEventListener('change', e => handleUpload(e.target.files));
      ['dragenter','dragover'].forEach(ev =>
        uploadContainer.addEventListener(ev, e => {
          e.preventDefault(); e.stopPropagation();
          uploadContainer.style.borderColor = '#2e7ff1';
        })
      );
      ['dragleave','drop'].forEach(ev =>
        uploadContainer.addEventListener(ev, e => {
          e.preventDefault(); e.stopPropagation();
          uploadContainer.style.borderColor = '#ccc';
          if (ev === 'drop') handleUpload(e.dataTransfer.files);
        })
      );
    } catch (e) {
      console.error('Error in FileUpload render:', e);
      // on peut envoyer un complete minimal si nécessaire
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { success: false, error: 'Extension failed' }
      });
    }
  },
};
