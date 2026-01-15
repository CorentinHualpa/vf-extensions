// LoaderFuturistic.js – v8.0 FUTURISTIC EDITION
// © Corentin – Design ultra moderne et futuriste
// Compatible mode embedded ET widget
// v8.0 : Design futuriste avec couleur principale configurable
//        Animations fluides, glassmorphism, effets lumineux
//        Loader cinétique impressionnant
//
export const LoaderFuturistic = {
  name: 'LoaderFuturistic',
  type: 'response',
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = s => /(^ext_)?LoaderFuturistic$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[LoaderFuturistic.match] error:', e);
      return false;
    }
  },
  
  render({ trace, element }) {
    if (!element) {
      console.error('[LoaderFuturistic] Élément parent introuvable');
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
    
    const chatRefs = disableChatInput();
    
    // ---------- AUTO-UNLOCK : Détecte si une autre action est déclenchée ----------
    let isComponentActive = true;
    let cleanupObserver = null;
    let timedTimer = null;
    
    const setupAutoUnlock = () => {
      const container = findChatContainer();
      if (!container?.shadowRoot) return null;
      
      const shadowRoot = container.shadowRoot;
      const selectors = [
        '.vfrc-chat--dialog',
        '[class*="Dialog"]',
        '[class*="dialog"]',
        '.vfrc-chat',
        '[class*="Messages"]',
        '[class*="messages"]'
      ];
      
      let dialogEl = null;
      for (const sel of selectors) {
        dialogEl = shadowRoot.querySelector(sel);
        if (dialogEl) break;
      }
      
      if (!dialogEl) return null;
      
      const observer = new MutationObserver((mutations) => {
        if (!isComponentActive) return;
        
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.dataset?.uploadExtension === 'true') continue;
            
            const isSystemResponse = 
              node.classList?.contains('vfrc-system-response') ||
              node.classList?.contains('vfrc-assistant') ||
              node.querySelector?.('[class*="assistant"]') ||
              node.querySelector?.('[class*="system"]') ||
              node.querySelector?.('[class*="Agent"]') ||
              node.querySelector?.('[class*="extension"]') ||
              node.querySelector?.('.upl-futuristic');
            
            if (isSystemResponse) {
              console.log('[LoaderFuturistic] Another action detected, auto-unlocking...');
              autoUnlock();
              return;
            }
          }
        }
      });
      
      observer.observe(dialogEl, { childList: true, subtree: true });
      return () => observer.disconnect();
    };
    
    const autoUnlock = () => {
      if (!isComponentActive) return;
      isComponentActive = false;
      
      if (cleanupObserver) {
        cleanupObserver();
        cleanupObserver = null;
      }
      
      enableChatInput(chatRefs);
      root.style.display = 'none';
      
      if (timedTimer) {
        clearInterval(timedTimer);
        timedTimer = null;
      }
    };
    
    cleanupObserver = setupAutoUnlock();
    
    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    const title         = p.title || '';
    const subtitle      = p.subtitle || '';
    const description   = p.description || 'Déposez vos fichiers ici';
    const accept        = p.accept || '.pdf,.docx';
    const maxFileSizeMB = p.maxFileSizeMB || 25;
    const maxFiles      = p.maxFiles || 10;
    
    // ═══════════════════════════════════════════════════════════════
    // 🎨 COULEUR PRINCIPALE CONFIGURABLE
    // ═══════════════════════════════════════════════════════════════
    const primaryColor = p.primaryColor || p.accentColor || '#6366F1'; // Indigo par défaut
    
    // Fonction pour convertir hex en RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 99, g: 102, b: 241 };
    };
    
    // Fonction pour éclaircir une couleur
    const lightenColor = (hex, percent) => {
      const rgb = hexToRgb(hex);
      const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent / 100));
      const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent / 100));
      const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent / 100));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    // Fonction pour assombrir une couleur
    const darkenColor = (hex, percent) => {
      const rgb = hexToRgb(hex);
      const r = Math.max(0, Math.floor(rgb.r * (100 - percent) / 100));
      const g = Math.max(0, Math.floor(rgb.g * (100 - percent) / 100));
      const b = Math.max(0, Math.floor(rgb.b * (100 - percent) / 100));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    const primaryRgb = hexToRgb(primaryColor);
    const primaryLight = lightenColor(primaryColor, 30);
    const primaryDark = darkenColor(primaryColor, 20);
    const primaryUltraLight = lightenColor(primaryColor, 85);
    
    // Palette dérivée de la couleur principale
    const colors = {
      primary: primaryColor,
      primaryLight: primaryLight,
      primaryDark: primaryDark,
      primaryUltraLight: primaryUltraLight,
      primaryRgb: `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      text: '#1F2937',
      textLight: '#6B7280',
      textMuted: '#9CA3AF',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      bg: '#FFFFFF',
      bgSecondary: '#F9FAFB',
      bgTertiary: '#F3F4F6',
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
    
    const sendButtonText = p.sendButtonText || 'Envoyer';
    
    // Nouvelles options de confirmation
    const showConfirmation = p.showConfirmation !== false;
    const confirmationMessage = p.confirmationMessage || '✅ Documents uploadés avec succès !';
    const confirmationButtonText = p.confirmationButtonText || 'Continuer';
    const confirmationUserMessage = p.confirmationUserMessage || '';
    const showUserMessageOnSend = p.showUserMessageOnSend !== false;
    const useNativeInteract = p.useNativeInteract !== false;
    
    const vfContext = {
      conversation_id: p.conversation_id || null,
      user_id: p.user_id || null,
      locale: p.locale || null,
    };
    
    const loaderCfg = p.loader || {};
    const loaderMode = (loaderCfg.mode || 'auto').toLowerCase();
    const minLoadingTimeMs = Number(loaderCfg.minLoadingTimeMs) > 0 ? Number(loaderCfg.minLoadingTimeMs) : 0;
    const autoCloseDelayMs = Number(loaderCfg.autoCloseDelayMs) > 0 ? Number(loaderCfg.autoCloseDelayMs) : 800;
    
    const defaultAutoSteps = [
      { progress: 0 },
      { progress: 30 },
      { progress: 60 },
      { progress: 85 },
      { progress: 100 }
    ];
    
    const timedPhases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : [];
    const totalSeconds = Number(loaderCfg.totalSeconds) > 0 ? Number(loaderCfg.totalSeconds) : 120;
    
    const stepMap = loaderCfg.stepMap || {};
    
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
    
    let hintText = '';
    if (p.hint === false || p.hint === '') {
      hintText = '';
    } else if (typeof p.hint === 'string' && p.hint.trim() !== '') {
      hintText = p.hint;
    } else {
      let requiredDocsInfo;
      if (isSimpleMode) {
        requiredDocsInfo = requiredFiles === 1 
          ? `1 à ${maxFiles} fichiers` 
          : `${requiredFiles} à ${maxFiles} fichiers`;
      } else {
        requiredDocsInfo = `${requiredFiles} documents requis`;
      }
      hintText = requiredDocsInfo;
    }
    
    const showHint = hintText && hintText.trim() !== '';
    
    let docsListOBMS = '• Lettre de mission / Descriptif du poste\n• CV du candidat';
    let docsListFull = '• Lettre de mission / Descriptif du poste\n• CV du candidat\n• Profil AssessFirst du candidat';
    
    // Générer un ID unique pour cette instance
    const instanceId = `upl_${Math.random().toString(36).substr(2, 9)}`;
    
    // ---------- STYLES FUTURISTES ----------
    const styles = `
      /* ═══════════════════════════════════════════════════════════════
         🎬 ANIMATIONS FUTURISTES
         ═══════════════════════════════════════════════════════════════ */
      @keyframes ${instanceId}_fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes ${instanceId}_fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.98); }
      }
      
      @keyframes ${instanceId}_slideUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes ${instanceId}_pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      
      @keyframes ${instanceId}_shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes ${instanceId}_borderGlow {
        0%, 100% { 
          box-shadow: 0 0 0 0 rgba(${colors.primaryRgb}, 0);
        }
        50% { 
          box-shadow: 0 0 20px 2px rgba(${colors.primaryRgb}, 0.15);
        }
      }
      
      @keyframes ${instanceId}_iconFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      
      @keyframes ${instanceId}_progressGlow {
        0%, 100% { 
          filter: brightness(1) drop-shadow(0 0 8px rgba(${colors.primaryRgb}, 0.4));
        }
        50% { 
          filter: brightness(1.1) drop-shadow(0 0 12px rgba(${colors.primaryRgb}, 0.6));
        }
      }
      
      @keyframes ${instanceId}_orbFloat {
        0%, 100% { 
          transform: translate(0, 0) scale(1);
          opacity: 0.6;
        }
        33% { 
          transform: translate(10px, -10px) scale(1.1);
          opacity: 0.8;
        }
        66% { 
          transform: translate(-5px, 5px) scale(0.95);
          opacity: 0.5;
        }
      }
      
      @keyframes ${instanceId}_ringPulse {
        0% { 
          transform: scale(0.8);
          opacity: 0.8;
        }
        100% { 
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      @keyframes ${instanceId}_dotBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      
      @keyframes ${instanceId}_checkDraw {
        from { stroke-dashoffset: 24; }
        to { stroke-dashoffset: 0; }
      }
      
      @keyframes ${instanceId}_successPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      
      /* ═══════════════════════════════════════════════════════════════
         🎨 CONTENEUR PRINCIPAL
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId} {
        width: 100%;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: ${colors.text};
        animation: ${instanceId}_fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        -webkit-font-smoothing: antialiased;
      }
      
      .${instanceId} * {
        box-sizing: border-box;
      }
      
      /* ═══════════════════════════════════════════════════════════════
         💎 CARTE PRINCIPALE - GLASSMORPHISM
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-card {
        background: linear-gradient(135deg, 
          rgba(255, 255, 255, 0.95) 0%, 
          rgba(255, 255, 255, 0.85) 100%
        );
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(${colors.primaryRgb}, 0.1);
        border-radius: 16px;
        overflow: hidden;
        position: relative;
        box-shadow: 
          0 4px 24px -4px rgba(0, 0, 0, 0.08),
          0 0 0 1px rgba(255, 255, 255, 0.5) inset;
      }
      
      .${instanceId}-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(${colors.primaryRgb}, 0.3) 50%, 
          transparent 100%
        );
      }
      
      /* ═══════════════════════════════════════════════════════════════
         📋 HEADER
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-header {
        padding: 20px 24px 0;
        position: relative;
      }
      
      .${instanceId}-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 24px;
        right: 24px;
        height: 1px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          ${colors.border} 20%, 
          ${colors.border} 80%, 
          transparent 100%
        );
      }
      
      .${instanceId}-title {
        font-size: 16px;
        font-weight: 600;
        color: ${colors.text};
        margin: 0 0 4px;
        letter-spacing: -0.3px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .${instanceId}-title::before {
        content: '';
        width: 4px;
        height: 4px;
        background: ${colors.primary};
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(${colors.primaryRgb}, 0.5);
      }
      
      .${instanceId}-subtitle {
        font-size: 13px;
        color: ${colors.textLight};
        font-weight: 400;
        padding-left: 12px;
      }
      
      /* ═══════════════════════════════════════════════════════════════
         📂 ZONE DE DROP FUTURISTE
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-body {
        padding: 20px 24px 24px;
      }
      
      .${instanceId}-body.no-header {
        padding-top: 24px;
      }
      
      .${instanceId}-zone {
        background: linear-gradient(135deg, 
          ${colors.primaryUltraLight} 0%, 
          rgba(${colors.primaryRgb}, 0.03) 100%
        );
        border: 2px dashed rgba(${colors.primaryRgb}, 0.25);
        border-radius: 12px;
        padding: 32px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }
      
      .${instanceId}-zone::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
          circle at center,
          rgba(${colors.primaryRgb}, 0.08) 0%,
          transparent 70%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .${instanceId}-zone:hover {
        border-color: rgba(${colors.primaryRgb}, 0.5);
        transform: translateY(-2px);
        box-shadow: 
          0 8px 32px -8px rgba(${colors.primaryRgb}, 0.2),
          0 0 0 4px rgba(${colors.primaryRgb}, 0.05);
      }
      
      .${instanceId}-zone:hover::before {
        opacity: 1;
      }
      
      .${instanceId}-zone.drag {
        border-color: ${colors.primary};
        background: linear-gradient(135deg, 
          rgba(${colors.primaryRgb}, 0.1) 0%, 
          rgba(${colors.primaryRgb}, 0.05) 100%
        );
        transform: scale(1.02);
        animation: ${instanceId}_borderGlow 1.5s ease-in-out infinite;
      }
      
      .${instanceId}-zone-icon-wrapper {
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-shadow: 
          0 8px 24px -4px rgba(${colors.primaryRgb}, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.2) inset;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId}-zone:hover .${instanceId}-zone-icon-wrapper {
        transform: translateY(-4px);
        box-shadow: 
          0 12px 32px -4px rgba(${colors.primaryRgb}, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.3) inset;
      }
      
      .${instanceId}-zone-icon-wrapper::before {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid rgba(${colors.primaryRgb}, 0.2);
        border-radius: 18px;
        animation: ${instanceId}_ringPulse 2s ease-out infinite;
      }
      
      .${instanceId}-zone-icon {
        width: 24px;
        height: 24px;
        color: white;
        animation: ${instanceId}_iconFloat 3s ease-in-out infinite;
      }
      
      .${instanceId}-zone-text {
        font-size: 14px;
        color: ${colors.text};
        font-weight: 500;
        line-height: 1.6;
        margin-bottom: 8px;
      }
      
      .${instanceId}-zone-hint {
        font-size: 12px;
        color: ${colors.textMuted};
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(${colors.primaryRgb}, 0.08);
        border-radius: 20px;
        margin-top: 4px;
      }
      
      .${instanceId}-zone-hint::before {
        content: '';
        width: 6px;
        height: 6px;
        background: ${colors.primary};
        border-radius: 50%;
        opacity: 0.6;
      }
      
      /* ═══════════════════════════════════════════════════════════════
         📄 LISTE DES FICHIERS
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-list {
        margin-top: 16px;
        display: none;
      }
      
      .${instanceId}-list.show {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .${instanceId}-item {
        display: flex;
        align-items: center;
        padding: 12px 14px;
        background: linear-gradient(135deg, 
          ${colors.bgSecondary} 0%, 
          rgba(${colors.primaryRgb}, 0.02) 100%
        );
        border: 1px solid ${colors.borderLight};
        border-radius: 10px;
        animation: ${instanceId}_slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        transition: all 0.2s ease;
      }
      
      .${instanceId}-item:hover {
        border-color: rgba(${colors.primaryRgb}, 0.2);
        box-shadow: 0 4px 12px -4px rgba(${colors.primaryRgb}, 0.1);
      }
      
      .${instanceId}-item-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, 
          rgba(${colors.primaryRgb}, 0.1) 0%, 
          rgba(${colors.primaryRgb}, 0.05) 100%
        );
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .${instanceId}-item-icon svg {
        width: 18px;
        height: 18px;
        color: ${colors.primary};
      }
      
      .${instanceId}-item-info {
        flex: 1;
        min-width: 0;
      }
      
      .${instanceId}-item-name {
        font-size: 13px;
        font-weight: 500;
        color: ${colors.text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .${instanceId}-item-size {
        font-size: 11px;
        color: ${colors.textMuted};
        margin-top: 2px;
      }
      
      .${instanceId}-item-del {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: ${colors.textMuted};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        margin-left: 8px;
        transition: all 0.2s ease;
      }
      
      .${instanceId}-item-del:hover {
        background: ${colors.errorLight};
        color: ${colors.error};
        transform: scale(1.1);
      }
      
      /* ═══════════════════════════════════════════════════════════════
         📊 META BAR
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid ${colors.border};
      }
      
      .${instanceId}-count {
        font-size: 12px;
        color: ${colors.textLight};
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .${instanceId}-count::before {
        content: '';
        width: 8px;
        height: 8px;
        background: ${colors.textMuted};
        border-radius: 50%;
        transition: all 0.3s ease;
      }
      
      .${instanceId}-count.ok::before {
        background: ${colors.success};
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
      }
      
      .${instanceId}-count.ok {
        color: ${colors.success};
        font-weight: 500;
      }
      
      .${instanceId}-actions {
        display: flex;
        gap: 8px;
      }
      
      /* ═══════════════════════════════════════════════════════════════
         🔘 BOUTONS FUTURISTES
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        border: none;
        position: relative;
        overflow: hidden;
      }
      
      .${instanceId}-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, 
          rgba(255, 255, 255, 0.2) 0%, 
          transparent 50%
        );
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .${instanceId}-btn:hover::before {
        opacity: 1;
      }
      
      .${instanceId}-btn-primary {
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
        color: white;
        box-shadow: 
          0 4px 16px -4px rgba(${colors.primaryRgb}, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }
      
      .${instanceId}-btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 
          0 8px 24px -4px rgba(${colors.primaryRgb}, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.2) inset;
      }
      
      .${instanceId}-btn-primary:active:not(:disabled) {
        transform: translateY(0);
      }
      
      .${instanceId}-btn-primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }
      
      .${instanceId}-btn-ghost {
        background: transparent;
        color: ${colors.textLight};
        border: 1px solid ${colors.border};
      }
      
      .${instanceId}-btn-ghost:hover {
        background: ${colors.bgSecondary};
        border-color: rgba(${colors.primaryRgb}, 0.2);
        color: ${colors.text};
      }
      
      /* ═══════════════════════════════════════════════════════════════
         💬 MESSAGES
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-msg {
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: 8px;
        font-size: 12px;
        display: none;
        animation: ${instanceId}_slideUp 0.2s ease;
        border-left: 3px solid transparent;
      }
      
      .${instanceId}-msg.show {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .${instanceId}-msg.err {
        background: ${colors.errorLight};
        color: ${colors.error};
        border-left-color: ${colors.error};
      }
      
      .${instanceId}-msg.ok {
        background: ${colors.successLight};
        color: ${colors.success};
        border-left-color: ${colors.success};
      }
      
      .${instanceId}-msg.warn {
        background: ${colors.warningLight};
        color: ${colors.warning};
        border-left-color: ${colors.warning};
      }
      
      .${instanceId}-msg.load {
        background: ${colors.bgSecondary};
        color: ${colors.textLight};
        border-left-color: ${colors.primary};
      }
      
      /* ═══════════════════════════════════════════════════════════════
         ⏳ LOADER FUTURISTE
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-loader {
        display: none;
        padding: 40px 32px;
        animation: ${instanceId}_fadeIn 0.3s ease;
      }
      
      .${instanceId}-loader.show {
        display: block;
      }
      
      .${instanceId}-loader.hide {
        animation: ${instanceId}_fadeOut 0.2s ease forwards;
      }
      
      .${instanceId}-loader-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 32px;
      }
      
      .${instanceId}-loader-orb {
        width: 80px;
        height: 80px;
        position: relative;
        margin-bottom: 24px;
      }
      
      .${instanceId}-loader-orb-ring {
        position: absolute;
        inset: 0;
        border: 2px solid rgba(${colors.primaryRgb}, 0.1);
        border-radius: 50%;
      }
      
      .${instanceId}-loader-orb-ring::before {
        content: '';
        position: absolute;
        inset: -2px;
        border: 2px solid transparent;
        border-top-color: ${colors.primary};
        border-radius: 50%;
        animation: ${instanceId}_spin 1.2s linear infinite;
      }
      
      @keyframes ${instanceId}_spin {
        to { transform: rotate(360deg); }
      }
      
      .${instanceId}-loader-orb-core {
        position: absolute;
        inset: 12px;
        background: linear-gradient(135deg, 
          rgba(${colors.primaryRgb}, 0.15) 0%, 
          rgba(${colors.primaryRgb}, 0.05) 100%
        );
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .${instanceId}-loader-orb-icon {
        width: 28px;
        height: 28px;
        color: ${colors.primary};
        animation: ${instanceId}_pulse 2s ease-in-out infinite;
      }
      
      .${instanceId}-loader-dots {
        display: flex;
        gap: 6px;
      }
      
      .${instanceId}-loader-dot {
        width: 8px;
        height: 8px;
        background: ${colors.primary};
        border-radius: 50%;
        animation: ${instanceId}_dotBounce 0.6s ease-in-out infinite;
      }
      
      .${instanceId}-loader-dot:nth-child(2) {
        animation-delay: 0.1s;
        opacity: 0.7;
      }
      
      .${instanceId}-loader-dot:nth-child(3) {
        animation-delay: 0.2s;
        opacity: 0.4;
      }
      
      .${instanceId}-loader-progress {
        width: 100%;
      }
      
      .${instanceId}-loader-bar-container {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .${instanceId}-loader-bar {
        flex: 1;
        height: 6px;
        background: ${colors.bgTertiary};
        border-radius: 3px;
        overflow: hidden;
        position: relative;
      }
      
      .${instanceId}-loader-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight});
        border-radius: 3px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        animation: ${instanceId}_progressGlow 2s ease-in-out infinite;
      }
      
      .${instanceId}-loader-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.4) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: ${instanceId}_shimmer 1.5s infinite;
      }
      
      .${instanceId}-loader-pct {
        font-size: 18px;
        font-weight: 600;
        color: ${colors.primary};
        font-variant-numeric: tabular-nums;
        min-width: 56px;
        text-align: right;
        text-shadow: 0 0 20px rgba(${colors.primaryRgb}, 0.3);
      }
      
      /* État complété */
      .${instanceId}-loader.complete .${instanceId}-loader-fill {
        background: linear-gradient(90deg, ${colors.success}, #34D399);
        animation: none;
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-fill::after {
        animation: none;
        opacity: 0;
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-pct {
        color: ${colors.success};
        text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-orb-ring::before {
        animation: none;
        border-top-color: ${colors.success};
        border-right-color: ${colors.success};
        border-bottom-color: ${colors.success};
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-orb-core {
        background: linear-gradient(135deg, 
          rgba(16, 185, 129, 0.15) 0%, 
          rgba(16, 185, 129, 0.05) 100%
        );
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-orb-icon {
        color: ${colors.success};
        animation: none;
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-dot {
        background: ${colors.success};
        animation: none;
      }
      
      /* ═══════════════════════════════════════════════════════════════
         ✅ ÉCRAN DE CONFIRMATION
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-confirm {
        display: none;
        padding: 40px 32px;
        text-align: center;
        animation: ${instanceId}_fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId}-confirm.show {
        display: block;
      }
      
      .${instanceId}-confirm-icon {
        width: 72px;
        height: 72px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, 
          rgba(16, 185, 129, 0.15) 0%, 
          rgba(16, 185, 129, 0.05) 100%
        );
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: ${instanceId}_successPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId}-confirm-icon::before {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid rgba(16, 185, 129, 0.2);
        border-radius: 50%;
      }
      
      .${instanceId}-confirm-icon svg {
        width: 32px;
        height: 32px;
        color: ${colors.success};
      }
      
      .${instanceId}-confirm-icon svg path {
        stroke-dasharray: 24;
        stroke-dashoffset: 24;
        animation: ${instanceId}_checkDraw 0.4s ease 0.2s forwards;
      }
      
      .${instanceId}-confirm-text {
        font-size: 15px;
        font-weight: 500;
        color: ${colors.text};
        margin-bottom: 24px;
        line-height: 1.5;
      }
      
      .${instanceId}-confirm-btn {
        padding: 12px 32px;
        background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px -4px rgba(16, 185, 129, 0.5);
      }
      
      .${instanceId}-confirm-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px -4px rgba(16, 185, 129, 0.6);
      }
      
      /* ═══════════════════════════════════════════════════════════════
         ⚠️ VALIDATION
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-valid {
        margin-top: 16px;
        padding: 16px;
        background: linear-gradient(135deg, 
          rgba(245, 158, 11, 0.08) 0%, 
          rgba(245, 158, 11, 0.02) 100%
        );
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 10px;
        animation: ${instanceId}_slideUp 0.2s ease;
      }
      
      .${instanceId}-valid-title {
        font-size: 13px;
        font-weight: 600;
        color: ${colors.warning};
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .${instanceId}-valid-title::before {
        content: '⚠️';
        font-size: 14px;
      }
      
      .${instanceId}-valid-text {
        font-size: 12px;
        color: ${colors.text};
        line-height: 1.6;
        white-space: pre-line;
        margin-bottom: 16px;
      }
      
      .${instanceId}-valid-actions {
        display: flex;
        gap: 8px;
      }
      
      /* ═══════════════════════════════════════════════════════════════
         🔒 OVERLAY
         ═══════════════════════════════════════════════════════════════ */
      .${instanceId}-overlay {
        display: none;
        position: absolute;
        inset: 0;
        background: transparent;
        z-index: 10;
        border-radius: 16px;
        pointer-events: all;
      }
      
      .${instanceId}-overlay.show {
        display: block;
      }
    `;
    
    // ---------- ICÔNES SVG ----------
    const icons = {
      upload: `<svg class="${instanceId}-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>`,
      file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>`,
      x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`,
      check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      loader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>`
    };
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = instanceId;
    root.style.position = 'relative';
    root.dataset.uploadExtension = 'true';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    let headerHTML = '';
    if (showHeader) {
      headerHTML = `<div class="${instanceId}-header">`;
      if (hasTitle) headerHTML += `<div class="${instanceId}-title">${title}</div>`;
      if (hasSubtitle) headerHTML += `<div class="${instanceId}-subtitle">${subtitle}</div>`;
      headerHTML += `</div>`;
    }
    
    const hintHTML = showHint ? `<div class="${instanceId}-zone-hint">${hintText}</div>` : '';
    const bodyClass = showHeader ? `${instanceId}-body` : `${instanceId}-body no-header`;
    
    root.innerHTML += `
      <div class="${instanceId}-overlay"></div>
      <div class="${instanceId}-card">
        ${headerHTML}
        <div class="${bodyClass}">
          <div class="${instanceId}-zone">
            <div class="${instanceId}-zone-icon-wrapper">
              ${icons.upload}
            </div>
            <div class="${instanceId}-zone-text">${description}</div>
            ${hintHTML}
            <input type="file" accept="${accept}" multiple style="display:none" />
          </div>
          
          <div class="${instanceId}-list"></div>
          
          <div class="${instanceId}-meta" style="display:none">
            <div class="${instanceId}-count"></div>
            <div class="${instanceId}-actions">
              ${buttons.map(b => `
                <button class="${instanceId}-btn ${instanceId}-btn-ghost back-btn" data-path="${b.path || pathError}">
                  ${b.text || 'Retour'}
                </button>
              `).join('')}
              <button class="${instanceId}-btn ${instanceId}-btn-primary send-btn" disabled>${sendButtonText}</button>
            </div>
          </div>
          
          <div class="${instanceId}-msg"></div>
        </div>
        
        <!-- LOADER FUTURISTE -->
        <div class="${instanceId}-loader">
          <div class="${instanceId}-loader-visual">
            <div class="${instanceId}-loader-orb">
              <div class="${instanceId}-loader-orb-ring"></div>
              <div class="${instanceId}-loader-orb-core">
                <svg class="${instanceId}-loader-orb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            </div>
            <div class="${instanceId}-loader-dots">
              <div class="${instanceId}-loader-dot"></div>
              <div class="${instanceId}-loader-dot"></div>
              <div class="${instanceId}-loader-dot"></div>
            </div>
          </div>
          <div class="${instanceId}-loader-progress">
            <div class="${instanceId}-loader-bar-container">
              <div class="${instanceId}-loader-bar">
                <div class="${instanceId}-loader-fill"></div>
              </div>
              <div class="${instanceId}-loader-pct">0%</div>
            </div>
          </div>
        </div>
        
        <!-- ÉCRAN DE CONFIRMATION -->
        <div class="${instanceId}-confirm">
          <div class="${instanceId}-confirm-icon">
            ${icons.check}
          </div>
          <div class="${instanceId}-confirm-text">${confirmationMessage}</div>
          <button class="${instanceId}-confirm-btn">${confirmationButtonText}</button>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const uploadZone = root.querySelector(`.${instanceId}-zone`);
    const fileInput = root.querySelector('input[type="file"]');
    const filesList = root.querySelector(`.${instanceId}-list`);
    const metaDiv = root.querySelector(`.${instanceId}-meta`);
    const countDiv = root.querySelector(`.${instanceId}-count`);
    const sendBtn = root.querySelector('.send-btn');
    const backButtons = root.querySelectorAll('.back-btn');
    const msgDiv = root.querySelector(`.${instanceId}-msg`);
    const loader = root.querySelector(`.${instanceId}-loader`);
    const loaderPct = root.querySelector(`.${instanceId}-loader-pct`);
    const loaderFill = root.querySelector(`.${instanceId}-loader-fill`);
    const overlay = root.querySelector(`.${instanceId}-overlay`);
    const bodyDiv = root.querySelector(`.${instanceId}-body`);
    const confirmDiv = root.querySelector(`.${instanceId}-confirm`);
    const confirmBtn = root.querySelector(`.${instanceId}-confirm-btn`);
    
    // ---------- STATE ----------
    let selectedFiles = [];
    let webhookResponseData = null;
    
    // ---------- Helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' o';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
      return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    }
    
    function showMsg(text, type = 'load') {
      msgDiv.textContent = text;
      msgDiv.className = `${instanceId}-msg show ${type}`;
    }
    
    function hideMsg() {
      msgDiv.className = `${instanceId}-msg`;
    }
    
    function clearValidation() {
      const v = root.querySelector(`.${instanceId}-valid`);
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
      
      countDiv.className = `${instanceId}-count${enough ? ' ok' : ''}`;
      countDiv.textContent = `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} · ${formatSize(total)}`;
      
      selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = `${instanceId}-item`;
        item.innerHTML = `
          <div class="${instanceId}-item-icon">${icons.file}</div>
          <div class="${instanceId}-item-info">
            <div class="${instanceId}-item-name">${file.name}</div>
            <div class="${instanceId}-item-size">${formatSize(file.size)}</div>
          </div>
          <button class="${instanceId}-item-del" data-i="${i}">${icons.x}</button>
        `;
        filesList.appendChild(item);
      });
      
      root.querySelectorAll(`.${instanceId}-item-del`).forEach(btn => {
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
        
        const div = document.createElement('div');
        div.className = `${instanceId}-valid`;
        div.innerHTML = `
          <div class="${instanceId}-valid-title">Documents manquants</div>
          <div class="${instanceId}-valid-text">${selectedFiles.length}/${requiredFiles} fichiers sélectionnés.

Requis :
${docs}</div>
          <div class="${instanceId}-valid-actions">
            <button class="${instanceId}-btn ${instanceId}-btn-ghost" data-a="back">Retour</button>
            <button class="${instanceId}-btn ${instanceId}-btn-primary" data-a="add">Ajouter</button>
          </div>
        `;
        bodyDiv.appendChild(div);
        
        div.querySelector('[data-a="back"]').onclick = () => {
          isComponentActive = false;
          if (cleanupObserver) {
            cleanupObserver();
            cleanupObserver = null;
          }
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
        isComponentActive = false;
        if (cleanupObserver) {
          cleanupObserver();
          cleanupObserver = null;
        }
        enableChatInput(chatRefs);
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, buttonPath: b.dataset.path || pathError }
        });
      };
    });
    
    // Bouton de confirmation
    confirmBtn.onclick = () => {
      isComponentActive = false;
      if (cleanupObserver) {
        cleanupObserver();
        cleanupObserver = null;
      }
      enableChatInput(chatRefs);
      root.style.display = 'none';
      
      const payload = {
        webhookSuccess: true,
        webhookResponse: webhookResponseData,
        files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        buttonPath: 'success'
      };
      
      if (showUserMessageOnSend && confirmationUserMessage) {
        // Envoyer un message utilisateur visible
        if (useNativeInteract) {
          window?.voiceflow?.chat?.interact?.({
            type: 'text',
            payload: confirmationUserMessage
          });
        } else {
          // Alternative: interact avec le payload
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: { ...payload, userMessage: confirmationUserMessage }
          });
        }
      } else {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: payload
        });
      }
    };
    
    sendBtn.onclick = async () => {
      if (!selectedFiles.length || !validate()) return;
      
      root.style.pointerEvents = 'none';
      overlay.classList.add('show');
      clearValidation();
      sendBtn.disabled = true;
      backButtons.forEach(b => b.disabled = true);
      
      const startTime = Date.now();
      const ui = showLoaderUI();
      
      if (loaderMode === 'auto') ui.auto(defaultAutoSteps);
      else if (loaderMode === 'timed') ui.timed(buildPlan());
      else { ui.set(5); }
      
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
                  if (pct != null) ui.set(pct);
                  else if (map?.progress != null) ui.set(map.progress);
                }
              }
            });
          }
        }
        
        const elapsed = Date.now() - startTime;
        const remain = minLoadingTimeMs - elapsed;
        if (remain > 0) {
          ui.to(98, Math.min(remain, 1500));
          await new Promise(r => setTimeout(r, remain));
        }
        
        webhookResponseData = data;
        ui.done(data, chatRefs);
        
      } catch (err) {
        isComponentActive = false;
        if (cleanupObserver) {
          cleanupObserver();
          cleanupObserver = null;
        }
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
    
    // ---------- Loader Futuriste ----------
    function showLoaderUI() {
      loader.classList.add('show');
      bodyDiv.style.display = 'none';
      
      let cur = 0;
      let locked = false;
      
      const paint = () => {
        loaderFill.style.width = `${cur}%`;
        loaderPct.textContent = `${Math.round(cur)}%`;
      };
      paint();
      
      const clear = () => { 
        if (timedTimer) { 
          clearInterval(timedTimer); 
          timedTimer = null; 
        } 
      };
      
      return {
        auto(steps) {
          let i = 0;
          const go = () => {
            if (i >= steps.length || locked) return;
            const s = steps[i];
            this.to(s.progress, 1800, () => { i++; go(); });
          };
          go();
        },
        
        timed(plan) {
          let idx = 0;
          const next = () => {
            if (idx >= plan.length || locked) return;
            const p = plan[idx++];
            const t0 = Date.now(), t1 = t0 + p.durationMs;
            clear();
            timedTimer = setInterval(() => {
              if (locked) { clear(); return; }
              const now = Date.now();
              const r = clamp((now - t0) / p.durationMs, 0, 1);
              const newVal = p.progressStart + (p.progressEnd - p.progressStart) * r;
              if (newVal > cur) {
                cur = newVal;
                paint();
              }
              if (now >= t1) { 
                clear(); 
                cur = Math.max(cur, p.progressEnd); 
                paint(); 
                next(); 
              }
            }, 80);
          };
          next();
        },
        
        set(p) { 
          if (!locked && p > cur) { 
            cur = clamp(p, 0, 100); 
            paint(); 
          } 
        },
        
        to(target, ms = 1200, cb) {
          const targetClamped = clamp(target, 0, 100);
          if (targetClamped <= cur) {
            if (cb) cb();
            return;
          }
          const s = cur;
          const e = targetClamped;
          const t0 = performance.now();
          const step = t => {
            if (locked) { if (cb) cb(); return; }
            const k = clamp((t - t0) / ms, 0, 1);
            const newVal = s + (e - s) * k;
            if (newVal > cur) {
              cur = newVal;
              paint();
            }
            if (k < 1) requestAnimationFrame(step);
            else if (cb) cb();
          };
          requestAnimationFrame(step);
        },
        
        done(data, refs) {
          locked = true;
          isComponentActive = false;
          if (cleanupObserver) {
            cleanupObserver();
            cleanupObserver = null;
          }
          clear();
          
          this.to(100, 400, () => {
            loader.classList.add('complete');
            setTimeout(() => {
              loader.classList.add('hide');
              setTimeout(() => {
                loader.classList.remove('show', 'hide', 'complete');
                
                if (showConfirmation) {
                  // Afficher l'écran de confirmation
                  confirmDiv.classList.add('show');
                  overlay.classList.remove('show');
                  root.style.pointerEvents = '';
                } else {
                  // Passage direct sans confirmation
                  root.style.display = 'none';
                  overlay.classList.remove('show');
                  enableChatInput(refs);
                  
                  window?.voiceflow?.chat?.interact?.({
                    type: 'complete',
                    payload: {
                      webhookSuccess: true,
                      webhookResponse: data,
                      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                      buttonPath: 'success'
                    }
                  });
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
        return { key: ph.key, seconds: sec };
      });
      const startP = 5, endP = 98;
      const totalMs = alloc.reduce((s, a) => s + a.seconds * 1000, 0);
      let acc = 0, last = startP;
      const plan = alloc.map((a, i) => {
        const pStart = i === 0 ? startP : last;
        const pEnd = i === alloc.length - 1 ? endP : startP + (endP - startP) * ((acc + a.seconds * 1000) / totalMs);
        acc += a.seconds * 1000;
        last = pEnd;
        return { durationMs: Math.max(500, a.seconds * 1000), progressStart: pStart, progressEnd: pEnd };
      });
      if (!plan.length) {
        return defaultAutoSteps.map((s, i, arr) => ({
          durationMs: i === 0 ? 1000 : 1500,
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
    
    return () => { 
      if (timedTimer) clearInterval(timedTimer); 
      if (cleanupObserver) cleanupObserver();
      isComponentActive = false;
    };
  }
};

try { window.LoaderFuturistic = LoaderFuturistic; } catch {}
