# core package

# ============================================================
# SSL FIX: Disable certificate verification (development only)
# THIS MUST RUN BEFORE ANY OTHER IMPORTS
# ============================================================
import os
import ssl
import warnings

# Method 1: Global SSL context
ssl._create_default_https_context = ssl._create_unverified_context

# Method 2: Environment variables
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

# Method 3: Suppress warnings
warnings.filterwarnings('ignore')

# Method 4: Patch httpx (Supabase uses this internally)
try:
    import httpx
    
    # Store original classes
    _original_httpx_client = httpx.Client
    _original_httpx_async_client = httpx.AsyncClient
    
    # Create patched versions that always disable SSL verification
    class PatchedClient(httpx.Client):
        def __init__(self, *args, **kwargs):
            kwargs['verify'] = False
            super().__init__(*args, **kwargs)
    
    class PatchedAsyncClient(httpx.AsyncClient):
        def __init__(self, *args, **kwargs):
            kwargs['verify'] = False
            super().__init__(*args, **kwargs)
    
    # Replace the classes globally
    httpx.Client = PatchedClient
    httpx.AsyncClient = PatchedAsyncClient
except ImportError:
    pass  # httpx not installed
except Exception:
    pass  # Failed to patch, continue anyway

# Method 5: urllib3 warnings
try:
    import urllib3
    urllib3.disable_warnings()
except:
    pass
