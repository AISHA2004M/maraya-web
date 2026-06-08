from PIL import Image

img = Image.open("original_dress.jpg")
w, h = img.size

# Let's inspect the corner pixels (typical background)
corners = [
    (0, 0), (w-1, 0), (0, h-1), (w-1, h-1),
    (10, 10), (w-11, 10), (10, h-11), (w-11, h-11)
]

print("Corner pixels (x, y) -> (R, G, B):")
for x, y in corners:
    print(f"({x}, {y}) -> {img.getpixel((x, y))}")
