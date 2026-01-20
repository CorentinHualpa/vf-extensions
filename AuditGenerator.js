// AuditGenerator.js – v3.0 SIMULATION MODE
// © Corentin – Extension Voiceflow pour génération d'audit
// v3.0 - Mode simulation : envoie à n8n puis simule les étapes
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
    
    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    
    console.log('[AuditGenerator v3.0] Payload reçu:', JSON.stringify(p, null, 2));
    
    // ==========================================
    // 🎯 CONFIGURATION SIMULATION
    // ==========================================
    const simulation = p.simulation || {};
    const SIMULATION_ENABLED = simulation.enabled !== false;  // true par défaut
    const SIMULATION_SECONDS = Number(simulation.totalSeconds) || 30;  // ⏱️ Durée par défaut: 30s
    
    console.log(`[AuditGenerator v3.0] Simulation: ${SIMULATION_ENABLED ? 'ON' : 'OFF'}, Durée: ${SIMULATION_SECONDS}s`);
    
    // Couleur principale
    const primaryColor = p.primaryColor || '#8B5CF6';
    
    // Fonctions couleurs
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 139, g: 92, b: 246 };
    };
    
    const primaryRgb = hexToRgb(primaryColor);
    
    const colors = {
      primary: primaryColor,
      primaryRgb: `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      text: '#1F2937',
      textMuted: '#9CA3AF',
      bgSecondary: '#F9FAFB',
      success: '#10B981',
      error: '#EF4444',
    };
    
    // Textes
    const loadingText = p.loadingText || 'Envoi en cours...';
    const successText = p.successText || '✅ Tu recevras ton audit par email !';
    const errorText = p.errorText || '❌ Erreur lors de l\'envoi';
    const buttonText = p.buttonText || 'OK';
    
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
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 30000;
    
    // Phases de simulation
    const defaultPhases = [
      { key: 'send', label: '📤 Envoi des données...' },
      { key: 'queue', label: '📋 Mise en file d\'attente...' },
      { key: 'confirm', label: '✅ Traitement lancé...' }
    ];
    const simulationPhases = simulation.phases || defaultPhases;
    
    const pathSuccess = p.pathSuccess || 'Default';
    const pathError = p.pathError || 'Fail';
    
    if (!webhookUrl) {
      console.error('[AuditGenerator] Configuration manquante : webhook.url');
      element.innerHTML = `<div style="padding:16px;color:${colors.error}">Configuration manquante</div>`;
      return;
    }
    
    // ID unique
    const id = `audit_${Math.random().toString(36).substr(2, 9)}`;
    
    // ---------- STYLES ----------
    const styles = `
      @keyframes ${id}_spin { to { transform: rotate(360deg); } }
      @keyframes ${id}_fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ${id}_pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      
      .${id} {
        font-family: 'Inter', -apple-system, sans-serif;
        animation: ${id}_fadeIn 0.3s ease;
      }
      
      .${id}-card {
        background: white;
        border: 1px solid rgba(${colors.primaryRgb}, 0.15);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
      }
      
      .${id}-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid ${colors.bgSecondary};
        border-top-color: ${colors.primary};
        border-radius: 50%;
        animation: ${id}_spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      
      .${id}-phase {
        font-size: 15px;
        font-weight: 500;
        color: ${colors.primary};
        margin-bottom: 8px;
        animation: ${id}_pulse 1.5s ease-in-out infinite;
      }
      
      .${id}-info {
        font-size: 13px;
        color: ${colors.textMuted};
        margin-bottom: 16px;
      }
      
      .${id}-progress {
        height: 4px;
        background: ${colors.bgSecondary};
        border-radius: 2px;
        overflow: hidden;
      }
      
      .${id}-bar {
        height: 100%;
        background: linear-gradient(90deg, ${colors.primary}, ${colors.success});
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      
      .${id}-success {
        display: none;
      }
      
      .${id}-success.show {
        display: block;
        animation: ${id}_fadeIn 0.3s ease;
      }
      
      .${id}-success-icon {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
      }
      
      .${id}-success-icon svg {
        width: 28px;
        height: 28px;
        color: ${colors.success};
      }
      
      .${id}-success-text {
        font-size: 15px;
        color: ${colors.text};
        margin-bottom: 16px;
        line-height: 1.5;
      }
      
      .${id}-btn {
        display: inline-block;
        padding: 10px 20px;
        background: ${colors.success};
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .${id}-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      }
      
      .${id}-error {
        display: none;
      }
      
      .${id}-error.show {
        display: block;
        animation: ${id}_fadeIn 0.3s ease;
      }
      
      .${id}-error-text {
        color: ${colors.error};
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .${id}-btn-error {
        background: ${colors.error};
      }
    `;
    
    // Extraire le message secondaire
    const loadingLines = loadingText.split('\n');
    const infoText = loadingLines[1] || '';
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = id;
    root.innerHTML = `
      <style>${styles}</style>
      <div class="${id}-card">
        <!-- LOADER -->
        <div class="${id}-loader">
          <div class="${id}-spinner"></div>
          <div class="${id}-phase">${simulationPhases[0]?.label || 'Envoi...'}</div>
          ${infoText ? `<div class="${id}-info">${infoText}</div>` : ''}
          <div class="${id}-progress"><div class="${id}-bar" style="width:0%"></div></div>
        </div>
        
        <!-- SUCCESS -->
        <div class="${id}-success">
          <div class="${id}-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="${id}-success-text">${successText}</div>
          <button class="${id}-btn">${buttonText}</button>
        </div>
        
        <!-- ERROR -->
        <div class="${id}-error">
          <div class="${id}-error-text">${errorText}</div>
          <button class="${id}-btn ${id}-btn-error">Réessayer</button>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // DOM refs
    const loader = root.querySelector(`.${id}-loader`);
    const phaseEl = root.querySelector(`.${id}-phase`);
    const barEl = root.querySelector(`.${id}-bar`);
    const successEl = root.querySelector(`.${id}-success`);
    const errorEl = root.querySelector(`.${id}-error`);
    const successBtn = successEl.querySelector('button');
    const errorBtn = errorEl.querySelector('button');
    
    // ---------- SIMULATION ----------
    function runSimulation(onComplete) {
      const phases = simulationPhases;
      const totalMs = SIMULATION_SECONDS * 1000;
      const phaseMs = totalMs / phases.length;
      
      let currentPhase = 0;
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += 100 / (totalMs / 50);  // Update every 50ms
        barEl.style.width = `${Math.min(progress, 100)}%`;
        
        // Change phase
        const newPhase = Math.floor((progress / 100) * phases.length);
        if (newPhase !== currentPhase && newPhase < phases.length) {
          currentPhase = newPhase;
          phaseEl.textContent = phases[currentPhase].label;
          console.log(`[AuditGenerator v3.0] Phase ${currentPhase + 1}/${phases.length}: ${phases[currentPhase].label}`);
        }
        
        // Complete
        if (progress >= 100) {
          clearInterval(interval);
          onComplete();
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
    
    // ---------- SHOW RESULT ----------
    function showSuccess() {
      loader.style.display = 'none';
      successEl.classList.add('show');
      
      successBtn.onclick = () => {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { success: true, buttonPath: pathSuccess }
        });
      };
      
      // Auto-complete Voiceflow
      window?.voiceflow?.chat?.interact?.({
        type: 'complete',
        payload: { success: true, buttonPath: pathSuccess }
      });
    }
    
    function showError(msg) {
      loader.style.display = 'none';
      errorEl.classList.add('show');
      if (msg) {
        errorEl.querySelector(`.${id}-error-text`).textContent = `${errorText}\n${msg}`;
      }
      
      errorBtn.onclick = () => {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { success: false, retry: true, buttonPath: pathError }
        });
      };
    }
    
    // ---------- SEND REQUEST ----------
    async function sendToN8N() {
      console.log('[AuditGenerator v3.0] Envoi vers n8n...');
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), webhookTimeoutMs);
        
        const response = await fetch(webhookUrl, {
          method: webhookMethod,
          headers: webhookHeaders,
          body: JSON.stringify({
            auditInfos,
            nbCards,
            langue,
            user_email: userEmail,
            conversationHistory
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        console.log('[AuditGenerator v3.0] Réponse n8n:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return { success: true };
        
      } catch (error) {
        console.error('[AuditGenerator v3.0] Erreur:', error.message);
        throw error;
      }
    }
    
    // ---------- START ----------
    async function start() {
      console.log('[AuditGenerator v3.0] ========== DÉMARRAGE ==========');
      console.log(`[AuditGenerator v3.0] Webhook: ${webhookUrl}`);
      console.log(`[AuditGenerator v3.0] Simulation: ${SIMULATION_SECONDS}s`);
      
      // 1. Envoyer à n8n (n8n répond immédiatement)
      try {
        await sendToN8N();
        console.log('[AuditGenerator v3.0] n8n OK, lancement simulation...');
        
        // 2. Simuler les étapes
        runSimulation(() => {
          console.log('[AuditGenerator v3.0] Simulation terminée');
          showSuccess();
        });
        
      } catch (error) {
        console.error('[AuditGenerator v3.0] Échec envoi n8n:', error.message);
        showError(error.message);
      }
    }
    
    start();
  }
};

try { window.AuditGenerator = AuditGenerator; } catch {}
