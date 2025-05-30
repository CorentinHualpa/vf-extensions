/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload – Voiceflow Response Extension Complète      ║
 *  ║                                                           ║
 *  ║  • Upload de fichiers stylé avec glassmorphism           ║
 *  ║  • Gestion des groupes de documents avec badges          ║
 *  ║  • Accumulation automatique dans pdf_link et pdf_linkS   ║
 *  ║  • Boutons configurables (continue/submit)               ║
 *  ║  • Chat désactivable et textes personnalisables          ║
 *  ║  • Support drag & drop et sélection multiple             ║
 *  ║  • Gestion des erreurs et retry automatique              ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const FileUpload = {
  name: 'FileUpload',
  type: 'response',

  // Activation sur trace file_upload
  match: ({ trace }) => 
    trace.payload?.name === 'file_upload' || trace.type === 'file_upload',

  render: ({ trace, element }) => {
    try {
      // Configuration depuis le payload
      const {
        title = "📂 Gestion des documents",
        uploadText = "Cliquez ou glissez vos fichiers ici",
        uploadSubtext = "PDF, Word, Excel, PowerPoint acceptés (max 50MB par fichier)",
        successText = "✅ Fichier(s) uploadé(s) avec succès !",
        errorText = "❌ Erreur lors de l'upload",
        processingText = "🔄 Upload en cours...",
        groupBadgeText = "📁 Groupe",
        maxFiles = 10,
        maxFileSize = 50 * 1024 * 1024, // 50MB par défaut
        primaryColor = "#9C27B0",
        backgroundImage = null,
        chat = false,
        chatDisabledText = "Vous ne pouvez pas envoyer de chat ici.",
        instanceId = null,
        buttons = [
          { text: "📤 Continuer l'upload", action: "continue" },
          { text: "✅ Traiter les documents", action: "submit", path: "process_documents" },
          { text: "◀️ Étape précédente", action: "submit", path: "previous_step", color: "#D35400" }
        ]
      } = trace.payload || {};

      // Générer un ID unique pour cette instance
      const uniqueInstanceId = instanceId || `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variables globales pour accumulation des fichiers
      let uploadedGroups = []; // Groupes de fichiers uploadés pour cette session
      let currentGroupCount = 0;

      // Traitement de l'image de fond
      let processedBackgroundImage = backgroundImage;
      if (backgroundImage && backgroundImage.includes('[img]') && backgroundImage.includes('[/img]')) {
        processedBackgroundImage = backgroundImage.replace(/\[img\](.*?)\[\/img\]/g, '$1');
      }

      // Récupérer le root pour accéder au chat
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      
      // Fonctions pour gérer le chat
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
        ic.style.opacity = '';
        ic.style.cursor = '';
        ic.removeAttribute('title');
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = false; ta.removeAttribute('title'); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = false; snd.removeAttribute('title'); }
      }
      
      // Désactiver le chat si requis
      if (!chat) disableChat();

      // Création du conteneur principal
      const container = document.createElement('div');
      container.className = 'file-upload-container';
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);

      // CSS intégré avec glassmorphism et animations
      const styleEl = document.createElement('style');
      
      // Extraction des valeurs RGB pour les variables CSS
      const colorRgb = parseInt(primaryColor.replace('#',''), 16);
      const colorR = (colorRgb >> 16) & 255;
      const colorG = (colorRgb >> 8) & 255;
      const colorB = colorRgb & 255;
      
      styleEl.textContent = `
/* Variables CSS principales */
.file-upload-container {
  --fu-primary: ${primaryColor};
  --fu-primary-r: ${colorR};
  --fu-primary-g: ${colorG};
  --fu-primary-b: ${colorB};
  --fu-radius: 12px;
  --fu-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  --fu-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  --fu-border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Reset et styles de base */
.file-upload-container, .file-upload-container * { 
  box-sizing: border-box!important; 
}

.file-upload-container {
  display: flex!important;
  flex-direction: column!important;
  width: 100%!important;
  max-width: 600px!important;
  margin: 0 auto!important;
  padding: 25px!important;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif!important;
  background: ${processedBackgroundImage ? `
    linear-gradient(135deg, 
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.85),
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.75)),
    url("${processedBackgroundImage}")
  ` : `
    linear-gradient(135deg, 
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.85),
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.65))
  `}!important;
  background-size: cover!important;
  background-position: center!important;
  background-repeat: no-repeat!important;
  backdrop-filter: blur(20px)!important;
  -webkit-backdrop-filter: blur(20px)!important;
  border: var(--fu-border)!important;
  border-radius: var(--fu-radius)!important;
  box-shadow: var(--fu-shadow), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1)!important;
  color: #fff!important;
  position: relative!important;
  overflow: hidden!important;
  transition: all 0.3s ease!important;
}

.file-upload-container:hover {
  transform: translateY(-4px)!important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 
              inset 0 1px 0 rgba(255, 255, 255, 0.2)!important;
}

/* Effet de scan sci-fi */
.file-upload-container::before {
  content: ''!important;
  position: absolute!important;
  top: -50%!important;
  left: -10%!important;
  width: 120%!important;
  height: 200%!important;
  background: linear-gradient(45deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent)!important;
  transform: translateX(-100%) rotate(45deg)!important;
  animation: scanEffect 4s ease-in-out infinite!important;
}

@keyframes scanEffect {
  0%, 90% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

/* Titre principal */
.file-upload-title {
  font-size: 22px!important;
  font-weight: 700!important;
  margin: 0 0 20px 0!important;
  text-align: center!important;
  color: #fff!important;
  text-shadow: var(--fu-text-shadow)!important;
  letter-spacing: -0.3px!important;
  position: relative!important;
  z-index: 2!important;
}

.file-upload-title::after {
  content: ''!important;
  position: absolute!important;
  bottom: -8px!important;
  left: 50%!important;
  transform: translateX(-50%)!important;
  width: 60px!important;
  height: 2px!important;
  background: #fff!important;
  transition: width 0.3s ease!important;
}

.file-upload-container:hover .file-upload-title::after {
  width: 100%!important;
}

/* Zone des badges de groupes uploadés */
.file-upload-groups {
  margin-bottom: 20px!important;
  min-height: 40px!important;
  display: flex!important;
  flex-wrap: wrap!important;
  gap: 10px!important;
  position: relative!important;
  z-index: 2!important;
}

.file-upload-group-badge {
  display: inline-flex!important;
  align-items: center!important;
  gap: 8px!important;
  padding: 8px 12px!important;
  background: rgba(0, 0, 0, 0.6)!important;
  backdrop-filter: blur(10px)!important;
  border: 1px solid rgba(255, 255, 255, 0.3)!important;
  border-radius: 20px!important;
  color: #fff!important;
  font-size: 14px!important;
  font-weight: 600!important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5)!important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)!important;
  animation: badgeAppear 0.5s ease-out!important;
  transition: all 0.3s ease!important;
}

.file-upload-group-badge:hover {
  transform: translateY(-2px)!important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4)!important;
  border-color: rgba(255, 255, 255, 0.5)!important;
}

.file-upload-group-badge .badge-icon {
  font-size: 16px!important;
}

.file-upload-group-badge .badge-text {
  font-size: 13px!important;
}

@keyframes badgeAppear {
  0% {
    opacity: 0;
    scale: 0.8;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    scale: 1;
    transform: translateY(0);
  }
}

/* Zone d'upload principale */
.file-upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.5)!important;
  border-radius: var(--fu-radius)!important;
  padding: 40px 20px!important;
  text-align: center!important;
  cursor: pointer!important;
  transition: all 0.3s ease!important;
  background: rgba(0, 0, 0, 0.3)!important;
  backdrop-filter: blur(10px)!important;
  margin-bottom: 20px!important;
  position: relative!important;
  z-index: 2!important;
  overflow: hidden!important;
}

.file-upload-zone:hover,
.file-upload-zone.dragover {
  border-color: #fff!important;
  background: rgba(255, 255, 255, 0.1)!important;
  transform: scale(1.02)!important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3)!important;
}

.file-upload-zone.processing {
  border-color: var(--fu-primary)!important;
  background: rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.2)!important;
  animation: processingPulse 2s ease-in-out infinite!important;
}

@keyframes processingPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.file-upload-input {
  display: none!important;
}

.file-upload-main-text {
  font-size: 18px!important;
  font-weight: 600!important;
  color: #fff!important;
  margin-bottom: 8px!important;
  text-shadow: var(--fu-text-shadow)!important;
}

.file-upload-sub-text {
  font-size: 14px!important;
  color: rgba(255, 255, 255, 0.8)!important;
  margin-bottom: 20px!important;
  text-shadow: var(--fu-text-shadow)!important;
}

.file-upload-icon {
  font-size: 48px!important;
  margin-bottom: 16px!important;
  display: block!important;
  animation: iconFloat 3s ease-in-out infinite!important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))!important;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Zone de statut */
.file-upload-status {
  padding: 12px 16px!important;
  border-radius: 8px!important;
  margin-top: 16px!important;
  font-weight: 600!important;
  text-align: center!important;
  display: none!important;
  position: relative!important;
  z-index: 2!important;
  backdrop-filter: blur(10px)!important;
  border: 1px solid rgba(255, 255, 255, 0.2)!important;
}

.file-upload-status.processing {
  background: rgba(33, 150, 243, 0.8)!important;
  color: #fff!important;
  display: block!important;
  animation: statusSlide 0.3s ease-out!important;
}

.file-upload-status.success {
  background: rgba(76, 175, 80, 0.8)!important;
  color: #fff!important;
  display: block!important;
  animation: statusSlide 0.3s ease-out!important;
}

.file-upload-status.error {
  background: rgba(244, 67, 54, 0.8)!important;
  color: #fff!important;
  display: block!important;
  animation: statusSlide 0.3s ease-out, statusShake 0.6s ease-out 0.3s!important;
}

@keyframes statusSlide {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes statusShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Conteneur des boutons */
.file-upload-buttons {
  display: flex!important;
  flex-wrap: wrap!important;
  justify-content: center!important;
  gap: 12px!important;
  margin-top: 20px!important;
  position: relative!important;
  z-index: 2!important;
}

/* Boutons stylés comme MultiSelect */
.file-upload-btn {
  position: relative!important;
  color: #fff!important;
  padding: 12px 20px!important;
  border-radius: 8px!important;
  font-weight: 700!important;
  letter-spacing: 0.5px!important;
  font-size: 14px!important;
  cursor: pointer!important;
  border: none!important;
  overflow: hidden!important;
  transition: all 0.3s ease!important;
  min-width: 180px!important;
  text-align: center!important;
  display: flex!important;
  align-items: center!important;
  justify-content: center!important;
  backdrop-filter: blur(10px)!important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3)!important;
  flex: 1 1 auto!important;
}

.file-upload-btn.primary {
  background: linear-gradient(145deg, var(--fu-primary), 
              rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.8))!important;
  box-shadow: 0 4px 12px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
              inset 0 2px 0 rgba(255, 255, 255, 0.2)!important;
}

.file-upload-btn.secondary {
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4))!important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
              inset 0 2px 0 rgba(255, 255, 255, 0.1)!important;
}

.file-upload-btn:hover {
  transform: translateY(-2px)!important;
}

.file-upload-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.3)!important;
}

.file-upload-btn.secondary:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.2)!important;
}

.file-upload-btn:active {
  transform: translateY(1px)!important;
}

.file-upload-btn::before {
  content: ''!important;
  position: absolute!important;
  top: -2px!important;
  left: -2px!important;
  width: calc(100% + 4px)!important;
  height: calc(100% + 4px)!important;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)!important;
  transform: translateX(-100%) rotate(45deg)!important;
  transition: transform 0.8s ease!important;
}

.file-upload-btn:hover::before {
  transform: translateX(100%) rotate(45deg)!important;
}

/* Responsive design */
@media (max-width: 768px) {
  .file-upload-container {
    max-width: 95%!important;
    padding: 20px!important;
  }
  
  .file-upload-zone {
    padding: 30px 15px!important;
  }
  
  .file-upload-buttons {
    flex-direction: column!important;
  }
  
  .file-upload-btn {
    min-width: auto!important;
    flex: 1 1 100%!important;
  }
}

/* État désactivé */
.file-upload-container.disabled {
  opacity: 0.6!important;
  pointer-events: none!important;
  filter: grayscale(0.3)!important;
}
      `;

      container.appendChild(styleEl);

      // Titre
      const titleEl = document.createElement('h2');
      titleEl.className = 'file-upload-title';
      titleEl.textContent = title;
      container.appendChild(titleEl);

      // Zone des badges de groupes
      const groupsEl = document.createElement('div');
      groupsEl.className = 'file-upload-groups';
      groupsEl.id = `groups-${uniqueInstanceId}`;
      container.appendChild(groupsEl);

      // Zone d'upload
      const uploadZone = document.createElement('div');
      uploadZone.className = 'file-upload-zone';
      uploadZone.innerHTML = `
        <div class="file-upload-icon">📁</div>
        <div class="file-upload-main-text">${uploadText}</div>
        <div class="file-upload-sub-text">${uploadSubtext}</div>
        <input class="file-upload-input" type="file" id="input-${uniqueInstanceId}" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx">
      `;
      container.appendChild(uploadZone);

      // Zone de statut
      const statusEl = document.createElement('div');
      statusEl.className = 'file-upload-status';
      statusEl.id = `status-${uniqueInstanceId}`;
      container.appendChild(statusEl);

      // Conteneur des boutons
      const buttonsEl = document.createElement('div');
      buttonsEl.className = 'file-upload-buttons';
      buttonsEl.id = `buttons-${uniqueInstanceId}`;

      // Création des boutons
      buttons.forEach((btn, index) => {
        const button = document.createElement('button');
        button.className = `file-upload-btn ${index === 0 ? 'primary' : 'secondary'}`;
        button.textContent = btn.text;
        button.setAttribute('data-action', btn.action);
        button.setAttribute('data-path', btn.path || '');
        
        // Couleur personnalisée si spécifiée
        if (btn.color) {
          const btnRgb = parseInt(btn.color.replace('#',''), 16);
          const btnR = (btnRgb >> 16) & 255;
          const btnG = (btnRgb >> 8) & 255;
          const btnB = btnRgb & 255;
          button.style.background = `linear-gradient(145deg, ${btn.color}, rgba(${btnR}, ${btnG}, ${btnB}, 0.8))`;
          button.style.boxShadow = `0 4px 12px rgba(${btnR}, ${btnG}, ${btnB}, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)`;
        }

        buttonsEl.appendChild(button);
      });

      container.appendChild(buttonsEl);

      // Fonction d'affichage du statut
      const showStatus = (message, type) => {
        statusEl.textContent = message;
        statusEl.className = `file-upload-status ${type}`;
        
        if (type === 'success') {
          setTimeout(() => {
            statusEl.style.display = 'none';
          }, 3000);
        }
      };

      // Fonction pour créer un badge de groupe
      const createGroupBadge = (groupNumber, fileCount) => {
        const badge = document.createElement('div');
        badge.className = 'file-upload-group-badge';
        badge.innerHTML = `
          <span class="badge-icon">📁</span>
          <span class="badge-text">${groupBadgeText} ${groupNumber} (${fileCount} fichier${fileCount > 1 ? 's' : ''})</span>
        `;
        return badge;
      };

      // Fonction pour mettre à jour les variables globales
      const updateGlobalVariables = (newUrls) => {
        // Mise à jour de pdf_link (dernier groupe uploadé)
        if (typeof window !== 'undefined') {
          window.pdf_link = JSON.stringify(newUrls);
          
          // Mise à jour de pdf_linkS (tous les groupes)
          if (!window.pdf_linkS || !Array.isArray(window.pdf_linkS)) {
            window.pdf_linkS = [];
          }
          
          // Ajouter le nouveau groupe
          newUrls.forEach(url => {
            window.pdf_linkS.push(url);
          });
          
          console.log('📁 Variables mises à jour:', {
            pdf_link: window.pdf_link,
            pdf_linkS: window.pdf_linkS
          });
        }
      };

      // Fonction d'upload
      const uploadFiles = async (files) => {
        if (!files.length) return;
        
        // Vérification de la limite
        if (files.length > maxFiles) {
          showStatus(`❌ Maximum ${maxFiles} fichiers autorisés`, 'error');
          return;
        }
        
        // Vérification de la taille des fichiers
        for (let file of files) {
          if (file.size > maxFileSize) {
            showStatus(`❌ ${file.name} est trop volumineux (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`, 'error');
            return;
          }
        }

        uploadZone.classList.add('processing');
        showStatus(`${processingText} (${files.length} fichier${files.length > 1 ? 's' : ''})`, 'processing');

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        try {
          const response = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: formData }
          );

          const result = await response.json();

          if (!response.ok || !Array.isArray(result.urls) || !result.urls.length) {
            throw new Error(result.detail || 'Aucune URL renvoyée');
          }

          // Succès - créer un badge et mettre à jour les variables
          currentGroupCount++;
          const badge = createGroupBadge(currentGroupCount, result.urls.length);
          groupsEl.appendChild(badge);
          
          // Stocker le groupe uploadé
          uploadedGroups.push(result.urls);
          
          // Mettre à jour les variables globales
          updateGlobalVariables(result.urls);

          showStatus(`${successText} (${result.urls.length} fichier${result.urls.length > 1 ? 's' : ''})`, 'success');
          
          // Reset du champ input
          const input = container.querySelector('.file-upload-input');
          if (input) input.value = '';

        } catch (error) {
          console.error('❌ Erreur upload:', error);
          showStatus(`${errorText}: ${error.message}`, 'error');
        } finally {
          uploadZone.classList.remove('processing');
        }
      };

      // Événements de la zone d'upload
      const input = container.querySelector('.file-upload-input');
      
      uploadZone.addEventListener('click', () => input.click());
      input.addEventListener('change', (e) => uploadFiles(e.target.files));

      // Drag & Drop
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadZone.classList.remove('dragover');
          
          if (eventName === 'drop') {
            uploadFiles(e.dataTransfer.files);
          }
        });
      });

      // Événements des boutons
      buttonsEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('file-upload-btn')) return;
        
        const action = e.target.getAttribute('data-action');
        const path = e.target.getAttribute('data-path');
        
        if (action === 'continue') {
          // Rester dans l'extension - ne rien faire de spécial
          console.log('🔄 Continuer dans l\'extension');
          return;
        }
        
        if (action === 'submit') {
          // Sortir de l'extension avec les données
          container.classList.add('disabled');
          
          // Réactiver le chat
          enableChat();
          
          // Préparer les données finales
          const allUploadedFiles = uploadedGroups.flat();
          
          // Envoyer les données à Voiceflow
          setTimeout(() => {
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                success: true,
                action: action,
                path: path,
                totalFiles: allUploadedFiles.length,
                totalGroups: uploadedGroups.length,
                pdf_linkS: allUploadedFiles, // Toutes les URLs pour l'API finale
                buttonPath: path,
                instanceId: uniqueInstanceId
              }
            });
          }, 100);
          
          console.log(`✅ Extension terminée - Path: ${path}, Files: ${allUploadedFiles.length}`);
        }
      });

      // Ajout au DOM
      element.appendChild(container);
      
      console.log(`✅ FileUpload prêt (ID: ${uniqueInstanceId}) - Max ${maxFiles} fichiers`);

    } catch (error) {
      console.error('❌ FileUpload Error:', error);
      
      // Fallback en cas d'erreur
      const errorContainer = document.createElement('div');
      errorContainer.innerHTML = `
        <div style="color: #fff; background: rgba(244, 67, 54, 0.8); padding: 1rem; border-radius: 8px; text-align: center;">
          <p>❌ Erreur lors du chargement de l'extension d'upload</p>
          <p>${error.message}</p>
        </div>
      `;
      element.appendChild(errorContainer);
      
      // Terminer avec erreur
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { success: false, error: error.message }
      });
    }
  }
};

export default FileUpload;
