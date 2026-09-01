import sys
import asyncio

# Windows fix: use ProactorEventLoop for proper async subprocess support
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.auth import get_current_user
from core.config import get_supabase
from models.schemas import ProfileUpdate
from routers import auth, products, categories, cart, orders, reviews, admin

app = FastAPI(
    title="BuyBIBZ API",
    description="E-Commerce API for BuyBIBZ platform",
    version="1.0.0",
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(admin.router)


# Auth /me endpoint (needs to be here to use Depends properly)
@app.get("/api/auth/me", tags=["Authentication"])
async def get_current_user_profile(current_user=Depends(get_current_user)):
    """Get current authenticated user's profile."""
    try:
        supabase = get_supabase()
        user = current_user["user"]
        profile = (
            supabase.table("profiles")
            .select("*")
            .eq("id", str(user.id))
            .maybe_single()
            .execute()
        )
        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": profile.data.get("full_name", "") if profile.data else "",
                "phone": profile.data.get("phone", "") if profile.data else "",
                "avatar_url": profile.data.get("avatar_url", "") if profile.data else "",
                "address": profile.data.get("address", "") if profile.data else "",
                "city": profile.data.get("city", "") if profile.data else "",
                "postal_code": profile.data.get("postal_code", "") if profile.data else "",
                "role": profile.data.get("role", "customer") if profile.data else "customer",
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"user": {"id": str(user.id), "email": user.email, "role": "customer"}}


@app.put("/api/auth/me", tags=["Authentication"])
async def update_current_user_profile(
    profile_data: ProfileUpdate,
    current_user=Depends(get_current_user)
):
    """Update current authenticated user's profile."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user = current_user["user"]
        
        # Build update payload (only include non-None fields)
        update_payload = profile_data.dict(exclude_unset=True)
        if not update_payload:
            return {"message": "No fields to update"}
            
        update_payload["updated_at"] = "now()"

        response = (
            supabase.table("profiles")
            .update(update_payload)
            .eq("id", str(user.id))
            .execute()
        )
        
        if not response or not response.data:
            raise HTTPException(status_code=400, detail="Profile update failed")
            
        return {"message": "Profile updated successfully", "profile": response.data[0]}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "BuyBIBZ API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Root"])
async def health():
    return {"status": "healthy"}
