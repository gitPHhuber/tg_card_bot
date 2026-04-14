from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.security.encryption import decrypt
from app.security.telegram import get_telegram_user
from app.services.payment import create_payment
from app.services.pricing import calculate_price, get_effective_rate

router = APIRouter(prefix="/api/orders", tags=["orders"])


class CreateOrderRequest(BaseModel):
    product_slug: str
    cardholder_name: str


@router.post("")
async def create_order(
    body: CreateOrderRequest,
    tg_user: dict = Depends(get_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.slug == body.product_slug, Product.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unavailable")

    user_id = tg_user["id"]
    user = await db.get(User, user_id)
    if not user:
        user = User(
            id=user_id,
            username=tg_user.get("username"),
            full_name=f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip(),
        )
        db.add(user)
        await db.flush()

    rate = await get_effective_rate()
    pricing = calculate_price(Decimal(str(product.face_value_usd)), rate)

    if not pricing["margin_ok"]:
        raise HTTPException(status_code=503, detail="Product temporarily unavailable")

    order = Order(
        user_id=user_id,
        product_id=product.id,
        amount_rub=float(pricing["price_rub"]),
        cost_usd=float(pricing["cost_usd"]),
        cardholder_name=body.cardholder_name.upper(),
        status=OrderStatus.PENDING,
    )
    db.add(order)
    await db.flush()

    bot_username = settings.webapp_url.split("/")[-1] if "/" in settings.webapp_url else "bot"
    return_url = f"https://t.me/{bot_username}/app?startapp=order_{order.id}"

    payment = create_payment(
        amount_rub=pricing["price_rub"],
        order_id=order.id,
        face_value=int(product.face_value_usd),
        return_url=return_url,
    )

    order.payment_id = payment["payment_id"]
    await db.commit()

    return {
        "order_id": order.id,
        "payment_url": payment["confirmation_url"],
        "amount_rub": float(pricing["price_rub"]),
    }


@router.get("")
async def list_orders(
    tg_user: dict = Depends(get_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = tg_user["id"]
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    items = []
    for o in orders:
        await db.refresh(o, ["product"])
        items.append({
            "id": o.id,
            "product_name": o.product.name if o.product else "",
            "face_value_usd": float(o.product.face_value_usd) if o.product else 0,
            "amount_rub": float(o.amount_rub),
            "status": o.status.value,
            "created_at": o.created_at.isoformat(),
            "has_card": o.status == OrderStatus.DELIVERED,
        })

    return {"orders": items}


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    tg_user: dict = Depends(get_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(Order, order_id)
    if not order or order.user_id != tg_user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.refresh(order, ["product"])

    return {
        "id": order.id,
        "product_name": order.product.name if order.product else "",
        "face_value_usd": float(order.product.face_value_usd) if order.product else 0,
        "amount_rub": float(order.amount_rub),
        "status": order.status.value,
        "created_at": order.created_at.isoformat(),
        "has_card": order.status == OrderStatus.DELIVERED,
    }


@router.post("/{order_id}/card")
async def get_card_details(
    order_id: int,
    tg_user: dict = Depends(get_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(Order, order_id)
    if not order or order.user_id != tg_user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Card not ready")

    return {
        "card_number": decrypt(order.card_number) if order.card_number else "",
        "card_expiry": decrypt(order.card_expiry) if order.card_expiry else "",
        "card_cvv": decrypt(order.card_cvv) if order.card_cvv else "",
        "card_holder": order.cardholder_name,
    }
