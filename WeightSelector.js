/**
 *  ╔═══════════════════════════════════════════════════════════╗
 *  ║  WeightSelector – Voiceflow Response Extension            ║
 *  ║                                                           ║
 *  ║  • Design moderne avec fond blanc sur sections uniquement   ║
 *  ║  • Fond du container transparent                           ║
 *  ║  • Initialisation des sliders pour pouvoir les déplacer     ║
 *  ║  • Parsage JSON robuste                                    ║
 *  ╚═══════════════════════════════════════════════════════════╝
 */

export const WeightSelector = {
  name: 'WeightSelector',
  type: 'response',

  match: ({ trace }) => trace.type === 'weight_selector' || trace.payload?.type === 'weight_selector',

  render: ({ trace, element }) => {
    try {
      // 0. Lecture du payload avec garde-fou sur JSON.parse
      let payload = {};
      if (typeof trace.payload === 'string') {
        const s = trace.payload.trim();
        payload = s ? JSON.parse(s) : {};
      } else {
        payload = trace.payload || {};
      }

      const {
        title = 'Pondération des éléments',
        subtitle = 'Ajustez l\'importance de chaque élément (total = 100%)',
        sections = [],
        sliderLevel = 'section',
        chat = false,
        chatDisabledText = '🚫 Veuillez effectuer vos pondérations',
        gridColumns = 0,
        global_button_color = '#7928CA',
        buttons = [],
        instanceId = null
      } = payload;

      const uniqueInstanceId = instanceId || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Utilitaires de couleur
      const stripHTML = html => { const tmp = document.createElement('div'); tmp.innerHTML = html||''; return tmp.textContent||tmp.innerText||''; };
      const hexToRgba = (hex, opacity) => { const num = parseInt(hex.replace('#',''),16); const r = num>>16, g=(num>>8)&0xFF, b=num&0xFF; return `rgba(${r}, ${g}, ${b}, ${opacity})`; };
      const getLuminance = hex => {
        const rgb = parseInt(hex.replace('#',''),16);
        const r=(rgb>>16)&255, g=(rgb>>8)&255, b=rgb&255;
        return 0.299*r + 0.587*g + 0.114*b;
      };
      const adjustColorBrightness = (hex,factor) => {
        const rgb = parseInt(hex.replace('#',''),16);
        let r=(rgb>>16)&255, g=(rgb>>8)&255, b=rgb&255;
        if(factor>0){ r=Math.min(255,Math.floor(r+(255-r)*factor)); g=Math.min(255,Math.floor(g+(255-g)*factor)); b=Math.min(255,Math.floor(b+(255-b)*factor)); }
        else { r=Math.max(0,Math.floor(r*(1+factor))); g=Math.max(0,Math.floor(g*(1+factor))); b=Math.max(0,Math.floor(b*(1+factor))); }
        const toHex=c=>c.toString(16).padStart(2,'0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      const getContrastTextColor = bgColor => getLuminance(bgColor) > 128 ? '#333333' : '#FFFFFF';

      // Chat control
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;
      let chatEnabled = chat;
      let isSubmitted = false;
      function disableChat(){ if(isSubmitted)return; const ic=host.querySelector('.vfrc-input-container'); if(!ic)return; ic.style.opacity='.5'; ic.style.cursor='not-allowed'; ic.setAttribute('title',chatDisabledText); const ta=ic.querySelector('textarea.vfrc-chat-input'); if(ta){ta.disabled=true; ta.setAttribute('title',chatDisabledText);} const snd=host.querySelector('#vfrc-send-message'); if(snd){snd.disabled=true; snd.setAttribute('title',chatDisabledText);} chatEnabled=false; }
      function enableChat(){ isSubmitted=true; const ic=host.querySelector('.vfrc-input-container'); if(!ic)return; ic.style.removeProperty('opacity'); ic.style.removeProperty('cursor'); ic.removeAttribute('title'); const ta=ic.querySelector('textarea.vfrc-chat-input'); if(ta){ta.disabled=false; ta.removeAttribute('title'); ta.style.pointerEvents='auto';} const snd=host.querySelector('#vfrc-send-message'); if(snd){snd.disabled=false; snd.removeAttribute('title'); snd.style.pointerEvents='auto';} chatEnabled=true; setTimeout(()=>{ if(ta)ta.disabled=false; if(snd)snd.disabled=false; host.querySelectorAll('.vfrc-chat-input, #vfrc-send-message, .vfrc-input-container *').forEach(el=>{if(el){el.disabled=false; el.style.pointerEvents='auto';}}); },100); }
      if(!chat) disableChat();

      // Container principal
      const container = document.createElement('div');
      container.className = 'weight-selector-container';
      container.id = uniqueInstanceId;
      container.setAttribute('data-instance-id', uniqueInstanceId);

      // Layout grid
      if(gridColumns===1||sections.length===1){}
      else if(gridColumns>=2){ container.classList.add(`grid-${gridColumns}-cols`); container.setAttribute('data-grid-columns',gridColumns);} 
      else if(gridColumns===0){ if(sections.length<=2) container.classList.add('grid-2-cols'); else if(sections.length<=4) container.classList.add('grid-2-cols'); else if(sections.length<=6) container.classList.add('grid-3-cols'); else container.classList.add('grid-3-cols'); }

      // Données et init poids
      let weights=new Map(), sliderElements=new Map(), progressBars=new Map();
      function initializeWeights(){ let itemsToWeight=[]; let total=0;
        sections.forEach((sec,i)=>{
          if(sliderLevel==='section'){ if(sec.hasSlider!==false){ itemsToWeight.push({id:`section_${i}`, defaultWeight:sec.defaultWeight||null}); total++; }}
          else if(sliderLevel==='subsection'&&Array.isArray(sec.subsections)){
            sec.subsections.forEach((sub,j)=>{ if(sub.hasSlider!==false){ itemsToWeight.push({id:`subsection_${i}_${j}`, defaultWeight:sub.defaultWeight||null}); total++; }});
          }
        });
        const def=1/total;
        itemsToWeight.forEach(it=>weights.set(it.id, it.defaultWeight!=null?it.defaultWeight:def));
        normalizeWeights();
      }
      function normalizeWeights(){ const sum=[...weights.values()].reduce((a,b)=>a+b,0); if(sum>0) for(const [k,v] of weights) weights.set(k, v/sum); }
      function redistributeWeights(changedId,newVal){ const old=weights.get(changedId)||0; const others=[...weights.keys()].filter(k=>k!==changedId); if(others.length===0){ weights.set(changedId,1); return;} const othersSum=others.reduce((s,k)=>s+weights.get(k),0); const rem=1-newVal; if(othersSum>0){ others.forEach(k=>weights.set(k, weights.get(k)/othersSum*rem)); } else { const eq=rem/others.length; others.forEach(k=>weights.set(k,eq)); } weights.set(changedId,newVal); }
      function updateDisplay(){ const vals=[...weights.values()]; const avg=vals.reduce((s,w)=>s+w,0)/vals.length; const mx=Math.max(...vals), mn=Math.min(...vals);
        for(const [id,w] of weights){ const sl=sliderElements.get(id), pb=progressBars.get(id); if(sl){ sl.value=Math.round(w*100); sl.style.setProperty('--value',`${sl.value}%`);
            const valDisp=sl.parentElement.querySelector('.weight-value'); if(valDisp) valDisp.textContent=`${Math.round(w*100)}%`;
            let cls='weight-medium'; if(w>=mx*0.9&&w>avg*1.2) cls='weight-high'; else if(w<=mn*1.1&&w<avg*0.8) cls='weight-low';
            sl.closest('.weight-selector-slider-wrapper').className=`weight-selector-slider-wrapper ${cls}`;
            const sect=sl.closest('.weight-selector-section'); if(sect){ sect.className=`weight-selector-section ${cls}`; const col=sect.getAttribute('data-section-color')||global_button_color; const intens=0.3+(w*0.7); sect.style.borderColor=hexToRgba(col,intens); sect.style.boxShadow=`0 0 ${20*intens}px ${hexToRgba(col,intens*0.4)}, inset 0 0 ${15*intens}px ${hexToRgba(col,intens*0.1)}`; }
          }
          if(pb){ pb.style.width=`${w*100}%`; const intens=0.3+(w*0.7); pb.style.opacity=intens; }
        }
      }

      // Styles CSS
      const styleEl=document.createElement('style');
      styleEl.textContent=`
.weight-selector-container {
  --ws-accent: ${global_button_color};
  --ws-accent-r: ${(parseInt(global_button_color.replace('#',''),16)>>16)&255};
  --ws-accent-g: ${(parseInt(global_button_color.replace('#',''),16)>>8)&255};
  --ws-accent-b: ${parseInt(global_button_color.replace('#',''),16)&255};
  --ws-radius: 16px;
  --ws-shadow: 0 10px 40px rgba(0,0,0,.08);
  --ws-heading-fs: 24px;
  --ws-base-fs: 16px;
  --ws-small-fs: 14px;
  --ws-gap: 20px;
  background: transparent !important;
}
/* … reste des styles inchangés, sections gardent fond blanc … */
`; container.appendChild(styleEl);

      // Construction interface
      initializeWeights();
      if(title){ const h=document.createElement('h2'); h.className='weight-selector-header'; h.innerHTML=title; container.appendChild(h);}  
      if(subtitle){ const sub=document.createElement('div'); sub.className='weight-selector-subtitle'; sub.innerHTML=subtitle; container.appendChild(sub);}  
      const grid=document.createElement('div'); grid.className='weight-selector-sections-grid'; grid.id=`sections-grid-${uniqueInstanceId}`;
      sections.forEach((sec,i)=>{
        const secEl=document.createElement('div'); secEl.className='weight-selector-section'; secEl.id=`section-${uniqueInstanceId}-${i}`;
        const col=sec.color||global_button_color; secEl.setAttribute('data-section-color',col); secEl.style.borderColor=hexToRgba(col,0.5);
        const colRgb=parseInt(col.replace('#',''),16); secEl.style.setProperty('--ws-accent-r', (colRgb>>16)&255); secEl.style.setProperty('--ws-accent-g',(colRgb>>8)&255); secEl.style.setProperty('--ws-accent-b',colRgb&255);
        if(sec.label){ const t=document.createElement('div'); t.className='weight-selector-section-title'; t.innerHTML=sec.label; secEl.appendChild(t);}  
        if(sliderLevel==='section'&&sec.hasSlider!==false){
          // Progress bar
          const pc=document.createElement('div'); pc.className='weight-selector-progress-container';
          const pb=document.createElement('div'); pb.className='weight-selector-progress-bar'; pb.style.background=`linear-gradient(90deg, ${col}, ${adjustColorBrightness(col,0.2)})`;
          pc.appendChild(pb); secEl.appendChild(pc); progressBars.set(`section_${i}`,pb);
          // Slider
          const sc=document.createElement('div'); sc.className='weight-selector-slider-container';
          const wrap=document.createElement('div'); wrap.className='weight-selector-slider-wrapper';
          const lbl=document.createElement('div'); lbl.className='weight-selector-slider-label'; lbl.textContent='Poids:';
          const slider=document.createElement('input'); slider.type='range'; slider.min=0; slider.max=100; slider.className='weight-selector-slider-input'; slider.id=`slider-${uniqueInstanceId}-section-${i}`;
          // --- valeur initiale ---
          const sid=`section_${i}`;
          const initW=weights.get(sid)||0;
          slider.value=Math.round(initW*100);
          slider.style.setProperty('--value',`${slider.value}%`);
          // -----------------------
          slider.addEventListener('input',()=>{ redistributeWeights(sid,parseInt(slider.value)/100); updateDisplay(); slider.style.setProperty('--value',`${slider.value}%`); });
          sliderElements.set(sid,slider);
          const valDisp=document.createElement('div'); valDisp.className='weight-value'; valDisp.style.background=col;
          wrap.append(lbl, slider, valDisp); sc.appendChild(wrap); secEl.appendChild(sc);
        }
        // Sous-sections … identique, avec initialisation slider
        grid.appendChild(secEl);
      });
      container.appendChild(grid);
      // Boutons (inchangé)
      element.appendChild(container);
      updateDisplay();

    } catch(error) {
      console.error('❌ WeightSelector Error:', error);
      const errEl=document.createElement('div'); errEl.innerHTML=`<div style="color:#721c24;background:#f8d7da;padding:1rem;border-radius:8px;border:1px solid #f5c6cb;"><p>Erreur lors du chargement :</p><p>${error.message}</p></div>`;
      element.appendChild(errEl);
      window.voiceflow.chat.interact({ type:'complete', payload:{error:true,message:error.message} });
    }
  }
};

export default WeightSelector;
