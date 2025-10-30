/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CtrlEnterOnly – Voiceflow Effect Extension              ║
 *  ║                                                           ║
 *  ║  • Entrée seule = Retour à la ligne (visible)            ║
 *  ║  • Ctrl+Entrée = Envoi du message                        ║
 *  ║  • Compatible Shadow DOM                                 ║
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
              // ✅ Enter seul → Retour à la ligne VISIBLE
              console.log('↩️ Enter seul → Retour à la ligne');
              e.preventDefault(); // Empêche le comportement par défaut
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // Insérer manuellement un retour à la ligne
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const value = textarea.value;
              
              // Insérer le \n
              const newValue = value.substring(0, start) + '\n' + value.substring(end);
              textarea.value = newValue;
              
              // Repositionner le curseur APRÈS le \n
              const newCursorPos = start + 1;
              textarea.selectionStart = newCursorPos;
              textarea.selectionEnd = newCursorPos;
              
              // ✅ FORCER LA MISE À JOUR VISUELLE
              // 1. Déclencher l'événement input
              const inputEvent = new Event('input', { bubbles: true, cancelable: true });
              textarea.dispatchEvent(inputEvent);
              
              // 2. Déclencher l'événement change
              const changeEvent = new Event('change', { bubbles: true, cancelable: true });
              textarea.dispatchEvent(changeEvent);
              
              // 3. Forcer le redimensionnement du textarea
              textarea.style.height = 'auto';
              textarea.style.height = textarea.scrollHeight + 'px';
              
              // 4. Forcer le focus pour rendre le curseur visible
              textarea.blur();
              textarea.focus();
              
              // 5. Scroll vers la position du curseur
              textarea.scrollTop = textarea.scrollHeight;
              
              return false;
            }
          }
        };
        
        // Ajouter le listener uniquement sur keydown
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
