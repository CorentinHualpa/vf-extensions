export const UserInfoExtension = {
  name: 'UserInfo',
  type: 'effect', // Utilisation du type 'effect' car nous n'avons pas besoin d'interface visuelle
  match: ({ trace }) => 
    trace.type === 'ext_userInfo' || trace.payload?.name === 'ext_userInfo',
  
  effect: async ({ trace }) => {
    try {
      // Récupération de la langue du navigateur
      const browserLanguage = navigator.language || navigator.userLanguage || 'unknown';
      
      // Récupération de l'IP de l'utilisateur via une API externe
      let userIP = 'unknown';
      
      try {
        // Option 1: Utilisation de ipify (API gratuite sans clé d'API requise)
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          userIP = ipData.ip;
        } else {
          // Option 2 (fallback): Utilisation d'une API alternative
          const ipResponse2 = await fetch('https://api.db-ip.com/v2/free/self');
          if (ipResponse2.ok) {
            const ipData2 = await ipResponse2.json();
            userIP = ipData2.ipAddress;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'IP:', error);
      }
      
      // Envoi des informations à Voiceflow
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          userIP: userIP,
          browserLanguage: browserLanguage
        }
      });
      
    } catch (error) {
      console.error('Erreur dans l\'extension UserInfo:', error);
      // Même en cas d'erreur, on envoie une réponse à Voiceflow pour ne pas bloquer le flux
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          userIP: 'error',
          browserLanguage: 'error',
          error: error.message
        }
      });
    }
  }
};
