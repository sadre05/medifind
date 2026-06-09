import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, ForeignKey, func, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicine_requests.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    shop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shops.id"), nullable=False)
    items: Mapped[list] = mapped_column(JSON, nullable=False)  # [{name, qty, price}]
    total_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    fulfillment: Mapped[str] = mapped_column(String(20), default="pickup")  # pickup | delivery
    status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending | ready | completed | cancelled
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    request: Mapped["MedicineRequest"] = relationship("MedicineRequest", back_populates="order")  # noqa
    shop: Mapped["Shop"] = relationship("Shop", back_populates="orders")  # noqa
