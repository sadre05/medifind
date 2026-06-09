import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, Integer, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base


class MedicineRequest(Base):
    __tablename__ = "medicine_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # What was searched — either typed name or list from prescription
    medicine_names: Mapped[list | None] = mapped_column(JSON, nullable=True)  # list of medicine names
    prescription_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # GPS snapshot at time of search
    search_lat: Mapped[float] = mapped_column(Numeric(10, 8), nullable=False)
    search_lng: Mapped[float] = mapped_column(Numeric(11, 8), nullable=False)
    radius_km: Mapped[float] = mapped_column(Numeric(4, 1), default=5.0)

    status: Mapped[str] = mapped_column(
        String(20), default="pending",
        # pending | fulfilled | expired | cancelled
    )
    shops_notified: Mapped[int] = mapped_column(Integer, default=0)
    fulfilled_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shops.id"), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="requests")  # noqa
    notifications: Mapped[list["RequestNotification"]] = relationship(  # noqa
        "RequestNotification", back_populates="request", cascade="all, delete-orphan"
    )
    prescription: Mapped["Prescription | None"] = relationship("Prescription", back_populates="request", uselist=False)  # noqa
    order: Mapped["Order | None"] = relationship("Order", back_populates="request", uselist=False)  # noqa
