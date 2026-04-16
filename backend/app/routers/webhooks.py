import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.security.encryption import encrypt
from app.services.card_service import purchase_card

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhook", tags=["webhooks"])

YUKASSA_IPS = [
    "185.71.76.",
    "185.71.77.",
    "77.75.153.",
    "77.75.156.",
    "77.75.154.",
    "77.75.155.",
    "2a02:5180::",
]


def _check_yukassa_ip(ip: str) -> bool:
    for prefix in YUKASSA_IPS:
        if ip.startswith(prefix):
            return True
    return False


async def _notify_user(user_id: int, order_id: int):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
                json={
                    "chat_id": user_id,
                    "text": (
                        "✅ Ваша карта готова!\n\n"
                        f"Заказ #{order_id}"
                    ),
                    "parse_mode": "HTML",
                    "reply_markup": {
                        "inline_keyboard": [[
                            {
                                "text": "💳 Открыть карту",
                                "web_app": {
                                    "url": f"{settings.webapp_url}/card/{order_id}"
                                },
                            }
                        ]]
                    },
                },
            )
    except Exception:
        logger.exception("Failed to notify user %s", user_id)


@router.post("/yukassa")
async def yukassa_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    if not _check_yukassa_ip(client_ip.split(",")[0].strip()):
        raise HTTPException(status_code=403, detail="Forbidden")

    body = await request.json()
    event_type = body.get("event")

    if event_type != "payment.succeeded":
        return {"status": "ignored"}

    payment_obj = body.get("object", {})
    payment_id = payment_obj.get("id")
    metadata = payment_obj.get("metadata", {})
    order_id = int(metadata.get("order_id", 0))

    if not order_id:
        raise HTTPException(status_code=400, detail="Missing order_id")

    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.PENDING:
        return {"status": "already_processed"}

    order.status = OrderStatus.PAID
    order.payment_id = payment_id
    order.paid_at = datetime.now(timezone.utc)
    await db.commit()

    order.status = OrderStatus.PROCESSING
    await db.commit()

    try:
        await db.refresh(order, ["product"])
        card_data = await purchase_card(
            product_id=order.product.bitrefill_product_id,
            face_value=float(order.product.face_value_usd),
            cardholder=order.cardholder_name,
        )

        order.card_number = encrypt(card_data.card_number)
        order.card_expiry = encrypt(card_data.card_expiry)
        order.card_cvv = encrypt(card_data.card_cvv)
        order.card_holder = card_data.card_holder
        order.redemption_code = encrypt(card_data.redemption_code)
        order.status = OrderStatus.DELIVERED
        order.delivered_at = datetime.now(timezone.utc)
        await db.commit()

        await _notify_user(order.user_id, order.id)

    except Exception:
        logger.exception("Card purchase failed for order %s", order_id)
        order.status = OrderStatus.FAILED
        await db.commit()

    return {"status": "ok"}
