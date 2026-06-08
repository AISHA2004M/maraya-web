import httpx
import time

base_url = "http://127.0.0.1:8000/api/v1"
product_id = "c7896e99-8746-4134-b075-562d5412f2cc"

# Create a dummy image file in bytes (larger than 1024 bytes to pass validation)
import time
dummy_image_data = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00" + b"\x00" * 2048 + str(time.time()).encode() + b"\xff\xd9"

print("--- SUBMITTING TRY-ON REQUEST (ASYNC) ---")
files = {"user_image": ("test_portrait.jpg", dummy_image_data, "image/jpeg")}
data = {"product_id": product_id, "model_variant": "fast"}

t0 = time.time()
with httpx.Client() as client:
    res = client.post(f"{base_url}/ai/try-on", files=files, data=data)
    t_submit = time.time() - t0

    print(f"Submit status: {res.status_code}")
    print(f"Response data: {res.json()}")
    print(f"Submission response time: {t_submit:.3f}s")

    if res.status_code == 202:
        job_id = res.json()["job_id"]
        print(f"Job ID: {job_id}")
        
        # Poll status
        print("\n--- POLLING STATUS ---")
        completed = False
        for i in range(15):
            poll_res = client.get(f"{base_url}/ai/try-on/status/{job_id}")
            poll_data = poll_res.json()
            print(f"Poll #{i+1}: status={poll_data['status']}, progress={poll_data['progress']}%")
            
            if poll_data["status"] == "completed":
                completed = True
                break
            elif poll_data["status"] == "failed":
                print("Job failed!")
                break
            time.sleep(0.3)
            
        if completed:
            # Get result
            result_res = client.get(f"{base_url}/ai/try-on/result/{job_id}")
            result_data = result_res.json()
            print("\n--- JOB COMPLETED RESULT ---")
            print(f"Result URL: {result_data['result_image_url']}")
            print(f"Inference time: {result_data['inference_time_ms']}ms")
            
            # Test Caching
            print("\n--- TESTING CACHING LAYER ---")
            # Send same request
            t_cache0 = time.time()
            files_cache = {"user_image": ("test_portrait.jpg", dummy_image_data, "image/jpeg")}
            res_cache = client.post(f"{base_url}/ai/try-on", files=files_cache, data=data)
            t_cache = time.time() - t_cache0
            
            print(f"Cache submission status: {res_cache.status_code}")
            print(f"Cache response data: {res_cache.json()}")
            print(f"Cache response time: {t_cache:.3f}s (Should be < 0.1s and status should be completed instantly)")
    else:
        print("Failed to submit job!")
