"""
OCR Service — extracts medicine names from prescription images/PDFs.
Supports two backends:
  1. tesseract  — free, local, runs offline
  2. openai     — GPT-4 Vision, more accurate for handwritten/complex prescriptions
"""
import re
import base64
from pathlib import Path
from app.config import settings


MEDICINE_KEYWORDS = [
    "tab", "tablet", "cap", "capsule", "syrup", "inj", "injection",
    "mg", "ml", "mcg", "iu", "drops", "cream", "gel", "ointment",
]


def _clean_medicine_name(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"[^a-zA-Z0-9\s\-\./()]", "", raw)
    raw = re.sub(r"\s+", " ", raw)
    return raw.strip()


def _extract_from_text(text: str) -> list[str]:
    """Heuristic extraction from raw OCR text."""
    medicines = []
    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        if len(line) < 3:
            continue
        lower = line.lower()
        if any(kw in lower for kw in MEDICINE_KEYWORDS):
            cleaned = _clean_medicine_name(line)
            if cleaned and len(cleaned) > 3:
                medicines.append(cleaned)
    return medicines


async def extract_medicines_from_image(file_path: str) -> list[str]:
    """Main entry point — routes to correct backend."""
    if settings.OCR_BACKEND == "openai":
        return await _extract_openai(file_path)
    else:
        return _extract_tesseract(file_path)


def _extract_tesseract(file_path: str) -> list[str]:
    try:
        import pytesseract
        from PIL import Image

        path = Path(file_path)
        if path.suffix.lower() == ".pdf":
            # Convert PDF first page to image
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(file_path, first_page=1, last_page=1)
                img = images[0]
            except ImportError:
                return ["pdf2image not installed — install it to parse PDF prescriptions"]
        else:
            img = Image.open(file_path)

        text = pytesseract.image_to_string(img)
        return _extract_from_text(text)
    except Exception as e:
        return [f"OCR error: {str(e)}"]


async def _extract_openai(file_path: str) -> list[str]:
    try:
        import httpx

        with open(file_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()

        ext = Path(file_path).suffix.lower().lstrip(".")
        media_type = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:{media_type};base64,{b64}"},
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "This is a medical prescription. "
                                        "Extract ONLY the medicine/drug names with dosage if present. "
                                        "Return a JSON array of strings. "
                                        'Example: ["Paracetamol 500mg", "Amoxicillin 250mg x3"]. '
                                        "Return ONLY the JSON array, nothing else."
                                    ),
                                },
                            ],
                        }
                    ],
                    "max_tokens": 500,
                },
                timeout=30,
            )
            data = response.json()
            raw = data["choices"][0]["message"]["content"].strip()
            import json
            return json.loads(raw)
    except Exception as e:
        return [f"OpenAI OCR error: {str(e)}"]
