from fastapi import APIRouter, HTTPException
from core.config import get_supabase

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("")
async def list_categories():
    """List all product categories."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("categories")
            .select("*")
            .order("name")
            .execute()
        )
        return {"categories": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{category_id}")
async def get_category(category_id: int):
    """Get a single category."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("categories")
            .select("*")
            .eq("id", category_id)
            .maybe_single()
            .execute()
        )
        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
