// UploadToN8nWithLoader.js – v5.0 CLEAN DESIGN
// © Corentin – Version épurée style Infortive
// Compatible mode embedded ET widget
//
export const UploadToN8nWithLoader = {
  name: 'UploadToN8nWithLoader',
  type: 'response',
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = s => /(^ext_)?UploadToN8nWithLoader$/i.test(s || '');
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
    
    // ✅ FONCTION POUR TROUVER LE CONTENEUR CHAT
    const findChatContainer = () => {
      let container = document.querySelector('#voiceflow-chat-container');
      if (container?.shadowRoot) return container;
      
      container = document.querySelector('#voiceflow-chat');
      if (container?.shadowRoot) return container;
      
      const allWithShadow = document.querySelectorAll('*');
      for (const el of allWithShadow) {
        if (el.shadowRoot?.querySelector('[class*="vfrc"]')) return el;
      }
      return null;
    };
    
    // ✅ FONCTION POUR DÉSACTIVER LE CHAT
    const disableChatInput = () => {
      const container = findChatContainer();
      if (!container?.shadowRoot) return null;
      
      const shadowRoot = container.shadowRoot;
      const textarea = 
        shadowRoot.querySelector('textarea.vfrc-chat-input') ||
        shadowRoot.querySelector('textarea[id^="vf-chat-input"]') ||
        shadowRoot.querySelector('textarea');
      
      const sendBtn = 
        shadowRoot.querySelector('#vfrc-send-message') ||
        shadowRoot.querySelector('button.vfrc-chat-input__send') ||
        shadowRoot.querySelector('button[type="submit"]');
      
      if (textarea) {
        const originalPlaceholder = textarea.placeholder;
        textarea.disabled = true;
        textarea.style.opacity = '0.5';
        textarea.style.cursor = 'not-allowed';
        textarea.placeholder = 'Veuillez d\'abord charger vos documents...';
        
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.style.opacity = '0.5';
          sendBtn.style.cursor = 'not-allowed';
        }
        
        return { container, textarea, sendBtn, originalPlaceholder };
      }
      return null;
    };
    
    // ✅ FONCTION POUR RÉACTIVER LE CHAT
    const enableChatInput = (chatRefs) => {
      if (!chatRefs?.container?.shadowRoot) return false;
      
      const { textarea, sendBtn, originalPlaceholder } = chatRefs;
      
      if (textarea) {
        textarea.disabled = false;
        textarea.style.opacity = '1';
        textarea.style.cursor = 'text';
        textarea.placeholder = originalPlaceholder || 'Message...';
      }
      
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
        sendBtn.style.cursor = 'pointer';
      }
      
      if (textarea) {
        setTimeout(() => { textarea.focus(); textarea.blur(); }, 100);
      }
      
      return true;
    };
    
    const chatRefs = disableChatInput();
    
    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    const title         = p.title || '';
    const subtitle      = p.subtitle || '';
    const description   = p.description || 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner';
    const accept        = p.accept || '.pdf,.docx';
    const maxFileSizeMB = p.maxFileSizeMB || 25;
    const maxFiles      = p.maxFiles || 10;
    
    // ═══════════════════════════════════════════════════════════════
    // 🎨 PALETTE INFORTIVE - FOND BLANC
    // ═══════════════════════════════════════════════════════════════
    const colors = {
      primary: '#1E2A4A',      // Bleu marine Infortive
      accent: '#C4954A',       // Or/bronze
      accentHover: '#B8860B',  // Or plus foncé au hover
      text: '#1E2A4A',         // Texte principal
      textMuted: '#6B7280',    // Texte secondaire
      border: '#E5E7EB',       // Bordures
      borderHover: '#D1D5DB',  // Bordures hover
      bgSubtle: '#F9FAFB',     // Fond très léger
      white: '#FFFFFF',
      success: '#059669',      // Vert succès
      error: '#DC2626',        // Rouge erreur
      warning: '#D97706',      // Orange warning
    };
    
    const buttons = Array.isArray(p.buttons) ? p.buttons : [];
    
    const webhook          = p.webhook || {};
    const webhookUrl       = webhook.url;
    const webhookMethod    = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders   = webhook.headers || {};
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 60000;
    const webhookRetries   = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    const fileFieldName    = webhook.fileFieldName || 'files';
    const extra            = webhook.extra || {};
    
    // Logique minFiles
    let requiredFiles;
    let isSimpleMode = false;
    let isOBMS = false;
    
    if (p.minFiles !== undefined && p.minFiles !== null) {
      requiredFiles = Math.max(1, Math.min(Number(p.minFiles) || 1, maxFiles));
      isSimpleMode = true;
    } else {
      const obmsValue = (extra.obms || 'non').toLowerCase().trim();
      isOBMS = obmsValue === 'oui';
      requiredFiles = isOBMS ? 2 : 3;
    }
    
    const awaitResponse      = p.awaitResponse !== false;
    const polling            = p.polling || {};
    const pollingEnabled     = !!polling.enabled;
    const pollingIntervalMs  = Number.isFinite(polling.intervalMs) ? polling.intervalMs : 2000;
    const pollingMaxAttempts = Number.isFinite(polling.maxAttempts) ? polling.maxAttempts : 120;
    const pollingHeaders     = polling.headers || {};
    
    const pathSuccess = p.pathSuccess || 'Default';
    const pathError   = p.pathError || 'Fail';
    
    const vfContext = {
      conversation_id: p.conversation_id || null,
      user_id: p.user_id || null,
      locale: p.locale || null,
    };
    
    const loaderCfg = p.loader || {};
    const loaderMode = (loaderCfg.mode || 'auto').toLowerCase();
    const minLoadingTimeMs = Number(loaderCfg.minLoadingTimeMs) > 0 ? Number(loaderCfg.minLoadingTimeMs) : 0;
    const autoCloseDelayMs = Number(loaderCfg.autoCloseDelayMs) > 0 ? Number(loaderCfg.autoCloseDelayMs) : 1500;
    
    const defaultAutoSteps = [
      { progress: 0,  text: 'Préparation' },
      { progress: 30, text: 'Envoi en cours' },
      { progress: 60, text: 'Traitement' },
      { progress: 85, text: 'Finalisation' },
      { progress: 100,text: 'Terminé' }
    ];
    
    const timedPhases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : [];
    const totalSeconds = Number(loaderCfg.totalSeconds) > 0 ? Number(loaderCfg.totalSeconds) : 120;
    
    const stepMap = loaderCfg.stepMap || {
      upload:      { text: 'Téléversement',            progress: 10 },
      sign_url:    { text: 'Signature URL sécurisée',  progress: 18 },
      ocr_annot:   { text: 'OCR (annotation)',         progress: 35 },
      ocr_classic: { text: 'OCR (fallback)',           progress: 42 },
      merge:       { text: 'Fusion & agrégation',      progress: 55 },
      combine:     { text: 'Préparation des documents',progress: 62 },
      ai_agent:    { text: 'Analyse RH avancée',       progress: 82 },
      gdoc_prep:   { text: 'Préparation Google Doc',   progress: 88 },
      gdrive_copy: { text: 'Copie dans Google Drive',  progress: 93 },
      gdoc_update: { text: 'Mise à jour du document',  progress: 97 }
    };
    
    const loaderMsg = loaderCfg.message || 'Traitement en cours...';
    
    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;border-radius:8px;background:${colors.bgSubtle};border:1px solid ${colors.error};color:${colors.error};font-weight:500;font-size:14px">
        Erreur de configuration : webhook.url manquant.
      </div>`;
      element.appendChild(div);
      enableChatInput(chatRefs);
      return;
    }
    
    const hasTitle = title && title.trim() !== '';
    const hasSubtitle = subtitle && subtitle.trim() !== '';
    const showHeader = hasTitle || hasSubtitle;
    
    // Message informatif
    let requiredDocsInfo;
    let docsListOBMS, docsListFull;
    
    if (isSimpleMode) {
      if (requiredFiles === 1) {
        requiredDocsInfo = `1 à ${maxFiles} fichiers acceptés`;
      } else {
        requiredDocsInfo = `${requiredFiles} à ${maxFiles} fichiers acceptés`;
      }
    } else {
      docsListOBMS = '• Lettre de mission / Descriptif du poste\n• CV du candidat';
      docsListFull = '• Lettre de mission / Descriptif du poste\n• CV du candidat\n• Profil AssessFirst du candidat';
      requiredDocsInfo = isOBMS 
        ? `Mode OBMS : ${requiredFiles} documents requis`
        : `${requiredFiles} documents requis`;
    }
    
    // ---------- STYLES ÉPURÉS ----------
    const styles = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .upload-wrap {
        width: 100%;
        max-width: 100%;
        animation: fadeIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .upload-card {
        background: ${colors.white};
        border-radius: 12px;
        padding: 24px;
        border: 1px solid ${colors.border};
      }
      
      .upload-header {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .upload-title {
        font-size: 18px;
        font-weight: 600;
        color: ${colors.primary};
        margin: 0 0 4px 0;
        letter-spacing: -0.3px;
      }
      
      .upload-subtitle {
        font-size: 13px;
        color: ${colors.textMuted};
        font-weight: 400;
      }
      
      .upload-zone {
        border: 2px dashed ${colors.border};
        border-radius: 8px;
        padding: 32px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${colors.white};
      }
      
      .upload-zone:hover {
        border-color: ${colors.accent};
        background: ${colors.bgSubtle};
      }
      
      .upload-zone.dragging {
        border-color: ${colors.accent};
        background: rgba(196, 149, 74, 0.05);
      }
      
      .upload-zone-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 12px;
        color: ${colors.textMuted};
      }
      
      .upload-zone:hover .upload-zone-icon {
        color: ${colors.accent};
      }
      
      .upload-zone-text {
        font-size: 14px;
        color: ${colors.textMuted};
        font-weight: 500;
      }
      
      .upload-info {
        margin-top: 12px;
        padding: 8px 12px;
        background: ${colors.bgSubtle};
        border-radius: 6px;
        font-size: 12px;
        color: ${colors.textMuted};
        text-align: center;
      }
      
      .upload-files-list {
        margin-top: 16px;
        display: none;
        flex-direction: column;
        gap: 8px;
      }
      
      .upload-files-list.active {
        display: flex;
      }
      
      .upload-file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: ${colors.bgSubtle};
        border-radius: 8px;
        border: 1px solid ${colors.border};
        animation: fadeIn 0.2s ease-out;
      }
      
      .upload-file-info {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1;
      }
      
      .upload-file-icon {
        width: 20px;
        height: 20px;
        color: ${colors.accent};
        flex-shrink: 0;
      }
      
      .upload-file-details {
        min-width: 0;
      }
      
      .upload-file-name {
        font-weight: 500;
        color: ${colors.text};
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .upload-file-size {
        font-size: 11px;
        color: ${colors.textMuted};
        margin-top: 2px;
      }
      
      .upload-file-remove {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: ${colors.textMuted};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      
      .upload-file-remove:hover {
        background: rgba(220, 38, 38, 0.1);
        color: ${colors.error};
      }
      
      .upload-count {
        margin-top: 12px;
        padding: 8px 12px;
        background: ${colors.bgSubtle};
        border-radius: 6px;
        text-align: center;
        font-size: 12px;
        font-weight: 500;
        color: ${colors.textMuted};
        display: none;
      }
      
      .upload-count.ready {
        background: rgba(5, 150, 105, 0.08);
        color: ${colors.success};
      }
      
      .upload-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
      }
      
      .upload-btn {
        flex: 1;
        padding: 12px 20px;
        border-radius: 8px;
        border: none;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      
      .upload-btn-primary {
        background: ${colors.accent};
        color: ${colors.white};
      }
      
      .upload-btn-primary:hover:not(:disabled) {
        background: ${colors.accentHover};
      }
      
      .upload-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .upload-btn-secondary {
        background: ${colors.bgSubtle};
        color: ${colors.text};
        border: 1px solid ${colors.border};
      }
      
      .upload-btn-secondary:hover:not(:disabled) {
        background: ${colors.border};
      }
      
      .upload-status {
        margin-top: 12px;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        text-align: center;
        display: none;
        animation: fadeIn 0.2s ease-out;
      }
      
      .upload-status.error {
        background: rgba(220, 38, 38, 0.08);
        color: ${colors.error};
      }
      
      .upload-status.success {
        background: rgba(5, 150, 105, 0.08);
        color: ${colors.success};
      }
      
      .upload-status.processing {
        background: rgba(196, 149, 74, 0.08);
        color: ${colors.accent};
      }
      
      .upload-status.warning {
        background: rgba(217, 119, 6, 0.08);
        color: ${colors.warning};
      }
      
      /* LOADER */
      .upload-loader {
        display: none;
        background: ${colors.white};
        border-radius: 12px;
        padding: 32px;
        margin-top: 16px;
        border: 1px solid ${colors.border};
        animation: fadeIn 0.3s ease-out;
      }
      
      .upload-loader.active {
        display: block;
      }
      
      .upload-loader.closing {
        animation: fadeOut 0.3s ease-out;
      }
      
      .upload-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      
      .upload-loader-title {
        color: ${colors.text};
        font-weight: 600;
        font-size: 16px;
        text-align: center;
      }
      
      .upload-loader-ring {
        position: relative;
        width: 120px;
        height: 120px;
      }
      
      .upload-loader-ring svg {
        transform: rotate(-90deg);
      }
      
      .upload-loader-ring-bg {
        fill: none;
        stroke: ${colors.border};
        stroke-width: 8;
      }
      
      .upload-loader-ring-progress {
        fill: none;
        stroke: ${colors.accent};
        stroke-width: 8;
        stroke-linecap: round;
        stroke-dasharray: 339.292;
        stroke-dashoffset: 339.292;
        transition: stroke-dashoffset 0.3s ease;
      }
      
      .upload-loader-percent {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        font-weight: 700;
        color: ${colors.primary};
      }
      
      .upload-loader-step {
        font-size: 14px;
        color: ${colors.textMuted};
        text-align: center;
        min-height: 20px;
      }
      
      /* VALIDATION ERROR */
      .upload-validation-error {
        margin-top: 16px;
        padding: 20px;
        background: rgba(217, 119, 6, 0.08);
        border: 1px solid rgba(217, 119, 6, 0.2);
        border-radius: 8px;
        text-align: center;
        animation: fadeIn 0.2s ease-out;
      }
      
      .upload-validation-title {
        font-weight: 600;
        color: ${colors.warning};
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .upload-validation-message {
        color: ${colors.text};
        font-size: 13px;
        white-space: pre-line;
        margin-bottom: 16px;
        line-height: 1.5;
        text-align: left;
      }
      
      .upload-validation-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      
      .upload-disabled-overlay {
        display: none;
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 100;
        border-radius: 12px;
        align-items: center;
        justify-content: center;
      }
      
      .upload-disabled-overlay.active {
        display: flex;
      }
      
      .upload-disabled-overlay::after {
        content: 'Traitement en cours...';
        font-size: 14px;
        font-weight: 500;
        color: ${colors.textMuted};
      }
    `;
    
    // ---------- ICÔNES SVG ----------
    const icons = {
      upload: `<svg class="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 16V4m0 0L8 8m4-4l4 4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      file: `<svg class="upload-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      remove: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    };
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = 'upload-wrap';
    root.style.position = 'relative';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    let headerHTML = '';
    if (showHeader) {
      headerHTML = `<div class="upload-header">`;
      if (hasTitle) headerHTML += `<div class="upload-title">${title}</div>`;
      if (hasSubtitle) headerHTML += `<div class="upload-subtitle">${subtitle}</div>`;
      headerHTML += `</div>`;
    }
    
    root.innerHTML += `
      <div class="upload-disabled-overlay"></div>
      <div class="upload-card">
        ${headerHTML}
        <div class="upload-zone">
          ${icons.upload}
          <div class="upload-zone-text">${description}</div>
          <input type="file" accept="${accept}" multiple style="display:none" />
        </div>
        <div class="upload-info">${requiredDocsInfo}</div>
        <div class="upload-files-list"></div>
        <div class="upload-count"></div>
        <div class="upload-actions">
          ${buttons.map(b => `
            <button class="upload-btn upload-btn-secondary back-button" data-path="${b.path || pathError}">
              ${b.text || 'Retour'}
            </button>
          `).join('')}
          <button class="upload-btn upload-btn-primary send-button" disabled>Envoyer</button>
        </div>
        <div class="upload-status"></div>
      </div>
      <div class="upload-loader">
        <div class="upload-loader-content">
          <div class="upload-loader-title"></div>
          <div class="upload-loader-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle class="upload-loader-ring-bg" cx="60" cy="60" r="54"/>
              <circle class="upload-loader-ring-progress" cx="60" cy="60" r="54"/>
            </svg>
            <div class="upload-loader-percent">0%</div>
          </div>
          <div class="upload-loader-step"></div>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const uploadZone   = root.querySelector('.upload-zone');
    const fileInput    = root.querySelector('input[type="file"]');
    const filesList    = root.querySelector('.upload-files-list');
    const filesCount   = root.querySelector('.upload-count');
    const sendBtn      = root.querySelector('.send-button');
    const backButtons  = root.querySelectorAll('.back-button');
    const statusDiv    = root.querySelector('.upload-status');
    const loader       = root.querySelector('.upload-loader');
    const loaderTitle  = root.querySelector('.upload-loader-title');
    const loaderPct    = root.querySelector('.upload-loader-percent');
    const loaderStep   = root.querySelector('.upload-loader-step');
    const loaderCircle = root.querySelector('.upload-loader-ring-progress');
    const disabledOverlay = root.querySelector('.upload-disabled-overlay');
    const card         = root.querySelector('.upload-card');
    
    // ---------- STATE ----------
    let selectedFiles = [];
    let timedTimer = null;
    
    // ---------- Helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const circumference = 2 * Math.PI * 54; // 339.292
    
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    function setStatus(message, type = 'processing') {
      statusDiv.textContent = message;
      statusDiv.className = `upload-status ${type}`;
      statusDiv.style.display = 'block';
    }
    
    function clearValidationError() {
      const existingError = root.querySelector('.upload-validation-error');
      if (existingError) existingError.remove();
    }
    
    function updateFilesList() {
      filesList.innerHTML = '';
      clearValidationError();
      statusDiv.style.display = 'none';
      
      if (!selectedFiles.length) {
        filesList.classList.remove('active');
        filesCount.style.display = 'none';
        sendBtn.disabled = true;
        return;
      }
      
      filesList.classList.add('active');
      filesCount.style.display = 'block';
      const totalSize = selectedFiles.reduce((s, f) => s + f.size, 0);
      
      const hasEnoughFiles = selectedFiles.length >= requiredFiles;
      
      filesCount.classList.toggle('ready', hasEnoughFiles);
      
      if (isSimpleMode) {
        filesCount.textContent = `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} sélectionné${selectedFiles.length > 1 ? 's' : ''} (${formatSize(totalSize)})`;
      } else {
        filesCount.textContent = `${selectedFiles.length}/${requiredFiles} fichier${selectedFiles.length > 1 ? 's' : ''} (${formatSize(totalSize)})`;
      }
      
      selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'upload-file-item';
        item.innerHTML = `
          <div class="upload-file-info">
            ${icons.file}
            <div class="upload-file-details">
              <div class="upload-file-name">${file.name}</div>
              <div class="upload-file-size">${formatSize(file.size)}</div>
            </div>
          </div>
          <button class="upload-file-remove" data-index="${i}">${icons.remove}</button>
        `;
        filesList.appendChild(item);
      });
      
      root.querySelectorAll('.upload-file-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-index'));
          selectedFiles.splice(i, 1);
          updateFilesList();
        });
      });
      
      sendBtn.disabled = selectedFiles.length < requiredFiles;
      
      if (selectedFiles.length > 0 && selectedFiles.length < requiredFiles && !isSimpleMode) {
        const missing = requiredFiles - selectedFiles.length;
        setStatus(`Il manque encore ${missing} fichier${missing > 1 ? 's' : ''}`, 'warning');
      }
    }
    
    function addFiles(newFiles) {
      const valid = [], errs = [];
      for (const file of newFiles) {
        if (selectedFiles.length + valid.length >= maxFiles) {
          errs.push(`Limite de ${maxFiles} fichiers atteinte`);
          break;
        }
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
          errs.push(`${file.name} : trop volumineux`);
          continue;
        }
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          errs.push(`${file.name} : déjà ajouté`);
          continue;
        }
        valid.push(file);
      }
      if (valid.length) {
        selectedFiles.push(...valid);
        updateFilesList();
      }
      if (errs.length) setStatus(errs.join(' • '), 'error');
    }
    
    function validateBeforeSend() {
      if (isSimpleMode) {
        return selectedFiles.length >= requiredFiles;
      }
      
      if (selectedFiles.length < requiredFiles) {
        const docsList = isOBMS ? docsListOBMS : docsListFull;
        const missing = requiredFiles - selectedFiles.length;
        
        clearValidationError();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'upload-validation-error';
        errorDiv.innerHTML = `
          <div class="upload-validation-title">Documents insuffisants</div>
          <div class="upload-validation-message">Vous avez sélectionné ${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''}, mais ${requiredFiles} sont requis.

Documents attendus :
${docsList}

Il manque ${missing} fichier${missing > 1 ? 's' : ''}.</div>
          <div class="upload-validation-actions">
            <button class="upload-btn upload-btn-secondary" data-action="back">Retour</button>
            <button class="upload-btn upload-btn-primary" data-action="add">Ajouter des fichiers</button>
          </div>
        `;
        
        card.appendChild(errorDiv);
        
        errorDiv.querySelector('[data-action="back"]').addEventListener('click', () => {
          enableChatInput(chatRefs);
          try {
            window?.voiceflow?.chat?.interact?.({
              type: 'complete',
              payload: { webhookSuccess: false, buttonPath: 'back' }
            });
          } catch (e) {}
        });
        
        errorDiv.querySelector('[data-action="add"]').addEventListener('click', () => {
          clearValidationError();
          fileInput.click();
        });
        
        return false;
      }
      return true;
    }
    
    // ---------- Events ----------
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('dragging');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('dragging');
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) addFiles(files);
    });
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      if (files.length) addFiles(files);
      fileInput.value = '';
    });
    
    backButtons.forEach(b => b.addEventListener('click', () => {
      const path = b.getAttribute('data-path') || pathError;
      enableChatInput(chatRefs);
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, buttonPath: path }
        });
      } catch {}
    }));
    
    sendBtn.addEventListener('click', async () => {
      if (!selectedFiles.length) return;
      
      if (!validateBeforeSend()) {
        return;
      }
      
      root.style.pointerEvents = 'none';
      disabledOverlay.classList.add('active');
      clearValidationError();
      
      sendBtn.disabled = true;
      backButtons.forEach(b => b.disabled = true);
      setStatus(`Envoi de ${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''}...`, 'processing');
      
      const startTime = Date.now();
      
      const loaderUI = showLoader(loaderMsg);
      if (loaderMode === 'auto') {
        loaderUI.startAuto(defaultAutoSteps);
      } else if (loaderMode === 'timed') {
        loaderUI.startTimed(buildTimedPlan());
      } else {
        loaderUI.showPhase('Démarrage...');
        loaderUI.setPercent(5);
      }
      
      try {
        const resp = await postToN8n({
          url: webhookUrl,
          method: webhookMethod,
          headers: webhookHeaders,
          timeoutMs: webhookTimeoutMs,
          retries: webhookRetries,
          files: selectedFiles,
          fileFieldName,
          extra,
          vfContext
        });
        
        let finalData = resp?.data ?? null;
        
        if (awaitResponse && pollingEnabled) {
          const jobId = finalData?.jobId;
          const statusUrl = finalData?.statusUrl || p?.polling?.statusUrl;
          if (statusUrl || jobId) {
            finalData = await pollStatus({
              statusUrl: statusUrl || `${webhookUrl.split('/webhook')[0]}/rest/jobs/${jobId}`,
              headers: pollingHeaders,
              intervalMs: pollingIntervalMs,
              maxAttempts: pollingMaxAttempts,
              onTick: (st) => {
                if (loaderMode === 'external') {
                  const pct = Number.isFinite(st?.percent) ? clamp(st.percent, 0, 100) : undefined;
                  const key = st?.phase;
                  const map = key && stepMap[key] ? stepMap[key] : null;
                  const text = st?.message || map?.text || undefined;
                  if (text) loaderUI.showPhase(text);
                  if (pct != null) loaderUI.setPercent(pct);
                  else if (map?.progress != null) loaderUI.softPercent(map.progress);
                } else if (loaderMode === 'timed') {
                  if (st?.phase && stepMap[st.phase]?.text) loaderUI.showPhase(stepMap[st.phase].text);
                }
              }
            });
          }
        }
        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minLoadingTimeMs - elapsedTime;
        
        if (remainingTime > 0) {
          loaderUI.showPhase('Finalisation...');
          loaderUI.animateTo(98, Math.min(remainingTime, 1500));
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        loaderUI.finish(finalData, chatRefs);
        
      } catch (err) {
        loader.classList.remove('active');
        setStatus(String(err?.message || err), 'error');
        sendBtn.disabled = false;
        backButtons.forEach(b => b.disabled = false);
        root.style.pointerEvents = 'auto';
        disabledOverlay.classList.remove('active');
        
        enableChatInput(chatRefs);
        
        try {
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: { webhookSuccess: false, error: String(err?.message || err), buttonPath: 'error' }
          });
        } catch {}
      }
    });
    
    // ---------- Loader controller ----------
    function showLoader(message) {
      loaderTitle.textContent = message;
      loader.classList.add('active');
      card.style.display = 'none';
      
      let current = 0;
      let lockedByFinish = false;
      
      function paint() {
        const offset = circumference - (current / 100) * circumference;
        loaderCircle.style.strokeDashoffset = offset;
        loaderPct.textContent = `${Math.round(current)}%`;
      }
      paint();
      
      function clearTimers() {
        if (timedTimer) {
          clearInterval(timedTimer);
          timedTimer = null;
        }
      }
      
      return {
        startAuto(steps) {
          let i = 0;
          const walk = () => {
            if (i >= steps.length || lockedByFinish) return;
            const s = steps[i];
            if (s.text) this.showPhase(s.text);
            this.animateTo(s.progress, 1800, () => {
              i++;
              walk();
            });
          };
          walk();
        },
        
        startTimed(plan) {
          let idx = 0;
          const startNext = () => {
            if (idx >= plan.length || lockedByFinish) return;
            const ph = plan[idx++];
            this.showPhase(ph.text);
            const startTime = Date.now();
            const endTime = startTime + ph.durationMs;
            clearTimers();
            timedTimer = setInterval(() => {
              const now = Date.now();
              const ratio = clamp((now - startTime) / ph.durationMs, 0, 1);
              current = ph.progressStart + (ph.progressEnd - ph.progressStart) * ratio;
              paint();
              if (now >= endTime) {
                clearTimers();
                current = ph.progressEnd;
                paint();
                startNext();
              }
            }, 80);
          };
          startNext();
        },
        
        showPhase(text) {
          if (text) loaderStep.textContent = text;
        },
        
        setPercent(p) {
          if (!lockedByFinish) {
            current = clamp(p, 0, 100);
            paint();
          }
        },
        
        softPercent(p) {
          if (!lockedByFinish) {
            current = current + (clamp(p, 0, 100) - current) * 0.5;
            paint();
          }
        },
        
        animateTo(target, ms = 1200, cb) {
          const start = current;
          const end = clamp(target, 0, 100);
          const t0 = performance.now();
          const step = (t) => {
            const k = clamp((t - t0) / ms, 0, 1);
            current = start + (end - start) * k;
            paint();
            if (k < 1) requestAnimationFrame(step);
            else if (cb) cb();
          };
          requestAnimationFrame(step);
        },
        
        finish(data, chatRefsToReactivate) {
          lockedByFinish = true;
          clearTimers();
          
          this.animateTo(100, 500, () => {
            this.showPhase('Terminé');
            
            setTimeout(() => {
              loader.classList.add('closing');
              
              setTimeout(() => {
                loader.classList.remove('active', 'closing');
                card.style.display = '';
                disabledOverlay.classList.remove('active');
                root.style.pointerEvents = 'auto';
                
                setTimeout(() => {
                  enableChatInput(chatRefsToReactivate);
                  
                  setTimeout(() => {
                    try {
                      window?.voiceflow?.chat?.interact?.({
                        type: 'complete',
                        payload: {
                          webhookSuccess: true,
                          webhookResponse: data,
                          files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                          buttonPath: 'success'
                        }
                      });
                    } catch (e) {
                      console.error('Erreur .interact():', e);
                    }
                  }, 300);
                }, 200);
              }, 400);
            }, autoCloseDelayMs);
          });
        }
      };
    }
    
    function buildTimedPlan() {
      const haveSeconds = timedPhases.every(ph => Number(ph.seconds) > 0);
      let total = haveSeconds ? timedPhases.reduce((s, ph) => s + Number(ph.seconds), 0) : totalSeconds;
      const weightsSum = timedPhases.reduce((s, ph) => s + (Number(ph.weight) || 0), 0) || timedPhases.length;
      const alloc = timedPhases.map((ph, i) => {
        const sec = haveSeconds ? Number(ph.seconds) : (Number(ph.weight) || 1) / weightsSum * total;
        return { key: ph.key, text: ph.label || stepMap[ph.key]?.text || `Étape ${i + 1}`, seconds: sec };
      });
      const startP = 5, endP = 98;
      const totalMs = alloc.reduce((s, a) => s + a.seconds * 1000, 0);
      let acc = 0, last = startP;
      const plan = alloc.map((a, i) => {
        const pStart = i === 0 ? startP : last;
        const pEnd = i === alloc.length - 1 ? endP : startP + (endP - startP) * ((acc + a.seconds * 1000) / totalMs);
        acc += a.seconds * 1000;
        last = pEnd;
        return { text: a.text, durationMs: Math.max(500, a.seconds * 1000), progressStart: pStart, progressEnd: pEnd };
      });
      if (!plan.length) {
        return defaultAutoSteps.map((s, i, arr) => ({
          text: s.text,
          durationMs: i === 0 ? 1000 : 1500,
          progressStart: i ? arr[i - 1].progress : 0,
          progressEnd: s.progress
        }));
      }
      return plan;
    }
    
    // ---------- Network ----------
    async function postToN8n({ url, method, headers, timeoutMs, retries, files, fileFieldName, extra, vfContext }) {
      let lastErr;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const to = setTimeout(() => controller.abort(), timeoutMs);
          const fd = new FormData();
          files.forEach(f => fd.append(fileFieldName, f, f.name));
          Object.entries(extra).forEach(([k, v]) => {
            fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
          });
          if (vfContext.conversation_id) fd.append('conversation_id', vfContext.conversation_id);
          if (vfContext.user_id) fd.append('user_id', vfContext.user_id);
          if (vfContext.locale) fd.append('locale', vfContext.locale);
          const finalHeaders = { ...headers };
          delete finalHeaders['Content-Type'];
          const resp = await fetch(url, { method, headers: finalHeaders, body: fd, signal: controller.signal });
          clearTimeout(to);
          if (!resp.ok) {
            const text = await safeText(resp);
            throw new Error(`Erreur ${resp.status} : ${text?.slice(0, 200) || resp.statusText}`);
          }
          return { ok: true, data: await safeJson(resp) };
        } catch (e) {
          lastErr = e;
          if (attempt < retries) await new Promise(r => setTimeout(r, 900));
        }
      }
      throw lastErr || new Error('Échec de l\'envoi');
    }
    
    async function pollStatus({ statusUrl, headers, intervalMs, maxAttempts, onTick }) {
      for (let i = 1; i <= maxAttempts; i++) {
        const r = await fetch(statusUrl, { headers });
        if (!r.ok) throw new Error(`Polling ${r.status}`);
        const j = await safeJson(r);
        if (j?.status === 'error') throw new Error(j?.error || 'Erreur pipeline');
        if (typeof onTick === 'function') {
          try {
            onTick({ percent: j?.percent, phase: j?.phase, message: j?.message });
          } catch {}
        }
        if (j?.status === 'done') return j?.data ?? j;
        await new Promise(res => setTimeout(res, intervalMs));
      }
      throw new Error('Polling timeout');
    }
    
    async function safeJson(r) {
      try {
        return await r.json();
      } catch {
        return null;
      }
    }
    
    async function safeText(r) {
      try {
        return await r.text();
      } catch {
        return null;
      }
    }
    
    return () => {
      if (timedTimer) {
        clearInterval(timedTimer);
        timedTimer = null;
      }
    };
  }
};

try {
  window.UploadToN8nWithLoader = UploadToN8nWithLoader;
} catch {}
