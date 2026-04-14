import httpx

from app.config import settings
from app.providers.base import CardData, CardProvider


class ReloadlyProvider(CardProvider):
    BASE_URL = "https://giftcards.reloadly.com"
    AUTH_URL = "https://auth.reloadly.com/oauth/token"

    async def _get_token(self) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                self.AUTH_URL,
                json={
                    "client_id": settings.reloadly_client_id,
                    "client_secret": settings.reloadly_client_secret,
                    "grant_type": "client_credentials",
                    "audience": self.BASE_URL,
                },
            )
            resp.raise_for_status()
            return resp.json()["access_token"]

    async def buy_card(self, product_id: str, face_value: float, cardholder: str) -> CardData:
        token = await self._get_token()
        headers = {"Authorization": f"Bearer {token}"}

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.BASE_URL}/orders",
                headers=headers,
                json={
                    "productId": int(product_id),
                    "quantity": 1,
                    "unitPrice": face_value,
                    "customIdentifier": f"card-{product_id}-{face_value}",
                },
            )
            resp.raise_for_status()
            data = resp.json()

            card_info = data.get("redeemCode", {})

            return CardData(
                card_number=card_info.get("cardNumber", ""),
                card_expiry=card_info.get("expirationDate", ""),
                card_cvv=card_info.get("cvv", ""),
                card_holder=cardholder.upper(),
                redemption_code=card_info.get("pinCode", ""),
            )
