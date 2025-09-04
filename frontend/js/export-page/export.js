(function(){
    const params = new URLSearchParams(location.search);
    const dataset_id = params.get('dataset_id') || '';

    const el = (id) => document.getElementById(id);
    const exportBtn = el('exportBtn');

    init();

    async function init(){
      if (!dataset_id){
        console.warn('No dataset_id provided; attempting latest on server');
      }
      
      // Add click handler for export
      exportBtn.addEventListener('click', handleExport);
    }

    async function handleExport(){
      if (!exportBtn) return;
      
      // Update button state to loading
      exportBtn.disabled = true;
      exportBtn.classList.add('export-loading');
      exportBtn.innerHTML = '<span>Exporting...</span><div class="btn-icon">⏳</div>';
      
      try {
        // Fetch the CSV from the server
        const response = await fetch(`/api/export/csv?dataset_id=${encodeURIComponent(dataset_id)}`);
        
        if (!response.ok) {
          throw new Error(`Export failed: ${response.status}`);
        }
        
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Set filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.download = `drill_dq_export_${timestamp}.csv`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Update button to success state
        exportBtn.classList.remove('export-loading');
        exportBtn.classList.add('export-success');
        exportBtn.innerHTML = '<span>Download Complete!</span><div class="btn-icon">✓</div>';
        
        // Reset button after 3 seconds
        setTimeout(() => {
          exportBtn.classList.remove('export-success');
          exportBtn.innerHTML = '<span>Export to CSV</span><div class="btn-icon">↓</div>';
          exportBtn.disabled = false;
        }, 3000);
        
      } catch (error) {
        console.error('Export error:', error);
        
        // Reset button to error state
        exportBtn.classList.remove('export-loading');
        exportBtn.innerHTML = '<span>Export Failed</span><div class="btn-icon">⚠</div>';
        
        // Show error message
        showError('Failed to export CSV. Please try again.');
        
        // Reset button after 3 seconds
        setTimeout(() => {
          exportBtn.innerHTML = '<span>Export to CSV</span><div class="btn-icon">↓</div>';
          exportBtn.disabled = false;
        }, 3000);
      }
    }

    function showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-banner';
      errorDiv.textContent = message;
      errorDiv.style.cssText = `
        background: rgba(239, 68, 68, .12);
        border: 1px solid rgba(239, 68, 68, .35);
        color: #e9efff;
        border-radius: 12px;
        padding: 12px 16px;
        margin: 16px 0;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        animation: slideDown 0.3s ease-out;
      `;
      
      document.body.appendChild(errorDiv);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    }
    
    // Add slideDown animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
    `;
    document.head.appendChild(style);
})();