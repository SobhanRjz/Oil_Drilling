import pandas as pd
from typing import List, Dict, Any

def deduplicate(df: pd.DataFrame, subset: List[str] | None = None) -> Dict[str, Any]:
    before = len(df)
    deduped = df.drop_duplicates(subset=subset, keep="first")
    after = len(deduped)
    return {"rows_before": before, "rows_after": after, "removed": before-after, "df": deduped}

UNIT_MAP = {"pressure_bar": ("pressure_psi", 0.0689476, 0.0)}
ALIASES = {"well_id": ["well","WELL_ID"], "depth_m": ["depth","DEPTH_M"]}

def standardize(df: pd.DataFrame) -> Dict[str, Any]:
    df2 = df.copy()
    for std, alist in ALIASES.items():
        if std not in df2.columns:
            for a in alist:
                if a in df2.columns:
                    df2[std] = df2[a]
                    break
    for new_col, (from_col, mul, add) in UNIT_MAP.items():
        if from_col in df2.columns and new_col not in df2.columns:
            df2[new_col] = df2[from_col].astype(float) * mul + add
    return {"applied_aliases": list(ALIASES.keys()), "applied_units": list(UNIT_MAP.keys()), "df": df2}

def impute_simple(df: pd.DataFrame) -> Dict[str, Any]:
    df2 = df.copy()
    report = []
    for col in df2.columns:
        if df2[col].isna().any():
            if pd.api.types.is_numeric_dtype(df2[col]):
                val = df2[col].median()
                method = "median"
            else:
                mode = df2[col].mode(dropna=True)
                val = mode.iloc[0] if not mode.empty else ""
                method = "mode"
            n = int(df2[col].isna().sum())
            df2[col] = df2[col].fillna(val)
            report.append({"column": col, "filled": n, "method": method})
    return {"imputations": report, "df": df2}

def kpis(before_df: pd.DataFrame, after_df: pd.DataFrame) -> Dict[str, Any]:
    def completeness(d):
        return 0.0 if d.size == 0 else float((1.0 - d.isna().mean().mean())*100)
    def duplicates(d): return int(len(d) - len(d.drop_duplicates()))
    return {
        "rows_before": len(before_df),
        "rows_after": len(after_df),
        "duplicates_before": duplicates(before_df),
        "duplicates_after": duplicates(after_df),
        "completeness_before_pct": round(completeness(before_df),2),
        "completeness_after_pct": round(completeness(after_df),2),
    }
