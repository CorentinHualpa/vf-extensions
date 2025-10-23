// KBUploadExtension.js
export const KBUploadExtension = {
  name: "KBUpload",
  type: "response",

  // Matche 'ext_KBUpload' OU 'KBUpload' OU type 'extension' + payload.name
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || "";
      const name = t.payload?.name || "";
      return (
        /(^ext_)?KBUpload$/i.test(type) ||
        (type === "extension" && /(^ext_)?KBUpload$/i.test(name)) ||
        (/^ext_/i.test(type) && /(^ext_)?KBUpload$/i.test(name))
      );
    } catch (e) {
      console.error("[KBUpload.match] error:", e);
      return false;
    }
  },

  render(context) {
    try {
      const element = context?.element;
      if (!element) return console.error("[KBUpload] element manquant");

      // ====== Paramètres contrôlés par le payload du step ======
      const p = Object.assign(
        {
          // UI
          title: "Téléverser un document",
          description: "Glissez-déposez un fichier ici ou cliquez pour sélectionner.",
          backgroundImage: null,
          backgroundOpacity: 0.15,
          buttons: [], // [{ text, color, textColor, path }]
          accept: ".pdf,.doc,.docx,.txt",
          maxFileSizeMB: 50,

          // Réseau (aucune auth par défaut)
          uploadURL: "",             // <= OBLIGATOIRE (n8n webhook, etc.)
          method: "POST",
          headers: {},               // ex: { "x-custom": "123" } (facultatif)
          fieldName: "file",         // nom du champ fichier dans le FormData
          extraFields: {},           // { projectId: "...", ... } ajouté au FormData
          metadata: {},              // ajouté en JSON sous 'metadata'
          timeoutMs: 120000,         // 120s

          // Comportement Voiceflow
          autoCompleteOnSuccess: true,
          successPath: "Confirm_Upload",
          cancelPath: "Cancel",
        },
        context?.trace?.payload || {}
      );

      if (!p.uploadURL) {
        const err = document.createElement("div");
        err.style.cssText =
          "padding:12px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:8px;color:#842029";
        err.innerHTML =
          "Erreur : <strong>uploadURL</strong> est requis dans le payload du step Extension.";
        element.appendChild(err);
        return;
      }

      // ====== UI ======
      const container = document.createElement("div");
      container.innerHTML = `
        <style>
          .kb-wrap { position:relative; padding:15px; border-radius:12px; margin-bottom:12px; overflow:hidden; }
          .kb-bg { position:absolute; inset:0; border-radius:12px; background:rgba(240,240,240,.3); ${p.backgroundImage ? `background-image:url('${p.backgroundImage}'); background-size:contain; background-repeat:no-repeat; background-position:center; opacity:${p.backgroundOpacity};` : ""}}
          .kb-content { position:relative; z-index:1; }
          .kb-title { margin:0 0 10px; font-weight:600; color:#1b1c20; }
          .kb-zone { border:2px dashed #2E6EE1; padding:18px; border-radius:10px; text-align:center; cursor:pointer; background:rgba(255,255,255,.7); transition:.2s; }
          .kb-zone:hover { background:rgba(255,255,255,.9); border-color:#1E5ECA; }
          .kb-status { margin-top:10px; min-height:38px; background:rgba(255,255,255,.7); padding:8px; border-radius:8px; font-size:14px; }
          .kb-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
          .kb-btn { padding:8px 14px; border:none; border-radius:8px; cursor:pointer; font-weight:600; opacity:.9; }
          .kb-btn:hover { opacity:1; transform:translateY(-1px); }
          .kb-meta { font-size:12px; color:#666; margin-top:6px; }
        </style>

        <div class="kb-wrap">
          <div class="kb-bg"></div>
          <div class="kb-content">
            <h3 class="kb-title">${p.title}</h3>
            <div class="kb-zone">${p.description}</div>
            <div class="kb-meta">Formats autorisés : ${p.accept} • Taille max : ${p.maxFileSizeMB} Mo</div>
            <div class="kb-status"></div>
            <div class="kb-actions">
              ${p.buttons
                .map(
                  (b) => `
                  <button class="kb-btn" 
                          style="background:${b.color || "#E5E7EB"}; color:${b.textColor || "#111"}"
                          data-path="${(b.path || "").replaceAll('"', "")}">
                    ${b.text || "Retour"}
                  </button>`
                )
                .join("")}
            </div>
          </div>
        </div>
        <input class="kb-file" type="file" style="display:none" accept="${p.accept}">
      `;

      const zone = container.querySelector(".kb-zone");
      const status = container.querySelector(".kb-status");
      const fileInput = container.querySelector(".kb-file");
      const actionBtns = container.querySelectorAll(".kb-btn");

      // Boutons d'action (navigation)
      actionBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const path = btn.getAttribute("data-path") || p.cancelPath;
          window.voiceflow?.chat?.interact?.({
            type: "complete",
            payload: { uploadSuccess: false, path },
          });
        });
      });

      // Zone de clic
      zone.addEventListener("click", () => fileInput.click());

      // Drag & drop
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.style.backgroundColor = "rgba(230,240,255,.9)";
      });
      zone.addEventListener("dragleave", () => {
        zone.style.backgroundColor = "rgba(255,255,255,.7)";
      });
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.style.backgroundColor = "rgba(255,255,255,.7)";
        if (e.dataTransfer?.files?.length) {
          fileInput.files = e.dataTransfer.files;
          upload(fileInput.files[0]);
        }
      });

      // Choix fichier
      fileInput.addEventListener("change", () => {
        if (fileInput.files?.length) upload(fileInput.files[0]);
      });

      // Utils
      const fmt = (bytes) => {
        if (!bytes && bytes !== 0) return "";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
      };

      // ====== Upload (sans auth) ======
      async function upload(file) {
        if (!file) return;
        const max = p.maxFileSizeMB * 1024 * 1024;
        if (file.size > max) {
          status.innerHTML = `<span style="color:#b91c1c">Fichier trop volumineux (${fmt(file.size)}). Max ${p.maxFileSizeMB} Mo.</span>`;
          return;
        }

        // UI busy
        status.textContent = `Téléversement en cours : ${file.name} (${fmt(file.size)})…`;
        zone.innerHTML =
          '<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif" alt="Upload" width="48" height="48">';

        // Construire le FormData
        const fd = new FormData();
        fd.append(p.fieldName, file);
        // extraFields: clés/valeurs simples
        Object.entries(p.extraFields || {}).forEach(([k, v]) => fd.append(k, String(v)));
        // metadata: JSON
        if (p.metadata && Object.keys(p.metadata).length) {
          fd.append("metadata", JSON.stringify(p.metadata));
        }

        // Construire l’init fetch
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), p.timeoutMs);

        // AUCUNE auth par défaut (headers vides, ou facultatifs si fournis)
        const fetchInit = {
          method: p.method || "POST",
          headers: p.headers || {},
          body: fd,
          signal: controller.signal,
        };

        try {
          const res = await fetch(p.uploadURL, fetchInit);
          clearTimeout(timer);

          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} – ${res.statusText} ${txt ? "– " + txt : ""}`);
          }

          // On essaie de parser JSON, sinon texte brut
          let data = null;
          try {
            data = await res.json();
          } catch {
            data = await res.text();
          }

          // Détermination d’un ID utile si présent
          let documentId = "";
          if (data && typeof data === "object") {
            documentId =
              data.documentID || data.documentId || data.id || data.data?.documentID || "";
          }

          status.innerHTML = `<span style="color:#166534">✓ Téléversé avec succès.</span>`;
          zone.innerHTML =
            '<img src="https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif" alt="Done" width="48" height="48">';

          if (p.autoCompleteOnSuccess) {
            setTimeout(() => {
              window.voiceflow?.chat?.interact?.({
                type: "complete",
                payload: {
                  uploadSuccess: true,
                  documentId,
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type,
                  response: data,
                  path: p.successPath,
                },
              });
            }, 700);
          }
        } catch (e) {
          clearTimeout(timer);
          console.error("[KBUpload] upload error:", e);
          status.innerHTML = `<span style="color:#b91c1c">Erreur: ${e.message || e}</span>`;
          zone.textContent = p.description || "Cliquez pour réessayer";

          // On n’envoie PAS complete ici pour laisser l’utilisateur réessayer.
          // Si tu veux forcer la sortie vers un chemin d’échec :
          // window.voiceflow.chat.interact({ type: 'complete', payload: { uploadSuccess:false, error:String(e), path:p.cancelPath } });
        }
      }

      element.appendChild(container);
    } catch (e) {
      console.error("[KBUpload.render] error:", e);
      const err = document.createElement("div");
      err.style.cssText =
        "padding:12px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:8px;color:#842029";
      err.textContent = `Erreur lors du chargement de l'extension: ${e.message || e}`;
      context?.element?.appendChild(err);
    }
  },
};
