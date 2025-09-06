from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Optional
import pandas as pd
from pathlib import Path
import uuid
import sys
import tempfile

# Handle data directory for both development and bundled executable
if getattr(sys, 'frozen', False):
    # Running from bundled executable - use temp directory for data storage
    DATA_DIR = Path(tempfile.gettempdir()) / "drilling_dq_data"
    DATA_DIR.mkdir(exist_ok=True)
else:
    # Running from source
    DATA_DIR = Path(__file__).resolve().parents[2] / "data"

@dataclass
class DatasetEntry:
    id: str
    path_raw: Path
    df_raw: pd.DataFrame
    df_clean: Optional[pd.DataFrame] = None

class InMemoryStore:
    def __init__(self) -> None:
        self.datasets: Dict[str, DatasetEntry] = {}

    def add(self, df: pd.DataFrame, save_name: str) -> str:
        ds_id = str(uuid.uuid4())
        path = DATA_DIR / f"{ds_id}_{save_name}"
        df.to_csv(path, index=False)
        self.datasets[ds_id] = DatasetEntry(id=ds_id, path_raw=path, df_raw=df.copy())
        return ds_id

    def get_raw(self, ds_id: str) -> pd.DataFrame:
        return self.datasets[ds_id].df_raw

    def get_clean(self, ds_id: str) -> pd.DataFrame:
        ent = self.datasets[ds_id]
        return ent.df_clean if ent.df_clean is not None else ent.df_raw

    def set_clean(self, ds_id: str, df: pd.DataFrame) -> None:
        self.datasets[ds_id].df_clean = df.copy()

    def get_latest(self) -> pd.DataFrame:
        """Get the most recently added dataset."""
        if not self.datasets:
            raise KeyError("No datasets available")
        # Get the last added dataset (assuming insertion order is maintained)
        latest_id = list(self.datasets.keys())[-1]
        return self.get_clean(latest_id)

STORE = InMemoryStore()
