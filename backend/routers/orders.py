from fastapi import APIRouter, HTTPException, Depends
from uuid import uuid4
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
            .select("*, products(id, name, price, image_url, stock, attributes)")
            .eq("user_id", user_id)
            .execute()
        )

        if not cart or not cart.data:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # 2. Validate stock availability
        order_items_data = []
        subtotal = 0
        all_free_shipping = True
        for item in (cart.data if cart and cart.data else []):
            # `cart_items.product_id` is the authoritative relation key. Do
            # not rely on the embedded product response for it: some joined
            # responses can omit the embedded `products.id`, which previously
            # created an order item with a NULL product_id.
            product_id = item.get("product_id")
            product = item.get("products")

            if (
                not isinstance(product_id, int)
                or product_id <= 0
                or not isinstance(product, dict)
            ):
                raise HTTPException(
                    status_code=409,
                    detail="A cart item is no longer available. Remove it from your cart and try again.",
                )

            if product["stock"] < item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product['name']}",
                )
            # Check if this product breaks the free-shipping rule
            if not (product.get("attributes") or {}).get("free_shipping"):
                all_free_shipping = False
            # Use unit_price (variant override) if stored, else product base price
            unit_price = item.get("unit_price")
            effective_price = round(float(unit_price), 2) if unit_price is not None else round(float(product["price"]), 2)
            item_subtotal = round(effective_price * item["quantity"], 2)
            subtotal += item_subtotal
            order_items_data.append({
                "product_id": product_id,
                "product_name": product["name"],
                "product_image": product.get("image_url"),
                "price": effective_price,
                "quantity": item["quantity"],
                "subtotal": item_subtotal,
                "selected_options": item.get("selected_options") or {},
            })

        shipping_fee = 0.0 if all_free_shipping else 2.25
        total = round(subtotal + shipping_fee, 2)

        # 3. Create the order
        order_response = (
            supabase.table("orders")
            .insert({
                "user_id": user_id,
                "order_uid": str(uuid4()),
                "total": total,
                "shipping_fee": shipping_fee,
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

        if not order_response or not order_response.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        order_id = order_response.data[0]["id"]

        # 4. Create order items
        for item_data in order_items_data:
            item_data["order_id"] = order_id

        supabase.table("order_items").insert(order_items_data).execute()

        # 5. Update product stock
        for item in (cart.data if cart and cart.data else []):
            product = item["products"]
            if product:
                new_stock = product["stock"] - item["quantity"]
                supabase.table("products").update(
                    {"stock": new_stock}
                ).eq("id", item["product_id"]).execute()

        # 6. Clear the cart
        supabase.table("cart_items").delete().eq("user_id", user_id).execute()

        return {
            "message": "Order placed successfully",
            "order": order_response.data[0],
            "order_id": order_id,
            "order_uid": order_response.data[0]["order_uid"],
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
            .select("*, order_items(*)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        # Keep the API boundary user-scoped even if a database policy is changed
        # accidentally.  A customer must never receive another customer's order.
        orders = response.data if response and response.data else []
        own_orders = [order for order in orders if order.get("user_id") == user_id]
        return {"orders": own_orders}
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

        if not response or not response.data:
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
        # Use the verified admin's token so Supabase RLS evaluates this request as
        # that admin, rather than as the anonymous application client.
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(admin["token"])

        response = (
            supabase.table("orders")
            .update({"status": status_update.status})
            .eq("id", order_id)
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"message": "Order status updated", "order": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
