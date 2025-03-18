export const UserInfoExtension = {
  name: 'UserInfo',
  type: 'response', // Changé en 'response' pour afficher du texte
  match: ({ trace }) => 
    trace.type === 'ext_userInfo' || trace.payload?.name === 'ext_userInfo',
  
  render: async ({ trace, element }) => {
    // Création du conteneur pour afficher les informations
    const container = document.createElement('div');
    container.style.padding = '10px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Message initial de chargement
    container.innerHTML = `
      <div>Collecte des informations en cours...</div>
      <div style="margin-top: 10px; font-size: 0.8em; color: #888;">
        Récupération de la langue et de l'adresse IP...
      </div>
    `;
    
    element.appendChild(container);
    
    try {
      // Récupération de la langue du navigateur
      const browserLanguage = navigator.language || navigator.userLanguage || 'non détectée';
      
      // On essaie de récupérer l'IP sans faire d'appel API direct
      // ce qui a moins de chances d'être bloqué
      const userIP = await fetchIPSafely();
      
      // Mise à jour du conteneur avec les informations
      container.innerHTML = `
        <div style="padding: 10px; border-radius: 5px; background-color: #f5f5f5;">
          <div style="font-weight: bold; margin-bottom: 8px;">Informations détectées :</div>
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">Langue du navigateur :</span> ${browserLanguage}
          </div>
          <div>
            <span style="font-weight: bold;">Adresse IP :</span> ${userIP}
          </div>
        </div>
      `;
      
      // Envoi des informations à Voiceflow pour les stocker dans des variables
      setTimeout(() => {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            userIP: userIP,
            browserLanguage: browserLanguage,
            displayText: `Langue: ${browserLanguage}, IP: ${userIP}`
          }
        });
      }, 3000); // Délai de 3 secondes pour que l'utilisateur puisse lire les informations
      
    } catch (error) {
      console.error('Erreur dans l\'extension UserInfo:', error);
      
      // Affichage de l'erreur
      container.innerHTML = `
        <div style="padding: 10px; border-radius: 5px; background-color: #fff0f0; color: #d32f2f;">
          <div style="font-weight: bold; margin-bottom: 8px;">Impossible de récupérer les informations</div>
          <div>Certaines informations n'ont pas pu être récupérées. Cela peut être dû à un bloqueur de publicités.</div>
        </div>
      `;
      
      // Même en cas d'erreur, on envoie une réponse à Voiceflow
      setTimeout(() => {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: {
            userIP: 'non détectée',
            browserLanguage: navigator.language || 'non détectée',
            error: error.message
          }
        });
      }, 3000);
    }
    
    // Fonction pour récupérer l'IP de manière moins susceptible d'être bloquée
    async function fetchIPSafely() {
      try {
        // Première approche utilisant un service JSON CORS-friendly
        const response = await fetch('https://api.ipify.org?format=json', {
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.ip;
        }
        
        // Seconde approche alternative
        const response2 = await fetch('https://ipinfo.io/json', {
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response2.ok) {
          const data2 = await response2.json();
          return data2.ip;
        }
        
        // Troisième tentative avec une API différente
        const response3 = await fetch('https://api.db-ip.com/v2/free/self', {
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response3.ok) {
          const data3 = await response3.json();
          return data3.ipAddress;
        }
        
        return 'non détectée';
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'IP:', error);
        return 'non détectée';
      }
    }
  }
};
