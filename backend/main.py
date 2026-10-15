import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from extractor import extract_offers

app = FastAPI(title="CVS Coupon Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "datasets"
DATA_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract")
async def extract(files: list[UploadFile] = File(...)):
    if not files or len(files) > 20:
        raise HTTPException(400, "Upload 1 to 20 images")

    all_offers = []
    errors = []

    for file in files:
        filename = file.filename or "unnamed"

        if file.content_type not in ALLOWED_TYPES:
            errors.append(f"{filename}: unsupported format")
            continue

        contents = await file.read(MAX_FILE_SIZE + 1)

        if len(contents) > MAX_FILE_SIZE:
            errors.append(f"{filename}: file exceeds 10 MB")
            continue

        try:
            offers = extract_offers(
                contents,
                file.content_type,
            )

            for offer in offers:
                offer["source_image"] = filename
                offer["id"] = str(uuid4())
                offer["reviewed"] = False

            all_offers.extend(offers)

        except Exception as e:
            import traceback

            print(f"\nERROR extracting {filename}:")
            traceback.print_exc()

            errors.append(f"{filename}: {str(e)}")

    result = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "offers": all_offers,
        "errors": errors,
    }

    dataset_id = uuid4().hex
    output_path = DATA_DIR / f"{dataset_id}.json"

    output_path.write_text(
        json.dumps(result, indent=2),
        encoding="utf-8",
    )

    return {
        "dataset_id": dataset_id,
        "offer_count": len(all_offers),
        **result,
    }
