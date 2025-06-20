/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  DownloadReport – ChatInnov Edition                       ║
 *  ║                                                           ║
 *  ║  • Design premium avec bannière violet                   ║
 *  ║  • Export HTML (navigateur) / PDF / Markdown             ║
 *  ║  • Style professionnel ChatInnov                         ║
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
        iconText: '📥',
        formats: ['html', 'pdf', 'md']
      };

      // Parser le payload - VERSION CORRIGÉE
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

      // Container principal
      const container = document.createElement('div');
      container.className = 'download-report-container';
      
      // Styles minimalistes alignés avec CopyButton
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        /* Container aligné avec CopyButton */
        .download-report-container {
          display: inline-flex !important;
          margin-left: 8px !important;
          vertical-align: top !important;
        }

        /* Bouton principal - même style que CopyButton */
        .download-report-main {
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

        .download-report-main:hover {
          background: rgba(0, 0, 0, 0.05) !important;
          border-color: rgba(0, 0, 0, 0.1) !important;
        }

        /* Menu des formats */
        .download-report-menu {
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
        }

        .download-report-menu.show {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Options de format */
        .download-report-option {
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

        .download-report-option:hover {
          background: #f0f0f0 !important;
        }

        /* État de génération */
        .download-report-main.generating {
          opacity: 0.6 !important;
          cursor: wait !important;
        }

        .download-report-main.generating .download-report-icon {
          animation: spin 1s linear infinite !important;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;

      container.appendChild(styleEl);

      // Créer les éléments UI
      const wrapper = document.createElement('div');
      wrapper.className = 'download-report-wrapper';
      wrapper.style.position = 'relative';

      const mainButton = document.createElement('button');
      mainButton.className = 'download-report-main';
      mainButton.innerHTML = `<span class="download-report-icon">${config.iconText}</span>`;
      mainButton.title = 'Télécharger le rapport';

      const menu = document.createElement('div');
      menu.className = 'download-report-menu';

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
        option.className = 'download-report-option';
        option.innerHTML = `
          <span class="download-report-option-icon">${formatIcons[format]}</span>
          <span>${formatLabels[format]}</span>
        `;
        option.addEventListener('click', () => downloadReport(format));
        menu.appendChild(option);
      });

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

      // Fonction pour générer le Markdown
      const generateMarkdown = () => {
        const date = new Date();
        const dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR');
        
        let md = `# ${config.marketTitle}\n\n`;
        md += `> ${config.presentation_text}\n\n`;
        md += `**Date de génération :** ${dateStr}\n\n`;
        md += `---\n\n`;
        
        // Convertir le contenu en Markdown
        let content = config.content;
        
        // Si c'est du HTML, on le convertit
        if (content.includes('<')) {
          // D'abord, convertir les tableaux
          content = content.replace(/<table[^>]*>.*?<\/table>/gis, (match) => {
            return tableToMarkdown(match);
          });
          
          // Puis le reste du HTML
          content = content
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>.*?🔷.*?<\/span>\s*(.*?)<\/h2>/gi, '## 🔷 $1\n\n')
            .replace(/<h3[^>]*>.*?🔹.*?<\/span>\s*(.*?)<\/h3>/gi, '### 🔹 $1\n\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<ul[^>]*>|<\/ul>/gi, '')
            .replace(/<ol[^>]*>|<\/ol>/gi, '')
            .replace(/<span[^>]*class="no-gradient"[^>]*>(.*?)<\/span>/gi, '$1')
            .replace(/<div[^>]*style[^>]*>.*?<\/div>/gis, function(match) {
              const content = match.replace(/<[^>]+>/g, '');
              return `\n> ${content}\n\n`;
            })
            .replace(/<[^>]+>/g, '');
        } else {
          // Si c'est du texte brut avec tableau format texte
          // Détecter et formater les tableaux texte
          const lines = content.split('\n');
          let inTable = false;
          let tableData = [];
          let processedContent = [];
          
          lines.forEach((line, index) => {
            // Détecter le début d'un tableau
            if (line.includes('\t') && !inTable) {
              inTable = true;
              tableData = [];
            }
            
            if (inTable) {
              if (line.includes('\t')) {
                tableData.push(line.split('\t').map(cell => cell.trim()));
              } else if (line.trim() === '' || !line.includes('\t')) {
                // Fin du tableau, le convertir en Markdown
                if (tableData.length > 0) {
                  // Headers
                  processedContent.push('| ' + tableData[0].join(' | ') + ' |');
                  processedContent.push('| ' + tableData[0].map(() => '---').join(' | ') + ' |');
                  
                  // Rows
                  for (let i = 1; i < tableData.length; i++) {
                    processedContent.push('| ' + tableData[i].join(' | ') + ' |');
                  }
                  processedContent.push('');
                }
                inTable = false;
                if (line.trim() !== '') {
                  processedContent.push(line);
                }
              }
            } else {
              // Formatage normal
              line = line.trim();
              if (!line) {
                processedContent.push('');
              } else if (line.startsWith('🔷')) {
                processedContent.push(`## ${line}\n`);
              } else if (line.startsWith('🔹')) {
                processedContent.push(`### ${line}\n`);
              } else if (/^\d+\./.test(line) && line.length < 100) {
                processedContent.push(`#### ${line}\n`);
              } else if (line.startsWith('•') || line.startsWith('-')) {
                processedContent.push(`- ${line.substring(1).trim()}`);
              } else {
                processedContent.push(line);
              }
            }
          });
          
          content = processedContent.join('\n');
        }
        
        md += content;
        md += `\n\n---\n\n*Rapport généré par ChatInnov*`;
        
        return md;
      };

      // Fonction pour générer le PDF - VERSION CORRIGÉE
// Fonction pour générer le PDF - VERSION CORRIGÉE AVEC TABLEAUX
const generatePDF = async () => {
  // Charger jsPDF si nécessaire
  if (!window.jspdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });
  
  // Ajouter une police qui supporte l'UTF-8
  doc.setFont('helvetica');
  
  // Configuration
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const lineHeight = 7;
  const maxWidth = pageWidth - 2 * margin;
  
  // Header avec couleur violette
  doc.setFillColor(124, 58, 237); // #7c3aed
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Titre en blanc
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(config.marketTitle, maxWidth);
  titleLines.forEach((line, index) => {
    doc.text(line, margin, 25 + (index * 8));
  });
  
  // Date
  doc.setFontSize(10);
  const date = new Date();
  const dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR');
  doc.text(dateStr, margin, 42);
  
  yPosition = 65;
  
  // Tagline
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(9);
  const taglineLines = doc.splitTextToSize(config.presentation_text, maxWidth);
  taglineLines.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });
  
  yPosition += 10;
  
  // Contenu principal
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  
  // Préparer le contenu en nettoyant le HTML et en préservant la structure
  let textContent = config.content;
  
  // Si c'est du HTML, extraire le texte proprement
  if (textContent.includes('<')) {
    // Créer un élément temporaire pour parser le HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    
    // Fonction récursive pour extraire le texte avec structure
    const extractText = (element, result = []) => {
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) result.push(text);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          
          // Ajouter des marqueurs pour la structure
          if (tagName === 'h2') {
            result.push('\n[H2] ' + node.textContent.trim() + '\n');
          } else if (tagName === 'h3') {
            result.push('\n[H3] ' + node.textContent.trim() + '\n');
          } else if (tagName === 'h4') {
            result.push('\n[H4] ' + node.textContent.trim() + '\n');
          } else if (tagName === 'p') {
            result.push(node.textContent.trim() + '\n');
          } else if (tagName === 'li') {
            result.push('• ' + node.textContent.trim() + '\n');
          } else if (tagName === 'table') {
            // NOUVEAU : Extraire le contenu du tableau de manière structurée
            result.push('\n[TABLE_START]\n');
            
            // Caption
            const caption = node.querySelector('caption');
            if (caption) {
              result.push('[CAPTION] ' + caption.textContent.trim() + '\n');
            }
            
            // Headers
            const headers = node.querySelectorAll('thead th, tbody tr:first-child th');
            if (headers.length > 0) {
              result.push('[HEADERS] ');
              headers.forEach((header, index) => {
                result.push(header.textContent.trim());
                if (index < headers.length - 1) result.push(' | ');
              });
              result.push('\n');
            }
            
            // Body rows
            const rows = node.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const cells = row.querySelectorAll('td');
              if (cells.length > 0) {
                result.push('[ROW] ');
                cells.forEach((cell, index) => {
                  result.push(cell.textContent.trim());
                  if (index < cells.length - 1) result.push(' | ');
                });
                result.push('\n');
              }
            });
            
            // Footer
            const footer = node.querySelector('tfoot');
            if (footer) {
              result.push('[FOOTER] ' + footer.textContent.trim() + '\n');
            }
            
            result.push('[TABLE_END]\n\n');
          } else {
            extractText(node, result);
          }
        }
      }
      return result;
    };
    
    const textArray = extractText(tempDiv);
    textContent = textArray.join('');
  } else if (!textContent.includes('[TABLE_START]')) {
    // Si c'est du texte brut avec des tableaux format tabulé
    const lines = textContent.split('\n');
    let processedLines = [];
    let inTable = false;
    let tableBuffer = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Détecter les lignes de tableau (contiennent des | ou des tabs)
      if ((line.includes('\t') || line.includes('|')) && line.trim() !== '') {
        if (!inTable) {
          inTable = true;
          processedLines.push('[TABLE_START]');
          
          // Chercher un titre de tableau dans les lignes précédentes
          if (i > 0 && lines[i-1].trim() !== '' && !lines[i-1].includes('\t') && !lines[i-1].includes('|')) {
            processedLines.push('[CAPTION] ' + lines[i-1].trim());
          }
        }
        
        // Traiter la ligne de tableau
        const cells = line.split(/\t|\|/).map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          // Première ligne = headers
          if (tableBuffer.length === 0) {
            processedLines.push('[HEADERS] ' + cells.join(' | '));
          } else {
            processedLines.push('[ROW] ' + cells.join(' | '));
          }
          tableBuffer.push(cells);
        }
      } else if (inTable) {
        // Fin du tableau
        if (line.includes('Source:')) {
          processedLines.push('[FOOTER] ' + line.trim());
        }
        processedLines.push('[TABLE_END]');
        inTable = false;
        tableBuffer = [];
        
        if (line.trim() !== '' && !line.includes('Source:')) {
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    if (inTable) {
      processedLines.push('[TABLE_END]');
    }
    
    textContent = processedLines.join('\n');
  }
  
  // Nettoyer les caractères problématiques
  textContent = textContent
    .replace(/[^\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, '') // Garder Latin étendu
    .replace(/🔷/g, '[>]')
    .replace(/🔹/g, '[•]')
    .replace(/📋/g, '[DOC]')
    .replace(/✅/g, '[OK]')
    .replace(/•/g, '•')
    .replace(/–/g, '-')
    .replace(/—/g, '--')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"');
  
  // Diviser le contenu en lignes et traiter
  const lines = textContent.split('\n');
  let inTable = false;
  let tableData = {
    caption: '',
    headers: [],
    rows: [],
    footer: ''
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '[TABLE_START]') {
      inTable = true;
      tableData = { caption: '', headers: [], rows: [], footer: '' };
      continue;
    } else if (line === '[TABLE_END]') {
      inTable = false;
      
      // Dessiner le tableau
      if (tableData.headers.length > 0 || tableData.rows.length > 0) {
        yPosition += 5;
        
        // Caption
        if (tableData.caption) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          const captionLines = doc.splitTextToSize(tableData.caption, maxWidth);
          captionLines.forEach(captionLine => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(captionLine, margin, yPosition);
            yPosition += lineHeight;
          });
          doc.setFont(undefined, 'normal');
          doc.setFontSize(11);
          yPosition += 2;
        }
        
        // Calculer la largeur des colonnes
        const numCols = Math.max(tableData.headers.length, 
          ...tableData.rows.map(row => row.length));
        const colWidth = maxWidth / numCols;
        
        // Headers avec fond violet clair
        if (tableData.headers.length > 0) {
          doc.setFillColor(237, 233, 254); // Violet très clair
          doc.rect(margin, yPosition - 5, maxWidth, 8, 'F');
          doc.setFont(undefined, 'bold');
          doc.setFontSize(9);
          
          tableData.headers.forEach((header, index) => {
            const headerText = header.substring(0, Math.floor(colWidth / 2));
            doc.text(headerText, margin + (index * colWidth) + 2, yPosition);
          });
          
          yPosition += 8;
          doc.setFont(undefined, 'normal');
        }
        
        // Rows
        doc.setFontSize(9);
        tableData.rows.forEach((row, rowIndex) => {
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin;
          }
          
          // Alternance de couleurs de fond
          if (rowIndex % 2 === 1) {
            doc.setFillColor(248, 249, 250);
            doc.rect(margin, yPosition - 4, maxWidth, 6, 'F');
          }
          
          row.forEach((cell, index) => {
            const cellText = cell.substring(0, Math.floor(colWidth / 2));
            doc.text(cellText, margin + (index * colWidth) + 2, yPosition);
          });
          
          yPosition += 6;
        });
        
        // Footer
        if (tableData.footer) {
          doc.setFontSize(8);
          doc.setFont(undefined, 'italic');
          doc.setTextColor(100);
          const footerLines = doc.splitTextToSize(tableData.footer, maxWidth);
          footerLines.forEach(footerLine => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(footerLine, margin, yPosition);
            yPosition += 5;
          });
          doc.setTextColor(0);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(11);
        }
        
        yPosition += 5;
      }
      continue;
    }
    
    if (inTable) {
      // Parser les données du tableau
      if (line.startsWith('[CAPTION]')) {
        tableData.caption = line.replace('[CAPTION]', '').trim();
      } else if (line.startsWith('[HEADERS]')) {
        tableData.headers = line.replace('[HEADERS]', '').trim().split('|').map(h => h.trim());
      } else if (line.startsWith('[ROW]')) {
        tableData.rows.push(line.replace('[ROW]', '').trim().split('|').map(c => c.trim()));
      } else if (line.startsWith('[FOOTER]')) {
        tableData.footer = line.replace('[FOOTER]', '').trim();
      }
    } else if (line) {
      // Traitement du texte normal
      if (line.startsWith('[H2]')) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        const text = line.replace('[H2]', '').trim();
        const textLines = doc.splitTextToSize(text, maxWidth);
        textLines.forEach(textLine => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(textLine, margin, yPosition);
          yPosition += lineHeight + 2;
        });
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        yPosition += 3;
      } else if (line.startsWith('[H3]')) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        const text = line.replace('[H3]', '').trim();
        const textLines = doc.splitTextToSize(text, maxWidth);
        textLines.forEach(textLine => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(textLine, margin, yPosition);
          yPosition += lineHeight + 1;
        });
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        yPosition += 2;
      } else if (line.startsWith('[H4]')) {
        doc.setFont(undefined, 'bold');
        const text = line.replace('[H4]', '').trim();
        const textLines = doc.splitTextToSize(text, maxWidth);
        textLines.forEach(textLine => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(textLine, margin, yPosition);
          yPosition += lineHeight;
        });
        doc.setFont(undefined, 'normal');
        yPosition += 2;
      } else {
        // Texte normal
        const textLines = doc.splitTextToSize(line, maxWidth);
        textLines.forEach(textLine => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(textLine, margin, yPosition);
          yPosition += lineHeight;
        });
      }
    }
  }
  
  // Footer sur la dernière page
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('© ChatInnov - Rapport généré automatiquement', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return doc;
};

      // Fonction de téléchargement
      const downloadReport = async (format) => {
        mainButton.classList.add('generating');
        mainButton.querySelector('.download-report-icon').textContent = '⏳';
        menu.classList.remove('show');
        
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
          const existingToast = document.querySelector('.copy-button-toast');
          if (existingToast) {
            const successMessage = format === 'html' 
              ? 'Rapport ouvert dans un nouvel onglet' 
              : `${formatLabels[format]} téléchargé avec succès`;
            existingToast.textContent = successMessage;
            existingToast.classList.add('show');
            setTimeout(() => existingToast.classList.remove('show'), 1500);
          }
          
          console.log(`✅ Rapport ${format.toUpperCase()} généré : ${fileName}`);
          
        } catch (error) {
          console.error('❌ Erreur de génération:', error);
        } finally {
          mainButton.classList.remove('generating');
          mainButton.querySelector('.download-report-icon').textContent = config.iconText;
        }
      };

      // Gestion des événements
      let menuVisible = false;
      
      mainButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!menuVisible) {
          menu.classList.add('show');
          menuVisible = true;
        } else {
          menu.classList.remove('show');
          menuVisible = false;
        }
      });

      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && menuVisible) {
          menu.classList.remove('show');
          menuVisible = false;
        }
      });

      // Assemblage
      wrapper.appendChild(mainButton);
      wrapper.appendChild(menu);
      container.appendChild(wrapper);
      element.appendChild(container);
      
      console.log('✅ DownloadReport ChatInnov prêt');
      console.log('Config finale:', {
        marketTitle: config.marketTitle,
        contentLength: config.content.length,
        contentPreview: config.content.substring(0, 100) + '...'
      });
      
    } catch (error) {
      console.error('❌ DownloadReport Error:', error);
    }
  }
};

export default DownloadReport;
