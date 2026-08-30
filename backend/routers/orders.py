from fastapi import APIRouter, HTTPException, Depends
from core.config import get_supabase
from core.auth import get_current_user, get_admin_user
from models.schemas import OrderCreate, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("")
async def create_order(order: OrderCreate, current_user=Depends(get_current_user)):
    """Place a new order from the user's cart."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        # 1. Get cart items with product details
        cart = (
            supabase.table("cart_items")
            .select("*, products(id, name, price, image_url, stock)")
            .eq("user_id", user_id)
            .execute()
        )

        if not cart.data:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # 2. Validate stock availability
        order_items_data = []
        total = 0
        for item in cart.data:
            product = item["products"]
            if not product:
                continue
            if product["stock"] < item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product['name']}",
                )
            subtotal = round(product["price"] * item["quantity"], 2)
            total += subtotal
            order_items_data.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "product_image": product.get("image_url"),
                "price": product["price"],
                "quantity": item["quantity"],
                "subtotal": subtotal,
            })

        # 3. Create the order
        order_response = (
            supabase.table("orders")
            .insert({
                "user_id": user_id,
                "total": round(total, 2),
                "shipping_name": order.shipping_name,
                "shipping_address": order.shipping_address,
                "shipping_city": order.shipping_city,
                "shipping_postal": order.shipping_postal,
                "shipping_phone": order.shipping_phone,
                "notes": order.notes,
                "status": "pending",
            })
            .execute()
        )

        if not order_response.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        order_id = order_response.data[0]["id"]

        # 4. Create order items
        for item_data in order_items_data:
            item_data["order_id"] = order_id

        supabase.table("order_items").insert(order_items_data).execute()

        # 5. Update product stock
        for item in cart.data:
            product = item["products"]
            if product:
                new_stock = product["stock"] - item["quantity"]
                supabase.table("products").update(
                    {"stock": new_stock}
                ).eq("id", product["id"]).execute()

        # 6. Clear the cart
        supabase.table("cart_items").delete().eq("user_id", user_id).execute()

        return {
            "message": "Order placed successfully",
            "order": order_response.data[0],
            "order_id": order_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_orders(current_user=Depends(get_current_user)):
    """Get the current user's order history."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        response = (
            supabase.table("orders")
            .select("*, order_items(*, products(name, image_url))")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {"orders": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_id}")
async def get_order(order_id: int, current_user=Depends(get_current_user)):
    """Get details of a specific order."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        response = (
            supabase.table("orders")
            .select("*, order_items(*)")
            .eq("id", order_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    admin=Depends(get_admin_user),
):
    """Update order status (admin only)."""
    try:
        supabase = get_supabase()

        response = (
            supabase.table("orders")
            .update({"status": status_update.status})
            .eq("id", order_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"message": "Order status updated", "order": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
