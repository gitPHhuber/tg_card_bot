from fastapi import APIRouter

from app.services.pricing import get_effective_rate

router = APIRouter(prefix="/api/rate", tags=["rate"])


@router.get("")
async def get_rate():
    rate = await get_effective_rate()
    return {"rate_usd_rub": float(rate)}
