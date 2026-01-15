// AuditGenerator.js – v1.0 FUTURISTIC EDITION
// © Corentin – Extension Voiceflow pour génération d'audit
// Loader automatique qui envoie les données et affiche la progression
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
    
    // Textes multilingues
    const loadingText = p.loadingText || 'Génération en cours...';
    const successText = p.successText || '✅ Audit généré avec succès !';
    const errorText = p.errorText || '❌ Erreur lors de la génération';
    const buttonText = p.buttonText || 'Voir l\'audit';
    
    // Données à envoyer
    const auditInfos = p.auditInfos || '';
    const nbCards = p.nbCards || '';
    
    // Webhook config
    const webhook = p.webhook || {};
    const webhookUrl = webhook.url;
    const webhookMethod = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders = webhook.headers || { 'Content-Type': 'application/json' };
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 120000;
    const webhookRetries = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    
    // Loader config
    const loaderCfg = p.loader || {};
    const totalSeconds = Number(loaderCfg.totalSeconds) > 0 ? Number(loaderCfg.totalSeconds) : 30;
    const autoCloseDelayMs = Number(loaderCfg.autoCloseDelayMs) > 0 ? Number(loaderCfg.autoCloseDelayMs) : 1000;
    
    const timedPhases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : [
      { key: 'init', seconds: 2 },
      { key: 'analyze', seconds: 8 },
      { key: 'generate', seconds: 15 },
      { key: 'finalize', seconds: 5 }
    ];
    
    const pathSuccess = p.pathSuccess || 'Default';
    const pathError = p.pathError || 'Fail';
    
    if (!webhookUrl) {
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
      
      @keyframes ${instanceId}_pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.98); }
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
        padding: 40px 32px;
        animation: ${instanceId}_fadeIn 0.3s ease;
      }
      
      .${instanceId}-loader.hide {
        animation: ${instanceId}_fadeOut 0.2s ease forwards;
      }
      
      .${instanceId}-loader-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 28px;
      }
      
      .${instanceId}-loader-orb {
        width: 88px;
        height: 88px;
        position: relative;
        margin-bottom: 20px;
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
        inset: 14px;
        background: linear-gradient(135deg, rgba(${colors.primaryRgb}, 0.15) 0%, rgba(${colors.primaryRgb}, 0.05) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .${instanceId}-loader-orb-icon {
        width: 32px;
        height: 32px;
        color: ${colors.primary};
        animation: ${instanceId}_iconFloat 2s ease-in-out infinite;
      }
      
      .${instanceId}-loader-text {
        font-size: 15px;
        font-weight: 500;
        color: ${colors.text};
        margin-bottom: 8px;
        text-align: center;
      }
      
      .${instanceId}-loader-dots {
        display: flex;
        gap: 6px;
        margin-bottom: 24px;
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
        height: 8px;
        background: ${colors.bgSecondary};
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }
      
      .${instanceId}-loader-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight});
        border-radius: 4px;
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
        font-size: 20px;
        font-weight: 600;
        color: ${colors.primary};
        font-variant-numeric: tabular-nums;
        min-width: 60px;
        text-align: right;
        text-shadow: 0 0 20px rgba(${colors.primaryRgb}, 0.3);
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
        text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      }
      
      .${instanceId}-loader.complete .${instanceId}-loader-dot {
        background: ${colors.success};
        animation: none;
      }
      
      /* RESULT SCREEN */
      .${instanceId}-result {
        display: none;
        padding: 40px 32px;
        text-align: center;
        animation: ${instanceId}_fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .${instanceId}-result.show {
        display: block;
      }
      
      .${instanceId}-result-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
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
        width: 36px;
        height: 36px;
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
        font-size: 16px;
        font-weight: 500;
        color: ${colors.text};
        margin-bottom: 24px;
        line-height: 1.5;
      }
      
      .${instanceId}-result-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 28px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .${instanceId}-result-btn.success {
        background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 16px -4px rgba(16, 185, 129, 0.5);
      }
      
      .${instanceId}-result-btn.success:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px -4px rgba(16, 185, 129, 0.6);
      }
      
      .${instanceId}-result-btn.error {
        background: linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%);
        color: white;
        box-shadow: 0 4px 16px -4px rgba(239, 68, 68, 0.5);
      }
      
      .${instanceId}-result-btn svg {
        width: 18px;
        height: 18px;
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
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>`,
      retry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
      </svg>`
    };
    
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
            <div class="${instanceId}-loader-text">${loadingText}</div>
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
        
        <!-- RESULT -->
        <div class="${instanceId}-result">
          <div class="${instanceId}-result-icon"></div>
          <div class="${instanceId}-result-text"></div>
          <button class="${instanceId}-result-btn"></button>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const loader = root.querySelector(`.${instanceId}-loader`);
    const loaderText = root.querySelector(`.${instanceId}-loader-text`);
    const loaderPct = root.querySelector(`.${instanceId}-loader-pct`);
    const loaderFill = root.querySelector(`.${instanceId}-loader-fill`);
    const resultDiv = root.querySelector(`.${instanceId}-result`);
    const resultIcon = root.querySelector(`.${instanceId}-result-icon`);
    const resultText = root.querySelector(`.${instanceId}-result-text`);
    const resultBtn = root.querySelector(`.${instanceId}-result-btn`);
    
    // ---------- STATE ----------
    let timedTimer = null;
    let pdfUrl = null;
    
    // ---------- Helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    
    // ---------- Loader Logic ----------
    function showLoaderUI() {
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
        
        to(target, ms = 400, cb) {
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
        
        complete(isSuccess, url) {
          locked = true;
          clear();
          pdfUrl = url;
          
          this.to(100, 400, () => {
            loader.classList.add('complete');
            setTimeout(() => {
              loader.classList.add('hide');
              setTimeout(() => {
                loader.style.display = 'none';
                showResult(isSuccess, url);
              }, 200);
            }, autoCloseDelayMs);
          });
        },
        
        error() {
          locked = true;
          clear();
          loader.classList.add('hide');
          setTimeout(() => {
            loader.style.display = 'none';
            showResult(false, null);
          }, 200);
        }
      };
    }
    
    function showResult(isSuccess, url) {
      resultDiv.classList.add('show');
      
      if (isSuccess) {
        resultIcon.className = `${instanceId}-result-icon success`;
        resultIcon.innerHTML = icons.check;
        resultText.textContent = successText;
        resultBtn.className = `${instanceId}-result-btn success`;
        resultBtn.innerHTML = `${icons.external} ${buttonText}`;
        
        resultBtn.onclick = () => {
          // Ouvrir le PDF dans un nouvel onglet
          if (url) {
            window.open(url, '_blank');
          }
          
          // Envoyer le complete à Voiceflow
          enableChatInput(chatRefs);
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: {
              success: true,
              pdfUrl: url,
              buttonPath: pathSuccess
            }
          });
        };
      } else {
        resultIcon.className = `${instanceId}-result-icon error`;
        resultIcon.innerHTML = icons.error;
        resultText.textContent = errorText;
        resultBtn.className = `${instanceId}-result-btn error`;
        resultBtn.innerHTML = `${icons.retry} Réessayer`;
        
        resultBtn.onclick = () => {
          enableChatInput(chatRefs);
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: {
              success: false,
              buttonPath: pathError
            }
          });
        };
      }
    }
    
    function buildPlan() {
      const haveSeconds = timedPhases.every(ph => Number(ph.seconds) > 0);
      let total = haveSeconds ? timedPhases.reduce((s, ph) => s + Number(ph.seconds), 0) : totalSeconds;
      const weightsSum = timedPhases.reduce((s, ph) => s + (Number(ph.weight) || 0), 0) || timedPhases.length;
      const alloc = timedPhases.map((ph) => {
        const sec = haveSeconds ? Number(ph.seconds) : (Number(ph.weight) || 1) / weightsSum * total;
        return { key: ph.key, seconds: sec };
      });
      const startP = 5, endP = 95;
      const totalMs = alloc.reduce((s, a) => s + a.seconds * 1000, 0);
      let acc = 0, last = startP;
      const plan = alloc.map((a, i) => {
        const pStart = i === 0 ? startP : last;
        const pEnd = i === alloc.length - 1 ? endP : startP + (endP - startP) * ((acc + a.seconds * 1000) / totalMs);
        acc += a.seconds * 1000;
        last = pEnd;
        return { durationMs: Math.max(500, a.seconds * 1000), progressStart: pStart, progressEnd: pEnd };
      });
      return plan;
    }
    
    // ---------- Network ----------
    async function postData() {
      let err;
      for (let i = 0; i <= webhookRetries; i++) {
        try {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), webhookTimeoutMs);
          
          const body = JSON.stringify({
            auditInfos: auditInfos,
            nbCards: nbCards
          });
          
          const r = await fetch(webhookUrl, { 
            method: webhookMethod, 
            headers: webhookHeaders, 
            body: body, 
            signal: ctrl.signal 
          });
          clearTimeout(to);
          
          if (!r.ok) throw new Error(`Erreur ${r.status}`);
          
          const data = await r.json().catch(() => null);
          return { ok: true, data };
        } catch (e) {
          err = e;
          if (i < webhookRetries) await new Promise(r => setTimeout(r, 900));
        }
      }
      throw err || new Error('Échec de la requête');
    }
    
    // ---------- START ----------
    async function start() {
      const ui = showLoaderUI();
      const plan = buildPlan();
      ui.timed(plan);
      
      try {
        const resp = await postData();
        const data = resp?.data;
        
        // Extraire l'URL du PDF depuis la réponse
        const url = data?.pdfUrl || data?.url || data?.link || null;
        
        ui.complete(true, url);
        
      } catch (err) {
        console.error('[AuditGenerator] Error:', err);
        ui.error();
      }
    }
    
    // Lancement automatique
    start();
    
    return () => { 
      if (timedTimer) clearInterval(timedTimer);
    };
  }
};

try { window.AuditGenerator = AuditGenerator; } catch {}
