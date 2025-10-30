/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CtrlEnterOnly – Voiceflow Effect Extension              ║
 *  ║                                                           ║
 *  ║  • Entrée seule = Retour à la ligne (visible)            ║
 *  ║  • Ctrl+Entrée = Envoi du message                        ║
 *  ║  • Compatible avec autres extensions                     ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const CtrlEnterOnlyExtension = {
  name: 'CtrlEnterOnly',
  type: 'effect',
  match: () => true,
  effect: () => {
    console.log('🚀 Extension Ctrl+Enter chargée');
    
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
    
    let isSetup = false;
    let attempts = 0;
    const maxAttempts = 40;
    
    const setupKeyboardHandler = () => {
      const host = getHost();
      const textarea = host.querySelector('textarea.vfrc-chat-input');
      const sendButton = host.querySelector('#vfrc-send-message');
      
      if (textarea && sendButton && !isSetup) {
        console.log('✅ Textarea et bouton trouvés !');
        console.log('📍 Host type:', host === document ? 'Document' : 'Shadow Root');
        isSetup = true;
        
        const keyHandler = (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            
            if (e.ctrlKey || e.metaKey) {
              // ✅ Ctrl+Enter → Envoyer le message
              console.log('✅ Ctrl+Enter → Envoi du message');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              setTimeout(() => sendButton.click(), 0);
              return false;
            } else {
              // ✅ Enter seul → Retour à la ligne
              console.log('↩️ Enter seul → Retour à la ligne');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // Insérer le retour à la ligne
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const value = textarea.value;
              
              const newValue = value.substring(0, start) + '\n' + value.substring(end);
              textarea.value = newValue;
              
              // Repositionner le curseur
              const newCursorPos = start + 1;
              textarea.selectionStart = newCursorPos;
              textarea.selectionEnd = newCursorPos;
              
              // ✅ Déclencher les événements pour la mise à jour
              const inputEvent = new Event('input', { bubbles: true });
              textarea.dispatchEvent(inputEvent);
              
              // ✅ Redimensionner le textarea
              textarea.style.height = 'auto';
              textarea.style.height = textarea.scrollHeight + 'px';
              
              // ✅ SUPPRIMÉ blur/focus qui causait le problème
              
              return false;
            }
          }
        };
        
        // Listener uniquement sur keydown
        textarea.addEventListener('keydown', keyHandler, true);
        
        console.log('🎉 Ctrl+Enter configuré avec succès !');
        console.log('📝 Enter = Retour à la ligne | Ctrl+Enter = Envoyer');
        
      } else if (!isSetup) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts} - Réessai...`);
          setTimeout(setupKeyboardHandler, 250);
        } else {
          console.error('❌ Impossible de trouver les éléments après', maxAttempts, 'tentatives');
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
