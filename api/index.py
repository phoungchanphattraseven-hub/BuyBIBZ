import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from main import app
from mangum import Mangum

# Create handler - Vercel routes /api/* to this function
# FastAPI routes already have /api prefix, so we need to handle the full path
handler = Mangum(app, lifespan="off")
