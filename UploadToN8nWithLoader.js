// UploadToN8nWithLoader.js – v2.8 ULTRA-SAFE
// © Corentin-ready – optimisé pour Voiceflow + n8n
// ✅ PROTECTIONS MAXIMALES :
// 1. Extension devient incliquable dès le clic sur "Envoyer"
// 2. Chat désactivé pendant tout le traitement
// 3. Destruction complète après succès
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
    
    // ✅ DÉSACTIVER LE CHAT DÈS L'AFFICHAGE DE L'EXTENSION
    const disableChatInput = () => {
      const container = document.querySelector('#voiceflow-chat-container');
      if (!container?.shadowRoot) return null;
      
      const textarea = container.shadowRoot.querySelector('textarea.vfrc-chat-input');
      const sendBtn = container.shadowRoot.querySelector('#vfrc-send-message');
      
      if (textarea) {
        textarea.disabled = true;
        textarea.style.opacity = '0.5';
        textarea.placeholder = '📁 Veuillez d\'abord charger vos documents...';
        console.log('🚫 Chat désactivé : upload requis');
      }
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
      }
      
      return { textarea, sendBtn };
    };
    
    const enableChatInput = (chatRefs) => {
      if (!chatRefs) return;
      const { textarea, sendBtn } = chatRefs;
      
      if (textarea) {
        textarea.disabled = false;
        textarea.style.opacity = '1';
        textarea.placeholder = 'Message...';
        console.log('✅ Chat réactivé');
      }
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
      }
    };
    
    // Désactiver le chat immédiatement
    const chatRefs = disableChatInput();
    
    // ---------- CONFIG ----------
    const p = trace?.payload || {};
    const title         = p.title || '';
    const subtitle      = p.subtitle || '';
    const description   = p.description || 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner';
    const accept        = p.accept || '.pdf,.docx';
    const maxFileSizeMB = p.maxFileSizeMB || 25;
    const maxFiles      = p.maxFiles || 10;
    const primaryColor   = p.primaryColor || '#087095';
    const secondaryColor = p.secondaryColor || '#003D5C';
    const accentColor    = p.accentColor || '#FF8C00';
    const loaderBgColor   = p.loaderBgColor || secondaryColor;
    const loaderBgColor2  = p.loaderBgColor2 || primaryColor;
    const loaderTextColor = p.loaderTextColor || '#FFFFFF';
    const buttons = Array.isArray(p.buttons) ? p.buttons : [];
    
    const webhook          = p.webhook || {};
    const webhookUrl       = webhook.url;
    const webhookMethod    = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders   = webhook.headers || {};
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 60000;
    const webhookRetries   = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    const fileFieldName    = webhook.fileFieldName || 'files';
    const extra            = webhook.extra || {};
    
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
      { progress: 0,  text: '📋 Préparation' },
      { progress: 30, text: '🚀 Envoi' },
      { progress: 60, text: '🔄 Traitement' },
      { progress: 85, text: '✨ Finalisation' },
      { progress: 100,text: '✅ Terminé !' }
    ];
    
    const timedPhases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : [];
    const totalSeconds = Number(loaderCfg.totalSeconds) > 0 ? Number(loaderCfg.totalSeconds) : 120;
    
    const stepMap = loaderCfg.stepMap || {
      upload:      { text: '📤 Téléversement',            progress: 10 },
      sign_url:    { text: '🔐 Signature URL sécurisée',  progress: 18 },
      ocr_annot:   { text: '🧠 OCR (annotation)',         progress: 35 },
      ocr_classic: { text: '📑 OCR (fallback)',           progress: 42 },
      merge:       { text: '🧩 Fusion & agrégation',      progress: 55 },
      combine:     { text: '🗂️ Préparation des documents',progress: 62 },
      ai_agent:    { text: '🤖 Analyse RH avancée',       progress: 82 },
      gdoc_prep:   { text: '📝 Préparation Google Doc',   progress: 88 },
      gdrive_copy: { text: '☁️ Copie dans Google Drive',  progress: 93 },
      gdoc_update: { text: '📄 Mise à jour du document',  progress: 97 }
    };
    
    const doneText  = loaderCfg.finalText || 'Continuer';
    const doneIcon  = loaderCfg.finalButtonIcon || '✅';
    const loaderMsg = loaderCfg.message || '⏳ Traitement en cours...';
    
    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#fee2e2,#fecaca);border:1px solid #fca5a5;color:#991b1b;font-weight:500">
        ⚠️ Erreur de configuration : <b>webhook.url</b> manquant.
      </div>`;
      element.appendChild(div);
      
      // Réactiver le chat en cas d'erreur
      enableChatInput(chatRefs);
      
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: { webhookSuccess: false, error: 'WEBHOOK_URL_MISSING', path: pathError }
        });
      } catch {}
      return;
    }
    
    const hasTitle = title && title.trim() !== '';
    const hasSubtitle = subtitle && subtitle.trim() !== '';
    const showHeader = hasTitle || hasSubtitle;
    
    // ---------- STYLES ----------
    const styles = `
      @keyframes uploadPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.05);opacity:.8}}
      @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes fadeOut{from{opacity:1}to{opacity:0}}
      .upload-modern-wrap{width:100%;max-width:100%;animation:slideUp .4s ease-out;position:relative}
      .upload-modern-disabled-overlay{display:none;position:absolute;inset:0;background:rgba(255,255,255,.95);backdrop-filter:blur(4px);z-index:9999;border-radius:20px;cursor:not-allowed}
      .upload-modern-disabled-overlay.active{display:flex;align-items:center;justify-content:center}
      .upload-modern-disabled-overlay.active::after{content:'🔒 Traitement en cours...';font-size:18px;font-weight:700;color:#64748b}
      .upload-modern-card{background:linear-gradient(145deg,#fff 0%,#f8fafc 100%);border-radius:20px;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.06);position:relative;overflow:hidden}
      .upload-modern-header{text-align:center;margin-bottom:24px;position:relative;z-index:2}
      .upload-modern-title{font-size:22px;font-weight:800;background:linear-gradient(135deg, ${primaryColor}, ${secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0 0 8px 0;letter-spacing:-.5px}
      .upload-modern-subtitle{font-size:13px;color:#64748b;font-weight:500}
      .upload-modern-zone{border:3px dashed transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40) border-box;border-radius:16px;padding:40px 24px;text-align:center;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}
      .upload-modern-zone::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}08);opacity:0;transition:opacity .3s}
      .upload-modern-zone:hover{transform:translateY(-2px);box-shadow:0 12px 24px ${primaryColor}30;border-color:transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) border-box}
      .upload-modern-zone:hover::before{opacity:1}
      .upload-modern-zone.dragging{background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg, ${primaryColor}, ${accentColor}) border-box;transform:scale(1.02)}
      .upload-modern-icon{font-size:48px;margin-bottom:12px;display:inline-block;filter:drop-shadow(0 4px 8px ${primaryColor}40)}
      .upload-modern-zone:hover .upload-modern-icon{animation:uploadPulse 1.5s infinite}
      .upload-modern-desc{font-size:15px;color:#475569;font-weight:600;position:relative;z-index:1}
      .upload-modern-files-list{margin-top:20px;display:none;flex-direction:column;gap:12px;max-height:300px;overflow-y:auto;padding:4px}
      .upload-modern-files-list.active{display:flex}
      .upload-modern-file-item{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10);border-radius:12px;border-left:4px solid ${primaryColor};animation:fadeIn .3s ease-out;transition:all .2s}
      .upload-modern-file-item:hover{transform:translateX(4px);box-shadow:0 4px 12px ${primaryColor}20}
      .upload-modern-file-item-name{font-weight:700;color:#1e293b;font-size:14px;margin-bottom:4px;display:flex;align-items:center;gap:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .upload-modern-file-item-size{font-size:12px;color:#64748b;font-weight:500}
      .upload-modern-file-item-remove{flex-shrink:0;width:32px;height:32px;border-radius:8px;border:none;background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all .2s;font-weight:bold}
      .upload-modern-file-item-remove:hover{background:linear-gradient(135deg,#fecaca,#fca5a5);transform:scale(1.1)}
      .upload-modern-files-count{margin-top:12px;padding:10px;background:linear-gradient(135deg, ${accentColor}20, ${accentColor}30);border-radius:8px;text-align:center;font-size:13px;font-weight:700;color:${secondaryColor}}
      .upload-modern-actions{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
      .upload-modern-btn{flex:1;min-width:120px;padding:14px 24px;border-radius:12px;border:none;font-weight:700;font-size:14px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden;letter-spacing:.3px}
      .upload-modern-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(45deg,transparent,rgba(255,255,255,.3),transparent);transform:translateX(-100%);transition:transform .6s}
      .upload-modern-btn:hover::before{transform:translateX(100%)}
      .upload-modern-btn-primary{background:linear-gradient(135deg, ${primaryColor}, ${secondaryColor});color:#fff;box-shadow:0 4px 12px ${primaryColor}40}
      .upload-modern-btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px ${primaryColor}50}
      .upload-modern-btn-primary:disabled{opacity:.5;cursor:not-allowed}
      .upload-modern-btn-secondary{background:linear-gradient(145deg,#f1f5f9,#e2e8f0);color:#475569;box-shadow:0 2px 8px rgba(0,0,0,.1)}
      .upload-modern-btn-secondary:hover:not(:disabled){background:linear-gradient(145deg,#e2e8f0,#cbd5e1);transform:translateY(-1px)}
      .upload-modern-status{margin-top:16px;padding:12px;border-radius:10px;font-size:13px;font-weight:600;text-align:center;animation:slideUp .3s ease-out}
      .upload-modern-status.error{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b;border:1px solid #fca5a5}
      .upload-modern-status.success{background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;border:1px solid #6ee7b7}
      .upload-modern-status.processing{background:linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);color:${secondaryColor};border:1px solid ${primaryColor}60}
      .upload-modern-loader{display:none;background:linear-gradient(145deg,#0a5d7a,#003a52);border-radius:20px;padding:40px;margin-top:16px;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 3px #FF8C00;animation:slideUp .4s ease-out;transition:opacity .4s ease-out}
      .upload-modern-loader.active{display:block}
      .upload-modern-loader.closing{animation:fadeOut .4s ease-out}
      .upload-modern-loader-content{display:flex;flex-direction:column;align-items:center;gap:24px}
      .upload-modern-loader-title{color:#FFFFFF;font-weight:800;font-size:22px;letter-spacing:.5px;text-align:center;text-shadow:0 3px 6px rgba(0,0,0,.5)}
      .upload-modern-loader-percentage{color:#FFFFFF;font-weight:900;font-size:56px;text-align:center;text-shadow:0 4px 12px rgba(0,0,0,.6);letter-spacing:3px;line-height:1}
      .upload-modern-loader-step{color:#FFFFFF;font-size:18px;font-weight:600;text-align:center;min-height:28px;text-shadow:0 2px 4px rgba(0,0,0,.4);background:rgba(255,255,255,.15);padding:12px 20px;border-radius:10px;backdrop-filter:blur(10px)}
    `;
    
    // ---------- UI ----------
    const root = document.createElement('div');
    root.className = 'upload-modern-wrap';
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    let headerHTML = '';
    if (showHeader) {
      headerHTML = `<div class="upload-modern-header">`;
      if (hasTitle) headerHTML += `<div class="upload-modern-title">${title}</div>`;
      if (hasSubtitle) headerHTML += `<div class="upload-modern-subtitle">${subtitle}</div>`;
      headerHTML += `</div>`;
    }
    
    root.innerHTML += `
      <div class="upload-modern-disabled-overlay"></div>
      <div class="upload-modern-card">
        ${headerHTML}
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
          <button class="upload-modern-btn upload-modern-btn-primary send-button" disabled>Envoyer</button>
        </div>
        <div class="upload-modern-status" style="display:none"></div>
      </div>
      <div class="upload-modern-loader">
        <div class="upload-modern-loader-content">
          <div class="upload-modern-loader-title"></div>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="80" stroke="rgba(255,255,255,0.2)" stroke-width="10" fill="none"/>
            <circle class="loader-circle" cx="90" cy="90" r="80"
                    stroke="#FF8C00" stroke-width="10" fill="none"
                    stroke-linecap="round"
                    transform="rotate(-90 90 90)"
                    stroke-dasharray="502" stroke-dashoffset="502"
                    style="filter:drop-shadow(0 0 8px #FF8C00)"/>
          </svg>
          <div class="upload-modern-loader-percentage">0%</div>
          <div class="upload-modern-loader-step"></div>
        </div>
      </div>
    `;
    element.appendChild(root);
    
    // ---------- DOM refs ----------
    const uploadZone   = root.querySelector('.upload-modern-zone');
    const fileInput    = root.querySelector('input[type="file"]');
    const filesList    = root.querySelector('.upload-modern-files-list');
    const filesCount   = root.querySelector('.upload-modern-files-count');
    const sendBtn      = root.querySelector('.send-button');
    const backButtons  = root.querySelectorAll('.back-button');
    const statusDiv    = root.querySelector('.upload-modern-status');
    const loader       = root.querySelector('.upload-modern-loader');
    const loaderTitle  = root.querySelector('.upload-modern-loader-title');
    const loaderPct    = root.querySelector('.upload-modern-loader-percentage');
    const loaderStep   = root.querySelector('.upload-modern-loader-step');
    const loaderCircle = root.querySelector('.loader-circle');
    const disabledOverlay = root.querySelector('.upload-modern-disabled-overlay');
    
    // ---------- STATE ----------
    let selectedFiles = [];
    let timedTimer = null;
    
    // ---------- Helpers ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    function setStatus(message, type='processing') {
      statusDiv.textContent = message;
      statusDiv.className = `upload-modern-status ${type}`;
      statusDiv.style.display = 'block';
    }
    function updateFilesList() {
      filesList.innerHTML = '';
      if (!selectedFiles.length) {
        filesList.classList.remove('active');
        filesCount.style.display = 'none';
        sendBtn.disabled = true;
        return;
      }
      filesList.classList.add('active');
      filesCount.style.display = 'block';
      const totalSize = selectedFiles.reduce((s,f)=>s+f.size,0);
      filesCount.textContent = `${selectedFiles.length} fichier${selectedFiles.length>1?'s':''} sélectionné${selectedFiles.length>1?'s':''} (${formatSize(totalSize)})`;
      selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'upload-modern-file-item';
        item.innerHTML = `
          <div class="upload-modern-file-item-info">
            <div class="upload-modern-file-item-name">📄 <span>${file.name}</span></div>
            <div class="upload-modern-file-item-size">${formatSize(file.size)}</div>
          </div>
          <button class="upload-modern-file-item-remove" data-index="${i}">×</button>
        `;
        filesList.appendChild(item);
      });
      root.querySelectorAll('.upload-modern-file-item-remove').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const i = parseInt(btn.getAttribute('data-index'));
          selectedFiles.splice(i,1);
          updateFilesList();
        });
      });
      sendBtn.disabled = false;
      statusDiv.style.display = 'none';
    }
    function addFiles(newFiles) {
      const valid = [], errs=[];
      for (const file of newFiles) {
        if (selectedFiles.length + valid.length >= maxFiles) { errs.push(`Limite de ${maxFiles} fichiers atteinte`); break; }
        if (maxFileSizeMB && file.size > maxFileSizeMB*1024*1024) { errs.push(`${file.name} : trop volumineux (${formatSize(file.size)})`); continue; }
        if (selectedFiles.some(f=>f.name===file.name && f.size===file.size)) { errs.push(`${file.name} : déjà ajouté`); continue; }
        valid.push(file);
      }
      if (valid.length) { selectedFiles.push(...valid); updateFilesList(); }
      if (errs.length) setStatus(`⚠️ ${errs.join(' • ')}`,'error');
    }
    
    // ---------- Events ----------
    uploadZone.addEventListener('click', ()=> fileInput.click());
    uploadZone.addEventListener('dragover', e=>{ e.preventDefault(); uploadZone.classList.add('dragging'); });
    uploadZone.addEventListener('dragleave', ()=> uploadZone.classList.remove('dragging'));
    uploadZone.addEventListener('drop', e=>{
      e.preventDefault(); uploadZone.classList.remove('dragging');
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) addFiles(files);
    });
    fileInput.addEventListener('change', ()=>{
      const files = Array.from(fileInput.files || []);
      if (files.length) addFiles(files);
      fileInput.value = '';
    });
    backButtons.forEach(b => b.addEventListener('click', ()=>{
      const path = b.getAttribute('data-path') || pathError;
      
      // Réactiver le chat avant de quitter
      enableChatInput(chatRefs);
      
      try {
        window?.voiceflow?.chat?.interact?.({ type:'complete', payload:{ webhookSuccess:false, path }});
      } catch {}
    }));
    
    sendBtn.addEventListener('click', async ()=>{
      if (!selectedFiles.length) return;
      
      // ✅ PROTECTION 1 : Rendre toute l'extension incliquable
      console.log('🔒 PROTECTION : Extension désactivée');
      root.style.pointerEvents = 'none';
      disabledOverlay.classList.add('active');
      
      sendBtn.disabled = true;
      backButtons.forEach(b=>b.disabled=true);
      setStatus(`📤 Envoi de ${selectedFiles.length} fichier${selectedFiles.length>1?'s':''}...`,'processing');
      
      const startTime = Date.now();
      
      const loaderUI = showLoader(loaderMsg);
      if (loaderMode === 'auto') {
        loaderUI.startAuto(defaultAutoSteps);
      } else if (loaderMode === 'timed') {
        loaderUI.startTimed(buildTimedPlan());
      } else {
        loaderUI.showPhase('⏳ Démarrage...');
        loaderUI.setPercent(5);
      }
      
      try {
        const resp = await postToN8n({
          url: webhookUrl, method: webhookMethod, headers: webhookHeaders,
          timeoutMs: webhookTimeoutMs, retries: webhookRetries,
          files: selectedFiles, fileFieldName, extra, vfContext
        });
        
        let finalData = resp?.data ?? null;
        
        if (awaitResponse && pollingEnabled) {
          const jobId    = finalData?.jobId;
          const statusUrl= finalData?.statusUrl || p?.polling?.statusUrl;
          if (statusUrl || jobId) {
            finalData = await pollStatus({
              statusUrl: statusUrl || `${webhookUrl.split('/webhook')[0]}/rest/jobs/${jobId}`,
              headers: pollingHeaders,
              intervalMs: pollingIntervalMs,
              maxAttempts: pollingMaxAttempts,
              onTick: (st)=> {
                if (loaderMode === 'external') {
                  const pct  = Number.isFinite(st?.percent) ? clamp(st.percent, 0, 100) : undefined;
                  const key  = st?.phase;
                  const map  = key && stepMap[key] ? stepMap[key] : null;
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
          loaderUI.showPhase('✨ Finalisation...');
          loaderUI.animateTo(98, Math.min(remainingTime, 1500));
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        loaderUI.finish((data) => {
          // ✅ PROTECTION 2 : Réactiver le chat uniquement
          enableChatInput(chatRefs);
          // ❌ NE PAS appeler .interact() ici - c'est fait dans finish()
        }, finalData); // ✅ Passer finalData en 2ème argument
      } catch (err) {
        loader.classList.remove('active');
        setStatus(`❌ ${String(err?.message || err)}`,'error');
        sendBtn.disabled = false;
        backButtons.forEach(b=>b.disabled=false);
        root.style.pointerEvents = 'auto';
        disabledOverlay.classList.remove('active');
        
        // Réactiver le chat en cas d'erreur
        enableChatInput(chatRefs);
        
        try {
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: { 
              webhookSuccess: false, 
              error: String(err?.message || err)
              // ❌ PLUS DE "path" ici non plus
            }
          });
        } catch {}
      }
    });
    
    // ---------- Loader controller ----------
    function showLoader(message) {
      loaderTitle.textContent = message;
      loader.classList.add('active');
      
      // ✅ DÉSACTIVER L'OVERLAY pour voir le loader
      console.log('🔓 Désactivation de l\'overlay pour afficher le loader');
      disabledOverlay.classList.remove('active');
      
      let current = 0;
      let lockedByFinish = false;
      function paint() {
        const offset = 502 - (current/100)*502;
        loaderCircle.style.strokeDashoffset = offset;
        loaderPct.textContent = `${Math.round(current)}%`;
      }
      paint();
      function clearTimers() {
        if (timedTimer) { clearInterval(timedTimer); timedTimer = null; }
      }
      return {
        startAuto(steps) {
          let i = 0;
          const walk = ()=>{
            if (i >= steps.length || lockedByFinish) return;
            const s = steps[i];
            if (s.text) this.showPhase(s.text);
            this.animateTo(s.progress, 1800, ()=> {
              i++; walk();
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
            const endTime   = startTime + ph.durationMs;
            clearTimers();
            timedTimer = setInterval(()=> {
              const now = Date.now();
              const ratio = clamp((now - startTime) / ph.durationMs, 0, 1);
              current = ph.progressStart + (ph.progressEnd - ph.progressStart) * ratio;
              paint();
              if (now >= endTime) {
                clearTimers();
                current = ph.progressEnd; paint();
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
          if (lockedByFinish) return;
          current = clamp(p, 0, 100);
          paint();
        },
        softPercent(p) {
          if (lockedByFinish) return;
          const target = clamp(p, 0, 100);
          current = current + (target - current) * 0.5;
          paint();
        },
        animateTo(target, ms=1200, cb) {
          const start = current;
          const end   = clamp(target, 0, 100);
          const t0 = performance.now();
          const step = (t)=>{
            const k = clamp((t - t0)/ms, 0, 1);
            current = start + (end - start) * k;
            paint();
            if (k < 1) requestAnimationFrame(step);
            else if (cb) cb();
          };
          requestAnimationFrame(step);
        },
        finish(onClick, data) {
          lockedByFinish = true;
          clearTimers();
          this.animateTo(100, 500, ()=>{
            this.showPhase('✅ Terminé !');
            console.log(`🎉 Upload terminé ! Fermeture auto dans ${autoCloseDelayMs}ms...`);
            
            setTimeout(() => {
              console.log('🔄 Fermeture du loader...');
              loader.classList.add('closing');
              
              setTimeout(() => {
                loader.classList.remove('active', 'closing');
                console.log('✅ Loader fermé');
                
                setTimeout(() => {
                  console.log('🚀 Déclenchement du flow Voiceflow...');
                  
                  // ✅ CORRECTION : Ne PAS inclure "path" dans le payload
                  // Le routing se fait dans le bloc JavaScript qui suit
                  try {
                    window?.voiceflow?.chat?.interact?.({
                      type: 'complete',
                      payload: {
                        webhookSuccess: true,
                        webhookResponse: data,
                        files: selectedFiles.map(f=>({name:f.name,size:f.size,type:f.type})),
                        buttonPath: 'success' // ✅ CRITIQUE pour que le bloc JS s'exécute !
                      }
                    });
                    console.log('✅ .interact() appelé avec succès (avec buttonPath)');
                  } catch(e) {
                    console.error('❌ Erreur .interact():', e);
                  }
                  
                  // Réactiver le chat
                  if (onClick) onClick(data);
                  
                  // ✅ PROTECTION 3 : Destruction TOTALE après succès
                  setTimeout(() => {
                    console.log('🗑️ DESTRUCTION complète de l\'extension...');
                    root.remove();
                    console.log('✅ Extension supprimée du DOM, plus aucune interaction possible');
                  }, 1000);
                }, 600);
              }, 400);
            }, autoCloseDelayMs);
          });
        }
      };
    }
    
    function buildTimedPlan() {
      const haveSeconds = timedPhases.every(ph => Number(ph.seconds) > 0);
      let total = haveSeconds ? timedPhases.reduce((s,ph)=>s+Number(ph.seconds),0) : totalSeconds;
      const weightsSum = timedPhases.reduce((s,ph)=> s + (Number(ph.weight)||0), 0) || timedPhases.length;
      const alloc = timedPhases.map((ph,i)=>{
        const sec = haveSeconds ? Number(ph.seconds) : (Number(ph.weight)||1) / weightsSum * total;
        return { key: ph.key, text: ph.label || stepMap[ph.key]?.text || `Étape ${i+1}`, seconds: sec };
      });
      const startP = 5, endP = 98;
      const totalMs = alloc.reduce((s,a)=> s + a.seconds*1000, 0);
      let acc = 0, last = startP;
      const plan = alloc.map((a,i)=>{
        const pStart = i === 0 ? startP : last;
        const pEnd   = i === alloc.length-1 ? endP : startP + (endP-startP) * ((acc + a.seconds*1000)/totalMs);
        acc += a.seconds*1000; last = pEnd;
        return { text: a.text, durationMs: Math.max(500, a.seconds*1000), progressStart: pStart, progressEnd: pEnd };
      });
      if (!plan.length) {
        return defaultAutoSteps.map((s, i, arr) => ({
          text: s.text, durationMs: i===0 ? 1000 : 1500,
          progressStart: i ? arr[i-1].progress : 0, progressEnd: s.progress
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
          const to = setTimeout(()=>controller.abort(), timeoutMs);
          const fd = new FormData();
          files.forEach(f=> fd.append(fileFieldName, f, f.name));
          Object.entries(extra).forEach(([k,v])=>{
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
            throw new Error(`Erreur ${resp.status} : ${text?.slice(0,200) || resp.statusText}`);
          }
          return { ok:true, data: await safeJson(resp) };
        } catch (e) {
          lastErr = e;
          if (attempt < retries) await new Promise(r=>setTimeout(r, 900));
        }
      }
      throw lastErr || new Error('Échec de l\'envoi');
    }
    async function pollStatus({ statusUrl, headers, intervalMs, maxAttempts, onTick }) {
      for (let i=1;i<=maxAttempts;i++) {
        const r = await fetch(statusUrl, { headers });
        if (!r.ok) throw new Error(`Polling ${r.status}`);
        const j = await safeJson(r);
        if (j?.status === 'error') throw new Error(j?.error || 'Erreur pipeline');
        if (typeof onTick === 'function') {
          try { onTick({ percent: j?.percent, phase: j?.phase, message: j?.message }); } catch {}
        }
        if (j?.status === 'done') return j?.data ?? j;
        await new Promise(res=>setTimeout(res, intervalMs));
      }
      throw new Error('Polling timeout');
    }
    async function safeJson(r){ try { return await r.json(); } catch { return null; } }
    async function safeText(r){ try { return await r.text(); } catch { return null; } }
  }
};
try { window.UploadToN8nWithLoader = UploadToN8nWithLoader; } catch {}
