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
