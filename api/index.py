import sys
import os
from pathlib import Path
import traceback

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from main import app
    from mangum import Mangum
    
    # Create handler
    handler = Mangum(app, lifespan="off")
    
except Exception as e:
    # Fallback handler for debugging
    from http.server import BaseHTTPRequestHandler
    import json
    
    class handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_info = {
                "error": str(e),
                "traceback": traceback.format_exc(),
                "path": str(backend_path),
                "python_path": sys.path
            }
            
            self.wfile.write(json.dumps(error_info).encode())
            return
