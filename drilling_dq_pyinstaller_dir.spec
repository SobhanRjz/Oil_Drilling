# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['launcher.py'],
    pathex=[],
    binaries=[],
    datas=[('frontend', 'frontend'), ('backend', 'backend')],
    hiddenimports=['uvicorn', 'fastapi', 'starlette', 'pydantic', 'pandas', 'numpy', 'sklearn', 'backend.main', 'backend.auth', 'backend.cleaning', 'backend.cleaning_api', 'backend.anomalies_api', 'backend.profiling', 'backend.services.storage'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='drilling_dq_pyinstaller_dir',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='drilling_dq_pyinstaller_dir',
)
