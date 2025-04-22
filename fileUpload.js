export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    console.log('Checking match for file_upload', trace);
    return trace.payload && trace.payload.name === 'file_upload';
  },
  render: ({ trace, element }) => {
    try {
      console.log('FileUpload extension render', trace);

      // Génération d'un ID unique pour l'input
      const uniqueId = 'fileUpload_' + Date.now();
      console.log(`File upload id: ${uniqueId}`);

      // Création du container HTML + styles
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          .upload-container {
            padding: 20px;
            border: 2px dashed #ccc;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 20px;
            cursor: pointer;
            transition: border-color .3s ease;
          }
          .upload-container:hover {
            border-color: #2e7ff1;
          }
          .upload-input {
            display: none;
          }
          .upload-label {
            display: block;
            margin-bottom: 10px;
            color: #666;
          }
          .status-container {
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            display: none;
          }
          .status-container.loading {
            background-color: #2196F3;
            color: white;
          }
          .status-container.success {
            background-color: #4CAF50;
            color: white;
          }
          .status-container.error {
            background-color: #f44336;
            color: white;
          }
          .file-link {
            color: white;
            text-decoration: underline;
            word-break: break-all;
          }
        </style>
        <div class="upload-container">
          <input type="file" class="upload-input" id="${uniqueId}" multiple>
          <label for="${uniqueId}" class="upload-label">
            Cliquer pour téléverser ou glisser-déposer des fichiers
          </label>
        </div>
        <div class="status-container"></div>
      `;
      element.appendChild(container);

      const uploadInput     = container.querySelector('.upload-input');
      const uploadContainer = container.querySelector('.upload-container');
      const statusContainer = container.querySelector('.status-container');

      const showStatus = (message, type) => {
        statusContainer.textContent = message;
        statusContainer.className = 'status-container ' + type;
        statusContainer.style.display = 'block';
      };

      const handleUpload = async (files) => {
        if (!files || files.length === 0) return;

        showStatus(`Téléversement de ${files.length} fichier(s) en cours…`, 'loading');

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        try {
          const response = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: formData }
          );
          const data = await response.json();
          console.log('Upload response:', data);

          if (response.ok && Array.isArray(data.urls) && data.urls.length > 0) {
            showStatus(`Téléversement réussi de ${data.urls.length} fichier(s)!`, 'success');
            uploadContainer.style.pointerEvents = 'none';
            uploadContainer.style.opacity       = '0.7';

            // Envoi du payload stringifié pour être récupéré par le JS step dans Voiceflow
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: JSON.stringify({
                success: true,
                urls: data.urls
              }),
            });
          } else {
            throw new Error(data.detail || 'Aucune URL retournée par le serveur');
          }
        } catch (error) {
          console.error('Upload error:', error);
          showStatus(`Erreur : ${error.message}`, 'error');

          window.voiceflow.chat.interact({
            type: 'complete',
            payload: JSON.stringify({
              success: false,
              error: error.message
            }),
          });
        }
      };

      // Événements de sélection et drag & drop
      uploadInput.addEventListener('change', e => handleUpload(e.target.files));
      ['dragenter','dragover'].forEach(evt =>
        uploadContainer.addEventListener(evt, e => {
          e.preventDefault(); e.stopPropagation();
          uploadContainer.style.borderColor = '#2e7ff1';
        })
      );
      ['dragleave','drop'].forEach(evt =>
        uploadContainer.addEventListener(evt, e => {
          e.preventDefault(); e.stopPropagation();
          uploadContainer.style.borderColor = '#ccc';
          if (evt === 'drop') handleUpload(e.dataTransfer.files);
        })
      );

    } catch (err) {
      console.error('Error in FileUpload render:', err);
      // Si besoin de signaler une erreur et terminer le flow
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
