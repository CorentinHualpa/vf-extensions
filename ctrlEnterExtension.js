/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CtrlEnterExtension v4 – FIXED                           ║
 *  ║                                                           ║
 *  ║  • Entrée seule = Retour à la ligne (TOUJOURS)           ║
 *  ║  • Ctrl+Entrée ou Shift+Entrée = Envoi du message       ║
 *  ║  • Plus de détection des boutons qui bloquait tout       ║
 *  ║                                                           ║
 *  ║  Usage:                                                   ║
 *  ║  import { installCtrlEnter } from './ctrlEnterExtension.js'; ║
 *  ║  setTimeout(() => installCtrlEnter(), 2000);             ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export function installCtrlEnter() {
  if (window.__ctrlEnterInstalled__) {
    console.log('⚠️ Ctrl+Enter déjà installé');
    return;
  }
  
  console.log('🔧 Installation du handler Ctrl+Enter v4 (FIXED)...');
  
  /**
   * Recherche récursive du textarea dans le Shadow DOM
   */
  function findTextarea() {
    console.log('🔍 Recherche du textarea dans le Shadow DOM...');
    
    const container = document.getElementById('voiceflow-chat-container');
    if (!container) {
      console.log('❌ Container Voiceflow non trouvé');
      return null;
    }
    
    function searchInElement(element) {
      if (element.shadowRoot) {
        console.log('✅ Shadow root trouvé sur', element.tagName);
        const textarea = element.shadowRoot.querySelector('textarea.vfrc-chat-input');
        const sendButton = element.shadowRoot.querySelector('#vfrc-send-message');
        
        if (textarea && sendButton) {
          console.log('✅✅ Textarea ET bouton d\'envoi trouvés !');
          return { textarea, sendButton, shadowRoot: element.shadowRoot };
        }
      }
      
      for (let child of element.children) {
        const result = searchInElement(child);
        if (result) return result;
      }
      
      return null;
    }
    
    return searchInElement(container);
  }
  
  let attempts = 0;
  const maxAttempts = 40;
  
  function tryInstall() {
    const result = findTextarea();
    
    if (result && !result.textarea.__hasCtrlEnter__) {
      const { textarea, sendButton, shadowRoot } = result;
      
      console.log('✅ Installation du keyboard handler v4...');
      
      textarea.__hasCtrlEnter__ = true;
      window.__ctrlEnterInstalled__ = true;
      
      /**
       * ✅ Handler simplifié : TOUJOURS appliquer la logique custom
       * - Enter seul = Nouvelle ligne
       * - Ctrl+Enter ou Shift+Enter = Envoyer
       */
      function handleKeydown(e) {
        // Ne traiter que la touche Enter
        if (e.key !== 'Enter' && e.keyCode !== 13) return;
        
        // ✅ LOGIQUE SIMPLIFIÉE : Pas de détection des boutons
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          // Ctrl+Enter, Cmd+Enter ou Shift+Enter : Envoyer le message
          console.log('✅ Ctrl/Shift+Enter → Envoi du message');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Envoyer le message si le textarea n'est pas vide
          const message = textarea.value.trim();
          if (message) {
            setTimeout(() => sendButton.click(), 10);
          }
          
        } else {
          // Enter seul : TOUJOURS insérer un retour à la ligne
          console.log('↩️ Enter → Retour à la ligne');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Insérer le retour à la ligne à la position du curseur
          const start = this.selectionStart;
          const end = this.selectionEnd;
          const value = this.value;
          
          this.value = value.substring(0, start) + '\n' + value.substring(end);
          this.selectionStart = this.selectionEnd = start + 1;
          
          // Déclencher l'événement input pour la mise à jour
          this.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Redimensionner le textarea
          this.style.height = 'auto';
          this.style.height = this.scrollHeight + 'px';
        }
      }
      
      // Attacher l'event listener en capture phase pour intercepter avant Voiceflow
      textarea.addEventListener('keydown', handleKeydown, true);
      
      // ✅ Observer les changements DOM pour réactiver au besoin
      const observer = new MutationObserver(() => {
        if (!textarea.isConnected) {
          console.log('🔄 Textarea déconnecté, tentative de réinstallation...');
          window.__ctrlEnterInstalled__ = false;
          setTimeout(() => installCtrlEnter(), 1000);
        }
      });
      
      observer.observe(shadowRoot, { childList: true, subtree: true });
      
      console.log('🎉 Ctrl+Enter v4 configuré avec succès !');
      console.log('📝 Enter = Retour à la ligne (TOUJOURS)');
      console.log('✉️ Ctrl+Enter ou Shift+Enter = Envoyer');
      
    } else if (!window.__ctrlEnterInstalled__ && attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Tentative ${attempts}/${maxAttempts}...`);
      setTimeout(tryInstall, 400);
      
    } else if (attempts >= maxAttempts) {
      console.error('❌ Impossible de trouver le textarea après', maxAttempts, 'tentatives');
      console.log('🔍 Debug: vérifiez que le widget Voiceflow est bien chargé');
    }
  }
  
  tryInstall();
}

// Export par défaut pour compatibilité
export default installCtrlEnter;
