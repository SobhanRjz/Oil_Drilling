(function(){
    const params = new URLSearchParams(location.search);
    const dataset_id = params.get('dataset_id') || '';
  
    const el = (id) => document.getElementById(id);
    const nf = (n) => (n==null||Number.isNaN(n)? '—' : Number(n).toLocaleString());
    const pf = (p) => (p==null||Number.isNaN(p)? '—' : `${Number(p).toFixed(2)}%`);
  
    init();
  
    async function init(){
      if (!dataset_id){ console.warn('No dataset_id provided; attempting latest on server'); }
      await loadSummary();
      await loadRows();
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
        
        // Note: kpiIF element doesn't exist in HTML, removing this line
        
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
        const constants = data.columns?.constants || [];
        el('constCols').innerHTML = constants.length ? constants.map(c => pill(c)).join('') : '<span class="muted">None</span>';
  
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
    function injectError(msg){
      const b = document.createElement('div');
      b.className = 'error-banner';
      b.textContent = msg;
      document.querySelector('main').prepend(b);
    }
  })();