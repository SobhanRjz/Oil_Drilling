// Smooth fade-out on successful sign-in, then navigate to `/`
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (!form || form.dataset.bound === '1') return;  // avoid double-binding
    form.dataset.bound = '1';
  
    const page = document.querySelector('.page');          // <main class="page"> … </main>
    const btn  = form.querySelector('.primary');
    const emailI = form.querySelector('input[name="email"]');
    const pwdI   = form.querySelector('input[name="password"]');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // quick validation (keep or remove if you do server-side only)
      const email = (emailI?.value || '').trim();
      const pwd   = (pwdI?.value || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Please enter a valid email.');
      if (pwd.length < 6) return toast('Password must be at least 6 characters.');
  
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
  