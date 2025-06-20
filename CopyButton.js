/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CopyButton – Voiceflow Response Extension                ║
 *  ║                                                           ║
 *  ║  • Bouton de copie minimaliste et élégant                ║
 *  ║  • Copie le contenu passé en paramètre                   ║
 *  ║  • Options : copie HTML ou texte brut                    ║
 *  ║  • Design subtil avec feedback visuel                    ║
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
        buttonText = 'Copier le texte',
        copiedText = 'Copié !',
        accentColor = '#7E57C2',
        showIcon = true,
        iconText = '📋',
        copiedIcon = '✅',
        position = 'center', // left, center, right
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

      // Styles CSS minimalistes
styleEl.textContent = `
/* Variables CSS */
.copy-button-container {
  --cb-accent: ${accentColor};
  --cb-accent-r: ${accentRgb.r};
  --cb-accent-g: ${accentRgb.g};
  --cb-accent-b: ${accentRgb.b};
}

/* Container principal avec fond subtil */
.copy-button-container {
  width: 100% !important;
  margin: 0.25rem 0 1rem 0 !important;
  padding: 16px !important;
  background: linear-gradient(135deg, 
    rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.08),
    rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.03)) !important;
  border-radius: 12px !important;
  border: 1px dashed rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.3) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 16px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  position: relative !important;
  transition: all 0.3s ease !important;
}

.copy-button-container:hover {
  background: linear-gradient(135deg, 
    rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.12),
    rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.05)) !important;
  border-style: solid !important;
}

/* Flèche indicatrice */
.copy-button-arrow {
  color: var(--cb-accent) !important;
  font-size: 20px !important;
  opacity: 0.5 !important;
  animation: pointUp 2s ease-in-out infinite !important;
}

@keyframes pointUp {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-5px); opacity: 0.8; }
}

/* Label descriptif */
.copy-button-label {
  font-size: 14px !important;
  color: #555 !important;
  font-weight: 500 !important;
}

/* Wrapper pour l'alignement */
.copy-button-wrapper {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
}

/* Bouton principal plus visible */
.copy-button-main {
  background: var(--cb-accent) !important;
  color: white !important;
  border: none !important;
  padding: 10px 24px !important;
  border-radius: 24px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  position: relative !important;
  overflow: hidden !important;
  box-shadow: 0 4px 12px rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.3) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.copy-button-main:hover {
  transform: translateY(-2px) scale(1.05) !important;
  box-shadow: 0 6px 20px rgba(var(--cb-accent-r), var(--cb-accent-g), var(--cb-accent-b), 0.4) !important;
}

/* Menu et autres styles restent identiques... */
${/* Copiez le reste du CSS original ici */}
`;

// Et modifiez la construction du HTML :
// Flèche
const arrowEl = document.createElement('span');
arrowEl.className = 'copy-button-arrow';
arrowEl.textContent = '⬆';

// Label
const labelEl = document.createElement('span');
labelEl.className = 'copy-button-label';
labelEl.textContent = 'Texte disponible pour copie :';

// Assemblage modifié
container.appendChild(arrowEl);
container.appendChild(labelEl);
container.appendChild(wrapper);

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
          
          // Feedback visuel
          mainButton.classList.add('copied', 'ripple');
          mainButton.innerHTML = `
            ${showIcon ? `<span class="copy-button-icon">${copiedIcon}</span>` : ''}
            <span class="copy-button-text">${copiedText}</span>
          `;
          
          showToast(`${copiedIcon} ${format === 'html' ? 'Copié avec formatage' : 'Texte copié'}`);
          
          // Log simple sans interaction Voiceflow
          console.log(`✅ CopyButton: Contenu copié (${format}) - ${textToCopy.length} caractères`);
          
          // Stocker les stats localement si besoin (sans déclencher d'interaction)
          if (window.copyButtonStats) {
            window.copyButtonStats.push({
              timestamp: new Date().toISOString(),
              format: format,
              length: textToCopy.length,
              instanceId: uniqueInstanceId
            });
          } else {
            window.copyButtonStats = [{
              timestamp: new Date().toISOString(),
              format: format,
              length: textToCopy.length,
              instanceId: uniqueInstanceId
            }];
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

      htmlOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyContent('html');
        menu.classList.remove('show');
      });

      textOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyContent('text');
        menu.classList.remove('show');
      });

      // Clic direct sur le bouton = copie HTML par défaut
      mainButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Si le menu n'est pas visible, copier directement
        if (!menu.classList.contains('show')) {
          copyContent('html');
        }
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
