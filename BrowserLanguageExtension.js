<!-- Conteneur utilisé en mode 'embedded' -->
<div id="voiceflow-chat-container"></div>

<style>
  /* Zone d'embed desktop + scrollbar */
  #voiceflow-chat-container {
    width: 100%;
    height: 80vh;
    overflow-y: auto;
  }
  
  /* Effet glow autour du bouton (mobile) */
  @keyframes glowPulse {
    0% { box-shadow: 0 0 5px 0px rgba(46, 42, 102, 0.7); }
    50% { box-shadow: 0 0 20px 5px rgba(46, 42, 102, 0.7); }
    100% { box-shadow: 0 0 5px 0px rgba(46, 42, 102, 0.7); }
  }
  
  .vf-glow-effect {
    position: fixed; 
    width: 64px; 
    height: 64px; 
    border-radius: 50%;
    pointer-events: none; 
    z-index: 899; 
    animation: glowPulse 2s infinite ease-in-out;
  }
  
  /* Cacher le conteneur sur mobile */
  @media (max-width: 768px) {
    #voiceflow-chat-container { 
      width: 0 !important; 
      height: 0 !important; 
      overflow: hidden !important; 
    }
  }
</style>

<script type="module">
  // === Imports extensions ===
  import { BrowserLanguageExtension } from 'https://corentinhualpa.github.io/vf-extensions/BrowserLanguageExtension.js';
  import { CalendlyExtension }        from 'https://corentinhualpa.github.io/vf-extensions/calendly.js';
  import { CarouselExtension }        from 'https://corentinhualpa.github.io/vf-extensions/CarouselExtension.js';

  // === MODE & PERSISTENCE ===
  const MODE = 'embedded';
  const PERSISTENCE = 'sessionStorage';
  const enableGlow = true;

  // === TRADUCTIONS (FR par défaut, EN pour tout le reste) ===
  const translations = {
    fr: {
      headerTitle: 'Les Secrets du Siam',
      bannerTitle: 'Bienvenue chez Les Secrets du Siam !',
      bannerDescription: 'Envie d\'évasion en terre thaïe ? Je suis là pour vous aider 😎',
      inputPlaceholder: 'Écrivez votre message ici...',
      launcherMessage: 'Une question ? Je suis là pour vous aider 😎'
    },
    en: {
      headerTitle: 'The Secrets of Siam',
      bannerTitle: 'Welcome to The Secrets of Siam!',
      bannerDescription: 'Want to escape to Thailand? I\'m here to help you 😎',
      inputPlaceholder: 'Type your message here...',
      launcherMessage: 'Got a question? I\'m here to help 😎'
    }
  };

  // Fonction pour obtenir les textes (FR ou EN seulement)
  function getTexts(lang) {
    const primaryLang = lang ? lang.split('-')[0].toLowerCase() : 'fr';
    return primaryLang === 'fr' ? translations.fr : translations.en;
  }

  // ✅ ATTENDRE QUE LE DOM SOIT COMPLÈTEMENT CHARGÉ
  function waitForContainer(maxAttempts = 50) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkContainer = () => {
        attempts++;
        const container = document.getElementById('voiceflow-chat-container');
        
        if (container && container instanceof HTMLElement) {
          console.log('✅ Conteneur prêt après', attempts * 50, 'ms');
          resolve(container);
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Conteneur non trouvé après ' + (maxAttempts * 50) + 'ms'));
          return;
        }
        
        setTimeout(checkContainer, 50);
      };
      
      checkContainer();
    });
  }

  // === Charge le script du widget ===
  (function(d, t) {
    const v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    v.onload = initVF;
    v.src  = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
    v.type = 'text/javascript';
    s.parentNode.insertBefore(v, s);
  })(document, 'script');

  async function initVF() {
    try {
      // ✅ Attendre que le conteneur existe
      const container = await waitForContainer();
      
      // Détecter la langue du navigateur
      const browserLang = navigator.language || 'fr';
      const texts = getTexts(browserLang);
      const langCode = browserLang.split('-')[0].toLowerCase();
      
      console.log('🌍 Langue initiale:', browserLang, '→', langCode === 'fr' ? 'FR' : 'EN');
      
      // Définir l'attribut data-vf-lang sur body pour le CSS
      document.body.setAttribute('data-vf-lang', langCode === 'fr' ? 'fr' : 'en');

      // 🎨 Injection du CSS personnalisé
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://evolution-agency.fr/wp-content/uploads/custom-css-js/voiceflow-custom.css';
      document.head.appendChild(link);

      // Config commune avec textes selon la langue
      const config = {
        verify:    { projectID: '68d256a45d05696b2441f2dc' },
        url:       'https://general-runtime.voiceflow.com',
        versionID: 'production',
        autostart: true,
        
        assistant: {
          type: 'chat',
          persistence: PERSISTENCE,
          extensions: [BrowserLanguageExtension, CalendlyExtension, CarouselExtension],
          header: { title: texts.headerTitle, hideImage: false },
          banner: { hide: false, title: texts.bannerTitle, description: texts.bannerDescription },
          inputPlaceholder: texts.inputPlaceholder,
          avatar: { hide: false }
        }
      };

      // Switch des 3 modes
      if (MODE === 'embedded') {
        config.render = { mode: 'embedded', target: container };
      } else if (MODE === 'overlay') {
        config.render = { mode: 'overlay' };
      } else if (MODE === 'popover') {
        config.assistant.renderMode = 'popover';
      }

      // 🚀 Chargement du widget
      await window.voiceflow.chat.load(config);
      console.log('✅ Widget Voiceflow chargé avec succès');
      
      // ✅ TRADUCTION DU SPLASH SCREEN VIA JAVASCRIPT
      setTimeout(() => {
        const container = document.querySelector('#voiceflow-chat-container');
        if (!container) return;
        
        const shadowRoot = container.shadowRoot;
        if (!shadowRoot) return;
        
        const langCode = document.body.getAttribute('data-vf-lang') || 'fr';
        
        if (langCode === 'en') {
          // Traduire le titre
          const title = shadowRoot.querySelector('._19yxzl22');
          if (title) title.textContent = '⚠️ Important';
          
          // Traduire la description
          const desc = shadowRoot.querySelector('._19yxzl23');
          if (desc) desc.textContent = 'This is a demonstration chatbot designed for travel professionals to test the capabilities of AI Agents developed by our company. This chatbot is a duplicate of the chatbot we developed for our partner: Les Secrets du Siam (travel agency for Thailand)';
          
          // Traduire le bouton "Commencez"
          const btnStart = shadowRoot.querySelector('[class*="19yxzl24"]');
          if (btnStart) btnStart.textContent = '🚀 Start the demo';
          
          // Traduire le bouton "Prendre rendez-vous"
          const btnAppt = shadowRoot.querySelector('._19yxzl28._19yxzl29');
          if (btnAppt) btnAppt.textContent = '📆 Book an appointment';
          
          console.log('✅ Splash screen traduit en EN');
        }
      }, 800);

      // === MISE À JOUR APRÈS DÉTECTION DE LANGUE PAR L'EXTENSION ===
      if (window.voiceflow?.chat?.on) {
        window.voiceflow.chat.on('trace', (trace) => {
          if (trace?.type === 'complete' && trace?.payload?.browserLanguage) {
            const detectedLang = trace.payload.browserLanguage || trace.payload.primaryLanguage;
            const newLangCode = detectedLang.split('-')[0].toLowerCase();
            const newTexts = getTexts(detectedLang);
            
            console.log('🌐 Langue détectée par extension:', detectedLang, '→', newLangCode === 'fr' ? 'FR' : 'EN');
            
            // Mettre à jour l'attribut pour le CSS
            document.body.setAttribute('data-vf-lang', newLangCode === 'fr' ? 'fr' : 'en');
            
            // Mettre à jour les textes du widget
            if (window.voiceflow?.chat?.update) {
              window.voiceflow.chat.update({
                assistant: {
                  header: { title: newTexts.headerTitle },
                  banner: { title: newTexts.bannerTitle, description: newTexts.bannerDescription },
                  inputPlaceholder: newTexts.inputPlaceholder
                }
              });
              console.log('✅ Textes du widget mis à jour');
            }
            
            // Mettre à jour le title du bouton launcher (si mode popover)
            setTimeout(() => {
              const button = document.querySelector('button.vfrc-launcher');
              if (button) {
                button.setAttribute('title', newTexts.launcherMessage);
              }
            }, 100);
          }
        });
      }

      // === SURVEILLANCE POUR METTRE À JOUR LE TITLE (mode popover) ===
      const observer = new MutationObserver(() => {
        const button = document.querySelector('button.vfrc-launcher');
        if (button) {
          const currentLang = document.body.getAttribute('data-vf-lang') || 'fr';
          const currentTexts = getTexts(currentLang === 'fr' ? 'fr' : 'en');
          if (button.getAttribute('title') !== currentTexts.launcherMessage) {
            button.setAttribute('title', currentTexts.launcherMessage);
          }
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title']
      });

      // Gestion spécifique du mode popover
      if (MODE === 'popover') {
        const openWhenReady = () => setTimeout(() => {
          if (window.voiceflow?.chat?.open) {
            window.voiceflow.chat.open();
            console.log('✅ Popover ouvert');
          }
        }, 300);
        
        if (window.voiceflow?.chat?.on) {
          window.voiceflow.chat.on('ready', openWhenReady);
        } else {
          openWhenReady();
        }
        
        // Effet glow sur le bouton
        if (enableGlow) {
          setTimeout(() => {
            const btn = document.querySelector('button[aria-label="Open Voiceflow widget"]');
            if (!btn) return;
            const r = btn.getBoundingClientRect();
            const glow = document.createElement('div');
            glow.className = 'vf-glow-effect';
            glow.style.bottom = (window.innerHeight - r.bottom) + 'px';
            glow.style.right  = (window.innerWidth - r.right) + 'px';
            document.body.appendChild(glow);
            console.log('✨ Effet glow activé');
          }, 1500);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur initialisation widget:', error);
    }
  }

  // === Fonction de test pour changer la langue ===
  window.switchLang = (lang) => {
    document.body.setAttribute('data-vf-lang', lang);
    const texts = translations[lang] || translations.en;
    console.log(`🌐 Langue changée en: ${lang.toUpperCase()}`);
    console.log('💡 Rechargez la page pour voir l\'effet complet');
  };
  
  console.log('💡 Tapez switchLang("en") ou switchLang("fr") puis rechargez pour tester');
</script>
