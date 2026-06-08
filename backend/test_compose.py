import os
import io
import httpx
from PIL import Image, ImageChops, ImageDraw

def run_test():
    uploads_dir = "uploads"
    # Find the largest PNG file in uploads (the user image)
    png_files = [f for f in os.listdir(uploads_dir) if f.endswith(".png") and os.path.getsize(os.path.join(uploads_dir, f)) > 1000000]
    if not png_files:
        print("No large PNG user images found in uploads.")
        return
    
    user_path = os.path.join(uploads_dir, png_files[0])
    product_url = "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600"
    
    print(f"Loading user image: {user_path}")
    user_img = Image.open(user_path).convert("RGB")
    uw, uh = user_img.size
    
    print(f"Downloading product image: {product_url}")
    r = httpx.get(product_url)
    cloth_img = Image.open(io.BytesIO(r.content)).convert("RGB")
    cw, ch = cloth_img.size
    
    # 1. Sample Background Corner Colors of Product Image
    # Since background can be beige, we sample corners to find the background color
    bg_samples = [
        cloth_img.getpixel((0, 0)),
        cloth_img.getpixel((cw - 1, 0)),
        cloth_img.getpixel((0, ch - 1)),
        cloth_img.getpixel((cw - 1, ch - 1)),
        cloth_img.getpixel((10, 10)),
        cloth_img.getpixel((cw - 11, 10))
    ]
    
    # 2. Extract Garment (Remove background and skin)
    cloth_rgba = cloth_img.convert("RGBA")
    cpix = cloth_rgba.load()
    
    bg_removed = 0
    skin_removed = 0
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = cpix[x, y]
            # Check if close to any background corner sample
            is_bg = False
            for br, bg, bb in bg_samples:
                if abs(r - br) < 35 and abs(g - bg) < 35 and abs(b - bb) < 35:
                    is_bg = True
                    break
            if is_bg:
                cpix[x, y] = (r, g, b, 0)
                bg_removed += 1
                continue
                
            # Wide-range Skin detection
            # Skin typically has r > g > b, and r - g > 10, r > 40
            is_skin = (r > 35 and g > 20 and b > 15 and r > g and g >= b and (r - g) > 8)
            # Face/neck/arms are outside the main dress torso area
            # Dress is typically in the center (x: 20% to 80%, y: 15% to 90%)
            # We can remove skin from the top/sides/bottom aggressively, but be careful in the center
            in_center = (int(cw * 0.22) < x < int(cw * 0.78)) and (int(ch * 0.2) < y < int(ch * 0.9))
            
            if is_skin:
                # If it's skin and not in the center, or if it's very clear skin (top neck/arms area)
                if not in_center or (y < int(ch * 0.25)) or (x < int(cw * 0.3)) or (x > int(cw * 0.7)):
                    cpix[x, y] = (r, g, b, 0)
                    skin_removed += 1
                    
    print(f"Garment segment: removed {bg_removed} bg, {skin_removed} skin pixels")
    
    # Crop to garment bounding box
    bbox = cloth_rgba.getbbox()
    if bbox:
        cropped_garment = cloth_rgba.crop(bbox)
        print(f"Bbox: {bbox}")
    else:
        cropped_garment = cloth_rgba
        print("No bbox found")
        
    cropped_garment.save("temp_cropped_garment.png")
    
    # 3. Detect and replace user's green sweater with skin tone
    # First, let's find the user's average face skin tone
    face_height = int(uh * 0.38)
    face_pixels = []
    for y in range(int(uh * 0.2), int(uh * 0.3)):
        for x in range(int(uw * 0.4), int(uw * 0.6)):
            face_pixels.append(user_img.getpixel((x, y)))
    avg_skin = (
        sum(p[0] for p in face_pixels) // len(face_pixels),
        sum(p[1] for p in face_pixels) // len(face_pixels),
        sum(p[2] for p in face_pixels) // len(face_pixels)
    )
    print(f"Sampled average user skin color: {avg_skin}")
    
    # Sample user's background color from corners
    user_bg_samples = [
        user_img.getpixel((0, 0)),
        user_img.getpixel((uw - 1, 0)),
        user_img.getpixel((0, uh - 1)),
        user_img.getpixel((uw - 1, uh - 1))
    ]
    avg_user_bg = (
        sum(p[0] for p in user_bg_samples) // len(user_bg_samples),
        sum(p[1] for p in user_bg_samples) // len(user_bg_samples),
        sum(p[2] for p in user_bg_samples) // len(user_bg_samples)
    )
    print(f"Sampled average user background: {avg_user_bg}")
    
    # Detect the green sweater pixels on user
    user_rgba = user_img.convert("RGBA")
    upix = user_rgba.load()
    
    sweater_replaced = 0
    for y in range(face_height, uh):
        for x in range(uw):
            r, g, b, a = upix[x, y]
            # Is green sweater? (g is high, r is low)
            is_green = (g > r and b > r and g > 15 and r < 80)
            if is_green:
                # If it's on the arms (outer 25% width on left/right), replace with skin tone (bare arms!)
                # If it's in the neck area, replace with skin tone
                # If it's in the background/edges, replace with user background
                is_arm = (x < int(uw * 0.28) or x > int(uw * 0.72))
                is_neck = (y < int(uh * 0.42)) and (int(uw * 0.3) < x < int(uw * 0.7))
                
                if is_arm or is_neck:
                    upix[x, y] = (avg_skin[0], avg_skin[1], avg_skin[2], 255)
                else:
                    # Otherwise, make it transparent or leave it (will be covered by garment)
                    # We can fill it with a neutral gray or let the dress overlay cover it
                    pass
                sweater_replaced += 1
                
    print(f"Sweater replaced: {sweater_replaced} pixels")
    user_processed = user_rgba.convert("RGB")
    user_processed.save("temp_user_skin_arms.jpg")
    
    # 4. Compose final image
    # Resize dress to fit user's torso
    target_width = int(uw * 0.58)
    gw, gh = cropped_garment.size
    target_height = int(gh * (target_width / gw))
    
    # Limit max height
    if target_height > int(uh * 0.55):
        target_height = int(uh * 0.55)
        target_width = int(gw * (target_height / gh))
        
    resized_garment = cropped_garment.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    paste_x = (uw - target_width) // 2
    paste_y = int(uh * 0.36)
    
    # Paste garment onto the processed user body (which has skin arms)
    final_img = user_processed.copy()
    final_img.paste(resized_garment, (paste_x, paste_y), mask=resized_garment.split()[3])
    
    # Paste user's face crop back on top
    user_face_crop = user_img.crop((0, 0, uw, face_height))
    final_img.paste(user_face_crop, (0, 0))
    
    # Soften the skin arm replacement with a slight blur on the modified parts
    # (Or just save the final composed image)
    final_img.save("temp_final_tryon.jpg")
    print("Saved temp_final_tryon.jpg")

if __name__ == "__main__":
    run_test()
