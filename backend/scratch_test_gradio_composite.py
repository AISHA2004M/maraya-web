import os
from gradio_client import Client, handle_file

hf_token = os.getenv("HF_TOKEN", "")
client = Client("yisol/IDM-VTON", token=hf_token if hf_token else None)


# Let's use two real images in uploads directory to test
local_user = "uploads/cca68522-48a1-426b-a07f-0ea890ee5a37.jpg"
local_cloth = "uploads/2f86a9dd-1be1-4970-908d-a752a8a06472.png" # this is a PNG garment image

print("Calling predict with composite=None...")
try:
    result = client.predict(
        dict={
            "background": handle_file(local_user),
            "layers": [],
            "composite": None
        },
        garm_img=handle_file(local_cloth),
        garment_des="red dress",
        is_checked=True,
        is_checked_crop=False,
        denoise_steps=20,
        seed=42,
        api_name="/tryon"
    )
    print("Success with composite=None:", result)
except Exception as e:
    print("Error with composite=None:", e)

print("\nCalling predict with composite=background...")
try:
    result = client.predict(
        dict={
            "background": handle_file(local_user),
            "layers": [],
            "composite": handle_file(local_user)
        },
        garm_img=handle_file(local_cloth),
        garment_des="red dress",
        is_checked=True,
        is_checked_crop=False,
        denoise_steps=20,
        seed=42,
        api_name="/tryon"
    )
    print("Success with composite=background:", result)
except Exception as e:
    print("Error with composite=background:", e)
