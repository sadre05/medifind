from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.prescription import Prescription
from app.services.ocr_service import extract_medicines_from_image
from app.utils.file_upload import save_file

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])


@router.post("/upload")
async def upload_prescription(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a prescription image or PDF.
    Returns: file_url, prescription_id, and extracted medicine list (editable by user).
    """
    try:
        file_url, local_path = await save_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Run OCR
    extracted = await extract_medicines_from_image(local_path)

    # Save to DB
    presc = Prescription(
        user_id=user.id,
        file_url=file_url,
        file_type=file.content_type,
        extracted_items=extracted,
    )
    db.add(presc)
    await db.flush()
    await db.refresh(presc)

    return {
        "prescription_id": str(presc.id),
        "file_url": file_url,
        "extracted_medicines": extracted,  # User reviews + edits this list in frontend
        "count": len(extracted),
    }
