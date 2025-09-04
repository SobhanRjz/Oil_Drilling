import pandas as pd
import numpy as np

def profile_dataframe(df: pd.DataFrame) -> list:
    """Return a list of dictionaries instead of DataFrame to avoid to_dict() issues"""
    rows = []
    for col in df.columns:
        try:
            s = df[col]
            null_pct = float(s.isna().mean()*100)
            unique_pct = float(s.nunique(dropna=True)/max(len(s),1)*100)
            
            # Handle min/max values safely
            min_val = None
            max_val = None
            if pd.api.types.is_numeric_dtype(s):
                try:
                    min_val = s.min()
                    max_val = s.max()
                    # Convert inf/nan to None for JSON serialization
                    if pd.isna(min_val) or np.isinf(min_val):
                        min_val = None
                    else:
                        min_val = float(min_val)
                    
                    if pd.isna(max_val) or np.isinf(max_val):
                        max_val = None
                    else:
                        max_val = float(max_val)
                except Exception as e:
                    print(f"Error with min/max for column {col}: {e}")
                    min_val = None
                    max_val = None
            
            outliers = None
            if pd.api.types.is_numeric_dtype(s):
                try:
                    vals = s.dropna().astype(float)
                    if len(vals) > 0:
                        # Remove inf values before calculating statistics
                        vals = vals[np.isfinite(vals)]
                        if len(vals) > 0:
                            std = vals.std()
                            z = (vals - vals.mean()) / (std if std != 0 else 1.0)
                            outliers = int((np.abs(z) > 3).sum())
                        else:
                            outliers = 0
                    else:
                        outliers = 0
                except Exception as e:
                    print(f"Error with outliers for column {col}: {e}")
                    outliers = 0
            
            row_data = {
                "column": str(col),
                "null_pct": round(null_pct,2),
                "unique_pct": round(unique_pct,2),
                "min": min_val,
                "max": max_val,
                "outliers": outliers
            }
            
            # Test JSON serialization for this row
            import json
            json.dumps(row_data)
            
            rows.append(row_data)
            
        except Exception as e:
            print(f"Error processing column {col}: {e}")
            # Add a safe fallback row
            rows.append({
                "column": str(col),
                "null_pct": 0.0,
                "unique_pct": 0.0,
                "min": None,
                "max": None,
                "outliers": None
            })
    
    return rows
