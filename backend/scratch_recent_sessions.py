from app.core.database import SessionLocal
from app.modules.tryon.models import TryOnSession

db = SessionLocal()
sessions = db.query(TryOnSession).order_by(TryOnSession.created_at.desc()).limit(5).all()
print("Recent sessions in DB:")
for s in sessions:
    print(f"ID: {s.id} | Status: {s.status} | Progress: {s.progress} | Created At: {s.created_at} | Error: {getattr(s, 'error_message', 'N/A')}")
db.close()
