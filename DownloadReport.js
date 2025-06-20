/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  DownloadReport – Voiceflow Report Download Extension     ║
 *  ║                                                           ║
 *  ║  • Export multi-format : HTML/PDF/Markdown               ║
 *  ║  • Design minimaliste aligné avec CopyButton             ║
 *  ║  • Support multi-chapitres                               ║
 *  ║  • Métadonnées automatiques                              ║
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
        title: 'Rapport',
        imageUrl: null,
        presentation: '',
        chapters: [], // Array pour multi-chapitres
        organizationId: '',
        fileName: 'rapport',
        accentColor: '#666666',
        iconText: '📥',
        formats: ['html', 'pdf', 'md'], // Formats disponibles
        dateFormat: 'DD/MM/YYYY HH:mm'
      };

      // Parser le payload
      let config = { ...defaultConfig };
      
      if (typeof trace.payload === 'string') {
        try {
          config = { ...defaultConfig, ...JSON.parse(trace.payload) };
        } catch {
          // Si c'est juste du texte, on le met comme chapitre unique
          config.chapters = [{ title: 'Contenu', content: trace.payload }];
        }
      } else if (typeof trace.payload === 'object') {
        config = { ...defaultConfig, ...trace.payload };
        
        // Support rétrocompatibilité : si 'content' existe, le convertir en chapitre
        if (config.content && !config.chapters.length) {
          config.chapters = [{ title: 'Contenu principal', content: config.content }];
        }
      }

      // HTML du composant (à côté du CopyButton)
      const container = document.createElement('div');
      container.className = 'download-report-container';
      
      // Styles minimalistes
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

      // Créer les éléments
      const wrapper = document.createElement('div');
      wrapper.className = 'download-report-wrapper';
      wrapper.style.position = 'relative';

      const mainButton = document.createElement('button');
      mainButton.className = 'download-report-main';
      mainButton.innerHTML = `<span class="download-report-icon">${config.iconText}</span>`;
      mainButton.title = 'Télécharger le rapport';

      const menu = document.createElement('div');
      menu.className = 'download-report-menu';

      // Créer les options de format
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

      // Fonctions de génération des rapports
      const generateHTML = () => {
        const date = new Date();
        const dateStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
        
        let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    .header img {
      max-width: 300px;
      height: auto;
      margin-bottom: 20px;
    }
    .metadata {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .presentation {
      font-style: italic;
      color: #555;
      margin-bottom: 40px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .chapter {
      margin-bottom: 40px;
    }
    .chapter h2 {
      color: #2c3e50;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    ${config.imageUrl ? `<img src="${config.imageUrl}" alt="${config.title}">` : ''}
    <h1>${config.title}</h1>
  </div>
  
  <div class="metadata">
    <p><strong>Date de génération :</strong> ${dateStr}</p>
    ${config.organizationId ? `<p><strong>Organisation :</strong> ${config.organizationId}</p>` : ''}
  </div>
  
  ${config.presentation ? `<div class="presentation">${config.presentation}</div>` : ''}
  
  ${config.chapters.map(chapter => `
    <div class="chapter">
      ${chapter.title ? `<h2>${chapter.title}</h2>` : ''}
      <div class="content">${chapter.content}</div>
    </div>
  `).join('')}
</body>
</html>`;
        
        return html;
      };

      const generateMarkdown = () => {
        const date = new Date();
        const dateStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
        
        let md = `# ${config.title}\n\n`;
        
        if (config.imageUrl) {
          md += `![${config.title}](${config.imageUrl})\n\n`;
        }
        
        md += `**Date de génération :** ${dateStr}\n`;
        if (config.organizationId) {
          md += `**Organisation :** ${config.organizationId}\n`;
        }
        md += '\n---\n\n';
        
        if (config.presentation) {
          md += `> ${config.presentation}\n\n`;
        }
        
        config.chapters.forEach(chapter => {
          if (chapter.title) {
            md += `## ${chapter.title}\n\n`;
          }
          // Convertir HTML en Markdown basique
          let content = chapter.content
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<[^>]+>/g, '');
          
          md += content + '\n\n';
        });
        
        return md;
      };

      const generatePDF = async () => {
        // Charger jsPDF dynamiquement si pas déjà chargé
        if (!window.jspdf) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          document.head.appendChild(script);
          await new Promise(resolve => script.onload = resolve);
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuration de base
        let yPosition = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const lineHeight = 7;
        
        // Titre
        doc.setFontSize(20);
        doc.text(config.title, margin, yPosition);
        yPosition += 15;
        
        // Métadonnées
        doc.setFontSize(10);
        doc.setTextColor(100);
        const date = new Date();
        const dateStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
        doc.text(`Date: ${dateStr}`, margin, yPosition);
        yPosition += lineHeight;
        
        if (config.organizationId) {
          doc.text(`Organisation: ${config.organizationId}`, margin, yPosition);
          yPosition += lineHeight;
        }
        
        yPosition += 10;
        
        // Présentation
        if (config.presentation) {
          doc.setTextColor(80);
          doc.setFontSize(11);
          const presentationLines = doc.splitTextToSize(config.presentation, 170);
          presentationLines.forEach(line => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 10;
        }
        
        // Chapitres
        doc.setTextColor(0);
        config.chapters.forEach(chapter => {
          if (chapter.title) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(chapter.title, margin, yPosition);
            doc.setFont(undefined, 'normal');
            yPosition += 10;
          }
          
          doc.setFontSize(11);
          // Convertir HTML en texte
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = chapter.content;
          const text = tempDiv.textContent || tempDiv.innerText || '';
          
          const lines = doc.splitTextToSize(text, 170);
          lines.forEach(line => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
          
          yPosition += 10;
        });
        
        return doc;
      };

      const downloadReport = async (format) => {
        mainButton.classList.add('generating');
        mainButton.querySelector('.download-report-icon').textContent = '⏳';
        menu.classList.remove('show');
        
        try {
          const fileName = `${config.fileName}_${new Date().toISOString().slice(0,10)}`;
          
          switch(format) {
            case 'html':
              const htmlContent = generateHTML();
              const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
              const htmlUrl = URL.createObjectURL(htmlBlob);
              const htmlLink = document.createElement('a');
              htmlLink.href = htmlUrl;
              htmlLink.download = `${fileName}.html`;
              htmlLink.click();
              URL.revokeObjectURL(htmlUrl);
              break;
              
            case 'md':
              const mdContent = generateMarkdown();
              const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
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
          
          // Toast de succès (réutiliser celui de CopyButton si présent)
          const existingToast = document.querySelector('.copy-button-toast');
          if (existingToast) {
            existingToast.textContent = `${formatLabels[format]} téléchargé`;
            existingToast.classList.add('show');
            setTimeout(() => existingToast.classList.remove('show'), 1500);
          }
          
        } catch (error) {
          console.error('Erreur de téléchargement:', error);
        } finally {
          mainButton.classList.remove('generating');
          mainButton.querySelector('.download-report-icon').textContent = config.iconText;
        }
      };

      // Événements
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

      // Fermer le menu en cliquant ailleurs
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
      
      console.log('✅ DownloadReport prêt');
      
    } catch (error) {
      console.error('❌ DownloadReport Error:', error);
    }
  }
};

export default DownloadReport;
