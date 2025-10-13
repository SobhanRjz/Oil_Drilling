/**
 * Modern Stepper Component - Professional UI/UX Implementation
 * Handles stepper interactions, accessibility, and state management
 */

class ModernStepper {
  constructor(stepperElement) {
    this.stepper = stepperElement;
    this.stepItems = stepperElement.querySelectorAll('.step-item');
    this.currentStep = this.getCurrentStep();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
    this.updateProgress();
    this.animateEntrance();
  }

  setupEventListeners() {
    // Hover effects
    this.stepItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => this.handleHover(item, index, true));
      item.addEventListener('mouseleave', () => this.handleHover(item, index, false));
      item.addEventListener('click', () => this.handleClick(item, index));
      item.addEventListener('focus', () => this.handleFocus(item, index));
      item.addEventListener('blur', () => this.handleBlur(item, index));
    });

    // Progress bar animation
    this.observeStepChanges();
  }

  setupKeyboardNavigation() {
    this.stepper.addEventListener('keydown', (e) => {
      const currentIndex = Array.from(this.stepItems).findIndex(item =>
        item.classList.contains('active') || item.classList.contains('completed')
      );

      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateToStep(Math.max(0, currentIndex - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateToStep(Math.min(this.stepItems.length - 1, currentIndex + 1));
          break;
        case 'Home':
          e.preventDefault();
          this.navigateToStep(0);
          break;
        case 'End':
          e.preventDefault();
          this.navigateToStep(this.stepItems.length - 1);
          break;
      }
    });
  }

  setupAccessibility() {
    // Announce current step to screen readers
    this.announceCurrentStep();

    // Update ARIA attributes
    this.updateAriaAttributes();
  }

  handleHover(item, index, isHovering) {
    if (item.classList.contains('active') || item.classList.contains('completed')) {
      return; // Don't override active/completed states
    }

    const bubble = item.querySelector('.step-bubble');
    const label = item.querySelector('.step-label');

    if (isHovering) {
      bubble.style.transform = 'translateY(-3px) scale(1.08)';
      label.style.transform = 'translateY(-1px)';
      label.style.color = 'var(--accent)';
    } else {
      bubble.style.transform = '';
      label.style.transform = '';
      label.style.color = '';
    }
  }

  handleClick(item, index) {
    // Only allow navigation to completed or current steps
    if (!item.classList.contains('active') && !item.classList.contains('completed')) {
      this.showTooltip(item, 'Complete previous steps first');
      return;
    }

    this.navigateToStep(index);
  }

  handleFocus(item, index) {
    item.style.outline = '2px solid var(--accent)';
    item.style.outlineOffset = '4px';
  }

  handleBlur(item, index) {
    item.style.outline = '';
    item.style.outlineOffset = '';
  }

  navigateToStep(index) {
    const targetItem = this.stepItems[index];
    if (!targetItem) return;

    // Remove current active state
    this.stepItems.forEach(item => {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    });

    // Set new active state
    targetItem.classList.add('active');
    targetItem.setAttribute('aria-current', 'step');

    // Update progress
    this.updateProgress();

    // Announce to screen readers
    this.announceStepChange(index);

    // Trigger navigation if needed
    this.handleStepNavigation(index);
  }

  handleStepNavigation(stepIndex) {
    const stepUrls = ['/', '/general', '/cleansing', '/anomalies', '/export'];
    const currentUrl = window.location.pathname;

    // Only navigate if we're not already on the target page
    if (stepUrls[stepIndex + 1] && currentUrl !== stepUrls[stepIndex + 1]) {
      // Add loading state
      this.showLoadingState(stepIndex);

      // Navigate after a short delay for visual feedback
      setTimeout(() => {
        window.location.href = stepUrls[stepIndex + 1];
      }, 300);
    }
  }

  updateProgress() {
    const activeIndex = Array.from(this.stepItems).findIndex(item =>
      item.classList.contains('active')
    );
    const completedCount = Array.from(this.stepItems).filter(item =>
      item.classList.contains('completed')
    ).length;

    const progress = Math.max(25, (completedCount / (this.stepItems.length - 1)) * 100);
    this.stepper.setAttribute('data-progress', progress);

    // Update progress bar width
    const progressBar = this.stepper.querySelector('::after');
    if (progressBar) {
      progressBar.style.width = `calc(${progress}% - ${32 + (activeIndex * 16)}px)`;
    }
  }

  showLoadingState(stepIndex) {
    const targetItem = this.stepItems[stepIndex];
    const bubble = targetItem.querySelector('.step-bubble');

    // Add loading spinner
    bubble.innerHTML = `
      <div class="step-spinner" style="
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
    `;

    // Add keyframes for spinner
    if (!document.querySelector('#stepper-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'stepper-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  showTooltip(item, message) {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.stepper-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create new tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'stepper-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: absolute;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text);
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 1001;
      pointer-events: none;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      white-space: nowrap;
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = item.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - 40}px`;

    // Show tooltip
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    });

    // Hide tooltip after 2 seconds
    setTimeout(() => {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(10px)';
      setTimeout(() => tooltip.remove(), 300);
    }, 2000);
  }

  getCurrentStep() {
    return Array.from(this.stepItems).findIndex(item =>
      item.classList.contains('active')
    );
  }

  announceCurrentStep() {
    const currentStep = this.stepItems[this.currentStep];
    if (currentStep) {
      const label = currentStep.querySelector('.step-label').textContent;
      this.announceToScreenReader(`Current step: ${label}`);
    }
  }

  announceStepChange(stepIndex) {
    const stepItem = this.stepItems[stepIndex];
    if (stepItem) {
      const label = stepItem.querySelector('.step-label').textContent;
      this.announceToScreenReader(`Navigated to step: ${label}`);
    }
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  updateAriaAttributes() {
    this.stepItems.forEach((item, index) => {
      const bubble = item.querySelector('.step-bubble');
      const isActive = item.classList.contains('active');
      const isCompleted = item.classList.contains('completed');

      if (isActive) {
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
      }

      let state = 'not started';
      if (isCompleted) state = 'completed';
      else if (isActive) state = 'current';

      bubble.setAttribute('aria-label', `Step ${index + 1}: ${item.querySelector('.step-label').textContent} - ${state}`);
    });
  }

  observeStepChanges() {
    // Watch for class changes on step items
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.updateProgress();
          this.updateAriaAttributes();
        }
      });
    });

    this.stepItems.forEach(item => {
      observer.observe(item, {
        attributes: true,
        attributeFilter: ['class']
      });
    });
  }

  animateEntrance() {
    this.stepItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';

      setTimeout(() => {
        item.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // Public API methods
  setActiveStep(stepIndex) {
    this.navigateToStep(stepIndex);
  }

  getActiveStep() {
    return this.getCurrentStep();
  }

  updateStepState(stepIndex, state) {
    const item = this.stepItems[stepIndex];
    if (!item) return;

    // Remove existing states
    item.classList.remove('active', 'completed');

    // Add new state
    if (state === 'active') {
      item.classList.add('active');
    } else if (state === 'completed') {
      item.classList.add('completed');
    }

    this.updateProgress();
    this.updateAriaAttributes();
  }
}

// Auto-initialize steppers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const steppers = document.querySelectorAll('.modern-stepper');
  steppers.forEach(stepper => {
    new ModernStepper(stepper);
  });
});

// Export for manual initialization if needed
window.ModernStepper = ModernStepper;
