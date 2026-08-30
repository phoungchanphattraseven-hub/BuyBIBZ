import re
from fastapi import APIRouter, HTTPException, Depends, Query, Response
from core.config import get_supabase, get_authenticated_client
from core.auth import get_current_user, get_admin_user
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
    """Get a single product with its reviews."""
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
        slug = slugify(product.name)

        # Check for duplicate slug
        existing = supabase.table("products").select("id").eq("slug", slug).execute()
        if existing and existing.data:
            slug = f"{slug}-{len(existing.data if existing and existing.data else []) + 1}"

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
            data["slug"] = slugify(data["name"])

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
