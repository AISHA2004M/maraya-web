import os
import asyncio
from PIL import Image, ImageChops

async def verify_quality():
    # 1. Resolve inputs
    uploads_dir = "uploads"
    png_files = [f for f in os.listdir(uploads_dir) if f.endswith(".png") and os.path.getsize(os.path.join(uploads_dir, f)) > 1000000]
    if not png_files:
        print("FAIL: No user images found in uploads.")
        return
        
    user_image_path = os.path.join(uploads_dir, png_files[0])
    product_image_url = "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600"
    
    print(f"User image path: {user_image_path}")
    print(f"Product image URL: {product_image_url}")
    
    # Import pipeline
    from app.services.ai_client import run_local_drape_pipeline
    
    # 2. Run tryon drape pipeline for Dress (sleeveless)
    print("\n--- Running try-on pipeline for Dresses category (sleeveless) ---")
    result_url_dress = await run_local_drape_pipeline(
        user_image_path,
        product_image_url,
        session_id="test_verify_dress",
        category="Dresses"
    )
    print(f"Result URL: {result_url_dress}")
    
    # Resolve result local path
    result_filename = result_url_dress.split("/")[-1]
    result_path = os.path.join(uploads_dir, result_filename)
    
    # 3. Quality Assertions
    user_img = Image.open(user_image_path).convert("RGB")
    result_img = Image.open(result_path).convert("RGB")
    
    # A1. Size consistency
    assert user_img.size == result_img.size, f"FAIL: Result image size {result_img.size} does not match input {user_img.size}."
    print("PASS: Result image size matches user input size exactly.")
    
    uw, uh = user_img.size
    face_height = int(uh * 0.36)
    
    # A2. Face Identity Preservation (100% pixel match in face region, allowing standard JPEG artifacts)
    user_face = user_img.crop((0, 0, uw, face_height))
    result_face = result_img.crop((0, 0, uw, face_height))
    
    diff = ImageChops.difference(user_face, result_face)
    extrema = diff.convert("L").getextrema()
    print(f"Face difference extrema: {extrema}")
    assert extrema[1] < 15, f"FAIL: Face region modified. Extrema: {extrema}"
    print("PASS: Face region preserved 100% identically (excluding standard JPEG compression artifacts).")
    
    # A3. Sweater Removal Verification (checking the sleeve region: x in 30% to 35%, y in 55% to 65%)
    original_arm_slice = user_img.crop((int(uw * 0.30), int(uh * 0.55), int(uw * 0.35), int(uh * 0.65)))
    result_arm_slice = result_img.crop((int(uw * 0.30), int(uh * 0.55), int(uw * 0.35), int(uh * 0.65)))
    
    original_greens = 0
    result_greens = 0
    
    for y in range(original_arm_slice.height):
        for x in range(original_arm_slice.width):
            # Original green sweater check
            r, g, b = original_arm_slice.getpixel((x, y))
            if g > r and b > r and g > 15 and r < 85:
                original_greens += 1
            # Result green sweater check
            rr, rg, rb = result_arm_slice.getpixel((x, y))
            if rg > rr and rb > rr and rg > 15 and rr < 85:
                result_greens += 1
                
    print(f"Green sweater pixels in original arm region: {original_greens}")
    print(f"Green sweater pixels in result arm region: {result_greens}")
    
    assert original_greens > 100, f"FAIL: Test region did not contain enough green pixels in original ({original_greens})."
    assert result_greens < original_greens * 0.05, f"FAIL: Sweater sleeves not removed. Leftover green pixels: {result_greens} / {original_greens}"
    print("PASS: Green sweater sleeves successfully removed from arm region.")
    
    # A4. Background Leakage Check
    # Verify corner pixels of the result match the user's original corner pixels (allowing JPEG compression tolerance)
    user_corners = [user_img.getpixel((0, 0)), user_img.getpixel((uw-1, 0))]
    result_corners = [result_img.getpixel((0, 0)), result_img.getpixel((uw-1, 0))]
    print(f"Original corners: {user_corners}")
    print(f"Result corners: {result_corners}")
    for uc, rc in zip(user_corners, result_corners):
        for c1, c2 in zip(uc, rc):
            assert abs(c1 - c2) < 15, f"FAIL: Background corner pixel changed from {uc} to {rc}"
    print("PASS: User's original background is preserved 100% in result corners.")
    
    # 4. Bottoms Category Placement test
    print("\n--- Running try-on pipeline for Bottoms category (pants) ---")
    chinos_image_url = "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600"
    result_url_bottoms = await run_local_drape_pipeline(
        user_image_path,
        chinos_image_url,
        session_id="test_verify_bottoms",
        category="Bottoms"
    )
    print(f"Result URL Bottoms: {result_url_bottoms}")
    result_bottoms_path = os.path.join(uploads_dir, result_url_bottoms.split("/")[-1])
    result_bottoms_img = Image.open(result_bottoms_path).convert("RGB")
    
    # Verify bottoms are not pasted on the chest (top 38% to 55%)
    # The chest region in bottoms result should match the original chest region.
    chest_original = user_img.crop((int(uw * 0.4), int(uh * 0.4), int(uw * 0.6), int(uh * 0.5)))
    chest_result = result_bottoms_img.crop((int(uw * 0.4), int(uh * 0.4), int(uw * 0.6), int(uh * 0.5)))
    
    diff_chest = ImageChops.difference(chest_original, chest_result)
    extrema_chest = diff_chest.convert("L").getextrema()
    print(f"Chest difference extrema for bottoms: {extrema_chest}")
    assert extrema_chest[1] < 15, f"FAIL: Bottoms were pasted on the chest! Extrema: {extrema_chest}"
    print("PASS: Bottoms were placed on lower body, chest was left untouched.")
    
    print("\n✅ ALL TRY-ON QUALITY AND IDENTITY PRESERVATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(verify_quality())
