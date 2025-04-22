export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) =>
    trace.payload?.name === 'file_upload',
  render: ({ trace, element }) => {
    try {
      // Création du container
      const id = 'fileUpload_' + Date.now();
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          .upload-container { padding:20px; border:2px dashed #ccc; border-radius:5px; text-align:center; cursor:pointer; }
          .upload-container:hover { border-color:#2e7ff1; }
          .upload-input { display:none; }
          .upload-label { color:#666; display:block; margin-bottom:10px; }
          .status { margin-top:8px; padding:8px; border-radius:4px; display:none; }
          .status.loading { background:#2196F3; color:#fff; }
          .status.success { background:#4CAF50; color:#fff; }
          .status.error   { background:#f44336; color:#fff; }
        </style>
        <div class="upload-container">
          <input id="${id}" class="upload-input" type="file" multiple />
          <label for="${id}" class="upload-label">Cliquez ou glissez vos fichiers ici</label>
        </div>
        <div class="status"></div>
      `;
      element.appendChild(container);

      const inp    = container.querySelector('.upload-input');
      const box    = container.querySelector('.upload-container');
      const status = container.querySelector('.status');

      const show = (msg, type) => {
        status.textContent   = msg;
        status.className     = 'status ' + type;
        status.style.display = 'block';
      };

      const upload = async (files) => {
        if (!files.length) return;
        show(`Téléversement de ${files.length} fichier(s)…`, 'loading');
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('files', f));

        try {
          const r = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method:'POST', body: fd }
          );
          const j = await r.json();
          if (!r.ok || !Array.isArray(j.urls) || !j.urls.length) {
            throw new Error(j.detail || 'Aucune URL renvoyée');
          }
          show(`✅ ${j.urls.length} fichier(s) uploadés !`, 'success');
          box.style.pointerEvents = 'none'; box.style.opacity = '0.6';

          // On envoie ici **un objet** pour que le widget valide
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              success: true,
              urls: j.urls
            },
          });
        } catch (e) {
          console.error(e);
          show(`❌ Erreur : ${e.message}`, 'error');
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              success: false,
              error: e.message
            },
          });
        }
      };

      // Events
      inp.addEventListener('change', e => upload(e.target.files));
      ['dragenter','dragover'].forEach(ev =>
        box.addEventListener(ev, e => {
          e.preventDefault(); e.stopPropagation();
          box.style.borderColor = '#2e7ff1';
        })
      );
      ['dragleave','drop'].forEach(ev =>
        box.addEventListener(ev, e => {
          e.preventDefault(); e.stopPropagation();
          box.style.borderColor = '#ccc';
          if (ev === 'drop') upload(e.dataTransfer.files);
        })
      );

    } catch (e) {
      console.error(e);
      // On termine coûte que coûte
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { success: false, error: 'Erreur interne FileUpload' }
      });
    }
  }
};
