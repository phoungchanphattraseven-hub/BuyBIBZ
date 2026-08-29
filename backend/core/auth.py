from fastapi import Depends, HTTPException, status, Request
from core.config import get_supabase


async def get_current_user(request: Request):
    """Extract and verify the JWT token from the Authorization header.
    Returns the authenticated user data from Supabase."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = auth_header.split(" ")[1]
    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return {"user": user_response.user, "token": token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify the current user has admin role."""
    supabase = get_supabase()
    profile = (
        supabase.table("profiles")
        .select("role")
        .eq("id", str(current_user["user"].id))
        .single()
        .execute()
    )
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
