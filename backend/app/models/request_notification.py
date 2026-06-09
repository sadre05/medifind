import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base


class RequestNotification(Base):
    __tablename__ = "request_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicine_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    shop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False, index=True
    )
    distance_km: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    notified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    response: Mapped[str] = mapped_column(String(20), default="pending")
    # pending | confirmed | declined | expired
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("request_id", "shop_id", name="uq_request_shop"),
    )

    # Relationships
    request: Mapped["MedicineRequest"] = relationship("MedicineRequest", back_populates="notifications")  # noqa
    shop: Mapped["Shop"] = relationship("Shop", back_populates="notifications")  # noqa
