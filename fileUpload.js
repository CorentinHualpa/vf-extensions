export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) => {
    // Matche le custom action file_upload
    return (
      trace.type === 'Custom_Form' /* ou ext_fileUpload selon ton flow */ ||
      trace.payload?.name === 'file_upload'
    );
  },
  render: ({ trace, element }) => {
    // 1) Création du formulaire d’upload
    const form = document.createElement('form');
    form.innerHTML = `
      <style>
        .upload-container {
          padding: 20px;
          border: 2px dashed #ccc;
          border-radius: 5px;
          text-align: center;
          cursor: pointer;
        }
        .upload-container:hover { border-color: #2e7ff1; }
        .upload-input { display: none; }
        .upload-label { color: #666; margin-bottom: 10px; display: block; }
        .status { margin-top: 10px; padding: 10px; border-radius: 5px; display: none; }
        .status.loading { background: #2196F3; color: #fff; }
        .status.success { background: #4CAF50; color: #fff; }
        .status.error   { background: #f44336; color: #fff; }
      </style>
      <div class="upload-container">
        <input type="file" id="vf-upload" class="upload-input" multiple />
        <label for="vf-upload" class="upload-label">
          Cliquez ou glissez-déposez vos fichiers ici
        </label>
      </div>
      <div class="status"></div>
    `;
    element.appendChild(form);

    // 2) Références DOM
    const input  = form.querySelector('.upload-input');
    const status = form.querySelector('.status');
    const container = form.querySelector('.upload-container');

    // 3) Affichage de l’état
    const setStatus = (msg, type) => {
      status.textContent   = msg;
      status.className     = 'status ' + type;
      status.style.display = 'block';
    };

    // 4) Upload et envoi du résultat à Voiceflow
    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      setStatus(`🔄 Téléversement de ${files.length} fichier(s)…`, 'loading');

      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      try {
        const res  = await fetch(
          'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
          { method: 'POST', body: formData }
        );
        const json = await res.json();

        if (!res.ok || !Array.isArray(json.urls) || !json.urls.length) {
          throw new Error(json.detail || 'Aucune URL renvoyée');
        }

        setStatus(`✅ ${json.urls.length} fichier(s) uploadés !`, 'success');
        container.style.pointerEvents = 'none';
        container.style.opacity       = '0.7';

        // 5) Envoi du payload stringifié pour que le JS step de Voiceflow le parse
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: JSON.stringify({
            success: true,
            urls: json.urls
          }),
        });
      } catch (err) {
        console.error('Upload error:', err);
        setStatus(`❌ Erreur : ${err.message}`, 'error');
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: JSON.stringify({
            success: false,
            error: err.message
          }),
        });
      }
    });

    // 6) Gestion du drag & drop
    ['dragenter','dragover'].forEach((ev) =>
      container.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        container.style.borderColor = '#2e7ff1';
      })
    );
    ['dragleave','drop'].forEach((ev) =>
      container.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        container.style.borderColor = '#ccc';
        if (ev === 'drop') input.files = e.dataTransfer.files, input.dispatchEvent(new Event('change'));
      })
    );
  }
};
