from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
from typing import Optional

# Removed duplicate import - using the local .auth import below

from backend.profiling import profile_dataframe
from backend.cleaning import deduplicate, standardize, impute_simple, kpis
from backend.services.storage import STORE
from backend.auth import (
    COOKIE_NAME, COOKIE_MAX_AGE, verify_credentials,
    create_cookie_value, current_user_email
)
from backend.cleaning_api import _get_df as get_df_cleaning, _duplicates_count,\
    _missing_by_column, _completeness_pct, ApplyRequest,\
    _put_df, df_records_safe, dict_numbers_safe

from backend.anomalies_api import (
    _get_df as get_df_anomalies, _iqr_per_col, _dup_count, _missing_col, SKLEARN,
    _safe_numeric,          # <-- add this
)
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response, Depends, Body, Request as FastAPIRequest, Query
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest

import sys
import os
import webbrowser
import threading
import time

# Handle paths for both development and bundled executable
if getattr(sys, "frozen", False):
    # Running from bundled executable - use _MEIPASS for bundled files
    BUNDLE_ROOT = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    ROOT = Path(sys.executable).resolve().parent  # where the exe lives
else:
    # Running from source
    BUNDLE_ROOT = ROOT = Path(__file__).resolve().parents[1]

FRONTEND_DIR = BUNDLE_ROOT / "frontend"

app = FastAPI(title="Drilling DQ Demo v2", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# --- Auth helpers ---
def require_auth(request: FastAPIRequest):
    email = current_user_email(request)
    if not email:
        # For browser endpoints, redirect to /login. For APIs, you could raise 401.
        raise HTTPException(status_code=401, detail="Not authenticated")
    return email
# --- Pages ---

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    page = FRONTEND_DIR / "login.html"
    if not page.exists():
        raise HTTPException(status_code=404, detail="Missing login.html in frontend/")
    return HTMLResponse(page.read_text(encoding="utf-8"))

@app.post("/api/login")
async def api_login(payload: dict):
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""
    if not verify_credentials(email, password):
        return JSONResponse({"ok": False, "message": "Invalid email or password"}, status_code=401)


    token = create_cookie_value(email)
    resp = JSONResponse({"ok": True, "message": "ok"})
    resp.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False, # set True behind HTTPS
        path="/",
        )
    return resp

@app.post("/api/logout")
async def api_logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp

@app.get("/", response_class=HTMLResponse)
async def index(request: FastAPIRequest):
    # Require auth before showing app
    _ = require_auth(request)
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found in frontend/")
    return HTMLResponse(index_path.read_text(encoding="utf-8"))

@app.get("/overview", response_class=HTMLResponse)
async def overview_page(request: FastAPIRequest):
    # Require auth before showing app
    _ = require_auth(request)
    overview_path = FRONTEND_DIR / "overview.html"
    if not overview_path.exists():
        raise HTTPException(status_code=404, detail="overview.html not found in frontend/")
    return HTMLResponse(overview_path.read_text(encoding="utf-8"))

@app.get("/favicon.ico")
def favicon():
    ico = FRONTEND_DIR / "favicon.ico"
    if ico.exists():
        return FileResponse(str(ico), media_type="image/x-icon")
    raise HTTPException(status_code=404, detail="favicon not found")

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")
    ds_id = STORE.add(df, save_name=file.filename)
    return {"dataset_id": ds_id, "columns": list(df.columns), "rows": len(df)}

@app.get("/api/sample")
def sample():
    p = ROOT / "data" / "sample.csv"
    return FileResponse(str(p), media_type="text/csv", filename="sample.csv")

@app.get("/api/profile")
def api_profile(dataset_id: str):
    try:
        df = STORE.get_clean(dataset_id)
        print(f"Dataset shape: {df.shape}")
        print(f"Dataset columns: {list(df.columns)}")
        print(f"Dataset dtypes: {df.dtypes.to_dict()}")
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset not found (server reload clears memory). Please re-upload.")
    
    try:
        prof = profile_dataframe(df)
        print(f"Profile result length: {len(prof)}")
        result = {"dataset_id": dataset_id, "profile": prof}
        print(f"Final result keys: {list(result.keys())}")
        return result
    except Exception as e:
        import traceback
        print(f"Error in profiling: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Profiling error: {str(e)}")

@app.post("/api/dedup")
async def api_dedup(dataset_id: str = Form(...), subset: Optional[str] = Form(None)):
    try:
        df = STORE.get_clean(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset not found. Re-upload and retry.")
    cols = subset.split(",") if subset else None
    result = deduplicate(df, subset=cols)
    STORE.set_clean(dataset_id, result["df"])
    return {k:v for k,v in result.items() if k != "df"}

@app.post("/api/standardize")
async def api_standardize(dataset_id: str = Form(...)):
    try:
        df = STORE.get_clean(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset not found. Re-upload and retry.")
    result = standardize(df)
    STORE.set_clean(dataset_id, result["df"])
    return {"applied_aliases": result["applied_aliases"], "applied_units": result["applied_units"]}

@app.post("/api/impute")
async def api_impute(dataset_id: str = Form(...)):
    try:
        df = STORE.get_clean(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset not found. Re-upload and retry.")
    result = impute_simple(df)
    STORE.set_clean(dataset_id, result["df"])
    return {"imputations": result["imputations"]}

@app.get("/api/kpis")
def api_kpis(dataset_id: str):
    try:
        before = STORE.get_raw(dataset_id)
        after = STORE.get_clean(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset not found. Re-upload and retry.")
    return kpis(before, after)

@app.get("/api/export")
def api_export(dataset_id: str):
    try:
        df = STORE.get_clean(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset not found. Re-upload and retry.")
    # Handle export path for both development and bundled executable
    if getattr(sys, 'frozen', False):
        # Running from bundled executable - save to user's Downloads or temp directory
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        out = temp_dir / f"{dataset_id}_clean.csv"
    else:
        # Running from source
        out = ROOT.parent / "data" / f"{dataset_id}_clean.csv"
    df.to_csv(out, index=False)
    return FileResponse(str(out), media_type="text/csv", filename=out.name)

@app.get("/api/overview")
def api_overview(dataset_id: str | None = None):
    """Return comprehensive overview data from the uploaded CSV file."""
    import math
    print(f"Overview API called with dataset_id: {dataset_id}")
    print(f"Available datasets: {list(STORE.datasets.keys())}")
    
    try:
        if dataset_id:
            df = STORE.get_clean(dataset_id)
            print(f"Retrieved dataset with ID: {dataset_id}, shape: {df.shape}")
        else:
            df = STORE.get_latest()
            print(f"Retrieved latest dataset, shape: {df.shape}")
    except Exception as e:
        print(f"Error retrieving dataset: {e}")
        # fall back empty KPIs
        return {
            "rows": 0,
            "completeness": 0.0,
            "uniqueness": 0.0,
            "dq_score": 0.0,
            "missingness_by_column": {},
            "column_types": {},
            "data_types_distribution": {},
            "missing_stats": {
                "total_missing": 0,
                "columns_with_missing": 0,
                "missing_percentage": 0.0
            }
        }
    
    # Basic KPIs
    rows = len(df)
    cells = int(df.size) if rows else 0
    nulls = int(df.isna().sum().sum()) if rows else 0
    completeness = (1.0 - (nulls / cells)) * 100.0 if cells else 0.0
    unique_rows = len(df.drop_duplicates()) if rows else 0
    uniqueness = (unique_rows / rows) * 100.0 if rows else 0.0
    dq_score = 0.6 * completeness + 0.4 * uniqueness
    miss_by_col = (df.isna().sum() / max(rows,1)).to_dict()
    
    # Column types analysis
    column_types = {}
    data_types_distribution = {}
    
    for col in df.columns:
        dtype = str(df[col].dtype)
        
        # Categorize data types
        if 'int' in dtype:
            col_type = 'Integer'
            data_type = 'Integer'
        elif 'float' in dtype:
            col_type = 'Numeric'
            data_type = 'Float'
        elif 'datetime' in dtype or 'date' in dtype:
            col_type = 'Date'
            data_type = 'Date'
        elif 'bool' in dtype:
            col_type = 'Boolean'
            data_type = 'Boolean'
        else:
            col_type = 'Text'
            data_type = 'String'
        
        column_types[col] = col_type
        
        # Count data types
        if data_type in data_types_distribution:
            data_types_distribution[data_type] += 1
        else:
            data_types_distribution[data_type] = 1
    
    # Missing data statistics
    missing_values = df.isna().sum()
    total_missing = int(missing_values.sum())
    columns_with_missing = int((missing_values > 0).sum())
    missing_percentage = (total_missing / cells * 100) if cells > 0 else 0.0
    
    return {
        "rows": rows,
        "completeness": round(completeness, 1),
        "uniqueness": round(uniqueness, 1),
        "dq_score": round(dq_score, 1),
        "missingness_by_column": {k: float(v) for k,v in miss_by_col.items()},
        "column_types": column_types,
        "data_types_distribution": data_types_distribution,
        "missing_stats": {
            "total_missing": total_missing,
            "columns_with_missing": columns_with_missing,
            "missing_percentage": round(missing_percentage, 1)
        }
    }

@app.get("/cleansing", response_class=HTMLResponse)
async def cleansing_page(request: FastAPIRequest):
    # Require auth before showing app
    _ = require_auth(request)
    cleansing_path = FRONTEND_DIR / "cleansing.html"
    if not cleansing_path.exists():
        raise HTTPException(status_code=404, detail="cleansing.html not found in frontend/")
    return HTMLResponse(cleansing_path.read_text(encoding="utf-8"))

@app.get("/api/cleansing/preview")
def preview(dataset_id: Optional[str] = Query(default=None)):
    import math
    df = get_df_cleaning(dataset_id)
    cols = list(df.columns)

    # Stats
    dups = _duplicates_count(df)
    miss_raw = _missing_by_column(df)

    # sanitize per-column missing to avoid NaN/Inf
    miss = {}
    for k, v in miss_raw.items():
        try:
            f = float(v)
            if math.isnan(f) or math.isinf(f):
                f = 0.0
        except Exception:
            f = 0.0
        miss[k] = f

    miss_pct = float(np.mean(list(miss.values()))) * 100.0 if miss else 0.0
    cols_with_missing = sum(1 for v in miss.values() if v > 0)

    suggestions = []
    if dups > 0:
        suggestions.append(f"{dups} duplicate rows detected. Enable 'Remove duplicates'.")
    if cols_with_missing > 0:
        suggestions.append(f"{cols_with_missing} columns contain missing values. Consider imputation.")
    if any(c.lower() in ('well','well_id','id','uuid') for c in cols):
        suggestions.append("Likely key column detected (e.g., well_id). Use it for dedup subset.")
    suggestions.append("Standardization can harmonize aliases (e.g., well→well_id) and convert units.")

    # optional targets
    std_targets = []
    try:
        from .cleaning import ALIASES, UNIT_MAP  # type: ignore
        std_targets = [f"Alias → {k}" for k in ALIASES.keys()] + [f"Unit → {k}" for k in UNIT_MAP.keys()]
    except Exception:
        pass

    # completeness (guard NaN/Inf)
    comp = _completeness_pct(df)
    if isinstance(comp, float) and (math.isnan(comp) or math.isinf(comp)):
        comp = 0.0

    return {
        "columns": cols,
        "missing_by_column": miss,
        "stats": {
            "rows": int(len(df)),
            "duplicates": dups,
            "missing_pct": round(miss_pct, 2),
            "columns_with_missing": int(cols_with_missing),
            "completeness_pct": round(comp, 2),
        },
        "suggestions": suggestions,
        "standardization_targets": std_targets,
    }

@app.post("/api/cleansing/apply")
def apply(req: ApplyRequest = Body(...)):
    df0 = get_df_cleaning(req.dataset_id)
    applied: List[str] = []
    df = df0.copy()
    imputations: List[Dict[str, Any]] = []

    # Apply in a predictable order
    if req.actions.deduplicate is not None:
        subset = req.actions.deduplicate.get("subset") or None
        res = deduplicate(df, subset=subset)
        df = res["df"]
        applied.append(f"Deduplicated rows (subset={subset or 'ALL COLUMNS'})")

    if req.actions.standardize is not None:
        res = standardize(df)
        df = res["df"]
        applied.append("Standardized aliases/units")

    if req.actions.impute is not None:
        res = impute_simple(df)
        df = res["df"]
        imputations = res["imputations"]
        filled_total = sum(int(x.get("filled",0)) for x in imputations)
        applied.append(f"Imputed missing values (total filled={filled_total})")

    summary = kpis(df0, df)
    summary = dict_numbers_safe(summary)

    # For transparency, return a tiny preview of rows (JSON-safe)
    preview_before = df_records_safe(df0.head(5))
    preview_after  = df_records_safe(df.head(5))
    # Persist unless dry run
    new_dataset_id = None
    if not req.dry_run:
        new_dataset_id = _put_df(df)

    payload = {
        "kpis": summary,
        "applied": applied,
        "imputations": imputations,
        "preview_before": preview_before,
        "preview_after": preview_after,
        "new_dataset_id": new_dataset_id,
        }

    return JSONResponse(content=jsonable_encoder(payload, exclude_none=False))

@app.get("/anomalies", response_class=HTMLResponse)
async def anomalies_page(request: FastAPIRequest):
    _ = require_auth(request)
    page = FRONTEND_DIR / "anomalies.html"
    if not page.exists():
        raise HTTPException(status_code=404, detail="anomalies.html not found in frontend/")
    return HTMLResponse(page.read_text(encoding="utf-8"))

@app.get("/api/anomalies/rows")
def rows(dataset_id: Optional[str] = Query(default=None), limit: int = 100):
    """Return a small sample of flagged rows (combined IQR + IForest)."""
    df = get_df_anomalies(dataset_id)

    # IQR mask
    iqr = _iqr_per_col(df)
    mask_iqr = pd.Series(False, index=df.index)
    for c, v in iqr.items():
        if c in df and "lower" in v and "upper" in v:
            mask_iqr |= (df[c] < v["lower"]) | (df[c] > v["upper"])  # type: ignore

    # IForest mask
    mask_if = pd.Series(False, index=df.index)
    print(SKLEARN)
    print(df.select_dtypes(include=[np.number]).empty)
    print(len(df) >= 10)
    if SKLEARN and not df.select_dtypes(include=[np.number]).empty and len(df) >= 10:
        try:
            X = _safe_numeric(df)
            pred = IsolationForest(n_estimators=200, contamination=0.02, random_state=42, n_jobs=-1).fit_predict(X)
            mask_if = (pred == -1)
        except Exception:
            pass

    mask = mask_iqr | mask_if
    flagged = df[mask].copy()
    flagged["__is_outlier_iqr"] = mask_iqr[mask].values
    flagged["__is_outlier_iforest"] = mask_if[mask].values

    # Trim columns for UI readability if extremely wide
    cols = list(flagged.columns)
    if len(cols) > 18:
        cols = cols[:18]
        flagged = flagged[cols]

    sample = flagged.head(max(1, int(limit)))
    return {
        "count": int(flagged.shape[0]),
        "columns": list(sample.columns),
        "rows": [
            {c: (0.0 if (isinstance(v, float) and (np.isnan(v) or np.isinf(v))) else v) for c, v in r.items()}
            for r in sample.to_dict(orient="records")
        ],
    }

@app.get("/api/anomalies/summary")
def summary(dataset_id: Optional[str] = Query(default=None)):
    """Aggregated anomalies snapshot to fill KPI cards and lists."""
    df = get_df_anomalies(dataset_id)

    # Missingness
    miss_by_col = _missing_col(df)
    total_cells = int(df.shape[0] * df.shape[1])
    total_missing = int(df.isna().sum().sum())
    miss_pct = (total_missing / total_cells * 100.0) if total_cells else 0.0

    # Duplicates
    dup_rows = _dup_count(df)
    dup_pct = (dup_rows / len(df) * 100.0) if len(df) else 0.0

    # IQR Outliers
    iqr = _iqr_per_col(df)
    iqr_row_mask = pd.Series(False, index=df.index)
    for c, b in iqr.items():
        if "lower" in b and "upper" in b:
            iqr_row_mask |= (df[c] < b["lower"]) | (df[c] > b["upper"]) if c in df else False
    iqr_rows = int(iqr_row_mask.sum())

    # Isolation Forest (optional)
    if_rows = 0
    if_pct = 0.0
    if_note = None
    if SKLEARN and not df.select_dtypes(include=[np.number]).empty and len(df) >= 10:
        try:
            X = _safe_numeric(df)
            model = IsolationForest(n_estimators=200, contamination=0.02, random_state=42, n_jobs=-1)
            pred = model.fit_predict(X)
            if_mask = (pred == -1)
            if_rows = int(if_mask.sum())
            if_pct = float(if_rows / len(X) * 100.0)
        except Exception as e:
            if_note = f"IsolationForest error: {e}"
    else:
        if_note = "IsolationForest unavailable (no sklearn or insufficient numeric data)."

    # Column dtypes & flags
    nunique = df.nunique(dropna=False)
    constants = [c for c in df.columns if int(nunique[c]) <= 1]

    return {
        "shape": {"rows": int(df.shape[0]), "cols": int(df.shape[1])},
        "missing": {
            "total_missing": total_missing,
            "pct_missing": round(miss_pct, 2),
            "by_column": miss_by_col,
        },
        "duplicates": {"row_duplicates": dup_rows, "row_duplicates_pct": round(dup_pct, 2)},
        "outliers": {
            "method": "iqr",
            "per_column": [
                {"column": c, "count": v["count"], "lower": v.get("lower", None), "upper": v.get("upper", None)}
                for c, v in iqr.items()
            ],
            "n_rows_flagged": iqr_rows,
        },
        "iforest": {"available": SKLEARN and if_note is None, "n_rows_flagged": if_rows, "pct_rows_flagged": round(if_pct, 2), "note": if_note},
        "columns": {
            "dtypes": {c: str(t) for c, t in df.dtypes.items()},
            "constants": constants,
        },
    }


def open_browser():
    """Open browser to login page after server starts"""
    time.sleep(2)  # Wait for server to start
    webbrowser.open("http://127.0.0.1:8000/login")


@app.get("/export", response_class=HTMLResponse)
async def export_page(request: FastAPIRequest):
    # Require auth before showing export page
    _ = require_auth(request)
    export_path = FRONTEND_DIR / "export.html"
    if not export_path.exists():
        raise HTTPException(status_code=404, detail="export.html not found in frontend/")
    return HTMLResponse(export_path.read_text(encoding="utf-8"))

@app.get("/api/export/csv")
def export_csv(dataset_id: Optional[str] = Query(default=None)):
    """Export the processed dataset as CSV"""
    try:
        # Get the processed (clean) dataset
        if dataset_id:
            df = STORE.get_clean(dataset_id)
        else:
            # If no dataset_id provided, get the latest processed dataset
            df = STORE.get_latest()
        
        # Create CSV response
        from io import StringIO
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        # Return CSV file
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=drill_dq_export.csv"
            }
        )
        
    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    # If running from executable, open browser automatically
    if getattr(sys, 'frozen', False):
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()

    # Start the server
    uvicorn.run(app, host="127.0.0.1", port=8000)