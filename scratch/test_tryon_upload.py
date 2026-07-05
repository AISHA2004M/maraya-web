import requests

url = "https://vrital-api-1yxc.onrender.com/api/v1/ai/try-on"
image_path = "/Users/yahyamohnd/.gemini/antigravity-ide/brain/6a3ed855-789d-4173-ad1d-88f286880e81/after_brand_selection_1781549117488.png"
product_id = "38aa01af-654f-42e3-8245-de460f6ba34b"

files = {
    'user_image': ('after_brand_selection_1781549117488.png', open(image_path, 'rb'), 'image/png')
}

data = {
    'product_id': product_id,
    'model_variant': 'balanced'
}

print(f"Sending POST request to {url}...")
try:
    response = requests.post(url, files=files, data=data)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Request failed:", e)
