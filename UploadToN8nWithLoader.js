{
  "name": "ext_UploadToN8nWithLoader",
  "title": "Téléverser votre document",
  "subtitle": "PDF, Word, ou image - Maximum 25 MB",
  "description": "Glissez-déposez votre fichier ici ou cliquez pour sélectionner",
  "accept": ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg",
  "maxFileSizeMB": 25,
  "primaryColor": "#6366f1",
  "secondaryColor": "#8b5cf6",
  "accentColor": "#ec4899",
  "buttons": [
    {
      "text": "← Annuler",
      "path": "Cancel"
    }
  ],
  "webhook": {
    "url": "https://hualpa.app.n8n.cloud/webhook/VOTRE-PATH-ICI",
    "method": "POST",
    "headers": {},
    "timeoutMs": 120000,
    "retries": 1,
    "fileFieldName": "file",
    "extra": {
      "purpose": "ocr"
    }
  },
  "awaitResponse": true,
  "polling": {
    "enabled": false
  },
  "loader": {
    "message": "⏳ Analyse du document en cours...",
    "finalText": "C'est terminé !",
    "finalButtonIcon": "🎯",
    "steps": [
      { "progress": 10, "text": "📋 Préparation du fichier" },
      { "progress": 30, "text": "🚀 Envoi au serveur" },
      { "progress": 60, "text": "🤖 Analyse par IA" },
      { "progress": 85, "text": "✨ Extraction des données" },
      { "progress": 100, "text": "✅ Terminé !" }
    ]
  },
  "pathSuccess": "Confirm_Upload",
  "pathError": "Cancel"
}
