// Modern fade-in animation for the upload page
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  const progressPanel = document.getElementById('progressPanel');
  
  // Hide progress panel on page load
  if (progressPanel) {
    progressPanel.setAttribute('hidden', '');
    progressPanel.style.display = 'none';
  }

  if (!hero) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    hero.style.opacity = '1';
    return;
  }

  // Initial state
  hero.style.opacity = '0';
  hero.style.transform = 'translateY(20px)';

  // Trigger animation
  requestAnimationFrame(() => {
    hero.style.transition = 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    hero.style.opacity = '1';
    hero.style.transform = 'translateY(0)';
  });
});