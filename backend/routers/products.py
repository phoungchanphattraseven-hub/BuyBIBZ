import re
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Query, Response, Body
from core.config import get_supabase, get_authenticated_client
from core.auth import get_current_user, get_admin_user
from models.schemas import ProductCreate, ProductUpdate
from typing import Optional, List

router = APIRouter(prefix="/api/products", tags=["Products"])


def _match_category(detected: str, local_cats: list) -> int | None:
    """
    Map a CJ category path string to the best matching local category id.
    Uses a keyword alias table first, then falls back to word-overlap scoring.
    
    CJ category paths look like:
      "Consumer Electronics / Phone & Accessories / Cases"
      "Women's Clothing / Tops & Sets / Hoodies & Sweatshirts"
      "Home & Garden, Furniture / Bedroom Furniture / Beds"
      "Sports & Entertainment / Fitness Equipment / Yoga"
    """
    if not detected or not local_cats:
        return None

    # Build a lookup: local_name.lower() → id
    cat_by_name = {c["name"].lower(): c["id"] for c in local_cats}

    # ── Static alias map: CJ fragment keywords → your local category names ──
    # Keys are lowercased substrings that may appear anywhere in the CJ path.
    # List your actual category names exactly as stored in the DB.
    ALIAS: list[tuple[str, str]] = [
        # Electronics
        ("electronics",        "Electronics"),
        ("phone",              "Electronics"),
        ("computer",          "Electronics"),
        ("camera",             "Electronics"),
        ("audio",              "Electronics"),
        ("gadget",             "Electronics"),
        ("tablet",             "Electronics"),
        ("laptop",             "Electronics"),
        ("smart watch",        "Electronics"),
        ("smartwatch",         "Electronics"),
        ("television",         "Electronics"),
        ("headphone",          "Electronics"),
        ("earphone",           "Electronics"),
        ("speaker",            "Electronics"),
        ("game",               "Electronics"),
        ("gaming",             "Electronics"),
        # Fashion / Clothing
        ("clothing",           "Fashion"),
        ("fashion",            "Fashion"),
        ("apparel",            "Fashion"),
        ("shoes",              "Fashion"),
        ("footwear",           "Fashion"),
        ("bags",               "Fashion"),
        ("accessories",        "Fashion"),
        ("jewelry",            "Fashion"),
        ("watches",            "Fashion"),
        ("sunglasses",         "Fashion"),
        ("wallet",             "Fashion"),
        ("handbag",            "Fashion"),
        ("backpack",           "Fashion"),
        # Home & Living
        ("home",               "Home & Living"),
        ("garden",             "Home & Living"),
        ("furniture",          "Home & Living"),
        ("kitchen",            "Home & Living"),
        ("bedroom",            "Home & Living"),
        ("bathroom",           "Home & Living"),
        ("living room",        "Home & Living"),
        ("lighting",           "Home & Living"),
        ("decor",              "Home & Living"),
        ("storage",            "Home & Living"),
        ("bedding",            "Home & Living"),
        ("cookware",           "Home & Living"),
        ("tableware",          "Home & Living"),
        ("candle",             "Home & Living"),
        # Sports & Outdoors
        ("sport",              "Sports & Outdoors"),
        ("outdoor",            "Sports & Outdoors"),
        ("fitness",            "Sports & Outdoors"),
        ("yoga",               "Sports & Outdoors"),
        ("cycling",            "Sports & Outdoors"),
        ("camping",            "Sports & Outdoors"),
        ("hiking",             "Sports & Outdoors"),
        ("gym",                "Sports & Outdoors"),
        ("exercise",           "Sports & Outdoors"),
        ("swimming",           "Sports & Outdoors"),
        ("fishing",            "Sports & Outdoors"),
        ("hunting",            "Sports & Outdoors"),
        # Beauty & Care
        ("beauty",             "Beauty & Care"),
        ("skincare",           "Beauty & Care"),
        ("makeup",             "Beauty & Care"),
        ("hair",               "Beauty & Care"),
        ("nail",               "Beauty & Care"),
        ("perfume",            "Beauty & Care"),
        ("cosmetic",           "Beauty & Care"),
        ("personal care",      "Beauty & Care"),
        ("health",             "Beauty & Care"),
        ("massage",            "Beauty & Care"),
        ("oral",               "Beauty & Care"),
    ]

    detected_lower = detected.lower()

    # 1. Try alias table — first match wins (ordered from most specific to broad)
    for keyword, local_name in ALIAS:
        if keyword in detected_lower:
            target = local_name.lower()
            if target in cat_by_name:
                return cat_by_name[target]

    # 2. Word-overlap scoring as fallback
    cj_words = set(
        w for w in detected_lower.replace("/", " ").replace("&", " ").replace(",", " ").split()
        if len(w) > 2
    )
    best_score = 0
    best_id = None
    for cat in local_cats:
        cat_words = set(w.lower() for w in cat["name"].replace("&", " ").split())
        score = len(cj_words & cat_words)
        if score > best_score:
            best_score = score
            best_id = cat["id"]

    if best_id:
        return best_id

    # 3. Substring match on the last path segment
    last_segment = detected.split("/")[-1].strip().lower()
    for cat in local_cats:
        if last_segment in cat["name"].lower() or cat["name"].lower() in last_segment:
            return cat["id"]

    return None


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
        except Exception:
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
            for review in reviews.data:
                try:
                    profile = (
                        supabase.table("profiles")
                        .select("full_name")
                        .eq("id", review["user_id"])
                        .maybe_single()
                        .execute()
                    )
                    review["profiles"] = profile.data if profile and profile.data else {"full_name": "Anonymous"}
                except Exception:
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
        supabase.table("products").delete().eq("id", product_id).execute()
        return {"message": "Product deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


# ─────────────────────────────────────────────────────────────────────────────
# CJ Dropshipping Import Endpoints (Free — no scraping needed)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/cj/debug/{pid}")
async def cj_debug_raw(pid: str, admin=Depends(get_admin_user)):
    """Return raw CJ API response for a product — for debugging only."""
    from core.cj_client import _cj_get
    product_raw = await _cj_get("/product/query", {"pid": pid})
    variant_raw = await _cj_get("/product/variant/query", {"pid": pid})
    return {"product": product_raw, "variants": variant_raw}


@router.get("/cj/search")
async def cj_search(
    keyword: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin=Depends(get_admin_user),
):
    """Search CJ Dropshipping products by keyword (admin only)."""
    try:
        from core.cj_client import cj_search_products
        return await cj_search_products(keyword=keyword, page=page, size=size)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CJ search error: {str(e)}")


@router.get("/cj/detail/{pid}")
async def cj_product_detail(pid: str, admin=Depends(get_admin_user)):
    """Get full CJ product detail including variants (admin only)."""
    try:
        from core.cj_client import cj_get_product_detail
        return await cj_get_product_detail(pid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CJ detail error: {str(e)}")


@router.post("/cj/import")
async def cj_import_product(
    payload: dict = Body(..., example={"pid": "04A22450-67F0-4617-A132-E7AE7F8963B0", "category_id": None}),
    admin=Depends(get_admin_user),
):
    """
    Import a single CJ Dropshipping product into the store.
    Body: { "pid": "<cj_product_id>", "category_id": <optional_int> }
    """
    pid = (payload or {}).get("pid", "").strip()
    if not pid:
        raise HTTPException(status_code=422, detail="'pid' is required.")

    category_id_override = (payload or {}).get("category_id")

    try:
        from core.cj_client import cj_get_product_detail
        result = await cj_get_product_detail(pid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CJ fetch error: {str(e)}")

    if result.get("status") != "success":
        raise HTTPException(status_code=422, detail="Failed to get product detail from CJ.")

    pc = result["data"]["_product_create"]
    supabase = get_authenticated_client(admin["token"])

    # Category — fetch all local categories and find best match
    if category_id_override:
        pc["category_id"] = category_id_override
    else:
        detected = result["data"].get("category", "")
        try:
            all_cats = supabase.table("categories").select("id, name").execute()
            pc["category_id"] = _match_category(detected, all_cats.data or [])
        except Exception:
            pc["category_id"] = None

    # Unique slug
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

    # Insert
    try:
        insert_resp = supabase.table("products").insert(pc).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=500, detail="DB insert returned no data.")
        product_row = insert_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB insert error: {str(e)}")

    # Save images
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
            pass

    return {
        "message": "Product imported from CJ Dropshipping successfully.",
        "product": product_row,
        "images_saved": len(image_rows),
        "normalized": result["data"],
    }


@router.post("/cj/import-bulk")
async def cj_bulk_import(
    payload: dict = Body(...),
    admin=Depends(get_admin_user),
):
    """
    Bulk import up to 50 CJ products by PID list.
    Body: { "pids": ["pid1", "pid2", ...], "category_id": null }
    """
    pids = (payload or {}).get("pids", [])
    category_id_override = (payload or {}).get("category_id")

    if not pids:
        raise HTTPException(status_code=422, detail="'pids' list is required.")
    if len(pids) > 50:
        raise HTTPException(status_code=422, detail="Maximum 50 PIDs per bulk request.")

    from core.cj_client import cj_get_product_detail

    async def _import_one(pid: str) -> dict:
        try:
            result = await cj_get_product_detail(pid.strip())
            if result.get("status") != "success":
                return {"pid": pid, "status": "error", "reason": "Detail fetch failed"}

            pc = result["data"]["_product_create"]
            supabase = get_authenticated_client(admin["token"])

            # Category resolution
            if category_id_override:
                pc["category_id"] = category_id_override
            else:
                detected = result["data"].get("category", "")
                try:
                    all_cats = supabase.table("categories").select("id, name").execute()
                    pc["category_id"] = _match_category(detected, all_cats.data or [])
                except Exception:
                    pc["category_id"] = None

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

            insert_resp = supabase.table("products").insert(pc).execute()
            if not insert_resp.data:
                return {"pid": pid, "status": "error", "reason": "DB insert failed"}

            product_row = insert_resp.data[0]
            image_rows = [
                {"product_id": product_row["id"], "image_url": url, "alt_text": pc["name"],
                 "display_order": i, "is_primary": i == 0}
                for i, url in enumerate(pc.get("images") or []) if url
            ]
            if image_rows:
                try:
                    supabase.table("product_images").insert(image_rows).execute()
                except Exception:
                    pass

            return {"pid": pid, "status": "success", "product_id": product_row["id"], "name": product_row.get("name")}
        except Exception as e:
            return {"pid": pid, "status": "error", "reason": str(e)}

    # Process 3 at a time
    results = []
    for i in range(0, len(pids), 3):
        batch = pids[i:i + 3]
        batch_results = await asyncio.gather(*[_import_one(pid) for pid in batch])
        results.extend(batch_results)
        if i + 3 < len(pids):
            await asyncio.sleep(1)

    success_count = sum(1 for r in results if r["status"] == "success")
    return {
        "message": f"Bulk import: {success_count}/{len(results)} succeeded.",
        "total": len(results),
        "success": success_count,
        "failed": len(results) - success_count,
        "results": results,
    }
