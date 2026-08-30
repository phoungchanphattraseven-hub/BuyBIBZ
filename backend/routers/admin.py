from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta, timezone
from core.config import get_authenticated_client
from core.auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_dashboard(admin=Depends(get_admin_user)):
    """Get admin dashboard statistics."""
    try:
        supabase = get_authenticated_client(admin["token"])

        # Total products
        products = supabase.table("products").select("id", count="exact").execute()
        total_products = products.count if products.count else 0

        # Total orders & revenue
        orders = supabase.table("orders").select("id, total, status, created_at", count="exact").execute()
        total_orders = orders.count if orders.count else 0
        order_data = orders.data or []
        total_revenue = sum(
            float(o.get("total", 0)) for o in order_data
            if o.get("status") != "cancelled"
        )

        # Overview analytics: daily revenue for the last seven UTC calendar
        # days and a current status distribution.  Keeping aggregation here
        # avoids introducing an extra client-side dependency.
        today = datetime.now(timezone.utc).date()
        dates = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
        revenue_by_date = {day: 0.0 for day in dates}
        status_breakdown = {status: 0 for status in ("pending", "processing", "shipped", "delivered", "cancelled")}
        for order in order_data:
            status = order.get("status", "pending")
            if status in status_breakdown:
                status_breakdown[status] += 1
            try:
                order_date = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00")).date()
                if order_date in revenue_by_date and status != "cancelled":
                    revenue_by_date[order_date] += float(order.get("total", 0))
            except (KeyError, TypeError, ValueError):
                continue

        daily_revenue = [
            {"label": day.strftime("%b %d"), "revenue": round(revenue_by_date[day], 2)}
            for day in dates
        ]

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
        recent_orders = recent.data if recent and recent.data else []
        for order in recent_orders:
            try:
                profile = (
                    supabase.table("profiles")
                    .select("full_name")
                    .eq("id", order["user_id"])
                    .maybe_single()
                    .execute()
                )
                order["profiles"] = profile.data if profile and profile.data else {"full_name": "Unknown"}
            except:
                order["profiles"] = {"full_name": "Unknown"}

        return {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "total_customers": total_customers,
            "recent_orders": recent_orders,
            "analytics": {
                "daily_revenue": daily_revenue,
                "status_breakdown": status_breakdown,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders")
async def get_all_orders(admin=Depends(get_admin_user)):
    """Get all orders (admin view)."""
    try:
        supabase = get_authenticated_client(admin["token"])
        response = (
            supabase.table("orders")
            .select("*, order_items(*)")
            .order("created_at", desc=True)
            .execute()
        )
        
        # Enrich orders with profiles
        orders = response.data if response and response.data else []
        for order in orders:
            try:
                profile = (
                    supabase.table("profiles")
                    .select("full_name")
                    .eq("id", order["user_id"])
                    .maybe_single()
                    .execute()
                )
                order["profiles"] = profile.data if profile and profile.data else {"full_name": "Unknown"}
            except:
                order["profiles"] = {"full_name": "Unknown"}
        
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products")
async def get_all_products(admin=Depends(get_admin_user)):
    """Get all products including inactive ones (admin view)."""
    try:
        supabase = get_authenticated_client(admin["token"])
        response = (
            supabase.table("products")
            .select("*, categories(name)")
            .order("created_at", desc=True)
            .execute()
        )
        return {"products": response.data if response and response.data else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
