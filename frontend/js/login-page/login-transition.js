// Smooth fade-out on successful sign-in, then navigate to `/`
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (!form || form.dataset.bound === '1') return;  // avoid double-binding
    form.dataset.bound = '1';
  
    const page = document.querySelector('.page');          // <main class="page"> … </main>
    const btn  = form.querySelector('.primary');
    const emailI = form.querySelector('input[name="email"]');
    const pwdI   = form.querySelector('input[name="password"]');
    const togglePwd = document.getElementById('togglePwd');

    // Handle floating labels and error states
    [emailI, pwdI].forEach(input => {
      if (input) {
        const field = input.closest('.field');

        // Function to update floating label state
        const updateLabelState = () => {
          const hasContent = input.value.trim() !== '';
          const isFocused = document.activeElement === input;

          if (hasContent || isFocused) {
            field?.classList.add('has-content');
          } else {
            field?.classList.remove('has-content');
          }
        };

        // Force initial state to be without content
        field?.classList.remove('has-content');

        // Clear error states on input
        input.addEventListener('input', () => {
          field?.classList.remove('error');
          updateLabelState();
        });

        // Handle focus/blur for floating labels
        input.addEventListener('focus', updateLabelState);
        input.addEventListener('blur', updateLabelState);

        // Initialize label state with a small delay to ensure DOM is ready
        setTimeout(() => {
          updateLabelState();
        }, 10);
      }
    });

    // Password toggle functionality
    if (togglePwd) {
      togglePwd.addEventListener('click', (e) => {
        e.preventDefault();
        const type = pwdI.type === 'password' ? 'text' : 'password';
        pwdI.type = type;
        togglePwd.setAttribute('aria-label', type === 'text' ? 'Hide password' : 'Show password');

        const svg = togglePwd.querySelector('svg');
        if (svg) {
          const path = svg.querySelector('path');
          if (type === 'text') {
            path.setAttribute('d', 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z M2 4.707A8.001 8.001 0 0115.586 12');
            svg.innerHTML += '<line x1="2" y1="2" x2="22" y2="22"></line>';
          } else {
            path.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
            const line = svg.querySelector('line');
            if (line) line.remove();
          }
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // Clear previous error states
      emailI?.closest('.field')?.classList.remove('error');
      pwdI?.closest('.field')?.classList.remove('error');

      // quick validation (keep or remove if you do server-side only)
      const email = (emailI?.value || '').trim();
      const pwd   = (pwdI?.value || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailI?.closest('.field')?.classList.add('error');
        emailI?.focus();
        return toast('Please enter a valid email.');
      }
      if (pwd.length < 6) {
        pwdI?.closest('.field')?.classList.add('error');
        pwdI?.focus();
        return toast('Password must be at least 6 characters.');
      }
  
      try {
        btn?.classList.add('is-loading');
  
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pwd })
        });
  
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          btn?.classList.remove('is-loading');
          return toast(data.message || 'Login failed');
        }
  
        // success → fade out whole page, then go to `/`
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const go = () => (window.location.href = '/');
  
        if (!reduce && page) {
          page.classList.add('is-leaving');
          page.addEventListener('transitionend', go, { once: true });
          setTimeout(go, 900); // safety fallback (matches CSS duration)
        } else {
          go();
        }
      } catch {
        btn?.classList.remove('is-loading');
        toast('Network error, try again.');
      }
    });
  
    function toast(msg){
      const wrap = document.querySelector('.flash') || (() => {
        const f = document.createElement('div');
        f.className = 'flash';
        document.querySelector('.card')?.prepend(f);
        return f;
      })();
      const box = document.createElement('div');
      box.className = 'flash-item error';
      box.textContent = msg;
      wrap.appendChild(box);
      setTimeout(() => box.remove(), 4000);
    }
  });
  