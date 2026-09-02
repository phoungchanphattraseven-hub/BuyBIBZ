from fastapi import APIRouter, HTTPException, Depends
from core.config import get_supabase, get_authenticated_client
from core.auth import get_current_user
from models.schemas import ReviewCreate

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


def _recompute_product_rating(supabase, product_id: int):
    """Recompute rating_avg / rating_count from the remaining reviews."""
    remaining = (
        supabase.table("reviews")
        .select("rating")
        .eq("product_id", product_id)
        .execute()
    )
    ratings = [r["rating"] for r in (remaining.data or [])]
    new_count = len(ratings)
    new_avg = round(sum(ratings) / new_count, 1) if new_count else 0
    supabase.table("products").update({
        "rating_avg": new_avg,
        "rating_count": new_count,
    }).eq("id", product_id).execute()


def _is_admin(supabase, user_id: str) -> bool:
    try:
        profile = (
            supabase.table("profiles")
            .select("role")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return bool(profile and profile.data and profile.data.get("role") == "admin")
    except Exception:
        return False


@router.get("/{product_id}")
async def get_reviews(product_id: int):
    """Get all reviews for a product."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("reviews")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .execute()
        )
        
        # Enrich reviews with user profiles
        reviews = response.data if response and response.data else []
        for review in reviews:
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
        
        return {"reviews": reviews}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_review(review: ReviewCreate, current_user=Depends(get_current_user)):
    """Add a review for a product (one per user per product)."""
    try:
        from core.config import get_authenticated_client
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        # Check if product exists
        product = (
            supabase.table("products")
            .select("id, rating_avg, rating_count")
            .eq("id", review.product_id)
            .maybe_single()
            .execute()
        )
        if not product or not product.data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if user already reviewed
        existing = (
            supabase.table("reviews")
            .select("id")
            .eq("user_id", user_id)
            .eq("product_id", review.product_id)
            .execute()
        )
        if existing and existing.data:
            raise HTTPException(status_code=400, detail="You already reviewed this product")

        # Create review
        response = (
            supabase.table("reviews")
            .insert({
                "user_id": user_id,
                "product_id": review.product_id,
                "rating": review.rating,
                "comment": review.comment,
            })
            .execute()
        )

        # Update product rating
        old_avg = float(product.data.get("rating_avg", 0))
        old_count = int(product.data.get("rating_count", 0))
        new_count = old_count + 1
        new_avg = round(((old_avg * old_count) + review.rating) / new_count, 1)

        supabase.table("products").update({
            "rating_avg": new_avg,
            "rating_count": new_count,
        }).eq("id", review.product_id).execute()

        return {
            "message": "Review added",
            "review": response.data[0] if response.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{review_id}")
async def delete_review(review_id: int, current_user=Depends(get_current_user)):
    """Delete a review. Only its owner (or an admin) can delete it."""
    try:
        supabase = get_authenticated_client(current_user["token"])
        user_id = str(current_user["user"].id)

        review = (
            supabase.table("reviews")
            .select("id, user_id, product_id")
            .eq("id", review_id)
            .maybe_single()
            .execute()
        )
        if not review or not review.data:
            raise HTTPException(status_code=404, detail="Review not found")

        if str(review.data["user_id"]) != user_id and not _is_admin(get_supabase(), user_id):
            raise HTTPException(status_code=403, detail="You can only delete your own review")

        supabase.table("reviews").delete().eq("id", review_id).execute()
        _recompute_product_rating(supabase, review.data["product_id"])

        return {"message": "Review deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
