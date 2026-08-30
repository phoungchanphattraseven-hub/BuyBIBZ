from fastapi import APIRouter, HTTPException, Depends
from core.config import get_supabase
from core.auth import get_current_user
from models.schemas import CartItemCreate, CartItemUpdate

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.get("")
async def get_cart(current_user=Depends(get_current_user)):
    """Get the current user's cart items with product details."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        response = (
            supabase.table("cart_items")
            .select("*, products(id, name, slug, price, compare_price, image_url, stock)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        items = response.data if response.data else []
        total = sum(
            item["products"]["price"] * item["quantity"]
            for item in items
            if item.get("products")
        )

        return {
            "items": items,
            "total": round(total, 2),
            "count": len(items),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_to_cart(item: CartItemCreate, current_user=Depends(get_current_user)):
    """Add an item to the cart. If already exists, update quantity."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        # Check product exists and has stock
        product = (
            supabase.table("products")
            .select("id, stock, is_active")
            .eq("id", item.product_id)
            .maybe_single()
            .execute()
        )
        if not product.data or not product.data.get("is_active"):
            raise HTTPException(status_code=404, detail="Product not found")
        if product.data["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        # Check if item already in cart
        existing = (
            supabase.table("cart_items")
            .select("id, quantity")
            .eq("user_id", user_id)
            .eq("product_id", item.product_id)
            .execute()
        )

        if existing.data:
            new_qty = existing.data[0]["quantity"] + item.quantity
            if new_qty > product.data["stock"]:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            response = (
                supabase.table("cart_items")
                .update({"quantity": new_qty})
                .eq("id", existing.data[0]["id"])
                .execute()
            )
            return {"message": "Cart updated", "item": response.data[0] if response.data else None}
        else:
            response = (
                supabase.table("cart_items")
                .insert({
                    "user_id": user_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                })
                .execute()
            )
            return {"message": "Item added to cart", "item": response.data[0] if response.data else None}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{item_id}")
async def update_cart_item(item_id: int, item: CartItemUpdate, current_user=Depends(get_current_user)):
    """Update cart item quantity."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        response = (
            supabase.table("cart_items")
            .update({"quantity": item.quantity})
            .eq("id", item_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Cart item not found")

        return {"message": "Cart item updated", "item": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def remove_cart_item(item_id: int, current_user=Depends(get_current_user)):
    """Remove an item from the cart."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        response = (
            supabase.table("cart_items")
            .delete()
            .eq("id", item_id)
            .eq("user_id", user_id)
            .execute()
        )

        return {"message": "Item removed from cart"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def clear_cart(current_user=Depends(get_current_user)):
    """Clear all items from the user's cart."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        supabase.table("cart_items").delete().eq("user_id", user_id).execute()
        return {"message": "Cart cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
