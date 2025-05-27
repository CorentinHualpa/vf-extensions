/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  LoaderExtension – Voiceflow Response Extension           ║
 *  ║                                                           ║
 *  ║  • Barre de chargement circulaire ultra-stylée           ║
 *  ║  • Textes défilants selon la progression                 ║
 *  ║  • Glassmorphism et effets visuels avancés               ║
 *  ║  • Animation de scan et particules                       ║
 *  ║  • Message personnalisable et pourcentage                ║
 *  ║  • Totalement configurable                               ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const LoaderExtension = {
  name: 'LoaderExtension',
  type: 'response',
  
  // Activation sur trace ext_loader
  match: ({ trace }) => 
    trace.type === 'ext_loader' || trace.payload?.name === 'ext_loader',

  render: ({ trace, element }) => {
    try {
      // Configuration depuis le payload
      const {
        duration = 10,                    // Durée en secondes
        message = "Chargement en cours...", // Message personnalisé
        color = '#9C27B0',               // Couleur principale
        size = 200,                      // Taille du cercle
        strokeWidth = 12,                // Épaisseur de la barre
        showScanEffect = true,           // Effet de scan
        showParticles = true,            // Particules animées
        steps = [],                      // Étapes avec textes défilants
        width = 90,                      // Largeur en pourcentage (défaut: 90%)
        height = 400,                    // Hauteur fixe en pixels (défaut: 400px)
        backgroundImage = null,          // Image de fond (URL)
        finalText = "Terminé ! Cliquez pour continuer", // Texte final cliquable
        instanceId = null                 // ID unique
      } = trace.payload || {};

      // Étapes par défaut si non fournies
      const defaultSteps = [
        { progress: 5, text: "🆔 Création d'un identifiant unique", icon: "🆔" },
        { progress: 10, text: "🔍 Vérification du format et de la qualité du document", icon: "🔍" },
        { progress: 15, text: "🚀 Démarrage du processus d'upload", icon: "🚀" },
        { progress: 25, text: "📄 Vérification de la taille et de la structure du fichier", icon: "📄" },
        { progress: 30, text: "📊 Extraction préliminaire des métadonnées", icon: "📊" },
        { progress: 35, text: "⚙️ Préparation des données pour la vectorisation", icon: "⚙️" },
        { progress: 45, text: "⚡ Optimisation des données pour l'indexation", icon: "⚡" },
        { progress: 50, text: "🔗 Intégration dans le modèle RAG", icon: "🔗" },
        { progress: 55, text: "🔒 Vérification de l'intégrité des données uploadées", icon: "🔒" },
        { progress: 65, text: "🧩 Ajustement automatique de la segmentation des chunks", icon: "🧩" },
        { progress: 70, text: "📝 Consolidation des index partiels", icon: "📝" },
        { progress: 75, text: "🗺️ Création d'un plan de navigation du document", icon: "🗺️" },
        { progress: 80, text: "📈 Calcul de la pertinence des chunks", icon: "📈" },
        { progress: 85, text: "🔄 Détection des éventuels doublons", icon: "🔄" },
        { progress: 90, text: "⚡ Mise en cache pour accès rapide", icon: "⚡" },
        { progress: 95, text: "🔄 Synchronisation avec le système de logs", icon: "🔄" },
        { progress: 98, text: "✅ Validation finale de l'index", icon: "✅" },
        { progress: 100, text: "🎯 Test de l'indexation terminé", icon: "🎯" }
      ];

      const processSteps = steps.length > 0 ? steps : defaultSteps;

      // Traitement de l'image de fond si elle est au format [img]URL[/img]
      let processedBackgroundImage = backgroundImage;
      if (backgroundImage && backgroundImage.includes('[img]') && backgroundImage.includes('[/img]')) {
        processedBackgroundImage = backgroundImage.replace(/\[img\](.*?)\[\/img\]/g, '$1');
      }

      // Générer un ID unique pour cette instance
      const uniqueInstanceId = instanceId || `loader_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Variables de progression
      let progress = 0;
      let startTime = Date.now();
      let animationFrameId;
      let currentStepIndex = -1;
      
      // Calculs pour le cercle SVG
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const center = size / 2;

      // Container principal
      const container = document.createElement('div');
      container.classList.add('loader-container');
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);

      // CSS intégré avec tous les effets visuels
      const styleEl = document.createElement('style');
      
      // Extraction des valeurs RGB pour les variables CSS
      const colorRgb = parseInt(color.replace('#',''), 16);
      const colorR = (colorRgb >> 16) & 255;
      const colorG = (colorRgb >> 8) & 255;
      const colorB = colorRgb & 255;
      
      styleEl.textContent = `
/* Variables CSS principales */
.loader-container {
  --loader-color: ${color};
  --loader-r: ${colorR};
  --loader-g: ${colorG};
  --loader-b: ${colorB};
  --loader-size: ${size}px;
  --loader-stroke: ${strokeWidth}px;
  --loader-radius: ${radius}px;
  --loader-circumference: ${circumference}px;
}

/* Reset et styles de base */
.loader-container, .loader-container * { 
  box-sizing: border-box!important; 
}

.loader-container {
  display: flex!important;
  flex-direction: column!important;
  align-items: center!important;
  justify-content: center!important;
  width: 500px!important;
  height: ${height}px!important;
  margin: 0 auto!important;
  padding: 30px 20px!important;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif!important;
  background: ${processedBackgroundImage ? `
    linear-gradient(135deg, 
      rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.85),
      rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.75)),
    url("${processedBackgroundImage}")
  ` : `
    linear-gradient(135deg, 
      rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.4),
      rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.2))
  `}!important;
  background-size: cover!important;
  background-position: center!important;
  background-repeat: no-repeat!important;
  backdrop-filter: blur(20px)!important;
  -webkit-backdrop-filter: blur(20px)!important;
  border: 2px solid rgba(255, 255, 255, 0.3)!important;
  border-radius: 20px!important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.2),
              0 0 0 1px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.3)!important;
  position: relative!important;
  overflow: hidden!important;
  animation: containerGlow 3s ease-in-out infinite alternate!important;
  box-sizing: border-box!important;
}

/* Animation de glow du container */
@keyframes containerGlow {
  0% {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
                inset 0 2px 0 rgba(255, 255, 255, 0.2),
                0 0 0 1px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.3);
  }
  100% {
    box-shadow: 0 16px 50px rgba(0, 0, 0, 0.5),
                inset 0 2px 0 rgba(255, 255, 255, 0.3),
                0 0 20px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.6);
  }
}

/* Effet de scan du container */
.loader-container::before {
  content: ''!important;
  position: absolute!important;
  top: -50%!important;
  left: -10%!important;
  width: 120%!important;
  height: 200%!important;
  background: linear-gradient(45deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent)!important;
  transform: translateX(-100%) rotate(45deg)!important;
  animation: scanEffect 4s ease-in-out infinite!important;
}

@keyframes scanEffect {
  0%, 90% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

/* ✅ NOUVEAU: Zone des étapes défilantes */
.loader-steps-container {
  width: 100%!important;
  min-height: 100px!important;
  height: auto!important;
  margin-bottom: 20px!important;
  position: relative!important;
  background: rgba(0, 0, 0, 0.6)!important;
  border-radius: 12px!important;
  border: 2px solid rgba(255, 255, 255, 0.25)!important;
  backdrop-filter: blur(15px)!important;
  overflow: visible!important;
  display: flex!important;
  align-items: center!important;
  justify-content: center!important;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3),
              0 4px 15px rgba(0, 0, 0, 0.2)!important;
  padding: 15px!important;
}

.loader-steps-container::before {
  content: ''!important;
  position: absolute!important;
  top: 0!important;
  left: -100%!important;
  width: 100%!important;
  height: 100%!important;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent)!important;
  animation: stepsScan 3s ease-in-out infinite!important;
}

@keyframes stepsScan {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Étape active */
.loader-current-step {
  display: flex!important;
  align-items: center!important;
  justify-content: flex-start!important;
  gap: 15px!important;
  padding: 20px 25px!important;
  width: 100%!important;
  max-width: 100%!important;
  box-sizing: border-box!important;
  color: #fff!important;
  font-size: 16px!important;
  font-weight: 700!important;
  text-align: left!important;
  letter-spacing: 0.3px!important;
  line-height: 1.4!important;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.8),
               0 0 8px rgba(255, 255, 255, 0.3)!important;
  animation: stepFadeIn 0.6s ease-out!important;
  position: relative!important;
  z-index: 2!important;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15),
    rgba(255, 255, 255, 0.05))!important;
  border-radius: 8px!important;
  backdrop-filter: blur(10px)!important;
  min-height: 60px!important;
  overflow: hidden!important;
}

.loader-current-step .step-icon {
  font-size: 20px!important;
  animation: iconBounce 0.8s ease-out!important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))!important;
  min-width: 28px!important;
  display: flex!important;
  align-items: center!important;
  justify-content: center!important;
  align-self: flex-start!important;
  margin-top: 2px!important;
}

.loader-current-step .step-text {
  font-weight: 500!important;
  line-height: 1.4!important;
  flex: 1!important;
  word-wrap: break-word!important;
  overflow-wrap: break-word!important;
  hyphens: auto!important;
  max-width: calc(100% - 50px)!important;
  overflow: hidden!important;
  text-overflow: ellipsis!important;
  display: -webkit-box!important;
  -webkit-line-clamp: 3!important;
  -webkit-box-orient: vertical!important;
}

@keyframes stepFadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes iconBounce {
  0% { transform: scale(0.3) rotate(-180deg); }
  50% { transform: scale(1.2) rotate(0deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* Indicateur de progression des étapes */
.loader-steps-progress {
  position: absolute!important;
  bottom: 0!important;
  left: 0!important;
  height: 4px!important;
  background: linear-gradient(90deg, 
    var(--loader-color), 
    rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.9),
    #ffffff)!important;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1)!important;
  box-shadow: 0 0 15px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.8),
              0 2px 8px rgba(0, 0, 0, 0.3)!important;
  border-radius: 0 0 12px 12px!important;
}

/* Container du cercle principal */
.loader-circle-container {
  position: relative!important;
  width: var(--loader-size)!important;
  height: var(--loader-size)!important;
  margin-bottom: 25px!important;
}

/* Cercle SVG */
.loader-svg {
  width: 100%!important;
  height: 100%!important;
  transform: rotate(-90deg)!important;
  filter: drop-shadow(0 0 10px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.5))!important;
}

/* Cercle de fond */
.loader-circle-bg {
  fill: none!important;
  stroke: rgba(255, 255, 255, 0.1)!important;
  stroke-width: var(--loader-stroke)!important;
  stroke-linecap: round!important;
}

/* Cercle de progression principal */
.loader-circle-progress {
  fill: none!important;
  stroke: var(--loader-color)!important;
  stroke-width: var(--loader-stroke)!important;
  stroke-linecap: round!important;
  stroke-dasharray: var(--loader-circumference)!important;
  stroke-dashoffset: var(--loader-circumference)!important;
  transition: stroke-dashoffset 0.3s ease, stroke 0.5s ease!important;
  filter: drop-shadow(0 0 8px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.8))!important;
}

/* Cercle de glow */
.loader-circle-glow {
  fill: none!important;
  stroke: rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.3)!important;
  stroke-width: calc(var(--loader-stroke) + 6px)!important;
  stroke-linecap: round!important;
  stroke-dasharray: var(--loader-circumference)!important;
  stroke-dashoffset: var(--loader-circumference)!important;
  transition: stroke-dashoffset 0.3s ease!important;
  animation: glowPulse 2s ease-in-out infinite alternate!important;
}

@keyframes glowPulse {
  0% { opacity: 0.3; }
  100% { opacity: 0.7; }
}

/* Texte du pourcentage au centre */
.loader-percentage {
  position: absolute!important;
  top: 50%!important;
  left: 50%!important;
  transform: translate(-50%, -50%)!important;
  font-size: calc(var(--loader-size) * 0.15)!important;
  font-weight: 900!important;
  color: #fff!important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5),
               0 0 20px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.8)!important;
  letter-spacing: -1px!important;
  animation: percentagePulse 1.5s ease-in-out infinite alternate!important;
}

@keyframes percentagePulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  100% { transform: translate(-50%, -50%) scale(1.05); }
}

/* Message de chargement */
.loader-message {
  font-size: 20px!important;
  font-weight: 800!important;
  color: #fff!important;
  text-align: center!important;
  letter-spacing: 0.8px!important;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.8),
               0 0 10px rgba(255, 255, 255, 0.2)!important;
  margin-bottom: 15px!important;
  animation: messageFloat 3s ease-in-out infinite!important;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05))!important;
  padding: 12px 20px!important;
  border-radius: 12px!important;
  backdrop-filter: blur(10px)!important;
  border: 1px solid rgba(255, 255, 255, 0.2)!important;
}

@keyframes messageFloat {
  0%, 100% { transform: translateY(0); opacity: 0.9; }
  50% { transform: translateY(-3px); opacity: 1; }
}

/* Points d'animation après le message */
.loader-message::after {
  content: ''!important;
  animation: loadingDots 1.5s infinite!important;
}

@keyframes loadingDots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

/* Container des particules */
.loader-particles {
  position: absolute!important;
  width: 100%!important;
  height: 100%!important;
  pointer-events: none!important;
  overflow: hidden!important;
}

/* Particules individuelles */
.loader-particle {
  position: absolute!important;
  width: 4px!important;
  height: 4px!important;
  background: var(--loader-color)!important;
  border-radius: 50%!important;
  box-shadow: 0 0 6px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.8)!important;
  animation: particleFloat 2s ease-in-out infinite!important;
}

.loader-particle:nth-child(odd) {
  animation-delay: -1s!important;
  animation-duration: 2.5s!important;
}

@keyframes particleFloat {
  0% {
    transform: translateY(20px) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
    transform: translateY(-10px) scale(1);
  }
  100% {
    transform: translateY(-30px) scale(0);
    opacity: 0;
  }
}

/* États de progression avec changement de couleur */
.loader-container.progress-low .loader-circle-progress {
  stroke: #FF6B6B!important; /* Rouge pour début */
}

.loader-container.progress-medium .loader-circle-progress {
  stroke: #FFE66D!important; /* Jaune pour milieu */
}

.loader-container.progress-high .loader-circle-progress {
  stroke: #4ECDC4!important; /* Turquoise pour fin */
}

.loader-container.progress-complete .loader-circle-progress {
  stroke: #45B7D1!important; /* Bleu pour terminé */
  animation: completePulse 0.5s ease-in-out 3!important;
}

@keyframes completePulse {
  0%, 100% { stroke-width: var(--loader-stroke); }
  50% { stroke-width: calc(var(--loader-stroke) + 4px); }
}

/* Animation de fin */
.loader-container.completed {
  animation: completedGlow 1s ease-in-out!important;
}

@keyframes completedGlow {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* ✅ NOUVEAU: Bouton final cliquable */
.loader-final-button {
  position: absolute!important;
  top: 50%!important;
  left: 50%!important;
  transform: translate(-50%, -50%)!important;
  width: calc(var(--loader-size) + 20px)!important;
  height: calc(var(--loader-size) + 20px)!important;
  border-radius: 50%!important;
  background: linear-gradient(145deg, 
    var(--loader-color), 
    rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.8))!important;
  border: none!important;
  cursor: pointer!important;
  display: flex!important;
  flex-direction: column!important;
  align-items: center!important;
  justify-content: center!important;
  color: #fff!important;
  font-family: inherit!important;
  font-size: 16px!important;
  font-weight: 700!important;
  text-align: center!important;
  line-height: 1.3!important;
  letter-spacing: 0.5px!important;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5)!important;
  box-shadow: 0 8px 30px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.2),
              inset 0 -2px 0 rgba(0, 0, 0, 0.2)!important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)!important;
  opacity: 0!important;
  scale: 0.3!important;
  z-index: 10!important;
  animation: finalButtonAppear 0.8s ease-out 0.5s forwards!important;
  backdrop-filter: blur(10px)!important;
  overflow: hidden!important;
}

.loader-final-button:hover {
  transform: translate(-50%, -50%) scale(1.05)!important;
  box-shadow: 0 12px 40px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.6),
              inset 0 3px 0 rgba(255, 255, 255, 0.3),
              inset 0 -3px 0 rgba(0, 0, 0, 0.3)!important;
}

.loader-final-button:active {
  transform: translate(-50%, -50%) scale(0.95)!important;
  box-shadow: 0 4px 15px rgba(var(--loader-r), var(--loader-g), var(--loader-b), 0.4)!important;
}

.loader-final-button::before {
  content: ''!important;
  position: absolute!important;
  top: -10px!important;
  left: -10px!important;
  width: calc(100% + 20px)!important;
  height: calc(100% + 20px)!important;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)!important;
  border-radius: 50%!important;
  transform: translateX(-100%) rotate(45deg)!important;
  transition: transform 0.8s ease!important;
}

.loader-final-button:hover::before {
  transform: translateX(100%) rotate(45deg)!important;
}

.loader-final-button .final-icon {
  font-size: 28px!important;
  margin-bottom: 8px!important;
  animation: finalIconPulse 2s ease-in-out infinite!important;
}

.loader-final-button .final-text {
  font-size: 14px!important;
  font-weight: 600!important;
  padding: 0 15px!important;
  max-width: calc(var(--loader-size) - 40px)!important;
  overflow: hidden!important;
  text-overflow: ellipsis!important;
  white-space: nowrap!important;
}

@keyframes finalButtonAppear {
  0% {
    opacity: 0;
    scale: 0.3;
    transform: translate(-50%, -50%) rotate(-180deg);
  }
  50% {
    opacity: 0.8;
    scale: 1.1;
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    opacity: 1;
    scale: 1;
    transform: translate(-50%, -50%) rotate(0deg);
  }
}

@keyframes finalIconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Masquer les éléments du loader quand terminé */
.loader-container.completed .loader-percentage,
.loader-container.completed .loader-circle-progress,
.loader-container.completed .loader-circle-glow,
.loader-container.completed .loader-particles {
  opacity: 0!important;
  transition: opacity 0.5s ease!important;
}

/* Style responsive */
@media (max-width: 768px) {
  .loader-container {
    --loader-size: ${Math.min(size, 150)}px;
    width: 95%!important;
    min-width: 320px!important;
    max-width: 400px!important;
    height: ${Math.max(height * 0.8, 320)}px!important;
    padding: 20px 15px!important;
  }
  
  .loader-message {
    font-size: 18px!important;
    padding: 10px 15px!important;
  }
  
  .loader-steps-container {
    min-height: 90px!important;
    padding: 12px!important;
  }
  
  .loader-current-step {
    font-size: 14px!important;
    padding: 15px 20px!important;
    gap: 12px!important;
    min-height: 50px!important;
  }
  
  .loader-current-step .step-icon {
    font-size: 18px!important;
    min-width: 24px!important;
  }
  
  .loader-current-step .step-text {
    line-height: 1.3!important;
    font-size: 14px!important;
    max-width: calc(100% - 40px)!important;
  }
}
      `;

      container.appendChild(styleEl);

      // Message de chargement
      const messageEl = document.createElement('div');
      messageEl.classList.add('loader-message');
      messageEl.textContent = message;
      container.appendChild(messageEl);

      // ✅ NOUVEAU: Container des étapes défilantes
      const stepsContainer = document.createElement('div');
      stepsContainer.classList.add('loader-steps-container');

      const currentStepEl = document.createElement('div');
      currentStepEl.classList.add('loader-current-step');
      currentStepEl.innerHTML = `
        <span class="step-icon">⏳</span>
        <span class="step-text">Initialisation...</span>
      `;

      const stepsProgressEl = document.createElement('div');
      stepsProgressEl.classList.add('loader-steps-progress');
      stepsProgressEl.style.width = '0%';

      stepsContainer.appendChild(currentStepEl);
      stepsContainer.appendChild(stepsProgressEl);
      container.appendChild(stepsContainer);

      // Container du cercle
      const circleContainer = document.createElement('div');
      circleContainer.classList.add('loader-circle-container');

      // SVG du cercle de progression
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('loader-svg');
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

      // Cercle de fond
      const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleBg.classList.add('loader-circle-bg');
      circleBg.setAttribute('cx', center);
      circleBg.setAttribute('cy', center);
      circleBg.setAttribute('r', radius);

      // Cercle de glow (effet lumineux)
      const circleGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleGlow.classList.add('loader-circle-glow');
      circleGlow.setAttribute('cx', center);
      circleGlow.setAttribute('cy', center);
      circleGlow.setAttribute('r', radius);

      // Cercle de progression principal
      const circleProgress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleProgress.classList.add('loader-circle-progress');
      circleProgress.setAttribute('cx', center);
      circleProgress.setAttribute('cy', center);
      circleProgress.setAttribute('r', radius);

      // Texte du pourcentage
      const percentageEl = document.createElement('div');
      percentageEl.classList.add('loader-percentage');
      percentageEl.textContent = '0%';

      // Assemblage du SVG
      svg.appendChild(circleBg);
      if (showScanEffect) svg.appendChild(circleGlow);
      svg.appendChild(circleProgress);
      
      circleContainer.appendChild(svg);
      circleContainer.appendChild(percentageEl);
      container.appendChild(circleContainer);

      // Container des particules
      if (showParticles) {
        const particlesContainer = document.createElement('div');
        particlesContainer.classList.add('loader-particles');
        
        // Générer des particules
        for (let i = 0; i < 8; i++) {
          const particle = document.createElement('div');
          particle.classList.add('loader-particle');
          particle.style.left = Math.random() * 80 + 10 + '%';
          particle.style.animationDelay = (Math.random() * 2) + 's';
          particlesContainer.appendChild(particle);
        }
        
        container.appendChild(particlesContainer);
      }

      // ✅ FONCTION pour mettre à jour l'étape actuelle
      const updateCurrentStep = (progressPercentage) => {
        // Trouver l'étape correspondant à la progression
        for (let i = processSteps.length - 1; i >= 0; i--) {
          if (progressPercentage >= processSteps[i].progress) {
            if (currentStepIndex !== i) {
              currentStepIndex = i;
              const step = processSteps[i];
              
              // Nettoyer le texte (enlever l'icône si elle est au début)
              let cleanText = step.text;
              if (cleanText.startsWith(step.icon)) {
                cleanText = cleanText.replace(step.icon, '').trim();
              }
              
              // Animer le changement d'étape
              currentStepEl.style.animation = 'none';
              currentStepEl.offsetHeight; // Force reflow
              currentStepEl.style.animation = 'stepFadeIn 0.6s ease-out';
              
              // Mettre à jour le contenu
              currentStepEl.innerHTML = `
                <span class="step-icon">${step.icon || '⚙️'}</span>
                <span class="step-text">${cleanText}</span>
              `;
              
              // Mettre à jour la barre de progression des étapes
              const stepProgress = ((i + 1) / processSteps.length) * 100;
              stepsProgressEl.style.width = stepProgress + '%';
              
              console.log(`📍 Étape ${i + 1}/${processSteps.length}: ${cleanText}`);
            }
            break;
          }
        }
      };

      // Fonction de mise à jour de la progression
      const updateProgress = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        progress = Math.min(elapsed / duration, 1);
        const percentage = Math.round(progress * 100);

        // Mettre à jour le cercle de progression
        const offset = circumference - (progress * circumference);
        circleProgress.style.strokeDashoffset = offset;
        if (showScanEffect) {
          circleGlow.style.strokeDashoffset = offset;
        }

        // Mettre à jour le pourcentage
        percentageEl.textContent = percentage + '%';

        // ✅ NOUVEAU: Mettre à jour l'étape actuelle
        updateCurrentStep(percentage);

        // Changer les couleurs selon la progression
        container.classList.remove('progress-low', 'progress-medium', 'progress-high', 'progress-complete');
        if (progress < 0.25) {
          container.classList.add('progress-low');
        } else if (progress < 0.75) {
          container.classList.add('progress-medium');
        } else if (progress < 1) {
          container.classList.add('progress-high');
        } else {
          container.classList.add('progress-complete');
        }

        // Continuer l'animation ou terminer
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          // Animation de fin
          container.classList.add('completed');
          
          // Attendre un peu avant d'envoyer la réponse
          setTimeout(() => {
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                completed: true,
                duration: duration,
                stepsCompleted: processSteps.length,
                instanceId: uniqueInstanceId
              }
            });
          }, 1000);
        }
      };

      // Ajouter au DOM
      element.appendChild(container);

      // Démarrer l'animation
      animationFrameId = requestAnimationFrame(updateProgress);

      // Fonction de nettoyage
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };

      console.log(`✅ LoaderExtension prêt (ID: ${uniqueInstanceId}) - ${duration}s avec ${processSteps.length} étapes`);

    } catch (err) {
      console.error('❌ LoaderExtension Error:', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message }
      });
    }
  }
};

export default LoaderExtension;
