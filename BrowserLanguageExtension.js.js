/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  BrowserLanguageExtension – Voiceflow Extension             ║
 * ║                                                              ║
 * ║  • Détection de la langue du navigateur                     ║
 * ║  • Détection de la plateforme (iOS, Android, Web)           ║
 * ║  • Informations sur l'appareil et l'environnement           ║
 * ║  • Compatible webview iOS/Android                           ║
 * ║  • Détection automatique ou sur déclenchement               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export const BrowserLanguageExtension = {
  name: 'BrowserLanguageExtension',
  type: 'effect',
  
  // S'active sur trace ext_browserLanguage ou browser_info
  match: ({ trace }) => 
    trace.type === 'ext_browserLanguage' || 
    trace.type === 'browser_info' ||
    trace.payload?.name === 'ext_browserLanguage' ||
    trace.payload?.name === 'browser_info',
  
  effect: ({ trace }) => {
    try {
      // Configuration depuis le payload (optionnel)
      const config = trace.payload || {};
      const includeLocation = config.includeLocation || false;
      const includeScreen = config.includeScreen !== false; // true par défaut
      const includeNetwork = config.includeNetwork || false;
      
      console.log('🌐 BrowserLanguageExtension: Collecte des informations...');
      
      // ========================================
      // 1. DÉTECTION DE LA LANGUE
      // ========================================
      const getBrowserLanguages = () => {
        const languages = [];
        
        // Langue principale
        if (navigator.language) {
          languages.push(navigator.language);
        }
        
        // Langues préférées (si supporté)
        if (navigator.languages && Array.isArray(navigator.languages)) {
          navigator.languages.forEach(lang => {
            if (!languages.includes(lang)) {
              languages.push(lang);
            }
          });
        }
        
        // Fallback pour anciens navigateurs
        if (navigator.userLanguage && !languages.includes(navigator.userLanguage)) {
          languages.push(navigator.userLanguage);
        }
        
        if (navigator.browserLanguage && !languages.includes(navigator.browserLanguage)) {
          languages.push(navigator.browserLanguage);
        }
        
        return languages.length > 0 ? languages : ['fr']; // Fallback français
      };
      
      const languages = getBrowserLanguages();
      const primaryLanguage = languages[0] ? languages[0].split('-')[0] : 'fr';
      
      // ========================================
      // 2. DÉTECTION DE LA PLATEFORME
      // ========================================
      const getPlatformInfo = () => {
        const userAgent = navigator.userAgent || '';
        const platform = navigator.platform || '';
        
        // Détection iOS
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Détection Android
        const isAndroid = /Android/.test(userAgent);
        
        // Détection Windows
        const isWindows = /Win/.test(platform) || /Windows/.test(userAgent);
        
        // Détection macOS
        const isMacOS = /Mac/.test(platform) && !isIOS;
        
        // Détection Linux
        const isLinux = /Linux/.test(platform) && !isAndroid;
        
        // Type d'appareil
        const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
        const isTablet = /Tablet|iPad/.test(userAgent) || 
                        (isIOS && !isMobile) ||
                        (isAndroid && !/Mobile/.test(userAgent));
        const isDesktop = !isMobile && !isTablet;
        
        // Détection WebView
        const isWebView = /wv|WebView/.test(userAgent) ||
                         (isAndroid && /Version\/\d+\.\d+/.test(userAgent) && !/Chrome\/\d+/.test(userAgent)) ||
                         (isIOS && !(/Safari/.test(userAgent) && /Version/.test(userAgent)));
        
        let platformName = 'Unknown';
        if (isIOS) platformName = 'iOS';
        else if (isAndroid) platformName = 'Android';
        else if (isWindows) platformName = 'Windows';
        else if (isMacOS) platformName = 'macOS';
        else if (isLinux) platformName = 'Linux';
        
        let deviceType = 'Unknown';
        if (isMobile) deviceType = 'Mobile';
        else if (isTablet) deviceType = 'Tablet';
        else if (isDesktop) deviceType = 'Desktop';
        
        return {
          platform: platformName,
          deviceType: deviceType,
          isMobile,
          isTablet,
          isDesktop,
          isWebView,
          userAgent: userAgent.substring(0, 200) // Limiter la taille
        };
      };
      
      // ========================================
      // 3. INFORMATIONS TEMPORELLES
      // ========================================
      const getTimeInfo = () => {
        const now = new Date();
        return {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          timezoneOffset: now.getTimezoneOffset(),
          currentTime: now.toISOString(),
          locale: Intl.DateTimeFormat().resolvedOptions().locale || languages[0] || 'fr'
        };
      };
      
      // ========================================
      // 4. INFORMATIONS D'ÉCRAN (optionnel)
      // ========================================
      const getScreenInfo = () => {
        if (!includeScreen) return null;
        
        return {
          screenWidth: screen.width || null,
          screenHeight: screen.height || null,
          availableWidth: screen.availWidth || null,
          availableHeight: screen.availHeight || null,
          colorDepth: screen.colorDepth || null,
          pixelDepth: screen.pixelDepth || null,
          orientation: screen.orientation ? {
            angle: screen.orientation.angle,
            type: screen.orientation.type
          } : null,
          windowWidth: window.innerWidth || null,
          windowHeight: window.innerHeight || null,
          devicePixelRatio: window.devicePixelRatio || 1
        };
      };
      
      // ========================================
      // 5. INFORMATIONS RÉSEAU (optionnel)
      // ========================================
      const getNetworkInfo = () => {
        if (!includeNetwork || !navigator.connection) return null;
        
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return connection ? {
          effectiveType: connection.effectiveType || null,
          downlink: connection.downlink || null,
          rtt: connection.rtt || null,
          saveData: connection.saveData || false
        } : null;
      };
      
      // ========================================
      // 6. ASSEMBLAGE DES DONNÉES
      // ========================================
      const platformInfo = getPlatformInfo();
      const timeInfo = getTimeInfo();
      const screenInfo = getScreenInfo();
      const networkInfo = getNetworkInfo();
      
      const browserInfo = {
        // Informations de langue
        browserLanguage: languages[0],
        primaryLanguage: primaryLanguage,
        supportedLanguages: languages,
        detectedLocale: timeInfo.locale,
        
        // Informations de plateforme
        platform: platformInfo.platform,
        deviceType: platformInfo.deviceType,
        isMobile: platformInfo.isMobile,
        isTablet: platformInfo.isTablet,
        isDesktop: platformInfo.isDesktop,
        isWebView: platformInfo.isWebView,
        userAgent: platformInfo.userAgent,
        
        // Informations temporelles
        timezone: timeInfo.timezone,
        timezoneOffset: timeInfo.timezoneOffset,
        currentTime: timeInfo.currentTime,
        
        // Informations techniques
        cookieEnabled: navigator.cookieEnabled || false,
        onlineStatus: navigator.onLine || false,
        
        // Capacités du navigateur
        capabilities: {
          geolocation: 'geolocation' in navigator,
          camera: 'mediaDevices' in navigator,
          notifications: 'Notification' in window,
          localStorage: typeof(Storage) !== 'undefined',
          webWorkers: typeof(Worker) !== 'undefined',
          webGL: (() => {
            try {
              const canvas = document.createElement('canvas');
              return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch (e) {
              return false;
            }
          })()
        }
      };
      
      // Ajouter les informations d'écran si demandées
      if (screenInfo) {
        browserInfo.screen = screenInfo;
      }
      
      // Ajouter les informations réseau si demandées
      if (networkInfo) {
        browserInfo.network = networkInfo;
      }
      
      // ========================================
      // 7. GÉOLOCALISATION (si demandée et autorisée)
      // ========================================
      const sendResponse = (additionalData = {}) => {
        const finalPayload = {
          ...browserInfo,
          ...additionalData,
          timestamp: Date.now(),
          extensionVersion: '1.0.0'
        };
        
        console.log('🌐 Informations collectées:', finalPayload);
        
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: finalPayload
        });
      };
      
      // Si géolocalisation demandée
      if (includeLocation && navigator.geolocation) {
        const geoOptions = {
          timeout: 5000,
          maximumAge: 300000, // 5 minutes
          enableHighAccuracy: false
        };
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationInfo = {
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              }
            };
            sendResponse(locationInfo);
          },
          (error) => {
            console.warn('🌐 Géolocalisation non disponible:', error.message);
            sendResponse({
              location: {
                error: error.message,
                errorCode: error.code
              }
            });
          },
          geoOptions
        );
      } else {
        // Envoyer la réponse sans géolocalisation
        sendResponse();
      }
      
    } catch (error) {
      console.error('❌ BrowserLanguageExtension Error:', error);
      
      // En cas d'erreur, envoyer des données minimales
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: {
          browserLanguage: 'fr',
          primaryLanguage: 'fr',
          platform: 'Unknown',
          deviceType: 'Unknown',
          error: true,
          errorMessage: error.message,
          timestamp: Date.now()
        }
      });
    }
  }
};

export default BrowserLanguageExtension;
