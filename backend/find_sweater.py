import os
from PIL import Image

uploads_dir = "uploads"
png_files = [f for f in os.listdir(uploads_dir) if f.endswith(".png") and os.path.getsize(os.path.join(uploads_dir, f)) > 1000000]
user_image_path = os.path.join(uploads_dir, png_files[0])

img = Image.open(user_image_path).convert("RGB")
w, h = img.size

min_x, min_y = w, h
max_x, max_y = 0, 0
total_green = 0

for y in range(h):
    for x in range(w):
        r, g, b = img.getpixel((x, y))
        if g > r and b > r and g > 15 and r < 85:
            total_green += 1
            if x < min_x: min_x = x
            if y < min_y: min_y = y
            if x > max_x: max_x = x
            if y > max_y: max_y = y

print(f"Total green sweater pixels: {total_green}")
print(f"Green sweater bounding box (relative): ({min_x/w:.3f}, {min_y/h:.3f}, {max_x/w:.3f}, {max_y/h:.3f})")
