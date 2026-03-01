/**
 *  ╔════════════════════════════════════════════════╗
 *  ║  MultiSelect V3 – Clean & Minimal Edition      ║
 *  ║                                                ║
 *  ║  Thèmes : dark (défaut) / light               ║
 *  ║  Config minimale : color + sections            ║
 *  ╚════════════════════════════════════════════════╝
 *
 *  PAYLOAD MINIMAL :
 *  {
 *    "color": "#3778F4",
 *    "sections": [
 *      { "label": "Ma section", "options": [{ "name": "Option A" }, { "name": "Option B" }] }
 *    ]
 *  }
 *
 *  PAYLOAD COMPLET :
 *  {
 *    "color": "#3778F4",
 *    "theme": "dark",              // "dark" | "light"
 *    "multiselect": true,
 *    "totalMaxSelect": 0,          // 0 = illimité
 *    "minSelect": 1,               // minimum requis pour valider
 *    "gridColumns": 2,             // 1 ou 2
 *    "useGlobalAll": false,
 *    "globalAllSelectText": "Tout sélectionner",
 *    "globalAllDeselectText": "Tout désélectionner",
 *    "chat": true,                 // false = désactive le chat pendant la sélection
 *    "chatDisabledText": "🚫",
 *    "buttonFontSize": 14,
 *    "sections": [...],
 *    "buttons": [
 *      { "text": "Confirmer", "path": "Default" },
 *      { "text": "◀️ Retour", "path": "Previous_step" }
 *    ]
 *  }
 */

export const MultiSelect = {
  name: 'MultiSelect',
  type: 'response',
  match: ({ trace }) => trace.payload && trace.type === 'multi_select',

  render: ({ trace, element }) => {
    try {
      // ── Payload & defaults ──────────────────────────────────
      const {
        color           = '#3778F4',
        theme           = 'dark',
        multiselect     = true,
        totalMaxSelect  = 0,
        minSelect       = 1,
        gridColumns     = 2,
        useGlobalAll    = false,
        globalAllSelectText   = 'Tout sélectionner',
        globalAllDeselectText = 'Tout désélectionner',
        chat            = true,
        chatDisabledText = '🚫',
        buttonFontSize  = 14,
        sections        = [],
        buttons         = [{ text: 'Confirmer', path: 'Default' }],
      } = trace.payload;

      const uid = `ms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const isDark = theme === 'dark';

      // ── Helpers ─────────────────────────────────────────────
      const hexToRgb = hex => {
        const n = parseInt(hex.replace('#', ''), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      };
      const rgb = hexToRgb(color);
      const lighten = (hex, pct) => {
        const { r, g, b } = hexToRgb(hex);
        const l = c => Math.min(255, Math.floor(c + (255 - c) * pct));
        return `rgb(${l(r)},${l(g)},${l(b)})`;
      };

      // ── Theme tokens ────────────────────────────────────────
      const T = isDark
        ? {
            bg: 'rgba(20,20,30,0.95)',
            cardBg: `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`,
            cardBorder: 'rgba(255,255,255,0.1)',
            text: '#f0f0f0',
            textMuted: 'rgba(255,255,255,0.6)',
            optionBg: 'rgba(255,255,255,0.06)',
            optionHover: 'rgba(255,255,255,0.12)',
            optionSelected: `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`,
            optionSelectedBorder: `rgba(${rgb.r},${rgb.g},${rgb.b},0.7)`,
            inputBg: 'rgba(255,255,255,0.08)',
            inputBorder: 'rgba(255,255,255,0.2)',
            inputFocusBorder: color,
            checkBg: 'rgba(255,255,255,0.15)',
            checkActive: color,
            shadow: '0 4px 24px rgba(0,0,0,0.4)',
          }
        : {
            bg: '#ffffff',
            cardBg: `rgba(${rgb.r},${rgb.g},${rgb.b},0.05)`,
            cardBorder: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
            text: '#1a1a2e',
            textMuted: '#666',
            optionBg: '#f5f5f7',
            optionHover: `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`,
            optionSelected: `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`,
            optionSelectedBorder: color,
            inputBg: '#f9f9fb',
            inputBorder: '#ddd',
            inputFocusBorder: color,
            checkBg: '#e0e0e0',
            checkActive: color,
            shadow: '0 4px 24px rgba(0,0,0,0.08)',
          };

      // ── Shadow DOM refs ─────────────────────────────────────
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? root : document;

      // ── Chat control ────────────────────────────────────────
      const setChat = enabled => {
        const ic = host.querySelector('.vfrc-input-container');
        if (!ic) return;
        ic.style.opacity = enabled ? '' : '.45';
        ic.style.pointerEvents = enabled ? '' : 'none';
        const ta = ic.querySelector('textarea.vfrc-chat-input');
        if (ta) { ta.disabled = !enabled; ta.placeholder = enabled ? '' : chatDisabledText; }
        const snd = host.querySelector('#vfrc-send-message');
        if (snd) snd.disabled = !enabled;
      };
      if (!chat) setChat(false);

      // ── Lock UI after interact ──────────────────────────────
      const lock = () => {
        container.classList.add('ms-locked');
        setChat(true);
      };

      // ── Container ───────────────────────────────────────────
      const container = document.createElement('div');
      container.id = uid;
      container.className = `ms ${isDark ? 'ms--dark' : 'ms--light'}`;

      // ── CSS ─────────────────────────────────────────────────
      const fs = buttonFontSize;
      const style = document.createElement('style');
      style.textContent = `
/* ── Reset ────────────────────────────────────── */
#${uid}, #${uid} * { box-sizing: border-box; margin: 0; padding: 0; }

#${uid} {
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  font-size: ${fs}px;
  line-height: 1.5;
  color: ${T.text};
  width: 100%;
}

/* ── Grid ─────────────────────────────────────── */
#${uid} .ms-grid {
  display: grid;
  grid-template-columns: ${gridColumns >= 2 ? 'repeat(2, 1fr)' : '1fr'};
  gap: 8px;
}
@media (max-width: 480px) {
  #${uid} .ms-grid { grid-template-columns: 1fr; }
}

/* ── Section card ─────────────────────────────── */
#${uid} .ms-card {
  background: ${T.cardBg};
  border: 1px solid ${T.cardBorder};
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#${uid} .ms-card:hover {
  transform: translateY(-2px);
  box-shadow: ${T.shadow};
}

#${uid} .ms-card-title {
  padding: 12px 16px;
  font-weight: 700;
  font-size: ${Math.round(fs * 1.1)}px;
  border-bottom: 1px solid ${T.cardBorder};
  color: ${T.text};
}

#${uid} .ms-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

/* ── Option row ───────────────────────────────── */
#${uid} .ms-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${T.optionBg};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  border: 1.5px solid transparent;
  user-select: none;
}
#${uid} .ms-opt:hover {
  background: ${T.optionHover};
  transform: scale(1.01);
}
#${uid} .ms-opt.ms-opt--selected {
  background: ${T.optionSelected};
  border-color: ${T.optionSelectedBorder};
}
#${uid} .ms-opt.ms-opt--disabled {
  opacity: 0.4;
  pointer-events: none;
}
#${uid} .ms-opt.ms-opt--all {
  font-style: italic;
  border-style: dashed;
  border-color: ${T.cardBorder};
}
#${uid} .ms-opt.ms-opt--all.ms-opt--selected {
  border-style: solid;
  border-color: ${T.optionSelectedBorder};
}

/* ── Custom checkbox/radio ────────────────────── */
#${uid} .ms-check {
  width: ${Math.round(fs * 1.15)}px;
  height: ${Math.round(fs * 1.15)}px;
  min-width: ${Math.round(fs * 1.15)}px;
  border-radius: 50%;
  border: 2px solid ${T.checkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, background 0.15s;
}
#${uid} .ms-opt--selected .ms-check {
  border-color: ${T.checkActive};
  background: ${T.checkActive};
}
#${uid} .ms-opt--selected .ms-check::after {
  content: '';
  width: ${Math.round(fs * 0.45)}px;
  height: ${Math.round(fs * 0.45)}px;
  border-radius: 50%;
  background: #fff;
}

/* ── User input ───────────────────────────────── */
#${uid} .ms-input-wrap {
  padding: 8px;
}
#${uid} .ms-input-label {
  font-size: ${Math.round(fs * 0.9)}px;
  color: ${T.textMuted};
  margin-bottom: 6px;
  display: block;
}
#${uid} .ms-textarea {
  width: 100%;
  min-height: ${Math.round(fs * 5)}px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid ${T.inputBorder};
  background: ${T.inputBg};
  color: ${T.text};
  font-family: inherit;
  font-size: ${fs}px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
#${uid} .ms-textarea:focus {
  border-color: ${T.inputFocusBorder};
  box-shadow: 0 0 0 3px rgba(${rgb.r},${rgb.g},${rgb.b},0.15);
}
#${uid} .ms-textarea::placeholder { color: ${T.textMuted}; font-style: italic; }

/* ── Global all ───────────────────────────────── */
#${uid} .ms-global-all {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
#${uid} .ms-global-all-btn {
  background: ${isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f2'};
  color: ${T.text};
  border: 1.5px dashed ${T.cardBorder};
  border-radius: 8px;
  padding: 8px 20px;
  font-size: ${fs}px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
#${uid} .ms-global-all-btn:hover {
  background: ${isDark ? 'rgba(255,255,255,0.14)' : '#e8e8ec'};
  border-style: solid;
}
#${uid} .ms-global-all-btn.ms-active {
  background: ${T.optionSelected};
  border-color: ${T.optionSelectedBorder};
  border-style: solid;
}

/* ── Buttons ──────────────────────────────────── */
#${uid} .ms-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0 4px;
  justify-content: center;
}
#${uid} .ms-btn-wrap { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 140px; max-width: 280px; }
#${uid} .ms-btn {
  width: 100%;
  padding: ${Math.round(fs * 0.85)}px ${Math.round(fs * 1.5)}px;
  border: none;
  border-radius: 10px;
  background: ${color};
  color: #fff;
  font-size: ${fs}px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  box-shadow: 0 2px 8px rgba(${rgb.r},${rgb.g},${rgb.b},0.3);
  position: relative;
  overflow: hidden;
}
#${uid} .ms-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(${rgb.r},${rgb.g},${rgb.b},0.4);
}
#${uid} .ms-btn:active { transform: translateY(1px); }

#${uid} .ms-btn-secondary {
  background: ${isDark ? 'rgba(255,255,255,0.1)' : '#e8e8ec'};
  color: ${T.text};
  box-shadow: none;
}
#${uid} .ms-btn-secondary:hover {
  background: ${isDark ? 'rgba(255,255,255,0.18)' : '#ddd'};
  box-shadow: none;
}

#${uid} .ms-error {
  color: #ef4444;
  font-size: ${Math.round(fs * 0.8)}px;
  margin-top: 4px;
  text-align: center;
  min-height: ${Math.round(fs * 1.2)}px;
}

/* ── Shake ────────────────────────────────────── */
@keyframes ms-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
#${uid} .ms-shake { animation: ms-shake 0.35s ease; }

/* ── Locked state ─────────────────────────────── */
#${uid}.ms-locked { opacity: 0.5; pointer-events: none; }

@media (max-width: 480px) {
  #${uid} .ms-buttons { flex-direction: column; }
  #${uid} .ms-btn-wrap { max-width: none; }
}
`;
      container.appendChild(style);

      // ── State ───────────────────────────────────────────────
      const inputs = new Map();

      // ── Update logic ────────────────────────────────────────
      const getAllInputs = () => Array.from(inputs.keys());

      const countChecked = () => getAllInputs().filter(i => i.checked && inputs.get(i).action !== 'all').length;

      const syncLimits = () => {
        const checked = countChecked();
        getAllInputs().forEach(inp => {
          const meta = inputs.get(inp);
          if (totalMaxSelect > 0 && checked >= totalMaxSelect && !inp.checked && multiselect) {
            inp.closest('.ms-opt')?.classList.add('ms-opt--disabled');
          } else if (meta.action !== 'grey') {
            inp.closest('.ms-opt')?.classList.remove('ms-opt--disabled');
          }
        });

        // Sync per-section "all" toggles
        sections.forEach((_, idx) => {
          const sectionInputs = getAllInputs().filter(i => inputs.get(i).sectionIdx === idx);
          const allInput = sectionInputs.find(i => inputs.get(i).action === 'all');
          if (!allInput) return;
          const others = sectionInputs.filter(i => inputs.get(i).action !== 'all');
          const everyChecked = others.length > 0 && others.every(i => i.checked);
          allInput.checked = everyChecked;
          allInput.closest('.ms-opt')?.classList.toggle('ms-opt--selected', everyChecked);
        });

        // Global all button
        const gBtn = container.querySelector('.ms-global-all-btn');
        if (gBtn) {
          const all = getAllInputs().filter(i => inputs.get(i).action !== 'all');
          const allChecked = all.length > 0 && all.every(i => i.checked);
          gBtn.classList.toggle('ms-active', allChecked);
          gBtn.textContent = allChecked ? `✓ ${globalAllDeselectText}` : globalAllSelectText;
        }
      };

      // ── Build sections ──────────────────────────────────────
      const grid = document.createElement('div');
      grid.className = 'ms-grid';

      sections.forEach((sec, sIdx) => {
        const card = document.createElement('div');
        card.className = 'ms-card';

        const sectionColor = sec.color || color;
        if (isDark) {
          const sc = hexToRgb(sectionColor);
          card.style.background = `rgba(${sc.r},${sc.g},${sc.b},0.12)`;
          card.style.borderColor = `rgba(${sc.r},${sc.g},${sc.b},0.25)`;
        }

        // Title
        if (sec.label) {
          const title = document.createElement('div');
          title.className = 'ms-card-title';
          title.innerHTML = sec.label;
          if (isDark) {
            const sc = hexToRgb(sectionColor);
            title.style.borderBottomColor = `rgba(${sc.r},${sc.g},${sc.b},0.2)`;
          }
          card.appendChild(title);
        }

        // Options
        const body = document.createElement('div');
        body.className = 'ms-card-body';

        (sec.options || []).forEach(opt => {
          // User input field
          if (opt.action === 'user_input') {
            const wrap = document.createElement('div');
            wrap.className = 'ms-input-wrap';
            if (opt.label) {
              const lbl = document.createElement('label');
              lbl.className = 'ms-input-label';
              lbl.textContent = opt.label;
              wrap.appendChild(lbl);
            }
            const ta = document.createElement('textarea');
            ta.className = 'ms-textarea';
            ta.placeholder = opt.placeholder || '';
            ta.rows = 2;
            wrap.appendChild(ta);
            body.appendChild(wrap);
            return;
          }

          // Regular option
          const row = document.createElement('div');
          row.className = 'ms-opt' + (opt.action === 'all' ? ' ms-opt--all' : '') + (opt.grey ? ' ms-opt--disabled' : '');

          const check = document.createElement('div');
          check.className = 'ms-check';

          const label = document.createElement('span');
          label.innerHTML = opt.name;

          const inp = document.createElement('input');
          inp.type = multiselect ? 'checkbox' : 'radio';
          inp.name = multiselect ? `ms-${uid}-${sIdx}` : `ms-${uid}`;
          inp.style.display = 'none';
          if (opt.grey) inp.disabled = true;

          inputs.set(inp, { sectionIdx: sIdx, optName: opt.name, action: opt.action || '' });

          row.appendChild(check);
          row.appendChild(label);
          row.appendChild(inp);

          row.addEventListener('click', () => {
            if (row.classList.contains('ms-opt--disabled')) return;

            if (multiselect) {
              inp.checked = !inp.checked;
            } else {
              getAllInputs().forEach(i => {
                i.checked = false;
                i.closest('.ms-opt')?.classList.remove('ms-opt--selected');
              });
              inp.checked = true;
            }

            row.classList.toggle('ms-opt--selected', inp.checked);

            // "All" toggle logic
            if (opt.action === 'all') {
              const siblings = getAllInputs().filter(i => inputs.get(i).sectionIdx === sIdx && inputs.get(i).action !== 'all');
              siblings.forEach(i => {
                i.checked = inp.checked;
                i.closest('.ms-opt')?.classList.toggle('ms-opt--selected', inp.checked);
              });
            }

            syncLimits();

            // Single select → auto-submit
            if (!multiselect) {
              lock();
              window.voiceflow.chat.interact({
                type: opt.action || 'Default',
                payload: { label: opt.name, selection: opt.name, buttonPath: opt.action || 'Default' },
              });
            }
          });

          body.appendChild(row);
        });

        card.appendChild(body);
        grid.appendChild(card);
      });

      container.appendChild(grid);

      // ── Global all button ───────────────────────────────────
      if (useGlobalAll && multiselect) {
        const wrap = document.createElement('div');
        wrap.className = 'ms-global-all';
        const btn = document.createElement('button');
        btn.className = 'ms-global-all-btn';
        btn.textContent = globalAllSelectText;
        btn.addEventListener('click', () => {
          const all = getAllInputs().filter(i => inputs.get(i).action !== 'all' && !i.disabled);
          const allChecked = all.length > 0 && all.every(i => i.checked);
          all.forEach(i => {
            i.checked = !allChecked;
            i.closest('.ms-opt')?.classList.toggle('ms-opt--selected', !allChecked);
          });
          syncLimits();
        });
        wrap.appendChild(btn);
        container.appendChild(wrap);
      }

      // ── Submit buttons ──────────────────────────────────────
      if (multiselect && buttons.length) {
        const bc = document.createElement('div');
        bc.className = 'ms-buttons';

        buttons.forEach((cfg, i) => {
          const wrap = document.createElement('div');
          wrap.className = 'ms-btn-wrap';

          const btn = document.createElement('button');
          btn.className = i === 0 ? 'ms-btn' : 'ms-btn ms-btn-secondary';
          btn.textContent = cfg.text || 'Confirmer';

          const err = document.createElement('div');
          err.className = 'ms-error';

          btn.addEventListener('click', () => {
            const checked = countChecked();
            const userInputs = Array.from(container.querySelectorAll('.ms-textarea')).filter(t => t.value.trim()).length;
            const total = checked + userInputs;
            const min = cfg.minSelect ?? minSelect;

            if (min > 0 && total < min) {
              btn.classList.add('ms-shake');
              err.textContent = `Sélectionnez au moins ${min} option${min > 1 ? 's' : ''}`;
              setTimeout(() => btn.classList.remove('ms-shake'), 400);
              return;
            }
            err.textContent = '';

            lock();

            const res = sections.map((s, idx) => {
              const sectionInputs = getAllInputs().filter(i => inputs.get(i).sectionIdx === idx);
              const sels = sectionInputs
                .filter(i => i.checked && inputs.get(i).action !== 'all')
                .map(i => inputs.get(i).optName);
              const cardEl = grid.children[idx];
              const ui = cardEl?.querySelector('.ms-textarea')?.value?.trim() || '';
              return { section: s.label, selections: sels, userInput: ui };
            }).filter(r => r.selections.length || r.userInput);

            // Format lisible
            const formatted = res.map(s => {
              let block = s.section + ' :\n';
              if (s.selections.length) block += s.selections.join('\n');
              if (s.userInput) block += (s.selections.length ? '\n' : '') + '(Précision : "' + s.userInput + '")';
              return block;
            }).join('\n\n');

            window.voiceflow.chat.interact({
              type: cfg.path || 'Default',
              payload: {
                label: formatted,
                selections: res,
                formattedResult: formatted,
                buttonText: cfg.text,
                buttonPath: cfg.path || 'Default',
                isEmpty: res.every(r => !r.selections.length && !r.userInput),
              },
            });
          });

          wrap.appendChild(btn);
          wrap.appendChild(err);
          bc.appendChild(wrap);
        });

        container.appendChild(bc);
      }

      // ── Mount ───────────────────────────────────────────────
      element.appendChild(container);
      syncLimits();

    } catch (err) {
      console.error('❌ MultiSelect Error:', err);
      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { error: true, message: err.message },
      });
    }
  },
};

export default MultiSelect;
