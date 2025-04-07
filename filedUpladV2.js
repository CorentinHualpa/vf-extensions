export const FileUploadExtension = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_fileUpload' || trace.payload.name === 'ext_fileUpload',
  render: ({ trace, element }) => {
    // Récupérer les métadonnées et les boutons du payload s'ils existent
    const metadata = trace.payload?.metadata || {};
    const buttons = trace.payload?.buttons || [
      { text: "Continuer", path: "Continue" }
    ];
    const title = trace.payload?.title || "Upload de fichier";
    const description = trace.payload?.description || "Drag and drop a file here or click to upload";
    
    // Créer le conteneur pour l'upload
    const fileUploadContainer = document.createElement('div');
    fileUploadContainer.style.display = 'flex';
    fileUploadContainer.style.flexDirection = 'column';
    fileUploadContainer.style.gap = '15px';
    
    // Ajouter un titre si présent
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.margin = '0 0 10px 0';
    fileUploadContainer.appendChild(titleElement);
    
    // Zone d'upload
    const uploadBox = document.createElement('div');
    uploadBox.className = 'my-file-upload';
    uploadBox.style.border = '2px dashed rgba(46, 110, 225, 0.3)';
    uploadBox.style.padding = '20px';
    uploadBox.style.textAlign = 'center';
    uploadBox.style.cursor = 'pointer';
    uploadBox.style.borderRadius = '8px';
    uploadBox.style.backgroundColor = 'rgba(240, 240, 240, 0.3)';
    uploadBox.innerHTML = `<p>${description}</p>`;
    fileUploadContainer.appendChild(uploadBox);
    
    // Input file caché
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileUploadContainer.appendChild(fileInput);
    
    // Div pour afficher le nom du fichier sélectionné
    const fileInfo = document.createElement('div');
    fileInfo.style.marginTop = '10px';
    fileInfo.style.fontSize = '14px';
    fileUploadContainer.appendChild(fileInfo);
    
    // Conteneur pour les boutons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.marginTop = '15px';
    
    // Ajouter les boutons
    buttons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.textContent = button.text;
      buttonElement.style.padding = '8px 16px';
      buttonElement.style.borderRadius = '4px';
      buttonElement.style.backgroundColor = button.color || '#363534';
      buttonElement.style.color = button.textColor || '#FFFFFF';
      buttonElement.style.border = 'none';
      buttonElement.style.cursor = 'pointer';
      
      // Si l'upload n'est pas terminé, désactiver le bouton
      buttonElement.disabled = true;
      buttonElement.style.opacity = '0.5';
      
      // Ajouter un événement pour le clic (sera activé après l'upload)
      buttonElement.addEventListener('click', function() {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            file: fileInfo.dataset.fileUrl || null,
            metadata: metadata,
            buttonPath: button.path,
            path: button.path
          },
        });
      });
      
      buttonsContainer.appendChild(buttonElement);
    });
    
    fileUploadContainer.appendChild(buttonsContainer);
    
    // Gérer le clic sur la zone de drop
    uploadBox.addEventListener('click', function() {
      fileInput.click();
    });
    
    // Gérer le drag & drop
    uploadBox.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadBox.style.backgroundColor = 'rgba(200, 220, 255, 0.4)';
    });
    
    uploadBox.addEventListener('dragleave', function() {
      uploadBox.style.backgroundColor = 'rgba(240, 240, 240, 0.3)';
    });
    
    uploadBox.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadBox.style.backgroundColor = 'rgba(240, 240, 240, 0.3)';
      
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload(fileInput.files[0]);
      }
    });
    
    // Gérer le changement de fichier
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length) {
        handleFileUpload(fileInput.files[0]);
      }
    });
    
    // Fonction pour gérer l'upload du fichier
    function handleFileUpload(file) {
      fileInfo.textContent = `Fichier: ${file.name}`;
      uploadBox.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
          <img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">
          <p>Uploading...</p>
        </div>
      `;
      
      // Préparer les données pour l'upload
      var data = new FormData();
      data.append('file', file);
      
      // Ajouter les métadonnées à la requête si disponible pour Voiceflow API
      if (Object.keys(metadata).length > 0) {
        const metadataString = JSON.stringify(metadata);
        data.append('metadata', metadataString);
      }
      
      // Effectuer l'upload (ici vers tmpfiles.org, mais peut être remplacé par l'API Voiceflow)
      fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: data,
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Upload failed: ' + response.statusText);
        }
      })
      .then(result => {
        // URL du fichier uploadé
        const fileUrl = result.data.url.replace(
          'https://tmpfiles.org/',
          'https://tmpfiles.org/dl/'
        );
        
        // Mettre à jour l'interface
        uploadBox.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
            <img src="https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif" alt="Done" width="50" height="50">
            <p>Upload terminé!</p>
          </div>
        `;
        
        // Stocker l'URL pour les boutons
        fileInfo.dataset.fileUrl = fileUrl;
        fileInfo.innerHTML = `<a href="${fileUrl}" target="_blank" style="color: #2E6EE1;">${file.name}</a>`;
        
        // Activer tous les boutons
        buttonsContainer.querySelectorAll('button').forEach(button => {
          button.disabled = false;
          button.style.opacity = '1';
        });
        
        console.log('File uploaded:', fileUrl);
      })
      .catch(error => {
        console.error(error);
        uploadBox.innerHTML = `
          <div style="color: #D32F2F;">
            <p>Erreur durant l'upload</p>
            <p>${error.message}</p>
          </div>
        `;
      });
    }
    
    element.appendChild(fileUploadContainer);
  },
};
