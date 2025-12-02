/**
 *  CtrlEnterExtension v5 – CLEAN (sans retry)
 */
export function installCtrlEnter() {
  if (window.__ctrlEnterInstalled__) return;
  
  const container = document.getElementById('voiceflow-chat-container');
  if (!container) return;
  
  function searchInElement(element) {
    if (element.shadowRoot) {
      const textarea = element.shadowRoot.querySelector('textarea.vfrc-chat-input');
      const sendButton = element.shadowRoot.querySelector('#vfrc-send-message');
      if (textarea && sendButton) {
        return { textarea, sendButton, shadowRoot: element.shadowRoot };
      }
    }
    for (let child of element.children) {
      const result = searchInElement(child);
      if (result) return result;
    }
    return null;
  }
  
  const result = searchInElement(container);
  if (!result || result.textarea.__hasCtrlEnter__) return;
  
  const { textarea, sendButton } = result;
  textarea.__hasCtrlEnter__ = true;
  window.__ctrlEnterInstalled__ = true;
  
  textarea.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' && e.keyCode !== 13) return;
    
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (textarea.value.trim()) {
        setTimeout(() => sendButton.click(), 10);
      }
    } else {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '\n' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 1;
      this.dispatchEvent(new Event('input', { bubbles: true }));
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    }
  }, true);
}

export default installCtrlEnter;
