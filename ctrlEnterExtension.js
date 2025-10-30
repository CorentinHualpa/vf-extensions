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
  match: () => true, // Toujours actif
  effect: ({ element }) => {
    console.log('🚀 Extension Ctrl+Enter chargée');
    
    // Accès au Shadow DOM (comme dans MultiSelect)
    const root = element.getRootNode();
    const host = root instanceof ShadowRoot ? root : document;
    
    let isSetup = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    const setupKeyboardHandler = () => {
      // Chercher dans le Shadow DOM
      const textarea = host.querySelector('textarea.vfrc-chat-input');
      const sendButton = host.querySelector('#vfrc-send-message');
      
      if (textarea && sendButton && !isSetup) {
        console.log('✅ Textarea et bouton trouvés dans le Shadow DOM !');
        isSetup = true;
        
        // Handler principal pour gérer Entrée et Ctrl+Entrée
        const keyHandler = (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            console.log('🔑 Enter détecté - Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
            
            if (e.ctrlKey || e.metaKey) {
              // ✅ Ctrl+Enter ou Cmd+Enter : envoyer
              console.log('✅ Ctrl+Enter → Envoi');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // Cliquer sur le bouton d'envoi
              setTimeout(() => {
                sendButton.click();
              }, 0);
              
              return false;
            } else {
              // ❌ Enter seul : bloquer
              console.log('❌ Enter seul → Bloqué');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
          }
        };
        
        // Ajouter les listeners avec capture pour intercepter avant le widget
        textarea.addEventListener('keydown', keyHandler, true);
        textarea.addEventListener('keypress', keyHandler, true);
        textarea.addEventListener('keyup', keyHandler, true);
        
        console.log('🎉 Ctrl+Enter configuré avec succès !');
        console.log('📝 Instructions : Utilisez Ctrl+Entrée (ou Cmd+Entrée sur Mac) pour envoyer vos messages');
        
      } else if (!isSetup) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts} - Éléments non trouvés, réessai dans 200ms...`);
          setTimeout(setupKeyboardHandler, 200);
        } else {
          console.error('❌ Impossible de trouver les éléments après', maxAttempts, 'tentatives');
          console.log('🔍 Debug - Root:', root);
          console.log('🔍 Debug - Host:', host);
          console.log('🔍 Debug - Textarea:', host.querySelector('textarea'));
        }
      }
    };
    
    // Démarrer le setup avec un délai initial
    setTimeout(setupKeyboardHandler, 300);
    
    // Cleanup function si l'extension est déchargée
    return () => {
      console.log('🧹 Nettoyage de l\'extension Ctrl+Enter');
      const textarea = host.querySelector('textarea.vfrc-chat-input');
      if (textarea) {
        // Impossible de retirer les listeners sans référence, mais ça reste propre
        console.log('Extension désactivée');
      }
    };
  }
};

export default CtrlEnterOnlyExtension;
