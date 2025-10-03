// Supprime tout le code de proactive messages en embedded
window.voiceflow.chat.load(config).then(() => {
  console.log('✅ Widget chargé');
  
  // ❌ SUPPRIMER TOUT ÇA en mode embedded :
  // window.voiceflow.chat.proactive.clear();
  // window.voiceflow.chat.proactive.push({...});
  
  // ✅ Traduction splash screen
  setTimeout(() => {
    const container = document.querySelector('#voiceflow-chat-container');
    if (!container) return;
    
    const shadowRoot = container.shadowRoot;
    if (!shadowRoot) return;
    
    const langCode = document.body.getAttribute('data-vf-lang') || 'fr';
    
    if (langCode === 'en') {
      const title = shadowRoot.querySelector('._19yxzl22');
      if (title) title.textContent = '⚠️ Important';
      
      const desc = shadowRoot.querySelector('._19yxzl23');
      if (desc) desc.textContent = 'This is a demonstration chatbot...';
      
      const btnStart = shadowRoot.querySelector('[class*="19yxzl24"]');
      if (btnStart) btnStart.textContent = '🚀 Start the demo';
      
      const btnAppt = shadowRoot.querySelector('._19yxzl28._19yxzl29');
      if (btnAppt) btnAppt.textContent = '📆 Book an appointment';
    }
  }, 1000);
});

// ✅ Listener trace simplifié
window.voiceflow?.chat?.on?.('trace', (trace) => {
  if (trace?.type === 'complete' && trace?.payload?.browserLanguage) {
    const detectedLang = trace.payload.browserLanguage || trace.payload.primaryLanguage;
    const newLangCode = detectedLang.split('-')[0].toLowerCase();
    const newTexts = getTexts(detectedLang);
    
    console.log('🌐 Langue détectée:', detectedLang);
    
    document.body.setAttribute('data-vf-lang', newLangCode === 'fr' ? 'fr' : 'en');
    
    // Mise à jour des textes uniquement
    if (window.voiceflow?.chat?.update) {
      window.voiceflow.chat.update({
        assistant: {
          header: { title: newTexts.headerTitle },
          banner: { title: newTexts.bannerTitle, description: newTexts.bannerDescription },
          inputPlaceholder: newTexts.inputPlaceholder
        }
      });
    }
  }
});
