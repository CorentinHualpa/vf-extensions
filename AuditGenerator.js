// AuditGenerator.js – v3.1 ASYNC
// © Corentin – Extension Voiceflow pour génération d'audit
// v3.1 - Largeur fixe + message de fin amélioré
//
export const AuditGenerator = {
  name: 'AuditGenerator',
  type: 'response',
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = s => /(^ext_)?AuditGenerator$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[AuditGenerator.match] error:', e);
      return false;
    }
  },
  
  render({ trace, element }) {
    if (!element) {
      console.error('[AuditGenerator] Élément parent introuvable');
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
        textarea.placeholder = '⏳ Génération en cours...';
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
      return true;
    };
    
    const chatRefs = disableChatInput();
    
    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    
    console.log('[AuditGenerator v3.1 ASYNC] Payload reçu:', JSON.stringify(p, null, 2));
    
    // Couleur principale configurable
    const primaryColor = p.primaryColor || '#8B5CF6';
    
    // Fonction pour convertir hex en RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 139, g: 92, b: 246 };
    };
    
    const lightenColor = (hex, percent) => {
      const rgb = hexToRgb(hex);
      const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent / 100));
      const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent / 100));
      const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent / 100));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
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
    
    const colors = {
      primary: primaryColor,
      primaryLight: primaryLight,
      primaryDark: primaryDark,
      primaryRgb: `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      text: '#1F2937',
      textLight: '#6B7280',
      textMuted: '#9CA3AF',
      bg: '#FFFFFF',
      bgSecondary: '#F9FAFB',
      success: '#10B981',
      error: '#EF4444',
    };
    
    // Textes
    const loadingText = p.loadingText || 'Génération en cours...';
    const successText = p.successText || '✅ Préparation terminée !';
    const successSubtext = p.successSubtext || 'Tu recevras ton audit par email dans quelques instants';
    const errorText = p.errorText || '❌ Erreur lors de la génération';
    
    // Données à envoyer
    const auditInfos = p.auditInfos || '';
    const nbCards = p.nbCards || '';
    const langue = p.langue || 'fr';
    const userEmail = p.user_email || '';
    const conversationHistory = p.conversationHistory || '';
    
    // Webhook config
    const webhook = p.webhook || {};
    const webhookUrl = webhook.url;
    const webhookMethod = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders = webhook.headers || { 'Content-Type': 'application/json' };
    
    // ========================================
    // v3.1 - SIMULATION CONFIG
    // ========================================
    const loaderCfg = p.loader || {};
    // Durée totale de la simulation en secondes (minimum 120s = 2min)
    const totalSeconds = Math.max(120, Number(loaderCfg.totalSeconds) || 120);
    const autoCloseDelayMs = Number(loaderCfg.autoCloseDelayMs) > 0 ? Number(loaderCfg.autoCloseDelayMs) : 800;
    
    console.log('[AuditGenerator v3.1] Durée simulation:', totalSeconds, 'secondes');
    
    // Phases par défaut
    const defaultPhases = [
      { key: 'init', seconds: 3, label: '📥 Réception des données...' },
      { key: 'extract', seconds: 5, label: '🔍 Extraction des informations...' },
      { key: 'analyze', seconds: 8, label: '🧠 Analyse de ton profil...' },
      { key: 'scoring', seconds: 7, label: '📊 Calcul des scores...' },
      { key: 'ai_write', seconds: 15, label: '✍️ Rédaction par l\'IA...' },
      { key: 'recommendations', seconds: 10, label: '💡 Génération des recommandations...' },
      { key: 'design', seconds: 8, label: '🎨 Création du design PDF...' },
      { key: 'gamma_gen', seconds: 25, label: '📑 Génération du document...' },
      { key: 'gamma_wait', seconds: 20, label: '⏳ Finalisation du PDF...' },
      { key: 'export', seconds: 10, label: '📤 Export et préparation...' },
      { key: 'email', seconds: 5, label: '📧 Préparation de l\'envoi...' },
      { key: 'complete', seconds: 4, label: '✅ Presque terminé...' }
    ];
    
    // Récupérer les phases depuis le payload ou utiliser les défauts
    const configPhases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : [];
    const phaseLabels = Array.isArray(loaderCfg.phaseLabels) ? loaderCfg.phaseLabels : [];
    
    // Construire les phases avec labels
    let timedPhases = [];
    
    if (configPhases.length > 0) {
      timedPhases = configPhases.map((phase, idx) => {
        let labelText = phase.label;
        
        if (!labelText && phaseLabels.length > 0) {
          const labelObj = phaseLabels.find(l => l.key === phase.key);
          if (labelObj) {
            labelText = labelObj.label;
          } else if (phaseLabels[idx]) {
            labelText = phaseLabels[idx].label;
          }
        }
        
        if (!labelText) {
          const defaultPhase = defaultPhases.find(d => d.key === phase.key);
          labelText = defaultPhase?.label || `Phase ${idx + 1}...`;
        }
        
        return {
          key: phase.key || `phase_${idx}`,
          seconds: Number(phase.seconds) || 10,
          label: labelText
        };
      });
    } else {
      timedPhases = defaultPhases;
    }
    
    // Recalculer les durées pour correspondre à totalSeconds
    const currentTotal = timedPhases.reduce((sum, p) => sum + p.seconds, 0);
    const scaleFactor = totalSeconds / currentTotal;
    timedPhases = timedPhases.map(phase => ({
      ...phase,
      seconds: Math.max(1, Math.round(phase.seconds * scaleFactor))
    }));
    
    console.log('[AuditGenerator v3.1] timedPhases FINAL:', timedPhases);
    
    const pathSuccess = p.pathSuccess || 'Default';
    const pathError = p.pathError || 'Fail';
    
    if (!webhookUrl) {
      console.error('[AuditGenerator] Configuration manquante : webhook.url');
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;font-size:13px;color:${colors.error}">
        Configuration manquante : webhook.url
      </div>`;
      element.appendChild(div);
      enableChatInput(chatRefs);
      return;
    }
    
    // Générer un ID unique pour cette instance
    const instanceId = `audit_${Math.random().toString(36).substr(2, 9)}`;
    
    // ---------- STYLES ----------
    const styles = `
      @keyframes ${instanceId}_fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes ${instanceId}_fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes ${instanceId}_spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes ${instanceId}_shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes ${instanceId}_dotBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      
      @keyframes ${instanceId}_progressGlow {
        0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(${colors.primaryRgb}, 0.4)); }
        50% { filter: brightness(1.1) drop-shadow(0 0 12px rgba(${colors.primaryRgb}, 0.6)); }
      }
      
      @keyframes ${instanceId}_successPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes ${instanceId}_checkDraw {
        from { stroke-dashoffset: 24; }
        to { stroke-dashoffset: 0; }
      }
      
      @keyframes ${instanceId}_iconFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(-5deg); }
        75% { transform: translateY(-3px) rotate(5deg); }
      }
      
      @keyframes ${instanceId}_textChange {
        0% { opacity: 0; transform: translateY(-10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .${instanceId} {
        width: 100%;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: ${colors.text};
        animation: ${instanceId}_fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId} * {
        box-sizing: border-box;
      }
      
      .${instanceId}-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(${colors.primaryRgb}, 0.1);
        border-radius: 16px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
        min-width: 320px;
        max-width: 320px;
        width: 320px;
      }
      
      .${instanceId}-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(${colors.primaryRgb}, 0.3) 50%, transparent 100%);
      }
      
      /* LOADER */
      .${instanceId}-loader {
        padding: 32px 24px;
        animation: ${instanceId}_fadeIn 0.3s ease;
      }
      
      .${instanceId}-loader.hide {
        animation: ${instanceId}_fadeOut 0.2s ease forwards;
      }
      
      .${instanceId}-loader-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;
      }
      
      .${instanceId}-loader-orb {
        width: 72px;
        height: 72px;
        position: relative;
        margin-bottom: 16px;
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
        border: 3px solid transparent;
        border-top-color: ${colors.primary};
        border-right-color: rgba(${colors.primaryRgb}, 0.3);
        border-radius: 50%;
        animation: ${instanceId}_spin 1s linear infinite;
      }
      
      .${instanceId}-loader-orb-core {
        position: absolute;
        inset: 12px;
        background: linear-gradient(135deg, rgba(${colors.primaryRgb}, 0.15) 0%, rgba(${colors.primaryRgb}, 0.05) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .${instanceId}-loader-orb-icon {
        width: 28px;
        height: 28px;
        color: ${colors.primary};
        animation: ${instanceId}_iconFloat 2s ease-in-out infinite;
      }
      
      .${instanceId}-loader-phase {
        font-size: 14px;
        font-weight: 600;
        color: ${colors.primary};
        margin-bottom: 6px;
        text-align: center;
        min-height: 24px;
        transition: opacity 0.15s ease;
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .${instanceId}-loader-phase.changing {
        animation: ${instanceId}_textChange 0.3s ease;
      }
      
      .${instanceId}-loader-info {
        font-size: 12px;
        color: ${colors.textMuted};
        margin-bottom: 20px;
        text-align: center;
        line-height: 1.4;
        max-width: 280px;
      }
      
      .${instanceId}-loader-dots {
        display: flex;
        gap: 5px;
        margin-bottom: 20px;
      }
      
      .${instanceId}-loader-dot {
        width: 6px;
        height: 6px;
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
        gap: 12px;
      }
      
      .${instanceId}-loader-bar {
        flex: 1;
        height: 6px;
        background: ${colors.bgSecondary};
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
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
        background-size: 200% 100%;
        animation: ${instanceId}_shimmer 1.5s infinite;
      }
      
      .${instanceId}-loader-pct {
        font-size: 16px;
        font-weight: 600;
        color: ${colors.primary};
        font-variant-numeric: tabular-nums;
        min-width: 48px;
        text-align: right;
      }
      
      .${instanceId}-loader-counter {
        font-size: 11px;
        color: ${colors.textMuted};
        text-align: center;
        margin-top: 12px;
      }
      
      /* SUCCESS STATE */
      .${instanceId}-loader.complete .${instanceId}-loader-orb-ring::before {
        animation: none;
        border-top-color: ${colors.success};
        border-right-color: ${colors.success};
        border-bottom-color: ${colors.success};
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-orb-core {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-orb-icon {
        color: ${colors.success};
        animation: none;
      }
      
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
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-dot {
        background: ${colors.success};
        animation: none;
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-phase {
        color: ${colors.success};
      }
      
      /* RESULT SCREEN */
      .${instanceId}-result {
        display: none;
        padding: 32px 24px;
        text-align: center;
        animation: ${instanceId}_fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId}-result.show {
        display: block;
      }
      
      .${instanceId}-result-icon {
        width: 72px;
        height: 72px;
        margin: 0 auto 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: ${instanceId}_successPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId}-result-icon.success {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
      }
      
      .${instanceId}-result-icon.success::before {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid rgba(16, 185, 129, 0.2);
        border-radius: 50%;
      }
      
      .${instanceId}-result-icon.error {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
      }
      
      .${instanceId}-result-icon.error::before {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid rgba(239, 68, 68, 0.2);
        border-radius: 50%;
      }
      
      .${instanceId}-result-icon svg {
        width: 32px;
        height: 32px;
      }
      
      .${instanceId}-result-icon.success svg {
        color: ${colors.success};
      }
      
      .${instanceId}-result-icon.success svg path {
        stroke-dasharray: 24;
        stroke-dashoffset: 24;
        animation: ${instanceId}_checkDraw 0.4s ease 0.2s forwards;
      }
      
      .${instanceId}-result-icon.error svg {
        color: ${colors.error};
      }
      
      .${instanceId}-result-text {
        font-size: 15px;
        font-weight: 600;
        color: ${colors.text};
        margin-bottom: 8px;
        line-height: 1.5;
      }
      
      .${instanceId}-result-subtext {
        font-size: 13px;
        color: ${colors.textMuted};
        line-height: 1.4;
        max-width: 280px;
        margin: 0 auto;
      }
      
      .${instanceId}-result-email {
        font-size: 12px;
        color: ${colors.primary};
        margin-top: 12px;
        font-weight: 500;
      }
    `;
    
    // ---------- ICONS ----------
    const icons = {
      document: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>`,
      check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>`,
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`
    };
    
    // Extraire le message d'info (2ème ligne du loadingText)
    const loadingLines = loadingText.split('\n');
    const mainLoadingText = loadingLines[0] || loadingText;
    const infoText = loadingLines[1] || '';
    
    // Première phase à afficher
    const firstPhaseLabel = timedPhases[0]?.label || mainLoadingText;
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = instanceId;
    root.dataset.auditExtension = 'true';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    root.innerHTML += `
      <div class="${instanceId}-card">
        <!-- LOADER -->
        <div class="${instanceId}-loader">
          <div class="${instanceId}-loader-visual">
            <div class="${instanceId}-loader-orb">
              <div class="${instanceId}-loader-orb-ring"></div>
              <div class="${instanceId}-loader-orb-core">
                <div class="${instanceId}-loader-orb-icon">${icons.document}</div>
              </div>
            </div>
            <div class="${instanceId}-loader-phase">${firstPhaseLabel}</div>
            ${infoText ? `<div class="${instanceId}-loader-info">${infoText}</div>` : ''}
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
            <div class="${instanceId}-loader-counter">Étape 1/${timedPhases.length}</div>
          </div>
        </div>
        
        <!-- RESULT -->
        <div class="${instanceId}-result">
          <div class="${instanceId}-result-icon"></div>
          <div class="${instanceId}-result-text"></div>
          <div class="${instanceId}-result-subtext"></div>
          <div class="${instanceId}-result-email"></div>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const loader = root.querySelector(`.${instanceId}-loader`);
    const loaderPhase = root.querySelector(`.${instanceId}-loader-phase`);
    const loaderCounter = root.querySelector(`.${instanceId}-loader-counter`);
    const loaderPct = root.querySelector(`.${instanceId}-loader-pct`);
    const loaderFill = root.querySelector(`.${instanceId}-loader-fill`);
    const resultDiv = root.querySelector(`.${instanceId}-result`);
    const resultIcon = root.querySelector(`.${instanceId}-result-icon`);
    const resultText = root.querySelector(`.${instanceId}-result-text`);
    const resultSubtext = root.querySelector(`.${instanceId}-result-subtext`);
    const resultEmail = root.querySelector(`.${instanceId}-result-email`);
    
    // ---------- STATE ----------
    let timedTimer = null;
    let webhookSent = false;
    let webhookError = null;
    
    // ---------- Helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    
    // ---------- Send Webhook (Fire & Forget) ----------
    function sendWebhook() {
      console.log('[AuditGenerator v3.1] Envoi webhook (fire & forget)...');
      
      const body = JSON.stringify({
        auditInfos: auditInfos,
        nbCards: nbCards,
        langue: langue,
        user_email: userEmail,
        conversationHistory: conversationHistory
      });
      
      console.log('[AuditGenerator v3.1] Body length:', body.length);
      
      fetch(webhookUrl, { 
        method: webhookMethod, 
        headers: webhookHeaders, 
        body: body
      })
      .then(response => {
        console.log('[AuditGenerator v3.1] Webhook réponse status:', response.status);
        webhookSent = true;
      })
      .catch(error => {
        console.error('[AuditGenerator v3.1] Webhook erreur:', error.message);
        webhookError = error.message;
        // On ne bloque pas la simulation, le workflow continue en arrière-plan
      });
    }
    
    // ---------- Simulation Loader ----------
    function runSimulation() {
      let currentPhaseIdx = 0;
      let currentProgress = 0;
      
      const paint = () => {
        loaderFill.style.width = `${currentProgress}%`;
        loaderPct.textContent = `${Math.round(currentProgress)}%`;
      };
      
      const updatePhase = (idx) => {
        if (idx >= 0 && idx < timedPhases.length) {
          currentPhaseIdx = idx;
          const phase = timedPhases[idx];
          
          loaderPhase.classList.remove('changing');
          void loaderPhase.offsetWidth;
          loaderPhase.classList.add('changing');
          loaderPhase.textContent = phase.label;
          
          loaderCounter.textContent = `Étape ${idx + 1}/${timedPhases.length}`;
          
          console.log(`[AuditGenerator v3.1] Phase ${idx + 1}/${timedPhases.length}: ${phase.label}`);
        }
      };
      
      // Calculer le plan de progression
      const totalMs = timedPhases.reduce((sum, p) => sum + p.seconds * 1000, 0);
      let accumulatedMs = 0;
      const plan = timedPhases.map((phase, idx) => {
        const startMs = accumulatedMs;
        const durationMs = phase.seconds * 1000;
        accumulatedMs += durationMs;
        return {
          phaseIdx: idx,
          startMs,
          durationMs,
          progressStart: (startMs / totalMs) * 100,
          progressEnd: (accumulatedMs / totalMs) * 100
        };
      });
      
      const startTime = Date.now();
      
      updatePhase(0);
      paint();
      
      timedTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Trouver la phase actuelle
        let currentPlan = plan[plan.length - 1];
        for (const p of plan) {
          if (elapsed < p.startMs + p.durationMs) {
            currentPlan = p;
            break;
          }
        }
        
        // Mettre à jour la phase si nécessaire
        if (currentPlan.phaseIdx !== currentPhaseIdx) {
          updatePhase(currentPlan.phaseIdx);
        }
        
        // Calculer la progression
        const phaseElapsed = elapsed - currentPlan.startMs;
        const phaseProgress = clamp(phaseElapsed / currentPlan.durationMs, 0, 1);
        currentProgress = currentPlan.progressStart + (currentPlan.progressEnd - currentPlan.progressStart) * phaseProgress;
        currentProgress = clamp(currentProgress, 0, 100);
        
        paint();
        
        // Fin de la simulation
        if (elapsed >= totalMs) {
          clearInterval(timedTimer);
          timedTimer = null;
          currentProgress = 100;
          paint();
          
          // Afficher le succès
          setTimeout(() => {
            showSuccess();
          }, autoCloseDelayMs);
        }
      }, 50);
    }
    
    function showSuccess() {
      loaderPhase.textContent = '✅ Terminé !';
      loaderCounter.textContent = `Étape ${timedPhases.length}/${timedPhases.length}`;
      loader.classList.add('complete');
      
      setTimeout(() => {
        loader.classList.add('hide');
        setTimeout(() => {
          loader.style.display = 'none';
          
          resultDiv.classList.add('show');
          resultIcon.className = `${instanceId}-result-icon success`;
          resultIcon.innerHTML = icons.check;
          resultText.textContent = successText;
          resultSubtext.textContent = successSubtext;
          resultEmail.textContent = userEmail ? `📧 ${userEmail}` : '';
          
          enableChatInput(chatRefs);
          
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: {
              success: true,
              buttonPath: pathSuccess
            }
          });
          
        }, 200);
      }, autoCloseDelayMs);
    }
    
    // ---------- START ----------
    console.log('[AuditGenerator v3.1 ASYNC] ========== DÉMARRAGE ==========');
    console.log('[AuditGenerator v3.1] Mode: Fire & Forget + Simulation');
    console.log('[AuditGenerator v3.1] Durée totale:', totalSeconds, 'secondes');
    console.log('[AuditGenerator v3.1] Nombre de phases:', timedPhases.length);
    console.log('[AuditGenerator v3.1] Webhook URL:', webhookUrl);
    
    // 1. Envoyer le webhook immédiatement (fire & forget)
    sendWebhook();
    
    // 2. Lancer la simulation
    runSimulation();
    
    return () => { 
      if (timedTimer) clearInterval(timedTimer);
    };
  }
};

try { window.AuditGenerator = AuditGenerator; } catch {}
