from decimal import Decimal

from yookassa import Configuration, Payment

from app.config import settings

Configuration.account_id = settings.yukassa_shop_id
Configuration.secret_key = settings.yukassa_secret_key


def create_payment(
    amount_rub: Decimal,
    order_id: int,
    face_value: int,
    return_url: str,
) -> dict:
    payment = Payment.create(
        {
            "amount": {"value": str(amount_rub), "currency": "RUB"},
            "confirmation": {"type": "redirect", "return_url": return_url},
            "capture": True,
            "description": f"Digital Prepaid Visa ${face_value}",
            "metadata": {"order_id": str(order_id)},
            "receipt": {
                "customer": {"email": "receipt@example.com"},
                "items": [
                    {
                        "description": "Информационная услуга по подбору платёжного решения",
                        "quantity": "1.00",
                        "amount": {"value": str(amount_rub), "currency": "RUB"},
                        "vat_code": 1,
                    }
                ],
            },
        }
    )

    return {
        "payment_id": payment.id,
        "confirmation_url": payment.confirmation.confirmation_url,
    }
