export const KBUploadExtension = {
  name: 'KBUpload',
  type: 'response',
  match: function(context) {
    try {
      return (context && 
              context.trace && 
              (context.trace.type === 'ext_KBUpload' || 
               (context.trace.payload && context.trace.payload.name === 'ext_KBUpload')));
    } catch (error) {
      console.error("Erreur dans la fonction match:", error);
      return false;
    }
  },
  render: function(context) {
    try {
      // Récupérer les éléments nécessaires
      const trace = context.trace || {};
      const element = context.element;
      
      if (!element) {
        console.error("Élément parent manquant");
        return;
      }
      
      // Extraction des paramètres depuis le payload avec vérifications
      const payload = trace.payload || {};
      const apiKey = payload.apiKey || null;
      const maxChunkSize = payload.maxChunkSize || 1000;
      const overwrite = payload.overwrite || false;
      const filters = payload.filters || {};
      const backgroundImage = payload.backgroundImage || null; // URL de l'image de fond
      const buttons = payload.buttons || []; // Tableau de boutons personnalisés
      
      // Si pas d'API key, on ne peut pas continuer
      if (!apiKey) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `<p style="color: red">Erreur: Clé API manquante</p>`;
        element.appendChild(errorDiv);
        
        // On permet à l'utilisateur de continuer malgré l'erreur
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            uploadSuccess: false,
            documentId: '',
            error: 'API key missing'
          }
        });
        return;
      }
      
      // Interface utilisateur avec support pour image de fond
      const container = document.createElement('div');
      
      // Créer le HTML pour l'interface
      container.innerHTML = `
        <style>
          .kb-upload-container {
            position: relative;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            overflow: hidden;
          }
          
          .kb-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            background-color: rgba(240, 240, 240, 0.3);
            ${backgroundImage ? `background-image: url('${backgroundImage}');` : ''}
            background-size: cover;
            background-position: center;
            opacity: 0.15;
            border-radius: 10px;
          }
          
          .kb-content {
            position: relative;
            z-index: 1;
          }
          
          .kb-title {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
            font-weight: 600;
          }
          
          .upload-zone {
            border: 2px dashed #2E6EE1;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            margin-bottom: 15px;
            background-color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease;
          }
          
          .upload-zone:hover {
            background-color: rgba(255, 255, 255, 0.9);
            border-color: #1E5ECA;
          }
          
          .upload-status {
            margin-top: 10px;
            min-height: 40px;
            background-color: rgba(255, 255, 255, 0.7);
            padding: 8px;
            border-radius: 5px;
          }
          
          .kb-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          
          .kb-button {
            padding: 8px 16px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            opacity: 0.8;
            transition: all 0.2s ease;
          }
          
          .kb-button:hover {
            opacity: 1;
            transform: translateY(-2px);
          }
          
          .kb-button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
        </style>
        
        <div class="kb-upload-container">
          <div class="kb-background"></div>
          <div class="kb-content">
            <h3 class="kb-title">${payload.title || "Téléverser un document vers la base de connaissances"}</h3>
            <div class="upload-zone">${payload.description || "Glissez-déposez votre fichier ici ou cliquez pour sélectionner"}</div>
            <div class="upload-status"></div>
            
            <div class="kb-buttons">
              ${buttons.map(btn => `
                <button class="kb-button back-button" 
                  style="background-color: ${btn.color || '#F44336'}; color: ${btn.textColor || '#FFFFFF'}"
                  data-path="${btn.path || 'Cancel'}">
                  ${btn.text || 'Retour'}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        
        <input type="file" style="display: none;" accept=".pdf,.doc,.docx,.txt,.text">
      `;
      
      // Récupérer les éléments du DOM
      const uploadZone = container.querySelector('.upload-zone');
      const statusDiv = container.querySelector('.upload-status');
      const fileInput = container.querySelector('input[type="file"]');
      const backButtons = container.querySelectorAll('.back-button');
      
      // Désactiver les boutons jusqu'à ce qu'ils soient nécessaires
      backButtons.forEach(btn => {
        btn.disabled = buttons.length === 0; // Activer uniquement si des boutons sont définis
        
        // Ajouter des gestionnaires d'événements aux boutons
        btn.addEventListener('click', function() {
          const path = this.getAttribute('data-path') || 'Cancel';
          
          // Notifier Voiceflow
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              uploadSuccess: false,
              documentId: '',
              path: path,
              buttonPath: path
            }
          });
        });
      });
      
      // Gérer le clic sur la zone de téléchargement
      uploadZone.addEventListener('click', function() {
        fileInput.click();
      });
      
      // Gérer le drag & drop
      uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadZone.style.backgroundColor = 'rgba(230, 240, 255, 0.9)';
      });
      
      uploadZone.addEventListener('dragleave', function() {
        uploadZone.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      });
      
      uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadZone.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          uploadFile(fileInput.files[0]);
        }
      });
      
      // Gérer la sélection de fichier
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files.length > 0) {
          uploadFile(fileInput.files[0]);
        }
      });
      
      // Fonction d'upload
      function uploadFile(file) {
        if (!file) return;
        
        // Formater la taille du fichier
        function formatFileSize(bytes) {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // Afficher le statut
        statusDiv.innerHTML = `<p>Téléversement en cours: ${file.name} (${formatFileSize(file.size)})...</p>`;
        uploadZone.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">`;
        
        // Désactiver les boutons pendant l'upload
        backButtons.forEach(btn => {
          btn.disabled = true;
        });
        
        // Préparer les données pour l'upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Ajouter les métadonnées (filtres)
        if (Object.keys(filters).length > 0) {
          formData.append('metadata', JSON.stringify(filters));
        }
        
        // Effectuer la requête
        fetch(`https://api.voiceflow.com/v1/knowledge-base/docs/upload?overwrite=${overwrite}&maxChunkSize=${maxChunkSize}`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Accept': 'application/json'
          },
          body: formData
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          // Succès
          const documentId = data.data?.documentID || '';
          
          // Mise à jour de l'interface
          statusDiv.innerHTML = `<p style="color: green">✓ Document téléversé avec succès!</p>`;
          uploadZone.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif" alt="Done" width="50" height="50">`;
          
          // Réactiver les boutons
          backButtons.forEach(btn => {
            btn.disabled = false;
          });
          
          // Notifier Voiceflow
          setTimeout(() => {
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                uploadSuccess: true,
                documentId: documentId,
                path: "Confirm_Upload"
              }
            });
          }, 1500);
        })
        .catch(error => {
          console.error("Erreur lors du téléversement:", error);
          
          // Mise à jour de l'interface
          statusDiv.innerHTML = `<p style="color: red">Erreur: ${error.message}</p>`;
          uploadZone.innerHTML = payload.description || "Cliquez pour réessayer";
          
          // Réactiver les boutons
          backButtons.forEach(btn => {
            btn.disabled = false;
          });
          
          // Notifier Voiceflow de l'échec
          setTimeout(() => {
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                uploadSuccess: false,
                documentId: '',
                error: error.message,
                path: "Cancel"
              }
            });
          }, 1500);
        });
      }
      
      // Ajouter le conteneur au DOM
      element.appendChild(container);
      
    } catch (error) {
      console.error("Erreur dans le rendu de l'extension:", error);
      
      // Créer un message d'erreur visible
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `<p style="color: red">Erreur lors du chargement de l'extension: ${error.message}</p>`;
      
      // Ajouter au DOM si possible
      if (context && context.element) {
        context.element.appendChild(errorDiv);
      }
      
      // Permettre de continuer malgré l'erreur
      if (window.voiceflow && window.voiceflow.chat) {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            uploadSuccess: false,
            documentId: '',
            error: error.message
          }
        });
      }
    }
  }
};
