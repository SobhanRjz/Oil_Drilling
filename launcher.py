#!/usr/bin/env python3
"""
Drilling Data Quality Desktop Application Launcher

This script starts the FastAPI backend server and opens the login page
in the default web browser.
"""

import sys
import os
import time
import webbrowser
import logging
import threading
import uvicorn
from pathlib import Path
from datetime import datetime

class ApplicationLogger:
    """Handles logging for the application."""

    def __init__(self):
        self.log_file = self._get_log_path()
        self._setup_logging()

    def _get_log_path(self) -> Path:
        """Get the log file path."""
        if getattr(sys, 'frozen', False):
            base_dir = Path(sys.executable).parent
        else:
            base_dir = Path(__file__).parent

        return base_dir / "drilling_dq_log.txt"

    def _setup_logging(self):
        """Setup logging configuration."""
        self.logger = logging.getLogger('drilling-dq')
        self.logger.setLevel(logging.INFO)

        # Console handler only (simplified for desktop app)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(console_formatter)

        self.logger.addHandler(console_handler)

def find_available_port(start_port=8000, max_attempts=10):
    """Find an available port starting from start_port."""
    import socket

    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue

    raise RuntimeError(f"No available ports found between {start_port} and {start_port + max_attempts - 1}")

def main():
    """Launch the FastAPI application server and open browser."""
    logger = ApplicationLogger()
    log = logger.logger

    try:
        log.info("=" * 60)
        log.info("Drilling Data Quality Desktop Application")
        log.info("=" * 60)

        # Get the application directory
        if getattr(sys, 'frozen', False):
            # Running as compiled executable
            app_dir = Path(sys.executable).parent
            log.info(f"📁 Running from executable: {app_dir}")
            # Add the executable directory to Python path for bundled files
            sys.path.insert(0, str(app_dir))
        else:
            # Running as script
            app_dir = Path(__file__).parent
            log.info(f"📁 Running from script: {app_dir}")

        # Find available port
        try:
            port = find_available_port(8000)
            log.info(f"Using port: {port}")
        except RuntimeError as e:
            log.error(f"ERROR: {e}")
            input("Press Enter to exit...")
            return

        # Import the FastAPI app after setting up paths
        try:
            from backend.main import app
            log.info("SUCCESS: FastAPI app imported successfully")
        except ImportError as e:
            log.error(f"ERROR: Failed to import FastAPI app: {e}")
            log.error("Make sure backend/main.py exists and is properly configured")
            input("Press Enter to exit...")
            return

        server_url = f"http://127.0.0.1:{port}/login"
        log.info(f"Server will start at: http://127.0.0.1:{port}")
        log.info("Opening login page in browser...")
        log.info("Press Ctrl+C to stop the server")

        # Open browser after a short delay
        def open_browser():
            try:
                time.sleep(2)  # Give server time to start
                log.info("Launching browser...")
                webbrowser.open(server_url)
            except Exception as e:
                log.error(f"ERROR: Failed to open browser: {e}")

        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()

        # Start the FastAPI server with uvicorn
        try:
            log.info("Starting FastAPI server...")
            uvicorn.run(
                app,
                host="127.0.0.1",
                port=port,
                log_level="info",
                access_log=False  # Disable access logs for cleaner output
            )
        except KeyboardInterrupt:
            log.info("Server stopped by user")
        except Exception as e:
            log.error(f"ERROR: Server Error: {e}")
            log.error("Try running as administrator or use a different port")
            input("Press Enter to exit...")

    except Exception as e:
        log.error(f"ERROR: Unexpected Error: {e}")
        import traceback
        log.error(traceback.format_exc())
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
