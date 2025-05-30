/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload – Voiceflow Response Extension Ultra-Stylée   ║
 *  ║                                                           ║
 *  ║  • Zone de drop glassmorphism ultra-moderne               ║
 *  ║  • Animations et effets visuels avancés                  ║
 *  ║  • Gestion complète du chat (désactivé par défaut)       ║
 *  ║  • Image de fond personnalisable                         ║
 *  ║  • Textes entièrement configurables                      ║
 *  ║  • Boutons multiples personnalisables                    ║
 *  ║  • États visuels dynamiques et particules                ║
 *  ║  • Upload progressif avec barre de chargement             ║
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
      // Configuration depuis le payload avec valeurs par défaut
      const {
        title = "Téléversement de fichiers",
        subtitle = "Glissez vos fichiers ou cliquez pour sélectionner",
        dragText = "📁 Relâchez pour téléverser vos fichiers",
        loadingText = "⚡ Téléversement en cours...",
        successText = "✅ Fichiers téléversés avec succès !",
        errorText = "❌ Erreur lors du téléversement",
        primaryColor = '#3778F4',
        secondaryColor = '#9C27B0',
        backgroundImage = null,           // URL de l'image de fond
        chat = false,                     // Chat désactivé par défaut
        chatDisabledText = '🚫 Veuillez téléverser vos fichiers',
        buttons = [                       // Boutons configurables
          { text: "Continuer", path: "Continue", color: "#4CAF50" }
        ],
        allowMultiple = true,             // Autoriser multiple fichiers
        acceptedTypes = "*/*",            // Types de fichiers acceptés
        maxFileSize = 10,                 // Taille max en MB
        maxFiles = 5,                     // Nombre max de fichiers
        showFileList = true,              // Afficher la liste des fichiers
        showProgress = true,              // Afficher la barre de progression
        showParticles = true,             // Effets de particules
        uploadEndpoint = 'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
        instanceId = null                 // ID unique
      } = trace.payload || {};

      // Générer un identifiant unique pour cette instance
      const uniqueInstanceId = instanceId || `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variables d'état
      let isDragging = false;
      let isUploading = false;
      let uploadedFiles = [];
      let chatEnabled = chat; // État initial du chat

      // Traitement de l'image de fond
      let processedBackgroundImage = backgroundImage;
      if (backgroundImage && backgroundImage.includes('[img]') && backgroundImage.includes('[/img]')) {
        processedBackgroundImage = backgroundImage.replace(/\[img\](.*?)\[\/img\]/g, '$1');
      }

      // Récupérer le root pour accéder au chat
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;

      // Fonctions de gestion du chat
      function disableChat() {
        if (isUploading) return; // Ne pas désactiver pendant l'upload
        
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = '.5';
        ic.style.cursor = 'not-allowed';
        ic.setAttribute('title', chatDisabledText);
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = true; ta.setAttribute('title', chatDisabledText); }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) { snd.disabled = true; snd.setAttribute('title', chatDisabledText); }
        chatEnabled = false;
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
        chatEnabled = true;
        
        // Vérification additionnelle
        setTimeout(() => {
          if (!chatEnabled) {
            enableChat();
          }
        }, 100);
      }

      // Initialiser l'état du chat
      if (!chat) disableChat();

      // Container principal avec ID unique
      const container = document.createElement('div');
      container.classList.add('file-upload-container');
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);

      // Extraction des valeurs RGB pour les variables CSS
      const hexToRgba = (hex, opacity) => {
        const num = parseInt(hex.replace('#',''), 16);
        const r = num >> 16;
        const g = (num >> 8) & 0xFF;
        const b = num & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      const primaryRgb = parseInt(primaryColor.replace('#',''), 16);
      const primaryR = (primaryRgb >> 16) & 255;
      const primaryG = (primaryRgb >> 8) & 255;
      const primaryB = primaryRgb & 255;

      const secondaryRgb = parseInt(secondaryColor.replace('#',''), 16);
      const secondaryR = (secondaryRgb >> 16) & 255;
      const secondaryG = (secondaryRgb >> 8) & 255;
      const secondaryB = secondaryRgb & 255;

      // CSS intégré ultra-stylé
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* Variables CSS principales */
.file-upload-container {
  --fu-primary: ${primaryColor};
  --fu-primary-r: ${primaryR};
  --fu-primary-g: ${primaryG};
  --fu-primary-b: ${primaryB};
  --fu-secondary: ${secondaryColor};
  --fu-secondary-r: ${secondaryR};
  --fu-secondary-g: ${secondaryG};
  --fu-secondary-b: ${secondaryB};
  --fu-radius: 16px;
  --fu-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --fu-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  padding: 30px!important;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif!important;
  background: ${processedBackgroundImage ? `
    linear-gradient(135deg, 
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.85),
      rgba(var(--fu-secondary-r), var(--fu-secondary-g), var(--fu-secondary-b), 0.75)),
    url("${processedBackgroundImage}")
  ` : `
    linear-gradient(135deg, 
      rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.85),
      rgba(var(--fu-secondary-r), var(--fu-secondary-g), var(--fu-secondary-b), 0.75))
  `}!important;
  background-size: cover!important;
  background-position: center!important;
  background-repeat: no-repeat!important;
  backdrop-filter: blur(20px)!important;
  -webkit-backdrop-filter: blur(20px)!important;
  border: 2px solid rgba(255, 255, 255, 0.2)!important;
  border-radius: var(--fu-radius)!important;
  box-shadow: var(--fu-shadow),
              inset 0 2px 0 rgba(255, 255, 255, 0.1)!important;
  position: relative!important;
  overflow: hidden!important;
  transition: var(--fu-transition)!important;
  color: #fff!important;
}

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
  animation: scanEffect 6s ease-in-out infinite!important;
}

@keyframes scanEffect {
  0%, 90% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

/* États du container */
.file-upload-container.uploading {
  pointer-events: none!important;
  animation: uploadingPulse 2s ease-in-out infinite!important;
}

.file-upload-container.success {
  border-color: #4CAF50!important;
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.1)!important;
}

.file-upload-container.error {
  border-color: #f44336!important;
  box-shadow: 0 8px 32px rgba(244, 67, 54, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.1)!important;
  animation: errorShake 0.5s ease-in-out 2!important;
}

.file-upload-container.disabled-state {
  opacity: 0.6!important;
  pointer-events: none!important;
  filter: grayscale(0.8)!important;
}

@keyframes uploadingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Header de l'upload */
.file-upload-header {
  text-align: center!important;
  margin-bottom: 30px!important;
  position: relative!important;
  z-index: 2!important;
}

.file-upload-title {
  font-size: 24px!important;
  font-weight: 800!important;
  margin: 0 0 10px 0!important;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.8))!important;
  -webkit-background-clip: text!important;
  background-clip: text!important;
  -webkit-text-fill-color: transparent!important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3)!important;
  letter-spacing: -0.5px!important;
}

.file-upload-subtitle {
  font-size: 16px!important;
  font-weight: 500!important;
  color: rgba(255, 255, 255, 0.9)!important;
  margin: 0!important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3)!important;
}

/* Zone de drop principale */
.file-upload-drop-zone {
  position: relative!important;
  min-height: 200px!important;
  border: 3px dashed rgba(255, 255, 255, 0.3)!important;
  border-radius: 12px!important;
  background: rgba(255, 255, 255, 0.05)!important;
  display: flex!important;
  flex-direction: column!important;
  align-items: center!important;
  justify-content: center!important;
  padding: 40px 20px!important;
  cursor: pointer!important;
  transition: var(--fu-transition)!important;
  margin-bottom: 25px!important;
  backdrop-filter: blur(10px)!important;
  overflow: hidden!important;
}

.file-upload-drop-zone::before {
  content: ''!important;
  position: absolute!important;
  top: 0!important;
  left: 0!important;
  width: 100%!important;
  height: 100%!important;
  background: radial-gradient(circle at center, 
    rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.1) 0%,
    transparent 70%)!important;
  opacity: 0!important;
  transition: opacity 0.3s ease!important;
}

.file-upload-drop-zone:hover::before,
.file-upload-drop-zone.drag-over::before {
  opacity: 1!important;
}

.file-upload-drop-zone:hover {
  border-color: rgba(255, 255, 255, 0.6)!important;
  background: rgba(255, 255, 255, 0.1)!important;
  transform: translateY(-2px)!important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2)!important;
}

.file-upload-drop-zone.drag-over {
  border-color: var(--fu-primary)!important;
  border-style: solid!important;
  background: rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.15)!important;
  transform: scale(1.02)!important;
  box-shadow: 0 0 30px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.4)!important;
}

.file-upload-drop-zone.uploading {
  border-color: #FFA726!important;
  background: rgba(255, 167, 38, 0.1)!important;
  cursor: not-allowed!important;
}

.file-upload-drop-zone.success {
  border-color: #4CAF50!important;
  background: rgba(76, 175, 80, 0.1)!important;
}

.file-upload-drop-zone.error {
  border-color: #f44336!important;
  background: rgba(244, 67, 54, 0.1)!important;
}

/* Icône centrale */
.file-upload-icon {
  font-size: 48px!important;
  margin-bottom: 20px!important;
  opacity: 0.8!important;
  transition: var(--fu-transition)!important;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))!important;
}

.file-upload-drop-zone:hover .file-upload-icon,
.file-upload-drop-zone.drag-over .file-upload-icon {
  transform: scale(1.1) rotate(5deg)!important;
  opacity: 1!important;
}

.file-upload-drop-zone.uploading .file-upload-icon {
  animation: uploadSpin 2s linear infinite!important;
}

@keyframes uploadSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Texte de la zone de drop */
.file-upload-text {
  font-size: 18px!important;
  font-weight: 600!important;
  color: rgba(255, 255, 255, 0.9)!important;
  text-align: center!important;
  line-height: 1.4!important;
  margin: 0!important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3)!important;
  transition: var(--fu-transition)!important;
}

.file-upload-drop-zone.drag-over .file-upload-text {
  transform: scale(1.05)!important;
  color: #fff!important;
}

/* Input fichier caché */
.file-upload-input {
  display: none!important;
}

/* Barre de progression */
.file-upload-progress-container {
  width: 100%!important;
  margin: 20px 0!important;
  display: none!important;
}

.file-upload-progress-container.visible {
  display: block!important;
}

.file-upload-progress-bar {
  width: 100%!important;
  height: 8px!important;
  background: rgba(255, 255, 255, 0.2)!important;
  border-radius: 4px!important;
  overflow: hidden!important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2)!important;
}

.file-upload-progress-fill {
  height: 100%!important;
  width: 0%!important;
  background: linear-gradient(90deg, 
    var(--fu-primary), 
    rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.8))!important;
  transition: width 0.3s ease!important;
  box-shadow: 0 0 10px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.5)!important;
}

.file-upload-progress-text {
  text-align: center!important;
  margin-top: 10px!important;
  font-size: 14px!important;
  font-weight: 600!important;
  color: rgba(255, 255, 255, 0.8)!important;
}

/* Liste des fichiers */
.file-upload-files-container {
  margin: 20px 0!important;
  display: none!important;
}

.file-upload-files-container.visible {
  display: block!important;
}

.file-upload-files-title {
  font-size: 16px!important;
  font-weight: 700!important;
  color: rgba(255, 255, 255, 0.9)!important;
  margin-bottom: 15px!important;
  display: flex!important;
  align-items: center!important;
  gap: 8px!important;
}

.file-upload-file-item {
  display: flex!important;
  align-items: center!important;
  justify-content: space-between!important;
  padding: 12px 16px!important;
  background: rgba(255, 255, 255, 0.1)!important;
  border-radius: 8px!important;
  margin-bottom: 8px!important;
  backdrop-filter: blur(5px)!important;
  border: 1px solid rgba(255, 255, 255, 0.1)!important;
  transition: var(--fu-transition)!important;
}

.file-upload-file-item:hover {
  background: rgba(255, 255, 255, 0.15)!important;
  transform: translateX(5px)!important;
}

.file-upload-file-info {
  display: flex!important;
  flex-direction: column!important;
  gap: 4px!important;
  flex: 1!important;
}

.file-upload-file-name {
  font-size: 14px!important;
  font-weight: 600!important;
  color: #fff!important;
  word-break: break-all!important;
}

.file-upload-file-size {
  font-size: 12px!important;
  color: rgba(255, 255, 255, 0.7)!important;
}

.file-upload-file-status {
  font-size: 20px!important;
  line-height: 1!important;
}

/* Messages de statut */
.file-upload-status {
  padding: 15px 20px!important;
  border-radius: 8px!important;
  margin: 20px 0!important;
  font-weight: 600!important;
  text-align: center!important;
  backdrop-filter: blur(10px)!important;
  border: 1px solid!important;
  display: none!important;
}

.file-upload-status.visible {
  display: block!important;
}

.file-upload-status.loading {
  background: rgba(33, 150, 243, 0.2)!important;
  border-color: #2196F3!important;
  color: #fff!important;
}

.file-upload-status.success {
  background: rgba(76, 175, 80, 0.2)!important;
  border-color: #4CAF50!important;
  color: #fff!important;
}

.file-upload-status.error {
  background: rgba(244, 67, 54, 0.2)!important;
  border-color: #f44336!important;
  color: #fff!important;
}

/* Container des boutons - Style cohérent avec MultiSelect */
.file-upload-buttons-container {
  display: flex!important;
  flex-wrap: wrap!important;
  justify-content: center!important;
  align-items: stretch!important;
  gap: 12px!important;
  padding: 20px 0 0!important;
  width: 100%!important;
}

.file-upload-button-wrapper {
  display: flex!important;
  flex-direction: column!important;
  align-items: center!important;
}

/* Boutons stylés comme MultiSelect */
.file-upload-button {
  position: relative!important;
  background: var(--fu-primary)!important;
  color: #fff!important;
  padding: 14px 24px!important; 
  border-radius: 8px!important;
  font-weight: 700!important; 
  letter-spacing: 0.5px!important;
  font-size: 15px!important;
  line-height: 1.2!important;
  cursor: pointer!important;
  border: none!important;
  overflow: hidden!important;
  transition: all 0.3s ease!important;
  box-shadow: 0 4px 12px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
              inset 0 3px 0 rgba(255, 255, 255, 0.2),
              inset 0 -3px 0 rgba(0, 0, 0, 0.2)!important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 4px rgba(0, 0, 0, 0.2)!important;
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

.file-upload-button:hover {
  transform: translateY(-2px)!important;
  box-shadow: 0 6px 20px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.4),
              inset 0 3px 0 rgba(255, 255, 255, 0.3),
              inset 0 -3px 0 rgba(0, 0, 0, 0.3)!important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 6px rgba(0, 0, 0, 0.3)!important;
}

.file-upload-button:active {
  transform: translateY(1px)!important;
  box-shadow: 0 2px 6px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)!important;
}

.file-upload-button:disabled {
  opacity: 0.5!important;
  cursor: not-allowed!important;
  transform: none!important;
}

/* Effet de scan sci-fi */
.file-upload-button::before {
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

.file-upload-button:hover::before {
  transform: translateX(100%) rotate(45deg)!important;
}

/* Particules (si activées) */
.file-upload-particles {
  position: absolute!important;
  width: 100%!important;
  height: 100%!important;
  pointer-events: none!important;
  overflow: hidden!important;
  z-index: 1!important;
}

.file-upload-particle {
  position: absolute!important;
  width: 4px!important;
  height: 4px!important;
  background: var(--fu-primary)!important;
  border-radius: 50%!important;
  box-shadow: 0 0 6px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.8)!important;
  animation: particleFloat 3s ease-in-out infinite!important;
}

.file-upload-particle:nth-child(odd) {
  animation-delay: -1.5s!important;
  animation-duration: 4s!important;
}

@keyframes particleFloat {
  0% {
    transform: translateY(20px) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
    transform: translateY(-20px) scale(1);
  }
  100% {
    transform: translateY(-50px) scale(0);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .file-upload-container {
    padding: 20px!important;
    max-width: 100%!important;
  }
  
  .file-upload-title {
    font-size: 20px!important;
  }
  
  .file-upload-drop-zone {
    min-height: 160px!important;
    padding: 30px 15px!important;
  }
  
  .file-upload-icon {
    font-size: 36px!important;
  }
  
  .file-upload-text {
    font-size: 16px!important;
  }
  
  .file-upload-buttons-container {
    flex-direction: column!important;
    gap: 8px!important;
  }
  
  .file-upload-button {
    flex: 1 1 100%!important;
    max-width: none!important;
    min-width: auto!important;
  }
}
      `;

      container.appendChild(styleEl);

      // Header
      const header = document.createElement('div');
      header.classList.add('file-upload-header');
      header.innerHTML = `
        <h2 class="file-upload-title">${title}</h2>
        <p class="file-upload-subtitle">${subtitle}</p>
      `;
      container.appendChild(header);

      // Zone de drop principale
      const dropZone = document.createElement('div');
      dropZone.classList.add('file-upload-drop-zone');
      dropZone.innerHTML = `
        <div class="file-upload-icon">📁</div>
        <p class="file-upload-text">${subtitle}</p>
      `;

      // Input fichier caché
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.classList.add('file-upload-input');
      fileInput.id = `file-input-${uniqueInstanceId}`;
      fileInput.multiple = allowMultiple;
      if (acceptedTypes !== "*/*") {
        fileInput.accept = acceptedTypes;
      }

      dropZone.appendChild(fileInput);
      container.appendChild(dropZone);

      // Barre de progression
      if (showProgress) {
        const progressContainer = document.createElement('div');
        progressContainer.classList.add('file-upload-progress-container');
        progressContainer.innerHTML = `
          <div class="file-upload-progress-bar">
            <div class="file-upload-progress-fill"></div>
          </div>
          <div class="file-upload-progress-text">0%</div>
        `;
        container.appendChild(progressContainer);
      }

      // Liste des fichiers
      if (showFileList) {
        const filesContainer = document.createElement('div');
        filesContainer.classList.add('file-upload-files-container');
        filesContainer.innerHTML = `
          <div class="file-upload-files-title">
            <span>📎</span>
            <span>Fichiers sélectionnés</span>
          </div>
          <div class="file-upload-files-list"></div>
        `;
        container.appendChild(filesContainer);
      }

      // Messages de statut
      const statusEl = document.createElement('div');
      statusEl.classList.add('file-upload-status');
      container.appendChild(statusEl);

      // Particules (si activées)
      if (showParticles) {
        const particlesContainer = document.createElement('div');
        particlesContainer.classList.add('file-upload-particles');
        
        // Générer des particules
        for (let i = 0; i < 6; i++) {
          const particle = document.createElement('div');
          particle.classList.add('file-upload-particle');
          particle.style.left = Math.random() * 80 + 10 + '%';
          particle.style.animationDelay = (Math.random() * 3) + 's';
          particlesContainer.appendChild(particle);
        }
        
        container.appendChild(particlesContainer);
      }

      // Boutons
      if (buttons.length > 0) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('file-upload-buttons-container');
        buttonsContainer.id = `buttons-container-${uniqueInstanceId}`;

        buttons.forEach((btn, index) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('file-upload-button-wrapper');

          const button = document.createElement('button');
          button.classList.add('file-upload-button');
          button.textContent = btn.text;
          button.disabled = true; // Désactivé par défaut jusqu'à l'upload

          if (btn.color) {
            const btnRgb = parseInt(btn.color.replace('#',''), 16);
            const btnR = (btnRgb >> 16) & 255;
            const btnG = (btnRgb >> 8) & 255;
            const btnB = btnRgb & 255;
            
            button.style.setProperty('background', btn.color, 'important');
            button.style.setProperty('--fu-primary-r', btnR);
            button.style.setProperty('--fu-primary-g', btnG);
            button.style.setProperty('--fu-primary-b', btnB);
          }

          button.addEventListener('click', () => {
            if (!button.disabled) {
              enableChat();
              container.classList.add('disabled-state');

              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  success: true,
                  urls: uploadedFiles,
                  filesCount: uploadedFiles.length,
                  buttonPath: btn.path || 'Default',
                  buttonText: btn.text,
                  instanceId: uniqueInstanceId
                }
              });

              setTimeout(() => {
                enableChat();
              }, 300);
            }
          });

          wrapper.appendChild(button);
          buttonsContainer.appendChild(wrapper);
        });

        container.appendChild(buttonsContainer);
      }

      // Fonctions utilitaires
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const showStatus = (message, type) => {
        statusEl.textContent = message;
        statusEl.className = `file-upload-status visible ${type}`;
      };

      const hideStatus = () => {
        statusEl.classList.remove('visible');
      };

      const updateProgress = (percentage) => {
        if (showProgress) {
          const progressFill = container.querySelector('.file-upload-progress-fill');
          const progressText = container.querySelector('.file-upload-progress-text');
          if (progressFill && progressText) {
            progressFill.style.width = percentage + '%';
            progressText.textContent = percentage + '%';
          }
        }
      };

      const showProgressBar = () => {
        if (showProgress) {
          const progressContainer = container.querySelector('.file-upload-progress-container');
          if (progressContainer) {
            progressContainer.classList.add('visible');
          }
        }
      };

      const hideProgressBar = () => {
        if (showProgress) {
          const progressContainer = container.querySelector('.file-upload-progress-container');
          if (progressContainer) {
            progressContainer.classList.remove('visible');
            updateProgress(0);
          }
        }
      };

      const addFileToList = (file, status = '⏳') => {
        if (showFileList) {
          const filesList = container.querySelector('.file-upload-files-list');
          const filesContainer = container.querySelector('.file-upload-files-container');
          
          if (filesList && filesContainer) {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-upload-file-item');
            fileItem.setAttribute('data-file-name', file.name);
            
            fileItem.innerHTML = `
              <div class="file-upload-file-info">
                <div class="file-upload-file-name">${file.name}</div>
                <div class="file-upload-file-size">${formatFileSize(file.size)}</div>
              </div>
              <div class="file-upload-file-status">${status}</div>
            `;
            
            filesList.appendChild(fileItem);
            filesContainer.classList.add('visible');
          }
        }
      };

      const updateFileStatus = (fileName, status) => {
        if (showFileList) {
          const fileItem = container.querySelector(`[data-file-name="${fileName}"]`);
          if (fileItem) {
            const statusEl = fileItem.querySelector('.file-upload-file-status');
            if (statusEl) {
              statusEl.textContent = status;
            }
          }
        }
      };

      const enableButtons = () => {
        const allButtons = container.querySelectorAll('.file-upload-button');
        allButtons.forEach(btn => {
          btn.disabled = false;
        });
      };

      // Fonction d'upload
      const uploadFiles = async (files) => {
        if (!files.length) return;
        if (files.length > maxFiles) {
          showStatus(`❌ Maximum ${maxFiles} fichiers autorisés`, 'error');
          return;
        }

        // Vérifier la taille des fichiers
        for (let file of files) {
          if (file.size > maxFileSize * 1024 * 1024) {
            showStatus(`❌ ${file.name} dépasse la taille maximale de ${maxFileSize}MB`, 'error');
            return;
          }
        }

        isUploading = true;
        container.classList.add('uploading');
        dropZone.classList.add('uploading');
        dropZone.querySelector('.file-upload-icon').textContent = '⚡';
        dropZone.querySelector('.file-upload-text').textContent = loadingText;
        
        showStatus(loadingText, 'loading');
        showProgressBar();

        // Ajouter les fichiers à la liste
        if (showFileList) {
          Array.from(files).forEach(file => addFileToList(file, '⏳'));
        }

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        try {
          // Simulation de progression
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            updateProgress(Math.round(progress));
          }, 200);

          const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData
          });

          clearInterval(progressInterval);
          updateProgress(100);

          const result = await response.json();

          if (!response.ok || !Array.isArray(result.urls) || !result.urls.length) {
            throw new Error(result.detail || 'Aucune URL renvoyée');
          }

          // Succès
          uploadedFiles = result.urls;
          container.classList.remove('uploading');
          container.classList.add('success');
          dropZone.classList.remove('uploading');
          dropZone.classList.add('success');
          dropZone.querySelector('.file-upload-icon').textContent = '✅';
          dropZone.querySelector('.file-upload-text').textContent = successText;
          
          showStatus(`${successText} (${result.urls.length} fichier${result.urls.length > 1 ? 's' : ''})`, 'success');

          // Mettre à jour le statut des fichiers
          if (showFileList) {
            Array.from(files).forEach(file => updateFileStatus(file.name, '✅'));
          }

          // Activer les boutons
          enableButtons();

          // Auto-submit si pas de boutons
          if (buttons.length === 0) {
            setTimeout(() => {
              enableChat();
              container.classList.add('disabled-state');

              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  success: true,
                  urls: uploadedFiles,
                  filesCount: uploadedFiles.length,
                  instanceId: uniqueInstanceId
                }
              });
            }, 1500);
          }

        } catch (error) {
          console.error('Upload error:', error);
          
          container.classList.remove('uploading');
          container.classList.add('error');
          dropZone.classList.remove('uploading');
          dropZone.classList.add('error');
          dropZone.querySelector('.file-upload-icon').textContent = '❌';
          dropZone.querySelector('.file-upload-text').textContent = errorText;
          
          showStatus(`${errorText}: ${error.message}`, 'error');
          hideProgressBar();

          // Mettre à jour le statut des fichiers
          if (showFileList) {
            Array.from(files).forEach(file => updateFileStatus(file.name, '❌'));
          }

          // Si pas de boutons, envoyer l'erreur automatiquement
          if (buttons.length === 0) {
            setTimeout(() => {
              enableChat();
              
              window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                  success: false,
                  error: error.message,
                  instanceId: uniqueInstanceId
                }
              });
            }, 2000);
          }
        } finally {
          isUploading = false;
        }
      };

      // Événements
      dropZone.addEventListener('click', () => {
        if (!isUploading) {
          fileInput.click();
        }
      });

      fileInput.addEventListener('change', (e) => {
        uploadFiles(e.target.files);
      });

      // Drag & Drop
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUploading) {
            dropZone.classList.add('drag-over');
            dropZone.querySelector('.file-upload-text').textContent = dragText;
          }
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('drag-over');
          if (eventName === 'drop' && !isUploading) {
            dropZone.querySelector('.file-upload-text').textContent = subtitle;
            uploadFiles(e.dataTransfer.files);
          } else if (eventName === 'dragleave') {
            dropZone.querySelector('.file-upload-text').textContent = subtitle;
          }
        });
      });

      // Observer pour maintenir le chat dans l'état souhaité
      const chatStateObserver = new MutationObserver(() => {
        if (!container.classList.contains('disabled-state') && !isUploading) {
          setTimeout(() => {
            if (chat) {
              enableChat();
            } else {
              disableChat();
            }
          }, 100);
        }
      });

      const chatInputContainer = host.querySelector('.vfrc-input-container');
      if (chatInputContainer) {
        chatStateObserver.observe(chatInputContainer, { 
          attributes: true, 
          subtree: true,
          childList: true
        });
      }

      // Ajout au DOM
      element.appendChild(container);

      // Fonction de nettoyage
      return () => {
        chatStateObserver.disconnect();
      };

      console.log(`✅ FileUpload prêt (ID: ${uniqueInstanceId}) - ${buttons.length} bouton(s), chat: ${chat ? 'activé' : 'désactivé'}`);

    } catch (error) {
      console.error('❌ FileUpload Error:', error);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { 
          success: false, 
          error: 'Erreur interne FileUpload: ' + error.message 
        }
      });
    }
  }
};

export default FileUpload;
