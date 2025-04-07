export const KBUploadExtension = {
  name: 'KBUpload',
  type: 'response',
  match: function(context) {
    // Simplification maximal de la logique match
    try {
      return (context && 
              context.trace && 
              (context.trace.type === 'ext_KBUpload' || 
               (context.trace.payload && context.trace.payload.name === 'ext_KBUpload')));
    } catch (error) {
      // En cas d'erreur, on renvoie false pour éviter un crash
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
      
      // Interface utilisateur minimaliste mais fonctionnelle
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          .upload-zone {
            border: 2px dashed #2E6EE1;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            margin-bottom: 15px;
          }
          .upload-status {
            margin-top: 10px;
            min-height: 40px;
          }
        </style>
        <h3>${payload.title || "Téléverser un document"}</h3>
        <div class="upload-zone">${payload.description || "Glissez-déposez votre fichier ici ou cliquez pour téléverser"}</div>
        <div class="upload-status"></div>
        <input type="file" style="display: none;" accept=".pdf,.doc,.docx,.txt,.text">
      `;
      
      const uploadZone = container.querySelector('.upload-zone');
      const statusDiv = container.querySelector('.upload-status');
      const fileInput = container.querySelector('input[type="file"]');
      
      // Gérer le clic sur la zone de téléchargement
      uploadZone.addEventListener('click', function() {
        fileInput.click();
      });
      
      // Gérer le drag & drop
      uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadZone.style.backgroundColor = '#f0f8ff';
      });
      
      uploadZone.addEventListener('dragleave', function() {
        uploadZone.style.backgroundColor = '';
      });
      
      uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadZone.style.backgroundColor = '';
        
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
        
        // Afficher le statut
        statusDiv.innerHTML = `<p>Téléversement en cours: ${file.name}...</p>`;
        uploadZone.innerHTML = `<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="50" height="50">`;
        
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
