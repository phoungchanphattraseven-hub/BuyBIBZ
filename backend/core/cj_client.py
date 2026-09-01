"""
CJ Dropshipping API Client
===========================
Free, official, no geo-blocking — works from any country.
1M+ products including gaming gear, electronics, clothing, everything.

Auth flow:
  1. POST apiKey → get accessToken (valid 15 days)
  2. Use accessToken in CJ-Access-Token header
  3. Auto-refresh when expired

Endpoints used:
  - GET  /product/listV2         keyword/category search
  - GET  /product/query          product detail by pid
  - GET  /product/variant/query  all variants for a product

Docs: https://developers.cjdropshipping.com/en/api/api2/api/product.html
"""

import os
import math
import asyncio
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1"
MARKUP = 2.0  # 100% markup

# ─── Token cache (in-memory, survives backend restarts via re-auth) ───────────
_cj_token: Optional[str] = None
_cj_refresh_token: Optional[str] = None


def _get_api_key() -> str:
    return os.getenv("CJ_API_KEY", "")


async def _get_access_token() -> str:
    """Get or refresh CJ access token."""
    global _cj_token, _cj_refresh_token

    api_key = _get_api_key()
    if not api_key:
        raise ValueError(
            "CJ_API_KEY is not set. Add it to your .env file.\n"
            "Get your free API key at: https://www.cjdropshipping.com/my.html#/authorize/API"
        )

    # Try refresh first if we have a refresh token
    if _cj_refresh_token:
        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                resp = await client.post(
                    f"{CJ_BASE}/authentication/refreshAccessToken",
                    json={"refreshToken": _cj_refresh_token},
                )
                data = resp.json()
                if data.get("result") and data.get("data", {}).get("accessToken"):
                    _cj_token = data["data"]["accessToken"]
                    _cj_refresh_token = data["data"]["refreshToken"]
                    return _cj_token
        except Exception:
            pass  # Fall through to full auth

    # Full auth with apiKey
    async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
        resp = await client.post(
            f"{CJ_BASE}/authentication/getAccessToken",
            json={"apiKey": api_key},
        )
        data = resp.json()
        if not data.get("result") or not data.get("data", {}).get("accessToken"):
            raise ValueError(
                f"CJ auth failed: {data.get('message', 'Unknown error')}. "
                f"Check your CJ_API_KEY in .env"
            )
        _cj_token = data["data"]["accessToken"]
        _cj_refresh_token = data["data"].get("refreshToken")
        return _cj_token


async def _cj_get(endpoint: str, params: dict = None, retry: bool = True) -> dict:
    """Make authenticated GET request to CJ API, auto-refresh token on 401."""
    global _cj_token

    token = _cj_token or await _get_access_token()

    async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
        resp = await client.get(
            f"{CJ_BASE}{endpoint}",
            params=params,
            headers={"CJ-Access-Token": token},
        )
        data = resp.json()

        # Token expired — refresh and retry once
        if data.get("code") in (1600001, 1600002, 1600003) and retry:
            _cj_token = None
            _cj_refresh_token = None
            await _get_access_token()
            return await _cj_get(endpoint, params, retry=False)

        return data


# ─── Pricing ──────────────────────────────────────────────────────────────────

def _to_retail(usd_price) -> tuple[float, float]:
    """
    supplier_cost, retail_price
    Accepts float, int, or a range string like "6.80 -- 6.97" or "6.80-6.97".
    Takes the higher end of the range, applies 2x markup, rounds UP to .99
    """
    if isinstance(usd_price, str):
        # Strip spaces, handle various range separators: " -- ", " - ", "-"
        usd_price = usd_price.strip()
        import re
        parts = re.split(r'\s*--?\s*', usd_price)
        # Use the highest value in the range
        nums = []
        for p in parts:
            try:
                nums.append(float(p.strip()))
            except (ValueError, TypeError):
                pass
        usd_price = max(nums) if nums else 0.0

    cost = round(float(usd_price or 0), 2)
    marked = cost * MARKUP
    retail = math.ceil(marked) - 0.01
    if retail < 0.99:
        retail = 0.99
    return cost, round(retail, 2)


# ─── Public API ───────────────────────────────────────────────────────────────

async def cj_search_products(
    keyword: str,
    page: int = 1,
    size: int = 20,
    category_id: str = None,
    min_price: float = None,
    max_price: float = None,
) -> dict:
    """
    Search CJ products by keyword.
    Returns normalized list ready for the admin product browser.
    """
    params = {
        "keyWord": keyword,
        "page": page,
        "size": size,
        "features": "enable_category,enable_description",
    }
    if category_id:
        params["categoryId"] = category_id
    if min_price is not None:
        params["startSellPrice"] = min_price
    if max_price is not None:
        params["endSellPrice"] = max_price

    data = await _cj_get("/product/listV2", params)

    if not data.get("result"):
        raise ValueError(f"CJ search failed: {data.get('message')}")

    content = (data.get("data", {}).get("content") or [{}])[0]
    products_raw = content.get("productList", [])
    total = data.get("data", {}).get("totalRecords", 0)

    products = []
    for p in products_raw:
        sell_price = p.get("sellPrice") or p.get("nowPrice") or p.get("discountPrice") or "0"
        cost, retail = _to_retail(sell_price)
        products.append({
            "cj_pid": p.get("id"),
            "name": p.get("nameEn") or "Unknown Product",
            "sku": p.get("sku"),
            "image_url": p.get("bigImage"),
            "category": p.get("threeCategoryName") or p.get("twoCategoryName") or "",
            "supplier_cost_usd": cost,
            "retail_price_usd": retail,
            "stock": p.get("warehouseInventoryNum", 0),
            "is_free_shipping": p.get("addMarkStatus") == 1,
            "description": p.get("description") or "",
        })

    return {
        "products": products,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


async def cj_get_product_detail(pid: str) -> dict:
    """
    Get full product detail including variants.
    Returns normalized dict ready for DB insert (same shape as ProductCreate).
    """
    # Get product details
    data = await _cj_get("/product/query", {"pid": pid})
    if not data.get("result") or not data.get("data"):
        raise ValueError(f"CJ product not found: {data.get('message')}")

    p = data["data"]

    # /product/variant/query returns NO inventory data (confirmed by CJ docs §2.1).
    # Inventory lives in two places:
    #   a) p["variants"][i]["inventories"] — embedded in /product/query response
    #   b) /product/stock/getInventoryByPid — dedicated inventory endpoint
    # We use (a) first, then (b) as a supplement for any variant missing inventory.

    # Variants are already in the /product/query response
    variants_from_product = p.get("variants") or []

    # Also call the dedicated inventory endpoint for richer per-variant data
    inv_data = await _cj_get("/product/stock/getInventoryByPid", {"pid": pid})
    # Build a vid→totalInventory map from the dedicated endpoint
    vid_inventory: dict = {}
    if inv_data.get("result") or inv_data.get("success"):
        for vi in (inv_data.get("data") or {}).get("variantInventories") or []:
            vid = vi.get("vid")
            if vid:
                total = sum(
                    entry.get("totalInventory", 0) or 0
                    for entry in (vi.get("inventory") or [])
                )
                vid_inventory[vid] = total

    # Product-level total from the dedicated endpoint as ultimate fallback
    product_total_inv = sum(
        entry.get("totalInventoryNum", 0) or 0
        for entry in (inv_data.get("data") or {}).get("inventories") or []
    ) if (inv_data.get("result") or inv_data.get("success")) else 0

    # Base price
    base_price = p.get("sellPrice") or "0"
    cost, retail = _to_retail(base_price)

    # Images
    images = list(p.get("productImageSet") or [])
    if p.get("bigImage") and p["bigImage"] not in images:
        images.insert(0, p["bigImage"])

    # Variants — built from the embedded variants in /product/query
    variants = []
    for v in variants_from_product:
        v_price = v.get("variantSellPrice") or base_price or "0"
        v_cost, v_retail = _to_retail(v_price)

        # Stock priority:
        # 1. inventories[] embedded in the variant (from /product/query)
        # 2. vid_inventory map from /product/stock/getInventoryByPid
        stock = 0
        inv_list = v.get("inventories") or []
        if inv_list:
            for inv in inv_list:
                stock += inv.get("totalInventory", 0) or 0
        else:
            vid = v.get("vid", "")
            stock = vid_inventory.get(vid, 0)

        variants.append({
            "sku_id": v.get("variantSku", ""),
            "variant_name": v.get("variantNameEn") or v.get("variantKey") or "Default",
            "supplier_cost_usd": v_cost,
            "retail_price_usd": v_retail,
            "stock": stock,
            "image_url": v.get("variantImage") or (images[0] if images else None),
        })

    # Original price for compare_price
    orig_price_str = p.get("suggestSellPrice") or "0"
    import re as _re
    orig_parts = _re.split(r'\s*--?\s*', str(orig_price_str).strip())
    orig_nums = [float(x) for x in orig_parts if x.replace('.','').isdigit()]
    orig_price = max(orig_nums) if orig_nums else 0.0
    _, orig_retail = _to_retail(orig_price) if orig_price else (0, 0)

    # Sum variant stock; fall back to product-level inventory from dedicated endpoint
    total_stock = sum(v["stock"] for v in variants) if variants else 0
    if total_stock == 0:
        total_stock = (
            product_total_inv
            or p.get("warehouseInventoryNum")
            or 0
        )
        try:
            total_stock = int(total_stock)
        except (TypeError, ValueError):
            total_stock = 0

    # Build _product_create shape (matches ProductCreate schema)
    product_create = {
        "name": p.get("productNameEn") or "Unknown Product",
        "description": p.get("description") or p.get("productNameEn") or "",
        "price": retail,
        "compare_price": orig_retail if orig_retail > retail else None,
        "image_url": images[0] if images else None,
        "images": images,
        "stock": total_stock,
        "is_featured": False,
        "is_active": True,
        "attributes": {
            "cj_pid": pid,
            "sku": p.get("productSku"),
            "brand": "",
            "supplier_cost_usd": cost,
            "variants": variants,
            "free_shipping": p.get("addMarkStatus") == 1,
            "category": p.get("categoryName") or "",
        },
    }

    return {
        "status": "success",
        "data": {
            "cj_pid": pid,
            "title": p.get("productNameEn") or "Unknown Product",
            "category": (p.get("categoryName") or "").split("/")[-1].strip(),
            "brand": "",
            "currency": "USD",
            "pricing": {
                "supplier_cost_usd": cost,
                "retail_price_usd": retail,
                "original_retail_usd": orig_retail or retail,
            },
            "main_images": images,
            "image_policy": {"referrer": "no-referrer"},
            "attributes": [
                {"name": "SKU", "values": [p.get("productSku") or ""]},
                {"name": "Category", "values": [p.get("categoryName") or ""]},
                {"name": "Weight", "values": [f"{p.get('productWeight', 0)}g"]},
            ],
            "variants": variants,
            "description": p.get("description") or p.get("productNameEn") or "",
            "_product_create": product_create,
        },
    }


async def cj_get_categories() -> list:
    """Get CJ product category tree."""
    data = await _cj_get("/product/getCategory")
    if not data.get("result"):
        return []
    return data.get("data") or []
