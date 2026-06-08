from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.services.upload_service import save_file
from app.api.deps import get_current_user
from app.modules.users.models import User
from typing import List, Optional

router = APIRouter()


@router.post("", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an image file. Returns the public URL of the uploaded image.
    Supports S3 with automatic fallback to local serving folder for development.
    """
    url = await save_file(file)
    return {"url": url}


@router.post("/bulk", status_code=201)
async def upload_images_bulk(
    files: List[UploadFile] = File(...),
    angles: Optional[List[str]] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """
    Upload multiple image files, matching them to specified or auto-detected angles.
    """
    parsed_angles = []
    if angles:
        if len(angles) == 1 and "," in angles[0]:
            parsed_angles = [a.strip() for a in angles[0].split(",")]
        else:
            parsed_angles = [a.strip() for a in angles]

    results = []
    for idx, file in enumerate(files):
        url = await save_file(file)
        angle = None
        if idx < len(parsed_angles):
            angle = parsed_angles[idx]
        else:
            fname = file.filename.lower()
            if "front" in fname:
                angle = "front"
            elif "back" in fname:
                angle = "back"
            elif "side" in fname:
                angle = "side"
            elif "detail" in fname:
                angle = "detail"
            else:
                default_angles = ["front", "back", "side", "detail"]
                angle = default_angles[idx % 4]
        results.append({
            "url": url,
            "angle": angle,
            "filename": file.filename
        })
    return {"uploads": results}

