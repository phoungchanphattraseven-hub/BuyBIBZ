from fastapi import APIRouter, HTTPException, status
from core.config import get_supabase
from models.schemas import UserRegister, UserLogin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
async def register(user: UserRegister):
    """Register a new user with Supabase Auth."""
    try:
        supabase = get_supabase()
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "full_name": user.full_name,
                }
            }
        })

        if response.user:
            return {
                "message": "Registration successful",
                "user": {
                    "id": str(response.user.id),
                    "email": response.user.email,
                },
                "session": {
                    "access_token": response.session.access_token if response.session else None,
                    "refresh_token": response.session.refresh_token if response.session else None,
                } if response.session else None
            }
        raise HTTPException(status_code=400, detail="Registration failed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(user: UserLogin):
    """Sign in a user and return JWT tokens."""
    try:
        supabase = get_supabase()
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password,
        })

        if response.user and response.session:
            # Get user profile for role info
            profile = (
                supabase.table("profiles")
                .select("*")
                .eq("id", str(response.user.id))
                .maybe_single()
                .execute()
            )

            return {
                "message": "Login successful",
                "user": {
                    "id": str(response.user.id),
                    "email": response.user.email,
                    "full_name": profile.data.get("full_name", "") if profile and profile.data else "",
                    "role": profile.data.get("role", "customer") if profile and profile.data else "customer",
                },
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                }
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))





@router.post("/logout")
async def logout():
    """Sign out the current user."""
    try:
        supabase = get_supabase()
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
