/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload – Voiceflow Response Extension Améliorée     ║
 *  ║                                                           ║
 *  ║  • Meilleurs contrastes et lisibilité                     ║
 *  ║  • Boutons avec couleurs distinctives                    ║
 *  ║  • Container de stats plus visible                       ║
 *  ║  • Upload continu avec accumulation automatique          ║
 *  ║  • Validations robustes (fichiers requis + limites)      ║
 *  ║  • Style glassmorphism élégant avec image de fond        ║
 *  ║  • Boutons harmonieux inspirés de MultiSelect            ║
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
        backgroundOpacity = { high: 0.5, low: 0.3 }, // Nouveau paramètre pour contrôler l'opacité
        chat = false,
        chatDisabledText = '🚫 Veuillez uploader vos documents',
        buttons = [
          { text: "✅ Terminer et traiter les documents", action: "exit", path: "process_documents", color: "#4CAF50" },
          { text: "▶️ Passer à la suite sans upload", action: "exit", path: "skip_upload", color: "#2196F3" },
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

      // Traitement de l'image de fond (INSPIRÉ DE LOADEREXTENSION)
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
            max-width: 900px; /* Augmenté de 600px à 900px pour accommoder les boutons sur une ligne */
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
          
          /* BOUTONS HARMONIEUX INSPIRÉS DE MULTISELECT */
          #${uniqueId} .buttons-container {
            display: flex!important;
            flex-wrap: nowrap!important; /* Force sur une ligne */
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
            
            /* CLÉS POUR L'HARMONIE */
            flex: 1 1 auto!important;
            min-width: 200px!important;
            max-width: 400px!important;
            height: 60px!important;
            
            word-wrap: break-word!important;
            hyphens: auto!important;
            white-space: normal!important;
          }
          
          /* Effet hover conservé et amélioré */
          #${uniqueId} .upload-button:hover {
            transform: translateY(-2px)!important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4),
                        inset 0 3px 0 rgba(255,255,255,0.3),
                        inset 0 -3px 0 rgba(0,0,0,0.3)!important;
            text-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 0 6px rgba(0,0,0,0.3)!important;
          }
          
          /* Effet active (clic) conservé */
          #${uniqueId} .upload-button:active {
            transform: translateY(1px)!important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.1),
                        inset 0 -1px 0 rgba(0,0,0,0.1)!important;
          }
          
          /* Effet de scan sci-fi conservé */
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
          
          /* Animation shake améliorée */
          @keyframes shake-enhanced {
            0%, 100% { transform: translateX(0); }
            15%, 45%, 75% { transform: translateX(-6px); }
            30%, 60%, 90% { transform: translateX(6px); }
          }
          
          #${uniqueId} .upload-button.shake {
            animation: shake-enhanced 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)!important;
            box-shadow: 0 0 0 4px rgba(255,68,68,0.5)!important;
          }
          
          /* Effet de glow pour les erreurs */
          #${uniqueId} .upload-button.shake {
            background: #ff4433!important;
            box-shadow: 0 0 10px #ff4433,
                        0 0 20px rgba(255,68,68,0.5),
                        inset 0 3px 0 rgba(255,255,255,0.2),
                        inset 0 -3px 0 rgba(0,0,0,0.2)!important;
          }
          
          /* Effet de pulse */
          @keyframes pulse-button {
            0% { box-shadow: 0 0 0 0 rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.7); }
            70% { box-shadow: 0 0 0 10px rgba(var(--primary-r),var(--primary-g),var(--primary-b),0); }
            100% { box-shadow: 0 0 0 0 rgba(var(--primary-r),var(--primary-g),var(--primary-b),0); }
          }
          
          #${uniqueId} .upload-button:focus {
            animation: pulse-button 1.5s infinite!important;
          }
          
          /* Pour 3 boutons : égaliser les tailles */
          #${uniqueId} .buttons-container .upload-button {
            flex: 1 1 calc(33.333% - 8px)!important;
          }
          
          /* Styles spécifiques pour les boutons avec couleur personnalisée */
          #${uniqueId} .upload-button[style*="background"] {
            position: relative!important;
          }
          
          /* Assurer que le hover fonctionne avec les couleurs personnalisées */
          #${uniqueId} .upload-button[style*="background"]:hover {
            filter: brightness(1.1)!important;
            transform: translateY(-2px)!important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5),
                        0 6px 20px var(--btn-color, var(--primary))40,
                        inset 0 3px 0 rgba(255,255,255,0.3),
                        inset 0 -3px 0 rgba(0,0,0,0.3)!important;
          }
          
          /* Responsive : Sur mobile, boutons pleine largeur */
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
          <input id="input-${uniqueId}" class="upload-input" type="file" multiple accept="${allowedTypes.map(t => `.${t}`).join(',')}" />
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
      
      // 🚨 NOUVELLE FONCTION : Affichage des erreurs de validation
      const showValidationError = (message) => {
        validationError.textContent = message;
        validationError.style.display = 'block';
        
        // Masquer après 5 secondes
        setTimeout(() => {
          validationError.style.display = 'none';
        }, 5000);
        
        // Scroll vers l'erreur pour la visibilité
        validationError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      
      // Fonction de masquage des erreurs de validation
      const hideValidationError = () => {
        validationError.style.display = 'none';
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
      
      // Fonction d'upload (BASÉE SUR L'ANCIENNE EXTENSION + VALIDATION)
      const upload = async (files) => {
        if (!files.length) return;
        
        // 🚨 VALIDATION : Vérifier la limite AVANT l'upload
        if (allUploadedUrls.length + files.length > maxFiles) {
          const errorMsg = limitExceededErrorMessage.replace('{maxFiles}', maxFiles);
          showValidationError(errorMsg);
          
          // 🔄 RESET COMPLET si limite dépassée
          console.log(`⚠️ Limite dépassée: ${allUploadedUrls.length + files.length}/${maxFiles} - Reset`);
          allUploadedUrls = []; // Vider tous les uploads précédents
          updateStats();
          
          return;
        }
        
        // Masquer les erreurs de validation pendant l'upload
        hideValidationError();
        
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
          
          console.log(`📁 ${j.urls.length} fichiers uploadés. Total: ${allUploadedUrls.length}/${maxFiles}`);
          console.log('URLs accumulées:', allUploadedUrls);
          
        } catch (e) {
          console.error('Upload error:', e);
          showStatus(`${errorMessage}: ${e.message}`, 'error');
        }
      };
      
      // Event listeners pour l'upload
      input.addEventListener('change', e => upload(e.target.files));
      
      // Drag & Drop sur le container
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
      
      // Event listeners pour les boutons - AMÉLIORÉ AVEC DEBUG
      container.querySelectorAll('.upload-button').forEach((btn, btnIndex) => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          const path = btn.getAttribute('data-path');
          const buttonIndex = btn.getAttribute('data-button-index');
          const buttonText = btn.textContent;
          
          // ✅ DEBUG COMPLET
          console.log(`🔘 Bouton cliqué: "${buttonText}"`);
          console.log(`   → action: "${action}"`);
          console.log(`   → path: "${path}"`);
          console.log(`   → index: ${buttonIndex}`);
          console.log(`   → Bouton original:`, buttons[buttonIndex]);
          
          if (action === 'exit') {
            
            // 🚨 VALIDATION : Vérifier qu'il y a au moins 1 fichier pour "process_documents"
            if (path === 'process_documents' && allUploadedUrls.length === 0) {
              showValidationError(noFilesErrorMessage);
              console.log('❌ Tentative de finalisation sans fichiers uploadés');
              return; // Bloquer la sortie
            }
            
            // Masquer les erreurs de validation
            hideValidationError();
            
            // Sortir de l'extension
            container.classList.add('completed');
            
            if (!chat) enableChat();
            
            // ✅ PAYLOAD AVEC DEBUG COMPLET
            const payloadToSend = {
              success: true,
              urls: allUploadedUrls,
              buttonPath: path,
              buttonText: buttonText,
              buttonAction: action,
              totalFiles: allUploadedUrls.length,
              instanceId: uniqueId,
              debugInfo: {
                originalButton: buttons[buttonIndex],
                clickedPath: path,
                expectedPath: buttons[buttonIndex]?.path
              }
            };
            
            console.log(`✅ Envoi du payload:`, payloadToSend);
            
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: payloadToSend
            });
            
            console.log(`✅ Extension terminée - ${allUploadedUrls.length} fichiers envoyés via path: ${path}`);
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
