// Extension d'upload de fichiers vers la Voiceflow Knowledge Base
export const KBUpload = {
  name: 'KBUpload',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_KBUpload' || trace.payload.name === 'ext_KBUpload',
  render: ({ trace, element }) => {
    // Récupération des paramètres depuis le payload
    const apiKey = trace.payload.apiKey || null;
    const maxChunkSize = trace.payload.maxChunkSize || 1000;
    const overwrite = trace.payload.overwrite || false;
    const title = trace.payload.title || "Téléverser un document";
    const description = trace.payload.description || "Glissez-déposez votre fichier ici ou cliquez pour sélectionner";
    const filters = trace.payload.filters || null;
    const buttons = trace.payload.buttons || [
      { text: "Continuer", path: "Continue" }
    ];
    
    // Vérification de la présence de l'API key
    if (!apiKey) {
      console.error("Clé API Voiceflow manquante");
      return;
    }
    
    // Création du conteneur principal
    const kbfileUploadContainer = document.createElement('div');
    kbfileUploadContainer.style.display = 'flex';
    kbfileUploadContainer.style.flexDirection = 'column';
    kbfileUploadContainer.style.gap = '15px';
    kbfileUploadContainer.style.width = '100%';
    
    // Titre
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.margin = '0 0 10px 0';
    kbfileUploadContainer.appendChild(titleElement);
    
    // Styles pour l'extension
    const style = document.createElement('style');
    style.textContent = `
      .kb-upload-box {
        border: 2px dashed rgba(46, 110, 225, 0.3);
        padding: 20px;
        text-align: center;
        cursor: pointer;
        border-radius: 8px;
        background-color: rgba(240, 240, 240, 0.3);
        transition: background-color 0.3s ease;
      }
      .kb-upload-box:hover {
        background-color: rgba(200, 220, 255, 0.4);
      }
      .kb-file-info {
        margin-top: 10px;
        font-size: 14px;
      }
      .kb-progress-container {
        width: 100%;
        margin-top: 15px;
        display: none;
      }
      .kb-progress-bar {
        height: 8px;
        background-color: #E0E0E0;
        border-radius: 4px;
        overflow: hidden;
      }
      .kb-progress-fill {
        width: 0%;
        height: 100%;
        background-color: #4CAF50;
        transition: width 0.3s ease;
      }
      .kb-progress-text {
        font-size: 12px;
        margin-top: 5px;
        color: #666;
      }
      .kb-buttons-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 15px;
      }
      .kb-button {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        opacity: 0.5;
      }
      .kb-button:disabled {
        cursor: not-allowed;
      }
      .kb-button:not(:disabled) {
        opacity: 1;
      }
    `;
    kbfileUploadContainer.appendChild(style);
    
    // Zone d'upload
    const uploadBox = document.createElement('div');
    uploadBox.className = 'kb-upload-box';
    uploadBox.innerHTML = `<p>${description}</p>`;
    kbfileUploadContainer.appendChild(uploadBox);
    
    // Input file caché
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.text,.pdf,.docx';
    fileInput.style.display = 'none';
    kbfileUploadContainer.appendChild(fileInput);
    
    // Div pour les informations du fichier
    const fileInfo = document.createElement('div');
    fileInfo.className = 'kb-file-info';
    kbfileUploadContainer.appendChild(fileInfo);
    
    // Conteneur pour la barre de progression
    const progressContainer = document.createElement('div');
    progressContainer.className = 'kb-progress-container';
    
    // Barre de progression
    const progressBar = document.createElement('div');
    progressBar.className = 'kb-progress-bar';
    
    // Partie remplie de la barre de progression
    const progressFill = document.createElement('div');
    progressFill.className = 'kb-progress-fill';
    progressBar.appendChild(progressFill);
    
    // Texte de progression
    const progressText = document.createElement('div');
    progressText.className = 'kb-progress-text';
    progressText.textContent = 'En attente...';
    
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);
    kbfileUploadContainer.appendChild(progressContainer);
    
    // Conteneur pour les boutons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'kb-buttons-container';
    
    // Variable de suivi
    let documentId = '';
    let uploadSuccess = false;
    
    // Création des boutons
    buttons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.className = 'kb-button';
      buttonElement.textContent = button.text || "Continuer";
      buttonElement.style.backgroundColor = button.color || '#363534';
      buttonElement.style.color = button.textColor || '#FFFFFF';
      
      // Désactiver le bouton au départ
      buttonElement.disabled = true;
      
      // Ajouter l'événement click
      buttonElement.addEventListener('click', function() {
        if (window.voiceflow && window.voiceflow.chat) {
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              documentId: documentId,
              uploadSuccess: uploadSuccess,
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
    
    kbfileUploadContainer.appendChild(buttonsContainer);
    
    // Fonction pour mettre à jour la barre de progression
    function updateProgress(percent, message) {
      progressContainer.style.display = 'block';
      progressFill.style.width = `${percent}%`;
      progressText.textContent = message;
    }
    
    // Fonction pour activer les boutons
    function enableButtons() {
      buttonsContainer.querySelectorAll('button').forEach(button => {
        button.disabled = false;
      });
    }
    
    // Fonction pour formater la taille du fichier
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Gestionnaire d'événement pour le clic sur la zone de drop
    uploadBox.addEventListener('click', function() {
      fileInput.click();
    });
    
    // Gestion du drag & drop
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
    
    // Gestion du changement de fichier
    fileInput.addEventListener('change', function() {
      if (fileInput.files && fileInput.files.length) {
        handleFileUpload(fileInput.files[0]);
      }
    });
    
    // Fonction pour gérer le téléversement du fichier
    function handleFileUpload(file) {
      if (!file) {
        console.error("Aucun fichier sélectionné");
        return;
      }
      
      // Afficher les informations du fichier
      fileInfo.textContent = `Fichier: ${file.name} (${formatFileSize(file.size)})`;
      
      // Mettre à jour l'interface
      uploadBox.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
          <img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">
          <p>Téléversement en cours...</p>
        </div>
      `;
      
      // Afficher la barre de progression
      updateProgress(0, "Initialisation de l'upload...");
      
      // Préparer les données pour l'upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Ajouter les filtres comme métadonnées si présents
      if (filters && typeof filters === 'object') {
        try {
          const metadataString = JSON.stringify(filters);
          formData.append('metadata', metadataString);
          console.log("Métadonnées ajoutées:", metadataString);
        } catch (error) {
          console.error("Erreur lors de la conversion des filtres en métadonnées:", error);
        }
      }
      
      // Utiliser XMLHttpRequest pour suivre la progression
      const xhr = new XMLHttpRequest();
      
      // Suivi de la progression
      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          updateProgress(percentComplete, `Téléversement en cours: ${percentComplete}%`);
        }
      });
      
      // URL de l'API (version 1)
      const apiUrl = `https://api.voiceflow.com/v1/knowledge-base/docs/upload?overwrite=${overwrite}&maxChunkSize=${maxChunkSize}`;
      
      // Configuration de la requête
      xhr.open('POST', apiUrl, true);
      xhr.setRequestHeader('Authorization', apiKey);
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Gestion de la fin de la requête
      xhr.onload = function() {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              let responseData = null;
              
              // Vérifier si la réponse contient du JSON valide
              try {
                if (xhr.responseText) {
                  responseData = JSON.parse(xhr.responseText);
                  console.log("Réponse API:", responseData);
                } else {
                  console.warn("Réponse vide du serveur");
                }
              } catch (parseError) {
                console.error("Erreur de parsing JSON:", parseError, "Réponse brute:", xhr.responseText);
                throw new Error("Réponse du serveur non valide");
              }
              
              // Vérifier si la réponse contient l'ID du document
              if (responseData && responseData.data && responseData.data.documentID) {
                documentId = responseData.data.documentID;
                uploadSuccess = true;
                
                // Mise à jour de l'interface
                updateProgress(100, "✅ Téléversement terminé!");
                uploadBox.innerHTML = `
                  <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
                    <img src="https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif" alt="Done" width="50" height="50">
                    <p>Document téléversé avec succès!</p>
                    <p style="font-size: 12px; margin-top: 8px;">ID du document: ${documentId}</p>
                  </div>
                `;
                
                // Activer les boutons
                enableButtons();
              } else {
                throw new Error("ID de document non trouvé dans la réponse");
              }
            } catch (error) {
              handleUploadError("Erreur lors du traitement de la réponse: " + error.message);
            }
          } else {
            // Gérer les erreurs HTTP
            let errorMessage = `Erreur ${xhr.status}: ${xhr.statusText}`;
            
            try {
              if (xhr.responseText) {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse && errorResponse.message) {
                  errorMessage = errorResponse.message;
                }
              }
            } catch (e) {
              // Si le parsing échoue, utiliser le message d'erreur par défaut
            }
            
            handleUploadError(errorMessage);
          }
        } catch (error) {
          handleUploadError("Une erreur critique est survenue: " + error.message);
        }
      };
      
      // Gestion des erreurs réseau
      xhr.onerror = function() {
        handleUploadError("Erreur de connexion, veuillez vérifier votre connexion internet");
      };
      
      // Gestion des timeouts
      xhr.ontimeout = function() {
        handleUploadError("La requête a expiré. Veuillez réessayer.");
      };
      
      // Fonction pour gérer les erreurs d'upload
      function handleUploadError(errorMessage) {
        console.error("Erreur d'upload:", errorMessage);
        updateProgress(0, "Échec du téléversement");
        uploadBox.innerHTML = `
          <div style="color: #D32F2F; padding: 10px;">
            <p>Erreur durant le téléversement</p>
            <p>${errorMessage || "Erreur inconnue"}</p>
            <p>Cliquez pour réessayer</p>
          </div>
        `;
        
        // Réactiver la zone de drop pour permettre une nouvelle tentative
        uploadBox.addEventListener('click', function() {
          fileInput.click();
        });
        
        // Permettre de continuer malgré l'erreur
        uploadSuccess = false;
        enableButtons();
      }
      
      // Envoi de la requête
      try {
        xhr.send(formData);
      } catch (error) {
        handleUploadError("Erreur lors de l'envoi de la requête: " + error.message);
      }
    }
    
    // Ajouter le conteneur à l'élément parent
    element.appendChild(kbfileUploadContainer);
  }
};
