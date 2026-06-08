import os
from PIL import Image

uploads_dir = "uploads"
files = [f for f in os.listdir(uploads_dir) if os.path.isfile(os.path.join(uploads_dir, f))]

print(f"Total files in uploads: {len(files)}")
for f in sorted(files, key=lambda x: os.path.getsize(os.path.join(uploads_dir, x)), reverse=True)[:10]:
    path = os.path.join(uploads_dir, f)
    try:
        img = Image.open(path)
        print(f"File: {f}, Size: {os.path.getsize(path)} bytes, Format: {img.format}, Mode: {img.mode}, Size: {img.size}")
    except Exception as e:
        print(f"File: {f}, Size: {os.path.getsize(path)} bytes, Error: {e}")
