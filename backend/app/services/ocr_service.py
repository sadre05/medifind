import re
import base64
from pathlib import Path
from app.config import settings


def _clean_line(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"[^a-zA-Z0-9\s\-\./(),%]", "", raw)
    raw = re.sub(r"\s+", " ", raw)
    return raw.strip()


def _extract_from_text(text: str) -> list:
    medicines = []
    seen = set()
    lines = text.split("\n")
    for line in lines:
        cleaned = _clean_line(line)
        if len(cleaned) < 3:
            continue
        lower = cleaned.lower()
        skip_words = ["date", "doctor", "patient", "name", "age", "address", "signature", "rx", "dr.", "hospital", "clinic"]
        if any(w in lower for w in skip_words):
            continue
        if cleaned not in seen:
            seen.add(cleaned)
            medicines.append(cleaned)
    return medicines


async def extract_medicines_from_image(file_path: str) -> list:
    if settings.OCR_BACKEND == "openai":
        return await _extract_openai(file_path)
    else:
        return _extract_tesseract(file_path)


def _extract_tesseract(file_path: str) -> list:
    try:
        import pytesseract
        from PIL import Image

        path = Path(file_path)
        if path.suffix.lower() == ".pdf":
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(file_path, first_page=1, last_page=1)
                img = images[0]
            except ImportError:
                return ["PDF support not available - please upload an image"]
        else:
            img = Image.open(file_path)

        img = img.convert("L")
        text = pytesseract.image_to_string(img, config="--psm 6")
        results = _extract_from_text(text)
        if not results:
            return ["No text detected - please upload a clearer image"]
        return results
    except Exception as e:
        return [f"OCR error: {str(e)}"]


async def _extract_openai(file_path: str) -> list:
    try:
        import httpx
        import json

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
                    "messages": [{
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{media_type};base64,{b64}"},
                            },
                            {
                                "type": "text",
                                "text": "This is a medical prescription. Extract ONLY the medicine/drug names with dosage if present. Return a JSON array of strings. Example: [\"Paracetamol 500mg\", \"Amoxicillin 250mg\"]. Return ONLY the JSON array, nothing else."
                            }
                        ]
                    }],
                    "max_tokens": 500,
                },
                timeout=30,
            )
            data = response.json()
            raw = data["choices"][0]["message"]["content"].strip()
            return json.loads(raw)
    except Exception as e:
        return [f"OpenAI OCR error: {str(e)}"]
