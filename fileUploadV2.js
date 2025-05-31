// === Script MultiSelect Amélioré - Meilleurs contrastes et boutons style FileUpload ===
function generateMultiSelectPayload(report_langue, options = {}) {
  const translations = {
    fr: {
      globalAllSelect: "Tout sélectionner",
      globalAllDeselect: "Tout désélectionner",
      submitButton: "✅ Valider ma sélection",
      chatDisabled: "🚫 Veuillez faire vos sélections d'abord"
    },
    en: {
      globalAllSelect: "Select all",
      globalAllDeselect: "Deselect all", 
      submitButton: "✅ Validate my selection",
      chatDisabled: "🚫 Please make your selections first"
    }
  };
  
  const t = translations[report_langue] || translations.fr;
  
  const payload = {
    // Configuration de base
    multiselect: options.multiselect !== undefined ? options.multiselect : true,
    chat: options.chat !== undefined ? options.chat : false,
    chatDisabledText: options.chatDisabledText || t.chatDisabled,
    
    // ✅ NOUVELLES COULEURS - Meilleurs contrastes
    global_button_color: options.global_button_color || '#2E7D32', // Vert plus foncé pour meilleur contraste
    
    // Configuration avancée
    totalMaxSelect: options.totalMaxSelect || 0,
    gridColumns: options.gridColumns || 0,
    optionsGap: options.optionsGap || 8, // Plus d'espacement
    buttonFontSize: options.buttonFontSize || 15,
    
    // Bouton global-all
    useGlobalAll: options.useGlobalAll || false,
    globalAllSelectText: options.globalAllSelectText || t.globalAllSelect,
    globalAllDeselectText: options.globalAllDeselectText || t.globalAllDeselect,
    
    // Texte bouton personnalisé
    global_select_button_text: options.global_select_button_text || t.submitButton,
    
    // Sections et boutons (à définir selon les besoins)
    sections: options.sections || [],
    buttons: options.buttons || [
      { 
        text: t.submitButton, 
        path: "Default",
        minSelect: options.minSelect || 1,
        color: "#2E7D32" // ✅ Vert foncé pour meilleur contraste
      }
    ],
    
    // ID d'instance
    instanceId: options.instanceId || null
  };
  
  return JSON.stringify(payload);
}

// === Exemple d'utilisation avec sections et meilleures couleurs ===
function generateChapterSelectionPayload(report_langue) {
  const translations = {
    fr: {
      title: "Sélectionnez les chapitres à inclure",
      submit: "✅ Générer le rapport avec ces chapitres",
      skip: "▶️ Utiliser tous les chapitres par défaut",
      previous: "◀️ Retour à l'étape précédente"
    },
    en: {
      title: "Select chapters to include", 
      submit: "✅ Generate report with these chapters",
      skip: "▶️ Use all chapters by default",
      previous: "◀️ Back to previous step"
    }
  };
  
  const t = translations[report_langue] || translations.fr;
  
  const sections = [
    {
      label: t.title,
      backgroundColor: '#1976D2', // ✅ Bleu plus foncé
      options: [
        { name: "📊 Résumé Exécutif", action: "executive_summary" },
        { name: "📈 Analyse Financière", action: "financial_analysis" },
        { name: "🏢 Analyse Stratégique", action: "strategic_analysis" },
        { name: "⚠️ Analyse des Risques", action: "risk_analysis" },
        { name: "🔮 Recommandations", action: "recommendations" },
        { name: "📋 Annexes", action: "appendices" }
      ]
    }
  ];
  
  const buttons = [
    { 
      text: t.submit, 
      path: "generate_report",
      minSelect: 1,
      color: "#2E7D32" // ✅ Vert foncé
    },
    { 
      text: t.skip, 
      path: "use_all_chapters",
      minSelect: 0,
      color: "#1976D2" // ✅ Bleu foncé  
    },
    { 
      text: t.previous, 
      path: "previous_step",
      minSelect: 0,
      color: "#D32F2F" // ✅ Rouge foncé
    }
  ];
  
  return generateMultiSelectPayload(report_langue, {
    multiselect: true,
    chat: false,
    sections: sections,
    buttons: buttons,
    useGlobalAll: true,
    gridColumns: 1,
    totalMaxSelect: 0, // Pas de limite
    global_button_color: '#2E7D32'
  });
}

// === Script final pour Voiceflow ===
// Utilisation simple :
dynamicPayload = generateChapterSelectionPayload(report_langue);

// Ou utilisation custom :
// dynamicPayload = generateMultiSelectPayload(report_langue, {
//   sections: [...],
//   buttons: [...],
//   global_button_color: '#1976D2',  // Couleur plus foncée
//   useGlobalAll: true
// });
