/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CopyButton – Voiceflow Response Extension                ║
 *  ║                                                           ║
 *  ║  • Design minimaliste style ChatGPT/Claude               ║
 *  ║  • Bouton discret avec icône uniquement                  ║
 *  ║  • Options compactes : Brut / Formaté                    ║
 *  ║  • Sans cadre ni fond coloré                             ║
 *  ║  • Sans interaction avec Voiceflow                       ║ 
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const CopyButton = {
  name: 'CopyButton',
  type: 'response',
  
  match: ({ trace }) => trace.type === 'copy_button' || trace.payload?.type === 'copy_button',

  render: ({ trace, element }) => {
    try {
      // Configuration et contenu
      let content = '';
      let config = {};
      
      // Si le payload est une string, c'est le contenu direct
      if (typeof trace.payload === 'string') {
        content = trace.payload;
        config = {};
      } else if (typeof trace.payload === 'object') {
        // Si c'est un objet, extraire le contenu et la config
        content = trace.payload.content || '';
        config = trace.payload;
      }
      
      // Configuration avec valeurs par défaut
      const {
        accentColor = '#666666',
        iconText = '📋',
        copiedIcon = '✅',
        instanceId = null
      } = config;

      // Si pas de contenu fourni, on abandonne
      if (!content) {
        console.warn('CopyButton: Aucun contenu à copier fourni');
        return;
      }

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

      // Création de l'élément style
      const styleEl = document.createElement('style');
      styleEl.textContent = `
/* Variables CSS */
.copy-button-container {
  --cb-accent: ${accentColor};
  --cb-accent-r: ${accentRgb.r};
  --cb-accent-g: ${accentRgb.g};
  --cb-accent-b: ${accentRgb.b};
}

/* Container principal ultra-minimaliste */
.copy-button-container {
  width: auto !important;
  margin: -0.75rem 0 0.5rem 0 !important; /* Marge négative pour coller au texte */
  padding: 0 !important;
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  position: relative !important;
  background: none !important;
  border: none !important;
}

/* Wrapper pour l'alignement */
.copy-button-wrapper {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
}

/* Bouton principal - Style icône uniquement */
.copy-button-main {
  background: transparent !important;
  color: var(--cb-accent) !important;
  border: 1px solid transparent !important;
  padding: 4px 8px !important;
  border-radius: 6px !important;
  font-size: 16px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
  position: relative !important;
  min-width: 32px !important;
  height: 32px !important;
}

.copy-button-main:hover {
  background: rgba(0, 0, 0, 0.05) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
}

/* État copié */
.copy-button-main.copied {
  color: #4CAF50 !important;
}

/* Icône */
.copy-button-icon {
  font-size: 16px !important;
  line-height: 1 !important;
  opacity: 0.7 !important;
  transition: all 0.2s ease !important;
}

.copy-button-main:hover .copy-button-icon {
  opacity: 1 !important;
}

/* Menu déroulant compact */
.copy-button-menu {
  position: absolute !important;
  top: calc(100% + 2px) !important;
  right: 0 !important;
  background: white !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  padding: 2px !important;
  min-width: auto !important;
  z-index: 1000 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transition: all 0.15s ease !important;
}

.copy-button-menu.show {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Options du menu - Style compact */
.copy-button-option {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 6px 12px !important;
  border: none !important;
  background: none !important;
  color: #333 !important;
  font-size: 12px !important;
  cursor: pointer !important;
  border-radius: 4px !important;
  transition: all 0.1s ease !important;
  width: 100% !important;
  text-align: left !important;
  white-space: nowrap !important;
}

.copy-button-option:hover {
  background: #f0f0f0 !important;
}

.copy-button-option-icon {
  opacity: 0.8 !important;
  font-size: 14px !important;
}

/* Séparateur entre options */
.copy-button-option + .copy-button-option {
  border-top: 1px solid #f0f0f0 !important;
}

/* Toast de notification minimaliste */
.copy-button-toast {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  background: rgba(0,0,0,0.8) !important;
  color: white !important;
  padding: 8px 16px !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
  z-index: 10000 !important;
  opacity: 0 !important;
  transform: translateY(10px) !important;
  transition: all 0.2s ease !important;
  pointer-events: none !important;
}

.copy-button-toast.show {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

/* Masquer le background gris du message Voiceflow */
.vfrc-message--extension-CopyButton {
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

/* Animation subtile */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.copy-button-main {
  animation: fadeIn 0.3s ease-out !important;
}

/* Responsive */
@media (max-width: 480px) {
  .copy-button-main {
    padding: 6px !important;
    min-width: 28px !important;
    height: 28px !important;
  }
  
  .copy-button-icon {
    font-size: 14px !important;
  }
}
      `;
      
      container.appendChild(styleEl);

      // Wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'copy-button-wrapper';

      // Bouton principal (icône uniquement)
      const mainButton = document.createElement('button');
      mainButton.className = 'copy-button-main';
      mainButton.innerHTML = `<span class="copy-button-icon">${iconText}</span>`;
      mainButton.title = 'Copier';

      // Menu des options compact
      const menu = document.createElement('div');
      menu.className = 'copy-button-menu';
      
      const htmlOption = document.createElement('button');
      htmlOption.className = 'copy-button-option';
      htmlOption.innerHTML = `
        <span class="copy-button-option-icon">🎨</span>
        <span>Formaté</span>
      `;
      htmlOption.title = 'Copier avec la mise en forme';
      
      const textOption = document.createElement('button');
      textOption.className = 'copy-button-option';
      textOption.innerHTML = `
        <span class="copy-button-option-icon">📝</span>
        <span>Brut</span>
      `;
      textOption.title = 'Copier le texte brut';
      
      menu.appendChild(htmlOption);
      menu.appendChild(textOption);

      // Toast de notification
      const toast = document.createElement('div');
      toast.className = 'copy-button-toast';
      document.body.appendChild(toast);

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
          
          await navigator.clipboard.writeText(textToCopy);
          
          // Feedback visuel minimaliste
          mainButton.classList.add('copied');
          mainButton.querySelector('.copy-button-icon').textContent = copiedIcon;
          
          showToast(format === 'html' ? 'Copié avec formatage' : 'Texte copié');
          
          // Log simple sans interaction Voiceflow
          console.log(`✅ CopyButton: Contenu copié (${format}) - ${textToCopy.length} caractères`);
          
          // Réinitialiser après 2 secondes
          setTimeout(() => {
            mainButton.classList.remove('copied');
            mainButton.querySelector('.copy-button-icon').textContent = iconText;
          }, 2000);
          
        } catch (err) {
          console.error('Erreur de copie:', err);
          showToast('Erreur lors de la copie');
        }
      };

      // Fonction pour afficher le toast
      const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 1500);
      };

      // Événements simplifiés
      let menuVisible = false;
      
      mainButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!menuVisible) {
          menu.classList.add('show');
          menuVisible = true;
        } else {
          menu.classList.remove('show');
          menuVisible = false;
        }
      });

      // Fermer le menu en cliquant ailleurs
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && menuVisible) {
          menu.classList.remove('show');
          menuVisible = false;
        }
      });

      htmlOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyContent('html');
        menu.classList.remove('show');
        menuVisible = false;
      });

      textOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyContent('text');
        menu.classList.remove('show');
        menuVisible = false;
      });

      // Assemblage
      wrapper.appendChild(mainButton);
      wrapper.appendChild(menu);
      container.appendChild(wrapper);
      
      // Ajout au DOM
      element.appendChild(container);
      
      // Forcer la suppression du style du conteneur parent
      setTimeout(() => {
        const parentMessage = element.closest('.vfrc-message');
        if (parentMessage) {
          parentMessage.style.background = 'transparent';
          parentMessage.style.padding = '0';
          parentMessage.style.margin = '0';
          parentMessage.style.border = 'none';
          parentMessage.style.boxShadow = 'none';
        }
      }, 0);
      
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
