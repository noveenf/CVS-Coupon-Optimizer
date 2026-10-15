from ollama import chat
from pydantic import BaseModel


class Offer(BaseModel):
    product_name: str
    sale_price: float | None = None
    coupon: str | None = None
    promotion: str | None = None
    extrabucks_reward: float | None = None


class ExtractionResult(BaseModel):
    offers: list[Offer]


PROMPT = """
Analyze this CVS weekly advertisement.

Extract all visible product promotions.

Return JSON matching the provided schema.

For each offer:
- product_name: Product or brand name
- sale_price: Advertised price, if visible
- coupon: Coupon information as a short string
- promotion: Buy X, spend X, or other promotion
- extrabucks_reward: Dollar value of rewards offered

Rules:
- Never invent missing values.
- Use null for unknown information.
- Keep strings short.
- Do not calculate prices.
- Do not include explanations outside the JSON.
"""


def extract_offers(image_bytes: bytes, mime_type: str):
    response = chat(
        model="qwen2.5vl:7b",
        messages=[
            {
                "role": "user",
                "content": PROMPT,
                "images": [image_bytes],
            }
        ],
        format=ExtractionResult.model_json_schema(),
        options={
            "temperature": 0,
            "num_predict": 8192,
            "num_ctx": 8192,
        },
    )

    print("Stop reason:", response.done_reason)
    print("Output tokens:", response.eval_count)
    print("Response length:", len(response.message.content))

    if response.done_reason == "length":
        raise ValueError("Ollama reached the output token limit")

    result = ExtractionResult.model_validate_json(response.message.content)

    return [offer.model_dump() for offer in result.offers]
