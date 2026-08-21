from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.stylist.schemas import StylistChatRequest, StylistChatResponse
from app.modules.stylist import service

router = APIRouter()


@router.post("/chat", response_model=StylistChatResponse)
def chat_with_stylist(request: StylistChatRequest, db: Session = Depends(get_db)):
    """Interactive conversational AI Fashion Stylist offering curated looks and recommendations."""
    return service.get_stylist_advice(db, request)
