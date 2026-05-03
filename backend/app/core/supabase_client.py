from functools import lru_cache

from postgrest import SyncPostgrestClient

from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> SyncPostgrestClient:
    """
    Returns a singleton PostgREST client using the service_role key.
    Uses postgrest-py directly to avoid supabase-py's JWT key validation,
    which rejects the new Supabase sb_secret_... key format.
    The .table() API is identical to the supabase client.
    """
    url = f"{settings.supabase_url}/rest/v1"
    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Prefer": "return=representation",
    }
    return SyncPostgrestClient(url, headers=headers)
