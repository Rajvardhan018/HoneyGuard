import os
import sys
import time
import subprocess
import webbrowser

def main():
    print("=" * 70)
    print("HONEYGUARD CYBER INTELLIGENCE PLATFORM")
    print("Detect. Deceive. Analyze. Respond.")
    print("=" * 70)

    root_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    env = os.environ.copy()
    env["PYTHONPATH"] = f"{backend_dir}{os.pathsep}{root_dir}"

    print("\n[1/3] Starting HoneyGuard Backend & Honeypot Sensors (:8000, :2222, :8080)...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=root_dir,
        env=env
    )

    print("[2/3] Starting HoneyGuard Frontend...")
    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True
    )

    time.sleep(3)
    print("\n[3/3] Opening HoneyGuard in your browser...")
    webbrowser.open("http://localhost:5173")

    print("\n" + "=" * 70)
    print("HONEYGUARD IS NOW RUNNING!")
    print("• Frontend (Vite):      http://localhost:5173")
    print("• Unified Full-Stack:   http://localhost:8000")
    print("• Interactive API Docs: http://localhost:8000/docs")
    print("• Isolated SSH Sensor:  127.0.0.1:2222")
    print("• Isolated HTTP Sensor: 127.0.0.1:8080")
    print("=" * 70)
    print("Press Ctrl+C to shut down all services.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down HoneyGuard services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("HoneyGuard stopped.")

if __name__ == "__main__":
    main()
