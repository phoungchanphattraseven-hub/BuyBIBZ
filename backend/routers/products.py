import re
from fastapi import APIRouter, HTTPException, Depends, Query, Response, Body
from core.config import get_supabase, get_authenticated_client
from core.auth import get_current_user, get_admin_user
from core.taobao_ingest import ingest_taobao_product, normalize_taobao_product
from models.schemas import ProductCreate, ProductUpdate
from typing import Optional

router = APIRouter(prefix="/api/products", tags=["Products"])


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


@router.get("")
async def list_products(
    search: Optional[str] = Query(None),
    category: Optional[int] = Query(None),
    sort: Optional[str] = Query("newest"),  # newest, price_asc, price_desc, rating
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    featured: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    """List products with search, filter, and sort options."""

    try:
        supabase = get_supabase()
        query = supabase.table("products").select(
            "*, categories(name, slug, icon)"
        ).eq("is_active", True)

        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        if category:
            query = query.eq("category_id", category)
        if min_price is not None:
            query = query.gte("price", min_price)
        if max_price is not None:
            query = query.lte("price", max_price)
        if featured is not None:
            query = query.eq("is_featured", featured)

        # Sorting
        if sort == "price_asc":
            query = query.order("price", desc=False)
        elif sort == "price_desc":
            query = query.order("price", desc=True)
        elif sort == "rating":
            query = query.order("rating_avg", desc=True)
        else:  # newest
            query = query.order("created_at", desc=True)

        # Pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        response = query.execute()

        # Get total count for pagination
        count_query = supabase.table("products").select("id", count="exact").eq("is_active", True)
        if search:
            count_query = count_query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        if category:
            count_query = count_query.eq("category_id", category)
        if min_price is not None:
            count_query = count_query.gte("price", min_price)
        if max_price is not None:
            count_query = count_query.lte("price", max_price)
        if featured is not None:
            count_query = count_query.eq("is_featured", featured)

        count_response = count_query.execute()
        total = count_response.count if count_response.count else len(response.data if response and response.data else [])

        return {
            "products": response.data,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit if total > 0 else 1,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.head("/")
async def head_products():
    return Response(status_code=200)

@router.get("/{product_id}")
async def get_product(product_id: int):
    """Get a single product with its reviews and images."""
    try:
        supabase = get_supabase()
        product = (
            supabase.table("products")
            .select("*, categories(name, slug, icon)")
            .eq("id", product_id)
            .maybe_single()
            .execute()
        )

        if not product or not product.data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Get additional product images
        try:
            images = (
                supabase.table("product_images")
                .select("*")
                .eq("product_id", product_id)
                .order("display_order", desc=False)
                .execute()
            )
            product_images = images.data if images and images.data else []
            
            # If no product_images rows but image_url exists, create a synthetic entry
            # so the gallery always has at least one image
            if not product_images and product.data.get("image_url"):
                product_images = [{
                    "id": None,
                    "product_id": product_id,
                    "image_url": product.data["image_url"],
                    "alt_text": product.data.get("name", ""),
                    "display_order": 0,
                    "is_primary": True,
                }]
            
            product.data["product_images"] = product_images
        except:
            product.data["product_images"] = []

        # Get reviews for this product
        reviews = (
            supabase.table("reviews")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .execute()
        )

        # Enrich reviews with user profiles
        if reviews and reviews.data:
            for review in (reviews.data if reviews and reviews.data else []):
                try:
                    profile = (
                        supabase.table("profiles")
                        .select("full_name")
                        .eq("id", review["user_id"])
                        .maybe_single()
                        .execute()
                    )
                    review["profiles"] = profile.data if profile and profile.data else {"full_name": "Anonymous"}
                except:
                    review["profiles"] = {"full_name": "Anonymous"}

        product_data = product.data
        product_data["reviews"] = reviews.data if reviews and reviews.data else []

        return product_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_product(product: ProductCreate, admin=Depends(get_admin_user)):
    """Create a new product (admin only)."""
    try:
        supabase = get_authenticated_client(admin["token"])
        base_slug = slugify(product.name)

        # Generate a unique slug by appending a number if needed
        slug = base_slug
        counter = 1
        while True:
            existing = supabase.table("products").select("id").eq("slug", slug).execute()
            if not existing.data:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        data = product.model_dump()
        data["slug"] = slug

        response = supabase.table("products").insert(data).execute()
        return {"message": "Product created", "product": response.data[0] if response.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}")
async def update_product(product_id: int, product: ProductUpdate, admin=Depends(get_admin_user)):
    """Update a product (admin only)."""
    try:
        supabase = get_authenticated_client(admin["token"])
        data = product.model_dump(exclude_none=True)

        if "name" in data:
            base_slug = slugify(data["name"])
            slug = base_slug
            counter = 1
            while True:
                existing = supabase.table("products").select("id").eq("slug", slug).execute()
                # Allow the slug if no conflict, or if it belongs to this same product
                if not existing.data or existing.data[0]["id"] == product_id:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            data["slug"] = slug

        response = (
            supabase.table("products")
            .update(data)
            .eq("id", product_id)
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Product not found")

        return {"message": "Product updated", "product": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(product_id: int, admin=Depends(get_admin_user)):
    """Delete a product (admin only)."""
    try:
        supabase = get_authenticated_client(admin["token"])
        response = (
            supabase.table("products")
            .delete()
            .eq("id", product_id)
            .execute()
        )
        return {"message": "Product deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Taobao Import Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/import-taobao/preview")
async def preview_taobao_product(
    payload: dict = Body(..., example={"item": "https://item.taobao.com/item.htm?id=1003783113480"}),
    admin=Depends(get_admin_user),
):
    """
    Fetch a Taobao product via Apify, run it through the normalisation pipeline,
    and return the structured result WITHOUT saving to the database.

    Use this to preview / verify before committing.
    Body: { "item": "<taobao_url_or_item_id>" }
    """
    item = (payload or {}).get("item", "").strip()
    if not item:
        raise HTTPException(status_code=422, detail="'item' field is required (Taobao URL or item ID).")

    try:
        result = await ingest_taobao_product(item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Apify fetch error: {str(e)}")

    if result.get("status") == "rejected":
        raise HTTPException(status_code=422, detail=result.get("reason", "Product rejected by category filter."))

    return result


@router.post("/import-taobao")
async def import_taobao_product(
    payload: dict = Body(..., example={"item": "https://item.taobao.com/item.htm?id=1003783113480", "category_id": None}),
    admin=Depends(get_admin_user),
):
    """
    Fetch a Taobao product via Apify, normalise it, and insert it into the database.

    Body:
      - item (required): Taobao product URL or numeric item ID
      - category_id (optional): Override the auto-detected category with a DB category ID

    Returns the created product row.
    """
    item = (payload or {}).get("item", "").strip()
    if not item:
        raise HTTPException(status_code=422, detail="'item' field is required (Taobao URL or item ID).")

    category_id_override = (payload or {}).get("category_id")

    # ── 1. Fetch & normalise ──────────────────────────────────────────────────
    try:
        result = await ingest_taobao_product(item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Apify fetch error: {str(e)}")

    if result.get("status") == "rejected":
        raise HTTPException(status_code=422, detail=result.get("reason", "Product rejected by category filter."))

    pc = result["data"]["_product_create"]

    # ── 2. Resolve category_id ────────────────────────────────────────────────
    supabase = get_authenticated_client(admin["token"])
    resolved_category_id = category_id_override

    if not resolved_category_id:
        detected_category_name = result["data"]["category"]
        try:
            cat_resp = (
                supabase.table("categories")
                .select("id")
                .ilike("name", f"%{detected_category_name.split()[0]}%")
                .limit(1)
                .execute()
            )
            if cat_resp.data:
                resolved_category_id = cat_resp.data[0]["id"]
        except Exception:
            pass  # category_id stays None — product still saves without a category

    pc["category_id"] = resolved_category_id

    # ── 3. Generate unique slug ───────────────────────────────────────────────
    base_slug = slugify(pc["name"])
    slug = base_slug
    counter = 1
    while True:
        existing = supabase.table("products").select("id").eq("slug", slug).execute()
        if not existing.data:
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    pc["slug"] = slug

    # ── 4. Insert product ─────────────────────────────────────────────────────
    try:
        insert_resp = supabase.table("products").insert(pc).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=500, detail="Database insert returned no data.")
        product_row = insert_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert error: {str(e)}")

    # ── 5. Save product images ────────────────────────────────────────────────
    product_id = product_row["id"]
    image_rows = [
        {
            "product_id": product_id,
            "image_url": url,
            "alt_text": pc["name"],
            "display_order": idx,
            "is_primary": idx == 0,
        }
        for idx, url in enumerate(pc.get("images") or [])
        if url
    ]
    if image_rows:
        try:
            supabase.table("product_images").insert(image_rows).execute()
        except Exception:
            pass  # non-fatal — product already created

    return {
        "message": "Product imported from Taobao successfully.",
        "product": product_row,
        "images_saved": len(image_rows),
        "normalized": result["data"],
    }


@router.post("/{product_id}/images")
async def save_product_images(product_id: int, payload: dict, admin=Depends(get_admin_user)):
    """Replace all images for a product (admin only)."""
    try:
        supabase = get_authenticated_client(admin["token"])

        # Delete existing images for this product
        supabase.table("product_images").delete().eq("product_id", product_id).execute()

        images = payload.get("images", [])
        if not images:
            return {"message": "Images cleared"}

        rows = [
            {
                "product_id": product_id,
                "image_url": img["url"],
                "alt_text": img.get("alt", ""),
                "display_order": img.get("display_order", i),
                "is_primary": img.get("is_primary", i == 0),
            }
            for i, img in enumerate(images)
            if img.get("url")
        ]

        if rows:
            supabase.table("product_images").insert(rows).execute()

        return {"message": f"{len(rows)} image(s) saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
