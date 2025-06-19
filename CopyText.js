/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CopyText – Voiceflow Response Extension                  ║
 *  ║                                                           ║
 *  ║  • Copie en 1 clic avec bouton et clic sur texte        ║
 *  ║  • Support HTML avec préservation des balises            ║
 *  ║  • Options : copie HTML ou texte brut                    ║
 *  ║  • Feedback visuel et analytics                          ║
 *  ║  • Glassmorphism et effets visuels avancés               ║
 *  ║  • Optimisé pour WordPress                               ║
 *  ║  • Support Text et JSON dans Custom Action               ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const CopyText = {
  name: 'CopyText',
  type: 'response',
  
  // Activation sur trace copy_text
  match: ({ trace }) => trace.type === 'copy_text' || trace.payload?.type === 'copy_text',

  render: ({ trace, element }) => {
    try {
      // Configuration depuis le payload avec support Text et JSON
      let payload = {};
      
      // Vérifier si le payload est une string
      if (typeof trace.payload === 'string') {
        const trimmedPayload = trace.payload.trim();
        
        // Si ça commence par { ou [, c'est probablement du JSON
        if (trimmedPayload.startsWith('{') || trimmedPayload.startsWith('[')) {
          try {
            payload = JSON.parse(trace.payload);
          } catch (e) {
            console.warn('Erreur parsing JSON, utilisation comme contenu direct:', e);
            // En cas d'erreur JSON, utiliser comme contenu direct
            payload = {
              content: trace.payload,
              title: "Contenu à copier",
              subtitle: "Cliquez sur le bouton ou le texte pour copier",
              backgroundColor: '#7E57C2',
              copyButtonText: 'Copier',
              showFormatOptions: true,
              enableClickToCopy: true
            };
          }
        } else {
          // Si ce n'est pas du JSON, c'est du contenu direct (mode Text)
          payload = {
            content: trace.payload,
            title: "Contenu à copier",
            subtitle: "Cliquez sur le bouton ou le texte pour copier",
            backgroundColor: '#7E57C2',
            copyButtonText: 'Copier',
            copyIconText: '📋',
            copiedText: 'Copié !',
            copiedIcon: '✅',
            showFormatOptions: true,
            enableClickToCopy: true,
            maxHeight: 400
          };
        }
      } else if (typeof trace.payload === 'object') {
        // Si c'est déjà un objet
        payload = trace.payload || {};
      } else {
        // Cas par défaut
        payload = {};
      }

      // Valeurs par défaut pour tous les paramètres
      const {
        content = '',                    // Contenu HTML à afficher
        title = '',                      // Titre optionnel
        subtitle = '',                   // Sous-titre optionnel
        backgroundColor = '#7E57C2',     // Couleur de fond
        copyButtonText = 'Copier',       // Texte du bouton
        copyIconText = '📋',            // Icône du bouton
        copiedText = 'Copié !',         // Texte après copie
        copiedIcon = '✅',              // Icône après copie
        showFormatOptions = true,        // Afficher les options de format
        enableClickToCopy = true,        // Activer le clic sur le texte
        maxHeight = 400,                 // Hauteur maximale en px
        instanceId = null               // ID unique
      } = payload;

      // Générer un ID unique
      const uniqueInstanceId = instanceId || `ct_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Container principal
      const container = document.createElement('div');
      container.className = 'copy-text-container';
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);

      // Extraction des couleurs RGB
      const hexToRgb = (hex) => {
        const num = parseInt(hex.replace('#',''), 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      };

      const bgRgb = hexToRgb(backgroundColor);

      // Styles CSS
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* Variables CSS */
.copy-text-container {
  --ct-bg-color: ${backgroundColor};
  --ct-bg-r: ${bgRgb.r};
  --ct-bg-g: ${bgRgb.g};
  --ct-bg-b: ${bgRgb.b};
  --ct-radius: 16px;
  --ct-shadow: 0 8px 32px rgba(0,0,0,0.2);
  --ct-max-height: ${maxHeight}px;
}

/* Container principal avec glassmorphism */
.copy-text-container {
  position: relative !important;
  width: 100% !important;
  margin: 1rem 0 !important;
  padding: 2rem !important;
  background: linear-gradient(135deg, 
    rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.9),
    rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.7)) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  border-radius: var(--ct-radius) !important;
  box-shadow: var(--ct-shadow), 
              inset 0 1px 0 rgba(255,255,255,0.1) !important;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
  color: #fff !important;
  transition: all 0.3s ease !important;
  overflow: hidden !important;
}

.copy-text-container:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important;
}

/* Titre et sous-titre */
.copy-text-header {
  margin-bottom: 1.5rem !important;
  text-align: center !important;
}

.copy-text-title {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  margin: 0 0 0.5rem 0 !important;
  color: #fff !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
}

.copy-text-subtitle {
  font-size: 1rem !important;
  opacity: 0.9 !important;
  color: rgba(255,255,255,0.9) !important;
}

/* Zone de contenu */
.copy-text-content {
  position: relative !important;
  background: rgba(255,255,255,0.95) !important;
  color: #333 !important;
  padding: 1.5rem !important;
  border-radius: 12px !important;
  max-height: var(--ct-max-height) !important;
  overflow-y: auto !important;
  cursor: ${enableClickToCopy ? 'pointer' : 'default'} !important;
  transition: all 0.3s ease !important;
  border: 2px solid transparent !important;
  scrollbar-width: thin !important;
  scrollbar-color: rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.3) #f0f0f0 !important;
}

/* Scrollbar personnalisée */
.copy-text-content::-webkit-scrollbar {
  width: 8px !important;
}

.copy-text-content::-webkit-scrollbar-track {
  background: #f0f0f0 !important;
  border-radius: 4px !important;
}

.copy-text-content::-webkit-scrollbar-thumb {
  background: rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.3) !important;
  border-radius: 4px !important;
}

.copy-text-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.5) !important;
}

/* Effet hover sur le contenu si clic activé */
${enableClickToCopy ? `
.copy-text-content:hover {
  background: rgba(255,255,255,1) !important;
  border-color: rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.3) !important;
  transform: scale(1.01) !important;
}
` : ''}

/* Indicateur de clic pour copier */
.copy-text-hint {
  position: absolute !important;
  bottom: 8px !important;
  right: 8px !important;
  font-size: 0.75rem !important;
  color: #666 !important;
  opacity: 0.6 !important;
  font-style: italic !important;
  pointer-events: none !important;
}

/* Container des boutons de copie */
.copy-text-actions {
  position: absolute !important;
  top: 1rem !important;
  right: 1rem !important;
  display: flex !important;
  gap: 0.5rem !important;
  z-index: 10 !important;
}

/* Bouton de copie principal */
.copy-text-btn {
  background: rgba(255,255,255,0.9) !important;
  color: var(--ct-bg-color) !important;
  border: none !important;
  padding: 0.75rem 1.25rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 0.9rem !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  position: relative !important;
  overflow: hidden !important;
}

.copy-text-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
  background: #fff !important;
}

.copy-text-btn:active {
  transform: translateY(0) !important;
}

/* Effet de vague au clic */
.copy-text-btn::before {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 0 !important;
  height: 0 !important;
  border-radius: 50% !important;
  background: rgba(var(--ct-bg-r), var(--ct-bg-g), var(--ct-bg-b), 0.3) !important;
  transform: translate(-50%, -50%) !important;
  transition: width 0.6s, height 0.6s !important;
}

.copy-text-btn.clicked::before {
  width: 300px !important;
  height: 300px !important;
}

/* État copié */
.copy-text-btn.copied {
  background: #4CAF50 !important;
  color: white !important;
  animation: successPulse 0.6s ease !important;
}

@keyframes successPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Menu des options de format */
.copy-format-menu {
  position: absolute !important;
  top: calc(100% + 0.5rem) !important;
  right: 0 !important;
  background: white !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
  padding: 0.5rem !important;
  display: none !important;
  min-width: 180px !important;
  z-index: 100 !important;
}

.copy-format-menu.show {
  display: block !important;
  animation: menuSlideIn 0.2s ease-out !important;
}

@keyframes menuSlideIn {
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.copy-format-option {
  display: block !important;
  width: 100% !important;
  padding: 0.6rem 1rem !important;
  border: none !important;
  background: none !important;
  text-align: left !important;
  cursor: pointer !important;
  color: #333 !important;
  font-size: 0.9rem !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
}

.copy-format-option:hover {
  background: #f5f5f5 !important;
  color: var(--ct-bg-color) !important;
}

.copy-format-option.with-icon {
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

/* Tooltip de feedback */
.copy-text-tooltip {
  position: fixed !important;
  background: rgba(0,0,0,0.9) !important;
  color: white !important;
  padding: 0.75rem 1.25rem !important;
  border-radius: 8px !important;
  font-size: 0.9rem !important;
  pointer-events: none !important;
  z-index: 1000 !important;
  transform: translate(-50%, -50%) !important;
  opacity: 0 !important;
  transition: opacity 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
}

.copy-text-tooltip.show {
  opacity: 1 !important;
}

/* Animation de particules pour le succès */
.copy-success-particles {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
  z-index: 100 !important;
}

.particle {
  position: absolute !important;
  width: 8px !important;
  height: 8px !important;
  background: #4CAF50 !important;
  border-radius: 50% !important;
  opacity: 0 !important;
  animation: particleFly 1s ease-out forwards !important;
}

@keyframes particleFly {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(0);
  }
  100% {
    opacity: 0;
    transform: translate(var(--x), var(--y)) scale(1);
  }
}

/* État désactivé */
.copy-text-container.disabled {
  opacity: 0.6 !important;
  pointer-events: none !important;
}

/* Support pour le contenu HTML */
.copy-text-content h1,
.copy-text-content h2,
.copy-text-content h3,
.copy-text-content h4,
.copy-text-content h5,
.copy-text-content h6 {
  color: #333 !important;
  margin-top: 1em !important;
  margin-bottom: 0.5em !important;
}

.copy-text-content p {
  margin-bottom: 1em !important;
  line-height: 1.6 !important;
}

.copy-text-content ul,
.copy-text-content ol {
  margin-left: 1.5em !important;
  margin-bottom: 1em !important;
}

.copy-text-content a {
  color: var(--ct-bg-color) !important;
  text-decoration: underline !important;
}

.copy-text-content code {
  background: #f5f5f5 !important;
  padding: 0.2em 0.4em !important;
  border-radius: 3px !important;
  font-family: monospace !important;
}

.copy-text-content pre {
  background: #f5f5f5 !important;
  padding: 1em !important;
  border-radius: 6px !important;
  overflow-x: auto !important;
  margin-bottom: 1em !important;
}

/* Responsive */
@media (max-width: 768px) {
  .copy-text-container {
    padding: 1.5rem 1rem !important;
  }
  
  .copy-text-content {
    padding: 1rem !important;
    font-size: 0.95rem !important;
  }
  
  .copy-text-actions {
    top: 0.5rem !important;
    right: 0.5rem !important;
  }
  
  .copy-text-btn {
    padding: 0.5rem 0.75rem !important;
    font-size: 0.85rem !important;
  }
}
      `;
      
      container.appendChild(styleEl);

      // Header si titre ou sous-titre
      if (title || subtitle) {
        const header = document.createElement('div');
        header.className = 'copy-text-header';
        
        if (title) {
          const titleEl = document.createElement('h2');
          titleEl.className = 'copy-text-title';
          titleEl.innerHTML = title;
          header.appendChild(titleEl);
        }
        
        if (subtitle) {
          const subtitleEl = document.createElement('div');
          subtitleEl.className = 'copy-text-subtitle';
          subtitleEl.innerHTML = subtitle;
          header.appendChild(subtitleEl);
        }
        
        container.appendChild(header);
      }

      // Zone de contenu
      const contentEl = document.createElement('div');
      contentEl.className = 'copy-text-content';
      contentEl.innerHTML = content;
      
      // Indicateur de clic si activé
      if (enableClickToCopy) {
        const hintEl = document.createElement('div');
        hintEl.className = 'copy-text-hint';
        hintEl.textContent = 'Cliquez pour copier';
        contentEl.appendChild(hintEl);
      }

      // Container des actions
      const actionsEl = document.createElement('div');
      actionsEl.className = 'copy-text-actions';

      // Bouton de copie principal
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-text-btn';
      copyBtn.innerHTML = `<span class="icon">${copyIconText}</span><span class="text">${copyButtonText}</span>`;

      // Menu des options de format
      let formatMenu = null;
      if (showFormatOptions) {
        formatMenu = document.createElement('div');
        formatMenu.className = 'copy-format-menu';
        
        const htmlOption = document.createElement('button');
        htmlOption.className = 'copy-format-option with-icon';
        htmlOption.innerHTML = '<span>📄</span><span>Copier avec formatage</span>';
        
        const textOption = document.createElement('button');
        textOption.className = 'copy-format-option with-icon';
        textOption.innerHTML = '<span>📝</span><span>Copier texte brut</span>';
        
        formatMenu.appendChild(htmlOption);
        formatMenu.appendChild(textOption);
        
        // Événements des options
        htmlOption.addEventListener('click', () => {
          copyContent('html');
          formatMenu.classList.remove('show');
        });
        
        textOption.addEventListener('click', () => {
          copyContent('text');
          formatMenu.classList.remove('show');
        });
        
        actionsEl.appendChild(formatMenu);
      }

      // Tooltip de feedback
      const tooltip = document.createElement('div');
      tooltip.className = 'copy-text-tooltip';
      document.body.appendChild(tooltip);

      // Fonction de copie
      const copyContent = async (format = 'html') => {
        try {
          let textToCopy = '';
          
          if (format === 'html') {
            textToCopy = content;
          } else {
            // Convertir HTML en texte brut
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            textToCopy = tempDiv.textContent || tempDiv.innerText || '';
          }
          
          // Utiliser l'API Clipboard moderne
          await navigator.clipboard.writeText(textToCopy);
          
          // Feedback visuel
          showCopySuccess();
          
          // Analytics
          window.voiceflow.chat.interact({
            type: 'track',
            payload: {
              event: 'copy_text',
              properties: {
                format: format,
                contentLength: textToCopy.length,
                instanceId: uniqueInstanceId,
                timestamp: new Date().toISOString()
              }
            }
          });
          
          console.log(`✅ Contenu copié (${format}) - ${textToCopy.length} caractères`);
          
        } catch (err) {
          console.error('Erreur lors de la copie:', err);
          showTooltip('❌ Erreur de copie', event);
        }
      };

      // Fonction pour afficher le succès
      const showCopySuccess = () => {
        // Changer le bouton
        copyBtn.classList.add('copied', 'clicked');
        copyBtn.innerHTML = `<span class="icon">${copiedIcon}</span><span class="text">${copiedText}</span>`;
        
        // Particules de succès
        createSuccessParticles();
        
        // Réinitialiser après 2 secondes
        setTimeout(() => {
          copyBtn.classList.remove('copied', 'clicked');
          copyBtn.innerHTML = `<span class="icon">${copyIconText}</span><span class="text">${copyButtonText}</span>`;
        }, 2000);
      };

      // Fonction pour créer des particules
      const createSuccessParticles = () => {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'copy-success-particles';
        
        for (let i = 0; i < 12; i++) {
          const particle = document.createElement('div');
          particle.className = 'particle';
          const angle = (i / 12) * Math.PI * 2;
          const distance = 50 + Math.random() * 50;
          particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
          particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
          particle.style.animationDelay = `${Math.random() * 0.2}s`;
          particlesContainer.appendChild(particle);
        }
        
        contentEl.appendChild(particlesContainer);
        setTimeout(() => particlesContainer.remove(), 1000);
      };

      // Fonction pour afficher le tooltip
      const showTooltip = (text, event) => {
        tooltip.textContent = text;
        tooltip.style.left = event.pageX + 'px';
        tooltip.style.top = event.pageY + 'px';
        tooltip.classList.add('show');
        
        setTimeout(() => {
          tooltip.classList.remove('show');
        }, 2000);
      };

      // Événements
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (showFormatOptions && formatMenu) {
          // Toggle le menu
          formatMenu.classList.toggle('show');
        } else {
          // Copie directe en HTML
          copyContent('html');
        }
      });

      // Clic sur le contenu pour copier
      if (enableClickToCopy) {
        contentEl.addEventListener('click', (e) => {
          // Ne pas copier si on clique sur un lien
          if (e.target.tagName !== 'A') {
            copyContent('html');
            showTooltip(`${copiedIcon} ${copiedText}`, e);
          }
        });
      }

      // Fermer le menu si on clique ailleurs
      document.addEventListener('click', (e) => {
        if (formatMenu && !actionsEl.contains(e.target)) {
          formatMenu.classList.remove('show');
        }
      });

      // Assemblage
      actionsEl.appendChild(copyBtn);
      container.appendChild(contentEl);
      container.appendChild(actionsEl);
      
      // Ajout au DOM
      element.appendChild(container);
      
      console.log(`✅ CopyText prêt (ID: ${uniqueInstanceId})`);
      
      // Cleanup
      return () => {
        if (tooltip.parentNode) {
          tooltip.remove();
        }
      };
      
    } catch (error) {
      console.error('❌ CopyText Error:', error);
      
      // Message d'erreur
      const errorEl = document.createElement('div');
      errorEl.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        margin: 1rem 0;
      `;
      errorEl.innerHTML = `
        <strong>Erreur CopyText:</strong><br>
        ${error.message}<br>
        <small>Vérifiez la console pour plus de détails.</small>
      `;
      element.appendChild(errorEl);
      
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: error.message }
      });
    }
  }
};

export default CopyText;
