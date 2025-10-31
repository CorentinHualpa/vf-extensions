/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CtrlEnterOnly – Voiceflow Effect Extension              ║
 *  ║                                                           ║
 *  ║  • Entrée seule = Retour à la ligne                      ║
 *  ║  • Ctrl+Entrée = Envoi du message                        ║
 *  ║  • N'interfère PAS avec les autres extensions            ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

// ✅ FLAG GLOBAL pour ne s'exécuter qu'UNE SEULE FOIS
window.__CTRL_ENTER_SETUP_DONE__ = window.__CTRL_ENTER_SETUP_DONE__ || false;

export const CtrlEnterOnlyExtension = {
  name: 'CtrlEnterOnly',
  type: 'effect',
  match: () => {
    // ✅ Ne match QUE si pas encore configuré
    return !window.__CTRL_ENTER_SETUP_DONE__;
  },
  effect: () => {
    // ✅ Marquer immédiatement comme fait pour éviter les doubles exécutions
    if (window.__CTRL_ENTER_SETUP_DONE__) {
      console.log('⚠️ Extension Ctrl+Enter déjà configurée, skip');
      return;
    }
    
    console.log('🚀 Extension Ctrl+Enter - Initialisation...');
    
    const getHost = () => {
      const vfContainer = document.querySelector('#voiceflow-chat-container');
      if (vfContainer) {
        const shadowHost = vfContainer.querySelector('[data-vf-chat]') || 
                          vfContainer.querySelector('div > div');
        if (shadowHost && shadowHost.shadowRoot) {
          return shadowHost.shadowRoot;
        }
      }
      const allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        if (el.shadowRoot) {
          const textarea = el.shadowRoot.querySelector('textarea.vfrc-chat-input');
          if (textarea) return el.shadowRoot;
        }
      }
      return document;
    };
    
    let attempts = 0;
    const maxAttempts = 40;
    
    const setupKeyboardHandler = () => {
      const host = getHost();
      const textarea = host.querySelector('textarea.vfrc-chat-input');
      const sendButton = host.querySelector('#vfrc-send-message');
      
      if (textarea && sendButton) {
        console.log('✅ Textarea et bouton trouvés !');
        
        // ✅ Vérifier qu'on n'a pas déjà ajouté le listener
        if (textarea.__ctrlEnterConfigured__) {
          console.log('⚠️ Listener déjà configuré, skip');
          return;
        }
        
        textarea.__ctrlEnterConfigured__ = true;
        window.__CTRL_ENTER_SETUP_DONE__ = true;
        
        const keyHandler = (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            
            if (e.ctrlKey || e.metaKey) {
              // Ctrl+Enter → Envoyer
              console.log('✅ Ctrl+Enter → Envoi');
              e.preventDefault();
              e.stopPropagation();
              setTimeout(() => sendButton.click(), 0);
              return false;
            } else {
              // Enter seul → Retour à la ligne
              console.log('↩️ Enter → Retour à la ligne');
              e.preventDefault();
              e.stopPropagation();
              
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const value = textarea.value;
              
              textarea.value = value.substring(0, start) + '\n' + value.substring(end);
              textarea.selectionStart = textarea.selectionEnd = start + 1;
              
              const inputEvent = new Event('input', { bubbles: true });
              textarea.dispatchEvent(inputEvent);
              
              textarea.style.height = 'auto';
              textarea.style.height = textarea.scrollHeight + 'px';
              
              return false;
            }
          }
        };
        
        // ✅ Utiliser addEventListener SANS capture (false) pour ne pas bloquer les autres
        textarea.addEventListener('keydown', keyHandler, false);
        
        console.log('🎉 Ctrl+Enter configuré avec succès !');
        console.log('📝 Enter = Retour à la ligne | Ctrl+Enter = Envoyer');
        console.log('🔒 Extension verrouillée - Ne se redéclenchera plus');
        
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts} - Réessai...`);
          setTimeout(setupKeyboardHandler, 250);
        } else {
          console.error('❌ Impossible de trouver les éléments');
          window.__CTRL_ENTER_SETUP_DONE__ = false; // Réinitialiser en cas d'échec
        }
      }
    };
    
    setTimeout(setupKeyboardHandler, 500);
    
    return () => {
      console.log('🧹 Nettoyage de l\'extension Ctrl+Enter');
    };
  }
};

export default CtrlEnterOnlyExtension;
