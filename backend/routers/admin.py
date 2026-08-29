from fastapi import APIRouter, HTTPException, Depends
from core.config import get_supabase
from core.auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_dashboard(admin=Depends(get_admin_user)):
    """Get admin dashboard statistics."""
    try:
        supabase = get_supabase()

        # Total products
        products = supabase.table("products").select("id", count="exact").execute()
        total_products = products.count if products.count else 0

        # Total orders & revenue
        orders = supabase.table("orders").select("id, total, status", count="exact").execute()
        total_orders = orders.count if orders.count else 0
        total_revenue = sum(
            float(o.get("total", 0)) for o in (orders.data or [])
            if o.get("status") != "cancelled"
        )

        # Total customers
        customers = (
            supabase.table("profiles")
            .select("id", count="exact")
            .eq("role", "customer")
            .execute()
        )
        total_customers = customers.count if customers.count else 0

        # Recent orders
        recent = (
            supabase.table("orders")
            .select("*")
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        
        # Enrich with profiles
        recent_orders = recent.data if recent.data else []
        for order in recent_orders:
            try:
                profile = (
                    supabase.table("profiles")
                    .select("full_name")
                    .eq("id", order["user_id"])
                    .single()
                    .execute()
                )
                order["profiles"] = profile.data if profile.data else {"full_name": "Unknown"}
            except:
                order["profiles"] = {"full_name": "Unknown"}

        return {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "total_customers": total_customers,
            "recent_orders": recent_orders,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders")
async def get_all_orders(admin=Depends(get_admin_user)):
    """Get all orders (admin view)."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("orders")
            .select("*, order_items(*)")
            .order("created_at", desc=True)
            .execute()
        )
        
        # Enrich orders with profiles
        orders = response.data if response.data else []
        for order in orders:
            try:
                profile = (
                    supabase.table("profiles")
                    .select("full_name")
                    .eq("id", order["user_id"])
                    .single()
                    .execute()
                )
                order["profiles"] = profile.data if profile.data else {"full_name": "Unknown"}
            except:
                order["profiles"] = {"full_name": "Unknown"}
        
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products")
async def get_all_products(admin=Depends(get_admin_user)):
    """Get all products including inactive ones (admin view)."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("products")
            .select("*, categories(name)")
            .order("created_at", desc=True)
            .execute()
        )
        return {"products": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
