<!-- Conteneur utilisé UNIQUEMENT en mode 'embedded' -->
<div id="voiceflow-chat-container"
     style="width:80%; max-width:780px; height:90vh; margin:0 auto; display:block;"></div>

<script type="module">
  import { FormExtension } from 'https://corentinhualpa.github.io/vf-extensions/formExtension.js';
  import { UploadToN8nWithLoader } from 'https://corentinhualpa.github.io/vf-extensions/UploadToN8nWithLoader.js';
  
  const MODE = 'embedded';
  const PERSISTENCE = 'memory';

  (function(d, t) {
    const v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    v.onload = function() {
      const container = document.getElementById('voiceflow-chat-container');
      const config = {
        verify: { projectID: '68f0bdc4a01f6758e03c369e' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production',
        autostart: true,
        assistant: { 
          type: 'chat', 
          persistence: PERSISTENCE, 
          extensions: [
            // ❌ PLUS d'extension Ctrl+Enter ici !
            FormExtension, 
            UploadToN8nWithLoader 
          ] 
        },
        render: { mode: 'embedded', target: container }
      };
      window.voiceflow.chat.load(config);
      
      // ✅ Configuration Ctrl+Enter APRÈS le chargement complet
      // Attendre que tout soit bien chargé
      setTimeout(() => {
        installCtrlEnterHandler();
      }, 2000);
    };
    v.src = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
    v.type = 'text/javascript';
    s.parentNode.insertBefore(v, s);
  })(document, 'script');
  
  // ✅ Fonction d'installation du handler Ctrl+Enter
  function installCtrlEnterHandler() {
    if (window.__ctrlEnterInstalled__) {
      console.log('⚠️ Ctrl+Enter déjà installé');
      return;
    }
    
    console.log('🔧 Installation du handler Ctrl+Enter...');
    
    // Fonction pour trouver le Shadow DOM
    function findShadowRoot() {
      const container = document.getElementById('voiceflow-chat-container');
      if (!container) return null;
      
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.shadowRoot) {
          const textarea = node.shadowRoot.querySelector('textarea.vfrc-chat-input');
          if (textarea) {
            return node.shadowRoot;
          }
        }
      }
      return null;
    }
    
    let attempts = 0;
    const maxAttempts = 30;
    
    function tryInstall() {
      const shadowRoot = findShadowRoot();
      const textarea = shadowRoot?.querySelector('textarea.vfrc-chat-input');
      const sendButton = shadowRoot?.querySelector('#vfrc-send-message');
      
      if (textarea && sendButton && !textarea.__hasCtrlEnter__) {
        console.log('✅ Installation du handler sur le textarea');
        
        textarea.__hasCtrlEnter__ = true;
        window.__ctrlEnterInstalled__ = true;
        
        // Handler leger qui n'interfère pas
        textarea.addEventListener('keydown', function(e) {
          // Seulement si c'est Enter
          if (e.key !== 'Enter' && e.keyCode !== 13) return;
          
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Enter : envoyer
            e.preventDefault();
            e.stopPropagation();
            sendButton.click();
            console.log('✅ Message envoyé via Ctrl+Enter');
          } else {
            // Enter seul : nouvelle ligne
            e.preventDefault();
            e.stopPropagation();
            
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            
            this.value = value.substring(0, start) + '\n' + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            
            // Trigger resize
            this.dispatchEvent(new Event('input', { bubbles: true }));
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
            
            console.log('↩️ Nouvelle ligne ajoutée');
          }
        }, false); // ✅ IMPORTANT: false = pas de capture
        
        console.log('🎉 Ctrl+Enter configuré !');
        console.log('📝 Enter = Nouvelle ligne | Ctrl+Enter = Envoyer');
        
      } else if (!window.__ctrlEnterInstalled__ && attempts < maxAttempts) {
        attempts++;
        console.log(`⏳ Tentative ${attempts}/${maxAttempts}...`);
        setTimeout(tryInstall, 300);
      }
    }
    
    tryInstall();
  }
</script>

<style>
/* Responsive (facultatif) */
@media (max-width:1024px){ #voiceflow-chat-container{ width:90% !important; } }
@media (max-width:640px){  #voiceflow-chat-container{ width:100% !important; height:80vh; } }
</style>
