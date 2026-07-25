import os
import sys
import asyncio
import sqlite3
import logging

# Set up path so we can import from backend/app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Configure logging to show info level
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_all_tryon")

# Preset models list as defined in frontend
PRESET_MODELS = {
    "female": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&h=750&auto=format&fit=crop", # female_medium
    "male": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=500&h=750&auto=format&fit=crop",   # male_medium
    "unisex": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&h=750&auto=format&fit=crop" # fallback to female
}

async def main():
    # 1. Connect to SQLite DB
    db_path = os.path.join(os.path.dirname(__file__), "vrital_dev.db")
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all active products
    cursor.execute("""
        SELECT p.id, p.name, p.gender, p.main_image_url, c.name as category, p.description
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
    """)
    products = cursor.fetchall()
    conn.close()
    
    logger.info(f"Loaded {len(products)} active products from database.")
    
    # Import the tryon pipeline functions from app
    from app.services.ai_client import run_local_drape_pipeline
    
    results = []
    failed_products = []
    
    for i, (p_id, name, gender, img_url, category, desc) in enumerate(products, 1):
        gender_key = (gender or "unisex").lower()
        if "women" in gender_key:
            model_url = PRESET_MODELS["female"]
        elif "men" in gender_key:
            model_url = PRESET_MODELS["male"]
        else:
            model_url = PRESET_MODELS["unisex"]
            
        logger.info(f"[{i}/{len(products)}] Testing Product: '{name}' | Gender: {gender} | Category: {category}")
        logger.info(f"      Garment URL: {img_url}")
        logger.info(f"      Model URL  : {model_url}")
        
        try:
            # Run the local drape pipeline
            result_url = await run_local_drape_pipeline(
                user_image_path_or_url=model_url,
                cloth_image_path_or_url=img_url,
                session_id=f"test_{p_id[:8]}",
                category=category or "",
                description=desc or name or ""
            )
            
            # Basic validation of result
            if result_url.startswith("data:image/"):
                logger.info(f"      => SUCCESS! Result length: {len(result_url)}")
                results.append((name, gender, category, "Success"))
            else:
                logger.warning(f"      => WARNING! Result returned non-data URL: {result_url[:100]}...")
                results.append((name, gender, category, f"Unexpected return URL format: {result_url[:50]}"))
                
        except Exception as e:
            logger.error(f"      => FAILED! Error: {e}", exc_info=False)
            failed_products.append({
                "id": p_id,
                "name": name,
                "gender": gender,
                "category": category,
                "img_url": img_url,
                "error": str(e)
            })
            results.append((name, gender, category, f"Failed: {str(e)}"))
            
    # Print summary
    print("\n" + "="*80)
    print("TRY-ON VALIDATION REPORT")
    print("="*80)
    print(f"Total Products Tested: {len(products)}")
    print(f"Successful:           {len(products) - len(failed_products)}")
    print(f"Failed:               {len(failed_products)}")
    print("="*80)
    
    if failed_products:
        print("\nFAILED PRODUCTS DETAILS:")
        for fp in failed_products:
            print(f"- Name:     {fp['name']}")
            print(f"  ID:       {fp['id']}")
            print(f"  Gender:   {fp['gender']}")
            print(f"  Category: {fp['category']}")
            print(f"  Image:    {fp['img_url']}")
            print(f"  Error:    {fp['error']}")
            print("-"*50)
    else:
        print("\nALL PRODUCTS PASSED SUCCESSFULLY! NO ERRORS DETECTED.")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
