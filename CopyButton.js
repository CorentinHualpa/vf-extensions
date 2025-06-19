/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CopyButton – Voiceflow Response Extension                ║
 *  ║                                                           ║
 *  ║  • Bouton de copie minimaliste et élégant                ║
 *  ║  • S'intègre sous les blocs text Voiceflow               ║
 *  ║  • Options : copie HTML ou texte brut                    ║
 *  ║  • Design subtil avec feedback visuel                    ║
 *  ║  • Copie le dernier message affiché                      ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const CopyButton = {
  name: 'CopyButton',
  type: 'response',
  
  match: ({ trace }) => trace.type === 'copy_button' || trace.payload?.type === 'copy_button',

  render: ({ trace, element }) => {
    try {
      // Configuration
      const payload = trace.payload || {};
      const {
        buttonText = 'Copier le texte',
        copiedText = 'Copié !',
        backgroundColor = 'transparent',
        accentColor = '#7E57C2',
        showIcon = true,
        iconText = '📋',
        copiedIcon = '✅',
        position = 'center', // left, center, right
        instanceId = null
      } = typeof payload === 'string' ? {} : payload;

      // Générer un ID unique
      const uniqueInstanceId = instanceId || `cb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Container principal
      const container = document.createElement('div');
      container.className = 'copy-button-container';
      container.id = uniqueInstanceId;

      // Extraction des couleurs RGB
      const hexToRgb = (hex) => {
        const num = parseInt(hex.replace('#',''), 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      };

      const accentRgb = hexToRgb(accentColor);

      // Styles CSS minimalistes
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* Variables CSS */
.copy-button-container {
  --cb-accent: ${accentColor};
  --cb-accent-r: ${accentRgb.r};
  --cb-accent-g: ${accentRgb.g};
  --cb-accent-b: ${accentRgb.b};
}

/* Container principal - Design épuré */
.copy-button-container {
  width: 100% !important;
  margin: -0.5rem 0 1rem 0 !important; /* Marge négative pour se rapprocher du texte */
  padding: 0 !important;
  display: flex !important;
  justify-content: ${position} !important;
  align-items: center !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  position: relative !important;
}

/* Wrapper pour l'alignement */
.copy-button-wrapper {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
}

/* Bouton principal - Style subtil */
.copy-button-main {
  background: rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.08) !important;
  color: var(--cb-accent) !important;
  border: 1px solid rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.2) !important;
  padding: 8px 16px !important;
  border-radius: 20px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  position: relative !important;
  overflow: hidden !important;
}

.copy-button-main:hover {
  background: rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.15) !important;
  border-color: var(--cb-accent) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.2) !important;
}

.copy-button-main:active {
  transform: translateY(0) !important;
  box-shadow: none !important;
}

/* État copié */
.copy-button-main.copied {
  background: rgba(76, 175, 80, 0.1) !important;
  color: #4CAF50 !important;
  border-color: rgba(76, 175, 80, 0.3) !important;
}

/* Icône */
.copy-button-icon {
  font-size: 14px !important;
  line-height: 1 !important;
  opacity: 0.8 !important;
  transition: all 0.2s ease !important;
}

.copy-button-main:hover .copy-button-icon {
  opacity: 1 !important;
  transform: scale(1.1) !important;
}

/* Menu déroulant pour les options */
.copy-button-menu {
  position: absolute !important;
  top: calc(100% + 4px) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: white !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
  padding: 4px !important;
  min-width: 160px !important;
  z-index: 1000 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transition: all 0.2s ease !important;
}

.copy-button-menu.show {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Options du menu */
.copy-button-option {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px 12px !important;
  border: none !important;
  background: none !important;
  color: #333 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  border-radius: 6px !important;
  transition: all 0.15s ease !important;
  width: 100% !important;
  text-align: left !important;
}

.copy-button-option:hover {
  background: #f5f5f5 !important;
  color: var(--cb-accent) !important;
}

.copy-button-option-icon {
  opacity: 0.7 !important;
  font-size: 12px !important;
}

/* Divider */
.copy-button-divider {
  height: 1px !important;
  background: #e0e0e0 !important;
  margin: 4px 8px !important;
}

/* Indicateur visuel de connexion au texte */
.copy-button-container::before {
  content: '' !important;
  position: absolute !important;
  top: -8px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: 20px !important;
  height: 1px !important;
  background: rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.2) !important;
  opacity: 0 !important;
  transition: opacity 0.2s ease !important;
}

.copy-button-container:hover::before {
  opacity: 1 !important;
}

/* Toast de notification */
.copy-button-toast {
  position: fixed !important;
  bottom: 24px !important;
  left: 50% !important;
  transform: translateX(-50%) translateY(100px) !important;
  background: rgba(0,0,0,0.8) !important;
  color: white !important;
  padding: 12px 24px !important;
  border-radius: 24px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
  z-index: 10000 !important;
  opacity: 0 !important;
  transition: all 0.3s ease !important;
  pointer-events: none !important;
}

.copy-button-toast.show {
  transform: translateX(-50%) translateY(0) !important;
  opacity: 1 !important;
}

/* Animation d'onde */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.copy-button-main::after {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: var(--cb-accent) !important;
  opacity: 0 !important;
  transform: translate(-50%, -50%) scale(0) !important;
  pointer-events: none !important;
}

.copy-button-main.ripple::after {
  animation: ripple 0.6s ease-out !important;
}

/* Responsive */
@media (max-width: 480px) {
  .copy-button-main {
    padding: 6px 12px !important;
    font-size: 12px !important;
  }
  
  .copy-button-menu {
    min-width: 140px !important;
  }
}
      `;
      
      container.appendChild(styleEl);

      // Wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'copy-button-wrapper';

      // Bouton principal
      const mainButton = document.createElement('button');
      mainButton.className = 'copy-button-main';
      mainButton.innerHTML = `
        ${showIcon ? `<span class="copy-button-icon">${iconText}</span>` : ''}
        <span class="copy-button-text">${buttonText}</span>
      `;

      // Menu des options
      const menu = document.createElement('div');
      menu.className = 'copy-button-menu';
      
      const htmlOption = document.createElement('button');
      htmlOption.className = 'copy-button-option';
      htmlOption.innerHTML = `
        <span class="copy-button-option-icon">📄</span>
        <span>Avec formatage</span>
      `;
      
      const textOption = document.createElement('button');
      textOption.className = 'copy-button-option';
      textOption.innerHTML = `
        <span class="copy-button-option-icon">📝</span>
        <span>Texte brut</span>
      `;
      
      menu.appendChild(htmlOption);
      menu.appendChild(textOption);

      // Toast de notification
      const toast = document.createElement('div');
      toast.className = 'copy-button-toast';
      document.body.appendChild(toast);

      // Fonction pour récupérer le dernier message texte
      const getLastTextContent = () => {
        const messages = element.closest('.vfrc-message')?.parentElement?.querySelectorAll('.vfrc-message') || [];
        
        // Chercher le message précédent qui contient du texte
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg === element.closest('.vfrc-message')) continue;
          
          const textElement = msg.querySelector('.vfrc-message--text');
          if (textElement && textElement.textContent.trim()) {
            return {
              html: textElement.innerHTML,
              text: textElement.textContent
            };
          }
        }
        
        return null;
      };

      // Fonction de copie
      const copyContent = async (format = 'html') => {
        const content = getLastTextContent();
        if (!content) {
          showToast('❌ Aucun texte à copier');
          return;
        }

        try {
          const textToCopy = format === 'html' ? content.html : content.text;
          await navigator.clipboard.writeText(textToCopy);
          
          // Feedback visuel
          mainButton.classList.add('copied', 'ripple');
          mainButton.innerHTML = `
            ${showIcon ? `<span class="copy-button-icon">${copiedIcon}</span>` : ''}
            <span class="copy-button-text">${copiedText}</span>
          `;
          
          showToast(`${copiedIcon} ${format === 'html' ? 'Copié avec formatage' : 'Texte copié'}`);
          
          // Analytics
          if (window.voiceflow?.chat?.interact) {
            window.voiceflow.chat.interact({
              type: 'track',
              payload: {
                event: 'copy_button_click',
                properties: {
                  format: format,
                  contentLength: textToCopy.length,
                  instanceId: uniqueInstanceId
                }
              }
            });
          }
          
          // Réinitialiser après 2 secondes
          setTimeout(() => {
            mainButton.classList.remove('copied', 'ripple');
            mainButton.innerHTML = `
              ${showIcon ? `<span class="copy-button-icon">${iconText}</span>` : ''}
              <span class="copy-button-text">${buttonText}</span>
            `;
          }, 2000);
          
        } catch (err) {
          console.error('Erreur de copie:', err);
          showToast('❌ Erreur lors de la copie');
        }
      };

      // Fonction pour afficher le toast
      const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 2000);
      };

      // Événements
      let menuTimeout;
      
      mainButton.addEventListener('mouseenter', () => {
        clearTimeout(menuTimeout);
        menu.classList.add('show');
      });

      wrapper.addEventListener('mouseleave', () => {
        menuTimeout = setTimeout(() => {
          menu.classList.remove('show');
        }, 300);
      });

      htmlOption.addEventListener('click', () => {
        copyContent('html');
        menu.classList.remove('show');
      });

      textOption.addEventListener('click', () => {
        copyContent('text');
        menu.classList.remove('show');
      });

      // Assemblage
      wrapper.appendChild(mainButton);
      wrapper.appendChild(menu);
      container.appendChild(wrapper);
      
      // Ajout au DOM
      element.appendChild(container);
      
      console.log(`✅ CopyButton prêt (ID: ${uniqueInstanceId})`);
      
      // Cleanup
      return () => {
        if (toast.parentNode) {
          toast.remove();
        }
      };
      
    } catch (error) {
      console.error('❌ CopyButton Error:', error);
    }
  }
};

export default CopyButton;
