import httpx

from app.config import settings
from app.providers.base import CardData, CardProvider


class BitrefillProvider(CardProvider):
    BASE_URL = "https://api.bitrefill.com/v2"

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {settings.bitrefill_api_key}"}

    async def buy_card(self, product_id: str, face_value: float, cardholder: str) -> CardData:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.BASE_URL}/orders",
                headers=self._headers(),
                json={
                    "products": [
                        {"product_id": product_id, "quantity": 1, "value": face_value}
                    ],
                    "payment_method": "balance",
                },
            )
            resp.raise_for_status()
            order = resp.json()
            order_id = order["id"]

            detail_resp = await client.get(
                f"{self.BASE_URL}/orders/{order_id}",
                headers=self._headers(),
            )
            detail_resp.raise_for_status()
            data = detail_resp.json()

            item = data["products"][0]
            redemption = item.get("redemptionInfo", {})

            return CardData(
                card_number=redemption.get("cardNumber", ""),
                card_expiry=redemption.get("expirationDate", ""),
                card_cvv=redemption.get("cvv", ""),
                card_holder=cardholder.upper(),
                redemption_code=redemption.get("pin", item.get("redemptionCode", "")),
            )
