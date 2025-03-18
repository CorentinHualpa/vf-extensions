export const BrowserLanguageExtension = {
  name: 'BrowserLanguage',
  type: 'response',
  match: ({ trace }) => 
    trace.type === 'ext_browserLanguage' || trace.payload?.name === 'ext_browserLanguage',
  
  render: ({ trace, element }) => {
    // Création du conteneur pour afficher les informations
    const container = document.createElement('div');
    container.style.padding = '10px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    try {
      // Récupération de la langue du navigateur
      const browserLanguage = navigator.language || navigator.userLanguage || 'non détectée';
      const primaryLanguage = browserLanguage.split('-')[0];
      
      // Affichage des informations dans le chatbot
      container.innerHTML = `
        <div style="padding: 10px; border-radius: 5px; background-color: #f5f5f5;">
          <div style="font-weight: bold; margin-bottom: 8px;">Information détectée :</div>
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">Langue du navigateur :</span> ${browserLanguage}
          </div>
          <div>
            <span style="font-weight: bold;">Code de langue :</span> ${primaryLanguage}
          </div>
        </div>
      `;
      
      // Envoi des informations à Voiceflow
      setTimeout(() => {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            browserLanguage: browserLanguage,
            primaryLanguage: primaryLanguage
          }
        });
      }, 2000); // Délai de 2 secondes pour permettre à l'utilisateur de lire les informations
      
    } catch (error) {
      console.error('Erreur dans l\'extension BrowserLanguage:', error);
      
      // Affichage de l'erreur
      container.innerHTML = `
        <div style="padding: 10px; border-radius: 5px; background-color: #fff0f0; color: #d32f2f;">
          <div style="font-weight: bold; margin-bottom: 8px;">Erreur de détection</div>
          <div>Impossible de détecter la langue du navigateur.</div>
        </div>
      `;
      
      // En cas d'erreur, on envoie une réponse par défaut
      setTimeout(() => {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            browserLanguage: 'non détectée',
            primaryLanguage: 'non détectée'
          }
        });
      }, 2000);
    }
    
    element.appendChild(container);
  }
};
