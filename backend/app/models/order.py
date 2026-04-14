import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    DELIVERED = "delivered"
    FAILED = "failed"
    REFUNDED = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"))
    amount_rub: Mapped[float] = mapped_column(Numeric(12, 2))
    cost_usd: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    payment_id: Mapped[str | None] = mapped_column(String(255))
    cardholder_name: Mapped[str] = mapped_column(String(255), default="")

    card_number: Mapped[str | None] = mapped_column(String(512))
    card_expiry: Mapped[str | None] = mapped_column(String(512))
    card_cvv: Mapped[str | None] = mapped_column(String(512))
    card_holder: Mapped[str | None] = mapped_column(String(512))
    redemption_code: Mapped[str | None] = mapped_column(String(1024))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="orders")
    product: Mapped["Product"] = relationship()
