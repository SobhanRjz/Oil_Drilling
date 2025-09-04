document.addEventListener('DOMContentLoaded', () => {
	const el = document.getElementById('heroText');
	if (!el) return;
  
	// Fallback text (works even if JS fails)
	const full = (el.dataset.text || el.textContent || '').trim();
	const caret = document.querySelector('.caret');
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
	if (reduce) {
	  el.textContent = full;
	  if (caret) caret.style.borderColor = 'transparent';
	  return;
	}
  
	// Clear only after we’ve captured the text
	el.textContent = '';
  
	const START_PAUSE = 750; // ms before first char
	const BASE = 95;         // base speed (slower, smoother)
	const PUNCT_PAUSE = { ',': 280, '.': 420, '!': 380, '?': 380, '-': 140 };
  
	let i = 0;
	function step(){
	  if (i >= full.length) {
		if (caret) caret.classList.add('soft');
		return;
	  }
	  const ch = full[i++];
  
	  if (ch === ' ') {
		// Do NOT wrap spaces—keeps natural word wrapping
		el.appendChild(document.createTextNode(' '));
	  } else {
		const span = document.createElement('span');
		span.className = 'tw-ch';
		span.textContent = ch;
		el.appendChild(span);
	  }
  
	  const extra = PUNCT_PAUSE[ch] || 0;
	  setTimeout(step, BASE + extra);
	}
  
	setTimeout(step, START_PAUSE);
  });
  