export const FileUpload = {
  name: 'FileUpload',
  type: 'response',
  match: ({ trace }) =>
    trace.payload?.name === 'file_upload',
  render: ({ trace, element }) => {
    try {
      // Configuration des couleurs (inspiré de MultiSelect)
      const primaryColor = trace.payload?.color || '#9C27B0';
      const buttonFontSize = trace.payload?.buttonFontSize || 15;
      
      // Extraire les valeurs RGB pour les effets
      const hexToRgb = (hex) => {
        const num = parseInt(hex.replace('#',''), 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      };
      
      const rgb = hexToRgb(primaryColor);
      
      // Création du container
      const id = 'fileUpload_' + Date.now();
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          /* Variables CSS inspirées de MultiSelect */
          .file-upload-wrapper {
            --fu-primary: ${primaryColor};
            --fu-primary-r: ${rgb.r};
            --fu-primary-g: ${rgb.g};
            --fu-primary-b: ${rgb.b};
            --fu-btn-font-size: ${buttonFontSize}px;
            --fu-radius: 12px;
            --fu-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          }
          
          /* Container principal avec glassmorphism */
          .upload-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 24px;
            background: rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: var(--fu-radius);
            box-shadow: var(--fu-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .upload-container:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          }
          
          /* Zone de drop */
          .drop-zone {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 20px;
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 80px;
          }
          
          .drop-zone:hover {
            border-color: var(--fu-primary);
            background: rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.2);
            transform: scale(1.02);
          }
          
          .drop-zone.dragging {
            border-color: var(--fu-primary);
            background: rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3);
            box-shadow: 0 0 20px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.5);
          }
          
          /* Input caché */
          .upload-input {
            display: none;
          }
          
          /* Label avec icône */
          .upload-label {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #fff;
            font-size: var(--fu-btn-font-size);
            font-weight: 500;
            cursor: pointer;
            user-select: none;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          .upload-icon {
            font-size: 28px;
            color: var(--fu-primary);
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }
          
          /* Bouton d'upload style MultiSelect */
          .upload-button {
            position: relative;
            background: var(--fu-primary);
            color: #fff;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 700;
            letter-spacing: 0.5px;
            font-size: var(--fu-btn-font-size);
            line-height: 1.2;
            cursor: pointer;
            border: none;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
                        inset 0 3px 0 rgba(255, 255, 255, 0.2),
                        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 4px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
          }
          
          .upload-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.4),
                        inset 0 3px 0 rgba(255, 255, 255, 0.3),
                        inset 0 -3px 0 rgba(0, 0, 0, 0.3);
          }
          
          .upload-button:active {
            transform: translateY(1px);
            box-shadow: 0 2px 6px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          }
          
          /* Effet de scan du bouton */
          .upload-button::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            width: calc(100% + 4px);
            height: calc(100% + 4px);
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transform: translateX(-100%) rotate(45deg);
            transition: transform 0.8s ease;
          }
          
          .upload-button:hover::before {
            transform: translateX(100%) rotate(45deg);
          }
          
          /* Status avec style glassmorphism */
          .status {
            position: absolute;
            bottom: -60px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: all 0.3s ease;
            white-space: nowrap;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          .status.show {
            opacity: 1;
            bottom: -50px;
          }
          
          .status.loading {
            background: rgba(33, 150, 243, 0.9);
            color: #fff;
          }
          
          .status.success {
            background: rgba(76, 175, 80, 0.9);
            color: #fff;
          }
          
          .status.error {
            background: rgba(244, 67, 54, 0.9);
            color: #fff;
          }
          
          /* Animation de chargement */
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0); }
            100% { box-shadow: 0 0 0 0 rgba(var(--fu-primary-r), var(--fu-primary-g), var(--fu-primary-b), 0); }
          }
          
          .upload-button.loading {
            animation: pulse 1.5s infinite;
          }
          
          /* Désactivé */
          .upload-container.disabled {
            opacity: 0.5;
            pointer-events: none;
          }
          
          /* Responsive */
          @media (max-width: 600px) {
            .upload-container {
              flex-direction: column;
              gap: 16px;
            }
            
            .drop-zone {
              width: 100%;
            }
            
            .upload-button {
              width: 100%;
            }
          }
        </style>
        
        <div class="file-upload-wrapper">
          <div class="upload-container">
            <div class="drop-zone">
              <input id="${id}" class="upload-input" type="file" multiple />
              <label for="${id}" class="upload-label">
                <span class="upload-icon">📁</span>
                <span>Glissez vos fichiers ici ou cliquez pour parcourir</span>
              </label>
            </div>
            <button class="upload-button" onclick="document.getElementById('${id}').click()">
              Sélectionner des fichiers
            </button>
          </div>
          <div class="status"></div>
        </div>
      `;
      
      element.appendChild(container);
      
      const inp = container.querySelector('.upload-input');
      const dropZone = container.querySelector('.drop-zone');
      const uploadContainer = container.querySelector('.upload-container');
      const status = container.querySelector('.status');
      const uploadButton = container.querySelector('.upload-button');
      
      const show = (msg, type) => {
        status.textContent = msg;
        status.className = `status ${type} show`;
        setTimeout(() => {
          status.classList.remove('show');
        }, 5000);
      };
      
      const upload = async (files) => {
        if (!files.length) return;
        
        uploadButton.classList.add('loading');
        uploadButton.disabled = true;
        show(`Téléversement de ${files.length} fichier(s)…`, 'loading');
        
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
          
          show(`✅ ${j.urls.length} fichier(s) uploadés avec succès !`, 'success');
          uploadContainer.classList.add('disabled');
          
          // Animation de succès
          uploadButton.style.background = '#4CAF50';
          uploadButton.textContent = '✓ Fichiers uploadés';
          
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
          uploadButton.classList.remove('loading');
          uploadButton.disabled = false;
          
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
      
      // Drag and drop avec style
      ['dragenter', 'dragover'].forEach(ev =>
        dropZone.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('dragging');
        })
      );
      
      ['dragleave', 'drop'].forEach(ev =>
        dropZone.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('dragging');
          if (ev === 'drop' && e.dataTransfer.files.length) {
            upload(e.dataTransfer.files);
          }
        })
      );
      
      // Clic sur la zone de drop
      dropZone.addEventListener('click', (e) => {
        if (e.target !== inp) {
          inp.click();
        }
      });
      
    } catch (e) {
      console.error(e);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { success: false, error: 'Erreur interne FileUpload' }
      });
    }
  }
};
