import os
import sys

# Vercel automatically sets VERCEL="1" in production; keep local development default
if "NOW_REGION" in os.environ:
    os.environ["VERCEL"] = "1"

# Resolve absolute path to project root and backend
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
