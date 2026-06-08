import httpx
import io
import os
from PIL import Image

url = "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600"
print(f"Downloading {url}...")
r = httpx.get(url)
img = Image.open(io.BytesIO(r.content)).convert("RGB")
cw, ch = img.size
print(f"Image size: {cw}x{ch}")

# Let's save the original first
img.save("original_dress.jpg")

# Test segment skin and background
cloth_rgba = img.convert("RGBA")
cpix = cloth_rgba.load()

skin_pixels_removed = 0
bg_pixels_removed = 0
for y in range(ch):
    for x in range(cw):
        r, g, b, a = cpix[x, y]
        # Check background
        if r > 220 and g > 220 and b > 220:
            cpix[x, y] = (r, g, b, 0)
            bg_pixels_removed += 1
        # Check skin
        elif r > 35 and g > 20 and b > 15 and r > g and r > b and (r - g) > 8:
            cpix[x, y] = (r, g, b, 0)
            skin_pixels_removed += 1

print(f"Removed {bg_pixels_removed} background, {skin_pixels_removed} skin pixels")
cloth_rgba.save("segmented_dress.png")
print("Saved segmented_dress.png")
