// UploadToN8nWithLoader.js - VERSION MULTI-FICHIERS
export const UploadToN8nWithLoader = {
  name: 'UploadToN8nWithLoader',
  type: 'response',
  
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = (s) => /(^ext_)?UploadToN8nWithLoader$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[UploadToN8nWithLoader.match] error:', e);
      return false;
    }
  },

  render({ trace, element }) {
    if (!element) {
      console.error('[UploadToN8nWithLoader] Élément parent introuvable');
      return;
    }

    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    
    // UI upload
    const title            = p.title || 'Téléverser vos documents';
    const subtitle         = p.subtitle || 'PDF ou DOCX - Maximum 25 MB par fichier';
    const description      = p.description || 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner';
    const accept           = p.accept || '.pdf,.docx';
    const maxFileSizeMB    = p.maxFileSizeMB || 25;
    const maxFiles         = p.maxFiles || 10; // ✅ Nouveau paramètre
    
    // 🎨 Couleurs personnalisables
    const primaryColor     = p.primaryColor || '#087095';
    const secondaryColor   = p.secondaryColor || '#003D5C';
    const accentColor      = p.accentColor || '#FF8C00';
    
    // 🎨 Couleurs du loader
    const loaderBgColor    = p.loaderBgColor || secondaryColor;
    const loaderBgColor2   = p.loaderBgColor2 || primaryColor;
    const loaderTextColor  = p.loaderTextColor || '#FFFFFF';
    
    const buttons          = Array.isArray(p.buttons) ? p.buttons : [];
    
    // Webhook n8n
    const webhook          = p.webhook || {};
    const webhookUrl       = webhook.url;
    const webhookMethod    = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders   = webhook.headers || {};
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 60000;
    const webhookRetries   = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    const fileFieldName    = webhook.fileFieldName || 'files'; // ✅ Changé en pluriel
    const extra            = webhook.extra || {};
    
    // Attente / fin
    const awaitResponse    = p.awaitResponse !== false;
    const polling          = p.polling || {};
    const pollingEnabled   = !!polling.enabled;
    const pollingIntervalMs= Number.isFinite(polling.intervalMs) ? polling.intervalMs : 2000;
    const pollingMaxAttempts= Number.isFinite(polling.maxAttempts) ? polling.maxAttempts : 60;
    const pollingHeaders   = polling.headers || {};
    
    const pathSuccess      = p.pathSuccess || 'Default';
    const pathError        = p.pathError || 'Fail';
    
    const vfContext = {
      conversation_id: p.conversation_id || null,
      user_id: p.user_id || null,
      locale: p.locale || null,
    };

    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#fee2e2,#fecaca);border:1px solid #fca5a5;color:#991b1b;font-weight:500">
        ⚠️ Erreur de configuration : <b>webhook.url</b> manquant.
      </div>`;
      element.appendChild(div);
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, error: 'WEBHOOK_URL_MISSING', path: pathError }
        });
      } catch {}
      return;
    }

    // ---------- STYLES MODERNES ----------
    const styles = `
      @keyframes uploadPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .upload-modern-wrap {
        width: 100%;
        max-width: 100%;
        animation: slideUp 0.4s ease-out;
        position: relative;
      }
      .upload-modern-disabled-overlay {
        display: none;
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(3px);
        z-index: 9999;
        border-radius: 20px;
        cursor: not-allowed;
      }
      .upload-modern-disabled-overlay.active {
        display: block;
      }
      .upload-modern-card {
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
        border: 1px solid rgba(0,0,0,0.06);
        position: relative;
        overflow: hidden;
      }
      .upload-modern-header {
        text-align: center;
        margin-bottom: 24px;
        position: relative;
        z-index: 2;
      }
      .upload-modern-title {
        font-size: 22px;
        font-weight: 800;
        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0 0 8px 0;
        letter-spacing: -0.5px;
      }
      .upload-modern-subtitle {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }
      .upload-modern-zone {
        border: 3px dashed transparent;
        background: linear-gradient(white, white) padding-box,
                    linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40) border-box;
        border-radius: 16px;
        padding: 40px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .upload-modern-zone::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}08);
        opacity: 0;
        transition: opacity 0.3s;
      }
      .upload-modern-zone:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px ${primaryColor}30;
        border-color: transparent;
        background: linear-gradient(white, white) padding-box,
                    linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) border-box;
      }
      .upload-modern-zone:hover::before {
        opacity: 1;
      }
      .upload-modern-zone.dragging {
        background: linear-gradient(white, white) padding-box,
                    linear-gradient(135deg, ${primaryColor}, ${accentColor}) border-box;
        transform: scale(1.02);
      }
      .upload-modern-zone.dragging::before {
        opacity: 1;
      }
      .upload-modern-icon {
        font-size: 48px;
        margin-bottom: 12px;
        display: inline-block;
        filter: drop-shadow(0 4px 8px ${primaryColor}40);
      }
      .upload-modern-zone:hover .upload-modern-icon {
        animation: uploadPulse 1.5s infinite;
      }
      .upload-modern-desc {
        font-size: 15px;
        color: #475569;
        font-weight: 600;
        position: relative;
        z-index: 1;
      }
      
      /* ✅ NOUVELLE SECTION : Liste des fichiers */
      .upload-modern-files-list {
        margin-top: 20px;
        display: none;
        flex-direction: column;
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
        padding: 4px;
      }
      .upload-modern-files-list.active {
        display: flex;
      }
      .upload-modern-file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10);
        border-radius: 12px;
        border-left: 4px solid ${primaryColor};
        animation: fadeIn 0.3s ease-out;
        transition: all 0.2s;
      }
      .upload-modern-file-item:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px ${primaryColor}20;
      }
      .upload-modern-file-item-info {
        flex: 1;
        min-width: 0;
      }
      .upload-modern-file-item-name {
        font-weight: 700;
        color: #1e293b;
        font-size: 14px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .upload-modern-file-item-size {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
      .upload-modern-file-item-remove {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.2s;
        font-weight: bold;
      }
      .upload-modern-file-item-remove:hover {
        background: linear-gradient(135deg, #fecaca, #fca5a5);
        transform: scale(1.1);
      }
      .upload-modern-files-count {
        margin-top: 12px;
        padding: 10px;
        background: linear-gradient(135deg, ${accentColor}20, ${accentColor}30);
        border-radius: 8px;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
        color: ${secondaryColor};
      }

      .upload-modern-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        flex-wrap: wrap;
      }
      .upload-modern-btn {
        flex: 1;
        min-width: 120px;
        padding: 14px 24px;
        border-radius: 12px;
        border: none;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        letter-spacing: 0.3px;
      }
      .upload-modern-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
        transform: translateX(-100%);
        transition: transform 0.6s;
      }
      .upload-modern-btn:hover::before {
        transform: translateX(100%);
      }
      .upload-modern-btn-primary {
        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
        color: white;
        box-shadow: 0 4px 12px ${primaryColor}40;
      }
      .upload-modern-btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px ${primaryColor}50;
      }
      .upload-modern-btn-primary:active:not(:disabled) {
        transform: translateY(0);
      }
      .upload-modern-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .upload-modern-btn-secondary {
        background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
        color: #475569;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .upload-modern-btn-secondary:hover:not(:disabled) {
        background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
        transform: translateY(-1px);
      }
      .upload-modern-status {
        margin-top: 16px;
        padding: 12px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        animation: slideUp 0.3s ease-out;
      }
      .upload-modern-status.error {
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        border: 1px solid #fca5a5;
      }
      .upload-modern-status.success {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        border: 1px solid #6ee7b7;
      }
      .upload-modern-status.processing {
        background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
        color: ${secondaryColor};
        border: 1px solid ${primaryColor}60;
      }
      .upload-modern-loader {
        display: none;
        background: linear-gradient(145deg, ${loaderBgColor}, ${loaderBgColor2});
        border-radius: 20px;
        padding: 32px;
        margin-top: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.4s ease-out;
      }
      .upload-modern-loader.active {
        display: block;
      }
      .upload-modern-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      .upload-modern-loader-title {
        color: ${loaderTextColor};
        font-weight: 800;
        font-size: 18px;
        letter-spacing: 0.5px;
        text-align: center;
      }
      .upload-modern-loader-percentage {
        color: ${loaderTextColor};
        font-weight: 900;
        font-size: 32px;
        text-align: center;
      }
      .upload-modern-loader-step {
        color: ${loaderTextColor}CC;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        min-height: 20px;
      }
      .upload-modern-loader-done-btn {
        margin-top: 12px;
        padding: 14px 32px;
        background: ${accentColor};
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 8px 24px ${accentColor}60;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .upload-modern-loader-done-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px ${accentColor}80;
      }
    `;

    // ---------- UI MODERNE ----------
    const root = document.createElement('div');
    root.className = 'upload-modern-wrap';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);

    root.innerHTML += `
      <div class="upload-modern-disabled-overlay"></div>
      
      <div class="upload-modern-card">
        <div class="upload-modern-header">
          <div class="upload-modern-title">${title}</div>
          <div class="upload-modern-subtitle">${subtitle}</div>
        </div>

        <div class="upload-modern-zone">
          <div class="upload-modern-icon">📁</div>
          <div class="upload-modern-desc">${description}</div>
          <input type="file" accept="${accept}" multiple style="display:none" />
        </div>

        <div class="upload-modern-files-list"></div>
        <div class="upload-modern-files-count" style="display:none"></div>

        <div class="upload-modern-actions">
          ${buttons.map(b => `
            <button class="upload-modern-btn upload-modern-btn-secondary back-button" data-path="${b.path || pathError}">
              ${b.text || '← Retour'}
            </button>
          `).join('')}
          <button class="upload-modern-btn upload-modern-btn-primary send-button" disabled>
            Envoyer
          </button>
        </div>

        <div class="upload-modern-status" style="display:none"></div>
      </div>

      <div class="upload-modern-loader">
        <div class="upload-modern-loader-content">
          <div class="upload-modern-loader-title"></div>
          
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.2)" stroke-width="8" fill="none"/>
            <circle class="loader-circle" cx="80" cy="80" r="70" 
                    stroke="${accentColor}" stroke-width="8" fill="none"
                    stroke-linecap="round"
                    transform="rotate(-90 80 80)"
                    stroke-dasharray="440"
                    stroke-dashoffset="440"/>
          </svg>
          <div class="upload-modern-loader-percentage">0%</div>
          <div class="upload-modern-loader-step"></div>
        </div>
      </div>
    `;

    element.appendChild(root);

    // ---------- SÉLECTEURS ----------
    const uploadZone  = root.querySelector('.upload-modern-zone');
    const fileInput   = root.querySelector('input[type="file"]');
    const filesList   = root.querySelector('.upload-modern-files-list');
    const filesCount  = root.querySelector('.upload-modern-files-count');
    const sendBtn     = root.querySelector('.send-button');
    const backButtons = root.querySelectorAll('.back-button');
    const statusDiv   = root.querySelector('.upload-modern-status');
    const loader      = root.querySelector('.upload-modern-loader');
    const loaderTitle = root.querySelector('.upload-modern-loader-title');
    const loaderPct   = root.querySelector('.upload-modern-loader-percentage');
    const loaderStep  = root.querySelector('.upload-modern-loader-step');
    const loaderCircle= root.querySelector('.loader-circle');
    const disabledOverlay = root.querySelector('.upload-modern-disabled-overlay');

    // ---------- STATE ----------
    let selectedFiles = []; // ✅ Tableau de fichiers

    // ---------- FUNCTIONS ----------
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function setStatus(message, type = 'processing') {
      statusDiv.textContent = message;
      statusDiv.className = `upload-modern-status ${type}`;
      statusDiv.style.display = 'block';
    }

    function updateFilesList() {
      filesList.innerHTML = '';
      
      if (selectedFiles.length === 0) {
        filesList.classList.remove('active');
        filesCount.style.display = 'none';
        sendBtn.disabled = true;
        return;
      }

      filesList.classList.add('active');
      filesCount.style.display = 'block';
      
      const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
      filesCount.textContent = `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} sélectionné${selectedFiles.length > 1 ? 's' : ''} (${formatSize(totalSize)})`;

      selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'upload-modern-file-item';
        item.innerHTML = `
          <div class="upload-modern-file-item-info">
            <div class="upload-modern-file-item-name">
              📄 <span>${file.name}</span>
            </div>
            <div class="upload-modern-file-item-size">${formatSize(file.size)}</div>
          </div>
          <button class="upload-modern-file-item-remove" data-index="${index}">×</button>
        `;
        filesList.appendChild(item);
      });

      sendBtn.disabled = false;
      statusDiv.style.display = 'none';

      // Remove buttons
      root.querySelectorAll('.upload-modern-file-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-index'));
          selectedFiles.splice(index, 1);
          updateFilesList();
        });
      });
    }

    function addFiles(newFiles) {
      const validFiles = [];
      const errors = [];

      for (const file of newFiles) {
        // Vérifier la limite de nombre de fichiers
        if (selectedFiles.length + validFiles.length >= maxFiles) {
          errors.push(`Limite de ${maxFiles} fichiers atteinte`);
          break;
        }

        // Vérifier la taille
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
          errors.push(`${file.name} : trop volumineux (${formatSize(file.size)})`);
          continue;
        }

        // Vérifier les doublons
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          errors.push(`${file.name} : déjà ajouté`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        selectedFiles.push(...validFiles);
        updateFilesList();
      }

      if (errors.length > 0) {
        setStatus(`⚠️ ${errors.join(' • ')}`, 'error');
      }
    }

    // ---------- EVENTS ----------
    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragging');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragging');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragging');
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) addFiles(files);
    });

    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      if (files.length) addFiles(files);
      fileInput.value = ''; // Reset pour permettre d'ajouter le même fichier
    });

    backButtons.forEach(b => b.addEventListener('click', () => {
      const path = b.getAttribute('data-path') || pathError;
      try {
        window?.voiceflow?.chat?.interact?.({ 
          type: 'complete', 
          payload: { webhookSuccess: false, path } 
        });
      } catch {}
    }));

    sendBtn.addEventListener('click', async () => {
      if (selectedFiles.length === 0) return;

      sendBtn.disabled = true;
      backButtons.forEach(b => b.disabled = true);
      setStatus(`📤 Envoi de ${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''}...`, 'processing');

      const loaderSteps = p.loader?.steps || [
        { progress: 0, text: '📋 Préparation' },
        { progress: 30, text: '🚀 Envoi' },
        { progress: 60, text: '🔄 Traitement' },
        { progress: 85, text: '✨ Finalisation' },
        { progress: 100, text: '✅ Terminé !' }
      ];

      const loaderUI = showLoader(
        p.loader?.message || `⏳ Traitement de ${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''}...`,
        loaderSteps
      );

      loaderUI.startAutoProgress();

      try {
        const resp = await postToN8n({
          url: webhookUrl,
          method: webhookMethod,
          headers: webhookHeaders,
          timeoutMs: webhookTimeoutMs,
          retries: webhookRetries,
          files: selectedFiles, // ✅ Envoyer tous les fichiers
          fileFieldName,
          extra,
          vfContext
        });

        let finalData = resp?.data ?? null;

        if (awaitResponse && pollingEnabled) {
          const jobId = finalData?.jobId;
          const statusUrl = finalData?.statusUrl || polling?.statusUrl;
          if (statusUrl || jobId) {
            finalData = await pollStatus({
              statusUrl: statusUrl || `${webhookUrl.split('/webhook')[0]}/rest/jobs/${jobId}`,
              headers: pollingHeaders,
              intervalMs: pollingIntervalMs,
              maxAttempts: pollingMaxAttempts
            });
          }
        }

        loaderUI.setProgress(100);
        
        setTimeout(() => {
          loaderUI.showDone(() => {
            try {
              window?.voiceflow?.chat?.interact?.({
                type: 'complete',
                payload: {
                  webhookSuccess: true,
                  webhookResponse: finalData,
                  files: selectedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type
                  })),
                  path: pathSuccess
                }
              });
            } catch {}
          });
        }, 300);

      } catch (err) {
        loader.classList.remove('active');
        setStatus(`❌ ${String(err?.message || err)}`, 'error');
        sendBtn.disabled = false;
        backButtons.forEach(b => b.disabled = false);
        try {
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: { 
              webhookSuccess: false, 
              error: String(err?.message || err), 
              path: pathError 
            }
          });
        } catch {}
      }
    });

    // ---------- LOADER FUNCTION ----------
    function showLoader(message, steps) {
      loaderTitle.textContent = message;
      loader.classList.add('active');
      
      let currentProgress = 0;
      let isComplete = false;
      
      return {
        startAutoProgress() {
          const stepsWithTime = steps.map((s, i) => ({
            ...s,
            duration: i < steps.length - 1 ? 2000 : 0
          }));
          
          let currentStepIndex = 0;
          
          const animate = () => {
            if (isComplete || currentStepIndex >= stepsWithTime.length - 1) return;
            
            const currentStep = stepsWithTime[currentStepIndex];
            const nextStep = stepsWithTime[currentStepIndex + 1];
            
            if (!nextStep) return;
            
            const startProgress = currentStep.progress;
            const endProgress = nextStep.progress;
            const duration = currentStep.duration;
            const startTime = Date.now();
            
            loaderStep.textContent = currentStep.text;
            
            const frame = () => {
              if (isComplete) return;
              
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              currentProgress = startProgress + (endProgress - startProgress) * progress;
              
              const offset = 440 - (currentProgress / 100) * 440;
              loaderCircle.style.strokeDashoffset = offset;
              loaderPct.textContent = `${Math.round(currentProgress)}%`;
              
              if (progress < 1) {
                requestAnimationFrame(frame);
              } else {
                currentStepIndex++;
                if (currentStepIndex < stepsWithTime.length - 1) {
                  animate();
                } else {
                  loaderStep.textContent = stepsWithTime[stepsWithTime.length - 1].text;
                }
              }
            };
            
            requestAnimationFrame(frame);
          };
          
          animate();
        },
        
        setProgress(percent) {
          if (percent >= 100) {
            isComplete = true;
            currentProgress = 100;
            const offset = 440 - (100 / 100) * 440;
            loaderCircle.style.strokeDashoffset = offset;
            loaderPct.textContent = '100%';
            loaderStep.textContent = steps[steps.length - 1].text;
          }
        },
        
        showDone(onClick) {
          this.setProgress(100);
          const btn = document.createElement('button');
          btn.className = 'upload-modern-loader-done-btn';
          btn.innerHTML = `<span style="font-size:24px">${p.loader?.finalButtonIcon || '✅'}</span> ${p.loader?.finalText || 'Continuer'}`;
          btn.onclick = () => {
            disabledOverlay.classList.add('active');
            onClick();
          };
          root.querySelector('.upload-modern-loader-content').appendChild(btn);
        }
      };
    }

    // ---------- NETWORK ----------
    async function postToN8n({ url, method, headers, timeoutMs, retries, files, fileFieldName, extra, vfContext }) {
      let lastErr;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const to = setTimeout(() => controller.abort(), timeoutMs);

          const fd = new FormData();

          // ✅ Ajouter tous les fichiers avec le même nom de champ (n8n les recevra tous)
          files.forEach((file, index) => {
            fd.append(fileFieldName, file, file.name);
          });

          // Ajouter les métadonnées
          Object.entries(extra).forEach(([k, v]) => {
            fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
          });

          if (vfContext.conversation_id) fd.append('conversation_id', vfContext.conversation_id);
          if (vfContext.user_id) fd.append('user_id', vfContext.user_id);
          if (vfContext.locale) fd.append('locale', vfContext.locale);

          const finalHeaders = { ...headers };
          delete finalHeaders['Content-Type'];

          const resp = await fetch(url, {
            method,
            headers: finalHeaders,
            body: fd,
            signal: controller.signal
          });

          clearTimeout(to);

          if (!resp.ok) {
            const text = await safeText(resp);
            throw new Error(`Erreur ${resp.status} : ${text?.slice(0, 200) || resp.statusText}`);
          }

          return { ok: true, data: await safeJson(resp) };
        } catch (e) {
          lastErr = e;
          if (attempt < retries) await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      throw lastErr || new Error('Échec de l\'envoi');
    }

    async function pollStatus({ statusUrl, headers, intervalMs, maxAttempts }) {
      for (let i = 1; i <= maxAttempts; i++) {
        const r = await fetch(statusUrl, { headers });
        if (!r.ok) throw new Error(`Polling ${r.status}`);
        const j = await safeJson(r);
        if (j?.status === 'done') return j?.data ?? j;
        if (j?.status === 'error') throw new Error(j?.error || 'Erreur pipeline');
        await new Promise(res => setTimeout(res, intervalMs));
      }
      throw new Error('Polling timeout');
    }

    async function safeJson(r) { try { return await r.json(); } catch { return null; } }
    async function safeText(r) { try { return await r.text(); } catch { return null; } }
  }
};

try { window.UploadToN8nWithLoader = UploadToN8nWithLoader; } catch {}
