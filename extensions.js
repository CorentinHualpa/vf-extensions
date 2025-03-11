export const FormExtension = {
  name: 'Forms',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_form' || trace.payload?.name === 'ext_form',

  render: ({ trace, element }) => {
    // On récupère la liste des champs depuis le payload
    const fields = trace.payload?.fields || [];

    // Crée un formulaire vide
    const formContainer = document.createElement('form');

    // On peut insérer du style global ici
    formContainer.innerHTML = `
      <style>
        label {
          font-size: 0.8em;
          color: #888;
          display: block;
          margin-top: 10px;
        }
        input[type="text"], input[type="email"], input[type="tel"] {
          width: 100%;
          border: none;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          margin: 5px 0;
          outline: none;
        }
        .invalid {
          border-color: red;
        }
        .submit {
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 5px;
          width: 100%;
          cursor: pointer;
          margin-top: 15px;
        }
      </style>
    `;

    // Pour chaque champ décrit dans le payload, on crée un label et un input
    fields.forEach((field) => {
      const label = document.createElement('label');
      label.setAttribute('for', field.name);
      label.textContent = field.label;

      const input = document.createElement('input');
      input.setAttribute('name', field.name);
      input.setAttribute('type', field.type || 'text');
      if (field.required) input.required = true;
      if (field.pattern) input.pattern = field.pattern;

      // Ajout au formulaire
      formContainer.appendChild(label);
      formContainer.appendChild(input);
    });

    // Bouton Submit
    const submitBtn = document.createElement('input');
    submitBtn.setAttribute('type', 'submit');
    submitBtn.setAttribute('value', 'Submit');
    submitBtn.classList.add('submit');
    formContainer.appendChild(submitBtn);

    // Écouteur de soumission du formulaire
    formContainer.addEventListener('submit', function (event) {
      event.preventDefault();

      // Récupération des valeurs de manière dynamique
      const formData = {};
      fields.forEach((field) => {
        const input = formContainer.querySelector(`input[name="${field.name}"]`);
        if (!input.checkValidity()) {
          input.classList.add('invalid');
        } else {
          input.classList.remove('invalid');
        }
        formData[field.name] = input.value;
      });

      // Vérifier la validité globale
      if (!formContainer.checkValidity()) {
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

    // Ajout du formulaire au DOM
    element.appendChild(formContainer);
  },
};
