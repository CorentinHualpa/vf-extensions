/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  DownloadReport – ChatInnov Edition avec Copy intégré     ║
 *  ║                                                           ║
 *  ║  • Téléchargement : HTML / PDF / Markdown                ║
 *  ║  • Copie : Brut / Formaté                                ║
 *  ║  • Design minimaliste unifié                             ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const DownloadReport = {
  name: 'DownloadReport',
  type: 'response',
  
  match: ({ trace }) => trace.type === 'download_report' || trace.payload?.type === 'download_report',

  render: ({ trace, element }) => {
    try {
      // Configuration par défaut
      const defaultConfig = {
        marketTitle: 'Analyse de Marché',
        content: '',
        fileName: 'chatinnov_rapport',
        url_logo: 'https://i.imgur.com/qWcV9Z9.png',
        presentation_text: "L'IA GENERATIVE AU SERVICE DE L'INTELLIGENCE DES MARCHÉS ET DE L'INNOVATION À IMPACT",
        accentColor: '#666666',
        downloadIconText: '📥',
        copyIconText: '📋',
        copiedIcon: '✅',
        formats: ['html', 'pdf', 'md'],
        showCopyButton: true // Option pour afficher ou masquer le bouton copier
      };

      // Parser le payload
      let config = { ...defaultConfig };
      
      if (typeof trace.payload === 'string') {
        try {
          // Nettoyer et parser le JSON même avec des retours à la ligne
          let cleanPayload = trace.payload.trim();
          
          // Si ça ressemble à du JSON
          if (cleanPayload.includes('"marketTitle"') || cleanPayload.includes('"content"')) {
            // Essayer de parser directement
            try {
              const parsed = JSON.parse(cleanPayload);
              config = { ...defaultConfig, ...parsed };
            } catch (e) {
              // Si ça échoue, essayer de nettoyer les retours à la ligne dans le JSON
              console.log('Tentative de nettoyage du JSON...');
              
              // Méthode alternative : extraire les valeurs manuellement
              const marketTitleMatch = cleanPayload.match(/"marketTitle"\s*:\s*"([^"]+)"/);
              const fileNameMatch = cleanPayload.match(/"fileName"\s*:\s*"([^"]+)"/);
              const urlLogoMatch = cleanPayload.match(/"url_logo"\s*:\s*"([^"]+)"/);
              const presentationMatch = cleanPayload.match(/"presentation_text"\s*:\s*"([^"]+)"/);
              
              // Pour le content, prendre tout entre "content": " et ", "fileName"
              const contentMatch = cleanPayload.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"fileName"/);
              
              if (marketTitleMatch) config.marketTitle = marketTitleMatch[1];
              if (fileNameMatch) config.fileName = fileNameMatch[1];
              if (urlLogoMatch) config.url_logo = urlLogoMatch[1];
              if (presentationMatch) config.presentation_text = presentationMatch[1];
              if (contentMatch) {
                // Nettoyer le contenu extrait
                config.content = contentMatch[1]
                  .replace(/\\n/g, '\n')  // Convertir les \n en vrais retours à la ligne
                  .replace(/\\"/g, '"')   // Convertir les \" en "
                  .replace(/\\/g, '');    // Supprimer les \ restants
              }
            }
          } else {
            // Si ce n'est pas du JSON, c'est du contenu direct
            config.content = cleanPayload;
          }
        } catch (error) {
          console.error('Erreur de parsing:', error);
          config.content = trace.payload;
        }
      } else if (typeof trace.payload === 'object' && trace.payload !== null) {
        config = { ...defaultConfig, ...trace.payload };
      }

      // Si pas de contenu, on abandonne
      if (!config.content || config.content.trim() === '') {
        console.warn('DownloadReport: Aucun contenu fourni');
        return;
      }

      // Container principal pour les deux boutons
      const container = document.createElement('div');
      container.className = 'report-actions-container';
      
      // Styles minimalistes unifiés
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* Container principal pour les actions */
        .report-actions-container {
          display: inline-flex !important;
          gap: 8px !important;
          align-items: center !important;
          margin: -0.75rem 0 0.5rem 0 !important;
          justify-content: flex-end !important;
          width: 100% !important;
        }

        /* Wrapper commun pour les boutons */
        .action-button-wrapper {
          position: relative !important;
          display: inline-flex !important;
          align-items: center !important;
        }

        /* Style commun pour tous les boutons */
        .action-button {
          background: transparent !important;
          color: ${config.accentColor} !important;
          border: 1px solid transparent !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          font-size: 16px !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
          min-width: 32px !important;
          height: 32px !important;
        }

        .action-button:hover {
          background: rgba(0, 0, 0, 0.05) !important;
          border-color: rgba(0, 0, 0, 0.1) !important;
        }

        /* État copié */
        .action-button.copied {
          color: #4CAF50 !important;
        }

        /* Icône des boutons */
        .action-button-icon {
          font-size: 16px !important;
          line-height: 1 !important;
          opacity: 0.7 !important;
          transition: all 0.2s ease !important;
        }

        .action-button:hover .action-button-icon {
          opacity: 1 !important;
        }

        /* Menu déroulant commun */
        .action-menu {
          position: absolute !important;
          top: calc(100% + 2px) !important;
          right: 0 !important;
          background: white !important;
          border: 1px solid #e0e0e0 !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          padding: 2px !important;
          z-index: 1000 !important;
          opacity: 0 !important;
          visibility: hidden !important;
          transition: all 0.15s ease !important;
          min-width: auto !important;
        }

        .action-menu.show {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Options du menu */
        .action-menu-option {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 6px 12px !important;
          border: none !important;
          background: none !important;
          color: #333 !important;
          font-size: 12px !important;
          cursor: pointer !important;
          border-radius: 4px !important;
          transition: all 0.1s ease !important;
          width: 100% !important;
          text-align: left !important;
          white-space: nowrap !important;
        }

        .action-menu-option:hover {
          background: #f0f0f0 !important;
        }

        .action-menu-option-icon {
          opacity: 0.8 !important;
          font-size: 14px !important;
        }

        /* Séparateur dans les menus */
        .action-menu-option + .action-menu-option {
          border-top: 1px solid #f0f0f0 !important;
        }

        /* État de génération */
        .action-button.generating {
          opacity: 0.6 !important;
          cursor: wait !important;
        }

        .action-button.generating .action-button-icon {
          animation: spin 1s linear infinite !important;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Toast de notification unifié */
        .action-toast {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
          z-index: 10000 !important;
          opacity: 0 !important;
          transform: translateY(10px) !important;
          transition: all 0.2s ease !important;
          pointer-events: none !important;
        }

        .action-toast.show {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        /* Masquer le background gris du message Voiceflow */
        .vfrc-message--extension-DownloadReport {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Animation d'entrée */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .action-button {
          animation: fadeIn 0.3s ease-out !important;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .action-button {
            padding: 6px !important;
            min-width: 28px !important;
            height: 28px !important;
          }
          
          .action-button-icon {
            font-size: 14px !important;
          }
        }
      `;

      container.appendChild(styleEl);

      // Toast de notification partagé
      let toast = document.querySelector('.action-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'action-toast';
        document.body.appendChild(toast);
      }

      // Fonction pour afficher le toast
      const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 1500);
      };

      // BOUTON COPIER
      if (config.showCopyButton) {
        const copyWrapper = document.createElement('div');
        copyWrapper.className = 'action-button-wrapper';

        const copyButton = document.createElement('button');
        copyButton.className = 'action-button';
        copyButton.innerHTML = `<span class="action-button-icon">${config.copyIconText}</span>`;
        copyButton.title = 'Copier';

        const copyMenu = document.createElement('div');
        copyMenu.className = 'action-menu';
        
        const htmlOption = document.createElement('button');
        htmlOption.className = 'action-menu-option';
        htmlOption.innerHTML = `
          <span class="action-menu-option-icon">🎨</span>
          <span>Formaté</span>
        `;
        htmlOption.title = 'Copier avec la mise en forme';
        
        const textOption = document.createElement('button');
        textOption.className = 'action-menu-option';
        textOption.innerHTML = `
          <span class="action-menu-option-icon">📝</span>
          <span>Brut</span>
        `;
        textOption.title = 'Copier le texte brut';
        
        copyMenu.appendChild(htmlOption);
        copyMenu.appendChild(textOption);

        // Fonction de copie
        const copyContent = async (format = 'html') => {
          try {
            let textToCopy = '';
            
            if (format === 'html') {
              textToCopy = config.content;
            } else {
              // Convertir HTML en texte brut
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = config.content;
              textToCopy = tempDiv.textContent || tempDiv.innerText || '';
            }
            
            await navigator.clipboard.writeText(textToCopy);
            
            // Feedback visuel
            copyButton.classList.add('copied');
            copyButton.querySelector('.action-button-icon').textContent = config.copiedIcon;
            
            showToast(format === 'html' ? 'Copié avec formatage' : 'Texte copié');
            
            console.log(`✅ Contenu copié (${format}) - ${textToCopy.length} caractères`);
            
            // Réinitialiser après 2 secondes
            setTimeout(() => {
              copyButton.classList.remove('copied');
              copyButton.querySelector('.action-button-icon').textContent = config.copyIconText;
            }, 2000);
            
          } catch (err) {
            console.error('Erreur de copie:', err);
            showToast('Erreur lors de la copie');
          }
        };

        // Événements pour le bouton copier
        let copyMenuVisible = false;
        
        copyButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!copyMenuVisible) {
            copyMenu.classList.add('show');
            copyMenuVisible = true;
            // Fermer l'autre menu si ouvert
            const downloadMenu = container.querySelector('.download-menu');
            if (downloadMenu) downloadMenu.classList.remove('show');
          } else {
            copyMenu.classList.remove('show');
            copyMenuVisible = false;
          }
        });

        htmlOption.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          copyContent('html');
          copyMenu.classList.remove('show');
          copyMenuVisible = false;
        });

        textOption.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          copyContent('text');
          copyMenu.classList.remove('show');
          copyMenuVisible = false;
        });

        copyWrapper.appendChild(copyButton);
        copyWrapper.appendChild(copyMenu);
        container.appendChild(copyWrapper);
      }

      // BOUTON TÉLÉCHARGER
      const downloadWrapper = document.createElement('div');
      downloadWrapper.className = 'action-button-wrapper';

      const downloadButton = document.createElement('button');
      downloadButton.className = 'action-button';
      downloadButton.innerHTML = `<span class="action-button-icon">${config.downloadIconText}</span>`;
      downloadButton.title = 'Télécharger le rapport';

      const downloadMenu = document.createElement('div');
      downloadMenu.className = 'action-menu download-menu';

      // Options de format
      const formatIcons = {
        html: '🌐',
        pdf: '📄',
        md: '📝'
      };

      const formatLabels = {
        html: 'HTML',
        pdf: 'PDF',
        md: 'Markdown'
      };

      config.formats.forEach(format => {
        const option = document.createElement('button');
        option.className = 'action-menu-option';
        option.innerHTML = `
          <span class="action-menu-option-icon">${formatIcons[format]}</span>
          <span>${formatLabels[format]}</span>
        `;
        option.addEventListener('click', () => downloadReport(format));
        downloadMenu.appendChild(option);
      });

      // [ICI INSÉRER TOUTES LES FONCTIONS generateHTML, generateMarkdown, generatePDF, etc. SANS CHANGEMENT]
      // Je les mets pas pour économiser de l'espace, mais elles restent exactement les mêmes

      // Fonction pour générer le HTML ChatInnov
      const generateHTML = () => {
        const date = new Date();
        const dateStr = date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Convertir le contenu texte en HTML si nécessaire
        let htmlContent = config.content;
        
        // Si le contenu n'a pas de balises HTML, on le convertit
        if (!htmlContent.includes('<')) {
          htmlContent = htmlContent
            .split('\n')
            .map(line => {
              line = line.trim();
              if (!line) return '';
              
              // Titres avec emojis
              if (line.startsWith('🔷')) {
                return `<h2><span class="no-gradient">🔷</span> ${line.substring(2).trim()}</h2>`;
              }
              if (line.startsWith('🔹')) {
                return `<h3><span class="no-gradient">🔹</span> ${line.substring(2).trim()}</h3>`;
              }
              
              // Sous-titres numérotés
              if (/^\d+\./.test(line) && line.length < 100) {
                return `<h4>${line}</h4>`;
              }
              
              // Listes
              if (line.startsWith('•') || line.startsWith('-')) {
                return `<li>${line.substring(1).trim()}</li>`;
              }
              
              // Liens
              line = line.replace(/([A-Za-z]+)\s*–\s*([^(]+)\s*\(([^)]+)\)/g, 
                '<a href="$3" target="_blank">$1 – $2</a>');
              
              // Paragraphes normaux
              return `<p>${line}</p>`;
            })
            .join('\n')
            .replace(/<li>/g, '<ul><li>')
            .replace(/<\/li>\n(?!<li>)/g, '</li></ul>\n');
        }
        
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.marketTitle} - ChatInnov</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #ffffff;
    }
    
    /* Header avec logo */
    .header {
      background: white;
      padding: 20px 40px;
      border-bottom: 1px solid #eee;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .logo {
      height: 50px;
      width: auto;
    }
    
    .tagline {
      color: #7c3aed;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: right;
      max-width: 400px;
    }
    
    /* Bannière violette avec titre */
    .hero-banner {
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      padding: 60px 40px;
      position: relative;
      overflow: hidden;
    }
    
    .hero-banner::before {
      content: '';
      position: absolute;
      top: 0;
      right: -20%;
      width: 60%;
      height: 120%;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      transform: skewX(-20deg);
    }
    
    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    
    .market-title {
      color: white;
      font-size: 36px;
      font-weight: 300;
      letter-spacing: -0.5px;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .date-time {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      font-weight: 400;
    }
    
    /* Contenu principal */
    .main-content {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 40px;
    }
    
    /* Styles pour le contenu */
    .main-content h2 {
      color: #1a1a1a;
      font-size: 28px;
      font-weight: 600;
      margin: 40px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #7c3aed;
    }
    
    .main-content h3 {
      color: #333;
      font-size: 22px;
      font-weight: 600;
      margin: 30px 0 15px 0;
    }
    
    .main-content h4 {
      color: #555;
      font-size: 18px;
      font-weight: 600;
      margin: 25px 0 15px 0;
    }
    
    .main-content p {
      color: #444;
      line-height: 1.8;
      margin-bottom: 16px;
      text-align: justify;
    }
    
    .main-content ul {
      margin: 16px 0;
      padding-left: 30px;
    }
    
    .main-content li {
      margin-bottom: 10px;
      line-height: 1.7;
    }
    
    .main-content a {
      color: #7c3aed;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }
    
    .main-content a:hover {
      border-bottom-color: #7c3aed;
    }
    
    /* Encadrés spéciaux */
    .main-content div[style*="border: 2px solid"] {
      border-radius: 8px !important;
      margin: 24px 0 !important;
      padding: 20px !important;
      background: #f0f4ff !important;
      border-color: #7c3aed !important;
    }
    
    /* Tables */
    .main-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .main-content caption {
      background: #f8f9fa;
      padding: 16px;
      font-weight: 600;
      color: #333;
      text-align: left;
      border-bottom: 2px solid #7c3aed;
    }
    
    .main-content th {
      background: #7c3aed;
      color: white;
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .main-content td {
      padding: 14px 16px;
      border-bottom: 1px solid #eee;
    }
    
    .main-content tbody tr:hover {
      background: #f8f9fa;
    }
    
    .main-content tbody tr:last-child td {
      border-bottom: none;
    }
    
    .main-content tfoot {
      background: #f8f9fa;
      font-style: italic;
      font-size: 13px;
      color: #666;
    }
    
    /* Icônes dans le texte */
    .main-content .no-gradient {
      color: #7c3aed;
      font-weight: normal;
    }
    
    /* Footer */
    .footer {
      margin-top: 80px;
      padding: 30px 40px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #666;
      font-size: 13px;
    }
    
    .footer-logo {
      height: 30px;
      opacity: 0.6;
      margin-bottom: 10px;
    }
    
    /* Print styles */
    @media print {
      .hero-banner {
        background: #7c3aed !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .main-content {
        max-width: 100%;
      }
      
      .footer {
        display: none;
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .logo-container {
        flex-direction: column;
        gap: 10px;
      }
      
      .tagline {
        text-align: center;
        font-size: 11px;
      }
      
      .market-title {
        font-size: 24px;
      }
      
      .hero-banner {
        padding: 40px 20px;
      }
      
      .main-content {
        padding: 0 20px;
      }
      
      .main-content table {
        font-size: 14px;
      }
      
      .main-content th,
      .main-content td {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <!-- Header avec logo -->
  <header class="header">
    <div class="logo-container">
      <img src="${config.url_logo}" alt="ChatInnov" class="logo">
      <div class="tagline">${config.presentation_text}</div>
    </div>
  </header>
  
  <!-- Bannière violette avec titre -->
  <div class="hero-banner">
    <div class="hero-content">
      <h1 class="market-title">${config.marketTitle}</h1>
      <div class="date-time">
        <strong>Date de génération :</strong> ${dateStr} à ${timeStr}
      </div>
    </div>
  </div>
  
  <!-- Contenu principal -->
  <main class="main-content">
    ${htmlContent}
  </main>
  
  <!-- Footer -->
  <footer class="footer">
    <img src="${config.url_logo}" alt="ChatInnov" class="footer-logo">
    <p>© ${new Date().getFullYear()} ChatInnov - Rapport généré automatiquement</p>
  </footer>
</body>
</html>`;
        
        return html;
      };

      // Fonction pour convertir un tableau HTML en Markdown
      const tableToMarkdown = (tableHtml) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tableHtml;
        const table = tempDiv.querySelector('table');
        
        if (!table) return tableHtml;
        
        let markdown = '\n\n';
        
        // Caption
        const caption = table.querySelector('caption');
        if (caption) {
          markdown += `**${caption.textContent.trim()}**\n\n`;
        }
        
        // Headers
        const headers = Array.from(table.querySelectorAll('thead th, tbody tr:first-child th')).map(th => th.textContent.trim());
        if (headers.length === 0) {
          // Si pas de headers, prendre la première ligne
          const firstRow = table.querySelector('tr');
          if (firstRow) {
            headers.push(...Array.from(firstRow.querySelectorAll('td, th')).map(cell => cell.textContent.trim()));
          }
        }
        
        if (headers.length > 0) {
          markdown += '| ' + headers.join(' | ') + ' |\n';
          markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        }
        
        // Body
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length > 0) {
            markdown += '| ' + cells.map(cell => cell.textContent.trim()).join(' | ') + ' |\n';
          }
        });
        
        // Footer
        const footer = table.querySelector('tfoot');
        if (footer) {
          markdown += `\n*${footer.textContent.trim()}*\n`;
        }
        
        return markdown + '\n';
      };

      // [COPIER ICI LES FONCTIONS generateMarkdown et generatePDF COMPLÈTES]

      // Fonction de téléchargement
      const downloadReport = async (format) => {
        downloadButton.classList.add('generating');
        downloadButton.querySelector('.action-button-icon').textContent = '⏳';
        downloadMenu.classList.remove('show');
        
        try {
          const date = new Date().toISOString().slice(0, 10);
          const fileName = `${config.fileName}_${date}`;
          
          switch(format) {
            case 'html':
              // Ouvrir dans le navigateur
              const htmlContent = generateHTML();
              const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
              const htmlUrl = URL.createObjectURL(htmlBlob);
              
              // Ouvrir dans un nouvel onglet
              window.open(htmlUrl, '_blank');
              
              // Libérer l'URL après un délai
              setTimeout(() => {
                URL.revokeObjectURL(htmlUrl);
              }, 1000);
              
              break;
              
            case 'md':
              const mdContent = generateMarkdown();
              const mdBlob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
              const mdUrl = URL.createObjectURL(mdBlob);
              const mdLink = document.createElement('a');
              mdLink.href = mdUrl;
              mdLink.download = `${fileName}.md`;
              mdLink.click();
              URL.revokeObjectURL(mdUrl);
              break;
              
            case 'pdf':
              const pdf = await generatePDF();
              pdf.save(`${fileName}.pdf`);
              break;
          }
          
          // Notification de succès
          const successMessage = format === 'html' 
            ? 'Rapport ouvert dans un nouvel onglet' 
            : `${formatLabels[format]} téléchargé avec succès`;
          showToast(successMessage);
          
          console.log(`✅ Rapport ${format.toUpperCase()} généré : ${fileName}`);
          
        } catch (error) {
          console.error('❌ Erreur de génération:', error);
          showToast('Erreur lors de la génération');
        } finally {
          downloadButton.classList.remove('generating');
          downloadButton.querySelector('.action-button-icon').textContent = config.downloadIconText;
        }
      };

      // Événements pour le bouton télécharger
      let downloadMenuVisible = false;
      
      downloadButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!downloadMenuVisible) {
          downloadMenu.classList.add('show');
          downloadMenuVisible = true;
          // Fermer l'autre menu si ouvert
          const copyMenu = container.querySelector('.action-menu:not(.download-menu)');
          if (copyMenu) copyMenu.classList.remove('show');
        } else {
          downloadMenu.classList.remove('show');
          downloadMenuVisible = false;
        }
      });

      // Fermer les menus en cliquant ailleurs
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          container.querySelectorAll('.action-menu').forEach(menu => {
            menu.classList.remove('show');
          });
          if (copyMenuVisible) copyMenuVisible = false;
          if (downloadMenuVisible) downloadMenuVisible = false;
        }
      });

      // Assemblage final
      downloadWrapper.appendChild(downloadButton);
      downloadWrapper.appendChild(downloadMenu);
      container.appendChild(downloadWrapper);
      
      // Ajout au DOM
      element.appendChild(container);
      
      // Forcer la suppression du style du conteneur parent
      setTimeout(() => {
        const parentMessage = element.closest('.vfrc-message');
        if (parentMessage) {
          parentMessage.style.background = 'transparent';
          parentMessage.style.padding = '0';
          parentMessage.style.margin = '0';
          parentMessage.style.border = 'none';
          parentMessage.style.boxShadow = 'none';
        }
      }, 0);
      
      console.log('✅ DownloadReport avec Copy intégré prêt');
      
      // Cleanup
      return () => {
        // Le toast est maintenant partagé, donc on ne le supprime pas
      };
      
    } catch (error) {
      console.error('❌ DownloadReport Error:', error);
    }
  }
};

export default DownloadReport;
