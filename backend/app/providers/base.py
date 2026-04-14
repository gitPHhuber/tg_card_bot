from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class CardData:
    card_number: str
    card_expiry: str
    card_cvv: str
    card_holder: str
    redemption_code: str


class CardProvider(ABC):
    @abstractmethod
    async def buy_card(self, product_id: str, face_value: float, cardholder: str) -> CardData:
        ...
