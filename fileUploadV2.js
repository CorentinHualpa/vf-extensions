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
      
      // Couleur personnalisable (inspirée de MultiSelect)
      const primaryColor = trace.payload?.color || '#9C27B0';
      const primaryRgb = parseInt(primaryColor.replace('#',''), 16);
      const primaryR = (primaryRgb >> 16) & 255;
      const primaryG = (primaryRgb >> 8) & 255;
      const primaryB = primaryRgb & 255;
      
      container.innerHTML = `
        <style>
          /* Variables CSS inspirées de MultiSelect */
          .fileupload-wrapper {
            --fu-primary-color: ${primaryColor};
            --fu-primary-r: ${primaryR};
            --fu-primary-g: ${primaryG};
            --fu-primary-b: ${primaryB};
            --fu-radius: 12px;
            --fu-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          }
          
          /* Container principal avec effet glassmorphism */
          .upload-container {
            position: relative;
            padding: 40px;
            background: linear-gradient(135deg, 
              rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.9),
              rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.7)
            );
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: var(--fu-radius);
            text-align: center;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: var(--fu-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            min-height: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          /* Effet hover */
          .upload-container:hover {
            border-color: rgba(255, 255, 255, 0.6);
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          }
          
          /* État actif */
          .upload-container:active {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          }
          
          /* Effet de scan/shine comme MultiSelect */
          .upload-container::before {
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            width: calc(100% + 20px);
            height: calc(100% + 20px);
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transform: translateX(-100%) rotate(45deg);
            transition: transform 0.8s ease;
          }
          
          .upload-container:hover::before {
            transform: translateX(100%) rotate(45deg);
          }
          
          /* État drag over */
          .upload-container.drag-over {
            border-color: rgba(255, 255, 255, 0.8);
            background: linear-gradient(135deg, 
              rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 1),
              rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.8)
            );
            box-shadow: 0 0 30px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.5);
          }
          
          /* Input caché */
          .upload-input {
            display: none;
          }
          
          /* Label avec style amélioré */
          .upload-label {
            color: #ffffff;
            display: block;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 6px rgba(0, 0, 0, 0.2);
            margin-bottom: 10px;
            z-index: 1;
            position: relative;
          }
          
          /* Icône upload */
          .upload-icon {
            font-size: 48px;
            margin-bottom: 20px;
            opacity: 0.9;
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          /* Texte secondaire */
          .upload-hint {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-top: 5px;
          }
          
          /* Status avec style glassmorphism */
          .status {
            margin-top: 16px;
            padding: 16px 24px;
            border-radius: 8px;
            display: none;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            letter-spacing: 0.3px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
          
          .status.loading {
            background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(33, 150, 243, 0.85));
            color: #fff;
            animation: pulse 1.5s infinite;
          }
          
          .status.success {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(76, 175, 80, 0.85));
            color: #fff;
          }
          
          .status.error {
            background: linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(244, 67, 54, 0.85));
            color: #fff;
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
            100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
          }
          
          /* État désactivé */
          .upload-container.disabled {
            opacity: 0.6;
            pointer-events: none;
            cursor: not-allowed;
          }
          
          /* Animation de shake pour les erreurs */
          @keyframes shake-enhanced {
            0%, 100% { transform: translateX(0); }
            15%, 45%, 75% { transform: translateX(-6px); }
            30%, 60%, 90% { transform: translateX(6px); }
          }
          
          .status.error.shake {
            animation: shake-enhanced 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .upload-container {
              padding: 30px 20px;
              min-height: 180px;
            }
            
            .upload-label {
              font-size: 16px;
            }
            
            .upload-icon {
              font-size: 36px;
            }
          }
        </style>
        <div class="fileupload-wrapper">
          <div class="upload-container">
            <input id="${id}" class="upload-input" type="file" multiple />
            <div class="upload-icon">📎</div>
            <label for="${id}" class="upload-label">Cliquez ou glissez vos fichiers ici</label>
            <div class="upload-hint">Formats acceptés : tous types de fichiers</div>
          </div>
          <div class="status"></div>
        </div>
      `;
      
      element.appendChild(container);
      const inp = container.querySelector('.upload-input');
      const box = container.querySelector('.upload-container');
      const status = container.querySelector('.status');
      
      const show = (msg, type) => {
        status.textContent = msg;
        status.className = 'status ' + type;
        status.style.display = 'block';
        
        if (type === 'error') {
          status.classList.add('shake');
          setTimeout(() => status.classList.remove('shake'), 400);
        }
      };
      
      const upload = async (files) => {
        if (!files.length) return;
        
        show(`Téléversement de ${files.length} fichier(s)…`, 'loading');
        box.classList.add('disabled');
        
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('files', f));
        
        try {
          const r = await fetch(
            'https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/',
            { method: 'POST', body: fd }
          );
          const j = await r.json();
          
          if (!r.ok || !Array.isArray(j.urls) || !j.urls.length) {
            throw new Error(j.detail || 'Aucune URL renvoyée');
          }
          
          show(`✅ ${j.urls.length} fichier(s) uploadés !`, 'success');
          box.style.pointerEvents = 'none';
          box.style.opacity = '0.6';
          
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
          show(`❌ Erreur : ${e.message}`, 'error');
          box.classList.remove('disabled');
          
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
      
      ['dragenter', 'dragover'].forEach(ev =>
        box.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          box.classList.add('drag-over');
        })
      );
      
      ['dragleave', 'drop'].forEach(ev =>
        box.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          box.classList.remove('drag-over');
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

export default FileUpload;
