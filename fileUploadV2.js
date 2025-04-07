// Extension d'upload de fichiers avec intégration directe à l'API Voiceflow Knowledge Base
export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    // Vérification rigoureuse de l'existence des propriétés
    if (!trace) return false;
    
    // Vérifier si trace.type existe et contient 'ext_fileUpload'
    const matchesType = trace.type === 'ext_fileUpload';
    
    // Vérifier si trace.payload existe et si trace.payload.name existe
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
    
    // Récupérer les données du payload
    const payload = trace.payload || {};
    
    // API Key pour Voiceflow
    const apiKey = payload.apiKey || '';
    if (!apiKey) {
      console.error("Clé API Voiceflow non spécifiée");
    }
    
    // Metadonnées pour le tagging
    const metadata = payload.metadata || {};
    
    // Paramètres pour la requête de test
    const testParams = payload.testParams || {
      filters: {},
      question: "Synthèse du projet",
      chunkLimit: 2
    };
    
    // Temps entre les tests (en ms)
    const testInterval = payload.testInterval || 10000; // 10 secondes par défaut
    
    // Nombre maximal de chunks pour l'upload
    const maxChunkSize = payload.maxChunkSize || 1000;
    
    // Paramètres visuels
    const buttons = payload.buttons || [
      { text: "Confirmer l'upload", path: "Confirm_Upload" }
    ];
    const title = payload.title || "Upload de document vers Voiceflow";
    const description = payload.description || "Glissez-déposez votre fichier ici ou cliquez pour sélectionner";
    
    // Créer le conteneur principal
    const fileUploadContainer = document.createElement('div');
    fileUploadContainer.style.display = 'flex';
    fileUploadContainer.style.flexDirection = 'column';
    fileUploadContainer.style.gap = '15px';
    fileUploadContainer.style.width = '100%';
    
    // Titre
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.margin = '0 0 10px 0';
    fileUploadContainer.appendChild(titleElement);
    
    // Zone d'upload
    const uploadBox = document.createElement('div');
    uploadBox.className = 'upload-box';
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
    fileInput.accept = '.pdf,.doc,.docx,.txt,.text';
    fileInput.style.display = 'none';
    fileUploadContainer.appendChild(fileInput);
    
    // Div pour les informations du fichier
    const fileInfo = document.createElement('div');
    fileInfo.style.marginTop = '10px';
    fileInfo.style.fontSize = '14px';
    fileUploadContainer.appendChild(fileInfo);
    
    // Conteneur pour la barre de progression
    const progressContainer = document.createElement('div');
    progressContainer.style.display = 'none';
    progressContainer.style.width = '100%';
    progressContainer.style.marginTop = '15px';
    
    // Barre de progression
    const progressBar = document.createElement('div');
    progressBar.style.height = '8px';
    progressBar.style.backgroundColor = '#E0E0E0';
    progressBar.style.borderRadius = '4px';
    progressBar.style.overflow = 'hidden';
    progressContainer.appendChild(progressBar);
    
    // Partie remplie de la barre de progression
    const progressFill = document.createElement('div');
    progressFill.style.width = '0%';
    progressFill.style.height = '100%';
    progressFill.style.backgroundColor = '#4CAF50';
    progressFill.style.transition = 'width 0.3s ease';
    progressBar.appendChild(progressFill);
    
    // Texte de progression
    const progressText = document.createElement('div');
    progressText.style.fontSize = '12px';
    progressText.style.marginTop = '5px';
    progressText.style.color = '#666';
    progressText.textContent = 'En attente...';
    progressContainer.appendChild(progressText);
    
    fileUploadContainer.appendChild(progressContainer);
    
    // Conteneur pour le statut de vérification
    const verificationContainer = document.createElement('div');
    verificationContainer.style.display = 'none';
    verificationContainer.style.marginTop = '15px';
    verificationContainer.style.padding = '10px';
    verificationContainer.style.borderRadius = '4px';
    verificationContainer.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    verificationContainer.style.fontSize = '14px';
    fileUploadContainer.appendChild(verificationContainer);
    
    // Conteneur pour les boutons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexWrap = 'wrap';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.marginTop = '15px';
    
    // Variables de suivi
    let uploadComplete = false;
    let documentId = '';
    let verificationTimer = null;
    let verificationCount = 0;
    const maxVerificationAttempts = 10;
    
    // Créer les boutons
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
        // Arrêter la vérification si elle est en cours
        if (verificationTimer) {
          clearInterval(verificationTimer);
          verificationTimer = null;
        }
        
        // Signaler que l'interaction est terminée
        if (window.voiceflow && window.voiceflow.chat) {
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              documentId: documentId,
              metadata: metadata,
              uploadComplete: uploadComplete,
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
    
    // Fonction pour mettre à jour la barre de progression
    function updateProgress(percent, message) {
      progressContainer.style.display = 'block';
      progressFill.style.width = `${percent}%`;
      progressText.textContent = message;
    }
    
    // Fonction pour mettre à jour le statut de vérification
    function updateVerificationStatus(message, isSuccess, isError) {
      verificationContainer.style.display = 'block';
      verificationContainer.textContent = message;
      
      if (isSuccess) {
        verificationContainer.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        verificationContainer.style.color = '#2E7D32';
      } else if (isError) {
        verificationContainer.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        verificationContainer.style.color = '#C62828';
      } else {
        verificationContainer.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        verificationContainer.style.color = '#0277BD';
      }
    }
    
    // Fonction pour activer les boutons
    function enableButtons() {
      buttonsContainer.querySelectorAll('button').forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
      });
    }
    
    // Fonction pour vérifier si les données sont disponibles dans la Knowledge Base
    function verifyDataAvailability() {
      if (!apiKey || !documentId) {
        console.error("Impossible de vérifier les données: clé API ou ID de document manquant");
        return;
      }
      
      updateVerificationStatus(`Vérification de la disponibilité des données... (Tentative ${verificationCount + 1}/${maxVerificationAttempts})`, false, false);
      
      // Préparer les filtres pour la requête
      let filters = {};
      if (testParams.filters) {
        filters = testParams.filters;
      }
      
      // Envoyer une requête de test à l'API Voiceflow
      fetch('https://general-runtime.voiceflow.com/knowledge-base/query', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          chunkLimit: testParams.chunkLimit || 2,
          synthesis: false,
          filters: filters,
          question: testParams.question || "Synthèse du projet"
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Résultat de la vérification:", data);
        
        // Vérifier si la réponse contient des données utiles
        if (data && data.output && data.output.chunks && data.output.chunks.length > 0) {
          // Données disponibles!
          updateVerificationStatus("✅ Données disponibles dans la base de connaissances!", true, false);
          clearInterval(verificationTimer);
          verificationTimer = null;
          
          // Marquer comme complet
          uploadComplete = true;
          
          // Activer le bouton de confirmation
          const confirmButton = buttonsContainer.querySelector('button');
          if (confirmButton) {
            confirmButton.textContent = "✓ Confirmer l'upload";
            confirmButton.style.backgroundColor = "#4CAF50";
            confirmButton.click(); // Déclencher automatiquement le bouton de confirmation
          }
        } else {
          // Pas encore de données ou résultat vide
          verificationCount++;
          
          if (verificationCount >= maxVerificationAttempts) {
            updateVerificationStatus("⚠️ Délai d'attente dépassé. Les données pourraient ne pas être encore indexées.", false, true);
            clearInterval(verificationTimer);
            verificationTimer = null;
            enableButtons();
          } else {
            updateVerificationStatus(`Données en cours d'indexation... (Tentative ${verificationCount}/${maxVerificationAttempts})`, false, false);
          }
        }
      })
      .catch(error => {
        console.error("Erreur lors de la vérification des données:", error);
        verificationCount++;
        
        if (verificationCount >= maxVerificationAttempts) {
          updateVerificationStatus(`❌ Erreur lors de la vérification: ${error.message}`, false, true);
          clearInterval(verificationTimer);
          verificationTimer = null;
          enableButtons();
        } else {
          updateVerificationStatus(`Erreur de vérification, nouvelle tentative... (${verificationCount}/${maxVerificationAttempts})`, false, false);
        }
      });
    }
    
    // Gestionnaire d'événement pour le clic sur la zone de drop
    uploadBox.addEventListener('click', function() {
      fileInput.click();
    });
    
    // Gestion du glisser-déposer
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
    
    // Fonction pour téléverser le fichier
    function handleFileUpload(file) {
      if (!file) {
        console.error("Aucun fichier sélectionné");
        return;
      }
      
      if (!apiKey) {
        updateVerificationStatus("❌ Clé API Voiceflow non spécifiée", false, true);
        return;
      }
      
      // Afficher les informations du fichier
      fileInfo.textContent = `Fichier: ${file.name} (${formatFileSize(file.size)})`;
      
      // Mettre à jour l'interface
      uploadBox.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
          <p>Préparation du téléversement...</p>
        </div>
      `;
      
      // Afficher la barre de progression
      updateProgress(0, "Initialisation de l'upload...");
      
      // Préparer les données pour l'upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Convertir les métadonnées en chaîne JSON
      if (Object.keys(metadata).length > 0) {
        const metadataString = JSON.stringify(metadata);
        formData.append('metadata', metadataString);
      }
      
      // Créer une requête avec rapport de progression
      const xhr = new XMLHttpRequest();
      
      // Gestion du rapport de progression
      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          updateProgress(percentComplete, `Téléversement en cours: ${percentComplete}%`);
        }
      });
      
      // Configuration de la requête
      xhr.open('POST', `https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=${maxChunkSize}`, true);
      xhr.setRequestHeader('Authorization', apiKey);
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Gestion de la fin de la requête
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log("Réponse du serveur:", response);
            
            if (response && response.data && response.data.documentID) {
              documentId = response.data.documentID;
              
              // Mise à jour de l'interface
              updateProgress(100, "✅ Téléversement terminé!");
              uploadBox.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
                  <img src="https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif" alt="Done" width="50" height="50">
                  <p>Document téléversé avec succès!</p>
                </div>
              `;
              
              // Début de la vérification des données
              updateVerificationStatus("Vérification de l'indexation des données...", false, false);
              verificationCount = 0;
              
              // Attendre un peu avant de commencer la vérification
              setTimeout(() => {
                // Lancer la vérification périodique
                verifyDataAvailability();
                verificationTimer = setInterval(verifyDataAvailability, testInterval);
              }, 5000); // Attendre 5 secondes avant la première vérification
            } else {
              throw new Error("ID de document non trouvé dans la réponse");
            }
          } catch (error) {
            console.error("Erreur lors du traitement de la réponse:", error);
            handleUploadError(error.message);
          }
        } else {
          // Gérer les erreurs HTTP
          console.error("Erreur HTTP:", xhr.status, xhr.statusText);
          let errorMessage = `Erreur ${xhr.status}: ${xhr.statusText}`;
          
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse && errorResponse.message) {
              errorMessage = errorResponse.message;
            }
          } catch (e) {
            // Si le parsing échoue, utiliser le message d'erreur par défaut
          }
          
          handleUploadError(errorMessage);
        }
      };
      
      // Gestion des erreurs réseau
      xhr.onerror = function() {
        console.error("Erreur réseau lors de l'upload");
        handleUploadError("Erreur de connexion, veuillez vérifier votre connexion internet");
      };
      
      // Envoi de la requête
      try {
        xhr.send(formData);
      } catch (error) {
        console.error("Erreur lors de l'envoi de la requête:", error);
        handleUploadError(error.message);
      }
    }
    
    // Fonction pour formater la taille du fichier
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Fonction pour gérer les erreurs d'upload
    function handleUploadError(errorMessage) {
      updateProgress(0, "Échec du téléversement");
      uploadBox.innerHTML = `
        <div style="color: #D32F2F; padding: 10px;">
          <p>Erreur durant le téléversement</p>
          <p>${errorMessage || "Erreur inconnue"}</p>
          <p>Cliquez pour réessayer</p>
        </div>
      `;
      
      updateVerificationStatus("❌ Le téléversement a échoué", false, true);
      
      // Réactiver la zone de drop pour permettre une nouvelle tentative
      uploadBox.addEventListener('click', function() {
        fileInput.click();
      });
      
      // Permettre de continuer malgré l'erreur
      enableButtons();
    }
    
    // Ajouter le conteneur à l'élément parent
    element.appendChild(fileUploadContainer);
  },
};
