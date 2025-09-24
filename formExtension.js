export const FormExtension = {
  name: 'Forms',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_form' || trace.payload?.name === 'ext_form',

  render: ({ trace, element }) => {
    // 1) Supprimer les marges/paddings de la "bulle" et optimiser l'espace 
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
      .vfrc-message--extension-Forms,
      .vfrc-message--extension-Forms .vfrc-bubble {
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      /* Styles pour assurer que le widget prend toute la largeur disponible */
      .vfrc-message--extension-Forms .vfrc-bubble-content {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
      
      /* Forcer le contenu à prendre toute la largeur */
      .vfrc-message--extension-Forms .vfrc-message-content {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      /* Supprimer les marges internes excessives */
      .vfrc-message.vfrc-message--extension-Forms {
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
    document.head.appendChild(globalStyle);

    // 2) Récupération des infos du payload
    const fields = trace.payload?.fields || [];
    const formTitle = trace.payload?.formTitle || 'Vos coordonnées';
    const confidentialityText = trace.payload?.confidentialityText || '';
    const submitText = trace.payload?.submitText || 'Envoyer';
    const primaryColor = trace.payload?.primaryColor || '#2e6ee1';
    const disableChat = trace.payload?.disableChat !== false; // true par défaut
    const chatDisabledText = trace.payload?.chatDisabledText || '🚫 Veuillez remplir le formulaire';

    // Variables pour gérer l'état du formulaire
    let isSubmitted = false;

    // Récupérer le root pour accéder au chat
    const root = element.getRootNode();
    const host = root instanceof ShadowRoot ? root : document;

    // Fonctions pour gérer le chat (inspirées de ValueSlider)
    function disableChatFunction() {
      // Ne pas désactiver si déjà soumis
      if (isSubmitted) return;
      
      const ic = host.querySelector('.vfrc-input-container');
      if (!ic) return;
      ic.style.opacity = '.5';
      ic.style.cursor = 'not-allowed';
      ic.setAttribute('title', chatDisabledText);
      const ta = ic.querySelector('textarea.vfrc-chat-input');
      if (ta) { 
        ta.disabled = true; 
        ta.setAttribute('title', chatDisabledText); 
      }
      const snd = host.querySelector('#vfrc-send-message');
      if (snd) { 
        snd.disabled = true; 
        snd.setAttribute('title', chatDisabledText); 
      }
    }
    
    function enableChatFunction() {
      // Marquer comme soumis pour éviter une désactivation future
      isSubmitted = true;
      
      const ic = host.querySelector('.vfrc-input-container');
      if (!ic) return;
      
      // Force réinitialisation complète des styles
      ic.style.removeProperty('opacity');
      ic.style.removeProperty('cursor');
      ic.removeAttribute('title');
      
      const ta = ic.querySelector('textarea.vfrc-chat-input');
      if (ta) { 
        ta.disabled = false; 
        ta.removeAttribute('title');
        // Assure-toi que le textarea est prêt à recevoir la saisie
        ta.style.pointerEvents = 'auto';
      }
      
      const snd = host.querySelector('#vfrc-send-message');
      if (snd) { 
        snd.disabled = false;
        snd.removeAttribute('title');
        // Assure-toi que le bouton est prêt à être cliqué
        snd.style.pointerEvents = 'auto';
      }
      
      // S'assurer que tous les contrôles sont vraiment activés
      setTimeout(() => {
        if (ta) ta.disabled = false;
        if (snd) snd.disabled = false;
        // Vérifier aussi si d'autres éléments du chat sont désactivés
        const chatElements = host.querySelectorAll('.vfrc-chat-input, #vfrc-send-message, .vfrc-input-container *');
        chatElements.forEach(elem => {
          if (elem) {
            elem.disabled = false;
            elem.style.pointerEvents = 'auto';
          }
        });
      }, 100);
    }

    // Désactiver le chat si le paramètre est activé
    if (disableChat) {
      disableChatFunction();
    }

    // 3) Dégradé
    function shadeColor(color, percent) {
      const R = parseInt(color.substring(1, 3), 16);
      const G = parseInt(color.substring(3, 5), 16);
      const B = parseInt(color.substring(5, 7), 16);
      const r = Math.min(255, Math.floor(R * (100 + percent) / 100));
      const g = Math.min(255, Math.floor(G * (100 + percent) / 100));
      const b = Math.min(255, Math.floor(B * (100 + percent) / 100));
      return `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    const lighterColor = shadeColor(primaryColor, 15);

    // 4) Construction du conteneur avec une largeur à 100%
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.boxSizing = 'border-box';
    container.innerHTML = `
      <style>
        .form-card {
          width: 100%;
          max-width: 100%;
          margin: 0;
          background-color: #ffffff;
          border-radius: 0;
          padding: 15px;
          box-sizing: border-box;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
        }
        .form-card h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.2em;
          font-weight: 600;
          color: ${primaryColor};
          width: 100%;
        }
        .form-group {
          margin-bottom: 15px;
          width: 100%;
        }
        .form-group label {
          display: block;
          font-size: 0.85em;
          color: #666;
          margin-bottom: 5px;
          width: 100%;
        }
        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="tel"] {
          width: 100%;
          padding: 10px;
          font-size: 0.9em;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input[type="text"]:focus,
        .form-group input[type="email"]:focus,
        .form-group input[type="tel"]:focus {
          border-color: ${primaryColor};
        }
        .form-group input.invalid {
          border-color: red;
        }
        .submit-btn {
          display: block;
          width: 100%;
          padding: 12px 0;
          border-radius: 4px;
          border: none;
          background: linear-gradient(to right, ${primaryColor}, ${lighterColor});
          color: #fff;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .submit-btn:hover {
          background: linear-gradient(to right, ${lighterColor}, ${primaryColor});
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .form-footer {
          margin-top: 10px;
          font-size: 0.8em;
          color: #999;
          text-align: center;
          width: 100%;
        }
        /* État désactivé après soumission */
        .form-card.submitted {
          opacity: 0.7;
          pointer-events: none;
        }
      </style>
      <div class="form-card">
        <h2 id="form-title"></h2>
        <form id="dynamic-form"></form>
        <div class="form-footer" id="form-footer"></div>
      </div>
    `;

    // 5) Remplir le titre et le footer
    const formCard = container.querySelector('.form-card');
    const formElement = formCard.querySelector('#dynamic-form');
    const titleElement = formCard.querySelector('#form-title');
    const footerElement = formCard.querySelector('#form-footer');
    titleElement.textContent = formTitle;
    if (!confidentialityText.trim()) {
      footerElement.style.display = 'none';
    } else {
      footerElement.textContent = confidentialityText;
    }

    // 6) Génération des champs
    fields.forEach((field) => {
      const formGroup = document.createElement('div');
      formGroup.classList.add('form-group');

      const label = document.createElement('label');
      label.setAttribute('for', field.name);
      label.textContent = field.label;

      const input = document.createElement('input');
      input.setAttribute('name', field.name);
      input.setAttribute('type', field.type || 'text');
      if (field.required) input.required = true;
      if (field.pattern) input.pattern = field.pattern;

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      formElement.appendChild(formGroup);
    });

    // 7) Bouton Submit
    const submitBtn = document.createElement('button');
    submitBtn.textContent = submitText;
    submitBtn.classList.add('submit-btn');
    formElement.appendChild(submitBtn);

    // 8) Écouteur
    formElement.addEventListener('submit', function (event) {
      event.preventDefault();
      const formData = {};
      let hasError = false;
      
      fields.forEach((field) => {
        const input = formElement.querySelector(`input[name="${field.name}"]`);
        if (!input.checkValidity()) {
          input.classList.add('invalid');
          hasError = true;
        } else {
          input.classList.remove('invalid');
        }
        formData[field.name] = input.value;
      });
      
      if (hasError || !formElement.checkValidity()) return;
      
      // Désactiver le formulaire
      formCard.classList.add('submitted');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoyé ✓';
      
      // Réactiver le chat si il était désactivé
      if (disableChat) {
        enableChatFunction();
      }
      
      // Attendre un court moment pour s'assurer que le chat est bien réactivé
      setTimeout(() => {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: formData,
        });
        
        // S'assurer à nouveau que le chat est réactivé après l'envoi
        if (disableChat) {
          setTimeout(enableChatFunction, 300);
        }
      }, 100);
    });

    // 9) Ajout au DOM et forçage de la largeur
    element.style.width = '100%';
    element.style.maxWidth = '100%';
    element.appendChild(container);
    
    // 10) Ajout d'un script pour forcer la largeur après le rendu
    setTimeout(() => {
      const messageElement = element.closest('.vfrc-message');
      if (messageElement) {
        messageElement.style.width = '100%';
        messageElement.style.maxWidth = '100%';
        
        const bubbleContent = messageElement.querySelector('.vfrc-bubble-content');
        if (bubbleContent) {
          bubbleContent.style.width = '100%';
          bubbleContent.style.maxWidth = '100%';
        }
      }
    }, 0);
  },
};
