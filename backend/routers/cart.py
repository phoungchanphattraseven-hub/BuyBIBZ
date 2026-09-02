from fastapi import APIRouter, HTTPException, Depends
from core.config import get_supabase
from core.auth import get_current_user
from models.schemas import CartItemCreate, CartItemUpdate

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def _effective_price(item: dict) -> float:
    """Return the price to use for this cart item.
    unit_price (variant override) takes precedence over product.price."""
    unit_price = item.get("unit_price")
    if unit_price is not None:
        try:
            return float(unit_price)
        except (TypeError, ValueError):
            pass
    product = item.get("products") or {}
    return float(product.get("price", 0))


@router.get("")
async def get_cart(current_user=Depends(get_current_user)):
    """Get the current user's cart items with product details."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        response = (
            supabase.table("cart_items")
            .select("*, products(id, name, slug, price, compare_price, image_url, stock, attributes)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        items = response.data if response and response.data else []

        # Use unit_price (variant) if set, otherwise fall back to product.price
        subtotal = sum(
            _effective_price(item) * item["quantity"]
            for item in items
            if item.get("products")
        )

        # Shipping: $2.25 standard fee, waived only if every item has free_shipping
        all_free_shipping = all(
            item["products"].get("attributes", {}).get("free_shipping") is True
            for item in items
            if item.get("products")
        )
        shipping_fee = 0.0 if (not items or all_free_shipping) else 2.25
        total = round(subtotal + shipping_fee, 2)

        return {
            "items": items,
            "subtotal": round(subtotal, 2),
            "shipping": shipping_fee,
            "total": total,
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
            .select("id, price, stock, is_active")
            .eq("id", item.product_id)
            .maybe_single()
            .execute()
        )
        if not product or not product.data or not product.data.get("is_active"):
            raise HTTPException(status_code=404, detail="Product not found")
        if product.data["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        # Resolve the effective price: use variant price if provided, else product price
        effective_price = round(float(item.unit_price), 2) if item.unit_price is not None else None

        # Strip display-only metadata (_selected_image) before comparing variants
        selected_options = dict(item.selected_options or {})
        selected_image = selected_options.pop("_selected_image", None)

        existing = (
            supabase.table("cart_items")
            .select("id, quantity, selected_options, unit_price")
            .eq("user_id", user_id)
            .eq("product_id", item.product_id)
            .execute()
        )

        def options_match(cart_opts: dict, incoming_opts: dict) -> bool:
            a = {k: v for k, v in (cart_opts or {}).items() if k != "_selected_image"}
            b = {k: v for k, v in (incoming_opts or {}).items() if k != "_selected_image"}
            return a == b

        matching_item = next(
            (
                cart_item
                for cart_item in (existing.data if existing and existing.data else [])
                if options_match(cart_item.get("selected_options") or {}, selected_options)
            ),
            None,
        )

        if matching_item:
            new_qty = matching_item["quantity"] + item.quantity
            if new_qty > product.data["stock"]:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            merged_options = {
                **{k: v for k, v in (matching_item.get("selected_options") or {}).items() if k != "_selected_image"},
                **selected_options,
            }
            if selected_image:
                merged_options["_selected_image"] = selected_image
            update_data = {"quantity": new_qty, "selected_options": merged_options}
            # Update price if a variant price is provided
            if effective_price is not None:
                update_data["unit_price"] = effective_price
            response = (
                supabase.table("cart_items")
                .update(update_data)
                .eq("id", matching_item["id"])
                .execute()
            )
            return {"message": "Cart updated", "item": response.data[0] if response.data else None}
        else:
            if selected_image:
                selected_options["_selected_image"] = selected_image
            insert_data = {
                "user_id": user_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "selected_options": selected_options,
            }
            if effective_price is not None:
                insert_data["unit_price"] = effective_price
            response = (
                supabase.table("cart_items")
                .insert(insert_data)
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

        if not response or not response.data:
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

        supabase.table("cart_items").delete().eq("id", item_id).eq("user_id", user_id).execute()
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
