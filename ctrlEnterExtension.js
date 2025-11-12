/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  CtrlEnterExtension v2 – Voiceflow Keyboard Handler      ║
 *  ║                                                           ║
 *  ║  • Entrée seule = Retour à la ligne                      ║
 *  ║  • Ctrl+Entrée (ou Cmd+Entrée) = Envoi du message       ║
 *  ║  • Détecte TOUS les boutons/liens Voiceflow              ║
 *  ║  • N'interfère PAS avec les boutons interactifs          ║
 *  ║                                                           ║
 *  ║  Usage:                                                   ║
 *  ║  import { installCtrlEnter } from './ctrlEnterExtension.js'; ║
 *  ║  // Après window.voiceflow.chat.load(config):            ║
 *  ║  setTimeout(() => installCtrlEnter(), 2000);             ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export function installCtrlEnter() {
  if (window.__ctrlEnterInstalled__) {
    console.log('⚠️ Ctrl+Enter déjà installé');
    return;
  }
  
  console.log('🔧 Installation du handler Ctrl+Enter v2...');
  
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
    
    // Fonction récursive pour explorer l'arbre DOM
    function searchInElement(element) {
      // Vérifier si cet élément a un shadowRoot
      if (element.shadowRoot) {
        console.log('✅ Shadow root trouvé sur', element.tagName);
        const textarea = element.shadowRoot.querySelector('textarea.vfrc-chat-input');
        const sendButton = element.shadowRoot.querySelector('#vfrc-send-message');
        
        if (textarea && sendButton) {
          console.log('✅✅ Textarea ET bouton d\'envoi trouvés !');
          return { textarea, sendButton, shadowRoot: element.shadowRoot };
        }
      }
      
      // Chercher récursivement dans les enfants
      for (let child of element.children) {
        const result = searchInElement(child);
        if (result) return result;
      }
      
      return null;
    }
    
    return searchInElement(container);
  }
  
  /**
   * ✅ Détecte si des éléments interactifs Voiceflow sont visibles
   * (boutons, liens cliquables, etc.)
   */
  function hasVisibleInteractiveElements(shadowRoot) {
    // Liste des sélecteurs pour tous les éléments interactifs Voiceflow
    const selectors = [
      'button[type="button"]:not(#vfrc-send-message)', // Boutons standards
      'a[href]', // Liens cliquables (comme "Accéder au dossier")
      '[role="button"]', // Éléments avec rôle button
      '.vfrc-button', // Classe bouton Voiceflow
      '[data-testid*="button"]', // Boutons avec data-testid
      '.vfrc-card button', // Boutons dans les cartes
      '.vfrc-carousel button', // Boutons dans les carousels
    ];
    
    for (const selector of selectors) {
      try {
        const elements = shadowRoot.querySelectorAll(selector);
        
        // Vérifier si au moins un élément est visible
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          // Élément visible si :
          // - display !== 'none'
          // - visibility !== 'hidden'
          // - opacity > 0
          // - a une taille > 0
          const isVisible = 
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            parseFloat(style.opacity) > 0 &&
            rect.width > 0 &&
            rect.height > 0;
          
          if (isVisible) {
            console.log('🔘 Élément interactif détecté:', selector, el);
            return true;
          }
        }
      } catch (e) {
        // Ignorer les erreurs de sélection
      }
    }
    
    return false;
  }
  
  let attempts = 0;
  const maxAttempts = 40;
  
  function tryInstall() {
    const result = findTextarea();
    
    if (result && !result.textarea.__hasCtrlEnter__) {
      const { textarea, sendButton, shadowRoot } = result;
      
      console.log('✅ Installation du keyboard handler v2...');
      
      textarea.__hasCtrlEnter__ = true;
      window.__ctrlEnterInstalled__ = true;
      
      /**
       * Handler principal pour gérer Enter et Ctrl+Enter
       */
      textarea.addEventListener('keydown', function(e) {
        // Ne traiter que la touche Enter
        if (e.key !== 'Enter' && e.keyCode !== 13) return;
        
        // ✅ VÉRIFIER D'ABORD s'il y a des éléments interactifs visibles
        if (hasVisibleInteractiveElements(shadowRoot)) {
          console.log('🔘 Éléments interactifs présents → Laisser Voiceflow gérer Enter');
          // Ne rien faire, laisser Voiceflow gérer l'événement normalement
          return;
        }
        
        // Pas d'éléments interactifs → Appliquer notre logique
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Enter ou Cmd+Enter : Envoyer le message
          console.log('✅ Ctrl+Enter → Envoi du message');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setTimeout(() => sendButton.click(), 10);
          
        } else {
          // Enter seul : Retour à la ligne
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
      }, true); // Capture phase = intercepte AVANT Voiceflow
      
      console.log('🎉 Ctrl+Enter v2 configuré avec succès !');
      console.log('📝 Enter = Retour à la ligne | Ctrl+Enter (Cmd+Enter) = Envoyer');
      console.log('🔘 Détection automatique des boutons Voiceflow activée');
      
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
