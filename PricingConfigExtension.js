export const PricingConfigExtension = {
  name: 'PricingConfigExtension',
  type: 'response',

  match: ({ trace }) => {
    return trace.type === 'send_pricing_config' 
        || trace.type === 'update_progress';
  },

  render: ({ trace, element }) => {
    try {
      if (trace.type === 'update_progress') {
        const step = trace.payload?.step || 1;
        window.parent.postMessage({
          type: 'PRICING_PROGRESS',
          payload: { step }
        }, '*');
        return;
      }

      if (trace.type === 'send_pricing_config') {
        const { name, ...configData } = trace.payload || {};
        window.parent.postMessage({
          type: 'PRICING_CONFIG',
          payload: configData
        }, '*');

        const container = document.createElement('div');
        container.style.cssText = 'padding:8px 12px;font-size:13px;color:#60A5FA;';
        container.textContent = '✅ Configuration envoyée au calculateur...';
        element.appendChild(container);
      }
    } catch (error) {
      console.error('PricingConfigExtension error:', error);
    }
  }
};
