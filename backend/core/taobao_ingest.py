"""
Taobao Product Ingestion Pipeline
==================================
1. Calls Apify zen-studio/taobao-detail-scraper with a product URL or item ID
2. Validates the product is gaming/electronics (rejects clothing, food, etc.)
3. Translates & cleans Chinese text fields
4. Converts CNY → USD with 2x markup and .99 rounding
5. Normalises images (https prefix + no-referrer policy)
6. Extracts SKU variants
7. Returns a dict ready for ProductCreate schema / Supabase insert

Usage:
    from core.taobao_ingest import ingest_taobao_product
    result = await ingest_taobao_product("https://item.taobao.com/item.htm?id=XXXXXXXXX")
"""

import os
import math
import asyncio
import httpx
from typing import Optional
from dotenv import load_dotenv

# Ensure .env is loaded (handles cases where this module is imported before config.py)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

# ─── Config ───────────────────────────────────────────────────────────────────

# Read at call time (not module load) so .env is always loaded first
def _get_apify_token() -> str:
    return os.getenv("APIFY_TOKEN", "")

APIFY_ACTOR: str = "zen-studio~taobao-detail-scraper"
APIFY_BASE: str = "https://api.apify.com/v2"

CNY_TO_USD: float = 0.14      # exchange rate
MARKUP: float = 2.0            # 100% markup (2x)

# ─── Category Allow / Block Lists ─────────────────────────────────────────────

ALLOWED_KEYWORDS = [
    # ── English ──────────────────────────────────────────────────────────────
    "gaming", "keyboard", "mouse", "mice", "headset", "headphone", "monitor",
    "chair", "desk", "controller", "gamepad", "joystick", "speaker", "webcam",
    "microphone", "pc", "cpu", "gpu", "ram", "ssd", "nvme", "motherboard",
    "power supply", "psu", "case", "cooling", "fan", "rgb", "mechanical",
    "switch", "keycap", "wrist rest", "mousepad", "capture card", "usb hub",
    "earphone", "earbuds", "audio", "amplifier", "dac", "peripheral",
    "graphics card", "processor", "memory", "storage", "laptop", "notebook",
    "wireless", "bluetooth", "wired", "usb", "hdmi", "displayport",
    "streamer", "streaming", "esports", "e-sports",
    # ── Chinese (Simplified) ─────────────────────────────────────────────────
    "游戏", "键盘", "鼠标", "耳机", "显示器", "椅", "桌", "手柄",
    "主机", "显卡", "处理器", "内存", "固态", "机箱", "电源", "散热",
    "麦克风", "声卡", "音箱", "耳麦", "外设", "机械", "轴", "鼠标垫",
    "笔记本", "电竞", "无线", "蓝牙", "有线", "电脑", "台式",
    "摄像头", "网卡", "路由", "硬盘", "显示", "屏幕", "支架",
    "扬声器", "功放", "解码", "声卡", "录音", "话筒", "降噪",
    "手机", "平板", "充电", "数据线", "转接", "扩展坞",
    # ── Brand names commonly sold on Taobao ──────────────────────────────────
    "razer", "logitech", "corsair", "steelseries", "hyperx", "roccat",
    "asus", "msi", "gigabyte", "acer", "benq", "samsung", "lg",
    "ducky", "keychron", "akko", "varmilo", "ikbc", "leopold",
    "cooler master", "noctua", "be quiet", "lian li", "fractal",
    "seagate", "western digital", "samsung", "crucial", "kingston",
    "nvidia", "amd", "intel", "rtx", "gtx", "rx ", "ryzen", "core i",
    "redragon", "rapoo", "nuphy", "wooting", "glorious", "endgame gear",
    "罗技", "雷蛇", "海盗船", "赛睿", "华硕", "微星", "技嘉",
    "宏碁", "明基", "三星", "索尼", "飞利浦",
]

BLOCKED_KEYWORDS = [
    # ── English ──────────────────────────────────────────────────────────────
    "dress", "shirt", "pants", "shoes", "sneaker", "jacket", "coat",
    "skirt", "clothing", "apparel", "fashion", "food", "snack", "drink",
    "toy", "doll", "plush", "sofa", "mattress",
    "curtain", "blanket", "pillow", "cosmetic", "lipstick", "makeup",
    "skincare", "perfume", "handbag", "wallet", "jewelry", "necklace",
    "bracelet", "ring", "watch strap", "sunglasses",
    # ── Chinese ──────────────────────────────────────────────────────────────
    "服装", "衣服", "女装", "男装", "童装", "鞋子", "运动鞋", "高跟鞋",
    "裤子", "裙子", "食品", "零食", "饮料", "奶茶", "咖啡豆",
    "玩具", "毛绒", "公仔", "沙发", "床垫", "窗帘", "被子", "枕头",
    "口红", "化妆", "护肤", "香水", "包包", "钱包", "首饰", "项链",
    "手链", "戒指", "眼镜框", "太阳镜",
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _is_gaming_product(title: str, raw_title: str, raw_data: dict = None) -> bool:
    """
    Return True if the product passes the gaming/electronics category filter.
    Checks: cleaned EN title, original CN title, brand name, category metadata.
    """
    raw_data = raw_data or {}

    # Build a combined string from all available text signals
    brand = str(raw_data.get("brandName") or "")
    shop_name = str((raw_data.get("shop") or {}).get("shopName") or "")
    category_id = str(raw_data.get("categoryId") or "")
    attrs_text = " ".join(
        f"{a.get('name','')} {a.get('value','')}"
        for a in (raw_data.get("attributes") or [])
    )

    combined = " ".join([title, raw_title, brand, shop_name, attrs_text]).lower()

    # Explicit block wins first — check only the title, not shop name
    title_combined = (title + " " + raw_title).lower()
    for kw in BLOCKED_KEYWORDS:
        if kw.lower() in title_combined:
            return False

    # Must match at least one allowed keyword in any signal
    for kw in ALLOWED_KEYWORDS:
        if kw.lower() in combined:
            return True

    # Fallback: Taobao category IDs for electronics/computers start with specific ranges.
    # This catches products that have no matching keywords but are clearly electronics.
    electronics_category_prefixes = (
        "50008090",  # Computer peripherals
        "50010808",  # Keyboards
        "50010807",  # Mice
        "50023339",  # Headsets
        "50010164",  # Monitors
        "50010853",  # Gaming chairs
        "1101",      # Digital/electronics broad
        "1102",
        "1103",
        "1640",      # Computer hardware
    )
    for prefix in electronics_category_prefixes:
        if category_id.startswith(prefix):
            return True

    return False


def _fix_image_url(url: Optional[str]) -> Optional[str]:
    """Prefix protocol-relative URLs with https://."""
    if not url:
        return None
    if url.startswith("//"):
        return "https:" + url
    return url


def _cny_to_retail(cny_str: Optional[str]) -> tuple[float, float]:
    """
    Convert a CNY string price to (supplier_cost_usd, retail_price_usd).
    Returns (0.0, 0.0) if price is missing/invalid.
    """
    try:
        cny = float(cny_str or 0)
    except (ValueError, TypeError):
        cny = 0.0

    base_usd = round(cny * CNY_TO_USD, 2)
    marked_up = base_usd * MARKUP
    # Round UP to nearest .99
    retail = math.ceil(marked_up) - 0.01
    if retail < 0:
        retail = 0.99
    return base_usd, round(retail, 2)


def _parse_props_name(props_names: str) -> str:
    """
    Parse Taobao's propsNames string — handles both single and compound SKUs.

    Single property format:
      "1627207:42658520817:颜色分类:RGB Black"
      → "RGB Black"

    Compound property format (multiple props joined by ";"):
      "1627207:111640:颜色分类:星光色;1234:5678:存储容量:128GB"
      → "星光色 / 128GB"

    Each property segment is "propId:valueId:propName:valueName"
    We extract the valueName (index 3) from each segment.
    """
    if not props_names:
        return "Default"

    # Split compound SKUs on ";" separator
    segments = props_names.split(";")
    values = []
    for seg in segments:
        parts = seg.split(":")
        if len(parts) >= 4:
            # Format: propId:valueId:propName:valueName
            value = parts[3].strip()
            if value:
                values.append(value)
        elif len(parts) >= 2:
            value = parts[-1].strip()
            if value:
                values.append(value)

    if values:
        return " / ".join(values)
    return props_names.strip()


def _translate_common_terms(text: str) -> str:
    """
    Apply a lookup table of common Chinese gaming/tech terms → English.
    This is a fast deterministic pass; an LLM or DeepL can replace it later.
    """
    replacements = {
        # ── Hardware terms ────────────────────────────────────────────────────
        "机械轴": "Mechanical Switch",
        "三模": "Tri-Mode",
        "无线": "Wireless",
        "有线": "Wired",
        "蓝牙": "Bluetooth",
        "红轴": "Red Switch",
        "青轴": "Blue Switch",
        "茶轴": "Brown Switch",
        "黑轴": "Black Switch",
        "银轴": "Silver Switch",
        "黄轴": "Yellow Switch",
        # ── Colors ────────────────────────────────────────────────────────────
        "白色": "White",
        "黑色": "Black",
        "灰色": "Grey",
        "银色": "Silver",
        "金色": "Gold",
        "蓝色": "Blue",
        "红色": "Red",
        "绿色": "Green",
        "粉色": "Pink",
        "紫色": "Purple",
        "橙色": "Orange",
        "星光色": "Starlight",
        "深空黑色": "Space Black",
        "深空灰色": "Space Grey",
        "午夜色": "Midnight",
        "苍岭绿": "Alpine Green",
        "远峰蓝": "Sierra Blue",
        # ── Storage / Memory ──────────────────────────────────────────────────
        "存储容量": "Storage",
        "内存容量": "RAM",
        "运行内存": "RAM",
        "机身内存": "Storage",
        # ── Variant / product labels ──────────────────────────────────────────
        "颜色分类": "Color",
        "套餐类型": "Bundle Type",
        "套餐一": "Bundle A",
        "套餐二": "Bundle B",
        "套餐三": "Bundle C",
        "规格": "Spec",
        "版本": "Version",
        "套装": "Bundle",
        "单件": "Single",
        "标配": "Standard",
        "标准版": "Standard Edition",
        "豪华版": "Deluxe Edition",
        "旗舰版": "Flagship Edition",
        "国行": "CN Version",
        "国际版": "International",
        "中国大陆": "CN",
        "港澳台": "HK/Macau/TW",
        "全网通": "All-Network",
        # ── Marketing buzzwords to strip ──────────────────────────────────────
        "包邮": "",
        "爆款": "",
        "秒杀": "",
        "限时": "",
        "特价": "",
        "官方": "",
        "正品": "",
        "现货": "",
        "新款": "",
        "旗舰店": "",
        "专卖店": "",
        "顺丰": "",
        "三期免息": "",
    }
    for cn, en in replacements.items():
        # Surround replacements so adjacent Chinese terms do not become an
        # unreadable merged English word (for example WirelessMechanical).
        text = text.replace(cn, f" {en} ")
    return text.strip()


def _clean_title(title: str) -> str:
    """Strip marketing buzzwords, clean whitespace, and remove redundant Chinese from title."""
    import re
    title = _translate_common_terms(title)
    # Remove pure Chinese character sequences (keep Latin, numbers, symbols)
    title = re.sub(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+', ' ', title)
    # Remove source-market brackets left behind after Chinese SKU fragments.
    title = re.sub(r'[【】〔〕（）]', ' ', title)
    # Collapse extra whitespace and trim
    title = re.sub(r"\s+", " ", title).strip()
    # Remove leading/trailing punctuation and slashes
    title = title.strip("·•-–/ ")
    return title


def _clean_brand(brand: str) -> str:
    """Clean brand name — strip Chinese characters and slash-separated duplicates."""
    import re
    # Handle "Apple/苹果" → "Apple"
    parts = brand.split("/")
    # Keep the first Latin part if available
    for part in parts:
        clean = re.sub(r'[\u4e00-\u9fff]+', '', part).strip()
        if clean:
            return clean
    # Fallback: strip all Chinese
    return re.sub(r'[\u4e00-\u9fff]+', '', brand).strip() or brand


def _detect_category(title: str) -> str:
    """Map cleaned title to one of the standard output categories."""
    t = title.lower()
    if any(k in t for k in ["chair", "椅"]):
        return "Gaming Chairs"
    if any(k in t for k in ["desk", "桌"]):
        return "Gaming Desks"
    if any(k in t for k in ["mouse", "mice", "鼠标"]):
        return "Mice"
    if any(k in t for k in ["keyboard", "键盘", "keycap", "keycaps"]):
        return "Keyboards"
    if any(k in t for k in ["headset", "headphone", "earphone", "earbuds", "耳机", "audio", "speaker", "音箱", "microphone", "麦克风"]):
        return "Audio"
    if any(k in t for k in ["monitor", "显示器"]):
        return "Gaming Monitors"
    if any(k in t for k in ["controller", "gamepad", "joystick", "手柄"]):
        return "Controllers"
    if any(k in t for k in ["cpu", "gpu", "ram", "ssd", "motherboard", "psu", "case", "处理器", "显卡", "内存", "固态", "机箱", "电源"]):
        return "PC Components"
    return "Peripherals"


# ─── Main Pipeline ────────────────────────────────────────────────────────────

async def fetch_apify_product(item: str) -> dict:
    """
    Call Apify API synchronously (run + wait + fetch dataset).
    item: Taobao URL or numeric item ID.
    Returns raw Apify dataset row dict.
    Raises ValueError on API / auth errors.
    """
    APIFY_TOKEN = _get_apify_token()
    if not APIFY_TOKEN:
        raise ValueError("APIFY_TOKEN is not set. Add it to your .env file.")

    headers = {"Authorization": f"Bearer {APIFY_TOKEN}"}
    run_input = {"items": [item], "fetchReviews": False}

    async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
        # 1. Start the actor run
        start_resp = await client.post(
            f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs",
            json=run_input,
            headers=headers,
        )
        if start_resp.status_code not in (200, 201):
            raise ValueError(f"Apify run failed to start: {start_resp.status_code} {start_resp.text}")

        run_data = start_resp.json().get("data", {})
        run_id = run_data.get("id")
        if not run_id:
            raise ValueError("Apify did not return a run ID.")

        # 2. Poll until SUCCEEDED (max ~90s)
        for _ in range(30):
            await asyncio.sleep(3)
            status_resp = await client.get(
                f"{APIFY_BASE}/actor-runs/{run_id}",
                headers=headers,
            )
            status = status_resp.json().get("data", {}).get("status", "")
            if status == "SUCCEEDED":
                break
            if status in ("FAILED", "ABORTED", "TIMED-OUT"):
                raise ValueError(f"Apify run ended with status: {status}")

        # 3. Fetch the dataset
        dataset_id = status_resp.json().get("data", {}).get("defaultDatasetId", "")
        if not dataset_id:
            raise ValueError("No dataset ID returned from Apify run.")

        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            headers=headers,
            params={"format": "json", "clean": "true"},
        )
        items = items_resp.json()
        if not items:
            raise ValueError("Apify returned an empty dataset. The product URL may be invalid or expired.")

        return items[0]


def normalize_taobao_product(raw: dict) -> dict:
    """
    Transform a raw Apify zen-studio/taobao-detail-scraper row into the
    normalised pipeline output schema.

    Returns either:
      {"status": "rejected", "reason": "..."}
    or:
      {"status": "success", "data": {...}}
    """
    raw_title = raw.get("titleOriginal") or raw.get("title") or ""
    en_title = _clean_title(raw_title)

    # ── 1. Category filter ────────────────────────────────────────────────────
    if not _is_gaming_product(en_title, raw_title, raw):
        return {
            "status": "rejected",
            "reason": "Item is not an electronic or gaming product",
        }

    # ── 2. Pricing ────────────────────────────────────────────────────────────
    supplier_cost, retail_price = _cny_to_retail(raw.get("price"))
    original_usd, original_retail = _cny_to_retail(raw.get("originalPrice") or raw.get("price"))

    # ── 3. Images ─────────────────────────────────────────────────────────────
    main_img = _fix_image_url(raw.get("mainPictureUrl"))
    all_images = [_fix_image_url(u) for u in (raw.get("pictures") or []) if u]
    if main_img and main_img not in all_images:
        all_images.insert(0, main_img)

    # ── 4. Attributes ─────────────────────────────────────────────────────────
    raw_attrs = raw.get("attributes") or []
    attributes = []
    seen_attr_names = set()
    for attr in raw_attrs:
        name = _clean_title(attr.get("name", ""))
        value = _clean_title(attr.get("value", ""))
        if name and value and name not in seen_attr_names:
            seen_attr_names.add(name)
            attributes.append({"name": name, "values": [value]})

    # ── 5. SKU Variants ───────────────────────────────────────────────────────
    skus_raw = raw.get("skus") or []
    props_images = raw.get("propsImages") or {}
    variants = []

    for sku in skus_raw:
        sku_id = str(sku.get("skuId", ""))
        props_names_str = sku.get("propsNames", "")
        # Translate known terms first, then strip any remaining Chinese
        variant_name = _clean_title(_parse_props_name(props_names_str))
        if not variant_name:
            variant_name = f"SKU {sku_id}"
        sku_cost, sku_retail = _cny_to_retail(sku.get("price") or raw.get("price"))

        # Find variant swatch image
        props_ids_str = sku.get("propsIds", "")
        variant_img = None
        for pid in props_ids_str.split(";"):
            if pid in props_images:
                variant_img = _fix_image_url(props_images[pid])
                break

        variants.append({
            "sku_id": sku_id,
            "variant_name": variant_name,
            "supplier_cost_usd": sku_cost,
            "retail_price_usd": sku_retail,
            "stock": sku.get("quantity") or 0,
            "image_url": variant_img or main_img,
        })

    # ── 6. Shop / Brand ───────────────────────────────────────────────────────
    brand = raw.get("brandName") or (raw.get("shop") or {}).get("shopName") or "Unknown"
    brand = _clean_brand(_translate_common_terms(brand))

    # ── 7. Build output ───────────────────────────────────────────────────────
    return {
        "status": "success",
        "data": {
            "taobao_item_id": str(raw.get("itemId", "")),
            "title": en_title,
            "category": _detect_category(en_title),
            "brand": brand,
            "currency": "USD",
            "pricing": {
                "supplier_cost_usd": supplier_cost,
                "retail_price_usd": retail_price,
                "original_retail_usd": original_retail,
            },
            "main_images": all_images,
            "image_policy": {"referrer": "no-referrer"},
            "attributes": attributes,
            "variants": variants,
            "description": en_title,  # full description from descriptionHtml would need parsing
            # ── Fields mapped to your ProductCreate schema ──
            "_product_create": {
                "name": en_title,
                "description": en_title,
                "price": retail_price,
                "compare_price": original_retail if original_retail != retail_price else None,
                "image_url": main_img,
                "images": all_images,
                "stock": raw.get("stock") or (variants[0]["stock"] if variants else 0),
                "is_featured": False,
                "is_active": True,
                "attributes": {
                    "taobao_item_id": str(raw.get("itemId", "")),
                    "brand": brand,
                    "variants": variants,
                    "supplier_cost_usd": supplier_cost,
                },
            },
        },
    }


async def ingest_taobao_product(item: str) -> dict:
    """
    Full pipeline: fetch from Apify → validate → normalize.
    item: Taobao product URL or numeric item ID string.
    """
    raw = await fetch_apify_product(item)
    return normalize_taobao_product(raw)
