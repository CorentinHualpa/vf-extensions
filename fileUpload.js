export const FileUpload = {
    name: 'FileUpload',
    type: 'response',
    match: ({ trace }) => {
        console.log('Vérification du match pour file_upload');
        console.log(trace);
        return trace.type === 'file_upload' || trace.payload?.name === 'file_upload';
    },
    render: ({ trace, element }) => {
        try {
            console.log('Rendu de l\'extension FileUpload');
            console.log('Données trace:', trace);

            // Génération d'un ID unique pour cette instance
            const uniqueId = 'fileUpload_' + Date.now();
            console.log(`ID d'upload de fichier: ${uniqueId}`);

            // Flag pour éviter les uploads multiples simultanés
            let isUploading = false;

            const container = document.createElement('div');
            container.innerHTML = `
                <style>
                    .upload-container {
                        padding: 20px;
                        border: 2px dashed #ccc;
                        border-radius: 5px;
                        text-align: center;
                        margin-bottom: 20px;
                        cursor: pointer;
                    }
                    .upload-container:hover {
                        border-color: #2e7ff1;
                    }
                    .upload-input {
                        display: none;
                    }
                    .upload-label {
                        display: block;
                        margin-bottom: 10px;
                        color: #666;
                    }
                    .status-container {
                        padding: 10px;
                        border-radius: 5px;
                        margin-top: 10px;
                        display: none;
                    }
                    .success {
                        background-color: #4CAF50;
                        color: white;
                    }
                    .error {
                        background-color: #f44336;
                        color: white;
                    }
                    .loading {
                        background-color: #2196F3;
                        color: white;
                    }
                    .file-link {
                        color: white;
                        text-decoration: underline;
                        word-break: break-all;
                    }
                </style>
                <div class="upload-container">
                    <input type="file" class="upload-input" id="${uniqueId}" multiple>
                    <label for="${uniqueId}" class="upload-label">
                        Cliquer pour téléverser ou glisser-déposer des fichiers
                    </label>
                </div>
                <div class="status-container"></div>
            `;

            const uploadInput = container.querySelector('.upload-input');
            const statusContainer = container.querySelector('.status-container');
            const uploadContainer = container.querySelector('.upload-container');

            const showStatus = (message, type) => {
                statusContainer.textContent = message;
                statusContainer.className = 'status-container ' + type;
                statusContainer.style.display = 'block';
            };

            const handleUpload = async (files) => {
                if (!files || files.length === 0 || isUploading) {
                    return;
                }

                isUploading = true;
                showStatus(`Téléversement de ${files.length} fichier(s) en cours...`, 'loading');

                const formData = new FormData();
                Array.from(files).forEach((file) => {
                    formData.append('files', file);
                });

                try {
                    const response = await fetch('https://chatinnov-api-dev.proudsky-cdf9333b.francecentral.azurecontainerapps.io/documents_upload/', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    console.log('Réponse du téléversement:', data);

                    if (response.ok) {
                        if (data.urls && data.urls.length > 0) {
                            const fileCount = data.urls.length;
                            
                            // Création d'une liste des fichiers téléversés avec leurs liens
                            const fileList = data.urls.map(fileData => 
                                `<div>${fileData.filename}: <a href="${fileData.url}" class="file-link" target="_blank">${fileData.url}</a></div>`
                            ).join('');
                            
                            statusContainer.innerHTML = `<div>Téléversement réussi de ${fileCount} fichier(s)!</div>${fileList}`;
                            statusContainer.className = 'status-container success';

                            // CORRECTION IMPORTANTE: Ne pas utiliser JSON.stringify
                            window.voiceflow.chat.interact({
                                type: 'complete',
                                payload: {
                                    success: true,
                                    urls: data.urls
                                }
                            });
                        } else {
                            throw new Error('Aucune URL retournée par le serveur');
                        }
                    } else {
                        const errorMessage = data.detail || 'Échec du téléversement';
                        throw new Error(errorMessage);
                    }
                } catch (error) {
                    console.error('Erreur de téléversement:', error);
                    showStatus(`Erreur: ${error.message}`, 'error');

                    // CORRECTION IMPORTANTE: Ne pas utiliser JSON.stringify
                    window.voiceflow.chat.interact({
                        type: 'complete',
                        payload: {
                            success: false,
                            error: error.message
                        }
                    });
                } finally {
                    isUploading = false;
                }
            };

            // Gestion de la sélection de fichier
            uploadInput.addEventListener('change', (event) => {
                handleUpload(event.target.files);
            });

            // Gestion du glisser-déposer
            uploadContainer.addEventListener('dragenter', (event) => {
                event.preventDefault();
                event.stopPropagation();
                uploadContainer.style.borderColor = '#2e7ff1';
            });

            uploadContainer.addEventListener('dragover', (event) => {
                event.preventDefault();
                event.stopPropagation();
                uploadContainer.style.borderColor = '#2e7ff1';
            });

            uploadContainer.addEventListener('dragleave', (event) => {
                event.preventDefault();
                event.stopPropagation();
                uploadContainer.style.borderColor = '#ccc';
            });

            uploadContainer.addEventListener('drop', (event) => {
                event.preventDefault();
                event.stopPropagation();
                uploadContainer.style.borderColor = '#ccc';
                handleUpload(event.dataTransfer.files);
            });

            element.appendChild(container);
            
            // Fonction de nettoyage pour éviter les fuites mémoire
            return () => {
                console.log("Nettoyage de l'extension FileUpload");
                // Supprimer les écouteurs d'événements pour éviter les fuites mémoire
                uploadInput.disabled = true;
                uploadContainer.style.pointerEvents = 'none';
            };

        } catch (error) {
            console.error('Erreur dans le rendu FileUpload:', error);
            
            // En cas d'erreur, envoyer une interaction pour débloquer Voiceflow
            window.voiceflow.chat.interact({
                type: 'complete',
                payload: {
                    success: false,
                    error: 'Erreur interne de l\'extension FileUpload'
                }
            });
        }
    },
};
