"""initial

Revision ID: 001
Revises:
Create Date: 2026-04-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=False),
        sa.Column("username", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(512), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("referrer_id", sa.BigInteger, sa.ForeignKey("users.id"), nullable=True),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("slug", sa.String(50), unique=True, index=True),
        sa.Column("name", sa.String(255)),
        sa.Column("description", sa.Text, server_default=""),
        sa.Column("face_value_usd", sa.Numeric(10, 2)),
        sa.Column("provider", sa.String(50), server_default="bitrefill"),
        sa.Column("bitrefill_product_id", sa.String(255), server_default=""),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer, server_default="0"),
    )

    order_status = sa.Enum(
        "pending", "paid", "processing", "delivered", "failed", "refunded",
        name="orderstatus",
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.BigInteger, sa.ForeignKey("users.id"), index=True),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id")),
        sa.Column("amount_rub", sa.Numeric(12, 2)),
        sa.Column("cost_usd", sa.Numeric(10, 2)),
        sa.Column("status", order_status, server_default="pending"),
        sa.Column("payment_id", sa.String(255), nullable=True),
        sa.Column("cardholder_name", sa.String(255), server_default=""),
        sa.Column("card_number", sa.String(512), nullable=True),
        sa.Column("card_expiry", sa.String(512), nullable=True),
        sa.Column("card_cvv", sa.String(512), nullable=True),
        sa.Column("card_holder", sa.String(512), nullable=True),
        sa.Column("redemption_code", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "exchange_rates",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("rate_usd_rub", sa.Numeric(12, 4)),
        sa.Column("source", sa.String(50), server_default="bybit"),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.execute("""
        INSERT INTO products (slug, name, description, face_value_usd, bitrefill_product_id, sort_order) VALUES
        ('visa-20', 'Digital Prepaid Visa $20', 'Для подписок: ChatGPT, Spotify, Claude', 20.00, 'visa-prepaid-20', 1),
        ('visa-50', 'Digital Prepaid Visa $50', 'Для нескольких сервисов', 50.00, 'visa-prepaid-50', 2),
        ('visa-100', 'Digital Prepaid Visa $100', 'Для крупных подписок', 100.00, 'visa-prepaid-100', 3),
        ('visa-200', 'Digital Prepaid Visa $200', 'Для Pro/Premium планов', 200.00, 'visa-prepaid-200', 4)
    """)


def downgrade() -> None:
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("exchange_rates")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS orderstatus")
