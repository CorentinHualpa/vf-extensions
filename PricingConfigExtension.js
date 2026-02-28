// PricingConfigExtension.js
// Extension Voiceflow qui écoute un trace custom "send_pricing_config"
// et envoie la config à la page parente via postMessage.
//
// Héberger sur : https://corentinhualpa.github.io/vf-extensions/PricingConfigExtension.js
//
// Usage dans le widget VF :
//   import { PricingConfigExtension } from '.../PricingConfigExtension.js';
//   extensions: [PricingConfigExtension]

export const PricingConfigExtension = {
  name: 'PricingConfigExtension',
  type: 'response',

  match: ({ trace }) => {
    return trace.type === 'send_pricing_config' || trace.payload?.name === 'send_pricing_config';
  },

  render: ({ trace, element }) => {
    try {
      const config = typeof trace.payload === 'string' 
        ? JSON.parse(trace.payload) 
        : trace.payload;

      // Retirer le champ "name" du payload si présent (c'est juste l'identifiant du trace)
      const { name, ...configData } = config;

      window.parent.postMessage({
        type: 'PRICING_CONFIG',
        payload: configData
      }, '*');

      // Feedback visuel optionnel (petit message dans le chat)
      const container = document.createElement('div');
      container.style.cssText = 'padding:8px 12px;font-size:13px;color:#60A5FA;';
      container.textContent = '✅ Configuration envoyée au calculateur...';
      element.appendChild(container);

      // Auto-redirect après 1.5s (le listener côté app fera la redirection,
      // mais ce timeout sert de fallback visuel)
      setTimeout(() => {
        container.textContent = '🚀 Redirection en cours...';
      }, 1500);

    } catch (error) {
      console.error('PricingConfigExtension error:', error);
    }
  }
};
