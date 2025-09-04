
'use strict';
// DOM Elements - declare as global variables
let uploadZone, fileInput, progressPanel, uploadQueue, closeProgress, cancelAll, proceedBtn, highlight, uploadBtn;
let files = [];
let controllers = new Map();
let isDragOver = false;
let datasetIds = [];
let isUploading = false;

// Initialize when DOM is ready
function initializeWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure all elements are rendered
    setTimeout(init, 100);
  }
}

initializeWhenReady();
// Initialize
init();

function init() {
  console.log('🔧 Initializing upload page...');
  
  // Get DOM elements
  uploadZone = document.getElementById('dropzone');
  fileInput = document.getElementById('fileInput');
  progressPanel = document.getElementById('progressPanel');
  uploadQueue = document.getElementById('uploadQueue');
  closeProgress = document.getElementById('closeProgress');
  cancelAll = document.getElementById('cancelAll');
  proceedBtn = document.getElementById('proceedBtn');
  uploadBtn = document.getElementById('uploadBtn');
  highlight = document.querySelector('.highlight');

  // State management
  let isUploading = false;

  // Debug element finding
  console.log('📋 Elements found:', {
    uploadZone: !!uploadZone,
    fileInput: !!fileInput,
    progressPanel: !!progressPanel,
    uploadQueue: !!uploadQueue,
    uploadBtn: !!uploadBtn,
    highlight: !!highlight
  });

  // Check if critical elements exist
  if (!uploadZone) {
    console.error('❌ Upload zone not found!');
    return;
  }

  if (!fileInput) {
    console.error('❌ File input not found!');
    return;
  }

  console.log('✅ Critical elements found, setting up event listeners...');

  // Setup event listeners
  setupEventListeners();
  setupKeyboardNavigation();
  setupAnimations();

  console.log('🎉 Upload page initialization complete!');
}

function setupEventListeners() {
  // File input change
  fileInput.addEventListener('change', handleFileInput);
  console.log('📎 File input change listener added');

  // Upload zone events - make sure these work
  uploadZone.addEventListener('click', handleUploadZoneClick);
  uploadZone.addEventListener('dragenter', handleDragEnter);
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('dragleave', handleDragLeave);
  uploadZone.addEventListener('drop', handleDrop);
  console.log('🖱️ Upload zone event listeners added');

  // Progress panel events
  if (closeProgress) {
    closeProgress.addEventListener('click', hideProgressPanel);
    console.log('❌ Close progress listener added');
  }

  if (cancelAll) {
    cancelAll.addEventListener('click', handleCancelAll);
    console.log('🚫 Cancel all listener added');
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', handleStartUpload);
    console.log('⬆️ Upload button listener added');
  }

  if (proceedBtn) {
    proceedBtn.addEventListener('click', handleProceed);
    console.log('➡️ Proceed button listener added');
  }

  // Highlight text click
  if (highlight) {
    highlight.addEventListener('click', handleHighlightClick);
    console.log('✨ Highlight click listener added');
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleKeydown);
}


function setupKeyboardNavigation() {
    uploadZone.setAttribute('tabindex', '0');
    uploadZone.setAttribute('role', 'button');
    uploadZone.setAttribute('aria-label', 'Upload CSV files by dragging or pressing Enter to browse');
}

function setupAnimations() {
    // Add initial animations
    const heroElements = document.querySelectorAll('.logo, .upload-header, .upload-zone, .sample-section');
    heroElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;

        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100);
    });
}

function handleFileInput(e) {
    const fileList = e.target.files;
    if (fileList.length > 0) {
        addFiles(fileList);
    }
}

function handleUploadZoneClick(e) {
    // Don't trigger if clicking on the highlight text
    if (e.target.closest('.highlight')) return;
    fileInput.click();
}

function handleDragEnter(e) {
    e.preventDefault();
    isDragOver = true;
    uploadZone.classList.add('drag');
    addDragAnimation();
}

function handleDragOver(e) {
    e.preventDefault();
    if (!isDragOver) {
        isDragOver = true;
        uploadZone.classList.add('drag');
        addDragAnimation();
    }
}
function handleUploadZoneClick(e) {
  // Don't trigger if clicking on the highlight text
  if (e.target.closest('.highlight')) return;
  fileInput.click();
}

function handleHighlightClick(e) {
  console.log('✨ Highlight clicked');
  e.stopPropagation(); // Prevent bubbling to upload zone
  if (fileInput) {
      fileInput.click();
  }
}

function handleDragLeave(e) {
    e.preventDefault();
    // Only remove drag state if leaving the upload zone entirely
    const rect = uploadZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        isDragOver = false;
        uploadZone.classList.remove('drag');
        removeDragAnimation();
    }
}

function handleDrop(e) {
    e.preventDefault();
    isDragOver = false;
    uploadZone.classList.remove('drag');
    removeDragAnimation();

    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
        addFiles(fileList);
    }
}

function handleKeydown(e) {
    if (e.target === uploadZone && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        fileInput.click();
    }

    if (e.key === 'Escape' && progressPanel && !progressPanel.hasAttribute('hidden')) {
        hideProgressPanel();
    }
}

function addDragAnimation() {
    const uploadIcon = document.querySelector('.upload-icon');
    if (uploadIcon) {
        uploadIcon.style.animation = 'bounce 0.6s ease-in-out';
    }

    // Add ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'drag-ripple';
    ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.2);
        transform: translate(-50%, -50%);
        animation: ripple 0.6s ease-out forwards;
        pointer-events: none;
        z-index: 1;
    `;
    uploadZone.appendChild(ripple);

    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

function removeDragAnimation() {
    const uploadIcon = document.querySelector('.upload-icon');
    if (uploadIcon) {
        uploadIcon.style.animation = '';
    }
}

function addFiles(fileList) {
    const arr = Array.from(fileList || []);
    const csvFiles = arr.filter(f => /\.csv$/i.test(f.name));
    const rejected = arr.length - csvFiles.length;

    if (rejected > 0) {
        showToast(`${rejected} file(s) skipped (CSV only).`, 'warning');
    }

    if (csvFiles.length > 0) {
        // Success animation
        uploadZone.classList.add('pop');
        setTimeout(() => uploadZone.classList.remove('pop'), 600);

        // Add files to queue
        csvFiles.forEach(file => {
            files.push(file);
            const itemElement = createUploadItem(file);
            uploadQueue.appendChild(itemElement);
        });

        // Show progress panel
        showProgressPanel();
        updateButtons();

        // Auto-start upload after a brief delay

    }
}

function createUploadItem(file) {
    const item = document.createElement('div');
    item.className = 'upload-item';
    item.dataset.name = file.name;

    item.innerHTML = `
        <div class="upload-item-header">
            <div class="upload-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M14 4L20 10H14V4Z" fill="currentColor"/>
                </svg>
            </div>
            <div class="upload-item-info">
                <div class="upload-item-name">${file.name}</div>
                <div class="upload-item-size">${formatBytes(file.size)}</div>
            </div>
            <div class="upload-item-status">
                <span class="status-badge pending">Pending</span>
                <button class="remove-btn" title="Remove file" aria-label="Remove ${file.name}">×</button>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
    `;

    // Add remove button handler
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => removeItem(file, item));

    return item;
}

function removeItem(file, itemElement) {
    const index = files.indexOf(file);
    if (index >= 0) {
        files.splice(index, 1);
    }

    // Abort any ongoing upload
    const xhr = controllers.get(file);
    if (xhr) {
        xhr.abort();
        controllers.delete(file);
    }

    // Animate removal
    itemElement.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
        if (itemElement.parentNode) {
            itemElement.parentNode.removeChild(itemElement);
        }
        updateButtons();
    }, 300);
}

function showProgressPanel() {
    if (progressPanel) {
        progressPanel.removeAttribute('hidden');
        progressPanel.style.display = '';
        document.body.style.overflow = 'hidden';

        // Animate in
        progressPanel.style.animation = 'panelSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }
}

function hideProgressPanel() {
    if (progressPanel) {
        progressPanel.style.animation = 'panelSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';

        setTimeout(() => {
            progressPanel.setAttribute('hidden', '');
            document.body.style.overflow = '';
        }, 300);
    }
}

  function updateButtons() {
    const hasFiles = files.length > 0;
    const hasActiveUploads = controllers.size > 0;

    if (uploadBtn) {
        uploadBtn.disabled = !hasFiles || hasActiveUploads || isUploading;
        uploadBtn.innerHTML = isUploading ? 
          '<span>Uploading...</span><div class="btn-icon">⏳</div>' : 
          '<span>Upload Files</span><div class="btn-icon">⬆</div>';
    }

    if (cancelAll) {
        cancelAll.disabled = !hasFiles && !hasActiveUploads;
    }

    if (proceedBtn) {
        proceedBtn.disabled = datasetIds.length === 0;
    }
}

function handleStartUpload() {
    console.log('🚀 Starting manual upload process...');
    if (files.length === 0) return;

    isUploading = true;
    updateButtons();

    // Start the upload process
    handleUpload();
}

async function handleUpload() {
    if (files.length === 0) return;

    let successCount = 0;
    datasetIds = [];

    for (const file of files.slice()) {
        const itemElement = uploadQueue.querySelector(`[data-name="${CSS.escape(file.name)}"]`);
        if (!itemElement) continue;

        try {
            await uploadFile(file, itemElement);
            successCount++;
            markItemSuccess(itemElement);

            // Collect dataset ID
            const datasetId = itemElement.dataset.datasetId;
            if (datasetId) {
                datasetIds.push(datasetId);
            }
        } catch (error) {
            markItemError(itemElement, error.message);
        }
    }

    isUploading = false;
    updateButtons();

    if (successCount > 0) {
        showToast(`${successCount} file(s) uploaded successfully!`, 'success');

    }
}

function uploadFile(file, itemElement) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        controllers.set(file, xhr);

        xhr.open('POST', '/api/upload');

        xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return;

            const percent = Math.round((e.loaded / e.total) * 100);
            updateItemProgress(itemElement, percent, e.loaded, file.size);
        };

        xhr.onload = () => {
            controllers.delete(file);

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    itemElement.dataset.datasetId = data.dataset_id;
                    resolve(data);
                } catch (e) {
                    reject(new Error('Invalid response format'));
                }
            } else {
                let errorMessage = 'Upload failed';
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (e) {}
                reject(new Error(errorMessage));
            }
        };

        xhr.onerror = () => {
            controllers.delete(file);
            reject(new Error('Network error'));
        };

        xhr.onabort = () => {
            controllers.delete(file);
            reject(new Error('Upload cancelled'));
        };

        const formData = new FormData();
        formData.append('file', file, file.name);
        xhr.send(formData);
    });
}

function updateItemProgress(itemElement, percent, loaded, total) {
    const progressFill = itemElement.querySelector('.progress-fill');
    const statusBadge = itemElement.querySelector('.status-badge');
    const sizeElement = itemElement.querySelector('.upload-item-size');

    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }

    if (statusBadge) {
        statusBadge.textContent = `${percent}%`;
        statusBadge.className = 'status-badge uploading';
    }

    if (sizeElement) {
        sizeElement.textContent = `${formatBytes(loaded)} / ${formatBytes(total)}`;
    }
}

function markItemSuccess(itemElement) {
    const statusBadge = itemElement.querySelector('.status-badge');
    const progressFill = itemElement.querySelector('.progress-fill');

    if (statusBadge) {
        statusBadge.textContent = 'Complete';
        statusBadge.className = 'status-badge success';
    }

    if (progressFill) {
        progressFill.style.width = '100%';
    }

    // Add success icon
    const icon = document.createElement('div');
    icon.className = 'status-icon success';
    icon.innerHTML = '✓';
    icon.style.cssText = `
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #22c55e;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        animation: successPulse 0.6s ease-out;
    `;
    itemElement.appendChild(icon);
}

function markItemError(itemElement, errorMessage) {
    const statusBadge = itemElement.querySelector('.status-badge');

    if (statusBadge) {
        statusBadge.textContent = 'Failed';
        statusBadge.className = 'status-badge error';
        statusBadge.title = errorMessage;
    }

    // Add error icon
    const icon = document.createElement('div');
    icon.className = 'status-icon error';
    icon.innerHTML = '✕';
    icon.style.cssText = `
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ef4444;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        animation: errorShake 0.6s ease-out;
    `;
    itemElement.appendChild(icon);
}

function handleCancelAll() {
    // Abort all uploads
    controllers.forEach(xhr => xhr.abort());
    controllers.clear();

    // Clear files and UI
    files.splice(0, files.length);
    uploadQueue.innerHTML = '';
    datasetIds = [];

    updateButtons();
    showToast('All uploads cancelled', 'info');
}

function handleProceed() {
    if (datasetIds.length === 0) return;

    const latestDatasetId = datasetIds[datasetIds.length - 1];
    window.location.href = `/overview?dataset_id=${encodeURIComponent(latestDatasetId)}`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 500;
        z-index: 1000;
        animation: toastSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    `;

    // Set colors based on type
    switch (type) {
        case 'success':
            toast.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            toast.style.color = 'white';
            break;
        case 'warning':
            toast.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            toast.style.color = 'white';
            break;
        case 'error':
            toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            toast.style.color = 'white';
            break;
        default:
            toast.style.background = 'var(--bg-secondary)';
            toast.style.color = 'var(--text-primary)';
            toast.style.border = '1px solid var(--border)';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
        40%, 43% { transform: translate3d(0, -10px, 0); }
        70% { transform: translate3d(0, -5px, 0); }
        90% { transform: translate3d(0, -2px, 0); }
    }

    @keyframes ripple {
        0% { width: 0; height: 0; opacity: 1; }
        100% { width: 200px; height: 200px; opacity: 0; }
    }

    @keyframes panelSlideIn {
        0% { opacity: 0; transform: translateY(100px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes panelSlideOut {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(100px) scale(0.95); }
    }

    @keyframes slideIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideOut {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }

    @keyframes successPulse {
        0% { transform: translateY(-50%) scale(0); }
        50% { transform: translateY(-50%) scale(1.2); }
        100% { transform: translateY(-50%) scale(1); }
    }

    @keyframes errorShake {
        0%, 100% { transform: translateY(-50%) translateX(0); }
        25% { transform: translateY(-50%) translateX(-5px); }
        75% { transform: translateY(-50%) translateX(5px); }
    }

    @keyframes toastSlideIn {
        0% { opacity: 0; transform: translateX(100%); }
        100% { opacity: 1; transform: translateX(0); }
    }

    @keyframes toastSlideOut {
        0% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(100%); }
    }

    .drag-ripple {
        animation: ripple 0.6s ease-out forwards;
    }

    .upload-item {
        animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .remove-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all var(--transition-fast);
        opacity: 0.7;
    }

    .remove-btn:hover {
        background: var(--bg-tertiary);
        opacity: 1;
    }
`;
document.head.appendChild(style);
