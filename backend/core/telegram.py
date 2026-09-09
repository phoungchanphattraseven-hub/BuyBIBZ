"""
Telegram notification helper for BuyBIBZ admin alerts.

Sends order notifications to the admin's personal Telegram chat
via the configured bot. All calls are fire-and-forget (errors are
logged but never bubble up to the order API response).
"""

import asyncio
import logging
import os
from typing import List, Optional

import httpx

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"


def _token() -> Optional[str]:
    return os.getenv("TELEGRAM_BOT_TOKEN")


def _chat_id() -> Optional[str]:
    return os.getenv("TELEGRAM_ADMIN_CHAT_ID")


def _is_configured() -> bool:
    token = _token()
    chat_id = _chat_id()
    return bool(token and chat_id and chat_id != "123456789")


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

async def _post(method: str, payload: dict) -> bool:
    """POST to the Telegram Bot API. Returns True on success."""
    token = _token()
    url = TELEGRAM_API.format(token=token, method=method)
    try:
        async with httpx.AsyncClient(verify=False, timeout=10) as client:
            r = await client.post(url, json=payload)
            if not r.is_success:
                logger.warning("Telegram %s failed: %s", method, r.text)
            return r.is_success
    except Exception as exc:
        logger.warning("Telegram request error (%s): %s", method, exc)
        return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def send_order_notification(
    order_id: int,
    order_uid: str,
    customer_name: str,
    customer_phone: str,
    address_parts: List[str],
    items: List[dict],   # [{name, qty, price, subtotal, image_url}]
    subtotal: float,
    shipping_fee: float,
    transaction_fee: float,
    total: float,
    notes: Optional[str] = None,
    payment_method: Optional[str] = None,
) -> None:
    """
    Fire-and-forget: send a formatted order notification to the admin.
    Tries sendMediaGroup (with product images) first; falls back to
    plain sendMessage if images are unavailable or fail.
    """
    if not _is_configured():
        logger.info("Telegram not configured — skipping order notification.")
        return

    chat_id = _chat_id()
    address_str = ", ".join(p for p in address_parts if p)

    # Build item lines
    item_lines = ""
    for i, it in enumerate(items, 1):
        item_lines += (
            f"  {i}. {it['name']} × {it['qty']} — ${it['subtotal']:.2f}\n"
        )

    pay_label = (payment_method or "pending").replace("_", " ").title()

    text = (
        f"🛍 <b>New Order #{order_id}</b>\n"
        f"<code>{_esc(order_uid)}</code>\n\n"
        f"👤 <b>{_esc(customer_name)}</b> | 📞 {_esc(customer_phone)}\n"
        f"📍 {_esc(address_str)}\n"
        f"💳 Payment: {_esc(pay_label)}\n\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"{_esc(item_lines)}"
        f"━━━━━━━━━━━━━━━━\n"
        f"🧾 Subtotal: <b>${subtotal:.2f}</b>\n"
        f"🚚 Shipping: <b>${shipping_fee:.2f}</b>\n"
        f"💸 Fee (3%): <b>${transaction_fee:.2f}</b>\n"
        f"💰 <b>Total: ${total:.2f}</b>"
    )
    if notes:
        text += f"\n\n📝 Notes: <i>{_esc(notes)}</i>"

    # Collect valid image URLs (max 10 for media group)
    image_urls = [
        it["image_url"] for it in items
        if it.get("image_url") and it["image_url"].startswith("http")
    ][:10]

    sent = False
    if image_urls:
        sent = await _send_media_group(chat_id, image_urls, text)

    if not sent:
        await _post("sendMessage", {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        })


async def _send_media_group(chat_id: str, image_urls: List[str], caption: str) -> bool:
    """Send up to 10 product images as an album with the order caption."""
    media = []
    for idx, url in enumerate(image_urls):
        entry = {"type": "photo", "media": url}
        if idx == 0:
            # Caption only on the first photo; HTML parse mode
            entry["caption"] = caption
            entry["parse_mode"] = "HTML"
        media.append(entry)

    return await _post("sendMediaGroup", {
        "chat_id": chat_id,
        "media": media,
    })


def _esc(text: str) -> str:
    """Escape special chars for Telegram HTML parse mode."""
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
