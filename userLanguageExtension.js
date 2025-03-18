export const BrowserLanguageExtension = {
  name: 'BrowserLanguage',
  type: 'effect',
  match: ({ trace }) => {
    console.log("Vérification du match pour BrowserLanguage:", trace);
    return trace.type === 'ext_browserLanguage' || trace.payload?.name === 'ext_browserLanguage';
  },
  
  effect: ({ trace }) => {
    console.log("Extension BrowserLanguage activée");
    
    try {
      // Récupération de la langue du navigateur
      const browserLanguage = navigator.language || navigator.userLanguage || 'non détectée';
      const primaryLanguage = browserLanguage ? browserLanguage.split('-')[0] : 'non détectée';
      
      console.log("Langue du navigateur détectée:", browserLanguage);
      console.log("Code de langue principal:", primaryLanguage);
      
      // Envoi des informations à Voiceflow
      const payload = {
        browserLanguage: browserLanguage,
        primaryLanguage: primaryLanguage
      };
      
      console.log("Envoi du payload à Voiceflow:", payload);
      
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: payload
      });
      
      console.log("Données envoyées avec succès à Voiceflow");
      
    } catch (error) {
      console.error('Erreur dans l\'extension BrowserLanguage:', error);
      
      // En cas d'erreur, on envoie une réponse par défaut
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          browserLanguage: 'erreur: ' + error.message,
          primaryLanguage: 'erreur'
        }
      });
    }
  }
};
