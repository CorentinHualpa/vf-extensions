export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',

  match: ({ trace }) => trace.payload && trace.type === 'multi_select'),

  render: ({ trace, element }) => {
    try {
      // 1) Crée un hôte pour le Shadow DOM
      const host = document.createElement('div')
      // optionnel : donne-lui une classe/id pour debug
      host.classList.add('multi-select-shadow-host')
      // 2) Attache le Shadow root (mode open pour pouvoir accéder depuis la console si besoin)
      const shadow = host.attachShadow({ mode: 'open' })

      // 3) À partir d'ici, on construit tout DANS shadow, pas dans element
      //    => Aucune règle CSS du parent ne pourra passer.

      // utilitaire pour nettoyer un HTML échappé
      const stripHTML = (html = '') => {
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        return tmp.textContent || ''
      }

      // 4) récupère le payload
      const {
        sections = [],
        buttons = [],
        buttonColor = '#4CAF50',
        backgroundOpacity = 0.8,
        totalMaxSelect = 6,
        multiselect = true,
      } = trace.payload

      // 5) Crée le container principal et y injecte le <style> encapsulé
      const container = document.createElement('div')
      container.classList.add('multiselect-container')

      const styleEl = document.createElement('style')
      styleEl.textContent = `
        /* RESET TOTALE DANS LE SHADOW */
        *, *::before, *::after {
          all: initial;
          box-sizing: border-box;
        }
        /* Tous vos styles ci‑dessous s’appliquent UNIQUEMENT DANS LE SHADOW */
        .multiselect-container {
          all: unset;
          width:100%;
          font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
          font-size:0.9em;
          display:flex;
          flex-direction:column;
        }
        .sections-grid {
          display:flex; flex-wrap:wrap; gap:16px; justify-content:center;
        }
        .section-container {
          all: unset;
          flex:0 1 calc(50% - 16px);
          min-width:300px;
          background-color:#673AB7;
          border-radius:6px;
          display:flex;
          flex-direction:column;
          overflow:hidden;
          margin:8px;
        }
        @media(max-width:800px){
          .section-container { flex:1 1 100%; margin:4px 0; }
        }
        .section-title {
          all: unset;
          display:block;
          padding:12px 16px;
          background: linear-gradient(90deg,#C29BFF,#7E2BD4,#4A1B8E);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight:700;
          font-size:1.1em;
          border-bottom:1px solid rgba(255,255,255,0.3);
        }
        .options-list {
          all: unset;
          display:flex; flex-direction:column;
        }
        .option-container {
          all: unset;
          display:flex; align-items:center; padding:4px 8px;
        }
        .option-container.greyed-out-option label {
          opacity:0.5;
          cursor:not-allowed;
        }
        .option-container label {
          all: unset;
          display:flex; align-items:center;
          gap:8px;
          width:100%;
          padding:8px;
          background:rgba(0,0,0,${backgroundOpacity});
          color:#fff;
          border-radius:4px;
          cursor:pointer;
          transition: background 0.2s;
        }
        .option-container label:hover {
          background:rgba(0,0,0,${Math.min(backgroundOpacity+0.1,1)});
        }
        .option-container input {
          all: unset;
          width:16px; height:16px; cursor:pointer;
          accent-color: ${buttonColor};
        }
        .option-container input[type="radio"] {
          appearance: radio;
          -webkit-appearance: radio;
          border-radius:50%;
        }
        .option-container input:checked + label {
          background: ${buttonColor};
        }
        .buttons-container {
          all: unset;
          display:flex; justify-content:center; gap:10px; padding:12px;
        }
        .submit-btn {
          all: unset;
          background: ${buttonColor};
          color: #fff;
          padding:8px 12px;
          border-radius:4px;
          font-weight:600;
          cursor:pointer;
          transition: opacity 0.2s;
        }
        .submit-btn:hover { opacity:0.85; }
        .multiselect-container.disabled-container {
          opacity:0.5; pointer-events:none;
        }
      `
      shadow.appendChild(styleEl)

      // 6) Fonctions annexes
      const updateTotalChecked = () => {
        const inputs = Array.from(container.querySelectorAll('input'))
        const n = inputs.filter(i => i.checked).length
        if (totalMaxSelect > 0 && n >= totalMaxSelect && multiselect) {
          inputs.forEach(i => { if (!i.checked) i.disabled = true })
        } else {
          inputs.forEach(i => {
            if (!i.closest('.greyed-out-option')) i.disabled = false
          })
        }
      }

      const createOptionElement = (opt, sectionIndex) => {
        if (Array.isArray(opt.children) && opt.children.length) {
          const block = document.createElement('div')
          block.classList.add('non-selectable-block')
          block.innerHTML = opt.name
          const cw = document.createElement('div')
          cw.classList.add('children-options')
          opt.children.forEach(ch => cw.appendChild(createOptionElement(ch, sectionIndex)))
          block.appendChild(cw)
          return block
        }
        const wrap = document.createElement('div')
        wrap.classList.add('option-container')
        if (opt.grey) wrap.classList.add('greyed-out-option')
        const input = document.createElement('input')
        input.type = multiselect ? 'checkbox' : 'radio'
        if (opt.grey) input.disabled = true
        input.addEventListener('change', () => {
          updateTotalChecked()
          if (!multiselect) {
            container.classList.add('disabled-container')
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: { selection: opt.name, buttonPath: 'Default' }
            })
          }
        })
        const label = document.createElement('label')
        label.appendChild(input)
        const span = document.createElement('span')
        span.innerHTML = opt.name
        label.appendChild(span)
        wrap.appendChild(label)
        return wrap
      }

      // 7) Montre les sections
      const grid = document.createElement('div')
      grid.classList.add('sections-grid')
      sections.forEach((sec, idx) => {
        const sDiv = document.createElement('div')
        sDiv.classList.add('section-container')
        if (sec.color) sDiv.style.backgroundColor = sec.color

        const txt = stripHTML(sec.label)
        if (txt) {
          const h2 = document.createElement('h2')
          h2.classList.add('section-title')
          h2.textContent = txt
          sDiv.appendChild(h2)
        }

        const opts = document.createElement('div')
        opts.classList.add('options-list')
        ;(sec.options || []).forEach(opt => opts.appendChild(createOptionElement(opt, idx)))
        sDiv.appendChild(opts)
        grid.appendChild(sDiv)
      })
      container.appendChild(grid)

      // 8) Ajoute les boutons si multi-select
      if (multiselect && buttons.length) {
        const bc = document.createElement('div')
        bc.classList.add('buttons-container')
        buttons.forEach(bcConf => {
          const b = document.createElement('button')
          b.classList.add('submit-btn')
          b.textContent = bcConf.text
          b.addEventListener('click', () => {
            container.classList.add('disabled-container')
            const final = sections.map((sec, i) => {
              const dom = grid.children[i]
              const ch = Array.from(dom.querySelectorAll('input:checked'))
              let sels = [], all = false
              ch.forEach(cb => {
                if (cb.closest('.option-container').dataset.action === 'all') all = true
                else sels.push(cb.parentNode.querySelector('span').textContent.trim())
              })
              if (all) {
                const allOpts = Array.from(dom.querySelectorAll('.option-container'))
                  .filter(d=>d.dataset.action!=='all')
                  .map(d=>d.querySelector('span').textContent.trim())
                sels = Array.from(new Set([...sels, ...allOpts]))
              }
              return { section: sec.label, selections: sels, userInput: '' }
            }).filter(x=>x)
            window.voiceflow.chat.interact({
              type:'complete',
              payload:{
                selections: final,
                buttonText: bcConf.text,
                buttonPath: /Revenir|Return/.test(bcConf.text) ? 'Previous_step' : (bcConf.path||'Default'),
                isEmpty: final.every(r=>r.selections.length===0)
              }
            })
          })
          bc.appendChild(b)
        })
        container.appendChild(bc)
      }

      // 9) Injecte finalement le host dans l’élément parent
      shadow.appendChild(container)
      element.appendChild(host)

      console.log("✅ MultiSelect isolé prêt")
    }
    catch(err) {
      console.error("MultiSelect render error:", err)
      window.voiceflow.chat.interact({
        type:'complete',
        payload:{ error:true, message:err.message }
      })
    }
  }
}
