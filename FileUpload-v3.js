/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  FileUpload V2.1 – Premium Voiceflow Extension           ║
 *  ║                                                           ║
 *  ║  UPLOAD MODES:                                           ║
 *  ║  • "kb"       → Upload direct vers KB Voiceflow          ║
 *  ║  • "endpoint"  → Upload vers URL custom (FormData)       ║
 *  ║  • "none"      → Pas d'upload, passe les infos fichiers  ║
 *  ║                                                           ║
 *  ║  FEATURES:                                               ║
 *  ║  • Design premium dark/light                             ║
 *  ║  • Drag & drop + click upload                            ║
 *  ║  • Multi-file accumulation                               ║
 *  ║  • Validation fichiers requis + limites                  ║
 *  ║  • Animations fluides                                    ║
 *  ║  • Chat disable/enable intégré                           ║
 *  ║  • Boutons configurables avec paths                      ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const FileUpload = {
  name: 'FileUpload',
  type: 'response',

  match: ({ trace }) => {
    return trace.type === 'file_upload'
      || trace.type === 'ext_file_upload'
      || trace.payload?.name === 'file_upload'
      || trace.payload?.name === 'ext_file_upload';
  },

  render: ({ trace, element }) => {
    try {
      const {
        // ── Textes ──
        title = "Uploadez vos documents",
        subtitle = "",
        description = "Glissez-déposez vos fichiers ou cliquez pour sélectionner",
        uploadText = "Parcourir les fichiers",
        successMessage = "Fichier(s) uploadé(s) avec succès",
        errorMessage = "Erreur lors de l'upload",
        noFilesErrorMessage = "Veuillez uploader au moins 1 document",
        limitExceededMessage = "Limite de {maxFiles} fichiers dépassée",

        // ── Fichiers ──
        maxFiles = 20,
        maxFileSizeMB = 25,
        allowedTypes = ['pdf', 'docx', 'doc', 'txt'],
        minFiles = 1,

        // ── Apparence ──
        primaryColor = '#FFB800',
        theme = 'dark',

        // ── Upload mode: "kb" | "endpoint" | "none" ──
        uploadMode = 'none',

        // ── Mode "endpoint" ──
        uploadEndpoint = '',
        fileFieldName = 'files',

        // ── Mode "kb" (Voiceflow Knowledge Base) ──
        kb = {},

        // ── Chat ──
        chat = false,
        chatDisabledText = '🚫 Veuillez uploader vos documents',

        // ── Boutons ──
        buttons = [
          { text: "Valider les documents", action: "exit", path: "process_documents", style: "primary" },
          { text: "Passer cette étape", action: "exit", path: "skip_upload", style: "secondary" },
          { text: "Retour", action: "exit", path: "previous_step", style: "ghost" }
        ],

        instanceId = null
      } = trace.payload || {};

      // ── KB defaults ──
      const kbApiKey = kb.apiKey || '';
      const kbMaxChunkSize = kb.maxChunkSize || 1000;
      const kbOverwrite = kb.overwrite || false;
      const kbFilters = kb.filters || {};

      const uid = instanceId || `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const isDark = theme === 'dark';
      const requiredFiles = Math.max(1, Math.min(Number(minFiles) || 1, maxFiles));

      // ── Couleurs ──
      const hexToRgb = hex => {
        const n = parseInt(hex.replace('#', ''), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      };
      const pc = hexToRgb(primaryColor);

      // ── Theme tokens ──
      const T = isDark ? {
        bg: '#0D0D0D',
        cardBg: '#111111',
        cardBorder: '#1F1F1F',
        cardHoverBorder: '#2A2A2A',
        text: '#FFFFFF',
        textMuted: '#B0B0B0',
        textDim: '#888888',
        zoneBg: '#161616',
        zoneBorder: '#333333',
        zoneHoverBg: '#1C1C1C',
        zoneDragBg: `rgba(${pc.r},${pc.g},${pc.b},0.12)`,
        zoneDragBorder: primaryColor,
        fileBg: '#1A1A1A',
        fileHoverBg: '#222222',
        successBg: 'rgba(16,185,129,0.15)',
        successText: '#34D399',
        errorBg: 'rgba(239,68,68,0.15)',
        errorText: '#F87171',
        warnBg: 'rgba(245,158,11,0.15)',
        warnText: '#FBBF24',
        shadow: '0 24px 80px rgba(0,0,0,0.8)',
        btnSecondaryBg: '#1A1A1A',
        btnSecondaryHoverBg: '#252525',
        btnGhostHoverBg: '#181818',
        counterBg: '#1A1A1A',
      } : {
        bg: '#FFFFFF',
        cardBg: '#FAFAFA',
        cardBorder: 'rgba(0,0,0,0.08)',
        cardHoverBorder: 'rgba(0,0,0,0.15)',
        text: '#111827',
        textMuted: '#6B7280',
        textDim: '#9CA3AF',
        zoneBg: '#F9FAFB',
        zoneBorder: '#E5E7EB',
        zoneHoverBg: '#F3F4F6',
        zoneDragBg: `rgba(${pc.r},${pc.g},${pc.b},0.06)`,
        zoneDragBorder: primaryColor,
        fileBg: '#F3F4F6',
        fileHoverBg: '#E5E7EB',
        successBg: 'rgba(16,185,129,0.08)',
        successText: '#059669',
        errorBg: 'rgba(239,68,68,0.08)',
        errorText: '#DC2626',
        warnBg: 'rgba(245,158,11,0.08)',
        warnText: '#D97706',
        shadow: '0 24px 80px rgba(0,0,0,0.08)',
        btnSecondaryBg: '#F3F4F6',
        btnSecondaryHoverBg: '#E5E7EB',
        btnGhostHoverBg: 'rgba(0,0,0,0.04)',
        counterBg: '#F3F4F6',
      };

      // ── State ──
      let uploadResults = []; // { name, size, type, url?, documentId? }
      let selectedFiles = [];
      let isUploading = false;

      // ── Chat control ──
      const rootNode = element.getRootNode();
      const host = rootNode instanceof ShadowRoot ? rootNode : document;

      const setChat = (enabled) => {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = enabled ? '' : '.45';
        ic.style.pointerEvents = enabled ? '' : 'none';
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = !enabled; ta.placeholder = enabled ? '' : chatDisabledText; }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) snd.disabled = !enabled;
      };
      if (!chat) setChat(false);

      // ── Container ──
      const container = document.createElement('div');
      container.id = uid;
      container.className = 'fu';

      const style = document.createElement('style');
      style.textContent = `
/* ── Force la bulle VF parent à 100% ── */
.vfrc-message--extension-FileUpload,
.vfrc-message--extension-FileUpload .vfrc-bubble,
.vfrc-message--extension-FileUpload .vfrc-bubble-content,
.vfrc-message--extension-FileUpload .vfrc-message-content,
.vfrc-message.vfrc-message--extension-FileUpload {
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

#${uid}, #${uid} * { box-sizing: border-box; }

@keyframes fu-fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fu-slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fu-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
@keyframes fu-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
@keyframes fu-progressShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fu-dotPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
@keyframes fu-successPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

#${uid} {
  font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
  width: 100%;
  animation: fu-fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  color: ${T.text};
}

/* ── Card ── */
#${uid} .fu-card {
  background: ${T.cardBg};
  border: 1px solid ${T.cardBorder};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: ${T.shadow};
  transition: border-color 0.3s ease;
}
#${uid} .fu-card:hover { border-color: ${T.cardHoverBorder}; }

/* ── Header ── */
#${uid} .fu-header { padding: 28px 28px 8px; }
#${uid} .fu-title {
  font-size: 22px;
  font-weight: 700;
  color: ${primaryColor};
  letter-spacing: -0.3px;
  line-height: 1.3;
  margin: 0 0 6px 0;
}
#${uid} .fu-subtitle {
  font-size: 14px;
  color: ${T.textMuted};
  margin: 0 0 4px 0;
  line-height: 1.6;
}

/* ── Body ── */
#${uid} .fu-body { padding: 20px 28px 28px; }

/* ── Drop Zone ── */
#${uid} .fu-zone {
  position: relative;
  background: ${T.zoneBg};
  border: 2px dashed ${T.zoneBorder};
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}
#${uid} .fu-zone:hover {
  background: ${T.zoneHoverBg};
  border-color: ${primaryColor};
}
#${uid} .fu-zone.drag {
  background: ${T.zoneDragBg};
  border-color: ${T.zoneDragBorder};
  border-style: solid;
}
#${uid} .fu-zone-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 20px;
  color: ${primaryColor};
  opacity: 0.8;
  transition: all 0.25s ease;
}
#${uid} .fu-zone:hover .fu-zone-icon {
  opacity: 1;
  transform: translateY(-2px);
}
#${uid} .fu-zone-text {
  font-size: 16px;
  font-weight: 600;
  color: ${T.text};
  margin: 0 0 10px 0;
}
#${uid} .fu-zone-desc {
  font-size: 14px;
  color: ${T.textMuted};
  line-height: 1.6;
  margin: 0 0 4px 0;
}
#${uid} .fu-zone-meta {
  margin: 16px 0 0 0;
  font-size: 13px;
  color: ${T.textDim};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
#${uid} .fu-zone-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
#${uid} .fu-zone input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

/* ── Files View ── */
#${uid} .fu-files-view { display: none; }
#${uid} .fu-files-view.show { display: block; animation: fu-fadeIn 0.3s ease; }

/* ── Counter ── */
#${uid} .fu-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${T.counterBg};
  border-radius: 10px;
  margin: 0 0 12px 0;
}
#${uid} .fu-counter-text {
  font-size: 13px;
  font-weight: 600;
  color: ${T.text};
}
#${uid} .fu-counter-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(${pc.r},${pc.g},${pc.b},0.15);
  color: ${primaryColor};
}
#${uid} .fu-counter-badge.ok {
  background: ${T.successBg};
  color: ${T.successText};
}

/* ── Add more zone ── */
#${uid} .fu-add-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: ${T.zoneBg};
  border: 1.5px dashed ${T.zoneBorder};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  margin: 0 0 12px 0;
  font-size: 13px;
  color: ${T.textMuted};
  font-weight: 500;
}
#${uid} .fu-add-zone:hover {
  background: ${T.zoneHoverBg};
  border-color: ${primaryColor};
  color: ${primaryColor};
}
#${uid} .fu-add-zone input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
#${uid} .fu-add-icon { width: 18px; height: 18px; }

/* ── File List ── */
#${uid} .fu-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding: 0 4px 0 0;
}
#${uid} .fu-list::-webkit-scrollbar { width: 4px; }
#${uid} .fu-list::-webkit-scrollbar-track { background: transparent; }
#${uid} .fu-list::-webkit-scrollbar-thumb { background: ${T.textDim}; border-radius: 4px; }

#${uid} .fu-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: ${T.fileBg};
  border-radius: 10px;
  transition: background 0.15s ease;
  animation: fu-slideIn 0.25s ease;
  min-width: 0;
}
#${uid} .fu-file:hover { background: ${T.fileHoverBg}; }
#${uid} .fu-file-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 8px;
  background: rgba(${pc.r},${pc.g},${pc.b},0.12);
  color: ${primaryColor};
  display: flex;
  align-items: center;
  justify-content: center;
}
#${uid} .fu-file-icon svg { width: 16px; height: 16px; }
#${uid} .fu-file-info { flex: 1; min-width: 0; overflow: hidden; }
#${uid} .fu-file-name {
  font-size: 13px;
  font-weight: 500;
  color: ${T.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#${uid} .fu-file-size {
  font-size: 11px;
  color: ${T.textDim};
  margin: 1px 0 0 0;
}
#${uid} .fu-file-status {
  font-size: 11px;
  margin: 2px 0 0 0;
}
#${uid} .fu-file-status.uploading { color: ${primaryColor}; animation: fu-pulse 1.5s infinite; }
#${uid} .fu-file-status.success { color: ${T.successText}; }
#${uid} .fu-file-status.error { color: ${T.errorText}; }
#${uid} .fu-file-del {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border: none;
  background: transparent;
  color: ${T.textDim};
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
  margin: 0;
}
#${uid} .fu-file-del:hover { background: ${T.errorBg}; color: ${T.errorText}; }
#${uid} .fu-file-del:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Messages ── */
#${uid} .fu-msg {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin: 12px 0 0 0;
  display: none;
  text-align: center;
}
#${uid} .fu-msg.show { display: block; animation: fu-fadeIn 0.25s ease; }
#${uid} .fu-msg.success { background: ${T.successBg}; color: ${T.successText}; }
#${uid} .fu-msg.error { background: ${T.errorBg}; color: ${T.errorText}; animation: fu-shake 0.4s ease; }
#${uid} .fu-msg.warn { background: ${T.warnBg}; color: ${T.warnText}; }

/* ── Upload Progress ── */
#${uid} .fu-progress { display: none; margin: 16px 0 0 0; }
#${uid} .fu-progress.show { display: block; animation: fu-fadeIn 0.3s ease; }
#${uid} .fu-progress-bar-bg {
  height: 6px;
  background: ${T.counterBg};
  border-radius: 6px;
  overflow: hidden;
}
#${uid} .fu-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, ${primaryColor}, ${isDark ? '#FCD34D' : '#F59E0B'});
  border-radius: 6px;
  transition: width 0.4s ease;
  background-size: 200% 100%;
  animation: fu-progressShimmer 2s infinite linear;
}
#${uid} .fu-progress-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 10px 0 0 0;
  font-size: 13px;
  color: ${T.textMuted};
  font-weight: 500;
}
#${uid} .fu-progress-dots { display: flex; gap: 3px; }
#${uid} .fu-progress-dots span {
  width: 5px;
  height: 5px;
  background: ${primaryColor};
  border-radius: 50%;
  animation: fu-dotPulse 1.2s infinite;
}
#${uid} .fu-progress-dots span:nth-child(2) { animation-delay: 0.15s; }
#${uid} .fu-progress-dots span:nth-child(3) { animation-delay: 0.3s; }

/* ── Buttons ── */
#${uid} .fu-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0 0 0;
  padding: 20px 0 0 0;
  border-top: 1px solid ${T.cardBorder};
}
#${uid} .fu-btn {
  flex: 1 1 auto;
  min-width: 140px;
  padding: 13px 20px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin: 0;
}
#${uid} .fu-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}
#${uid} .fu-btn:hover::after { transform: translateX(100%); }
#${uid} .fu-btn-primary {
  background: ${primaryColor};
  color: ${isDark ? '#0D0D0D' : '#FFFFFF'};
  box-shadow: 0 4px 16px rgba(${pc.r},${pc.g},${pc.b},0.3);
}
#${uid} .fu-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(${pc.r},${pc.g},${pc.b},0.45);
}
#${uid} .fu-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
#${uid} .fu-btn-secondary {
  background: ${T.btnSecondaryBg};
  color: ${T.text};
  border: 1px solid ${T.cardBorder};
}
#${uid} .fu-btn-secondary:hover {
  background: ${T.btnSecondaryHoverBg};
  transform: translateY(-1px);
}
#${uid} .fu-btn-ghost {
  background: transparent;
  color: ${T.textMuted};
}
#${uid} .fu-btn-ghost:hover {
  background: ${T.btnGhostHoverBg};
  color: ${T.text};
}

@media (max-width: 480px) {
  #${uid} .fu-header { padding: 20px 20px 0; }
  #${uid} .fu-body { padding: 16px 20px 20px; }
  #${uid} .fu-buttons { flex-direction: column; }
  #${uid} .fu-btn { min-width: auto; }
  #${uid} .fu-zone { padding: 28px 16px; }
}

#${uid}.fu-done { opacity: 0.6; pointer-events: none; filter: grayscale(20%); }
      `;
      container.appendChild(style);

      // ── Icons ──
      const ICONS = {
        upload: `<svg class="fu-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
        file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        plus: `<svg class="fu-add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      };

      // ── Helpers ──
      const formatSize = bytes => bytes < 1024 ? bytes + ' o' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' Ko' : (bytes / 1048576).toFixed(1) + ' Mo';
      const getExt = name => (name.split('.').pop() || '').toUpperCase();
      const typesDisplay = allowedTypes.map(t => t.toUpperCase()).join(', ');

      // ── HTML ──
      const hasTitle = title?.trim();
      const hasSubtitle = subtitle?.trim();
      const showHeader = hasTitle || hasSubtitle;

      // Mode label for display
      const modeLabel = uploadMode === 'kb' ? '📚 Knowledge Base' : uploadMode === 'endpoint' ? '☁️ Serveur' : '';

      const card = document.createElement('div');
      card.className = 'fu-card';
      card.innerHTML = `
        ${showHeader ? `
        <div class="fu-header">
          ${hasTitle ? `<div class="fu-title">${title}</div>` : ''}
          ${hasSubtitle ? `<div class="fu-subtitle">${subtitle}</div>` : ''}
        </div>` : ''}
        <div class="fu-body">
          <!-- Initial drop zone -->
          <div class="fu-zone" id="fu-zone-${uid}">
            ${ICONS.upload}
            <div class="fu-zone-text">${description}</div>
            <div class="fu-zone-desc">${uploadText}</div>
            <div class="fu-zone-meta">
              <span>📄 ${typesDisplay}</span>
              <span>📦 Max ${maxFileSizeMB} Mo</span>
              <span>🗂️ Max ${maxFiles} fichier${maxFiles > 1 ? 's' : ''}</span>
              ${modeLabel ? `<span>${modeLabel}</span>` : ''}
            </div>
            <input type="file" accept="${allowedTypes.map(t => '.' + t).join(',')}" ${maxFiles > 1 ? 'multiple' : ''} />
          </div>

          <!-- Files view -->
          <div class="fu-files-view" id="fu-fv-${uid}">
            <div class="fu-counter">
              <span class="fu-counter-text" id="fu-count-${uid}">0 fichier</span>
              <span class="fu-counter-badge" id="fu-badge-${uid}">0 / ${maxFiles}</span>
            </div>
            ${maxFiles > 1 ? `
            <div class="fu-add-zone" id="fu-addzone-${uid}">
              ${ICONS.plus}
              <span>Ajouter des fichiers</span>
              <input type="file" accept="${allowedTypes.map(t => '.' + t).join(',')}" multiple />
            </div>` : ''}
            <div class="fu-list" id="fu-list-${uid}"></div>
          </div>

          <div class="fu-msg" id="fu-msg-${uid}"></div>

          <div class="fu-progress" id="fu-progress-${uid}">
            <div class="fu-progress-bar-bg"><div class="fu-progress-bar" id="fu-bar-${uid}"></div></div>
            <div class="fu-progress-text">
              <div class="fu-progress-dots"><span></span><span></span><span></span></div>
              <span id="fu-plabel-${uid}">Envoi en cours…</span>
            </div>
          </div>

          <div class="fu-buttons" id="fu-btns-${uid}">
            ${buttons.map((btn, i) => `
              <button class="fu-btn fu-btn-${btn.style || 'secondary'}"
                      data-action="${btn.action || 'exit'}"
                      data-path="${btn.path || 'Default'}"
                      data-index="${i}"
                      ${btn.style === 'primary' ? 'disabled' : ''}>
                ${btn.text}
              </button>
            `).join('')}
          </div>
        </div>
      `;
      container.appendChild(card);
      element.appendChild(container);

      // ── Refs ──
      const zoneEl = container.querySelector(`#fu-zone-${uid}`);
      const filesView = container.querySelector(`#fu-fv-${uid}`);
      const addZone = container.querySelector(`#fu-addzone-${uid}`);
      const listEl = container.querySelector(`#fu-list-${uid}`);
      const countEl = container.querySelector(`#fu-count-${uid}`);
      const badgeEl = container.querySelector(`#fu-badge-${uid}`);
      const msgEl = container.querySelector(`#fu-msg-${uid}`);
      const progressEl = container.querySelector(`#fu-progress-${uid}`);
      const barEl = container.querySelector(`#fu-bar-${uid}`);
      const progressLabel = container.querySelector(`#fu-plabel-${uid}`);
      const inputMain = zoneEl.querySelector('input[type="file"]');
      const inputAdd = addZone?.querySelector('input[type="file"]');

      // ── Message helpers ──
      const showMsg = (text, type = 'warn') => {
        msgEl.textContent = text;
        msgEl.className = `fu-msg show ${type}`;
        setTimeout(() => { msgEl.className = 'fu-msg'; }, 5000);
      };

      // ── Set upload state on all file items ──
      const setFileStatus = (index, status, text) => {
        const statusEl = listEl.querySelector(`[data-status-i="${index}"]`);
        if (statusEl) {
          statusEl.className = `fu-file-status ${status}`;
          statusEl.textContent = text;
        }
      };

      // ── Render file list ──
      const renderFiles = () => {
        if (!selectedFiles.length) {
          zoneEl.style.display = '';
          filesView.classList.remove('show');
          return;
        }
        zoneEl.style.display = 'none';
        filesView.classList.add('show');

        const enough = selectedFiles.length >= requiredFiles;
        countEl.textContent = `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''}`;
        badgeEl.textContent = `${selectedFiles.length} / ${maxFiles}`;
        badgeEl.className = `fu-counter-badge${enough ? ' ok' : ''}`;

        if (addZone) addZone.style.display = selectedFiles.length >= maxFiles ? 'none' : '';

        container.querySelectorAll('.fu-btn-primary').forEach(btn => {
          btn.disabled = !enough || isUploading;
        });

        listEl.innerHTML = '';
        selectedFiles.forEach((f, i) => {
          const item = document.createElement('div');
          item.className = 'fu-file';
          item.innerHTML = `
            <div class="fu-file-icon">${ICONS.file}</div>
            <div class="fu-file-info">
              <div class="fu-file-name" title="${f.name}">${f.name}</div>
              <div class="fu-file-size">${getExt(f.name)} · ${formatSize(f.size)}</div>
              <div class="fu-file-status" data-status-i="${i}"></div>
            </div>
            <button class="fu-file-del" data-i="${i}" ${isUploading ? 'disabled' : ''}>${ICONS.x}</button>
          `;
          listEl.appendChild(item);
        });

        listEl.querySelectorAll('.fu-file-del').forEach(btn => {
          btn.onclick = () => {
            if (isUploading) return;
            selectedFiles.splice(parseInt(btn.dataset.i), 1);
            renderFiles();
          };
        });

        if (selectedFiles.length > 0 && selectedFiles.length < requiredFiles) {
          showMsg(`${requiredFiles - selectedFiles.length} fichier(s) requis manquant(s)`, 'warn');
        }
      };

      // ── Add files ──
      const addFiles = (files) => {
        const errs = [];
        Array.from(files).forEach(f => {
          if (selectedFiles.length >= maxFiles) { errs.push(limitExceededMessage.replace('{maxFiles}', maxFiles)); return; }
          if (f.size === 0) { errs.push(`${f.name} est vide (0 octets)`); return; }
          if (maxFileSizeMB && f.size > maxFileSizeMB * 1024 * 1024) { errs.push(`${f.name} dépasse ${maxFileSizeMB} Mo`); return; }
          if (selectedFiles.some(x => x.name === f.name && x.size === f.size)) return;
          selectedFiles.push(f);
        });
        if (errs.length) showMsg(errs[0], 'error');
        renderFiles();
      };

      // ── Zone bindings ──
      const bindZone = (zone, input) => {
        if (!zone || !input) return;
        input.addEventListener('click', e => e.stopPropagation());
        zone.addEventListener('click', e => { if (!e.target.closest('.fu-file-del')) input.click(); });
        zone.ondragover = e => { e.preventDefault(); zone.classList.add('drag'); };
        zone.ondragleave = () => zone.classList.remove('drag');
        zone.ondrop = e => { e.preventDefault(); zone.classList.remove('drag'); addFiles(e.dataTransfer?.files || []); };
        input.onchange = () => { addFiles(input.files || []); input.value = ''; };
      };
      bindZone(zoneEl, inputMain);
      if (addZone && inputAdd) bindZone(addZone, inputAdd);

      // ══════════════════════════════════════════════════
      // ── UPLOAD FUNCTIONS PER MODE ──
      // ══════════════════════════════════════════════════

      // ── Mode "kb": Upload to Voiceflow Knowledge Base ──
      const uploadToKB = async () => {
        isUploading = true;
        renderFiles(); // disable delete buttons
        progressEl.classList.add('show');
        uploadResults = [];
        let successCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const pct = Math.round(((i) / selectedFiles.length) * 90) + 5;
          barEl.style.width = `${pct}%`;
          progressLabel.textContent = `Upload ${i + 1}/${selectedFiles.length} — ${file.name}`;
          setFileStatus(i, 'uploading', 'Envoi…');

          try {
            const formData = new FormData();
            formData.append('file', file);
            if (Object.keys(kbFilters).length > 0) {
              formData.append('metadata', JSON.stringify(kbFilters));
            }

            const resp = await fetch(
              `https://api.voiceflow.com/v1/knowledge-base/docs/upload?overwrite=${kbOverwrite}&maxChunkSize=${kbMaxChunkSize}`,
              {
                method: 'POST',
                headers: { 'Authorization': kbApiKey, 'Accept': 'application/json' },
                body: formData
              }
            );

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const docId = data.data?.documentID || '';

            uploadResults.push({ name: file.name, size: file.size, type: file.type, documentId: docId, success: true });
            setFileStatus(i, 'success', `✓ Ajouté à la KB`);
            successCount++;
          } catch (err) {
            console.error(`[FileUpload] KB upload failed for ${file.name}:`, err);
            uploadResults.push({ name: file.name, size: file.size, type: file.type, error: err.message, success: false });
            setFileStatus(i, 'error', `✗ ${err.message}`);
          }
        }

        barEl.style.width = '100%';
        progressLabel.textContent = `✓ ${successCount}/${selectedFiles.length} fichier(s) uploadé(s)`;
        await new Promise(r => setTimeout(r, 800));
        progressEl.classList.remove('show');
        isUploading = false;

        return successCount > 0;
      };

      // ── Mode "endpoint": Upload to custom URL ──
      const uploadToEndpoint = async () => {
        isUploading = true;
        renderFiles();
        progressEl.classList.add('show');
        barEl.style.width = '20%';
        progressLabel.textContent = 'Envoi en cours…';

        try {
          const fd = new FormData();
          selectedFiles.forEach(f => fd.append(fileFieldName, f));

          barEl.style.width = '60%';
          const r = await fetch(uploadEndpoint, { method: 'POST', body: fd });
          const j = await r.json();
          barEl.style.width = '90%';

          if (!r.ok) throw new Error(j.detail || `HTTP ${r.status}`);

          const urls = Array.isArray(j.urls) ? j.urls : [];
          uploadResults = selectedFiles.map((f, i) => ({
            name: f.name, size: f.size, type: f.type,
            url: urls[i] || null, success: true
          }));

          selectedFiles.forEach((_, i) => setFileStatus(i, 'success', '✓ Uploadé'));

          barEl.style.width = '100%';
          progressLabel.textContent = '✓ Upload terminé';
          await new Promise(r => setTimeout(r, 600));
          progressEl.classList.remove('show');
          isUploading = false;
          return true;
        } catch (e) {
          progressEl.classList.remove('show');
          isUploading = false;
          showMsg(`${errorMessage}: ${e.message}`, 'error');
          return false;
        }
      };

      // ── Mode "none": Just pass file info ──
      const noUpload = async () => {
        uploadResults = selectedFiles.map(f => ({
          name: f.name, size: f.size, type: f.type, success: true
        }));
        return true;
      };

      // ── Main upload dispatcher ──
      const doUpload = async () => {
        switch (uploadMode) {
          case 'kb': return await uploadToKB();
          case 'endpoint': return await uploadToEndpoint();
          case 'none': default: return await noUpload();
        }
      };

      // ══════════════════════════════════════════════════
      // ── BUTTON HANDLERS ──
      // ══════════════════════════════════════════════════
      container.querySelectorAll('.fu-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (isUploading) return;
          const action = btn.dataset.action;
          const path = btn.dataset.path;

          if (action === 'exit') {
            // Validate for process path
            if (path === 'process_documents' && selectedFiles.length < requiredFiles) {
              showMsg(noFilesErrorMessage, 'error');
              return;
            }

            // Upload if files present and mode is not "none"
            let success = true;
            if (selectedFiles.length > 0 && uploadMode !== 'none') {
              success = await doUpload();
              if (!success) return;
            } else if (selectedFiles.length > 0) {
              await noUpload();
            }

            // Complete
            container.classList.add('fu-done');
            if (!chat) setChat(true);

            const payload = {
              success: true,
              uploadMode: uploadMode,
              files: uploadResults.length ? uploadResults : selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
              urls: uploadResults.filter(r => r.url).map(r => r.url),
              documentIds: uploadResults.filter(r => r.documentId).map(r => r.documentId),
              buttonPath: path,
              buttonText: btn.textContent.trim(),
              totalFiles: selectedFiles.length,
              totalSuccess: uploadResults.filter(r => r.success).length,
            };

            console.log(`✅ FileUpload terminé — mode: ${uploadMode}, ${selectedFiles.length} fichiers, path: ${path}`, payload);

            window.voiceflow.chat.interact({ type: 'complete', payload });
          }
        });
      });

      // ── Forcer la largeur sur element et ses parents VF ──
      element.style.width = '100%';
      element.style.maxWidth = '100%';

      setTimeout(() => {
        const messageElement = element.closest('.vfrc-message');
        if (messageElement) {
          messageElement.style.width = '100%';
          messageElement.style.maxWidth = '100%';
          const bubbleContent = messageElement.querySelector('.vfrc-bubble-content');
          if (bubbleContent) {
            bubbleContent.style.width = '100%';
            bubbleContent.style.maxWidth = '100%';
          }
        }
      }, 0);

      console.log(`✅ FileUpload v2.1 prêt (${uid}) — mode: ${uploadMode}, theme: ${theme}, minFiles: ${requiredFiles}, maxFiles: ${maxFiles}`);

    } catch (error) {
      console.error('❌ FileUpload Error:', error);
      element.innerHTML = `<div style="color:#EF4444;padding:20px;text-align:center;font-family:sans-serif;">❌ Erreur FileUpload: ${error.message}</div>`;
    }
  }
};

export default FileUpload;
