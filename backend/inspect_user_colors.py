import os
from PIL import Image

uploads_dir = "uploads"
# Find the largest PNG file in uploads (the user image)
png_files = [f for f in os.listdir(uploads_dir) if f.endswith(".png") and os.path.getsize(os.path.join(uploads_dir, f)) > 1000000]

if not png_files:
    print("No large PNG user images found in uploads.")
else:
    user_file = os.path.join(uploads_dir, png_files[0])
    print(f"Inspecting user image: {user_file}")
    img = Image.open(user_file).convert("RGB")
    w, h = img.size
    print(f"Size: {w}x{h}")
    
    # Save a small thumbnail or analyze color of the center (torso)
    # The torso is typically in the middle horizontally, and between 40% and 80% height.
    center_colors = []
    for y in range(int(h * 0.4), int(h * 0.8), int(h * 0.05)):
        row = []
        for x in range(int(w * 0.3), int(w * 0.7), int(w * 0.05)):
            r, g, b = img.getpixel((x, y))
            row.append((r, g, b))
        center_colors.append(row)
        
    print("Torso colors (sample grid):")
    for row in center_colors:
        print(" | ".join([f"({r},{g},{b})" for r, g, b in row]))
        
    # Let's inspect the face area (around 20% to 30% height, center)
    face_colors = []
    for y in range(int(h * 0.2), int(h * 0.3), int(h * 0.02)):
        row = []
        for x in range(int(w * 0.4), int(w * 0.6), int(w * 0.04)):
            r, g, b = img.getpixel((x, y))
            row.append((r, g, b))
        face_colors.append(row)
        
    print("\nFace skin colors (sample grid):")
    for row in face_colors:
        print(" | ".join([f"({r},{g},{b})" for r, g, b in row]))
