from __future__ import annotations
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

# If you mount this into your existing app in main.py, do:
#   from backend.anomalies_api import router as anomalies_router
#   app.include_router(anomalies_router)
# And ensure you can access STORE via an import in main.py scope if desired.

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

# --- Replace these with real imports if available in your project ---
try:
    from .services.storage import STORE  # same STORE used by cleansing/overview
except Exception:  # fallback for standalone
    class _TmpStore:
        def __init__(self):
            self.datasets = {}
        def get_clean(self, ds):
            if ds not in self.datasets:
                raise KeyError(ds)
            return self.datasets[ds]
        def set_clean(self, ds, df):
            self.datasets[ds] = df
        def get_latest(self):
            if not self.datasets:
                raise KeyError("empty")
            # return last inserted
            key = list(self.datasets.keys())[-1]
            return self.datasets[key]
    STORE = _TmpStore()

# Optional model-based anomalies
try:
    from sklearn.ensemble import IsolationForest
    SKLEARN = True
except Exception:
    SKLEARN = False


def _get_df(dataset_id: Optional[str]) -> pd.DataFrame:
    if dataset_id:
        try:
            return STORE.get_clean(dataset_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Dataset not found. Re-upload and retry.")
    # fall back to latest if available
    try:
        return STORE.get_latest()
    except Exception:
        raise HTTPException(status_code=404, detail="No datasets in memory. Upload first.")


def _safe_numeric(df: pd.DataFrame) -> pd.DataFrame:
    num = df.select_dtypes(include=[np.number]).replace([np.inf, -np.inf], np.nan)
    if num.empty:
        return num
    return num.fillna(num.median(numeric_only=True))


def _iqr_per_col(df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    out: Dict[str, Dict[str, float]] = {}
    num = df.select_dtypes(include=[np.number])
    for c in num.columns:
        s = num[c].dropna()
        if s.empty:
            continue
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            out[c] = {"lower": float(q1), "upper": float(q3), "count": 0}
            continue
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        cnt = int(((num[c] < lo) | (num[c] > hi)).sum())
        out[c] = {"lower": float(lo), "upper": float(hi), "count": cnt}
    return out


def _dup_count(df: pd.DataFrame) -> int:
    return int(len(df) - len(df.drop_duplicates()))


def _missing_col(df: pd.DataFrame) -> Dict[str, float]:
    return {c: float(df[c].isna().mean()) for c in df.columns}


