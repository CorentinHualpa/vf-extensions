// UploadToN8nWithLoader.js – v5.1 SOFT MINIMAL
// © Corentin – Version douce et moderne
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
    const description   = p.description || 'Déposez vos fichiers ici';
    const accept        = p.accept || '.pdf,.docx';
    const maxFileSizeMB = p.maxFileSizeMB || 25;
    const maxFiles      = p.maxFiles || 10;
    
    // ═══════════════════════════════════════════════════════════════
    // 🎨 PALETTE SOFT MINIMAL
    // ═══════════════════════════════════════════════════════════════
    const colors = {
      primary: '#6366F1',      // Indigo doux
      primaryLight: '#EEF2FF', // Indigo très clair
      primaryMuted: '#A5B4FC', // Indigo pastel
      text: '#111827',         // Quasi noir
      textSecondary: '#6B7280',// Gris moyen
      textTertiary: '#9CA3AF', // Gris clair
      bg: '#FFFFFF',
      bgSoft: '#F9FAFB',
      bgHover: '#F3F4F6',
      border: '#E5E7EB',
      success: '#10B981',
      successLight: '#D1FAE5',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
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
      { progress: 0,  text: 'Préparation des fichiers' },
      { progress: 30, text: 'Transfert en cours' },
      { progress: 60, text: 'Analyse des documents' },
      { progress: 85, text: 'Finalisation' },
      { progress: 100, text: 'Terminé' }
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
    
    const loaderMsg = loaderCfg.message || 'Traitement en cours';
    
    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;border-radius:16px;background:${colors.errorLight};color:${colors.error};font-weight:500;font-size:14px">
        Erreur de configuration : webhook.url manquant.
      </div>`;
      element.appendChild(div);
      enableChatInput(chatRefs);
      return;
    }
    
    const hasTitle = title && title.trim() !== '';
    const hasSubtitle = subtitle && subtitle.trim() !== '';
    const showHeader = hasTitle || hasSubtitle;
    
    let requiredDocsInfo;
    let docsListOBMS, docsListFull;
    
    if (isSimpleMode) {
      requiredDocsInfo = requiredFiles === 1 
        ? `1 à ${maxFiles} fichiers` 
        : `${requiredFiles} à ${maxFiles} fichiers`;
    } else {
      docsListOBMS = '• Lettre de mission / Descriptif du poste\n• CV du candidat';
      docsListFull = '• Lettre de mission / Descriptif du poste\n• CV du candidat\n• Profil AssessFirst du candidat';
      requiredDocsInfo = `${requiredFiles} documents requis`;
    }
    
    // ---------- STYLES SOFT MINIMAL ----------
    const styles = `
      @keyframes softFadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes softFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes progressPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .upl-wrap {
        width: 100%;
        max-width: 100%;
        animation: softFadeIn 0.4s ease-out;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .upl-card {
        background: ${colors.bg};
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
      }
      
      .upl-header {
        margin-bottom: 24px;
      }
      
      .upl-title {
        font-size: 20px;
        font-weight: 600;
        color: ${colors.text};
        margin: 0 0 6px 0;
        letter-spacing: -0.4px;
      }
      
      .upl-subtitle {
        font-size: 14px;
        color: ${colors.textSecondary};
        font-weight: 400;
        line-height: 1.4;
      }
      
      .upl-dropzone {
        background: ${colors.bgSoft};
        border: 2px dashed ${colors.border};
        border-radius: 16px;
        padding: 40px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.25s ease;
      }
      
      .upl-dropzone:hover {
        background: ${colors.primaryLight};
        border-color: ${colors.primaryMuted};
      }
      
      .upl-dropzone.dragging {
        background: ${colors.primaryLight};
        border-color: ${colors.primary};
        border-style: solid;
      }
      
      .upl-dropzone-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        background: ${colors.bg};
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        transition: all 0.25s ease;
      }
      
      .upl-dropzone:hover .upl-dropzone-icon {
        background: ${colors.primary};
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      }
      
      .upl-dropzone-icon svg {
        width: 24px;
        height: 24px;
        color: ${colors.primary};
        transition: color 0.25s ease;
      }
      
      .upl-dropzone:hover .upl-dropzone-icon svg {
        color: white;
      }
      
      .upl-dropzone-text {
        font-size: 15px;
        color: ${colors.textSecondary};
        font-weight: 500;
        margin-bottom: 6px;
      }
      
      .upl-dropzone-hint {
        font-size: 13px;
        color: ${colors.textTertiary};
      }
      
      .upl-files {
        margin-top: 20px;
        display: none;
        flex-direction: column;
        gap: 10px;
      }
      
      .upl-files.active {
        display: flex;
      }
      
      .upl-file {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: ${colors.bg};
        border-radius: 12px;
        border: 1px solid ${colors.border};
        animation: softFadeIn 0.25s ease-out;
      }
      
      .upl-file-icon {
        width: 40px;
        height: 40px;
        background: ${colors.primaryLight};
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .upl-file-icon svg {
        width: 20px;
        height: 20px;
        color: ${colors.primary};
      }
      
      .upl-file-info {
        flex: 1;
        min-width: 0;
      }
      
      .upl-file-name {
        font-weight: 500;
        color: ${colors.text};
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .upl-file-size {
        font-size: 12px;
        color: ${colors.textTertiary};
        margin-top: 2px;
      }
      
      .upl-file-remove {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: ${colors.textTertiary};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .upl-file-remove:hover {
        background: ${colors.errorLight};
        color: ${colors.error};
      }
      
      .upl-summary {
        margin-top: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        background: ${colors.bgSoft};
        border-radius: 10px;
        font-size: 13px;
        color: ${colors.textSecondary};
        display: none;
      }
      
      .upl-summary.active {
        display: flex;
      }
      
      .upl-summary.ready {
        background: ${colors.successLight};
        color: ${colors.success};
      }
      
      .upl-summary-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      
      .upl-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }
      
      .upl-btn {
        flex: 1;
        padding: 14px 24px;
        border-radius: 12px;
        border: none;
        font-weight: 600;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .upl-btn-primary {
        background: ${colors.primary};
        color: white;
      }
      
      .upl-btn-primary:hover:not(:disabled) {
        background: #4F46E5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      
      .upl-btn-primary:disabled {
        background: ${colors.primaryMuted};
        cursor: not-allowed;
      }
      
      .upl-btn-secondary {
        background: ${colors.bgSoft};
        color: ${colors.textSecondary};
      }
      
      .upl-btn-secondary:hover:not(:disabled) {
        background: ${colors.bgHover};
        color: ${colors.text};
      }
      
      .upl-status {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        display: none;
        animation: softFadeIn 0.25s ease-out;
      }
      
      .upl-status.error {
        background: ${colors.errorLight};
        color: ${colors.error};
      }
      
      .upl-status.success {
        background: ${colors.successLight};
        color: ${colors.success};
      }
      
      .upl-status.processing {
        background: ${colors.primaryLight};
        color: ${colors.primary};
      }
      
      .upl-status.warning {
        background: ${colors.warningLight};
        color: ${colors.warning};
      }
      
      /* LOADER - BARRE HORIZONTALE */
      .upl-loader {
        display: none;
        background: ${colors.bg};
        border-radius: 20px;
        padding: 32px;
        margin-top: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
        animation: softFadeIn 0.4s ease-out;
      }
      
      .upl-loader.active {
        display: block;
      }
      
      .upl-loader.closing {
        animation: softFadeOut 0.3s ease-out forwards;
      }
      
      .upl-loader-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .upl-loader-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .upl-loader-title {
        font-size: 16px;
        font-weight: 600;
        color: ${colors.text};
      }
      
      .upl-loader-percent {
        font-size: 24px;
        font-weight: 700;
        color: ${colors.primary};
      }
      
      .upl-loader-bar-container {
        height: 8px;
        background: ${colors.bgSoft};
        border-radius: 4px;
        overflow: hidden;
      }
      
      .upl-loader-bar {
        height: 100%;
        background: ${colors.primary};
        border-radius: 4px;
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .upl-loader-bar.animating {
        animation: progressPulse 1.5s ease-in-out infinite;
      }
      
      .upl-loader-step {
        font-size: 14px;
        color: ${colors.textSecondary};
        text-align: center;
        min-height: 20px;
      }
      
      .upl-loader-steps {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
      }
      
      .upl-loader-step-dot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      
      .upl-loader-step-circle {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${colors.border};
        transition: all 0.3s ease;
      }
      
      .upl-loader-step-circle.active {
        background: ${colors.primary};
        box-shadow: 0 0 0 4px ${colors.primaryLight};
      }
      
      .upl-loader-step-circle.done {
        background: ${colors.success};
      }
      
      /* VALIDATION ERROR */
      .upl-validation {
        margin-top: 20px;
        padding: 24px;
        background: ${colors.warningLight};
        border-radius: 16px;
        animation: softFadeIn 0.25s ease-out;
      }
      
      .upl-validation-title {
        font-weight: 600;
        color: ${colors.warning};
        font-size: 15px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .upl-validation-message {
        color: ${colors.text};
        font-size: 14px;
        white-space: pre-line;
        margin-bottom: 20px;
        line-height: 1.6;
      }
      
      .upl-validation-actions {
        display: flex;
        gap: 12px;
      }
      
      .upl-overlay {
        display: none;
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.95);
        z-index: 100;
        border-radius: 20px;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
      }
      
      .upl-overlay.active {
        display: flex;
      }
    `;
    
    // ---------- ICÔNES SVG ----------
    const icons = {
      upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>`,
      file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>`,
      close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`
    };
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = 'upl-wrap';
    root.style.position = 'relative';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    let headerHTML = '';
    if (showHeader) {
      headerHTML = `<div class="upl-header">`;
      if (hasTitle) headerHTML += `<div class="upl-title">${title}</div>`;
      if (hasSubtitle) headerHTML += `<div class="upl-subtitle">${subtitle}</div>`;
      headerHTML += `</div>`;
    }
    
    root.innerHTML += `
      <div class="upl-overlay"></div>
      <div class="upl-card">
        ${headerHTML}
        <div class="upl-dropzone">
          <div class="upl-dropzone-icon">${icons.upload}</div>
          <div class="upl-dropzone-text">${description}</div>
          <div class="upl-dropzone-hint">${requiredDocsInfo}</div>
          <input type="file" accept="${accept}" multiple style="display:none" />
        </div>
        <div class="upl-files"></div>
        <div class="upl-summary">
          <span class="upl-summary-dot"></span>
          <span class="upl-summary-text"></span>
        </div>
        <div class="upl-actions">
          ${buttons.map(b => `
            <button class="upl-btn upl-btn-secondary back-button" data-path="${b.path || pathError}">
              ${b.text || 'Retour'}
            </button>
          `).join('')}
          <button class="upl-btn upl-btn-primary send-button" disabled>Envoyer</button>
        </div>
        <div class="upl-status"></div>
      </div>
      <div class="upl-loader">
        <div class="upl-loader-content">
          <div class="upl-loader-header">
            <div class="upl-loader-title"></div>
            <div class="upl-loader-percent">0%</div>
          </div>
          <div class="upl-loader-bar-container">
            <div class="upl-loader-bar"></div>
          </div>
          <div class="upl-loader-step"></div>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const dropzone     = root.querySelector('.upl-dropzone');
    const fileInput    = root.querySelector('input[type="file"]');
    const filesList    = root.querySelector('.upl-files');
    const summary      = root.querySelector('.upl-summary');
    const summaryText  = root.querySelector('.upl-summary-text');
    const sendBtn      = root.querySelector('.send-button');
    const backButtons  = root.querySelectorAll('.back-button');
    const statusDiv    = root.querySelector('.upl-status');
    const loader       = root.querySelector('.upl-loader');
    const loaderTitle  = root.querySelector('.upl-loader-title');
    const loaderPct    = root.querySelector('.upl-loader-percent');
    const loaderStep   = root.querySelector('.upl-loader-step');
    const loaderBar    = root.querySelector('.upl-loader-bar');
    const overlay      = root.querySelector('.upl-overlay');
    const card         = root.querySelector('.upl-card');
    
    // ---------- STATE ----------
    let selectedFiles = [];
    let timedTimer = null;
    
    // ---------- Helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' o';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
      return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    }
    
    function setStatus(message, type = 'processing') {
      statusDiv.textContent = message;
      statusDiv.className = `upl-status ${type}`;
      statusDiv.style.display = 'block';
    }
    
    function clearValidationError() {
      const existing = root.querySelector('.upl-validation');
      if (existing) existing.remove();
    }
    
    function updateFilesList() {
      filesList.innerHTML = '';
      clearValidationError();
      statusDiv.style.display = 'none';
      
      if (!selectedFiles.length) {
        filesList.classList.remove('active');
        summary.classList.remove('active', 'ready');
        sendBtn.disabled = true;
        return;
      }
      
      filesList.classList.add('active');
      summary.classList.add('active');
      
      const totalSize = selectedFiles.reduce((s, f) => s + f.size, 0);
      const hasEnough = selectedFiles.length >= requiredFiles;
      
      summary.classList.toggle('ready', hasEnough);
      summaryText.textContent = `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} • ${formatSize(totalSize)}`;
      
      selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'upl-file';
        item.innerHTML = `
          <div class="upl-file-icon">${icons.file}</div>
          <div class="upl-file-info">
            <div class="upl-file-name">${file.name}</div>
            <div class="upl-file-size">${formatSize(file.size)}</div>
          </div>
          <button class="upl-file-remove" data-index="${i}">${icons.close}</button>
        `;
        filesList.appendChild(item);
      });
      
      root.querySelectorAll('.upl-file-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-index'));
          selectedFiles.splice(i, 1);
          updateFilesList();
        });
      });
      
      sendBtn.disabled = !hasEnough;
      
      if (selectedFiles.length > 0 && !hasEnough && !isSimpleMode) {
        const missing = requiredFiles - selectedFiles.length;
        setStatus(`Encore ${missing} fichier${missing > 1 ? 's' : ''} requis`, 'warning');
      }
    }
    
    function addFiles(newFiles) {
      const valid = [], errs = [];
      for (const file of newFiles) {
        if (selectedFiles.length + valid.length >= maxFiles) {
          errs.push(`Maximum ${maxFiles} fichiers`);
          break;
        }
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
          errs.push(`${file.name} trop volumineux`);
          continue;
        }
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          errs.push(`${file.name} déjà ajouté`);
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
      if (isSimpleMode) return selectedFiles.length >= requiredFiles;
      
      if (selectedFiles.length < requiredFiles) {
        const docsList = isOBMS ? docsListOBMS : docsListFull;
        const missing = requiredFiles - selectedFiles.length;
        
        clearValidationError();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'upl-validation';
        errorDiv.innerHTML = `
          <div class="upl-validation-title">${icons.warning} Documents manquants</div>
          <div class="upl-validation-message">${selectedFiles.length}/${requiredFiles} fichiers sélectionnés.

Documents attendus :
${docsList}</div>
          <div class="upl-validation-actions">
            <button class="upl-btn upl-btn-secondary" data-action="back">Retour</button>
            <button class="upl-btn upl-btn-primary" data-action="add">Ajouter des fichiers</button>
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
          } catch {}
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
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('dragging');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragging');
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
      if (!selectedFiles.length || !validateBeforeSend()) return;
      
      root.style.pointerEvents = 'none';
      overlay.classList.add('active');
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
        
        const elapsed = Date.now() - startTime;
        const remaining = minLoadingTimeMs - elapsed;
        
        if (remaining > 0) {
          loaderUI.showPhase('Finalisation...');
          loaderUI.animateTo(98, Math.min(remaining, 1500));
          await new Promise(r => setTimeout(r, remaining));
        }
        
        loaderUI.finish(finalData, chatRefs);
        
      } catch (err) {
        loader.classList.remove('active');
        card.style.display = '';
        setStatus(String(err?.message || err), 'error');
        sendBtn.disabled = false;
        backButtons.forEach(b => b.disabled = false);
        root.style.pointerEvents = 'auto';
        overlay.classList.remove('active');
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
      loaderBar.classList.add('animating');
      
      let current = 0;
      let locked = false;
      
      function paint() {
        loaderBar.style.width = `${current}%`;
        loaderPct.textContent = `${Math.round(current)}%`;
      }
      paint();
      
      function clearTimers() {
        if (timedTimer) { clearInterval(timedTimer); timedTimer = null; }
      }
      
      return {
        startAuto(steps) {
          let i = 0;
          const walk = () => {
            if (i >= steps.length || locked) return;
            const s = steps[i];
            if (s.text) this.showPhase(s.text);
            this.animateTo(s.progress, 1800, () => { i++; walk(); });
          };
          walk();
        },
        
        startTimed(plan) {
          let idx = 0;
          const startNext = () => {
            if (idx >= plan.length || locked) return;
            const ph = plan[idx++];
            this.showPhase(ph.text);
            const start = Date.now();
            const end = start + ph.durationMs;
            clearTimers();
            timedTimer = setInterval(() => {
              const now = Date.now();
              const ratio = clamp((now - start) / ph.durationMs, 0, 1);
              current = ph.progressStart + (ph.progressEnd - ph.progressStart) * ratio;
              paint();
              if (now >= end) {
                clearTimers();
                current = ph.progressEnd;
                paint();
                startNext();
              }
            }, 80);
          };
          startNext();
        },
        
        showPhase(text) { if (text) loaderStep.textContent = text; },
        setPercent(p) { if (!locked) { current = clamp(p, 0, 100); paint(); } },
        softPercent(p) { if (!locked) { current = current + (clamp(p, 0, 100) - current) * 0.5; paint(); } },
        
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
          locked = true;
          clearTimers();
          loaderBar.classList.remove('animating');
          
          this.animateTo(100, 500, () => {
            this.showPhase('Terminé');
            
            setTimeout(() => {
              loader.classList.add('closing');
              
              setTimeout(() => {
                loader.classList.remove('active', 'closing');
                card.style.display = '';
                overlay.classList.remove('active');
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
          try { onTick({ percent: j?.percent, phase: j?.phase, message: j?.message }); } catch {}
        }
        if (j?.status === 'done') return j?.data ?? j;
        await new Promise(r => setTimeout(r, intervalMs));
      }
      throw new Error('Polling timeout');
    }
    
    async function safeJson(r) { try { return await r.json(); } catch { return null; } }
    async function safeText(r) { try { return await r.text(); } catch { return null; } }
    
    return () => {
      if (timedTimer) { clearInterval(timedTimer); timedTimer = null; }
    };
  }
};

try { window.UploadToN8nWithLoader = UploadToN8nWithLoader; } catch {}
