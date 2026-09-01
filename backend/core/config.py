import os
import ssl
import warnings
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================
# SSL CERTIFICATE FIX FOR WINDOWS (DEVELOPMENT ONLY)
# ============================================================

# Method 1: Disable SSL verification globally
ssl._create_default_https_context = ssl._create_unverified_context

# Method 2: Set environment variables to disable SSL verification
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

# Method 3: Suppress SSL warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
warnings.filterwarnings('ignore', category=Warning)

try:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except ImportError:
    pass

# Method 4: Patch httpx if it's being used
try:
    import httpx
    # Monkey patch httpx to disable SSL verification
    original_client = httpx.Client
    def patched_client(*args, **kwargs):
        kwargs['verify'] = False
        return original_client(*args, **kwargs)
    httpx.Client = patched_client
except ImportError:
    pass

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")

# Singleton Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_supabase() -> Client:
    """Return the Supabase client instance."""
    return supabase


def get_authenticated_client(access_token: str) -> Client:
    """Create a Supabase client authenticated with a user's JWT.
    This ensures RLS policies are evaluated against the correct user."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)
    return client
