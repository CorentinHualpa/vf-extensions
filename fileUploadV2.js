/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload – Voiceflow Response Extension Simplifiée    ║
 *  ║                                                           ║
 *  ║  • Basée sur l'ancienne extension qui fonctionne         ║
 *  ║  • Upload continu avec accumulation automatique          ║
 *  ║  • Style glassmorphism élégant                           ║
 *  ║  • Boutons configurables                                 ║
 *  ║  • Compatible avec l'ancien script de capture           ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  
  match: ({ trace }) => trace.payload?.name === 'file_upload',
  
  render: ({ trace, element }) => {
    try {
      // Configuration depuis le payload
      const {
        title = "Uploadez vos documents",
        description = "Glissez-déposez vos fichiers",
        uploadText = "📁 Cliquez ou glissez vos fichiers ici",
        successMessage = "✅ Fichier(s) uploadé(s) avec succès !",
        errorMessage = "❌ Erreur lors de l'upload",
        noFilesErrorMessage = "❌ Veuillez uploader au moins 1 document avant de continuer",
        limitExceededErrorMessage = "❌ Limite de {maxFiles} fichiers dépassée. Veuillez recommencer.",
        maxFiles = 20,
        allowedTypes = ['pdf', 'docx', 'doc', 'txt'],
        primaryColor = '#9C27B0',
        backgroundImage = null,
        chat = false,
        chatDisabledText = '🚫 Veuillez uploader vos documents',
        buttons = [
          { text: "✅ Terminer et traiter les documents", action: "exit", path: "process_documents" },
          { text: "◀️ Étape précédente", action: "exit", path: "previous_step", color: "#D35400" }
        ],
        instanceId = null
      } = trace.payload || {};

      // Générer un ID unique
      const uniqueId = instanceId || `fileUpload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variable pour accumuler toutes les URLs uploadées
      let allUploadedUrls = [];
      
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
      const processedBackgroundImage = backgroundImage && backgroundImage.includes('[img]') && backgroundImage.includes('[/img]')
        ? backgroundImage.replace(/\[img\](.*?)\[\/img\]/g, '$1')
        : backgroundImage;

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
            max-width: 600px;
            margin: 0 auto;
            padding: 24px;
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #fff;
            background: ${processedBackgroundImage ? `
              linear-gradient(135deg, 
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.85),
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.75)),
              url("${processedBackgroundImage}")
            ` : `
              linear-gradient(135deg, 
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.9),
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.7))
            `};
            background-size: cover;
            background-position: center;
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
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            text-align: center;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            display: none;
          }
          
          #${uniqueId} .upload-container {
            border: 2px dashed rgba(255, 255, 255, 0.4);
            border-radius: 12px;
            padding: 40px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            margin-bottom: 20px;
            position: relative;
          }
          
          #${uniqueId} .upload-container:hover {
            border-color: rgba(255, 255, 255, 0.7);
            background: rgba(0, 0, 0, 0.3);
            transform: translateY(-2px);
          }
          
          #${uniqueId} .upload-container.drag-over {
            border-color: #4CAF50;
            background: rgba(76, 175, 80, 0.2);
          }
          
          #${uniqueId} .upload-input {
            display: none;
          }
          
          #${uniqueId} .upload-label {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 8px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            display: block;
          }
          
          #${uniqueId} .upload-info {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
          }
          
          #${uniqueId} .upload-types {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            font-style: italic;
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
          
          #${uniqueId} .buttons-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            padding: 16px 0 0;
            width: 100%;
          }
          
          #${uniqueId} .upload-button {
            position: relative;
            background: var(--primary);
            color: #fff;
            padding: 14px 20px;
            border-radius: 8px;
            font-weight: 700;
            letter-spacing: 0.5px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.3),
                        inset 0 3px 0 rgba(255, 255, 255, 0.2),
                        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1 1 auto;
            min-width: 180px;
            max-width: 300px;
            height: 50px;
            word-wrap: break-word;
            white-space: normal;
          }
          
          #${uniqueId} .upload-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.4),
                        inset 0 3px 0 rgba(255, 255, 255, 0.3),
                        inset 0 -3px 0 rgba(0, 0, 0, 0.3);
          }
          
          #${uniqueId} .upload-button:active {
            transform: translateY(1px);
          }
          
          #${uniqueId} .upload-button::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            width: calc(100% + 4px);
            height: calc(100% + 4px);
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
            transform: translateX(-100%) rotate(45deg);
            transition: transform 0.8s ease;
          }
          
          #${uniqueId} .upload-button:hover::before {
            transform: translateX(100%) rotate(45deg);
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
          
          @media (max-width: 768px) {
            #${uniqueId} .buttons-container {
              flex-direction: column;
              gap: 8px;
            }
            
            #${uniqueId} .upload-button {
              flex: 1 1 100%;
              max-width: none;
              min-width: auto;
            }
          }
        </style>
        
        <div class="upload-title">${title}</div>
        <div class="upload-description">${description}</div>
        
        <div class="upload-stats">
          <span id="stats-text">Aucun fichier uploadé</span>
        </div>
        
        <div class="upload-container">
          <input id="input-${uniqueId}" class="upload-input" type="file" multiple accept="${allowedTypes.map(t => `.${t}`).join(',')}" />
          <label for="input-${uniqueId}" class="upload-label">${uploadText}</label>
          <div class="upload-info">Maximum ${maxFiles} fichiers</div>
          <div class="upload-types">Types autorisés: ${allowedTypes.map(t => t.toUpperCase()).join(', ')}</div>
        </div>
        
        <div class="status"></div>
        
        <div class="validation-error" id="validation-error-${uniqueId}">
          <!-- Message d'erreur de validation -->
        </div>
        
        <div class="buttons-container">
          ${buttons.map((btn, index) => `
            <button class="upload-button" data-action="${btn.action}" data-path="${btn.path || ''}" 
                    ${btn.color ? `style="background: ${btn.color} !important;"` : ''}>
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
      
      // Fonction de mise à jour des stats
      const updateStats = () => {
        if (allUploadedUrls.length > 0) {
          statsEl.textContent = `${allUploadedUrls.length} fichier(s) uploadé(s)`;
          statsContainer.style.display = 'block';
        } else {
          statsContainer.style.display = 'none';
        }
      };
      
      // Fonction d'upload (BASÉE SUR L'ANCIENNE EXTENSION)
      const upload = async (files) => {
        if (!files.length) return;
        
        // Vérifier la limite
        if (allUploadedUrls.length + files.length > maxFiles) {
          showStatus(`❌ Limite de ${maxFiles} fichiers atteinte`, 'error');
          return;
        }
        
        showStatus(`Téléversement de ${files.length} fichier(s)…`, 'loading');
        
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('files', f));
        
        try {
          const r = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: fd }
          );
          const j = await r.json();
          
          if (!r.ok || !Array.isArray(j.urls) || !j.urls.length) {
            throw new Error(j.detail || 'Aucune URL renvoyée');
          }
          
          // ✅ ACCUMULATION des URLs (comme demandé)
          allUploadedUrls = allUploadedUrls.concat(j.urls);
          
          showStatus(`${successMessage} (${j.urls.length} fichier(s))`, 'success');
          updateStats();
          
          console.log(`📁 ${j.urls.length} fichiers uploadés. Total: ${allUploadedUrls.length}`);
          console.log('URLs accumulées:', allUploadedUrls);
          
        } catch (e) {
          console.error('Upload error:', e);
          showStatus(`${errorMessage}: ${e.message}`, 'error');
        }
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
      
      // Event listeners pour les boutons
      container.querySelectorAll('.upload-button').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          const path = btn.getAttribute('data-path');
          
          if (action === 'exit') {
            // Sortir de l'extension
            container.classList.add('completed');
            
            if (!chat) enableChat();
            
            // ✅ ENVOI COMPATIBLE avec l'ancien format
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                success: true,
                urls: allUploadedUrls,  // ✅ FORMAT ATTENDU par l'ancien script
                buttonPath: path,
                buttonText: btn.textContent,
                totalFiles: allUploadedUrls.length,
                instanceId: uniqueId
              }
            });
            
            console.log(`✅ Extension terminée - ${allUploadedUrls.length} fichiers envoyés`);
          }
          // Si action === 'stay', on ne fait rien (reste dans l'extension)
        });
      });
      
      console.log(`✅ FileUpload Extension prête (ID: ${uniqueId})`);
      
    } catch (error) {
      console.error('❌ FileUpload Error:', error);
      
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

export default FileUpload;
