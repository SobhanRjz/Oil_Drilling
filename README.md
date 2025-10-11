# Drilling DQ Demo v2 (FastAPI + HTML/JS)
- Upload CSV → Profile → Clean (dedup/standardize/impute) → KPIs → Export.
- Includes: favicon, better errors (404 when dataset lost after reload), frontend error handling.
Run:
```
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
Open http://localhost:8000



# build with 
``` python
python -m PyInstaller drilling_dq.spec
```