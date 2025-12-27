// Landing Page Interactions - Minimal & Modern
document.addEventListener('DOMContentLoaded', () => {
  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add keyboard navigation
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target === ctaButton) {
        ctaButton.click();
      }
    });
  }

  console.log('🚀 Landing page loaded successfully!');
});
