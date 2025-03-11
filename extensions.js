export const FormExtension = {
  name: 'Forms',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_form' || trace.payload?.name === 'ext_form',

  render: ({ trace, element }) => {
    // On récupère la liste des champs depuis le payload
    const fields = trace.payload?.fields || [];

    // Crée un conteneur global
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .form-card {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 20px 25px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
          max-width: 300px; /* Ajuste si besoin */
          margin: 10px auto;
        }
        .form-card h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.2em;
          font-weight: 600;
          color: #2e6ee1;
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
          border-color: #2e6ee1;
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
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          color: #fff;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .submit-btn:hover {
          background: linear-gradient(to right, #2e7ff1, #2e6ee1);
        }
        .form-footer {
          margin-top: 10px;
          font-size: 0.8em;
          color: #999;
          text-align: center;
        }
      </style>

      <div class="form-card">
        <h2>Vos coordonnées</h2>
        <form id="dynamic-form"></form>
        <div class="form-footer">
          Vos informations resteront confidentielles.
        </div>
      </div>
    `;

    const formCard = container.querySelector('.form-card');
    const formElement = formCard.querySelector('#dynamic-form');

    // Pour chaque champ décrit dans le payload, on crée un label et un input
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

    // Bouton Submit
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Envoyer';
    submitBtn.classList.add('submit-btn');
    formElement.appendChild(submitBtn);

    // Écouteur de soumission du formulaire
    formElement.addEventListener('submit', function (event) {
      event.preventDefault();

      // Récupération des valeurs de manière dynamique
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

      // Vérifier la validité globale
      if (!formElement.checkValidity()) {
        return; // on ne sort pas du form tant que c'est invalide
      }

      // Retire le bouton pour éviter les doubles envois
      submitBtn.remove();

      // Envoie les données à Voiceflow
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: formData, // => { nom: "...", email: "...", telephone: "..." }
      });
    });

    element.appendChild(container);
  },
};
