export const CalendlyExtension = {
  name: 'Calendly',
  type: 'response',
  // On matche avec trace.type ou trace.payload.name en utilisant "ext_calendly"
  match: ({ trace }) =>
    trace.type === 'ext_calendly' || trace.payload.name === 'ext_calendly',

  render: ({ trace, element }) => {
    // Récupérer les paramètres depuis le payload (avec des valeurs par défaut)
    const {
      url = 'https://calendly.com/corentin-hualpa/echange-30-minutes',
      height = 700,
      minWidth = '320px',
      backgroundColor = '#ffffff'
    } = trace.payload || {};

    // Créer un conteneur pour le widget (optionnel, ici pour ajouter un fond par exemple)
    const container = document.createElement('div');
    container.style.backgroundColor = backgroundColor;

    // Créer la div Calendly inline widget
    const calendlyDiv = document.createElement('div');
    calendlyDiv.className = 'calendly-inline-widget';
    calendlyDiv.setAttribute('data-url', url);
    calendlyDiv.style.minWidth = minWidth;
    calendlyDiv.style.height = `${height}px`;

    container.appendChild(calendlyDiv);
    element.appendChild(container);

    // Charger le script Calendly pour activer le widget
    // Note : s'il est déjà chargé ailleurs, cela peut être évité.
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.head.appendChild(script);
  }
};
