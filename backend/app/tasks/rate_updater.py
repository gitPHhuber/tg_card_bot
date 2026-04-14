import asyncio
import logging

from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.exchange_rate import ExchangeRate
from app.models.product import Product
from app.services.pricing import calculate_price, update_rate

logger = logging.getLogger(__name__)


async def rate_update_loop():
    while True:
        try:
            rate = await update_rate()
            logger.info("Rate updated: %s", rate)

            async with async_session() as session:
                session.add(ExchangeRate(rate_usd_rub=float(rate), source="bybit"))
                await session.commit()

                result = await session.execute(select(Product))
                products = result.scalars().all()
                for product in products:
                    from decimal import Decimal
                    pricing = calculate_price(Decimal(str(product.face_value_usd)), rate)
                    if not pricing["margin_ok"] and product.is_active:
                        product.is_active = False
                        logger.warning("Disabled product %s: margin too low", product.slug)
                    elif pricing["margin_ok"] and not product.is_active:
                        product.is_active = True
                        logger.info("Re-enabled product %s", product.slug)
                await session.commit()

        except Exception:
            logger.exception("Rate update failed")

        await asyncio.sleep(settings.rate_update_interval)
