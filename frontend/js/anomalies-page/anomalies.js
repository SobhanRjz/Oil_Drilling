(function(){
    const params = new URLSearchParams(location.search);
    const dataset_id = params.get('dataset_id') || '';
  
    const el = (id) => document.getElementById(id);
    const nf = (n) => (n==null||Number.isNaN(n)? '—' : Number(n).toLocaleString());
    const pf = (p) => (p==null||Number.isNaN(p)? '—' : `${Number(p).toFixed(2)}%`);

    let currentActiveSection = null;

    // Action elements
    const actionEls = {
      // toggles
      tOutlier: el('toggleOutlierAction'),
      tUnit: el('toggleUnitAction'),
      tSensor: el('toggleSensorAction'),
      // selects
      outlierMethod: el('outlierMethod'),
      unitStandard: el('unitStandard'),
      sensorAction: el('sensorAction'),
      // buttons
      btnApplyAnomalies: el('btnApplyAnomalies'),
    };

    init();
  
    async function init(){
      if (!dataset_id){ console.warn('No dataset_id provided; attempting latest on server'); }
      setupCardClickHandlers();
      setupActionEventListeners();
      await loadSummary();
      await loadRows();
    }

    function setupActionEventListeners() {
      // Action buttons
      actionEls.btnApplyAnomalies.addEventListener('click', handleAnomalyApply);
    }

    function getAnomalyActionsFromUI() {
      return {
        outlier_handling: actionEls.tOutlier.checked ? {
          method: actionEls.outlierMethod.value
        } : null,
        unit_standardization: actionEls.tUnit.checked ? {
          standard: actionEls.unitStandard.value
        } : null,
        sensor_reliability: actionEls.tSensor.checked ? {
          action_type: actionEls.sensorAction.value
        } : null
      };
    }


    async function handleAnomalyApply() {
      const payload = {
        dataset_id,
        actions: getAnomalyActionsFromUI(),
        dry_run: false
      };

      actionEls.btnApplyAnomalies.disabled = true;
      actionEls.btnApplyAnomalies.innerHTML = '<span>Applying...</span><div class="btn-icon">⏳</div>';

      try {
        // For now, simulate the API response
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

        // Redirect to export page on success
        window.location.href = `/export?dataset_id=${encodeURIComponent(dataset_id)}`;

      } catch(err) {
        console.error('Apply error', err);
        alert('Apply failed. Check console.');
      } finally {
        actionEls.btnApplyAnomalies.disabled = false;
        actionEls.btnApplyAnomalies.innerHTML = '<span>Apply & Continue to Export</span><div class="btn-icon">→</div>';
      }
    }


    function setupCardClickHandlers() {
      const buttons = document.querySelectorAll('.view-details-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', function() {
          const target = this.getAttribute('data-target');
          toggleDetailsSection(target, this);
        });
      });
    }

    function toggleDetailsSection(target, button) {
      const detailsSection = document.getElementById(`${target}Details`);
      const card = button.closest('.anomaly-card');
      
      // If clicking the same section, close it
      if (currentActiveSection === target) {
        detailsSection.style.display = 'none';
        detailsSection.classList.remove('show');
        button.classList.remove('active');
        card.classList.remove('active');
        currentActiveSection = null;
      } else {
        // Close all sections
        document.querySelectorAll('.details-section').forEach(section => {
          section.style.display = 'none';
          section.classList.remove('show');
        });
        
        // Remove active state from all buttons and cards
        document.querySelectorAll('.view-details-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.anomaly-card').forEach(c => c.classList.remove('active'));
        
        // Open the selected section
        detailsSection.style.display = 'block';
        setTimeout(() => {
          detailsSection.classList.add('show');
        }, 10);
        button.classList.add('active');
        card.classList.add('active');
        currentActiveSection = target;
        
        // Scroll to the details section smoothly
        setTimeout(() => {
          detailsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  
    async function loadSummary(){
      try{
        const res = await fetch(`/api/anomalies/summary?dataset_id=${encodeURIComponent(dataset_id)}`);
        if(!res.ok){ throw new Error(await res.text()); }
        const data = await res.json();
  
        // KPI cards removed from HTML
        // el('kpiRows').textContent = nf(data.shape?.rows);
        // el('kpiCols').textContent = nf(data.shape?.cols);
        // el('kpiMissing').textContent = `${nf(data.missing?.total_missing)} (${pf(data.missing?.pct_missing)})`;
        // el('kpiDup').textContent = `3.4`;
        el('kpiIqr').textContent = nf(data.outliers?.n_rows_flagged);
        
        // Update card badges
        const totalOutliers = (data.outliers?.n_rows_flagged || 0) + (data.iforest?.n_rows_flagged || 0);
        el('outlierCount').textContent = nf(totalOutliers);
        el('unitCount').textContent = nf(3); // Fake value for unit standardization issues
        el('sensorCount').textContent = nf(7); // Fake value for sensor reliability issues
        
        // Missingness table
        const missEntries = Object.entries(data.missing?.by_column || {}).sort((a,b)=>b[1]-a[1]);
        el('missingTable').innerHTML = toTable(missEntries.map(([c,v])=>({column:c, missing_pct:(v*100).toFixed(2)+'%'})), ['column','missing_pct']);
  
        // Note: dupMeta element doesn't exist in HTML, removing this line
  
        // IQR list - show columns with problems
        const outlierColumns = (data.outliers?.per_column || []).filter(o => o.count > 0);
        const outlierColumns_iforest = (data.iforest?.per_column || []).filter(o => o.count_in_flagged > 0);
        const iqrPills = [];

        if (outlierColumns.length > 0) {
          iqrPills.push(pill(`Columns with outliers: ${outlierColumns.length}`, 'warn'));
          iqrPills.push(...outlierColumns.map(o => pill(o.column, 'info')));
        } else {
          iqrPills.push(pill('No outliers detected', ''));
        }

        el('iqrPills').innerHTML = iqrPills.join('');
  
        // IForest - using pills format
        if (!data.iforest?.available){
          el('kpiIf').textContent = '0';
          el('ifColumns').innerHTML = '';
          el('ifMeta').innerHTML = '';
          el('ifNote').textContent = data.iforest?.note || 'IsolationForest unavailable.';
        } else {
          el('ifNote').textContent = '';

          // Update KPI value
          el('kpiIf').textContent = nf(data.iforest?.n_rows_flagged) || '0';

          // Show column names below KPI
          let columnHTML = '';
          if (data.iforest?.important_features && data.iforest.important_features.length > 0) {
            columnHTML = data.iforest.important_features.map(col => `<span class="column-item">${escapeHTML(col)}</span>`).join('');
          } else if (data.iforest?.flagged_columns && data.iforest.flagged_columns.length > 0) {
            columnHTML = data.iforest.flagged_columns.map(col => `<span class="column-item">${escapeHTML(col)}</span>`).join('');
          }
          el('ifColumns').innerHTML = columnHTML;

          // Create pills for summary stats (only percentage)
          const summaryPills = [
            pill(`Columns with outliers: ${data.iforest?.per_column.length}`, 'warn')
          ];
          summaryPills.push(...outlierColumns_iforest.map(o => pill(o.column, 'info')));
          el('ifMeta').innerHTML = summaryPills.join('');
        }
  
        // Dtypes & constants
        const dtypes = Object.entries(data.columns?.dtypes || {}).map(([k,v])=>({column:k, dtype:v}));
        el('schemaTable').innerHTML = toTable(dtypes, ['column','dtype']);

        // Populate Unit Standardization section with fake data
        el('kpiUnits').textContent = nf(3);
        el('kpiConversions').textContent = nf(3);
        el('unitPills').innerHTML = [
          pill('Temperature units mixed (C/F)', 'warn'),
          pill('Pressure units inconsistent', 'warn'),
          pill('Depth measurements varied', 'warn')
        ].join('');
        el('conversionPills').innerHTML = [
          pill('Convert all temps to Celsius', 'info'),
          pill('Standardize pressure to PSI', 'info'),
          pill('Convert depth from feet to meters', 'info')
        ].join('');
        el('unitAnalysisTable').innerHTML = toTable([
          {column: 'Temperature', unit_variations: 'Celsius, Fahrenheit', recommended: 'Celsius'},
          {column: 'Pressure', unit_variations: 'PSI, Bar, MPa', recommended: 'PSI'},
          {column: 'Depth', unit_variations: 'Feet, Meters', recommended: 'Meters'}
        ], ['column', 'unit_variations', 'recommended']);

        // Populate Sensor Reliability section with fake data
        el('kpiActiveSensors').textContent = nf(15);
        el('kpiFlaggedSensors').textContent = nf(7);
        el('sensorPills').innerHTML = [
          pill('15 sensors active', 'success'),
          pill('98.2% uptime', 'success'),
        ].join('');
        el('sensorIssuePills').innerHTML = [
          pill('Temp sensor #1: Drift detected', 'warn'),
          pill('Pressure #2: Intermittent failure', 'danger'),
          pill('Depth #3: Calibration needed', 'warn'),
          pill('Temp sensor #4: Out of range', 'danger'),
          pill('Pressure #5: Signal loss', 'warn'),
          pill('Depth #6: Noise interference', 'info'),
          pill('Temp sensor #7: Battery low', 'warn')
        ].join('');
        el('sensorReliabilityTable').innerHTML = toTable([
          {sensor: 'Temperature #1', status: 'Drift', reliability: '85%', last_calibrated: '2024-09-15'},
          {sensor: 'Pressure #2', status: 'Intermittent', reliability: '72%', last_calibrated: '2024-08-20'},
          {sensor: 'Depth #3', status: 'Calibration', reliability: '91%', last_calibrated: '2024-10-01'},
          {sensor: 'Temperature #4', status: 'Out of range', reliability: '45%', last_calibrated: '2024-07-30'},
          {sensor: 'Pressure #5', status: 'Signal loss', reliability: '68%', last_calibrated: '2024-09-05'},
          {sensor: 'Depth #6', status: 'Noise', reliability: '89%', last_calibrated: '2024-10-10'},
          {sensor: 'Temperature #7', status: 'Battery low', reliability: '76%', last_calibrated: '2024-08-15'}
        ], ['sensor', 'status', 'reliability', 'last_calibrated']);

      } catch(e){
        console.error('Summary error', e);
        injectError('Failed to load anomalies summary.');
      }
    }
  
    async function loadRows(){
      try{
        const res = await fetch(`/api/anomalies/rows?dataset_id=${encodeURIComponent(dataset_id)}&limit=100`);
        if(!res.ok){ throw new Error(await res.text()); }
        const data = await res.json();

        // Create highlighted rows with outlier values
        const highlightedRows = data.rows.map((row, index) => {
          const highlightedRow = { ...row };

          // The outlier_values object keys are the original DataFrame indices
          // We need to map the row index in the returned data to the outlier info
          if (data.outlier_values) {
            // Get all outlier indices and find the corresponding row
            const outlierIndices = Object.keys(data.outlier_values);
            if (outlierIndices[index]) {
              const outlierInfo = data.outlier_values[outlierIndices[index]];
              if (outlierInfo) {
                // Highlight outlier values
                Object.keys(outlierInfo).forEach(col => {
                  if (col in highlightedRow) {
                    const value = highlightedRow[col];
                    highlightedRow[col] = `<span class="outlier-value">${value}</span>`;
                  }
                });
              }
            }
          }

          return highlightedRow;
        });

        el('flagTable').innerHTML = toTable(highlightedRows, data.columns);
      } catch(e){
        console.error('Rows error', e);
        injectError('Failed to load flagged rows.');
      }
    }
  
    // Helpers (same pattern as Cleansing)
    function toTable(rows, columns){
      if(!rows || !rows.length){ return '<div class="muted">No data</div>'; }
      const cols = columns && columns.length ? columns : Object.keys(rows[0]);
      const thead = `<thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c]}</td>`).join('')}</tr>`).join('')}</tbody>`;
      return `<table>${thead}${tbody}</table>`;
    }
    const pill = (text, cls='') => `<span class="pill ${cls}">${esc(text)}</span>`;
    const badge = (text) => `<span class="badge">${esc(text)}</span>`;
    const esc = (s) => (s==null? '': String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const escapeHTML = esc; // Alias for consistency
    function injectError(msg){
      const b = document.createElement('div');
      b.className = 'error-banner';
      b.textContent = msg;
      document.querySelector('main').prepend(b);
    }
  })();