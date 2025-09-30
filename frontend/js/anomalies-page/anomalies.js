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
  
        // IQR list
        const pills = (data.outliers?.per_column || []).map(o => pill(`${o.column}: ${nf(o.count)}`, o.count>0 ? 'warn' : ''));
        el('iqrPills').innerHTML = pills.join('');
  
        // IForest - using correct IDs that exist in HTML
        if (!data.iforest?.available){
          el('ifMeta').innerHTML = '';
          el('ifNote').textContent = data.iforest?.note || 'IsolationForest unavailable.';
        } else {
          el('ifNote').textContent = '';
          el('ifMeta').innerHTML = badge(`Flagged: ${nf(data.iforest?.n_rows_flagged)}`) + badge(`${pf(data.iforest?.pct_rows_flagged)}`);
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
        el('flagTable').innerHTML = toTable(data.rows, data.columns);
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
      const tbody = `<tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody>`;
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