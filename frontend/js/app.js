let DATASET_ID = null;

function activateTab(tabName) {
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
}

document.querySelectorAll('.tab').forEach(tabBtn => {
  tabBtn.addEventListener('click', () => activateTab(tabBtn.dataset.tab));
});

document.getElementById('btnUpload').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput').files[0];
  if (!fileInput) {
    alert('Choose a CSV file (or download sample.csv).');
    return;
  }
  const formData = new FormData();
  formData.append('file', fileInput);
  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!response.ok) {
    alert(`Upload failed: ${response.status} ${await response.text()}`);
    return;
  }
  const data = await response.json();
  DATASET_ID = data.dataset_id;
  document.getElementById('uploadMsg').textContent = `Uploaded ${fileInput.name} — ${data.rows} rows.`;
  const info = document.getElementById('datasetInfo');
  info.style.display = 'block';
  info.innerHTML = `<b>Dataset ID:</b> ${DATASET_ID}<br/><b>Columns:</b> ${data.columns.join(', ')}`;
  activateTab('profile');
});

document.getElementById('btnProfile').addEventListener('click', async () => {
  if (!DATASET_ID) {
    alert('Upload a dataset first.');
    return;
  }
  const response = await fetch(`/api/profile?dataset_id=${DATASET_ID}`);
  if (!response.ok) {
    alert(`Profile failed: ${response.status} ${await response.text()}`);
    return;
  }
  const data = await response.json();
  const rows = data.profile;
  const table = [
    '<table><thead><tr><th>Column</th><th>Null %</th><th>Unique %</th><th>Min</th><th>Max</th><th>Outliers</th></tr></thead><tbody>'
  ];
  rows.forEach(row => {
    table.push(
      `<tr>
        <td>${row.column}</td>
        <td>${row.null_pct}</td>
        <td>${row.unique_pct}</td>
        <td>${row.min ?? ''}</td>
        <td>${row.max ?? ''}</td>
        <td>${row.outliers ?? ''}</td>
      </tr>`
    );
  });
  table.push('</tbody></table>');
  document.getElementById('profileTable').innerHTML = table.join('');

  Plotly.newPlot(
    'chartNulls',
    [{ x: rows.map(r => r.column), y: rows.map(r => r.null_pct), type: 'bar' }],
    { margin: { t: 10 }, yaxis: { title: '%' } }
  );
  Plotly.newPlot(
    'chartUniques',
    [{ x: rows.map(r => r.column), y: rows.map(r => r.unique_pct), type: 'bar' }],
    { margin: { t: 10 }, yaxis: { title: '%' } }
  );
});

document.getElementById('btnDedup').addEventListener('click', async () => {
  if (!DATASET_ID) {
    alert('Upload a dataset first.');
    return;
  }
  const cols = document.getElementById('dedupCols').value.trim();
  const formData = new FormData();
  formData.append('dataset_id', DATASET_ID);
  if (cols) formData.append('subset', cols);
  const response = await fetch('/api/dedup', { method: 'POST', body: formData });
  if (!response.ok) {
    alert(`Dedup failed: ${response.status} ${await response.text()}`);
    return;
  }
  document.getElementById('dedupResult').textContent = JSON.stringify(await response.json(), null, 2);
});

document.getElementById('btnStd').addEventListener('click', async () => {
  if (!DATASET_ID) {
    alert('Upload a dataset first.');
    return;
  }
  const formData = new FormData();
  formData.append('dataset_id', DATASET_ID);
  const response = await fetch('/api/standardize', { method: 'POST', body: formData });
  if (!response.ok) {
    alert(`Standardize failed: ${response.status} ${await response.text()}`);
    return;
  }
  document.getElementById('stdResult').textContent = JSON.stringify(await response.json(), null, 2);
});

document.getElementById('btnImpute').addEventListener('click', async () => {
  if (!DATASET_ID) {
    alert('Upload a dataset first.');
    return;
  }
  const formData = new FormData();
  formData.append('dataset_id', DATASET_ID);
  const response = await fetch('/api/impute', { method: 'POST', body: formData });
  if (!response.ok) {
    alert(`Impute failed: ${response.status} ${await response.text()}`);
    return;
  }
  document.getElementById('imputeResult').textContent = JSON.stringify(await response.json(), null, 2);
});

document.getElementById('btnKPIs').addEventListener('click', async () => {
  if (!DATASET_ID) {
    alert('Upload a dataset first.');
    return;
  }
  const response = await fetch(`/api/kpis?dataset_id=${DATASET_ID}`);
  if (!response.ok) {
    alert(`KPIs failed: ${response.status} ${await response.text()}`);
    return;
  }
  document.getElementById('kpiBox').textContent = JSON.stringify(await response.json(), null, 2);
});

(function renderPilot() {
  const wells = ['W-101', 'W-102', 'W-103'];
  document.getElementById('pilotWells').innerHTML = wells
    .map(well => `<label><input type="checkbox" checked> ${well}</label>`)
    .join('<br/>');
})();

document.getElementById('btnExport').addEventListener('click', () => {
  if (!DATASET_ID) {
    alert('Upload a dataset first.');
    return;
  }
  window.location.href = `/api/export?dataset_id=${DATASET_ID}`;
});
