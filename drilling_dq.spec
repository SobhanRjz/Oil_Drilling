# -*- mode: python ; coding: utf-8 -*-


block_cipher = None


from pathlib import Path
ROOT = Path(SPECPATH).resolve().parent

a = Analysis(
    ['backend/main.py'],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        ('frontend', 'frontend'),
        ('data', 'data'),
    ],
    hiddenimports=[
        'fastapi',
        'uvicorn',
        'pandas',
        'numpy',
        'sklearn'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'plotly'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='drilling_dq',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # Disable UPX
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
