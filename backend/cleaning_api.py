# FastAPI endpoints for the Cleansing step.
# Plug this into your server (e.g., mount on your existing FastAPI app or run standalone).
# It uses your existing `cleaning.py` helpers.

from fastapi import FastAPI, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
import uuid
import math

app = FastAPI(title="Drill DQ - Cleaning API")

# If you serve UI from a different origin during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory dataset store (replace with your persistence, e.g., DB or filesystem)
DATASETS: Dict[str, pd.DataFrame] = {}

def df_records_safe(df: pd.DataFrame):
    df2 = df.replace([np.inf, -np.inf], np.nan)
    def safe_value(x):
        if isinstance(x, float) and (math.isnan(x) or str(x).lower() == "nan"):
            return 0.0
        return x
    return [
        {k: safe_value(v) for k, v in row.items()}
        for row in df2.where(pd.notnull(df2), None).to_dict(orient="records")
    ]

def json_number_safe(x):
    try:
        f = float(x)
        if math.isnan(f) or math.isinf(f) or str(x).lower() == "nan":
            return 0.0
        return f
    except Exception:
        if str(x).lower() == "nan":
            return 0.0
        return x

def dict_numbers_safe(d: dict):
    out = {}
    for k, v in d.items():
        if isinstance(v, dict):
            out[k] = dict_numbers_safe(v)
        elif isinstance(v, list):
            out[k] = [dict_numbers_safe(i) if isinstance(i, dict) else (json_number_safe(i) if isinstance(i, (int, float, str)) else i) for i in v]
        elif isinstance(v, (int, float, str)):
            out[k] = json_number_safe(v)
        else:
            out[k] = v
    return out

def _sample_df() -> pd.DataFrame:
    # tiny fallback dataset when no dataset_id is provided/found
    return pd.DataFrame({
        "well_id": [1, 1, 2, 3, 4],
        "pressure_psi": [100, 100, 120, np.nan, 90],
        "depth": [10.0, 10.0, 11.5, 12.0, np.nan],
    })

def _get_df(dataset_id: Optional[str]) -> pd.DataFrame:
    if dataset_id and dataset_id in DATASETS:
        return DATASETS[dataset_id].copy()
    # TODO: Load from your storage if needed
    return _sample_df()

def _put_df(df: pd.DataFrame) -> str:
    new_id = uuid.uuid4().hex[:8]
    DATASETS[new_id] = df.copy()
    return new_id

def _missing_by_column(df: pd.DataFrame) -> Dict[str, float]:
    return {c: float(df[c].isna().mean()) for c in df.columns}

def _duplicates_count(df: pd.DataFrame, subset: Optional[List[str]] = None) -> int:
    return int(len(df) - len(df.drop_duplicates(subset=subset)))

def _completeness_pct(df: pd.DataFrame) -> float:
    return float((1.0 - df.isna().mean().mean())*100.0)

class Actions(BaseModel):
    deduplicate: Optional[Dict[str, Any]] = None  # {"subset": ["id"]}
    standardize: Optional[Dict[str, Any]] = None  # {}
    impute: Optional[Dict[str, Any]] = None       # {}

class ApplyRequest(BaseModel):
    dataset_id: Optional[str] = None
    actions: Actions
    dry_run: bool = True

@app.get("/api/cleansing/preview")
def preview(dataset_id: Optional[str] = Query(default=None)):
    df = _get_df(dataset_id)
    cols = list(df.columns)

    # Stats
    dups = _duplicates_count(df)
    miss = _missing_by_column(df)
    # Calculate overall missing percentage (same as general/anomalies)
    total_cells = int(df.shape[0] * df.shape[1])
    total_missing = int(df.isna().sum().sum())
    miss_pct = (total_missing / total_cells * 100.0) if total_cells else 0.0
    cols_with_missing = 1.0#sum(1 for v in miss.values() if v > 0)

    # Basic suggestions
    suggestions = []
    if dups > 0:
        suggestions.append(f"{dups} duplicate rows detected. Enable 'Remove duplicates'.")
    if cols_with_missing > 0:
        suggestions.append(f"{cols_with_missing} columns contain missing values. Consider imputation.")
    if any(c.lower() in ('well','well_id','id','uuid') for c in cols):
        suggestions.append("Likely key column detected (e.g., well_id). Use it for dedup subset.")
    suggestions.append("Standardization can harmonize aliases (e.g., well→well_id) and convert units.")

    # From your cleaning.py constants (optional mirror for UI)
    std_targets = []
    try:
        from cleaning import ALIASES, UNIT_MAP  # type: ignore
        std_targets = [f"Alias → {k}" for k in ALIASES.keys()] + [f"Unit → {k}" for k in UNIT_MAP.keys()]
    except Exception:
        pass

    return {
        "columns": cols,
        "missing_by_column": miss,
        "stats": {
            "rows": int(len(df)),
            "duplicates": dups,
            "missing_pct": round(miss_pct, 2),
            "columns_with_missing": int(cols_with_missing),
            "completeness_pct": round(_completeness_pct(df), 2),
        },
        "suggestions": suggestions,
        "standardization_targets": std_targets,
    }


# If you want to run this module standalone:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
