// UploadToN8nWithLoader.js – v5.7 ULTRA MINIMAL
// © Corentin – Version ultra-épurée monochrome
// Compatible mode embedded ET widget
// v5.6 : Fix overlay transparent pour que le loader soit bien visible
// v5.7 : Écran de confirmation avec bouton "Continuer" après upload
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
        textarea.placeholder = 'Veuillez charger vos documents...';
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
    
    // Fonction pour afficher un message utilisateur dans le chat
    const showUserMessage = (message) => {
      const container = findChatContainer();
      
      // Méthode 1 : Via shadowRoot
      if (container?.shadowRoot) {
        const shadowRoot = container.shadowRoot;
        
        // Sélecteurs pour trouver le conteneur des messages
        const selectors = [
          '.vfrc-chat--dialog',
          '[class*="Dialog"]',
          '[class*="dialog"]',
          '.vfrc-chat',
          '[class*="Messages"]',
          '[class*="messages"]',
          '[class*="Conversation"]',
          '[class*="conversation"]'
        ];
        
        let dialogEl = null;
        for (const sel of selectors) {
          dialogEl = shadowRoot.querySelector(sel);
          if (dialogEl) break;
        }
        
        if (dialogEl) {
          const userMsg = createUserMessageElement(message);
          dialogEl.appendChild(userMsg);
          setTimeout(() => { dialogEl.scrollTop = dialogEl.scrollHeight; }, 50);
          console.log('[UploadToN8nWithLoader] User message displayed in shadow DOM');
          return;
        }
      }
      
      // Méthode 2 : Trouver le dialogue dans le DOM principal (mode embedded)
      const mainSelectors = [
        '.vfrc-chat--dialog',
        '[class*="vfrc"][class*="dialog"]',
        '.vfrc-chat',
        '#voiceflow-chat-frame [class*="dialog"]',
        '#voiceflow-chat-frame [class*="messages"]',
        '[id*="voiceflow"] [class*="dialog"]',
        '[id*="voiceflow"] [class*="messages"]'
      ];
      
      for (const sel of mainSelectors) {
        const dialogEl = document.querySelector(sel);
        if (dialogEl) {
          const userMsg = createUserMessageElement(message);
          dialogEl.appendChild(userMsg);
          setTimeout(() => { dialogEl.scrollTop = dialogEl.scrollHeight; }, 50);
          console.log('[UploadToN8nWithLoader] User message displayed in main DOM');
          return;
        }
      }
      
      console.warn('[UploadToN8nWithLoader] Could not find dialog element for user message');
    };
    
    // Helper pour créer l'élément message utilisateur
    const createUserMessageElement = (message) => {
      const userMsg = document.createElement('div');
      userMsg.className = 'vfrc-user-response';
      userMsg.style.cssText = `
        display: flex;
        justify-content: flex-end;
        padding: 0 20px;
        margin: 8px 0;
      `;
      
      const msgBubble = document.createElement('div');
      msgBubble.className = 'vfrc-message';
      msgBubble.style.cssText = `
        background: #EEEEEE;
        color: #1E1E1E;
        padding: 12px 16px;
        border-radius: 20px;
        max-width: 80%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      msgBubble.textContent = message;
      
      userMsg.appendChild(msgBubble);
      return userMsg;
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
    // 🎨 PALETTE ULTRA MINIMALE - MONOCHROME
    // ═══════════════════════════════════════════════════════════════
    const colors = {
      text: '#111827',
      textLight: '#9CA3AF',
      border: '#E5E7EB',
      bg: '#FAFAFA',
      white: '#FFFFFF',
      accent: '#111827',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
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
    
    // Message à afficher dans le chat quand l'user clique sur Envoyer
    const sendButtonText = p.sendButtonText || 'Envoyer';
    const showUserMessageOnSend = p.showUserMessageOnSend !== false; // true par défaut
    const userMessageText = p.userMessageText || sendButtonText; // Texte affiché dans le chat
    // Si true, utilise window.voiceflow.chat.interact (déclenche une réponse du bot)
    // Si false, injecte juste visuellement le message (pas de réponse du bot)
    const useNativeInteract = p.useNativeInteract === true; // false par défaut
    
    // Écran de confirmation après upload
    const showConfirmation = p.showConfirmation === true; // false par défaut
    const confirmationMessage = p.confirmationMessage || '✅ Documents analysés avec succès';
    const confirmationButtonText = p.confirmationButtonText || 'Continuer';
    const confirmationUserMessage = p.confirmationUserMessage || confirmationButtonText; // Message envoyé au chat
    
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
      { progress: 0,  text: 'Préparation...' },
      { progress: 30, text: 'Envoi...' },
      { progress: 60, text: 'Traitement...' },
      { progress: 85, text: 'Finalisation...' },
      { progress: 100, text: 'Terminé' }
    ];
    
    const timedPhases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : [];
    const totalSeconds = Number(loaderCfg.totalSeconds) > 0 ? Number(loaderCfg.totalSeconds) : 120;
    
    const stepMap = loaderCfg.stepMap || {
      upload:      { text: 'Téléversement',            progress: 10 },
      sign_url:    { text: 'Signature URL',            progress: 18 },
      ocr_annot:   { text: 'OCR',                      progress: 35 },
      ocr_classic: { text: 'OCR',                      progress: 42 },
      merge:       { text: 'Fusion',                   progress: 55 },
      combine:     { text: 'Préparation',              progress: 62 },
      ai_agent:    { text: 'Analyse',                  progress: 82 },
      gdoc_prep:   { text: 'Préparation doc',          progress: 88 },
      gdrive_copy: { text: 'Copie Drive',              progress: 93 },
      gdoc_update: { text: 'Mise à jour',              progress: 97 }
    };
    
    const loaderMsg = loaderCfg.message || 'Traitement en cours';
    
    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;font-size:13px;color:${colors.error}">
        Configuration manquante : webhook.url
      </div>`;
      element.appendChild(div);
      enableChatInput(chatRefs);
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 📝 GESTION HEADER & HINT
    // ═══════════════════════════════════════════════════════════════
    const hasTitle = title && title.trim() !== '';
    const hasSubtitle = subtitle && subtitle.trim() !== '';
    const showHeader = hasTitle || hasSubtitle;
    
    // Hint configurable : 
    // - p.hint = false ou "" → pas de hint
    // - p.hint = "texte" → hint personnalisé
    // - p.hint non défini → comportement auto (calculé)
    let hintText = '';
    if (p.hint === false || p.hint === '') {
      hintText = ''; // Pas de hint
    } else if (typeof p.hint === 'string' && p.hint.trim() !== '') {
      hintText = p.hint; // Hint personnalisé
    } else {
      // Comportement auto
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
      hintText = requiredDocsInfo;
    }
    
    const showHint = hintText && hintText.trim() !== '';
    
    // Pour la validation (mode non-simple)
    let docsListOBMS = '• Lettre de mission / Descriptif du poste\n• CV du candidat';
    let docsListFull = '• Lettre de mission / Descriptif du poste\n• CV du candidat\n• Profil AssessFirst du candidat';
    
    // ---------- STYLES ULTRA MINIMAUX ----------
    const styles = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes progress {
        from { width: 0%; }
      }
      
      .upl {
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
        font-size: 14px;
        color: ${colors.text};
        animation: fadeIn 0.2s ease;
      }
      
      .upl * {
        box-sizing: border-box;
      }
      
      .upl-card {
        background: ${colors.white};
        border: 1px solid ${colors.border};
        border-radius: 8px;
        overflow: hidden;
      }
      
      .upl-header {
        padding: 20px 20px 0;
      }
      
      .upl-title {
        font-size: 15px;
        font-weight: 600;
        color: ${colors.text};
        margin: 0 0 2px;
        letter-spacing: -0.2px;
      }
      
      .upl-subtitle {
        font-size: 13px;
        color: ${colors.textLight};
        font-weight: 400;
      }
      
      .upl-body {
        padding: 20px;
      }
      
      /* Si pas de header, réduire le padding top */
      .upl-body.no-header {
        padding-top: 20px;
      }
      
      .upl-zone {
        background: ${colors.bg};
        border-radius: 6px;
        padding: 32px 20px;
        text-align: center;
        cursor: pointer;
        transition: background 0.15s ease;
        position: relative;
      }
      
      .upl-zone::before {
        content: '';
        position: absolute;
        inset: 8px;
        border: 1px dashed ${colors.border};
        border-radius: 4px;
        pointer-events: none;
        transition: border-color 0.15s ease;
      }
      
      .upl-zone:hover {
        background: #F3F4F6;
      }
      
      .upl-zone:hover::before {
        border-color: ${colors.textLight};
      }
      
      .upl-zone.drag {
        background: #F3F4F6;
      }
      
      .upl-zone.drag::before {
        border-color: ${colors.text};
      }
      
      .upl-zone-icon {
        width: 32px;
        height: 32px;
        margin: 0 auto 10px;
        color: ${colors.textLight};
        transition: color 0.15s ease;
      }
      
      .upl-zone:hover .upl-zone-icon {
        color: ${colors.text};
      }
      
      .upl-zone-text {
        font-size: 13px;
        color: ${colors.textLight};
        font-weight: 400;
        line-height: 1.5;
      }
      
      .upl-zone-hint {
        font-size: 11px;
        color: ${colors.textLight};
        margin-top: 6px;
        opacity: 0.7;
      }
      
      .upl-list {
        margin-top: 16px;
        display: none;
      }
      
      .upl-list.show {
        display: block;
      }
      
      .upl-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        background: ${colors.bg};
        border-radius: 6px;
        margin-bottom: 6px;
        animation: slideIn 0.15s ease;
      }
      
      .upl-item:last-child {
        margin-bottom: 0;
      }
      
      .upl-item-icon {
        width: 16px;
        height: 16px;
        color: ${colors.textLight};
        margin-right: 10px;
        flex-shrink: 0;
      }
      
      .upl-item-info {
        flex: 1;
        min-width: 0;
      }
      
      .upl-item-name {
        font-size: 13px;
        font-weight: 500;
        color: ${colors.text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .upl-item-size {
        font-size: 11px;
        color: ${colors.textLight};
        margin-top: 1px;
      }
      
      .upl-item-del {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: ${colors.textLight};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        margin-left: 8px;
        transition: all 0.1s ease;
      }
      
      .upl-item-del:hover {
        background: rgba(239, 68, 68, 0.1);
        color: ${colors.error};
      }
      
      .upl-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid ${colors.border};
      }
      
      .upl-count {
        font-size: 12px;
        color: ${colors.textLight};
      }
      
      .upl-count.ok {
        color: ${colors.success};
      }
      
      .upl-actions {
        display: flex;
        gap: 8px;
      }
      
      .upl-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.1s ease;
        border: 1px solid transparent;
      }
      
      .upl-btn-primary {
        background: ${colors.text};
        color: ${colors.white};
        border-color: ${colors.text};
      }
      
      .upl-btn-primary:hover:not(:disabled) {
        background: #374151;
        border-color: #374151;
      }
      
      .upl-btn-primary:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .upl-btn-ghost {
        background: transparent;
        color: ${colors.textLight};
        border-color: ${colors.border};
      }
      
      .upl-btn-ghost:hover {
        background: ${colors.bg};
        color: ${colors.text};
      }
      
      .upl-msg {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 12px;
        display: none;
        animation: fadeIn 0.15s ease;
      }
      
      .upl-msg.show {
        display: block;
      }
      
      .upl-msg.err {
        background: rgba(239, 68, 68, 0.08);
        color: ${colors.error};
      }
      
      .upl-msg.ok {
        background: rgba(16, 185, 129, 0.08);
        color: ${colors.success};
      }
      
      .upl-msg.warn {
        background: rgba(245, 158, 11, 0.08);
        color: ${colors.warning};
      }
      
      .upl-msg.load {
        background: ${colors.bg};
        color: ${colors.textLight};
      }
      
      /* LOADER - Style avec fond foncé bien visible */
      .upl-loader {
        display: none;
        padding: 24px 20px;
        animation: fadeIn 0.2s ease;
        background: #1F2937;
        border-radius: 8px;
        position: relative;
        z-index: 20;
      }
      
      .upl-loader.show {
        display: block;
      }
      
      .upl-loader.hide {
        animation: fadeOut 0.2s ease;
      }
      
      .upl-loader-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      
      .upl-loader-title {
        font-size: 13px;
        font-weight: 500;
        color: #FFFFFF;
      }
      
      .upl-loader-pct {
        font-size: 12px;
        font-weight: 600;
        color: #FFFFFF;
        font-variant-numeric: tabular-nums;
      }
      
      .upl-loader-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .upl-loader-fill {
        height: 100%;
        width: 0%;
        background: #10B981;
        border-radius: 3px;
        transition: width 0.3s ease;
      }
      
      .upl-loader-step {
        margin-top: 10px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        min-height: 16px;
      }
      
      /* VALIDATION */
      .upl-valid {
        margin-top: 16px;
        padding: 16px;
        background: rgba(245, 158, 11, 0.06);
        border: 1px solid rgba(245, 158, 11, 0.15);
        border-radius: 6px;
        animation: slideIn 0.15s ease;
      }
      
      .upl-valid-title {
        font-size: 13px;
        font-weight: 500;
        color: ${colors.warning};
        margin-bottom: 8px;
      }
      
      .upl-valid-text {
        font-size: 12px;
        color: ${colors.text};
        line-height: 1.5;
        white-space: pre-line;
        margin-bottom: 12px;
      }
      
      .upl-valid-actions {
        display: flex;
        gap: 8px;
      }
      
      /* OVERLAY - transparent pour ne pas cacher le loader */
      .upl-overlay {
        display: none;
        position: absolute;
        inset: 0;
        background: transparent;
        z-index: 10;
        border-radius: 8px;
        pointer-events: all;
      }
      
      .upl-overlay.show {
        display: block;
      }
      
      /* CONFIRMATION - Écran après upload réussi */
      .upl-confirm {
        display: none;
        padding: 24px 20px;
        text-align: center;
        animation: fadeIn 0.2s ease;
      }
      
      .upl-confirm.show {
        display: block;
      }
      
      .upl-confirm-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 12px;
        color: #10B981;
      }
      
      .upl-confirm-msg {
        font-size: 14px;
        font-weight: 500;
        color: ${colors.text};
        margin-bottom: 16px;
        line-height: 1.5;
      }
      
      .upl-confirm-btn {
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        background: ${colors.text};
        color: ${colors.white};
        transition: all 0.15s ease;
      }
      
      .upl-confirm-btn:hover {
        background: #374151;
      }
    `;
    
    // ---------- ICÔNES SVG MINIMALISTES ----------
    const icons = {
      upload: `<svg class="upl-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 15V3m0 0l-4 4m4-4l4 4"/>
        <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
      </svg>`,
      file: `<svg class="upl-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
      </svg>`,
      x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>`,
      check: `<svg class="upl-confirm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>`
    };
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = 'upl';
    root.style.position = 'relative';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    // Header conditionnel
    let headerHTML = '';
    if (showHeader) {
      headerHTML = `<div class="upl-header">`;
      if (hasTitle) headerHTML += `<div class="upl-title">${title}</div>`;
      if (hasSubtitle) headerHTML += `<div class="upl-subtitle">${subtitle}</div>`;
      headerHTML += `</div>`;
    }
    
    // Hint conditionnel
    const hintHTML = showHint ? `<div class="upl-zone-hint">${hintText}</div>` : '';
    
    // Classe body conditionnelle
    const bodyClass = showHeader ? 'upl-body' : 'upl-body no-header';
    
    root.innerHTML += `
      <div class="upl-overlay"></div>
      <div class="upl-card">
        ${headerHTML}
        <div class="${bodyClass}">
          <div class="upl-zone">
            ${icons.upload}
            <div class="upl-zone-text">${description}</div>
            ${hintHTML}
            <input type="file" accept="${accept}" multiple style="display:none" />
          </div>
          
          <div class="upl-list"></div>
          
          <div class="upl-meta" style="display:none">
            <div class="upl-count"></div>
            <div class="upl-actions">
              ${buttons.map(b => `
                <button class="upl-btn upl-btn-ghost back-btn" data-path="${b.path || pathError}">
                  ${b.text || 'Retour'}
                </button>
              `).join('')}
              <button class="upl-btn upl-btn-primary send-btn" disabled>${sendButtonText}</button>
            </div>
          </div>
          
          <div class="upl-msg"></div>
        </div>
        
        <div class="upl-loader">
          <div class="upl-loader-head">
            <div class="upl-loader-title"></div>
            <div class="upl-loader-pct">0%</div>
          </div>
          <div class="upl-loader-bar">
            <div class="upl-loader-fill"></div>
          </div>
          <div class="upl-loader-step"></div>
        </div>
        
        <div class="upl-confirm">
          ${icons.check}
          <div class="upl-confirm-msg">${confirmationMessage}</div>
          <button class="upl-confirm-btn">${confirmationButtonText}</button>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const uploadZone = root.querySelector('.upl-zone');
    const fileInput = root.querySelector('input[type="file"]');
    const filesList = root.querySelector('.upl-list');
    const metaDiv = root.querySelector('.upl-meta');
    const countDiv = root.querySelector('.upl-count');
    const sendBtn = root.querySelector('.send-btn');
    const backButtons = root.querySelectorAll('.back-btn');
    const msgDiv = root.querySelector('.upl-msg');
    const loader = root.querySelector('.upl-loader');
    const loaderTitle = root.querySelector('.upl-loader-title');
    const loaderPct = root.querySelector('.upl-loader-pct');
    const loaderFill = root.querySelector('.upl-loader-fill');
    const loaderStep = root.querySelector('.upl-loader-step');
    const overlay = root.querySelector('.upl-overlay');
    const card = root.querySelector('.upl-card');
    const bodyDiv = root.querySelector('.upl-body');
    const confirmDiv = root.querySelector('.upl-confirm');
    const confirmBtn = root.querySelector('.upl-confirm-btn');
    
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
    
    function showMsg(text, type = 'load') {
      msgDiv.textContent = text;
      msgDiv.className = `upl-msg show ${type}`;
    }
    
    function hideMsg() {
      msgDiv.className = 'upl-msg';
    }
    
    function clearValidation() {
      const v = root.querySelector('.upl-valid');
      if (v) v.remove();
    }
    
    function updateList() {
      filesList.innerHTML = '';
      clearValidation();
      hideMsg();
      
      if (!selectedFiles.length) {
        filesList.classList.remove('show');
        metaDiv.style.display = 'none';
        sendBtn.disabled = true;
        return;
      }
      
      filesList.classList.add('show');
      metaDiv.style.display = 'flex';
      
      const total = selectedFiles.reduce((s, f) => s + f.size, 0);
      const enough = selectedFiles.length >= requiredFiles;
      
      countDiv.className = `upl-count${enough ? ' ok' : ''}`;
      countDiv.textContent = `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} · ${formatSize(total)}`;
      
      selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'upl-item';
        item.innerHTML = `
          ${icons.file}
          <div class="upl-item-info">
            <div class="upl-item-name">${file.name}</div>
            <div class="upl-item-size">${formatSize(file.size)}</div>
          </div>
          <button class="upl-item-del" data-i="${i}">${icons.x}</button>
        `;
        filesList.appendChild(item);
      });
      
      root.querySelectorAll('.upl-item-del').forEach(btn => {
        btn.onclick = () => {
          selectedFiles.splice(parseInt(btn.dataset.i), 1);
          updateList();
        };
      });
      
      sendBtn.disabled = !enough;
      
      if (selectedFiles.length > 0 && !enough && !isSimpleMode) {
        const m = requiredFiles - selectedFiles.length;
        showMsg(`${m} fichier${m > 1 ? 's' : ''} manquant${m > 1 ? 's' : ''}`, 'warn');
      }
    }
    
    function addFiles(files) {
      const ok = [], errs = [];
      for (const f of files) {
        if (selectedFiles.length + ok.length >= maxFiles) {
          errs.push('Limite atteinte');
          break;
        }
        if (maxFileSizeMB && f.size > maxFileSizeMB * 1024 * 1024) {
          errs.push(`${f.name} trop volumineux`);
          continue;
        }
        if (selectedFiles.some(x => x.name === f.name && x.size === f.size)) {
          continue;
        }
        ok.push(f);
      }
      if (ok.length) {
        selectedFiles.push(...ok);
        updateList();
      }
      if (errs.length) showMsg(errs.join(' · '), 'err');
    }
    
    function validate() {
      if (isSimpleMode) return selectedFiles.length >= requiredFiles;
      
      if (selectedFiles.length < requiredFiles) {
        clearValidation();
        const docs = isOBMS ? docsListOBMS : docsListFull;
        const m = requiredFiles - selectedFiles.length;
        
        const div = document.createElement('div');
        div.className = 'upl-valid';
        div.innerHTML = `
          <div class="upl-valid-title">Documents manquants</div>
          <div class="upl-valid-text">${selectedFiles.length}/${requiredFiles} fichiers sélectionnés.

Requis :
${docs}</div>
          <div class="upl-valid-actions">
            <button class="upl-btn upl-btn-ghost" data-a="back">Retour</button>
            <button class="upl-btn upl-btn-primary" data-a="add">Ajouter</button>
          </div>
        `;
        bodyDiv.appendChild(div);
        
        div.querySelector('[data-a="back"]').onclick = () => {
          enableChatInput(chatRefs);
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: { webhookSuccess: false, buttonPath: 'back' }
          });
        };
        
        div.querySelector('[data-a="add"]').onclick = () => {
          clearValidation();
          fileInput.click();
        };
        
        return false;
      }
      return true;
    }
    
    // ---------- Events ----------
    uploadZone.onclick = () => fileInput.click();
    uploadZone.ondragover = e => { e.preventDefault(); uploadZone.classList.add('drag'); };
    uploadZone.ondragleave = () => uploadZone.classList.remove('drag');
    uploadZone.ondrop = e => {
      e.preventDefault();
      uploadZone.classList.remove('drag');
      addFiles(Array.from(e.dataTransfer?.files || []));
    };
    fileInput.onchange = () => {
      addFiles(Array.from(fileInput.files || []));
      fileInput.value = '';
    };
    
    backButtons.forEach(b => {
      b.onclick = () => {
        enableChatInput(chatRefs);
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, buttonPath: b.dataset.path || pathError }
        });
      };
    });
    
    sendBtn.onclick = async () => {
      if (!selectedFiles.length || !validate()) return;
      
      root.style.pointerEvents = 'none';
      overlay.classList.add('show');
      clearValidation();
      sendBtn.disabled = true;
      backButtons.forEach(b => b.disabled = true);
      
      const startTime = Date.now();
      const ui = showLoaderUI(loaderMsg);
      
      if (loaderMode === 'auto') ui.auto(defaultAutoSteps);
      else if (loaderMode === 'timed') ui.timed(buildPlan());
      else { ui.phase('Démarrage...'); ui.set(5); }
      
      try {
        const resp = await post({
          url: webhookUrl, method: webhookMethod, headers: webhookHeaders,
          timeoutMs: webhookTimeoutMs, retries: webhookRetries,
          files: selectedFiles, fileFieldName, extra, vfContext
        });
        
        let data = resp?.data ?? null;
        
        if (awaitResponse && pollingEnabled) {
          const jobId = data?.jobId;
          const statusUrl = data?.statusUrl || p?.polling?.statusUrl;
          if (statusUrl || jobId) {
            data = await poll({
              statusUrl: statusUrl || `${webhookUrl.split('/webhook')[0]}/rest/jobs/${jobId}`,
              headers: pollingHeaders, intervalMs: pollingIntervalMs,
              maxAttempts: pollingMaxAttempts,
              onTick: st => {
                if (loaderMode === 'external') {
                  const pct = Number.isFinite(st?.percent) ? clamp(st.percent, 0, 100) : undefined;
                  const key = st?.phase;
                  const map = key && stepMap[key] ? stepMap[key] : null;
                  const text = st?.message || map?.text;
                  if (text) ui.phase(text);
                  if (pct != null) ui.set(pct);
                  else if (map?.progress != null) ui.soft(map.progress);
                }
              }
            });
          }
        }
        
        const elapsed = Date.now() - startTime;
        const remain = minLoadingTimeMs - elapsed;
        if (remain > 0) {
          ui.phase('Finalisation...');
          ui.to(98, Math.min(remain, 1500));
          await new Promise(r => setTimeout(r, remain));
        }
        
        ui.done(data, chatRefs);
        
      } catch (err) {
        loader.classList.remove('show');
        bodyDiv.style.display = '';
        showMsg(String(err?.message || err), 'err');
        sendBtn.disabled = false;
        backButtons.forEach(b => b.disabled = false);
        root.style.pointerEvents = '';
        overlay.classList.remove('show');
        enableChatInput(chatRefs);
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, error: String(err?.message || err), buttonPath: 'error' }
        });
      }
    };
    
    // ---------- Loader ----------
    function showLoaderUI(msg) {
      loaderTitle.textContent = msg;
      loader.classList.add('show');
      bodyDiv.style.display = 'none';
      
      let cur = 0, locked = false;
      
      const paint = () => {
        loaderFill.style.width = `${cur}%`;
        loaderPct.textContent = `${Math.round(cur)}%`;
      };
      paint();
      
      const clear = () => { if (timedTimer) { clearInterval(timedTimer); timedTimer = null; } };
      
      return {
        auto(steps) {
          let i = 0;
          const go = () => {
            if (i >= steps.length || locked) return;
            const s = steps[i];
            if (s.text) this.phase(s.text);
            this.to(s.progress, 1800, () => { i++; go(); });
          };
          go();
        },
        
        timed(plan) {
          let idx = 0;
          const next = () => {
            if (idx >= plan.length || locked) return;
            const p = plan[idx++];
            this.phase(p.text);
            const t0 = Date.now(), t1 = t0 + p.durationMs;
            clear();
            timedTimer = setInterval(() => {
              const now = Date.now();
              const r = clamp((now - t0) / p.durationMs, 0, 1);
              cur = p.progressStart + (p.progressEnd - p.progressStart) * r;
              paint();
              if (now >= t1) { clear(); cur = p.progressEnd; paint(); next(); }
            }, 80);
          };
          next();
        },
        
        phase(t) { if (t) loaderStep.textContent = t; },
        set(p) { if (!locked) { cur = clamp(p, 0, 100); paint(); } },
        soft(p) { if (!locked) { cur += (clamp(p, 0, 100) - cur) * 0.5; paint(); } },
        
        to(target, ms = 1200, cb) {
          const s = cur, e = clamp(target, 0, 100), t0 = performance.now();
          const step = t => {
            const k = clamp((t - t0) / ms, 0, 1);
            cur = s + (e - s) * k;
            paint();
            if (k < 1) requestAnimationFrame(step);
            else if (cb) cb();
          };
          requestAnimationFrame(step);
        },
        
        done(data, refs) {
          locked = true;
          clear();
          this.to(100, 400, () => {
            this.phase('Terminé');
            setTimeout(() => {
              loader.classList.add('hide');
              setTimeout(() => {
                loader.classList.remove('show', 'hide');
                
                if (showConfirmation) {
                  // Mode confirmation : afficher l'écran avec bouton "Continuer"
                  bodyDiv.style.display = 'none';
                  confirmDiv.classList.add('show');
                  overlay.classList.remove('show');
                  root.style.pointerEvents = '';
                  
                  // Stocker les données pour le clic sur le bouton
                  confirmBtn.onclick = () => {
                    // Cacher le composant
                    root.style.display = 'none';
                    enableChatInput(refs);
                    
                    // Envoyer le message utilisateur dans le chat
                    if (showUserMessageOnSend) {
                      if (useNativeInteract) {
                        window?.voiceflow?.chat?.interact?.({
                          type: 'text',
                          payload: confirmationUserMessage
                        });
                      } else {
                        showUserMessage(confirmationUserMessage);
                      }
                    }
                    
                    // Envoyer le complete à Voiceflow (délai plus long pour laisser le message s'afficher)
                    setTimeout(() => {
                      window?.voiceflow?.chat?.interact?.({
                        type: 'complete',
                        payload: {
                          webhookSuccess: true,
                          webhookResponse: data,
                          files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                          buttonPath: 'success'
                        }
                      });
                    }, 500);
                  };
                  
                } else {
                  // Mode direct : fermer et envoyer complete immédiatement
                  root.style.display = 'none';
                  overlay.classList.remove('show');
                  enableChatInput(refs);
                  
                  // Afficher le message utilisateur APRÈS le chargement complet
                  if (showUserMessageOnSend) {
                    if (useNativeInteract) {
                      window?.voiceflow?.chat?.interact?.({
                        type: 'text',
                        payload: userMessageText
                      });
                    } else {
                      showUserMessage(userMessageText);
                    }
                  }
                  
                  setTimeout(() => {
                    window?.voiceflow?.chat?.interact?.({
                      type: 'complete',
                      payload: {
                        webhookSuccess: true,
                        webhookResponse: data,
                        files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                        buttonPath: 'success'
                      }
                    });
                  }, 200);
                }
              }, 200);
            }, autoCloseDelayMs);
          });
        }
      };
    }
    
    function buildPlan() {
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
          text: s.text, durationMs: i === 0 ? 1000 : 1500,
          progressStart: i ? arr[i - 1].progress : 0, progressEnd: s.progress
        }));
      }
      return plan;
    }
    
    // ---------- Network ----------
    async function post({ url, method, headers, timeoutMs, retries, files, fileFieldName, extra, vfContext }) {
      let err;
      for (let i = 0; i <= retries; i++) {
        try {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), timeoutMs);
          const fd = new FormData();
          files.forEach(f => fd.append(fileFieldName, f, f.name));
          Object.entries(extra).forEach(([k, v]) => fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')));
          if (vfContext.conversation_id) fd.append('conversation_id', vfContext.conversation_id);
          if (vfContext.user_id) fd.append('user_id', vfContext.user_id);
          if (vfContext.locale) fd.append('locale', vfContext.locale);
          const h = { ...headers };
          delete h['Content-Type'];
          const r = await fetch(url, { method, headers: h, body: fd, signal: ctrl.signal });
          clearTimeout(to);
          if (!r.ok) throw new Error(`Erreur ${r.status}`);
          return { ok: true, data: await r.json().catch(() => null) };
        } catch (e) {
          err = e;
          if (i < retries) await new Promise(r => setTimeout(r, 900));
        }
      }
      throw err || new Error('Échec');
    }
    
    async function poll({ statusUrl, headers, intervalMs, maxAttempts, onTick }) {
      for (let i = 1; i <= maxAttempts; i++) {
        const r = await fetch(statusUrl, { headers });
        if (!r.ok) throw new Error(`Polling ${r.status}`);
        const j = await r.json().catch(() => ({}));
        if (j?.status === 'error') throw new Error(j?.error || 'Erreur');
        if (typeof onTick === 'function') onTick({ percent: j?.percent, phase: j?.phase, message: j?.message });
        if (j?.status === 'done') return j?.data ?? j;
        await new Promise(r => setTimeout(r, intervalMs));
      }
      throw new Error('Timeout');
    }
    
    return () => { if (timedTimer) clearInterval(timedTimer); };
  }
};

try { window.UploadToN8nWithLoader = UploadToN8nWithLoader; } catch {}
