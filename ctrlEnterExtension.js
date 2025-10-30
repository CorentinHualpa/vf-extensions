/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CtrlEnterOnly – Voiceflow Effect Extension              ║
 *  ║                                                           ║
 *  ║  • Force l'utilisation de Ctrl+Entrée pour envoyer       ║
 *  ║  • Bloque la touche Entrée seule                         ║
 *  ║  • Compatible Shadow DOM                                 ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const CtrlEnterOnlyExtension = {
  name: 'CtrlEnterOnly',
  type: 'effect',
  match: () => true,
  effect: () => {  // ✅ PAS de paramètre element pour les extensions "effect"
    console.log('🚀 Extension Ctrl+Enter chargée');
    
    // ✅ Accès direct au Shadow DOM du widget Voiceflow
    const getHost = () => {
      // Le widget Voiceflow crée un shadow-root, on doit le trouver
      const vfContainer = document.querySelector('#voiceflow-chat-container');
      if (vfContainer) {
        // Chercher le shadow-root dans le container
        const shadowHost = vfContainer.querySelector('[data-vf-chat]') || 
                          vfContainer.querySelector('div > div');
        if (shadowHost && shadowHost.shadowRoot) {
          return shadowHost.shadowRoot;
        }
      }
      // Fallback : chercher dans tous les shadow roots
      const allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        if (el.shadowRoot) {
          const textarea = el.shadowRoot.querySelector('textarea.vfrc-chat-input');
          if (textarea) return el.shadowRoot;
        }
      }
      return document; // Fallback au document normal
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
            console.log('🔑 Enter détecté - Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
            
            if (e.ctrlKey || e.metaKey) {
              console.log('✅ Ctrl+Enter → Envoi');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              setTimeout(() => sendButton.click(), 0);
              return false;
            } else {
              console.log('❌ Enter seul → Bloqué');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
          }
        };
        
        // Ajouter les listeners avec capture
        textarea.addEventListener('keydown', keyHandler, true);
        textarea.addEventListener('keypress', keyHandler, true);
        textarea.addEventListener('keyup', keyHandler, true);
        
        console.log('🎉 Ctrl+Enter configuré avec succès !');
        console.log('📝 Utilisez Ctrl+Entrée (ou Cmd+Entrée sur Mac) pour envoyer vos messages');
        
      } else if (!isSetup) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts} - Réessai...`);
          setTimeout(setupKeyboardHandler, 250);
        } else {
          console.error('❌ Impossible de trouver les éléments après', maxAttempts, 'tentatives');
          console.log('🔍 Debug - Host:', getHost());
        }
      }
    };
    
    // Démarrer avec un délai pour laisser le widget se charger
    setTimeout(setupKeyboardHandler, 500);
    
    return () => {
      console.log('🧹 Nettoyage de l\'extension Ctrl+Enter');
    };
  }
};

export default CtrlEnterOnlyExtension;
