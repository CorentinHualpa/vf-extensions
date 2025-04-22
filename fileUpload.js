export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    // Standardisation du match pour être cohérent avec les autres extensions
    return (
      trace.type === 'ext_fileUpload' ||
      trace.payload?.name === 'ext_fileUpload' ||
      trace.payload?.name === 'file_upload'
    );
  },
  render: ({ trace, element }) => {
    try {
      console.log('FileUpload extension render');

      // Generate unique ID for this instance
      const uniqueId = 'fileUpload_' + Date.now();
      console.log(`File upload id: ${uniqueId}`);

      // Extraction des paramètres du payload avec des valeurs par défaut
      const {
        maxSize = 100, // En Mo
        acceptedTypes = '*', // ex: '.pdf,.docx,image/*'
        buttonText = 'Cliquer pour téléverser ou glisser-déposer des fichiers',
        multiple = true
      } = trace.payload || {};

      const container = document.createElement('div');
      container.classList.add('file-upload-extension-container');
      
      container.innerHTML = `
        <style>
          .file-upload-extension-container {
            width: 100%;
            box-sizing: border-box;
          }
          .upload-container {
            padding: 20px;
            border: 2px dashed #ccc;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 20px;
            cursor: pointer;
            transition: border-color 0.3s ease;
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
          .success {
            background-color: #4CAF50;
            color: white;
          }
          .error {
            background-color: #f44336;
            color: white;
          }
          .loading {
            background-color: #2196F3;
            color: white;
          }
          .file-link {
            color: white;
            text-decoration: underline;
            word-break: break-all;
          }
          .file-preview {
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
          }
          .file-item {
            display: flex;
            align-items: center;
            padding: 5px;
            border-bottom: 1px solid #eee;
          }
          .file-name {
            flex-grow: 1;
            margin-right: 10px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }
        </style>
        <div class="upload-container">
          <input type="file" class="upload-input" id="${uniqueId}" ${multiple ? 'multiple' : ''} accept="${acceptedTypes}">
          <label for="${uniqueId}" class="upload-label">
            ${buttonText}
          </label>
          <div class="file-preview"></div>
        </div>
        <div class="status-container"></div>
      `;

      const uploadInput    = container.querySelector('.upload-input');
      const statusContainer = container.querySelector('.status-container');
      const uploadContainer = container.querySelector('.upload-container');
      const filePreview     = container.querySelector('.file-preview');

      const showStatus = (message, type) => {
        statusContainer.textContent = message;
        statusContainer.className = 'status-container ' + type;
        statusContainer.style.display = 'block';
      };

      const handleUpload = async (files) => {
        if (!files || files.length === 0) return;

        // Vérifier la taille des fichiers
        let totalSize = 0;
        const fileList = Array.from(files);
        for (const file of fileList) {
          totalSize += file.size;
          if (file.size > maxSize * 1024 * 1024) {
            showStatus(`Le fichier ${file.name} dépasse la limite de taille de ${maxSize}Mo`, 'error');
            return;
          }
        }

        // Afficher les fichiers sélectionnés
        filePreview.innerHTML = '';
        fileList.forEach(file => {
          const fileSize = (file.size / (1024 * 1024)).toFixed(2);
          const fileItem = document.createElement('div');
          fileItem.classList.add('file-item');
          fileItem.innerHTML = `
            <div class="file-name">${file.name}</div>
            <div class="file-size">${fileSize}MB</div>
          `;
          filePreview.appendChild(fileItem);
        });

        showStatus(`Téléversement de ${files.length} fichier(s) en cours…`, 'loading');

        const formData = new FormData();
        fileList.forEach(file => formData.append('files', file));

        try {
          const response = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: formData }
          );
          const data = await response.json();
          console.log('Upload response:', data);

          if (response.ok && Array.isArray(data.urls) && data.urls.length > 0) {
            const fileCount = data.urls.length;

            // Succès visuel
            statusContainer.innerHTML = `<div>Téléversement réussi de ${fileCount} fichier(s) !</div>`;
            statusContainer.className = 'status-container success';
            uploadContainer.style.pointerEvents = 'none';
            uploadContainer.style.opacity = '0.7';

            // Envoi d'un objet payload valide
            setTimeout(() => {
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  success: true,
                  urls: data.urls
                }
              });
            }, 500);

          } else {
            throw new Error(data.detail || 'Aucune URL retournée par le serveur');
          }
        } catch (error) {
          console.error('Upload error:', error);
          showStatus(`Erreur : ${error.message}`, 'error');

          setTimeout(() => {
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                success: false,
                error: error.message
              }
            });
          }, 1000);
        }
      };

      // Événements
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

      element.appendChild(container);

      // Cleanup
      return () => {
        uploadInput.removeEventListener('change', handleUpload);
      };
      
    } catch (error) {
      console.error('Error in FileUpload render:', error);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          success: false,
          error: 'Erreur interne de l\'extension FileUpload'
        }
      });
    }
  }
};
