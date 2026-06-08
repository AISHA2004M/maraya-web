import os
from PIL import Image

uploads_dir = "uploads"
files = [f for f in os.listdir(uploads_dir) if f.endswith(".png") or f.endswith(".jpg")]

for f in sorted(files):
    path = os.path.join(uploads_dir, f)
    try:
        img = Image.open(path)
        print(f"File: {f}, Size: {os.path.getsize(path)}, Format: {img.format}, Size: {img.size}")
    except Exception as e:
        print(f"File: {f}, Error: {e}")
