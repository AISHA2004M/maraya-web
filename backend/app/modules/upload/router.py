from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.services.upload_service import save_file
from app.api.deps import get_current_user
from app.modules.users.models import User
from typing import List, Optional

router = APIRouter()


def _get_target_folder(current_user: User, custom_folder: Optional[str] = None) -> str:
    if custom_folder and custom_folder.strip():
        return custom_folder.strip().strip("/")
    if current_user.role == "partner" and current_user.brand:
        return f"{current_user.brand.slug}/products"
    if current_user.role == "partner" and current_user.brand_id:
        return f"brand_{current_user.brand_id}/products"
    if current_user.role == "admin":
        return "admin/uploads"
    return f"users/{current_user.id}/uploads"


@router.post("", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an image file to the client's dedicated directory in Supabase Storage.
    """
    target_folder = _get_target_folder(current_user, folder)
    url = await save_file(file, folder=target_folder)
    return {"url": url, "folder": target_folder}


@router.post("/bulk", status_code=201)
async def upload_images_bulk(
    files: List[UploadFile] = File(...),
    angles: Optional[List[str]] = Form(None),
    folder: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """
    Upload multiple image files to the client's dedicated directory in Supabase Storage.
    """
    target_folder = _get_target_folder(current_user, folder)
    parsed_angles = []
    if angles:
        if len(angles) == 1 and "," in angles[0]:
            parsed_angles = [a.strip() for a in angles[0].split(",")]
        else:
            parsed_angles = [a.strip() for a in angles]

    results = []
    for idx, file in enumerate(files):
        url = await save_file(file, folder=target_folder)
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
            "filename": file.filename,
            "folder": target_folder
        })
    return {"uploads": results}


