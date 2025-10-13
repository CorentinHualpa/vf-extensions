export const StyledFormExtension = {
  name: 'StyledForm',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_styledForm' || trace.payload?.name === 'ext_styledForm',

  render: ({ trace, element }) => {
    // Suppression des marges/paddings de la bulle pour optimiser l'espace
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
      .vfrc-message--extension-StyledForm,
      .vfrc-message--extension-StyledForm .vfrc-bubble {
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      .vfrc-message--extension-StyledForm .vfrc-bubble-content {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
      
      .vfrc-message--extension-StyledForm .vfrc-message-content {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .vfrc-message.vfrc-message--extension-StyledForm {
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
    document.head.appendChild(globalStyle);

    // Récupération des paramètres du payload
    const {
      fields = [],
      formTitle = 'Formulaire',
      formDescription = '',
      submitText = 'Envoyer',
      primaryColor = '#6366f1',
      secondaryColor = '#8b5cf6',
      successMessage = '✓ Formulaire envoyé avec succès',
      errorMessage = '⚠ Veuillez remplir tous les champs obligatoires',
      animation = 'fade', // 'fade', 'slide', 'scale'
      theme = 'modern' // 'modern', 'minimal', 'elegant', 'glassmorphism'
    } = trace.payload || {};

    // Fonction pour générer un dégradé
    function createGradient(color1, color2) {
      return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
    }

    // Fonction pour éclaircir une couleur
    function lightenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      ).toString(16).slice(1);
    }

    // Création du conteneur principal
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.boxSizing = 'border-box';

    // Styles CSS selon le thème
    const themeStyles = {
      modern: `
        .styled-form-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .form-header {
          background: ${createGradient(primaryColor, secondaryColor)};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `,
      minimal: `
        .styled-form-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        .form-header {
          color: ${primaryColor};
        }
      `,
      elegant: `
        .styled-form-card {
          background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .form-header {
          background: ${createGradient(primaryColor, secondaryColor)};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `,
      glassmorphism: `
        .styled-form-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .form-header {
          color: ${primaryColor};
        }
      `
    };

    // Animations CSS
    const animationStyles = {
      fade: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .styled-form-card {
          animation: fadeIn 0.5s ease-in-out;
        }
      `,
      slide: `
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .styled-form-card {
          animation: slideUp 0.5s ease-out;
        }
      `,
      scale: `
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .styled-form-card {
          animation: scaleIn 0.4s ease-out;
        }
      `
    };

    container.innerHTML = `
      <style>
        ${themeStyles[theme] || themeStyles.modern}
        ${animationStyles[animation] || animationStyles.fade}
        
        .styled-form-card {
          width: 100%;
          max-width: 100%;
          margin: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .styled-form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: ${createGradient(primaryColor, secondaryColor)};
        }
        
        .form-header {
          margin-bottom: 24px;
        }
        
        .form-title {
          font-size: 1.75em;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        
        .form-description {
          font-size: 0.95em;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        
        .form-group {
          margin-bottom: 24px;
          width: 100%;
          position: relative;
        }
        
        .form-label {
          display: block;
          font-size: 0.875em;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          transition: color 0.2s ease;
        }
        
        .form-label.required::after {
          content: '*';
          color: ${primaryColor};
          margin-left: 4px;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 0.95em;
          color: #1f2937;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          box-sizing: border-box;
          outline: none;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        
        .form-input:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 4px ${lightenColor(primaryColor, 40)}33;
          transform: translateY(-1px);
        }
        
        .form-input:hover:not(:focus) {
          border-color: ${lightenColor(primaryColor, 20)};
        }
        
        .form-input.invalid {
          border-color: #ef4444;
          animation: shake 0.3s ease;
        }
        
        .form-input.invalid:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        textarea.form-input {
          min-height: 100px;
          resize: vertical;
        }
        
        select.form-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 20px;
          padding-right: 40px;
        }
        
        .error-message {
          font-size: 0.8em;
          color: #ef4444;
          margin-top: 6px;
          display: none;
          animation: fadeIn 0.2s ease;
        }
        
        .error-message.show {
          display: block;
        }
        
        .submit-btn {
          display: block;
          width: 100%;
          padding: 14px 24px;
          font-size: 1em;
          font-weight: 600;
          color: #ffffff;
          background: ${createGradient(primaryColor, secondaryColor)};
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px ${primaryColor}40;
          position: relative;
          overflow: hidden;
        }
        
        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }
        
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${primaryColor}60;
        }
        
        .submit-btn:hover::before {
          left: 100%;
        }
        
        .submit-btn:active {
          transform: translateY(0);
        }
        
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .success-message {
          display: none;
          padding: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 10px;
          text-align: center;
          font-weight: 600;
          animation: slideUp 0.4s ease-out;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .success-message.show {
          display: block;
        }
        
        .form-alert {
          display: none;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #991b1b;
          font-size: 0.875em;
          margin-bottom: 20px;
          animation: slideUp 0.3s ease-out;
        }
        
        .form-alert.show {
          display: block;
        }
        
        .input-icon {
          position: absolute;
          right: 12px;
          top: 38px;
          color: #9ca3af;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        
        .form-input:focus ~ .input-icon {
          color: ${primaryColor};
        }
        
        /* Responsive */
        @media (max-width: 480px) {
          .styled-form-card {
            padding: 20px;
          }
          
          .form-title {
            font-size: 1.5em;
          }
        }
      </style>
      
      <div class="styled-form-card">
        <div class="form-header">
          <h2 class="form-title">${formTitle}</h2>
          ${formDescription ? `<p class="form-description">${formDescription}</p>` : ''}
        </div>
        
        <div class="form-alert" id="form-alert">${errorMessage}</div>
        
        <form id="styled-form" novalidate>
          <!-- Les champs seront générés dynamiquement -->
        </form>
        
        <div class="success-message" id="success-message">${successMessage}</div>
      </div>
    `;

    const formElement = container.querySelector('#styled-form');
    const alertElement = container.querySelector('#form-alert');
    const successElement = container.querySelector('#success-message');

    // Génération dynamique des champs
    fields.forEach((field, index) => {
      const formGroup = document.createElement('div');
      formGroup.classList.add('form-group');

      const label = document.createElement('label');
      label.classList.add('form-label');
      if (field.required) {
        label.classList.add('required');
      }
      label.setAttribute('for', `field-${index}`);
      label.textContent = field.label || field.name;

      let input;
      
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
      } else if (field.type === 'select') {
        input = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = field.placeholder || 'Sélectionnez une option';
        input.appendChild(defaultOption);
        
        (field.options || []).forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value || option;
          optionElement.textContent = option.label || option;
          input.appendChild(optionElement);
        });
      } else {
        input = document.createElement('input');
        input.setAttribute('type', field.type || 'text');
      }

      input.classList.add('form-input');
      input.setAttribute('id', `field-${index}`);
      input.setAttribute('name', field.name);
      
      if (field.placeholder) {
        input.setAttribute('placeholder', field.placeholder);
      }
      
      if (field.required) {
        input.required = true;
      }
      
      if (field.pattern) {
        input.pattern = field.pattern;
      }
      
      if (field.minLength) {
        input.minLength = field.minLength;
      }
      
      if (field.maxLength) {
        input.maxLength = field.maxLength;
      }

      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      errorMessage.textContent = field.errorMessage || 'Ce champ est invalide';

      // Validation en temps réel
      input.addEventListener('input', function() {
        if (this.checkValidity()) {
          this.classList.remove('invalid');
          errorMessage.classList.remove('show');
        }
      });

      input.addEventListener('blur', function() {
        if (!this.checkValidity() && this.value) {
          this.classList.add('invalid');
          errorMessage.classList.add('show');
        }
      });

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      formGroup.appendChild(errorMessage);
      formElement.appendChild(formGroup);
    });

    // Bouton de soumission
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.classList.add('submit-btn');
    submitBtn.textContent = submitText;
    formElement.appendChild(submitBtn);

    // Gestion de la soumission
    formElement.addEventListener('submit', function(event) {
      event.preventDefault();
      
      let isValid = true;
      const formData = {};

      fields.forEach((field, index) => {
        const input = formElement.querySelector(`#field-${index}`);
        const errorMsg = input.parentElement.querySelector('.error-message');
        
        if (!input.checkValidity()) {
          input.classList.add('invalid');
          errorMsg.classList.add('show');
          isValid = false;
        } else {
          input.classList.remove('invalid');
          errorMsg.classList.remove('show');
        }

        formData[field.name] = input.value;
      });

      if (!isValid) {
        alertElement.classList.add('show');
        setTimeout(() => {
          alertElement.classList.remove('show');
        }, 3000);
        return;
      }

      // Désactiver le formulaire
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';

      // Simuler un délai d'envoi (pour l'animation)
      setTimeout(() => {
        formElement.style.display = 'none';
        successElement.classList.add('show');

        // Envoyer les données à Voiceflow
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: formData
        });
      }, 500);
    });

    // Ajout au DOM
    element.style.width = '100%';
    element.style.maxWidth = '100%';
    element.appendChild(container);

    // Forcer la largeur après le rendu
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
  }
};
