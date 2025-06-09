dynamicPayload = "";
log_details = log_details || "";

// ================================
// Script de génération du payload dynamique pour WeightSelector
// ================================

// Fonction helper pour ajouter des logs
function addLog(message) {
  log_details += message + "\n";
  console.log(message);
}

// Dictionnaires de traduction pour les textes
const translations = {
  French: {
    title: "Pondération des éléments",
    subtitle: "Ajustez l'importance relative de chaque élément (total = 100%)",
    submitButton: "✅ Confirmer la pondération",
    backButton: "◀️ Revenir à l'étape précédente"
  },
  English: {
    title: "Elements Weighting",
    subtitle: "Adjust the relative importance of each element (total = 100%)",
    submitButton: "✅ Confirm weighting",
    backButton: "◀️ Go back to previous step"
  }
};

// Configuration par défaut
const defaultConfig = {
  sliderLevel: 'subsection', // 'section' ou 'subsection' - par défaut subsection pour scoring_select
  chat: false, // Chat désactivé par défaut
  gridColumns: 0, // Auto layout
  primaryColor: '#7928CA',
  
  // Sections par défaut si aucune donnée fournie
  defaultSections: [
    {
      label: "🔹 Section 1",
      color: "#7928CA",
      hasSlider: true,
      defaultWeight: 0.4,
      subsections: [
        { label: "Élément 1.1", hasSlider: true },
        { label: "Élément 1.2", hasSlider: true },
        { label: "Élément 1.3", hasSlider: true }
      ]
    },
    {
      label: "🔹 Section 2",
      color: "#2E7D32",
      hasSlider: true,
      defaultWeight: 0.35,
      subsections: [
        { label: "Élément 2.1", hasSlider: true },
        { label: "Élément 2.2", hasSlider: true }
      ]
    },
    {
      label: "🔹 Section 3",
      color: "#1976D2",
      hasSlider: true,
      defaultWeight: 0.25,
      subsections: [
        { label: "Élément 3.1", hasSlider: true },
        { label: "Élément 3.2", hasSlider: true }
      ]
    }
  ]
};

try {
  addLog("▶️ Début de la génération du payload WeightSelector");
  
  // 1. Choix de la langue
  const langue = typeof report_langue === 'string' ? report_langue : 'French';
  const tr = translations[langue === 'en' ? 'English' : 'French'];
  
  addLog(`🌐 Langue sélectionnée: ${langue}`);

  // 2. Configuration personnalisée
  const config = {
    sliderLevel: typeof weight_slider_level !== 'undefined' ? weight_slider_level : defaultConfig.sliderLevel,
    chat: typeof weight_chat_enabled !== 'undefined' ? weight_chat_enabled : defaultConfig.chat,
    gridColumns: typeof weight_grid_columns !== 'undefined' ? weight_grid_columns : defaultConfig.gridColumns,
    primaryColor: typeof weight_primary_color !== 'undefined' ? weight_primary_color : defaultConfig.primaryColor
  };
  
  addLog(`⚙️ Configuration:`);
  addLog(`  - Niveau slider: ${config.sliderLevel}`);
  addLog(`  - Chat activé: ${config.chat}`);
  addLog(`  - Colonnes: ${config.gridColumns === 0 ? 'auto' : config.gridColumns}`);
  addLog(`  - Couleur primaire: ${config.primaryColor}`);

  // 3. Traitement des sections
  let sectionsData = [];
  
  // Priorité 1: scoring_select (votre cas d'usage)
  if (typeof scoring_select !== 'undefined' && scoring_select) {
    try {
      const scoringData = typeof scoring_select === 'string' 
        ? JSON.parse(scoring_select) 
        : scoring_select;
      
      addLog(`📊 Données scoring_select reçues: ${scoringData.length} éléments`);
      
      // Grouper les données par section
      const groupedBySection = {};
      
      scoringData.forEach(item => {
        const sectionName = item.section;
        if (!groupedBySection[sectionName]) {
          groupedBySection[sectionName] = [];
        }
        groupedBySection[sectionName].push(item.bloc_contenu);
      });
      
      // Créer les sections avec couleurs automatiques
      const colors = ["#7928CA", "#2E7D32", "#1976D2", "#E53935", "#FB8C00", "#00ACC1", "#43A047", "#AB47BC", "#5E35B1", "#1E88E5"];
      let colorIndex = 0;
      
      Object.keys(groupedBySection).forEach((sectionName, idx) => {
        const section = {
          label: sectionName,
          color: colors[colorIndex % colors.length],
          hasSlider: true,
          subsections: groupedBySection[sectionName].map(content => ({
            label: content,
            hasSlider: true
          }))
        };
        sectionsData.push(section);
        colorIndex++;
        
        addLog(`  Section ${idx + 1}: "${sectionName}" avec ${section.subsections.length} sous-sections`);
      });
      
      // Forcer le mode subsection pour scoring_select
      config.sliderLevel = 'subsection';
      addLog("  Mode forcé à 'subsection' pour scoring_select");
      
    } catch (e) {
      addLog("⚠️ Erreur parsing scoring_select");
      addLog(`  Erreur: ${e.message}`);
      sectionsData = [];
    }
  }
  
  // Priorité 2: weight_sections_data
  if (sectionsData.length === 0 && typeof weight_sections_data !== 'undefined' && weight_sections_data) {
    try {
      sectionsData = typeof weight_sections_data === 'string' 
        ? JSON.parse(weight_sections_data) 
        : weight_sections_data;
      addLog("📋 Utilisation des sections personnalisées weight_sections_data");
    } catch (e) {
      addLog("⚠️ Erreur parsing weight_sections_data");
      addLog(`  Erreur: ${e.message}`);
      sectionsData = [];
    }
  }
  
  // Priorité 3: sections par défaut
  if (sectionsData.length === 0) {
    sectionsData = defaultConfig.defaultSections;
    addLog("📋 Utilisation des sections par défaut");
  }
  
  addLog(`  Nombre de sections finales: ${sectionsData.length}`);

  // 4. Validation et calcul des poids par défaut
  let totalItems = 0;
  let itemsToWeight = [];

  sectionsData.forEach((section, sectionIdx) => {
    if (config.sliderLevel === 'section') {
      if (section.hasSlider !== false) {
        itemsToWeight.push({
          type: 'section',
          index: sectionIdx,
          defaultWeight: section.defaultWeight || null
        });
        totalItems++;
      }
    } else if (config.sliderLevel === 'subsection') {
      if (section.subsections && Array.isArray(section.subsections)) {
        section.subsections.forEach((subsection, subIdx) => {
          if (subsection.hasSlider !== false) {
            itemsToWeight.push({
              type: 'subsection',
              sectionIndex: sectionIdx,
              subsectionIndex: subIdx,
              defaultWeight: subsection.defaultWeight || null
            });
            totalItems++;
          }
        });
      }
    }
  });
  
  addLog(`🎚️ Items à pondérer: ${totalItems}`);

  // 5. Normalisation des poids
  let totalSpecifiedWeight = 0;
  let unspecifiedCount = 0;

  itemsToWeight.forEach(item => {
    if (item.defaultWeight) {
      totalSpecifiedWeight += item.defaultWeight;
    } else {
      unspecifiedCount++;
    }
  });
  
  addLog(`📊 Analyse des poids:`);
  addLog(`  - Poids total spécifié: ${(totalSpecifiedWeight * 100).toFixed(1)}%`);
  addLog(`  - Items sans poids défini: ${unspecifiedCount}`);

  // Calcul des poids manquants
  if (unspecifiedCount > 0) {
    const remainingWeight = Math.max(0, 1.0 - totalSpecifiedWeight);
    const defaultWeightForUnspecified = remainingWeight / unspecifiedCount;
    
    addLog(`  - Poids restant à distribuer: ${(remainingWeight * 100).toFixed(1)}%`);
    addLog(`  - Poids par item non spécifié: ${(defaultWeightForUnspecified * 100).toFixed(1)}%`);
    
    itemsToWeight.forEach(item => {
      if (!item.defaultWeight) {
        item.defaultWeight = defaultWeightForUnspecified;
      }
    });
  }

  // 6. Normalisation finale
  const actualTotal = itemsToWeight.reduce((sum, item) => sum + item.defaultWeight, 0);
  addLog(`  - Total avant normalisation: ${(actualTotal * 100).toFixed(1)}%`);
  
  if (actualTotal > 0) {
    itemsToWeight.forEach(item => {
      item.defaultWeight = item.defaultWeight / actualTotal;
    });
    addLog("  ✅ Poids normalisés à 100%");
  }

  // 7. Application des poids aux sections
  itemsToWeight.forEach(item => {
    if (item.type === 'section') {
      sectionsData[item.index].defaultWeight = item.defaultWeight;
    } else if (item.type === 'subsection') {
      sectionsData[item.sectionIndex].subsections[item.subsectionIndex].defaultWeight = item.defaultWeight;
    }
  });

  // 8. Configuration des boutons
  let buttonsConfig = [];
  
  if (typeof weight_buttons_config !== 'undefined' && weight_buttons_config) {
    try {
      buttonsConfig = typeof weight_buttons_config === 'string' 
        ? JSON.parse(weight_buttons_config) 
        : weight_buttons_config;
      addLog("🔘 Utilisation des boutons personnalisés");
    } catch (e) {
      addLog("⚠️ Erreur parsing boutons personnalisés");
      addLog(`  Erreur: ${e.message}`);
    }
  }
  
  // Boutons par défaut
  if (buttonsConfig.length === 0) {
    buttonsConfig = [
      {
        text: tr.submitButton,
        path: "weight_confirm",
        color: config.primaryColor
      }
    ];
    
    // Ajouter bouton retour si demandé
    if (typeof weight_include_back_button !== 'undefined' && weight_include_back_button) {
      buttonsConfig.push({
        text: tr.backButton,
        path: "weight_back",
        color: "#6C757D"
      });
    }
  }
  
  addLog(`🔘 Nombre de boutons: ${buttonsConfig.length}`);

  // 9. Construction du payload final
  const payload = {
    type: "weight_selector",
    title: typeof weight_custom_title !== 'undefined' ? weight_custom_title : tr.title,
    subtitle: typeof weight_custom_subtitle !== 'undefined' ? weight_custom_subtitle : tr.subtitle,
    sliderLevel: config.sliderLevel,
    chat: config.chat,
    chatDisabledText: "🚫 Veuillez effectuer vos pondérations avant de continuer",
    gridColumns: config.gridColumns,
    global_button_color: config.primaryColor,
    sections: sectionsData,
    buttons: buttonsConfig,
    instanceId: `weight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  };

  // 10. Métadonnées
  globalThis.weight_metadata = {
    sliderLevel: config.sliderLevel,
    totalItems: totalItems,
    sectionsCount: sectionsData.length,
    language: langue,
    generated_at: new Date().toISOString()
  };

  // 11. Export
  dynamicPayload = JSON.stringify(payload, null, 2);

  // 12. Logs finaux
  addLog("✅ Payload WeightSelector généré avec succès");
  addLog(`📊 Configuration: ${config.sliderLevel} level`);
  addLog(`📋 Sections: ${sectionsData.length}`);
  addLog(`🎚️ Éléments avec slider: ${totalItems}`);
  addLog(`🔘 Boutons: ${buttonsConfig.length}`);
  
  // Détail des sections
  addLog("\n📋 Détail des sections:");
  sectionsData.forEach((section, index) => {
    addLog(`Section ${index + 1}: ${section.label}`);
    if (section.color) addLog(`  Couleur: ${section.color}`);
    
    if (config.sliderLevel === 'section' && section.hasSlider !== false && section.defaultWeight) {
      addLog(`  Poids par défaut: ${(section.defaultWeight * 100).toFixed(1)}%`);
    }
    
    if (section.subsections && config.sliderLevel === 'subsection') {
      addLog(`  Sous-sections:`);
      section.subsections.forEach((sub, subIdx) => {
        if (sub.hasSlider !== false) {
          const weight = sub.defaultWeight ? (sub.defaultWeight * 100).toFixed(1) : 'auto';
          addLog(`    - ${sub.label}: ${weight}%`);
        }
      });
    }
  });
  
  addLog("\n📋 Taille du payload généré: " + dynamicPayload.length + " caractères");
  addLog("✅ Génération terminée avec succès");

} catch (error) {
  addLog(`🚨 ERREUR CRITIQUE: ${error.message}`);
  addLog(`Stack trace: ${error.stack}`);
  
  // Payload de fallback
  const fallbackPayload = {
    type: "weight_selector",
    title: "❌ Erreur de génération",
    subtitle: "Une erreur est survenue lors de la création de l'interface",
    sliderLevel: "section",
    chat: false,
    sections: [
      {
        label: "⚠️ Erreur",
        color: "#FF4444",
        hasSlider: true,
        defaultWeight: 1.0,
        subsections: []
      }
    ],
    buttons: [
      {
        text: `❌ Erreur: ${error.message}`,
        path: "Error",
        color: "#FF4444"
      }
    ]
  };
  
  dynamicPayload = JSON.stringify(fallbackPayload, null, 2);
  addLog("💀 Payload fallback généré");
}
