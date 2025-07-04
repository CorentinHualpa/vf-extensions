/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload_VF – Voiceflow KB Upload Extension           ║
 *  ║                                                           ║
 *  ║  • Upload direct dans Voiceflow Knowledge Base           ║
 *  ║  • Support des métadonnées personnalisables              ║
 *  ║  • Upload multiple avec appels successifs                ║
 *  ║  • Anti-doublons avec codes aléatoires                   ║
 *  ║  • Désactivation des boutons pendant l'upload            ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const FileUploadVF = {
  name: 'FileUploadVF',
  type: 'response',
  
  match: ({ trace }) => trace.payload?.name === 'file_upload_vf',
  
  render: ({ trace, element }) => {
    try {
      // Configuration depuis le payload
      const {
        // Voiceflow KB Config
        apiKey = null,
        maxChunkSize = 1000,
        overwrite = false,
        metadata = {},
        
        // UI Config
        title = "Uploadez vos documents",
        description = "Glissez-déposez vos fichiers",
        uploadText = "📁 Cliquez ou glissez vos fichiers ici",
        successMessage = "✅ Fichier(s) uploadé(s) avec succès !",
        errorMessage = "❌ Erreur lors de l'upload",
        noFilesErrorMessage = "❌ Veuillez uploader au moins 1 document avant de continuer",
        limitExceededErrorMessage = "❌ Limite de {maxFiles} fichiers dépassée. Veuillez recommencer.",
        maxFiles = 20,
        allowedTypes = ['pdf', 'docx', 'text'],
        primaryColor = '#9C27B0',
        backgroundImage = null,
        backgroundOpacity = { high: 0.5, low: 0.3 },
        chat = false,
        chatDisabledText = '🚫 Veuillez uploader vos documents',
        buttons = [
          { text: "✅ Terminer et utiliser les documents", action: "exit", path: "process_documents", color: "#4CAF50" },
          { text: "▶️ Passer à la suite sans upload", action: "exit", path: "skip_upload", color: "#2196F3" },
          { text: "◀️ Étape précédente", action: "exit", path: "previous_step", color: "#D35400" }
        ],
        instanceId = null
      } = trace.payload || {};

      // Vérifier la présence de l'API Key
      if (!apiKey) {
        throw new Error("API Key Voiceflow manquante dans le payload");
      }

      // 🎲 FONCTION POUR GÉNÉRER UN CODE ALÉATOIRE
      const generateRandomCode = (length = 7) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      // 📝 FONCTION POUR RENOMMER LE FICHIER AVEC CODE ALÉATOIRE
      const addRandomCodeToFilename = (originalName) => {
        const randomCode = generateRandomCode();
        const lastDotIndex = originalName.lastIndexOf('.');
        
        if (lastDotIndex === -1) {
          // Pas d'extension
          return `${originalName}_${randomCode}`;
        } else {
          // Avec extension
          const nameWithoutExt = originalName.substring(0, lastDotIndex);
          const extension = originalName.substring(lastDotIndex);
          return `${nameWithoutExt}_${randomCode}${extension}`;
        }
      };

      // Générer un ID unique avec préfixe VF
      const uniqueId = instanceId || `fileUploadVF_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variables pour accumuler les uploads
      let allUploadedDocs = [];
      let uploadedFileNames = [];
      let isUploading = false; // 🆕 NOUVEAU: État d'upload
      
      // Récupérer le root pour gérer le chat
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      
      // Fonctions chat
      function disableChat() {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '.5';
        ic.style.cursor = 'not-allowed';
        ic.setAttribute('title', chatDisabledText);
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = true; ta.setAttribute('title', chatDisabledText); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = true; snd.setAttribute('title', chatDisabledText); }
      }
      
      function enableChat() {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.removeProperty('opacity');
        ic.style.removeProperty('cursor');
        ic.removeAttribute('title');
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = false; ta.removeAttribute('title'); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = false; snd.removeAttribute('title'); }
      }
      
      if (!chat) disableChat();

      // Traitement de l'image de fond
      let processedBackgroundImage = backgroundImage;
      if (backgroundImage && backgroundImage.includes('[img]') && backgroundImage.includes('[/img]')) {
        processedBackgroundImage = backgroundImage.replace(/\[img\](.*?)\[\/img\]/g, '$1');
      }

      // Création du container
      const container = document.createElement('div');
      container.id = uniqueId;
      
      // Extraction RGB pour CSS
      const colorRgb = parseInt(primaryColor.replace('#',''), 16);
      const colorR = (colorRgb >> 16) & 255;
      const colorG = (colorRgb >> 8) & 255;
      const colorB = colorRgb & 255;
      
      container.innerHTML = `
        <style>
          #${uniqueId} {
            --primary: ${primaryColor};
            --primary-r: ${colorR};
            --primary-g: ${colorG};
            --primary-b: ${colorB};
            
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 24px;
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #fff;
            background: ${processedBackgroundImage ? `
              linear-gradient(135deg, 
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), ${backgroundOpacity.high}),
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), ${backgroundOpacity.low})),
              url("${processedBackgroundImage}")
            ` : `
              linear-gradient(135deg, 
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.4),
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.2))
            `}!important;
            background-size: cover!important;
            background-position: center!important;
            background-repeat: no-repeat!important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 
                        inset 0 2px 0 rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          
          #${uniqueId}:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3),
                        inset 0 2px 0 rgba(255, 255, 255, 0.3);
          }
          
          #${uniqueId} .upload-title {
            font-size: 20px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 8px;
            color: #fff;
            letter-spacing: -0.3px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          #${uniqueId} .upload-description {
            font-size: 15px;
            text-align: center;
            margin-bottom: 20px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.4;
          }
          
          #${uniqueId} .upload-stats {
            margin-bottom: 16px;
            padding: 12px 20px;
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(46, 125, 50, 0.9));
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            display: none;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3),
                        inset 0 2px 0 rgba(255, 255, 255, 0.2);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          #${uniqueId} .upload-container {
            border: 2px dashed rgba(255, 255, 255, 0.5);
            border-radius: 12px;
            padding: 40px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            margin-bottom: 20px;
            position: relative;
            width: 100%;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          #${uniqueId} .upload-container:hover {
            border-color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }
          
          #${uniqueId} .upload-container.drag-over {
            border-color: #4CAF50;
            background: rgba(76, 175, 80, 0.2);
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
          }
          
          /* 🆕 NOUVEAU: État d'upload en cours */
          #${uniqueId}.uploading .upload-container {
            pointer-events: none;
            opacity: 0.6;
          }
          
          #${uniqueId} .upload-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 2;
          }
          
          #${uniqueId} .upload-label {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 8px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            display: block;
            pointer-events: none;
            position: relative;
            z-index: 1;
          }
          
          #${uniqueId} .upload-info {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
            pointer-events: none;
            position: relative;
            z-index: 1;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          #${uniqueId} .upload-types {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            font-style: italic;
            pointer-events: none;
            position: relative;
            z-index: 1;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          #${uniqueId} .status {
            margin: 16px 0;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            display: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          #${uniqueId} .status.loading {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: #fff;
            animation: pulse 1.5s infinite;
          }
          
          #${uniqueId} .status.success {
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: #fff;
          }
          
          #${uniqueId} .status.error {
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: #fff;
          }
          
          #${uniqueId} .validation-error {
            margin: 16px 0;
            padding: 12px 16px;
            border-radius: 8px;
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: #fff;
            font-weight: 600;
            text-align: center;
            display: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: errorShake 0.5s ease-in-out;
          }
          
          @keyframes errorShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          /* BOUTONS HARMONIEUX */
          #${uniqueId} .buttons-container {
            display: flex!important;
            flex-wrap: nowrap!important;
            justify-content: center!important;
            align-items: stretch!important;
            gap: 12px!important;
            padding: 16px 0 0!important;
            width: 100%!important;
          }
          
          #${uniqueId} .upload-button {
            position: relative!important;
            background: var(--primary)!important;
            color: #fff!important;
            padding: 14px 20px!important;
            border-radius: 8px!important;
            font-weight: 700!important;
            letter-spacing: 0.5px!important;
            font-size: 15px!important;
            line-height: 1.2!important;
            cursor: pointer!important;
            border: none!important;
            overflow: hidden!important;
            transition: all 0.3s ease!important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3),
                        inset 0 3px 0 rgba(255,255,255,0.2),
                        inset 0 -3px 0 rgba(0,0,0,0.2)!important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.2)!important;
            text-align: center!important;
            display: flex!important;
            align-items: center!important;
            justify-content: center!important;
            flex: 1 1 auto!important;
            min-width: 200px!important;
            max-width: 400px!important;
            height: 60px!important;
            word-wrap: break-word!important;
            hyphens: auto!important;
            white-space: normal!important;
          }
          
          /* 🆕 NOUVEAU: État désactivé pendant l'upload */
          #${uniqueId}.uploading .upload-button {
            pointer-events: none!important;
            opacity: 0.5!important;
            cursor: not-allowed!important;
            background: #808080!important;
          }
          
          #${uniqueId}.uploading .upload-button::after {
            content: ' ⏳'!important;
          }
          
          #${uniqueId} .upload-button:hover:not(:disabled) {
            transform: translateY(-2px)!important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4),
                        inset 0 3px 0 rgba(255,255,255,0.3),
                        inset 0 -3px 0 rgba(0,0,0,0.3)!important;
            text-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 0 6px rgba(0,0,0,0.3)!important;
          }
          
          #${uniqueId} .upload-button:active:not(:disabled) {
            transform: translateY(1px)!important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.1),
                        inset 0 -1px 0 rgba(0,0,0,0.1)!important;
          }
          
          #${uniqueId} .upload-button::before {
            content: ''!important;
            position: absolute!important;
            top: -2px!important;
            left: -2px!important;
            width: calc(100% + 4px)!important;
            height: calc(100% + 4px)!important;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)!important;
            transform: translateX(-100%) rotate(45deg)!important;
            transition: transform 0.8s ease!important;
          }
          
          #${uniqueId} .upload-button:hover::before {
            transform: translateX(100%) rotate(45deg)!important;
          }
          
          @keyframes shake-enhanced {
            0%, 100% { transform: translateX(0); }
            15%, 45%, 75% { transform: translateX(-6px); }
            30%, 60%, 90% { transform: translateX(6px); }
          }
          
          #${uniqueId} .upload-button.shake {
            animation: shake-enhanced 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)!important;
            box-shadow: 0 0 0 4px rgba(255,68,68,0.5)!important;
          }
          
          #${uniqueId} .upload-button.shake {
            background: #ff4433!important;
            box-shadow: 0 0 10px #ff4433,
                        0 0 20px rgba(255,68,68,0.5),
                        inset 0 3px 0 rgba(255,255,255,0.2),
                        inset 0 -3px 0 rgba(0,0,0,0.2)!important;
          }
          
          @keyframes pulse-button {
            0% { box-shadow: 0 0 0 0 rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.7); }
            70% { box-shadow: 0 0 0 10px rgba(var(--primary-r),var(--primary-g),var(--primary-b),0); }
            100% { box-shadow: 0 0 0 0 rgba(var(--primary-r),var(--primary-g),var(--primary-b),0); }
          }
          
          #${uniqueId} .upload-button:focus {
            animation: pulse-button 1.5s infinite!important;
          }
          
          #${uniqueId} .buttons-container .upload-button {
            flex: 1 1 calc(33.333% - 8px)!important;
          }
          
          #${uniqueId} .upload-button[style*="background"] {
            position: relative!important;
          }
          
          #${uniqueId} .upload-button[style*="background"]:hover:not(:disabled) {
            filter: brightness(1.1)!important;
            transform: translateY(-2px)!important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5),
                        0 6px 20px var(--btn-color, var(--primary))40,
                        inset 0 3px 0 rgba(255,255,255,0.3),
                        inset 0 -3px 0 rgba(0,0,0,0.3)!important;
          }
          
          @media (max-width: 768px) {
            #${uniqueId} {
              max-width: 100%;
              padding: 16px;
            }
            
            #${uniqueId} .buttons-container {
              flex-direction: column!important;
              gap: 8px!important;
            }
            
            #${uniqueId} .upload-button {
              flex: 1 1 100%!important;
              max-width: none!important;
              min-width: auto!important;
            }
          }
          
          #${uniqueId}.completed {
            opacity: 0.8;
            pointer-events: none;
            filter: grayscale(30%);
          }
          
          #${uniqueId}.completed::after {
            content: '✅ TERMINÉ';
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(76, 175, 80, 0.9);
            color: #fff;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
        </style>
        
        <div class="upload-title">${title}</div>
        <div class="upload-description">${description}</div>
        
        <div class="upload-stats">
          <span id="stats-text">Aucun fichier uploadé</span>
        </div>
        
        <div class="upload-container">
          <input id="input-${uniqueId}" class="upload-input" type="file" multiple accept="${allowedTypes.map(t => t === 'text' ? '.txt' : `.${t}`).join(',')}" />
          <div class="upload-label">${uploadText}</div>
          <div class="upload-info">Maximum ${maxFiles} fichiers</div>
          <div class="upload-types">Types autorisés: ${allowedTypes.map(t => t.toUpperCase()).join(', ')}</div>
        </div>
        
        <div class="status"></div>
        
        <div class="validation-error" id="validation-error-${uniqueId}">
          <!-- Message d'erreur de validation -->
        </div>
        
        <div class="buttons-container">
          ${buttons.map((btn, index) => `
            <button class="upload-button" 
                    data-action="${btn.action || 'exit'}" 
                    data-path="${btn.path || 'Default'}" 
                    data-button-index="${index}"
                    ${btn.color ? `style="background: ${btn.color} !important; 
                                        --btn-color: ${btn.color};
                                        box-shadow: 0 4px 12px rgba(0,0,0,0.3),
                                                   0 4px 12px ${btn.color}40,
                                                   inset 0 3px 0 rgba(255,255,255,0.2),
                                                   inset 0 -3px 0 rgba(0,0,0,0.2) !important;"` : ''}>
              ${btn.text}
            </button>
          `).join('')}
        </div>
      `;
      
      element.appendChild(container);
      
      // Éléments DOM
      const input = container.querySelector('.upload-input');
      const uploadContainer = container.querySelector('.upload-container');
      const status = container.querySelector('.status');
      const statsEl = container.querySelector('#stats-text');
      const statsContainer = container.querySelector('.upload-stats');
      const validationError = container.querySelector(`#validation-error-${uniqueId}`);
      
      // Fonction d'affichage du statut
      const showStatus = (msg, type) => {
        status.textContent = msg;
        status.className = 'status ' + type;
        status.style.display = 'block';
        
        if (type === 'success') {
          setTimeout(() => {
            status.style.display = 'none';
          }, 3000);
        }
      };
      
      // Fonction d'affichage des erreurs de validation
      const showValidationError = (message) => {
        validationError.textContent = message;
        validationError.style.display = 'block';
        
        setTimeout(() => {
          validationError.style.display = 'none';
        }, 5000);
        
        validationError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      
      // Fonction de masquage des erreurs de validation
      const hideValidationError = () => {
        validationError.style.display = 'none';
      };
      
      // Fonction de mise à jour des stats
      const updateStats = () => {
        if (allUploadedDocs.length > 0) {
          statsEl.textContent = `${allUploadedDocs.length} fichier(s) uploadé(s) dans Voiceflow KB`;
          statsContainer.style.display = 'block';
        } else {
          statsContainer.style.display = 'none';
        }
      };
      
      // 🚀 FONCTION D'UPLOAD VERS VOICEFLOW KB
      const uploadToVoiceflowKB = async (file, originalFileName) => {
        // 🎲 Créer un nouveau fichier avec nom modifié
        const newFileName = addRandomCodeToFilename(originalFileName);
        const modifiedFile = new File([file], newFileName, { type: file.type });
        
        console.log(`📝 Renommage: "${originalFileName}" → "${newFileName}"`);
        
        const formData = new FormData();
        formData.append('file', modifiedFile);
        
        // Construire l'URL avec les paramètres
        let url = `https://api.voiceflow.com/v1/knowledge-base/docs/upload?`;
        
        // Ajouter maxChunkSize
        url += `maxChunkSize=${maxChunkSize}`;
        
        // Ajouter overwrite si nécessaire
        if (overwrite) {
          url += `&overwrite=true`;
        }
        
        // Headers avec API Key
        const headers = {
          'Authorization': apiKey,
          'Accept': 'application/json'
        };
        
        // Si des métadonnées sont fournies, les ajouter au form data
        if (metadata && Object.keys(metadata).length > 0) {
          formData.append('metadata', JSON.stringify(metadata));
        }
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Voiceflow retourne { data: { documentID: "xxx" } }
          if (result.data?.documentID) {
            return {
              success: true,
              documentID: result.data.documentID,
              fileName: newFileName,        // Nom modifié
              originalFileName: originalFileName  // Nom original
            };
          } else {
            throw new Error('Pas de documentID dans la réponse');
          }
          
        } catch (error) {
          console.error(`Erreur upload ${originalFileName}:`, error);
          return {
            success: false,
            error: error.message,
            fileName: originalFileName
          };
        }
      };
      
      // Fonction d'upload principal (MODIFIÉE avec gestion de l'état)
      const upload = async (files) => {
        if (!files.length) return;
        
        // 🆕 NOUVEAU: Vérifier si upload déjà en cours
        if (isUploading) {
          showStatus('⏳ Upload déjà en cours, veuillez patienter...', 'loading');
          return;
        }
        
        // Validation : Vérifier la limite AVANT l'upload
        if (allUploadedDocs.length + files.length > maxFiles) {
          const errorMsg = limitExceededErrorMessage.replace('{maxFiles}', maxFiles);
          showValidationError(errorMsg);
          
          console.log(`⚠️ Limite dépassée: ${allUploadedDocs.length + files.length}/${maxFiles} - Reset`);
          allUploadedDocs = [];
          uploadedFileNames = [];
          updateStats();
          
          return;
        }
        
        hideValidationError();
        
        // 🆕 NOUVEAU: Marquer le début de l'upload et désactiver l'interface
        isUploading = true;
        container.classList.add('uploading');
        
        showStatus(`📤 Upload de ${files.length} fichier(s) vers Voiceflow KB... Veuillez patienter avant de cliquer sur les boutons.`, 'loading');
        
        // Upload successif de chaque fichier
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const originalName = file.name;
          showStatus(`📤 Upload ${i + 1}/${files.length}: ${originalName}... Ne cliquez pas encore !`, 'loading');
          
          const result = await uploadToVoiceflowKB(file, originalName);
          results.push(result);
          
          if (result.success) {
            successCount++;
            allUploadedDocs.push({
              documentID: result.documentID,
              fileName: result.fileName,
              originalFileName: result.originalFileName
            });
            uploadedFileNames.push(result.fileName);
            console.log(`✅ Upload réussi: ${originalName} → ${result.fileName} (ID: ${result.documentID})`);
          } else {
            errorCount++;
            console.error(`❌ Échec upload: ${originalName} → ${result.error}`);
          }
        }
        
        // 🆕 NOUVEAU: Fin de l'upload, réactiver l'interface
        isUploading = false;
        container.classList.remove('uploading');
        
        // Afficher le résultat final
        if (errorCount === 0) {
          showStatus(`${successMessage} (${successCount} fichier(s)) - Vous pouvez maintenant cliquer sur les boutons !`, 'success');
        } else if (successCount === 0) {
          showStatus(`${errorMessage}: Tous les uploads ont échoué`, 'error');
        } else {
          showStatus(`Upload partiel: ${successCount} réussi(s), ${errorCount} échec(s) - Vous pouvez maintenant continuer`, 'error');
        }
        
        updateStats();
        
        console.log(`📁 Upload terminé. Total dans KB: ${allUploadedDocs.length}/${maxFiles}`);
        console.log('Documents uploadés:', allUploadedDocs);
      };
      
      // Event listeners pour l'upload
      input.addEventListener('change', e => upload(e.target.files));
      
      // Drag & Drop
      ['dragenter', 'dragover'].forEach(ev => {
        uploadContainer.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          uploadContainer.classList.add('drag-over');
        });
      });
      
      ['dragleave', 'drop'].forEach(ev => {
        uploadContainer.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          uploadContainer.classList.remove('drag-over');
          if (ev === 'drop') upload(e.dataTransfer.files);
        });
      });
      
      // Event listeners pour les boutons (MODIFIÉ)
      container.querySelectorAll('.upload-button').forEach((btn, btnIndex) => {
        btn.addEventListener('click', () => {
          // 🆕 NOUVEAU: Vérifier si upload en cours
          if (isUploading) {
            showValidationError('⏳ Upload en cours ! Veuillez attendre la fin de l\'upload avant de cliquer.');
            btn.classList.add('shake');
            setTimeout(() => btn.classList.remove('shake'), 500);
            return;
          }
          
          const action = btn.getAttribute('data-action');
          const path = btn.getAttribute('data-path');
          const buttonIndex = btn.getAttribute('data-button-index');
          const buttonText = btn.textContent;
          
          console.log(`🔘 Bouton cliqué: "${buttonText}"`);
          console.log(`   → action: "${action}"`);
          console.log(`   → path: "${path}"`);
          console.log(`   → index: ${buttonIndex}`);
          
          if (action === 'exit') {
            
            // Validation : Vérifier qu'il y a au moins 1 fichier pour "process_documents"
            if (path === 'process_documents' && allUploadedDocs.length === 0) {
              showValidationError(noFilesErrorMessage);
              console.log('❌ Tentative de finalisation sans fichiers uploadés');
              return;
            }
            
            hideValidationError();
            
            // Sortir de l'extension
            container.classList.add('completed');
            
            if (!chat) enableChat();
            
            // Payload de sortie avec noms originaux et modifiés
            const payloadToSend = {
              success: true,
              documents: allUploadedDocs, // Liste des {documentID, fileName, originalFileName}
              fileNames: uploadedFileNames,
              originalFileNames: allUploadedDocs.map(doc => doc.originalFileName),
              totalFiles: allUploadedDocs.length,
              buttonPath: path,
              buttonText: buttonText,
              buttonAction: action,
              instanceId: uniqueId,
              // Infos KB
              kbInfo: {
                apiKey: apiKey.substring(0, 10) + '...', // Masquer partiellement l'API key
                maxChunkSize: maxChunkSize,
                overwrite: overwrite,
                metadata: metadata
              }
            };
            
            console.log(`✅ Envoi du payload:`, payloadToSend);
            
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: payloadToSend
            });
            
            console.log(`✅ Extension terminée - ${allUploadedDocs.length} documents dans Voiceflow KB via path: ${path}`);
          }
        });
      });
      
      console.log(`✅ FileUploadVF Extension prête (ID: ${uniqueId})`);
      
    } catch (error) {
      console.error('❌ FileUploadVF Error:', error);
      
      // Formulaire de secours
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="color: #fff; background: rgba(220, 53, 69, 0.8); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p>❌ Erreur lors du chargement de l'extension d'upload</p>
          <p>Erreur: ${error.message}</p>
        </div>
      `;
      element.appendChild(errorDiv);
      
      // Terminer avec erreur
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          success: false,
          error: error.message
        }
      });
    }
  }
};

export default FileUploadVF;
