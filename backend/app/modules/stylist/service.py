import os
import json
import httpx
from sqlalchemy.orm import Session, joinedload
from app.modules.products.models import Product, Brand
from app.modules.stylist.schemas import StylistChatRequest, StylistChatResponse, StylistProductRecommendation
from app.core.config import settings
from decimal import Decimal
from typing import List


def get_stylist_advice(db: Session, request: StylistChatRequest) -> StylistChatResponse:
    user_prompt = request.message.strip()
    
    # Query catalog products to give to the LLM or matching engine with eager loading
    products = (
        db.query(Product)
        .options(joinedload(Product.brand), joinedload(Product.category))
        .filter(Product.is_active == True)
        .limit(40)
        .all()
    )

    
    catalog_summary = []
    for p in products:
        catalog_summary.append({
            "id": str(p.id),
            "name": p.name,
            "brand": p.brand.name if p.brand else "Atelier",
            "price": float(p.price),
            "category": p.category.name if p.category else "",
            "tags": p.editorial_tags or "",
            "gender": p.gender or "unisex",
            "image": p.main_image_url
        })

    # Try calling OpenRouter or Gemini for luxury conversational styling
    api_key = settings.OPENROUTER_API_KEY or settings.GEMINI_API_KEY
    if api_key and not api_key.startswith("mock_"):
        system_prompt = (
            "You are 'Vrital Haute Couture Stylist', an elite fashion advisor at a luxury fashion house. "
            "Your tone is elegant, knowledgeable, refined, and helpful. "
            "You recommend personalized outfits from our curated digital catalog based on the client's mood, occasion, or request. "
            "Analyze the client's request and select 1 to 3 best matching items from the provided catalog JSON. "
            "Respond ONLY with a valid JSON object matching this schema:\n"
            "{\n"
            '  "reply": "Your conversational advice in the same language as the user (English or Arabic)...",\n'
            '  "look_title": "e.g. Parisian Sunset Elegance",\n'
            '  "style_archetype": "e.g. Stealth Wealth / Minimalist Chic",\n'
            '  "recommended_product_ids": ["product-uuid-1", "product-uuid-2"],\n'
            '  "reasons": {"product-uuid-1": "Why this piece works"}\n'
            "}\n"
            f"CATALOG:\n{json.dumps(catalog_summary[:25], ensure_ascii=False)}"
        )

        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "meta-llama/llama-3.3-70b-instruct:free",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"}
            }
            with httpx.Client(timeout=12.0) as client:
                res = client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                if res.status_code == 200:
                    resp_json = res.json()
                    content = resp_json["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    
                    rec_ids = parsed.get("recommended_product_ids", [])
                    reasons = parsed.get("reasons", {})
                    
                    matched_items = []
                    for pid in rec_ids:
                        for p in products:
                            if str(p.id) == str(pid):
                                matched_items.append(StylistProductRecommendation(
                                    id=str(p.id),
                                    name=p.name,
                                    price=p.price,
                                    brand_name=p.brand.name if p.brand else "Atelier",
                                    main_image_url=p.main_image_url,
                                    editorial_tags=p.editorial_tags,
                                    reason=reasons.get(str(p.id), "Curated for your aesthetic")
                                ))
                                break

                    return StylistChatResponse(
                        reply=parsed.get("reply", "Here are curated pieces for your wardrobe."),
                        look_title=parsed.get("look_title", "Curated Atelier Edit"),
                        style_archetype=parsed.get("style_archetype", "High Fashion"),
                        recommendations=matched_items if matched_items else _fallback_recommendations(products, user_prompt)
                    )
        except Exception as e:
            print(f"Stylist LLM API call error, using smart fallback: {e}")

    # Smart Rule-Based Fashion Heuristic Fallback
    return _smart_fashion_heuristic(products, user_prompt)


def _smart_fashion_heuristic(products: List[Product], prompt: str) -> StylistChatResponse:
    prompt_lower = prompt.lower()
    is_arabic = any('\u0600' <= char <= '\u06FF' for char in prompt)

    matched = []
    for p in products:
        score = 0
        p_name = p.name.lower()
        p_tags = (p.editorial_tags or "").lower()
        
        if any(w in prompt_lower for w in ["formal", "evening", "سهرة", "رسمي", "فستان", "بدلة", "dress", "suit"]):
            if "formal" in p_tags or "evening" in p_tags or "dress" in p_name or "suit" in p_name:
                score += 3
        if any(w in prompt_lower for w in ["summer", "صيف", "casual", "يومي", "linen", "كتان"]):
            if "summer" in p_tags or "casual" in p_tags or "linen" in p_name:
                score += 3
        if any(w in prompt_lower for w in ["stealth wealth", "quiet luxury", "فاخر", "هادئ"]):
            if "stealth" in p_tags or "luxury" in p_tags:
                score += 3

        if score > 0 or len(matched) < 3:
            matched.append((score, p))

    matched.sort(key=lambda x: x[0], reverse=True)
    top_prods = [x[1] for x in matched[:3]]

    recs = [
        StylistProductRecommendation(
            id=str(p.id),
            name=p.name,
            price=p.price,
            brand_name=p.brand.name if p.brand else "Atelier",
            main_image_url=p.main_image_url,
            editorial_tags=p.editorial_tags,
            reason="Exquisite drape and silhouette tailoring." if not is_arabic else "قصة انسيابية راقية تناسب قوامك."
        ) for p in top_prods
    ]

    reply = (
        f"لقد اخترت لك هذه التشكيلة المتناسقة التي تلبي طلبك بدقة وتمنحك إطلالة راقية. يمكنك تجربة أي قطعة افتراضياً على قوامك."
        if is_arabic else
        f"I have curated these signature pieces tailored to your aesthetic. You can instantly try them on virtually on your silhouette."
    )

    return StylistChatResponse(
        reply=reply,
        look_title="Signature Atelier Selection" if not is_arabic else "إطلالة الأتيلييه المختارة",
        style_archetype="Contemporary Haute Couture",
        recommendations=recs
    )


def _fallback_recommendations(products: List[Product], prompt: str) -> List[StylistProductRecommendation]:
    return [
        StylistProductRecommendation(
            id=str(p.id),
            name=p.name,
            price=p.price,
            brand_name=p.brand.name if p.brand else "Atelier",
            main_image_url=p.main_image_url,
            editorial_tags=p.editorial_tags,
            reason="Curated luxury piece."
        ) for p in products[:3]
    ]
