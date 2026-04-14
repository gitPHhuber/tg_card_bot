from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.services.pricing import calculate_price, get_effective_rate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(db: AsyncSession = Depends(get_db)):
    rate = await get_effective_rate()
    result = await db.execute(
        select(Product).where(Product.is_active == True).order_by(Product.sort_order)
    )
    products = result.scalars().all()

    items = []
    for p in products:
        pricing = calculate_price(Decimal(str(p.face_value_usd)), rate)
        items.append({
            "id": p.id,
            "slug": p.slug,
            "name": p.name,
            "description": p.description,
            "face_value_usd": float(p.face_value_usd),
            "price_rub": float(pricing["price_rub"]),
            "rate": float(rate),
        })

    return {"products": items, "rate": float(rate)}


@router.get("/{slug}")
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    rate = await get_effective_rate()
    pricing = calculate_price(Decimal(str(product.face_value_usd)), rate)

    return {
        "id": product.id,
        "slug": product.slug,
        "name": product.name,
        "description": product.description,
        "face_value_usd": float(product.face_value_usd),
        "price_rub": float(pricing["price_rub"]),
        "rate": float(rate),
    }
