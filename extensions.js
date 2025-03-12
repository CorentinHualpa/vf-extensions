export const FormExtension = {
  name: 'Forms',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_form' || trace.payload?.name === 'ext_form',

  render: ({ trace, element }) => {
    // 1) Récupération des valeurs dynamiques du payload
    const fields = trace.payload?.fields || [];
    const formTitle = trace.payload?.formTitle || 'Vos coordonnées';
    const confidentialityText = trace.payload?.confidentialityText || ''; // si vide, on masque
    const submitText = trace.payload?.submitText || 'Envoyer';
    const primaryColor = trace.payload?.primaryColor || '#2e6ee1';

    // 2) Petite fonction pour éclaircir la couleur (pour le dégradé)
    function shadeColor(color, percent) {
      // color doit être au format "#RRGGBB"
      const R = parseInt(color.substring(1, 3), 16);
      const G = parseInt(color.substring(3, 5), 16);
      const B = parseInt(color.substring(5, 7), 16);

      const r = Math.min(255, Math.floor(R * (100 + percent) / 100));
      const g = Math.min(255, Math.floor(G * (100 + percent) / 100));
      const b = Math.min(255, Math.floor(B * (100 + percent) / 100));

      const rr = r.toString(16).padStart(2, '0');
      const gg = g.toString(16).padStart(2, '0');
      const bb = b.toString(16).padStart(2, '0');

      return `#${rr}${gg}${bb}`;
    }
    const lighterColor = shadeColor(primaryColor, 15);

    // 3) Construction du conteneur principal
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .form-card {
          /* Pour occuper toute la largeur disponible dans le chat */
          width: 100%;
          /* On ajoute un peu de marge en haut/bas pour l'aération */
          margin: 10px 0;
          background-color: #ffffff;
          border-radius: 8px;
          padding: 20px 25px;
          box-sizing: border-box;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
        }
        .form-card h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.2em;
          font-weight: 600;
          color: ${primaryColor};
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          font-size: 0.85em;
          color: #666;
          margin-bottom: 5px;
        }
        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="tel"] {
          width: 100%;
          padding: 10px;
          font-size: 0.9em;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input[type="text"]:focus,
        .form-group input[type="email"]:focus,
        .form-group input[type="tel"]:focus {
          border-color: ${primaryColor};
        }
        .form-group input.invalid {
          border-color: red;
        }
        .submit-btn {
          display: inline-block;
          width: 100%;
          padding: 12px 0;
          border-radius: 4px;
          border: none;
          background: linear-gradient(to right, ${primaryColor}, ${lighterColor});
          color: #fff;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .submit-btn:hover {
          background: linear-gradient(to right, ${lighterColor}, ${primaryColor});
        }
        .form-footer {
          margin-top: 10px;
          font-size: 0.8em;
          color: #999;
          text-align: center;
        }
      </style>

      <div class="form-card">
        <h2 id="form-title"></h2>
        <form id="dynamic-form"></form>
        <div class="form-footer" id="form-footer"></div>
      </div>
    `;

    // 4) Sélection des éléments
    const formCard = container.querySelector('.form-card');
    const formElement = formCard.querySelector('#dynamic-form');
    const titleElement = formCard.querySelector('#form-title');
    const footerElement = formCard.querySelector('#form-footer');

    // Titre
    titleElement.textContent = formTitle;

    // Si confidentialityText est vide, on masque le footer
    if (!confidentialityText.trim()) {
      footerElement.style.display = 'none';
    } else {
      footerElement.textContent = confidentialityText;
    }

    // 5) Génération dynamique des champs
    fields.forEach((field) => {
      const formGroup = document.createElement('div');
      formGroup.classList.add('form-group');

      const label = document.createElement('label');
      label.setAttribute('for', field.name);
      label.textContent = field.label;

      const input = document.createElement('input');
      input.setAttribute('name', field.name);
      input.setAttribute('type', field.type || 'text');
      if (field.required) input.required = true;
      if (field.pattern) input.pattern = field.pattern;

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      formElement.appendChild(formGroup);
    });

    // 6) Bouton Submit
    const submitBtn = document.createElement('button');
    submitBtn.textContent = submitText;
    submitBtn.classList.add('submit-btn');
    formElement.appendChild(submitBtn);

    // 7) Gestion de la soumission
    formElement.addEventListener('submit', function (event) {
      event.preventDefault();

      const formData = {};
      fields.forEach((field) => {
        const input = formElement.querySelector(`input[name="${field.name}"]`);
        if (!input.checkValidity()) {
          input.classList.add('invalid');
        } else {
          input.classList.remove('invalid');
        }
        formData[field.name] = input.value;
      });

      if (!formElement.checkValidity()) return;

      // Empêche les doubles envois
      submitBtn.remove();

      // Envoie les données à Voiceflow
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: formData
      });
    });

    // 8) Ajout du conteneur au DOM
    element.appendChild(container);
  },
};
