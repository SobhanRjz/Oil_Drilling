"""Nuitka build script for Drilling Data Quality FastAPI Application."""
import subprocess
import sys
import os
from pathlib import Path

def check_project_structure():
    """Check if the FastAPI application structure is valid."""
    project_root = Path(__file__).parent

    print("Checking project structure...")
    print("-" * 40)

    try:
        # Check backend files
        backend_main = project_root / "backend" / "main.py"
        if not backend_main.exists():
            print("ERROR: backend/main.py not found")
            return False

        # Check launcher.py
        launcher_file = project_root / "launcher.py"
        if not launcher_file.exists():
            print("ERROR: launcher.py not found")
            return False

        # Check frontend files
        frontend_dir = project_root / "frontend"
        if not frontend_dir.exists():
            print("ERROR: frontend/ directory not found")
            return False

        login_html = frontend_dir / "login.html"
        if not login_html.exists():
            print("ERROR: frontend/login.html not found")
            return False

        print("SUCCESS: Project structure is valid")
        return True

    except Exception as e:
        print(f"ERROR: Error checking project structure: {e}")
        return False

def build_nuitka_standalone():
    """Build with Nuitka standalone mode (recommended)."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--onefile",
        "--output-dir=build",
        "--output-filename=drilling_dq.exe",
        "--include-data-dir=frontend=frontend",
        "--include-data-dir=backend=backend",
        "--assume-yes-for-downloads",
        "--show-progress",
        "--show-scons",
        "--follow-imports",
        "--include-module=encodings",
        "--include-module=codecs",
        "--include-module=uvicorn",
        "--include-module=fastapi",
        "--include-module=starlette",
        "--include-module=pydantic",
        "--include-module=pandas",
        "--include-module=numpy",
        "--include-module=sklearn",
        "--include-module=scipy",
        "--include-module=webbrowser",
        "--include-module=threading",
        "--include-module=pathlib",
        "--include-package=encodings",
        "--include-package=fastapi",
        "--include-package=uvicorn",
        "--include-package=pandas",
        "--include-package=numpy",
        "--include-package=sklearn",
        "--python-flag=no_site",
        "--python-flag=unbuffered",
        "--windows-company-name=Drilling Data Quality",
        "--windows-product-name=Drilling Data Quality Demo v2",
        "--windows-product-version=1.0.0",
        "--windows-file-version=1.0.0",
        "--windows-file-description=Drilling Data Quality Desktop Application",
        "launcher.py"
    ]

    print("\nBuilding executable with Nuitka...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        return False

def build_nuitka_minimal():
    """Build with minimal Nuitka options."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--onefile",
        "--output-dir=build",
        "--output-filename=drilling_dq.exe",
        "--include-data-dir=frontend=frontend",
        "--include-data-dir=backend=backend",
        "--assume-yes-for-downloads",
        "--show-progress",
        "--show-scons",
        "--follow-imports",
        "--include-module=encodings",
        "--include-module=codecs",
        "--include-module=uvicorn",
        "--include-module=fastapi",
        "--include-module=pandas",
        "--include-module=numpy",
        "--include-module=sklearn",
        "--include-module=webbrowser",
        "--include-module=threading",
        "--include-module=pathlib",
        "--include-package=encodings",
        "--include-package=fastapi",
        "--include-package=pandas",
        "--include-package=numpy",
        "--python-flag=no_site",
        "--python-flag=unbuffered",
        "--windows-company-name=Drilling Data Quality",
        "--windows-product-name=Drilling Data Quality Demo v2",
        "--windows-product-version=1.0.0",
        "--windows-file-version=1.0.0",
        "--windows-file-description=Drilling Data Quality Desktop Application",
        "launcher.py"
    ]

    print("\nBuilding executable with Nuitka (Minimal)...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        return False

def build_nuitka_debug():
    """Build with debug information."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--onefile",
        "--output-dir=build",
        "--output-filename=drilling_dq.exe",
        "--include-data-dir=frontend=frontend",
        "--include-data-dir=backend=backend",
        "--debug",
        "--show-progress",
        "--show-scons",
        "--follow-imports",
        "--include-module=encodings",
        "--include-module=codecs",
        "--include-module=uvicorn",
        "--include-module=fastapi",
        "--include-module=pandas",
        "--include-module=numpy",
        "--include-module=sklearn",
        "--include-module=webbrowser",
        "--include-module=threading",
        "--include-module=pathlib",
        "--include-package=encodings",
        "--include-package=fastapi",
        "--include-package=pandas",
        "--include-package=numpy",
        "--python-flag=no_site",
        "--python-flag=unbuffered",
        "--windows-company-name=Drilling Data Quality",
        "--windows-product-name=Drilling Data Quality Demo v2",
        "--windows-product-version=1.0.0",
        "--windows-file-version=1.0.0",
        "--windows-file-description=Drilling Data Quality Desktop Application",
        "launcher.py"
    ]

    print("\nBuilding executable with Nuitka (Debug mode)...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\n❌ Build interrupted by user")
        return False

def build_nuitka_onefile_tempdir():
    """Build with onefile and tempdir handling for better compatibility."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--onefile",
        "--onefile-tempdir-spec=%TEMP%/drilling_dq_{PID}_{TIME}",
        "--output-dir=build",
        "--output-filename=drilling_dq.exe",
        "--include-data-dir=frontend=frontend",
        "--include-data-dir=backend=backend",
        "--assume-yes-for-downloads",
        "--show-progress",
        "--show-scons",
        "--follow-imports",
        "--include-module=encodings",
        "--include-module=codecs",
        "--include-module=uvicorn",
        "--include-module=fastapi",
        "--include-module=pandas",
        "--include-module=numpy",
        "--include-module=sklearn",
        "--include-module=webbrowser",
        "--include-module=threading",
        "--include-module=pathlib",
        "--include-package=encodings",
        "--include-package=fastapi",
        "--include-package=pandas",
        "--include-package=numpy",
        "--python-flag=no_site",
        "--python-flag=unbuffered",
        "--windows-company-name=Drilling Data Quality",
        "--windows-product-name=Drilling Data Quality Demo v2",
        "--windows-product-version=1.0.0",
        "--windows-file-version=1.0.0",
        "--windows-file-description=Drilling Data Quality Desktop Application",
        "launcher.py"
    ]

    print("\nBuilding executable with Nuitka (Onefile with tempdir fix)...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        return False

def build_nuitka_standalone_only():
    """Build with Nuitka standalone mode only (no onefile)."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "nuitka",
        "--standalone",
        "--output-dir=build",
        "--output-filename=drilling_dq_standalone",
        "--include-data-dir=frontend=frontend",
        "--include-data-dir=backend=backend",
        "--assume-yes-for-downloads",
        "--show-progress",
        "--show-scons",
        "--follow-imports",
        "--include-module=encodings",
        "--include-module=codecs",
        "--include-module=uvicorn",
        "--include-module=fastapi",
        "--include-module=pandas",
        "--include-module=numpy",
        "--include-module=sklearn",
        "--include-module=webbrowser",
        "--include-module=threading",
        "--include-module=pathlib",
        "--include-package=encodings",
        "--include-package=fastapi",
        "--include-package=pandas",
        "--include-package=numpy",
        "--python-flag=no_site",
        "--python-flag=unbuffered",
        "--windows-company-name=Drilling Data Quality",
        "--windows-product-name=Drilling Data Quality Demo v2",
        "--windows-product-version=1.0.0",
        "--windows-file-version=1.0.0",
        "--windows-file-description=Drilling Data Quality Desktop Application",
        "launcher.py"
    ]

    print("\nBuilding executable with Nuitka (Standalone only)...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        if result.returncode == 0:
            # Create a batch file to run the standalone version
            batch_content = '''@echo off
cd /d "%~dp0"
start "" "drilling_dq_standalone.exe"
'''
            batch_path = project_root / "build" / "run_standalone.bat"
            with open(batch_path, 'w') as f:
                f.write(batch_content)
            print("SUCCESS: Created run_standalone.bat to launch the application")
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        return False

def check_pyinstaller():
    """Check if PyInstaller is available."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "PyInstaller", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"SUCCESS: PyInstaller version: {result.stdout.strip()}")
            return True
        else:
            print("ERROR: PyInstaller not working properly")
            return False
    except FileNotFoundError:
        print("ERROR: PyInstaller not installed")
        return False

def check_nuitka():
    """Check if Nuitka is available."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "nuitka", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"SUCCESS: Nuitka version: {result.stdout.strip()}")
            return True
        else:
            print("ERROR: Nuitka not working properly")
            return False
    except FileNotFoundError:
        print("ERROR: Nuitka not installed")
        return False

def install_pyinstaller():
    """Install PyInstaller."""
    print("Installing PyInstaller...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "pyinstaller"
        ], check=True)
        print("SUCCESS: PyInstaller installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("ERROR: Failed to install PyInstaller")
        return False

def install_nuitka():
    """Install Nuitka."""
    print("Installing Nuitka...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "nuitka"
        ], check=True)
        print("SUCCESS: Nuitka installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("ERROR: Failed to install Nuitka")
        return False

def build_pyinstaller_onefile():
    """Build with PyInstaller onefile mode."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",  # No console window
        "--name=drilling_dq_pyinstaller",
        "--distpath=build",
        "--workpath=build/pyinstaller_temp",
        "--add-data=frontend;frontend",
        "--add-data=backend;backend",
        "--hidden-import=uvicorn",
        "--hidden-import=fastapi",
        "--hidden-import=starlette",
        "--hidden-import=pydantic",
        "--hidden-import=pandas",
        "--hidden-import=numpy",
        "--hidden-import=sklearn",
        "--hidden-import=backend.main",
        "--hidden-import=backend.auth",
        "--hidden-import=backend.cleaning",
        "--hidden-import=backend.cleaning_api",
        "--hidden-import=backend.anomalies_api",
        "--hidden-import=backend.profiling",
        "--hidden-import=backend.services.storage",
        "launcher.py"
    ]

    print("\nBuilding executable with PyInstaller (Onefile)...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        return False

def build_pyinstaller_standalone():
    """Build with PyInstaller standalone mode (creates directory)."""
    project_root = Path(__file__).parent

    # First check project structure
    if not check_project_structure():
        return False

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onedir",  # Create directory instead of single file (faster)
        "--windowed",  # No console window
        "--name=drilling_dq_pyinstaller_dir",
        "--distpath=build",
        "--workpath=build/pyinstaller_temp",
        "--add-data=frontend;frontend",
        "--add-data=backend;backend",
        "--hidden-import=uvicorn",
        "--hidden-import=fastapi",
        "--hidden-import=starlette",
        "--hidden-import=pydantic",
        "--hidden-import=pandas",
        "--hidden-import=numpy",
        "--hidden-import=sklearn",
        "--hidden-import=backend.main",
        "--hidden-import=backend.auth",
        "--hidden-import=backend.cleaning",
        "--hidden-import=backend.cleaning_api",
        "--hidden-import=backend.anomalies_api",
        "--hidden-import=backend.profiling",
        "--hidden-import=backend.services.storage",
        "launcher.py"
    ]

    print("\nBuilding executable with PyInstaller (Standalone Directory)...")
    print("Command:", " ".join(cmd))
    print("=" * 60)

    try:
        result = subprocess.run(cmd, cwd=str(project_root))
        if result.returncode == 0:
            # Create a batch file to run the PyInstaller directory version
            batch_content = '''@echo off
cd /d "%~dp0"
start "" "drilling_dq_pyinstaller_dir\\launcher.exe"
'''
            batch_path = project_root / "build" / "run_pyinstaller.bat"
            with open(batch_path, 'w') as f:
                f.write(batch_content)
            print("SUCCESS: Created run_pyinstaller.bat to launch the application")
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        return False

def main():
    """Main build function with menu."""
    print("Build System for Drilling Data Quality")
    print("=" * 60)
    print("FastAPI Desktop Application Builder")
    print("=" * 60)

    # Check both build tools
    has_nuitka = check_nuitka()
    has_pyinstaller = check_pyinstaller()

    if not has_nuitka and not has_pyinstaller:
        print("\nERROR: Neither Nuitka nor PyInstaller found!")
        print("Choose which tool to install:")
        print("1. Install Nuitka")
        print("2. Install PyInstaller")
        print("3. Install both")

        choice = input("Enter choice (1-3): ").strip()

        if choice == "1":
            if not install_nuitka():
                return
            has_nuitka = True
        elif choice == "2":
            if not install_pyinstaller():
                return
            has_pyinstaller = True
        elif choice == "3":
            install_nuitka()
            install_pyinstaller()
            has_nuitka = True
            has_pyinstaller = True
        else:
            return

    print("\nSelect build tool and option:")
    print("=== Nuitka Builds ===")
    if has_nuitka:
        print("1. Nuitka Standalone + Onefile (Recommended - Slower)")
        print("2. Nuitka Quick Standalone (Faster - Creates folder)")
        print("3. Nuitka Minimal build")
        print("4. Nuitka Debug build")
        print("5. Nuitka Standalone only (No onefile)")
    print("=== PyInstaller Builds ===")
    if has_pyinstaller:
        print("6. PyInstaller Onefile (Single exe)")
        print("7. PyInstaller Directory (Faster - Creates folder)")
    print("=" * 60)

    choice = input("Enter choice: ").strip()

    success = False

    if choice == "1" and has_nuitka:
        success = build_nuitka_standalone()
    elif choice == "2" and has_nuitka:
        success = build_nuitka_quick_standalone()
    elif choice == "3" and has_nuitka:
        success = build_nuitka_minimal()
    elif choice == "4" and has_nuitka:
        success = build_nuitka_debug()
    elif choice == "5" and has_nuitka:
        success = build_nuitka_standalone_only()
    elif choice == "6" and has_pyinstaller:
        success = build_pyinstaller_onefile()
    elif choice == "7" and has_pyinstaller:
        success = build_pyinstaller_standalone()
    else:
        print("ERROR: Invalid choice or tool not available")
        return

    if success:
        print("\nBuild completed successfully!")

        # Check for different executable types based on build choice
        if choice in ["1", "3"]:  # Nuitka onefile builds
            exe_path = Path("build/drilling_dq.exe")
            if exe_path.exists():
                size = exe_path.stat().st_size
                print(f"SUCCESS: Executable: {exe_path}")
                print(f"Size: {size:,} bytes ({size/1024/1024:.1f} MB)")
                print("\nTo run the application, double-click the exe file!")
        elif choice == "2":  # Nuitka quick standalone
            exe_path = Path("build/drilling_dq_quick/drilling_dq_quick.exe")
            batch_path = Path("build/run_quick.bat")
            if exe_path.exists():
                size = exe_path.stat().st_size
                print(f"SUCCESS: Executable: {exe_path}")
                print(f"Size: {size:,} bytes ({size/1024/1024:.1f} MB)")
                print("\nTo run the application:")
                print("   Option 1: Double-click 'run_quick.bat'")
                print("   Option 2: Run the exe file directly")
        elif choice == "5":  # Nuitka standalone only
            exe_path = Path("build/drilling_dq_standalone.exe")
            if exe_path.exists():
                size = exe_path.stat().st_size
                print(f"SUCCESS: Standalone executable: {exe_path}")
                print(f"Size: {size:,} bytes ({size/1024/1024:.1f} MB)")
                print("\nTo run the application: Double-click 'run_standalone.bat'")
        elif choice == "6":  # PyInstaller onefile
            exe_path = Path("build/drilling_dq_pyinstaller.exe")
            if exe_path.exists():
                size = exe_path.stat().st_size
                print(f"SUCCESS: PyInstaller executable: {exe_path}")
                print(f"Size: {size:,} bytes ({size/1024/1024:.1f} MB)")
                print("\nTo run the application, double-click the exe file!")
        elif choice == "7":  # PyInstaller directory
            exe_path = Path("build/drilling_dq_pyinstaller_dir/launcher.exe")
            batch_path = Path("build/run_pyinstaller.bat")
            if exe_path.exists():
                size = exe_path.stat().st_size
                print(f"SUCCESS: PyInstaller executable: {exe_path}")
                print(f"Size: {size:,} bytes ({size/1024/1024:.1f} MB)")
                print("\nTo run the application:")
                print("   Option 1: Double-click 'run_pyinstaller.bat'")
                print("   Option 2: Run the exe file directly")

        print("The application will open the login page in your default browser")
    else:
        print("\nBuild failed!")
        print("Check the output above for error details")
        print("Common issues:")
        print("   - Make sure all Python dependencies are installed")
        print("   - Check that the build completes successfully")

if __name__ == "__main__":
    main()
