from app.db.database import engine, Base
import app.models  # noqa: F401 — import all models so Base knows them


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
