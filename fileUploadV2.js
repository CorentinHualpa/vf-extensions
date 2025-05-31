/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload – Voiceflow Response Extension Avancée       ║
 *  ║                                                           ║
 *  ║  • Upload continu avec accumulation des URLs             ║
 *  ║  • Badges des groupes de fichiers uploadés               ║
 *  ║  • Barres de progression + notifications toast           ║
 *  ║  • Boutons configurables (stay/exit)                     ║
 *  ║  • Validation des types (PDF, DOCX, TXT)                 ║
 *  ║  • Style glassmorphism cohérent                          ║
 *  ║  • Titre et description personnalisables                 ║
 *  ║  • Chat désactivé par défaut                             ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  
  // Activation sur trace file_upload
  match: ({ trace }) => trace.payload?.name === 'file_upload',
  
  render: ({ trace, element }) => {
    try {
      // Configuration depuis le payload
      const {
        title = "Uploadez vos documents",
        description = "Glissez-déposez vos fichiers ou cliquez pour les sélectionner",
        uploadText = "📁 Cliquez ou glissez vos fichiers ici",
        maxFiles = 10,
        allowedTypes = ['pdf', 'docx', 'doc', 'txt'],
        primaryColor = '#9C27B0',
        backgroundImage = null,
        chat = false,
        chatDisabledText = '🚫 Veuillez uploader vos documents',
        successMessage = '✅ Fichier(s) uploadé(s) avec succès !',
        errorMessage = '❌ Erreur lors de l\'upload',
        uploadingMessage = '📤 Upload en cours...',
        buttons = [
          { text: "✅ Terminer et traiter les documents", action: "exit", path: "process_documents" },
          { text: "◀️ Étape précédente", action: "exit", path: "previous_step", color: "#D35400" }
        ],
        instanceId = null,
        // Traitement de l'image de fond
        processedBackgroundImage = backgroundImage && backgroundImage.includes('[img]') && backgroundImage.includes('[/img]')
          ? backgroundImage.replace(/\[img\](.*?)\[\/img\]/g, '$1')
          : backgroundImage
      } = trace.payload || {};

      // Générer un ID unique pour cette instance
      const uniqueInstanceId = instanceId || `fileupload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variables de gestion des uploads
      let uploadGroups = []; // Tableau des groupes uploadés
      let currentGroupIndex = 0;
      let totalFilesUploaded = 0;
      let isUploading = false;
      
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
        ic.style.removeProperty('opacity');
        ic.style.removeProperty('cursor');
        ic.removeAttribute('title');
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = false; ta.removeAttribute('title'); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = false; snd.removeAttribute('title'); }
      }
      
      // Désactiver le chat selon la configuration
      if (!chat) disableChat();

      // Container principal
      const container = document.createElement('div');
      container.classList.add('fileupload-container');
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);
      
      // CSS intégré avec style glassmorphism
      const styleEl = document.createElement('style');
      
      // Extraction des valeurs RGB pour les variables CSS
      const colorRgb = parseInt(primaryColor.replace('#',''), 16);
      const colorR = (colorRgb >> 16) & 255;
      const colorG = (colorRgb >> 8) & 255;
      const colorB = colorRgb & 255;
      
      styleEl.textContent = `
/* Variables CSS principales */
.fileupload-container {
  --fu-primary: ${primaryColor};
  --fu-primary-r: ${colorR};
  --fu-primary-g: ${colorG};
  --fu-primary-b: ${colorB};
  --fu-radius: 12px;
  --fu-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  --fu-heading-fs: 20px;
  --fu-base-fs: 15px;
  --fu-small-fs: 13px;
  --fu-gap: 16px;
}

/* Reset et styles de base */
.fileupload-container, .fileupload-container * { 
  box-sizing: border-box!important; 
}

.fileupload-container {
  display: flex!important;
  flex-direction: column!important;
  width: 100%!important;
  max-width: 600px!important;
  margin: 0 auto!important;
  padding: 24px!important;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif!important;
  color: #fff!important;
  background: ${processedBackgroundImage ? `
    linear-gradient(135deg, 
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.85),
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.75)),
    url("${processedBackgroundImage}")
  ` : `
    linear-gradient(135deg, 
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.9),
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.7))
  `}!important;
  background-size: cover!important;
  background-position: center!important;
  background-repeat: no-repeat!important;
  backdrop-filter: blur(20px)!important;
  -webkit-backdrop-filter: blur(20px)!important;
  border: 2px solid rgba(255, 255, 255, 0.2)!important;
  border-radius: var(--fu-radius)!important;
  box-shadow: var(--fu-shadow), 
              inset 0 2px 0 rgba(255, 255, 255, 0.2)!important;
  position: relative!important;
  overflow: hidden!important;
  transition: all 0.3s ease!important;
}

.fileupload-container:hover {
  transform: translateY(-4px)!important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3),
              inset 0 2px 0 rgba(255, 255, 255, 0.3)!important;
}

/* Titre principal */
.fileupload-title {
  font-size: var(--fu-heading-fs)!important;
  font-weight: 700!important;
  text-align: center!important;
  margin-bottom: 8px!important;
  color: #fff!important;
  letter-spacing: -0.3px!important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3)!important;
}

/* Description */
.fileupload-description {
  font-size: var(--fu-base-fs)!important;
  text-align: center!important;
  margin-bottom: var(--fu-gap)!important;
  color: rgba(255, 255, 255, 0.9)!important;
  line-height: 1.4!important;
}

/* Container des badges de groupes */
.fileupload-groups {
  margin-bottom: var(--fu-gap)!important;
  min-height: 24px!important;
}

.fileupload-groups-title {
  font-size: var(--fu-small-fs)!important;
  font-weight: 600!important;
  margin-bottom: 8px!important;
  color: rgba(255, 255, 255, 0.8)!important;
}

.fileupload-groups-list {
  display: flex!important;
  flex-wrap: wrap!important;
  gap: 8px!important;
}

/* Badges des groupes */
.fileupload-group-badge {
  background: rgba(0, 0, 0, 0.4)!important;
  border: 1px solid rgba(255, 255, 255, 0.3)!important;
  border-radius: 20px!important;
  padding: 6px 12px!important;
  font-size: var(--fu-small-fs)!important;
  font-weight: 600!important;
  color: #fff!important;
  backdrop-filter: blur(10px)!important;
  animation: badgeAppear 0.4s ease-out!important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2)!important;
}

@keyframes badgeAppear {
  0% { opacity: 0; transform: scale(0.8) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Zone d'upload principale */
.fileupload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.4)!important;
  border-radius: var(--fu-radius)!important;
  padding: 40px 20px!important;
  text-align: center!important;
  cursor: pointer!important;
  transition: all 0.3s ease!important;
  background: rgba(0, 0, 0, 0.2)!important;
  backdrop-filter: blur(10px)!important;
  margin-bottom: var(--fu-gap)!important;
  position: relative!important;
  overflow: hidden!important;
}

.fileupload-zone:hover {
  border-color: rgba(255, 255, 255, 0.7)!important;
  background: rgba(0, 0, 0, 0.3)!important;
  transform: translateY(-2px)!important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2)!important;
}

.fileupload-zone.drag-over {
  border-color: #4CAF50!important;
  background: rgba(76, 175, 80, 0.2)!important;
  animation: dragPulse 1s ease-in-out infinite!important;
}

@keyframes dragPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.fileupload-zone.uploading {
  pointer-events: none!important;
  opacity: 0.7!important;
  border-color: var(--fu-primary)!important;
}

/* Input file caché */
.fileupload-input {
  display: none!important;
}

/* Texte de la zone d'upload */
.fileupload-zone-text {
  font-size: var(--fu-base-fs)!important;
  font-weight: 600!important;
  color: #fff!important;
  margin-bottom: 8px!important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3)!important;
}

.fileupload-zone-subtext {
  font-size: var(--fu-small-fs)!important;
  color: rgba(255, 255, 255, 0.7)!important;
  margin-bottom: 12px!important;
}

.fileupload-zone-types {
  font-size: 12px!important;
  color: rgba(255, 255, 255, 0.6)!important;
  font-style: italic!important;
}

/* Container de progression */
.fileupload-progress-container {
  margin: var(--fu-gap) 0!important;
  display: none!important;
}

/* Barre de progression individuelle */
.fileupload-progress-item {
  background: rgba(0, 0, 0, 0.3)!important;
  border-radius: 8px!important;
  padding: 12px!important;
  margin-bottom: 8px!important;
  border: 1px solid rgba(255, 255, 255, 0.2)!important;
  backdrop-filter: blur(10px)!important;
}

.fileupload-progress-filename {
  font-size: var(--fu-small-fs)!important;
  font-weight: 600!important;
  color: #fff!important;
  margin-bottom: 6px!important;
  text-overflow: ellipsis!important;
  overflow: hidden!important;
  white-space: nowrap!important;
}

.fileupload-progress-bar {
  width: 100%!important;
  height: 6px!important;
  background: rgba(255, 255, 255, 0.2)!important;
  border-radius: 3px!important;
  overflow: hidden!important;
  position: relative!important;
}

.fileupload-progress-fill {
  height: 100%!important;
  background: linear-gradient(90deg, var(--fu-primary), #4CAF50)!important;
  border-radius: 3px!important;
  transition: width 0.3s ease!important;
  width: 0%!important;
  box-shadow: 0 0 10px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.5)!important;
}

.fileupload-progress-status {
  font-size: 11px!important;
  color: rgba(255, 255, 255, 0.8)!important;
  margin-top: 4px!important;
  text-align: center!important;
}

/* Notifications toast */
.fileupload-toast {
  position: fixed!important;
  top: 20px!important;
  right: 20px!important;
  padding: 12px 20px!important;
  border-radius: 8px!important;
  color: #fff!important;
  font-weight: 600!important;
  font-size: var(--fu-small-fs)!important;
  z-index: 10000!important;
  backdrop-filter: blur(10px)!important;
  border: 1px solid rgba(255, 255, 255, 0.2)!important;
  animation: toastSlideIn 0.3s ease-out!important;
  max-width: 300px!important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3)!important;
}

.fileupload-toast.success {
  background: linear-gradient(135deg, #4CAF50, #2E7D32)!important;
}

.fileupload-toast.error {
  background: linear-gradient(135deg, #f44336, #d32f2f)!important;
}

.fileupload-toast.info {
  background: linear-gradient(135deg, var(--fu-primary), rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.8))!important;
}

@keyframes toastSlideIn {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes toastSlideOut {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

/* Container des boutons harmonieux */
.fileupload-buttons-container {
  display: flex!important;
  flex-wrap: wrap!important;
  justify-content: center!important;
  align-items: stretch!important;
  gap: 12px!important;
  padding: 16px 0 0!important;
  width: 100%!important;
}

/* BOUTONS HARMONIEUX - Style cohérent avec MultiSelect */
.fileupload-button {
  position: relative!important;
  background: var(--fu-primary)!important;
  color: #fff!important;
  padding: 14px 20px!important; 
  border-radius: 8px!important;
  font-weight: 700!important; 
  letter-spacing: 0.5px!important;
  font-size: 14px!important;
  cursor: pointer!important;
  border: none!important;
  overflow: hidden!important;
  transition: all 0.3s ease!important;
  box-shadow: 0 4px 12px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
              inset 0 3px 0 rgba(255, 255, 255, 0.2),
              inset 0 -3px 0 rgba(0, 0, 0, 0.2)!important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3)!important;
  text-align: center!important;
  display: flex!important;
  align-items: center!important;
  justify-content: center!important;
  flex: 1 1 auto!important;
  min-width: 180px!important;
  max-width: 300px!important;
  height: 50px!important;
  word-wrap: break-word!important;
  white-space: normal!important;
}

/* Responsive : Sur mobile, boutons pleine largeur */
@media (max-width: 768px) {
  .fileupload-buttons-container {
    flex-direction: column!important;
    gap: 8px!important;
  }
  
  .fileupload-button {
    flex: 1 1 100%!important;
    max-width: none!important;
    min-width: auto!important;
  }
}

/* Effet hover */
.fileupload-button:hover {
  transform: translateY(-2px)!important;
  box-shadow: 0 6px 20px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.4),
              inset 0 3px 0 rgba(255, 255, 255, 0.3),
              inset 0 -3px 0 rgba(0, 0, 0, 0.3)!important;
}

/* Effet active (clic) */
.fileupload-button:active {
  transform: translateY(1px)!important;
  box-shadow: 0 2px 6px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)!important;
}

/* Effet de scan sci-fi */
.fileupload-button::before {
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

.fileupload-button:hover::before {
  transform: translateX(100%) rotate(45deg)!important;
}

/* État désactivé après finalisation */
.fileupload-container.completed {
  opacity: 0.8!important;
  pointer-events: none!important;
  filter: grayscale(30%)!important;
}

.fileupload-container.completed::after {
  content: '✅ UPLOAD TERMINÉ'!important;
  position: absolute!important;
  top: 16px!important;
  right: 16px!important;
  background: rgba(76, 175, 80, 0.9)!important;
  color: #fff!important;
  padding: 6px 12px!important;
  border-radius: 16px!important;
  font-size: 12px!important;
  font-weight: 700!important;
  letter-spacing: 0.5px!important;
  border: 1px solid rgba(255, 255, 255, 0.3)!important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2)!important;
}

/* Responsive design */
@media (max-width: 768px) {
  .fileupload-container {
    max-width: 95%!important;
    padding: 20px 16px!important;
  }
  
  .fileupload-zone {
    padding: 30px 16px!important;
  }
  
  .fileupload-title {
    font-size: 18px!important;
  }
}
      `;
      
      container.appendChild(styleEl);

      // Construction de l'interface
      // Titre
      const titleEl = document.createElement('h2');
      titleEl.classList.add('fileupload-title');
      titleEl.textContent = title;
      container.appendChild(titleEl);

      // Description
      const descEl = document.createElement('p');
      descEl.classList.add('fileupload-description');
      descEl.textContent = description;
      container.appendChild(descEl);

      // Container des groupes uploadés
      const groupsContainer = document.createElement('div');
      groupsContainer.classList.add('fileupload-groups');
      
      const groupsTitle = document.createElement('div');
      groupsTitle.classList.add('fileupload-groups-title');
      groupsTitle.textContent = '📁 Documents uploadés:';
      groupsTitle.style.display = 'none'; // Caché initialement
      
      const groupsList = document.createElement('div');
      groupsList.classList.add('fileupload-groups-list');
      
      groupsContainer.appendChild(groupsTitle);
      groupsContainer.appendChild(groupsList);
      container.appendChild(groupsContainer);

      // Zone d'upload
      const uploadZone = document.createElement('div');
      uploadZone.classList.add('fileupload-zone');
      
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.accept = allowedTypes.map(type => `.${type}`).join(',');
      fileInput.classList.add('fileupload-input');
      fileInput.id = `fileInput_${uniqueInstanceId}`;
      
      const zoneText = document.createElement('div');
      zoneText.classList.add('fileupload-zone-text');
      zoneText.textContent = uploadText;
      
      const zoneSubtext = document.createElement('div');
      zoneSubtext.classList.add('fileupload-zone-subtext');
      zoneSubtext.textContent = `Maximum ${maxFiles} fichiers`;
      
      const zoneTypes = document.createElement('div');
      zoneTypes.classList.add('fileupload-zone-types');
      zoneTypes.textContent = `Types autorisés: ${allowedTypes.map(t => t.toUpperCase()).join(', ')}`;
      
      uploadZone.appendChild(fileInput);
      uploadZone.appendChild(zoneText);
      uploadZone.appendChild(zoneSubtext);
      uploadZone.appendChild(zoneTypes);
      container.appendChild(uploadZone);

      // Container de progression
      const progressContainer = document.createElement('div');
      progressContainer.classList.add('fileupload-progress-container');
      container.appendChild(progressContainer);

      // Container des boutons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add('fileupload-buttons-container');
      
      buttons.forEach((btn, index) => {
        const button = document.createElement('button');
        button.classList.add('fileupload-button');
        button.textContent = btn.text;
        button.setAttribute('data-action', btn.action);
        button.setAttribute('data-path', btn.path || '');
        
        if (btn.color) {
          button.style.setProperty('background', btn.color, 'important');
          const rgb = parseInt(btn.color.replace('#',''), 16);
          const r = (rgb >> 16) & 255;
          const g = (rgb >> 8) & 255;
          const b = rgb & 255;
          button.style.setProperty('box-shadow', 
            `0 4px 12px rgba(${r}, ${g}, ${b}, 0.3), inset 0 3px 0 rgba(255, 255, 255, 0.2), inset 0 -3px 0 rgba(0, 0, 0, 0.2)`, 
            'important');
        }
        
        button.addEventListener('click', () => handleButtonClick(btn));
        buttonsContainer.appendChild(button);
      });
      
      container.appendChild(buttonsContainer);

      // Fonctions utilitaires
      function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.classList.add('fileupload-toast', type);
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.style.animation = 'toastSlideOut 0.3s ease-in';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }

      function updateGroupsBadges() {
        groupsList.innerHTML = '';
        
        if (uploadGroups.length > 0) {
          groupsTitle.style.display = 'block';
          
          uploadGroups.forEach((group, index) => {
            const badge = document.createElement('div');
            badge.classList.add('fileupload-group-badge');
            badge.textContent = `Groupe ${index + 1} (${group.files.length} fichier${group.files.length > 1 ? 's' : ''})`;
            groupsList.appendChild(badge);
          });
        } else {
          groupsTitle.style.display = 'none';
        }
      }

      function validateFiles(files) {
        const validFiles = [];
        const errors = [];
        
        for (let file of files) {
          // Vérifier le type
          const extension = file.name.split('.').pop().toLowerCase();
          if (!allowedTypes.includes(extension)) {
            errors.push(`${file.name}: Type non autorisé`);
            continue;
          }
          
          // Vérifier la limite globale
          if (totalFilesUploaded + validFiles.length >= maxFiles) {
            errors.push(`Limite de ${maxFiles} fichiers atteinte`);
            break;
          }
          
          validFiles.push(file);
        }
        
        return { validFiles, errors };
      }

      function createProgressItem(file) {
        const item = document.createElement('div');
        item.classList.add('fileupload-progress-item');
        
        const filename = document.createElement('div');
        filename.classList.add('fileupload-progress-filename');
        filename.textContent = file.name;
        
        const progressBar = document.createElement('div');
        progressBar.classList.add('fileupload-progress-bar');
        
        const progressFill = document.createElement('div');
        progressFill.classList.add('fileupload-progress-fill');
        
        const status = document.createElement('div');
        status.classList.add('fileupload-progress-status');
        status.textContent = 'En attente...';
        
        progressBar.appendChild(progressFill);
        item.appendChild(filename);
        item.appendChild(progressBar);
        item.appendChild(status);
        
        return { item, progressFill, status };
      }

      async function uploadFiles(files) {
        if (isUploading) return;
        
        const { validFiles, errors } = validateFiles(files);
        
        if (errors.length > 0) {
          errors.forEach(error => showToast(error, 'error'));
        }
        
        if (validFiles.length === 0) return;
        
        isUploading = true;
        uploadZone.classList.add('uploading');
        progressContainer.style.display = 'block';
        
        showToast(`${uploadingMessage} (${validFiles.length} fichier${validFiles.length > 1 ? 's' : ''})`, 'info');
        
        const progressItems = [];
        const currentGroup = {
          files: [],
          urls: [],
          timestamp: Date.now()
        };
        
        // Créer les barres de progression
        validFiles.forEach(file => {
          const progressItem = createProgressItem(file);
          progressItems.push(progressItem);
          progressContainer.appendChild(progressItem.item);
        });
        
        try {
          const formData = new FormData();
          validFiles.forEach(file => formData.append('files', file));
          
          // Simuler la progression pour chaque fichier
          const progressPromises = progressItems.map((item, index) => {
            return new Promise(resolve => {
              let progress = 0;
              item.status.textContent = 'Upload en cours...';
              
              const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                
                item.progressFill.style.width = progress + '%';
                
                if (progress >= 90) {
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
            });
          });
          
          // Attendre que toutes les barres atteignent 90%
          await Promise.all(progressPromises);
          
          // Upload réel
          const response = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            {
              method: 'POST',
              body: formData
            }
          );
          
          const result = await response.json();
          
          if (!response.ok || !Array.isArray(result.urls) || !result.urls.length) {
            throw new Error(result.detail || 'Aucune URL renvoyée');
          }
          
          // Finaliser les barres de progression
          progressItems.forEach((item, index) => {
            item.progressFill.style.width = '100%';
            item.status.textContent = '✅ Terminé';
            
            // 🔧 CORRECTION : S'assurer de la structure correcte des objets
            const fileUrl = result.urls[index];
            const fileName = validFiles[index].name;
            
            // Créer un objet structuré pour l'URL
            const fileObject = {
              url: typeof fileUrl === 'string' ? fileUrl : fileUrl.url || fileUrl,
              filename: fileName
            };
            
            console.log(`📄 Fichier ${index + 1}:`, fileObject);
            
            // Ajouter à currentGroup avec la structure correcte
            currentGroup.files.push(validFiles[index]);
            currentGroup.urls.push(fileObject);
          });
          
          // Ajouter le groupe aux uploads
          uploadGroups.push(currentGroup);
          totalFilesUploaded += validFiles.length;
          currentGroupIndex++;
          
          // Mettre à jour l'affichage
          updateGroupsBadges();
          showToast(`${successMessage} (${validFiles.length} fichier${validFiles.length > 1 ? 's' : ''})`, 'success');
          
          // Nettoyer la progression après un délai
          setTimeout(() => {
            progressContainer.innerHTML = '';
            progressContainer.style.display = 'none';
          }, 2000);
          
        } catch (error) {
          console.error('Upload error:', error);
          
          // Marquer toutes les barres comme échouées
          progressItems.forEach(item => {
            item.progressFill.style.width = '0%';
            item.status.textContent = '❌ Échec';
          });
          
          showToast(`${errorMessage}: ${error.message}`, 'error');
          
          setTimeout(() => {
            progressContainer.innerHTML = '';
            progressContainer.style.display = 'none';
          }, 3000);
        }
        
        isUploading = false;
        uploadZone.classList.remove('uploading');
        fileInput.value = ''; // Reset input
      }

      function handleButtonClick(button) {
        if (button.action === 'stay') {
          // Rester dans l'extension - ne rien faire de spécial
          showToast('Continuez à uploader vos documents', 'info');
          return;
        }
        
        if (button.action === 'exit') {
          // Sortir de l'extension
          container.classList.add('completed');
          
          // Préparer les données pour Voiceflow
          const allUrls = uploadGroups.flatMap(group => group.urls);
          const pdf_linkS = allUrls; // Tableau complet pour l'API
          const pdf_link = JSON.stringify(allUrls); // JSON stringifié pour rétrocompatibilité
          
          console.log("🔍 Données préparées :");
          console.log("📋 pdf_linkS (tableau):", pdf_linkS);
          console.log("📋 pdf_link (JSON string):", pdf_link);
          
          // Réactiver le chat si nécessaire
          if (!chat) enableChat();
          
          // Envoyer à Voiceflow
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              success: true,
              pdf_linkS: pdf_linkS,
              pdf_link: pdf_link,
              totalGroups: uploadGroups.length,
              totalFiles: totalFilesUploaded,
              buttonPath: button.path,
              buttonText: button.text,
              instanceId: uniqueInstanceId
            }
          });
          
          showToast('Upload terminé !', 'success');
        }
      }

      // Event listeners
      
      // Clic sur la zone d'upload
      uploadZone.addEventListener('click', () => {
        if (!isUploading) fileInput.click();
      });
      
      // Sélection de fichiers
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          uploadFiles(Array.from(e.target.files));
        }
      });
      
      // Drag & Drop
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUploading) {
            uploadZone.classList.add('drag-over');
          }
        });
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadZone.classList.remove('drag-over');
          
          if (eventName === 'drop' && !isUploading) {
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
              uploadFiles(files);
            }
          }
        });
      });

      // Ajouter au DOM
      element.appendChild(container);
      
      console.log(`✅ FileUpload Extension prêt (ID: ${uniqueInstanceId}) - Max ${maxFiles} fichiers`);
      
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
