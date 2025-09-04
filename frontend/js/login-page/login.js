// Three-line, ordered typewriter for the hero quote.
// Path: /frontend/login-hero.js  (served as /static/login-hero.js)

document.addEventListener('DOMContentLoaded', () => {
  const L1 = document.getElementById('line1');
  const L2 = document.getElementById('line2');
  const L3 = document.getElementById('line3');
  const caret = document.getElementById('caret');
  if (!L1 || !L2 || !L3) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lines = [
    { el: L1, text: (L1.dataset.text || L1.textContent || '').trim() },
    { el: L2, text: (L2.dataset.text || L2.textContent || '').trim() },
    { el: L3, text: (L3.dataset.text || L3.textContent || '').trim() },
  ];

  if (reduce) {
    // No animation: ensure full text visible and caret hidden
    lines.forEach(({ el, text }) => el.textContent = text);
    if (caret) caret.style.borderColor = 'transparent';
    return;
  }

  // Clear lines before typing
  lines.forEach(({ el }) => el.textContent = '');

  const START_PAUSE = 700; // ms before first line
  const BASE = 90;         // base speed per char (slower = smoother)
  const PUNCT_PAUSE = { ',': 260, '.': 380, '!': 360, '?': 360, '-': 120 };

  function appendChar(el, ch){
    if (ch === ' ') {
      el.appendChild(document.createTextNode(' '));
    } else {
      const span = document.createElement('span');
      span.className = 'tw-ch';
      span.textContent = ch;
      el.appendChild(span);
    }
  }

  function moveCaretAfter(el){
    if (!caret) return;
    el.after(caret); // caret follows the active line
  }

  function typeLine({ el, text }){
    return new Promise(resolve => {
      let i = 0;
      moveCaretAfter(el);

      const tick = () => {
        if (i >= text.length) return resolve();
        const ch = text[i++];
        appendChar(el, ch);
        const extra = PUNCT_PAUSE[ch] || 0;
        setTimeout(tick, BASE + (ch === ' ' ? BASE * 0.4 : 0) + extra);
      };

      tick();
    });
  }

  (async () => {
    await new Promise(r => setTimeout(r, START_PAUSE));
    await typeLine(lines[0]);
    await new Promise(r => setTimeout(r, 250)); // small pause between lines
    await typeLine(lines[1]);
    await new Promise(r => setTimeout(r, 250));
    await typeLine(lines[2]);
    if (caret) caret.classList.add('soft'); // softer blink when done
  })();
});
