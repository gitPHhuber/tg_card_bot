from decimal import Decimal

import httpx
import redis.asyncio as redis

from app.config import settings

_redis: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def fetch_bybit_rate() -> Decimal:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.bybit.com/v5/market/tickers",
            params={"category": "spot", "symbol": "USDTRUB"},
        )
        resp.raise_for_status()
        data = resp.json()
        return Decimal(data["result"]["list"][0]["lastPrice"])


async def get_effective_rate() -> Decimal:
    r = await get_redis()
    saved = await r.get("rate:usd_rub")
    if saved is None:
        rate = await fetch_bybit_rate()
        await r.set("rate:usd_rub", str(rate), ex=settings.rate_update_interval)
        return rate
    return Decimal(saved)


async def update_rate() -> Decimal:
    r = await get_redis()
    current_rate = await fetch_bybit_rate()
    saved_raw = await r.get("rate:usd_rub")

    if saved_raw is None:
        effective = current_rate
    else:
        saved_rate = Decimal(saved_raw)
        if current_rate > saved_rate:
            effective = current_rate
        else:
            factor = Decimal(str(settings.rate_smoothing_factor))
            effective = saved_rate * (1 - factor) + current_rate * factor

    await r.set("rate:usd_rub", str(effective), ex=settings.rate_update_interval * 2)
    return effective


def calculate_price(face_value: Decimal, rate: Decimal) -> dict:
    bitrefill_markup = Decimal(str(settings.bitrefill_markup))
    selling_markup = Decimal(str(settings.selling_markup))

    cost_usd = face_value * bitrefill_markup
    cost_rub = cost_usd * rate
    price_rub = (cost_rub * selling_markup).quantize(Decimal("1"))

    margin = (price_rub - cost_rub) / cost_rub if cost_rub else Decimal("0")

    return {
        "price_rub": price_rub,
        "cost_usd": cost_usd,
        "cost_rub": cost_rub,
        "margin": margin,
        "margin_ok": margin >= Decimal(str(settings.min_margin)),
    }
