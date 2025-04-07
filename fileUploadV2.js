// Extension d'upload de fichiers avec métadonnées et boutons pour Voiceflow
// Version corrigée pour résoudre l'erreur de propriété 'name' undefined

export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    // Vérification rigoureuse de l'existence des propriétés avant d'y accéder
    if (!trace) return false;
    
    // Vérifier si trace.type existe et contient 'ext_fileUpload'
    const matchesType = trace.type === 'ext_fileUpload';
    
    // Vérifier si trace.payload existe et si trace.payload.name existe et contient 'ext_fileUpload'
    const matchesPayloadName = trace.payload && 
                               typeof trace.payload === 'object' && 
                               trace.payload.name === 'ext_fileUpload';
    
    return matchesType || matchesPayloadName;
  },
  render: ({ trace, element }) => {
    if (!trace || !element) {
      console.error("Les paramètres trace ou element sont manquants");
      return;
    }
    
    // Récupérer les métadonnées et les boutons du payload s'ils existent
    const payload = trace.payload || {};
    const metadata = payload.metadata || {};
    const buttons = payload.buttons || [
      { text: "Confirmer l'upload", path: "Continue" }
    ];
    const title = payload.title || "Upload de fichier";
    const description = payload.description || "Glissez-déposez votre fichier ici ou cliquez pour sélectionner";
    
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
    buttonsContainer.style.flexWrap = 'wrap';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.marginTop = '15px';
    
    // Indicateur de fichier uploadé
    let fileUploaded = false;
    
    // Ajouter les boutons
    buttons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.textContent = button.text || "Confirmer";
      buttonElement.style.padding = '8px 16px';
      buttonElement.style.borderRadius = '4px';
      buttonElement.style.backgroundColor = button.color || '#363534';
      buttonElement.style.color = button.textColor || '#FFFFFF';
      buttonElement.style.border = 'none';
      buttonElement.style.cursor = 'pointer';
      
      // Désactiver le bouton au départ
      buttonElement.disabled = true;
      buttonElement.style.opacity = '0.5';
      
      // Ajouter un événement pour le clic
      buttonElement.addEventListener('click', function() {
        // Récupérer l'URL du fichier
        const fileUrl = fileInfo.dataset.fileUrl || null;
        
        // Vérifier si voiceflow.chat est disponible
        if (window.voiceflow && window.voiceflow.chat) {
          // Signaler que l'interaction est terminée
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              file: fileUrl,
              metadata: metadata,
              buttonPath: button.path || "Continue",
              path: button.path || "Continue"
            },
          });
        } else {
          console.error("L'API Voiceflow n'est pas disponible");
        }
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
      
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload(fileInput.files[0]);
      }
    });
    
    // Gérer le changement de fichier
    fileInput.addEventListener('change', function() {
      if (fileInput.files && fileInput.files.length) {
        handleFileUpload(fileInput.files[0]);
      }
    });
    
    // Fonction pour gérer l'upload du fichier
    function handleFileUpload(file) {
      if (!file) {
        console.error("Aucun fichier sélectionné");
        return;
      }
      
      fileInfo.textContent = `Fichier: ${file.name}`;
      uploadBox.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
          <img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">
          <p>Téléversement en cours...</p>
        </div>
      `;
      
      // Préparer les données pour l'upload
      var data = new FormData();
      data.append('file', file);
      
      // Ajouter les métadonnées à la requête si disponible
      if (Object.keys(metadata).length > 0) {
        const metadataString = JSON.stringify(metadata);
        data.append('metadata', metadataString);
      }
      
      // Effectuer l'upload vers tmpfiles.org
      fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: data,
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Échec de l\'upload: ' + response.statusText);
        }
      })
      .then(result => {
        if (result && result.data && result.data.url) {
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
          
          // Marquer comme uploadé
          fileUploaded = true;
          
          // Activer tous les boutons
          buttonsContainer.querySelectorAll('button').forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
          });
          
          console.log('Fichier uploadé:', fileUrl);
        } else {
          throw new Error('Réponse du serveur invalide');
        }
      })
      .catch(error => {
        console.error("Erreur lors de l'upload:", error);
        uploadBox.innerHTML = `
          <div style="color: #D32F2F;">
            <p>Erreur durant l'upload</p>
            <p>${error.message || "Erreur inconnue"}</p>
            <p>Cliquez pour réessayer</p>
          </div>
        `;
        
        // Réactiver la zone de drop pour permettre une nouvelle tentative
        uploadBox.addEventListener('click', function() {
          fileInput.click();
        });
      });
    }
    
    element.appendChild(fileUploadContainer);
  },
};
