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
        # Build user response with backward compatibility for new fields
        user_data = {
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
        
        # Add Cambodia-specific address fields if they exist in the profile
        if profile.data:
            cambodia_fields = ["province", "province_code", "district", "district_code", 
                             "commune", "commune_code", "village"]
            for field in cambodia_fields:
                if field in profile.data:
                    user_data[field] = profile.data.get(field, "")
        
        return {"user": user_data}
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

        # Try to update profile, handle case where Cambodia columns don't exist yet
        try:
            response = (
                supabase.table("profiles")
                .update(update_payload)
                .eq("id", str(user.id))
                .execute()
            )
        except Exception as update_error:
            # If error mentions missing columns, remove Cambodia fields and retry
            error_str = str(update_error).lower()
            if any(col in error_str for col in ['province', 'district', 'commune', 'village']):
                cambodia_fields = ["province", "province_code", "district", "district_code", 
                                  "commune", "commune_code", "village"]
                for field in cambodia_fields:
                    update_payload.pop(field, None)
                response = (
                    supabase.table("profiles")
                    .update(update_payload)
                    .eq("id", str(user.id))
                    .execute()
                )
            else:
                raise update_error
        
        if not response or not response.data:
            raise HTTPException(status_code=400, detail="Profile update failed")
            
        return {"message": "Profile updated successfully", "profile": response.data[0]}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/stats", tags=["Public Stats"])
async def get_public_stats():
    """Get real-time store statistics from database."""
    try:
        supabase = get_supabase()
        prods = supabase.table("products").select("id", count="exact").execute()
        cats = supabase.table("categories").select("id", count="exact").execute()
        orders = supabase.table("orders").select("id", count="exact").execute()
        profiles = supabase.table("profiles").select("id", count="exact").execute()
        
        return {
            "products": prods.count or 0,
            "categories": cats.count or 0,
            "orders": orders.count or 0,
            "customers": profiles.count or 0,
            "provinces": 25,
            "support": "24/7"
        }
    except Exception as e:
        return {
            "products": 0,
            "categories": 0,
            "orders": 0,
            "customers": 0,
            "provinces": 25,
            "support": "24/7"
        }


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
