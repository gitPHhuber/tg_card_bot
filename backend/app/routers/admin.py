from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.services.pricing import calculate_price, get_effective_rate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    users_total = (await db.execute(select(func.count(User.id)))).scalar() or 0
    users_today = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )).scalar() or 0

    orders_total = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    orders_delivered = (await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.DELIVERED)
    )).scalar() or 0
    orders_pending = (await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    )).scalar() or 0
    orders_failed = (await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.FAILED)
    )).scalar() or 0

    revenue_total = (await db.execute(
        select(func.sum(Order.amount_rub)).where(Order.status == OrderStatus.DELIVERED)
    )).scalar() or 0

    revenue_today = (await db.execute(
        select(func.sum(Order.amount_rub)).where(
            Order.status == OrderStatus.DELIVERED,
            Order.delivered_at >= today_start,
        )
    )).scalar() or 0

    cost_total = (await db.execute(
        select(func.sum(Order.cost_usd)).where(Order.status == OrderStatus.DELIVERED)
    )).scalar() or 0

    rate = await get_effective_rate()
    profit_total = float(revenue_total) - float(cost_total) * float(rate)

    return {
        "users_total": users_total,
        "users_today": users_today,
        "orders_total": orders_total,
        "orders_delivered": orders_delivered,
        "orders_pending": orders_pending,
        "orders_failed": orders_failed,
        "revenue_today": float(revenue_today),
        "revenue_total": float(revenue_total),
        "profit_total": profit_total,
    }


@router.get("/orders")
async def recent_orders(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(limit)
    )
    orders = result.scalars().all()

    items = []
    for o in orders:
        await db.refresh(o, ["product"])
        items.append({
            "id": o.id,
            "user_id": o.user_id,
            "face_value": float(o.product.face_value_usd) if o.product else 0,
            "amount_rub": float(o.amount_rub),
            "cost_usd": float(o.cost_usd),
            "status": o.status.value,
            "created_at": o.created_at.isoformat(),
        })

    return {"orders": items}


@router.get("/users/{user_id}/orders")
async def user_orders(
    user_id: int,
    delivered_only: bool = False,
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.user_id == user_id)
    if delivered_only:
        query = query.where(Order.status == OrderStatus.DELIVERED)
    query = query.order_by(Order.created_at.desc()).limit(limit)

    result = await db.execute(query)
    orders = result.scalars().all()

    items = []
    for o in orders:
        await db.refresh(o, ["product"])
        items.append({
            "id": o.id,
            "product_name": o.product.name if o.product else "",
            "face_value": float(o.product.face_value_usd) if o.product else 0,
            "amount_rub": float(o.amount_rub),
            "status": o.status.value,
            "created_at": o.created_at.isoformat(),
        })

    return {"orders": items}


@router.get("/pricing")
async def pricing_info(db: AsyncSession = Depends(get_db)):
    rate = await get_effective_rate()

    result = await db.execute(select(Product).order_by(Product.sort_order))
    products = result.scalars().all()

    items = []
    for p in products:
        pricing = calculate_price(Decimal(str(p.face_value_usd)), rate)
        items.append({
            "slug": p.slug,
            "face_value": float(p.face_value_usd),
            "price_rub": float(pricing["price_rub"]),
            "cost_rub": float(pricing["cost_rub"]),
            "margin": float(pricing["margin"]),
            "is_active": p.is_active,
        })

    return {
        "rate": float(rate),
        "source": "bybit",
        "products": items,
    }


@router.post("/products/{slug}/activate")
async def activate_product(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if not product:
        return {"error": "not found"}
    product.is_active = True
    await db.commit()
    return {"ok": True, "slug": slug, "is_active": True}


@router.post("/products/{slug}/deactivate")
async def deactivate_product(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if not product:
        return {"error": "not found"}
    product.is_active = False
    await db.commit()
    return {"ok": True, "slug": slug, "is_active": False}
