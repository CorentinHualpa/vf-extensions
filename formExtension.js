/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  Form Extension V2.0 – Dark/Light Theme Support          ║
 *  ║                                                           ║
 *  ║  • Theme dark/light configurable via payload             ║
 *  ║  • Full-width dans Voiceflow                             ║
 *  ║  • Chat disable/enable intégré                           ║
 *  ║  • Design premium avec tokens de couleur                 ║
 *  ║  • Sélecteurs préfixés #uid pour Shadow DOM              ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */
export const FormExtension = {
  name: 'Forms',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_form' || trace.payload?.name === 'ext_form',

  render: ({ trace, element }) => {
    const {
      fields = [],
      formTitle = 'Vos coordonnées',
      confidentialityText = '',
      submitText = 'Envoyer',
      primaryColor = '#FFB800',
      theme = 'light',
      disableChat = true,
      chatDisabledText = '🚫 Veuillez remplir le formulaire',
    } = trace.payload || {};

    const uid = `form_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const isDark = theme === 'dark';

    // ── Couleurs ──
    const hexToRgb = hex => {
      const n = parseInt(hex.replace('#', ''), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };
    const pc = hexToRgb(primaryColor);

    const lightenColor = (hex, pct) => {
      const { r, g, b } = hexToRgb(hex);
      const nr = Math.min(255, Math.floor(r + (255 - r) * pct));
      const ng = Math.min(255, Math.floor(g + (255 - g) * pct));
      const nb = Math.min(255, Math.floor(b + (255 - b) * pct));
      return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
    };
    const lighterColor = lightenColor(primaryColor, 0.2);

    // ── Theme tokens ──
    const T = isDark ? {
      cardBg: '#111111',
      cardBorder: '#1F1F1F',
      text: '#FFFFFF',
      textMuted: '#B0B0B0',
      labelColor: '#CCCCCC',
      inputBg: '#1A1A1A',
      inputBorder: '#333333',
      inputFocusBorder: primaryColor,
      inputText: '#FFFFFF',
      inputPlaceholder: '#666666',
      footerColor: '#888888',
      shadow: '0 16px 60px rgba(0,0,0,0.6)',
      invalidBorder: '#EF4444',
      successBg: '#1A1A1A',
      successText: '#34D399',
    } : {
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      text: '#111827',
      textMuted: '#6B7280',
      labelColor: '#555555',
      inputBg: '#FAFAFA',
      inputBorder: '#D1D5DB',
      inputFocusBorder: primaryColor,
      inputText: '#111827',
      inputPlaceholder: '#9CA3AF',
      footerColor: '#9CA3AF',
      shadow: '0 16px 60px rgba(0,0,0,0.08)',
      invalidBorder: '#EF4444',
      successBg: '#F0FDF4',
      successText: '#059669',
    };

    // ── Variables d'état ──
    let isSubmitted = false;

    // ── Chat control ──
    const rootNode = element.getRootNode();
    const host = rootNode instanceof ShadowRoot ? rootNode : document;

    function disableChatFn() {
      if (isSubmitted) return;
      const ic = host.querySelector('.vfrc-input-container');
      if (!ic) return;
      ic.style.opacity = '.5';
      ic.style.cursor = 'not-allowed';
      ic.setAttribute('title', chatDisabledText);
      const ta = ic.querySelector('textarea.vfrc-chat-input');
      if (ta) { ta.disabled = true; ta.setAttribute('title', chatDisabledText); }
      const snd = host.querySelector('#vfrc-send-message');
      if (snd) { snd.disabled = true; snd.setAttribute('title', chatDisabledText); }
    }

    function enableChatFn() {
      isSubmitted = true;
      const ic = host.querySelector('.vfrc-input-container');
      if (!ic) return;
      ic.style.removeProperty('opacity');
      ic.style.removeProperty('cursor');
      ic.removeAttribute('title');
      const ta = ic.querySelector('textarea.vfrc-chat-input');
      if (ta) { ta.disabled = false; ta.removeAttribute('title'); ta.style.pointerEvents = 'auto'; }
      const snd = host.querySelector('#vfrc-send-message');
      if (snd) { snd.disabled = false; snd.removeAttribute('title'); snd.style.pointerEvents = 'auto'; }
      setTimeout(() => {
        if (ta) ta.disabled = false;
        if (snd) snd.disabled = false;
      }, 100);
    }

    if (disableChat) disableChatFn();

    // ── Force VF parent full width ──
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
      .vfrc-message--extension-Forms,
      .vfrc-message--extension-Forms .vfrc-bubble,
      .vfrc-message--extension-Forms .vfrc-bubble-content,
      .vfrc-message--extension-Forms .vfrc-message-content,
      .vfrc-message.vfrc-message--extension-Forms {
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    `;
    (host === document ? document.head : host).appendChild(globalStyle);

    // ── Container ──
    const container = document.createElement('div');
    container.id = uid;

    const style = document.createElement('style');
    style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

#${uid}, #${uid} * { box-sizing: border-box; }

@keyframes form-fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes form-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

#${uid} {
  font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
  width: 100%;
  animation: form-fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  color: ${T.text};
}

#${uid} .form-card {
  background: ${T.cardBg};
  border: 1px solid ${T.cardBorder};
  border-radius: 16px;
  padding: 28px;
  box-shadow: ${T.shadow};
  width: 100%;
  max-width: 100%;
  transition: border-color 0.3s ease;
}

#${uid} .form-card:hover {
  border-color: rgba(${pc.r},${pc.g},${pc.b},0.25);
}

#${uid} .form-title {
  font-size: 22px;
  font-weight: 700;
  color: ${primaryColor};
  margin: 0 0 24px 0;
  padding: 0;
  letter-spacing: -0.3px;
  line-height: 1.3;
}

#${uid} .form-group {
  margin: 0 0 20px 0;
  width: 100%;
}

#${uid} .form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${T.labelColor};
  margin: 0 0 8px 0;
  padding: 0;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

#${uid} .form-group input[type="text"],
#${uid} .form-group input[type="email"],
#${uid} .form-group input[type="tel"] {
  width: 100%;
  padding: 14px 16px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 400;
  color: ${T.inputText};
  background: ${T.inputBg};
  border: 1.5px solid ${T.inputBorder};
  border-radius: 10px;
  outline: none;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  -webkit-text-fill-color: ${T.inputText};
  margin: 0;
}

#${uid} .form-group input::placeholder {
  color: ${T.inputPlaceholder};
  -webkit-text-fill-color: ${T.inputPlaceholder};
}

#${uid} .form-group input:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 3px rgba(${pc.r},${pc.g},${pc.b},0.12);
}

#${uid} .form-group input.invalid {
  border-color: ${T.invalidBorder};
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
  animation: form-shake 0.35s ease;
}

#${uid} .submit-btn {
  display: block;
  width: 100%;
  padding: 16px 0;
  margin: 28px 0 0 0;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, ${primaryColor}, ${lighterColor});
  color: ${isDark ? '#0D0D0D' : '#FFFFFF'};
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(${pc.r},${pc.g},${pc.b},0.3);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.02em;
}

#${uid} .submit-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

#${uid} .submit-btn:hover:not(:disabled)::after {
  transform: translateX(100%);
}

#${uid} .submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(${pc.r},${pc.g},${pc.b},0.45);
}

#${uid} .submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

#${uid} .submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

#${uid} .submit-btn.submitted {
  background: ${T.successBg};
  color: ${T.successText};
  box-shadow: none;
  pointer-events: none;
}

#${uid} .form-footer {
  margin: 16px 0 0 0;
  padding: 0;
  font-size: 12px;
  color: ${T.footerColor};
  text-align: center;
  line-height: 1.5;
}

@media (max-width: 480px) {
  #${uid} .form-card { padding: 20px; }
  #${uid} .form-title { font-size: 18px; margin: 0 0 20px 0; }
  #${uid} .form-group { margin: 0 0 16px 0; }
  #${uid} .form-group input { padding: 12px 14px; font-size: 14px; }
  #${uid} .submit-btn { padding: 14px 0; font-size: 15px; margin: 24px 0 0 0; }
}
    `;
    container.appendChild(style);

    // ── HTML ──
    const card = document.createElement('div');
    card.className = 'form-card';

    const titleEl = document.createElement('h2');
    titleEl.className = 'form-title';
    titleEl.textContent = formTitle;
    card.appendChild(titleEl);

    const formEl = document.createElement('form');
    formEl.id = `dynamic-form-${uid}`;

    // Champs
    fields.forEach((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.setAttribute('for', `${uid}-${field.name}`);
      label.textContent = field.label;

      const input = document.createElement('input');
      input.setAttribute('id', `${uid}-${field.name}`);
      input.setAttribute('name', field.name);
      input.setAttribute('type', field.type || 'text');
      if (field.required) input.required = true;
      if (field.pattern) input.pattern = field.pattern;
      if (field.placeholder) input.placeholder = field.placeholder;

      group.appendChild(label);
      group.appendChild(input);
      formEl.appendChild(group);
    });

    // Bouton
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = submitText;
    submitBtn.className = 'submit-btn';
    formEl.appendChild(submitBtn);

    card.appendChild(formEl);

    // Footer
    if (confidentialityText?.trim()) {
      const footer = document.createElement('div');
      footer.className = 'form-footer';
      footer.textContent = confidentialityText;
      card.appendChild(footer);
    }

    container.appendChild(card);

    // ── Submit handler ──
    formEl.addEventListener('submit', function (event) {
      event.preventDefault();
      const formData = {};
      let hasError = false;

      fields.forEach((field) => {
        const input = formEl.querySelector(`input[name="${field.name}"]`);
        if (!input.checkValidity()) {
          input.classList.add('invalid');
          hasError = true;
        } else {
          input.classList.remove('invalid');
        }
        formData[field.name] = input.value;
      });

      if (hasError || !formEl.checkValidity()) return;

      // Disable form
      submitBtn.disabled = true;
      submitBtn.textContent = '✓ Envoyé';
      submitBtn.classList.add('submitted');
      fields.forEach(f => {
        const inp = formEl.querySelector(`input[name="${f.name}"]`);
        if (inp) inp.disabled = true;
      });

      // Re-enable chat
      if (disableChat) enableChatFn();

      setTimeout(() => {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: formData,
        });
        if (disableChat) setTimeout(enableChatFn, 300);
      }, 100);
    });

    // Input validation reset
    formEl.addEventListener('input', function () {
      fields.forEach((field) => {
        const input = formEl.querySelector(`input[name="${field.name}"]`);
        if (input && input.checkValidity()) input.classList.remove('invalid');
      });
    });

    // ── Mount ──
    element.style.width = '100%';
    element.style.maxWidth = '100%';
    element.appendChild(container);

    // ── Force full-width en remontant toute la chaîne parent VF ──
    const forceFullWidth = () => {
      let el = element;
      for (let i = 0; i < 8; i++) {
        if (!el || el.tagName === 'BODY') break;
        el.style.width = '100%';
        el.style.maxWidth = '100%';
        // Certains wrappers VF utilisent flex avec un max-width interne
        if (getComputedStyle(el).display === 'flex') {
          el.style.flex = '1 1 100%';
        }
        el = el.parentElement;
      }
    };
    
    // Exécuter après le render VF
    requestAnimationFrame(() => {
      forceFullWidth();
      // Double RAF pour s'assurer que le layout VF est finalisé
      requestAnimationFrame(forceFullWidth);
    });

    console.log(`✅ Form v2.0 prêt (${uid}) — theme: ${theme}, fields: ${fields.length}`);
  },
};

export default FormExtension;
