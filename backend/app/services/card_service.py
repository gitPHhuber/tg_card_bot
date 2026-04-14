import logging

from app.providers.base import CardData, CardProvider
from app.providers.bitrefill import BitrefillProvider
from app.providers.reloadly import ReloadlyProvider

logger = logging.getLogger(__name__)

_primary: CardProvider = BitrefillProvider()
_fallback: CardProvider = ReloadlyProvider()


async def purchase_card(product_id: str, face_value: float, cardholder: str) -> CardData:
    try:
        return await _primary.buy_card(product_id, face_value, cardholder)
    except Exception:
        logger.exception("Primary provider failed, trying fallback")
        return await _fallback.buy_card(product_id, face_value, cardholder)
