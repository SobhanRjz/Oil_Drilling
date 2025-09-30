(function(){
  // Initialize with loading state
  initializePage();
  
  // Get dataset ID from URL parameters
  const params = new URLSearchParams(location.search);
  const dataset_id = params.get('dataset_id');
  
  if (!dataset_id) { 
    console.warn('No dataset_id provided, using latest dataset');
  }

  // Fetch and display data with animations
  fetchOverviewData(dataset_id);

  // Event listeners
  document.getElementById('nextBtn').addEventListener('click', handleNextStep);
  document.getElementById('showMoreBtn').addEventListener('click', handleShowMore);

  // Initialize scroll observer
  initializeScrollObserver();

  function initializePage() {
    // Initialize with loading state
    animateLoading();
  }

  function initializeScrollObserver() {
    const sections = [
      '.main-title',
      '.kpi-section',
      '.quick-action'
    ];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    sections.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        observer.observe(section);
      }
    });
  }

  function handleShowMore() {
    const chartsSection = document.getElementById('chartsSection');
    const distributionSection = document.getElementById('distributionSection');
    const missingSection = document.getElementById('missingSection');
    const insightsSection = document.getElementById('insightsSection');
    const quickActionSection = document.querySelector('main > section.quick-action.revealed');
    const showMoreBtn = document.getElementById('showMoreBtn');
    
    console.log('Show More button clicked');
    console.log('Sections found:', {
      chartsSection: !!chartsSection,
      distributionSection: !!distributionSection,
      missingSection: !!missingSection,
      insightsSection: !!insightsSection
    });
    
    showMoreBtn.style.display = 'none';
    
    // Show charts section
    chartsSection.classList.remove('hidden');
    setTimeout(() => {
      chartsSection.classList.add('revealed');
    }, 100);
    
    // Show distribution section after a delay
    setTimeout(() => {
      distributionSection.classList.remove('hidden');
      setTimeout(() => {
        distributionSection.classList.add('revealed');
      }, 100);
    }, 800);
    
    // Show missing data section after a delay
    setTimeout(() => {
      missingSection.classList.remove('hidden');
      setTimeout(() => {
        missingSection.classList.add('revealed');
      }, 100);
    }, 1600);
    
    // Show insights section after a delay
    setTimeout(() => {
      insightsSection.classList.remove('hidden');
      setTimeout(() => {
        insightsSection.classList.add('revealed');
      }, 100);
    }, 2400);
    
    // Render charts when they become visible - with longer delay to ensure DOM is ready
    setTimeout(() => {
      console.log('Rendering charts...');
      console.log('Chart data available:', window.chartData);
      
      renderDonutCharts(window.chartData?.dq || 0, window.chartData?.comp || 0, window.chartData?.uniq || 0);
      renderColumnTypesChart();
      renderDataTypesChart();
      renderMissingDataChart(window.chartData?.missingData || {});
      renderUniquenessDataChart(window.chartData?.uniquenessData || {});
      updateMissingStats(window.chartData?.missingData || {});
    }, 2000); // Increased delay to ensure sections are visible
    
    // Smooth scroll to charts section after a short delay
    setTimeout(() => {
      chartsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }, 500);

    quickActionSection.style.marginTop = '80px';
  }

  function animateLoading() {
    // Add loading animation to KPI values
    const kpiValues = document.querySelectorAll('.kpi-value');
    kpiValues.forEach(value => {
      value.textContent = '...';
      value.style.opacity = '0.6';
    });

    // Add loading animation to chart centers (except dqCenter which shows exact value)
    const centerValues = document.querySelectorAll('.center-value:not(#dqCenter)');
    centerValues.forEach(value => {
      value.textContent = '...';
      value.style.opacity = '0.6';
    });
  }

  async function fetchOverviewData(dataset_id) {
    try {
      console.log('Fetching overview data for dataset_id:', dataset_id);
      const response = await fetch(`/api/overview?dataset_id=${encodeURIComponent(dataset_id || '')}`);
      const data = await response.json();
      console.log('Overview API response:', data);
      
      // Check if we have any real data
      if (data.rows === 0 && !dataset_id) {
        // No data available, show a message
        showNoDataMessage();
        return;
      }
      
      // Store chart data globally for later use
      window.chartData = {
        dq: data.dq_score ?? 0,
        comp: data.completeness ?? 0,
        uniq: data.uniqueness ?? 0,
        missingData: data.missingness_by_column || {},
        uniquenessData: data.uniqueness_by_column || {},
        columnTypes: data.column_types || {},
        dataTypesDistribution: data.data_types_distribution || {},
        missingStats: data.missing_stats || {}
      };
      
      // Animate data updates
      await animateDataUpdate(data);
      
    } catch (error) {
      console.error('Error fetching overview data:', error);
      showErrorState();
    }
  }

  function showNoDataMessage() {
    // Show a message that no data is available
    const mainTitle = document.querySelector('.main-title p');
    if (mainTitle) {
      mainTitle.textContent = 'No data available. Please upload a CSV file first.';
      mainTitle.style.color = '#f59e0b';
    }
    
    // Disable the "Show More Overview" button
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn) {
      showMoreBtn.disabled = true;
      showMoreBtn.style.opacity = '0.5';
      showMoreBtn.textContent = 'No Data Available';
    }
  }

  async function animateDataUpdate(data) {
    const rows = data.rows ?? 0;
    const dq = data.dq_score ?? 0;
    const comp = data.completeness ?? 0;
    const uniq = data.uniqueness ?? 0;

    // Animate KPI values with counting effect
    await Promise.all([
      animateCounter('kRows', 0, rows, 1000),
      animateCounter('kDQ', 0, dq, 1000),
      animateCounter('kComp', 0, comp, 1000),
      animateCounter('kUniq', 0, uniq, 1000)
    ]);

    // Add success animations
    addSuccessAnimations();
  }

  function animateCounter(elementId, start, end, duration) {
    return new Promise((resolve) => {
      const element = document.getElementById(elementId);
      const startTime = performance.now();
      const isPercentage = elementId.includes('DQ') || elementId.includes('Comp') || elementId.includes('Uniq');
      const isExactValue = elementId === 'kDQ' || elementId === 'kComp' || elementId === 'kUniq' || elementId === 'uniqCenter'; // These elements show exact values without rounding
      
      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = start + (end - start) * easeOutQuart;
        
        if (isPercentage) {
          if (isExactValue) {
            // For exact value elements, show exact value without rounding
            element.textContent = end + '%';
          } else if (elementId === 'compCenter') {
            // For compCenter, show exact intermediate values without rounding
            element.textContent = currentValue + '%';
          } else {
            element.textContent = currentValue.toFixed(1) + '%';
          }
        } else {
          element.textContent = currentValue.toFixed(1).toLocaleString();
        }
        
        element.style.opacity = '1';
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          resolve();
        }
      }
      
      requestAnimationFrame(updateCounter);
    });
  }

  function updateChartCenters(dq, comp, uniq) {
    const dqCenter = document.getElementById('dqCenter');
    const compCenter = document.getElementById('compCenter');
    const uniqCenter = document.getElementById('uniqCenter');

    // dqCenter is already set to exact value in HTML, animate compCenter and uniqCenter
    animateCounter('compCenter', 0, comp, 800);
    animateCounter('uniqCenter', 0, uniq, 800);
  }

  function renderDonutCharts(dq, comp, uniq) {
    // DQ Score Chart
    const dqCtx = document.getElementById('dqDonut');
    new Chart(dqCtx, {
      type: 'doughnut',
      data: {
        labels: ['Quality Score', 'Remaining'],
        datasets: [{
          data: [dq, 100 - dq],
          backgroundColor: [
            'rgba(16, 185, 129, 0.9)',
            'rgba(55, 65, 81, 0.1)'
          ],
          borderWidth: 0,
          cutout: '75%',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart',
          animateRotate: true,
          animateScale: true
        },
        elements: {
          arc: {
            borderWidth: 0
          }
        }
      }
    });

    // Completeness Chart
    const compCtx = document.getElementById('compDonut');
    new Chart(compCtx, {
      type: 'doughnut',
      data: {
        labels: ['Complete', 'Missing'],
        datasets: [{
          data: [comp, 100 - comp],
          backgroundColor: [
            'rgba(245, 158, 11, 0.9)',
            'rgba(55, 65, 81, 0.1)'
          ],
          borderWidth: 0,
          cutout: '75%',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart',
          animateRotate: true,
          animateScale: true
        },
        elements: {
          arc: {
            borderWidth: 0
          }
        }
      }
    });

    // Uniqueness Chart
    const uniqCtx = document.getElementById('uniqDonut');
    new Chart(uniqCtx, {
      type: 'doughnut',
      data: {
        labels: ['Unique', 'Duplicates'],
        datasets: [{
          data: [uniq, 100 - uniq],
          backgroundColor: [
            '#ef4444',
            'rgba(55, 65, 81, 0.1)'
          ],
          borderWidth: 0,
          cutout: '75%',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart',
          animateRotate: true,
          animateScale: true
        },
        elements: {
          arc: {
            borderWidth: 0
          }
        }
      }
    });

    // Update chart centers
    updateChartCenters(dq, comp, uniq);
  }

  function renderMissingDataChart(missingData) {
    const labels = Object.keys(missingData);
    const values = Object.values(missingData).map(v => Math.round(v * 1000) / 10);
    
    // Sort by missing percentage (descending)
    const sortedData = labels.map((label, index) => ({
      label,
      value: values[index]
    })).sort((a, b) => b.value - a.value);

    const sortedLabels = sortedData.map(item => item.label);
    const sortedValues = sortedData.map(item => item.value);

    new Chart(document.getElementById('missBar'), {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          label: 'Missing %',
          data: sortedValues,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              color: '#94a3b8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#94a3b8',
              maxRotation: 45
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function renderUniquenessDataChart(uniquenessData) {
    const labels = Object.keys(uniquenessData);
    const values = Object.values(uniquenessData).map(v => Math.round(v * 10) / 10);

    // Sort by uniqueness percentage (descending)
    const sortedData = labels.map((label, index) => ({
      label,
      value: values[index]
    })).sort((a, b) => b.value - a.value);

    const sortedLabels = sortedData.map(item => item.label);
    const sortedValues = sortedData.map(item => item.value);

    new Chart(document.getElementById('uniqBar'), {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          label: 'Uniqueness %',
          data: sortedValues,
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              color: '#94a3b8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#94a3b8',
              maxRotation: 45
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function addSuccessAnimations() {
    // Add success pulse to KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = 'successPulse 0.6s ease-out';
        setTimeout(() => {
          card.style.animation = '';
        }, 600);
      }, index * 200);
    });
  }

  function showErrorState() {
    // Show error state for KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      card.style.opacity = '0.5';
      card.style.filter = 'grayscale(1)';
    });

    // Show error message
    const mainTitle = document.querySelector('.main-title p');
    if (mainTitle) {
      mainTitle.textContent = 'Unable to load data. Please try refreshing the page.';
      mainTitle.style.color = '#ef4444';
    }
  }

  function handleNextStep(e) {
    e.preventDefault();
    
    // Add loading state to button
    const btn = e.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Loading...</span><div class="btn-icon">⏳</div>';
    btn.disabled = true;
    
    const urlParams = new URLSearchParams(window.location.search);
    const datasetIdsParam = urlParams.get('dataset_id');
    let datasetIds = [];
    if (datasetIdsParam) {
      datasetIds = datasetIdsParam.split(',');
    }
    // Simulate loading delay for better UX
    setTimeout(() => {
      // Navigate to cleansing step
      if (dataset_id) {
        const latestDatasetId = datasetIds[datasetIds.length - 1]; // Use the last uploaded dataset
        window.location.href = `/cleansing?dataset_id=${encodeURIComponent(latestDatasetId)}`;
      }
    }, 500);
  }

  function renderColumnTypesChart() {
    const ctx = document.getElementById('columnTypesChart');
    console.log('ColumnTypesChart canvas element:', ctx);
    
    if (!ctx) {
      console.error('ColumnTypesChart canvas not found');
      return;
    }
    
    const columnTypes = window.chartData?.columnTypes || {};
    console.log('Column types data:', columnTypes);
    
    // Count column types
    const typeCounts = {};
    Object.values(columnTypes).forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    console.log('Type counts:', typeCounts);
    
    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    
    // If no data, show a placeholder
    if (labels.length === 0) {
      labels.push('No Data');
      data.push(1);
    }
    
    console.log('Chart labels:', labels);
    console.log('Chart data:', data);
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(0, 212, 170, 0.8)',
            'rgba(255, 149, 0, 0.8)',
            'rgba(255, 59, 48, 0.8)',
            'rgba(255, 255, 255, 0.8)',
            'rgba(88, 86, 214, 0.8)'
          ],
          borderWidth: 0,
          cutout: '60%',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#666666',
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function renderDataTypesChart() {
    const ctx = document.getElementById('dataTypesChart');
    console.log('DataTypesChart canvas element:', ctx);
    
    if (!ctx) {
      console.error('DataTypesChart canvas not found');
      return;
    }
    
    const dataTypesDistribution = window.chartData?.dataTypesDistribution || {};
    console.log('Data types distribution:', dataTypesDistribution);
    
    const labels = Object.keys(dataTypesDistribution);
    const data = Object.values(dataTypesDistribution);
    
    console.log('DataTypesChart labels:', labels);
    console.log('DataTypesChart data:', data);
    
    // If no data, show a placeholder
    if (labels.length === 0) {
      labels.push('No Data');
      data.push(0);
    }
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
          data: data,
          backgroundColor: [
            'rgba(0, 212, 170, 0.8)',
            'rgba(255, 149, 0, 0.8)',
            'rgba(255, 59, 48, 0.8)',
            'rgba(255, 255, 255, 0.8)',
            'rgba(88, 86, 214, 0.8)'
          ],
          borderColor: 'rgba(255, 255, 255, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#666666'
            },
            grid: {
              color: 'rgba(102, 102, 102, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#666666'
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function updateMissingStats(missingData) {
    const missingStats = window.chartData?.missingStats || {};
    
    // Update the stats with real data
    document.getElementById('totalMissing').textContent = missingStats.total_missing || 0;
    document.getElementById('columnsWithMissing').textContent = missingStats.columns_with_missing || 0;
    document.getElementById('missingPercentage').textContent = (missingStats.missing_percentage || 0) + '%';
    document.getElementById('totalDuplicates').textContent = missingStats.columns_with_missing || 0;
  }

  // Add CSS animations dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes successPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    
    @keyframes buttonGlow {
      0% { box-shadow: 0 4px 16px rgba(243, 184, 58, 0.3); }
      50% { box-shadow: 0 8px 32px rgba(243, 184, 58, 0.6); }
      100% { box-shadow: 0 4px 16px rgba(243, 184, 58, 0.3); }
    }
  `;
  document.head.appendChild(style);

  // Test function to verify chart rendering
  function testChartRendering() {
    console.log('Testing chart rendering...');
    
    // Test with sample data
    const testData = {
      columnTypes: {
        'col1': 'Numeric',
        'col2': 'Text',
        'col3': 'Date',
        'col4': 'Numeric'
      },
      dataTypesDistribution: {
        'Float': 2,
        'String': 1,
        'Date': 1
      }
    };
    
    window.chartData = testData;
    
    // Test rendering
    setTimeout(() => {
      renderColumnTypesChart();
      renderDataTypesChart();
    }, 1000);
  }

  // Uncomment the line below to test chart rendering
  // testChartRendering();

  // Back button functionality
  function goBack() {
    // Navigate back to upload page
    window.location.href = '/';
  }

  // Make goBack function globally accessible
  window.goBack = goBack;

})();
