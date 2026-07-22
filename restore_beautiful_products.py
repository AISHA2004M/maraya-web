import urllib.request
import json
import sqlite3
import uuid

# Production API Configuration
API_BASE_URL = "https://vrital-api-1yxc.onrender.com/api/v1"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
CREATE_PRODUCT_URL = f"{API_BASE_URL}/products"

# Partner Credentials
EMAIL = "admin@vrital.com"
PASSWORD = "admin123"

# 12 Screenshot-based product IDs to delete
screenshot_product_ids = [
    "1be6a586-6d6a-427b-b865-0742cef55b41",
    "03cf0b5e-d4fd-4771-ad59-a092ae1c39f3",
    "84aa4028-2209-4897-946e-729f917eaa2e",
    "fb4cabc3-204f-4f09-be3c-fe463aa851ec",
    "8b63904b-308e-4308-85d9-5debec98d42d",
    "d461fd2c-1cab-458a-a44b-48ea772f97e0",
    "20e50fcf-b5e1-4803-961c-2af93af059b9",
    "cf3b9d52-2c62-4746-9b31-38f71859a3a6",
    "76e16d28-7478-4e50-bbf0-b1cc4b454463",
    "d5d90be3-043c-468a-a376-6949c28d624a",
    "73581e50-e6c0-4c95-8d15-d5bf7c2ec73a",
    "ad5ce2e3-4c2e-49bd-a153-1d823a27831a"
]

# 24 beautiful garments to restore/add
beautiful_products = [
    # --- Batch 1 (4 products) ---
    {
        "id": "13c3b58e-b816-4139-91c4-e574c3f13c55",
        "name": "Gucci GG Jacquard Silk Bomber",
        "description": "A luxurious bomber jacket in navy silk jacquard, featuring the signature GG pattern, knit web trims, and side pockets. Made in Italy.",
        "price": 2850000,
        "currency": "IQD",
        "live_brand_id": 16, "local_brand_id": 4,
        "live_category_id": 20, "local_category_id": 5,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800",
        "fabric_type": "Silk Jacquard",
        "size_type": "Standard",
        "stock_quantity": 15,
        "editorial_tags": "Stealth Wealth, Luxury Silk",
        "storytelling_title": "Heritage in Every Stitch",
        "storytelling_description": "Woven from premium Italian silk, this bomber showcases Gucci's classic monogram in a modern silhouette.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Evening, Casual Luxury",
        "garment_length": "68 سم",
        "care_instructions": "تنظيف جاف فقط",
        "color": "كحلي / Navy",
        "material_details": "حرير طبيعي 100%",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "متوسط",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن بالكامل",
        "closure_type": "سحاب معدني",
        "sizes": [{"size": "S", "stock": 5}, {"size": "M", "stock": 6}, {"size": "L", "stock": 4}]
    },
    {
        "id": "4fea8e5a-2e97-481a-b2f3-238062925faf",
        "name": "Zara Textured Knit Polo",
        "description": "A lightweight textured knit polo shirt in sand beige. Ribbed collar and cuffs. Perfect for casual elegance.",
        "price": 85000,
        "currency": "IQD",
        "live_brand_id": 13, "local_brand_id": 1,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800",
        "fabric_type": "Textured Cotton Knit",
        "size_type": "Standard",
        "stock_quantity": 30,
        "editorial_tags": "Minimal Elegance, Cozy Minimalism",
        "storytelling_title": "Effortless Summer Knitwear",
        "storytelling_description": "Designed with comfort in mind, this knit polo offers a textured finish that elevates your everyday casual look.",
        "mood_aesthetic": "Minimalist Core",
        "occasion": "Casual, Smart Casual",
        "garment_length": "72 سم",
        "care_instructions": "غسيل آلي بماء بارد",
        "color": "رملي / Sand",
        "material_details": "قطن 100%",
        "origin_country": "تركيا / Turkey",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام قصيرة",
        "lining": "غير مبطن",
        "closure_type": "أزرار أمامية",
        "sizes": [{"size": "S", "stock": 10}, {"size": "M", "stock": 12}, {"size": "L", "stock": 8}]
    },
    {
        "id": "08891d00-e5b2-4307-a7a2-61ce4273e75c",
        "name": "Gucci Flora Silk Midi Dress",
        "description": "An elegant silk georgette midi dress featuring the iconic Flora print, a pleated skirt, ruffled neckline, and long sleeves with elasticated cuffs.",
        "price": 3200000,
        "currency": "IQD",
        "live_brand_id": 16, "local_brand_id": 4,
        "live_category_id": 17, "local_category_id": 2,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
        "fabric_type": "Silk Georgette",
        "size_type": "Standard",
        "stock_quantity": 10,
        "editorial_tags": "Evening Elegance, Avant-Garde",
        "storytelling_title": "Poetry in Bloom",
        "storytelling_description": "The signature Flora motif meets delicate silk georgette, draped to perfection for a silhouette that moves gracefully.",
        "mood_aesthetic": "Evening Elegance",
        "occasion": "Evening, Gala",
        "garment_length": "118 سم",
        "care_instructions": "تنظيف جاف فقط",
        "color": "متعدد الألوان / Floral",
        "material_details": "حرير 100%",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن بالكامل",
        "closure_type": "سحاب خلفي مخفي",
        "sizes": [{"size": "XS", "stock": 2}, {"size": "S", "stock": 4}, {"size": "M", "stock": 4}]
    },
    {
        "id": "cf948e07-2684-4401-8e54-702f96fa763e",
        "name": "Zara Double-Breasted Linen Blazer",
        "description": "A tailored linen-blend blazer in off-white. Features a lapel collar, long sleeves, front flap pockets, and double-breasted button fastening.",
        "price": 145000,
        "currency": "IQD",
        "live_brand_id": 13, "local_brand_id": 1,
        "live_category_id": 20, "local_category_id": 5,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "fabric_type": "Linen Blend",
        "size_type": "Standard",
        "stock_quantity": 25,
        "editorial_tags": "Minimal Elegance, Summer Atelier",
        "storytelling_title": "Structured Linen Tailoring",
        "storytelling_description": "The breathability of linen meets a structured double-breasted silhouette, designed for seamless day-to-night transitions.",
        "mood_aesthetic": "Minimal Elegance",
        "occasion": "Office, Smart Casual, Summer",
        "garment_length": "76 سم",
        "care_instructions": "تنظيف جاف يفضل",
        "color": "أبيض عاجي / Off-white",
        "material_details": "كتان 55%، قطن 45%",
        "origin_country": "المغرب / Morocco",
        "garment_weight": "متوسط",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن جزئياً",
        "closure_type": "أزرار أمامية مزدوجة",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 10}, {"size": "L", "stock": 7}]
    },

    # --- Batch 2 (12 products) ---
    {
        "id": "8fe2927e-0fad-4f78-9041-ef039d15bab1",
        "name": "Nike Solo Swoosh Fleece Hoodie",
        "description": "A premium heavyweight fleece hoodie in carbon grey. Features a roomy fit, double-lined hood, and the iconic embroidered Solo Swoosh.",
        "price": 125000,
        "currency": "IQD",
        "live_brand_id": 14, "local_brand_id": 2,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
        "fabric_type": "Heavyweight Fleece",
        "size_type": "Standard",
        "stock_quantity": 25,
        "editorial_tags": "Premium Fleece, Sportswear",
        "storytelling_title": "Heavyweight Comfort",
        "storytelling_description": "Crafted with soft brushed-back fleece, this Solo Swoosh hoodie delivers ultimate warmth and athletic styling.",
        "mood_aesthetic": "Athletic Minimalist",
        "occasion": "Casual, Sport",
        "garment_length": "72 سم",
        "care_instructions": "غسيل آلي بماء بارد",
        "color": "رمادي / Carbon Grey",
        "material_details": "قطن 84%، بوليستر 16%",
        "origin_country": "تركيا / Turkey",
        "garment_weight": "ثقيل",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن جزئياً",
        "closure_type": "بدون سحاب",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 10}, {"size": "L", "stock": 7}]
    },
    {
        "id": "e8c0d49f-68f2-4e7f-9e09-86fbe1c7b2a2",
        "name": "Nike Tech Fleece Joggers",
        "description": "Tailored fit Tech Fleece joggers in sleek black. Features lightweight warmth, zippered side pocket, and elastic waistband.",
        "price": 140000,
        "currency": "IQD",
        "live_brand_id": 14, "local_brand_id": 2,
        "live_category_id": 19, "local_category_id": 4,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800",
        "fabric_type": "Tech Fleece",
        "size_type": "Standard",
        "stock_quantity": 30,
        "editorial_tags": "Tech Fleece, Streetwear",
        "storytelling_title": "Lightweight Thermal Utility",
        "storytelling_description": "Engineered for thermal performance, these joggers feature Nike's classic Tech Fleece structure with a modern tapered fit.",
        "mood_aesthetic": "Streetwear Athletic",
        "occasion": "Casual, Street",
        "garment_length": "102 سم",
        "care_instructions": "غسيل آلي",
        "color": "أسود / Black",
        "material_details": "قطن 66%، بوليستر 34%",
        "origin_country": "فيتنام / Vietnam",
        "garment_weight": "خفيف",
        "sleeve_length": "طويل",
        "lining": "غير مبطن",
        "closure_type": "رباط خصر",
        "sizes": [{"size": "S", "stock": 10}, {"size": "M", "stock": 12}, {"size": "L", "stock": 8}]
    },
    {
        "id": "8a641b0c-a844-46c3-88ac-ebd75e267bfc",
        "name": "Nike Sportswear Essential Crop Top",
        "description": "A slim-fit cropped tee in olive green, made from soft organic cotton jersey with a subtle embroidered logo.",
        "price": 55000,
        "currency": "IQD",
        "live_brand_id": 14, "local_brand_id": 2,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
        "fabric_type": "Cotton Jersey",
        "size_type": "Standard",
        "stock_quantity": 40,
        "editorial_tags": "Athleisure, Crop Tee",
        "storytelling_title": "Daily Athletic Essential",
        "storytelling_description": "Perfectly cut and cropped for comfort, this olive green tee features organic cotton knit that pairs beautifully with high-rise leggings.",
        "mood_aesthetic": "Athleisure",
        "occasion": "Casual, Fitness",
        "garment_length": "45 سم",
        "care_instructions": "غسيل آلي بماء بارد",
        "color": "زيتي / Olive Green",
        "material_details": "قطن عضوي 100%",
        "origin_country": "تركيا / Turkey",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام قصيرة",
        "lining": "غير مبطن",
        "closure_type": "بدون سحاب",
        "sizes": [{"size": "XS", "stock": 10}, {"size": "S", "stock": 15}, {"size": "M", "stock": 15}]
    },
    {
        "id": "8e89df8b-b159-4767-aa87-9fd4e92d66cd",
        "name": "Nike Zenvy High-Waisted Leggings",
        "description": "Incredibly soft InfinaSoft fabric high-waisted leggings in lavender. Designed for yoga, stretch, and everyday comfort.",
        "price": 98000,
        "currency": "IQD",
        "live_brand_id": 14, "local_brand_id": 2,
        "live_category_id": 19, "local_category_id": 4,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800",
        "fabric_type": "InfinaSoft Knit",
        "size_type": "Standard",
        "stock_quantity": 25,
        "editorial_tags": "Yoga wear, Super Soft",
        "storytelling_title": "Zero-Distraction Movement",
        "storytelling_description": "Experience buttery-soft support. Nike Zenvy leggings feature InfinaSoft fabric that lets you move freely through your day.",
        "mood_aesthetic": "Athleisure",
        "occasion": "Yoga, Everyday Stretch",
        "garment_length": "98 سم",
        "care_instructions": "غسيل آلي بماء بارد",
        "color": "خزامي / Lavender",
        "material_details": "نايلون 63%، سباندكس 37%",
        "origin_country": "سريلانكا / Sri Lanka",
        "garment_weight": "خفيف للغاية",
        "sleeve_length": "طويل",
        "lining": "غير مبطن",
        "closure_type": "مرن",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 10}, {"size": "L", "stock": 7}]
    },
    {
        "id": "d4bd9ee5-ec3d-43b0-8670-971f5dca8ef3",
        "name": "H&M Linen Blend Resort Shirt",
        "description": "A relaxed-fit short sleeve resort shirt in sage green linen blend. Features a camp collar and button-down front.",
        "price": 45000,
        "currency": "IQD",
        "live_brand_id": 15, "local_brand_id": 3,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "fabric_type": "Linen Blend",
        "size_type": "Standard",
        "stock_quantity": 35,
        "editorial_tags": "Summer Linen, Casual",
        "storytelling_title": "Summer Resort Ease",
        "storytelling_description": "Designed for warm breeze, this shirt combines the lightweight texture of linen with soft breathable cotton.",
        "mood_aesthetic": "Minimalist Casual",
        "occasion": "Summer, Casual Beach",
        "garment_length": "70 سم",
        "care_instructions": "غسيل آلي لطيف",
        "color": "أخضر فاتح / Sage Green",
        "material_details": "كتان 55%، قطن 45%",
        "origin_country": "بنجلاديش / Bangladesh",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام قصيرة",
        "lining": "غير مبطن",
        "closure_type": "أزرار أمامية",
        "sizes": [{"size": "S", "stock": 10}, {"size": "M", "stock": 15}, {"size": "L", "stock": 10}]
    },
    {
        "id": "1ca1f2b9-8117-4978-99c6-ecb43bfe3444",
        "name": "H&M Oversized Denim Jacket",
        "description": "An oversized denim jacket in vintage light wash. Features chest pockets, welt pockets, and button adjusters at the hem.",
        "price": 78000,
        "currency": "IQD",
        "live_brand_id": 15, "local_brand_id": 3,
        "live_category_id": 20, "local_category_id": 5,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=800",
        "fabric_type": "Cotton Denim",
        "size_type": "Standard",
        "stock_quantity": 25,
        "editorial_tags": "Vintage Denim, Oversized",
        "storytelling_title": "Retro Outerwear Restructure",
        "storytelling_description": "Constructed from thick, durable organic denim, this jacket offers a retro oversized silhouette that layers easily over hoodies.",
        "mood_aesthetic": "Streetwear Classic",
        "occasion": "Casual, Evening",
        "garment_length": "70 سم",
        "care_instructions": "غسيل آلي بماء دافئ",
        "color": "أزرق فاتح / Light Denim Wash",
        "material_details": "قطن 100%",
        "origin_country": "الصين / China",
        "garment_weight": "ثقيل",
        "sleeve_length": "أكمام طويلة",
        "lining": "غير مبطن",
        "closure_type": "أزرار معدنية",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 10}, {"size": "L", "stock": 7}]
    },
    {
        "id": "819cd07e-e2bf-427d-89a5-4d65ff34b0c3",
        "name": "H&M Rib-Knit Dress",
        "description": "A midi rib-knit dress in camel brown. Features a sweet-heart neckline, long sleeves, and a soft body-hugging silhouette.",
        "price": 65000,
        "currency": "IQD",
        "live_brand_id": 15, "local_brand_id": 3,
        "live_category_id": 17, "local_category_id": 2,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
        "fabric_type": "Rib-Knit Blend",
        "size_type": "Standard",
        "stock_quantity": 20,
        "editorial_tags": "Knitwear, Cozy Comfort",
        "storytelling_title": "Sophisticated Cozy Silhouette",
        "storytelling_description": "Woven with a thick ribbed texture, this camel dress contours your body beautifully while maintaining exceptional softness.",
        "mood_aesthetic": "Cozy Minimalism",
        "occasion": "Casual, Dinner",
        "garment_length": "112 سم",
        "care_instructions": "تجفيف مسطح فقط",
        "color": "بني جملي / Camel Brown",
        "material_details": "فيسكوز 70%، بوليستر 30%",
        "origin_country": "تركيا / Turkey",
        "garment_weight": "متوسط",
        "sleeve_length": "أكمام طويلة",
        "lining": "غير مبطن",
        "closure_type": "بدون سحاب",
        "sizes": [{"size": "S", "stock": 6}, {"size": "M", "stock": 8}, {"size": "L", "stock": 6}]
    },
    {
        "id": "d2707e23-2f63-4391-b4e6-0588a71d34a1",
        "name": "H&M High Waisted Tailored Trousers",
        "description": "Tailored trousers with a high waist, wide legs, and side pockets. Clean pleated front in charcoal grey.",
        "price": 58000,
        "currency": "IQD",
        "live_brand_id": 15, "local_brand_id": 3,
        "live_category_id": 19, "local_category_id": 4,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800",
        "fabric_type": "Tailored Poly-Blend",
        "size_type": "Standard",
        "stock_quantity": 28,
        "editorial_tags": "Office Wear, Tailored",
        "storytelling_title": "Elegant Tailoring Structure",
        "storytelling_description": "Featuring a structured drape and wide-leg hem, these high-waisted charcoal trousers offer a clean, professional profile.",
        "mood_aesthetic": "Minimalist Tailoring",
        "occasion": "Office, Business Casual",
        "garment_length": "105 سم",
        "care_instructions": "غسيل آلي",
        "color": "رمادي داكن / Charcoal Grey",
        "material_details": "بوليستر 64%، فيسكوز 32%، إيلاستين 4%",
        "origin_country": "كمبوديا / Cambodia",
        "garment_weight": "متوسط",
        "sleeve_length": "طويل",
        "lining": "غير مبطن",
        "closure_type": "سحاب أمامي مع زر",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 12}, {"size": "L", "stock": 8}]
    },
    {
        "id": "0fc4641e-ddb5-4e40-8ec4-ea9d6bf370d2",
        "name": "Zara Pleated Cropped Trousers",
        "description": "Relaxed fit trousers in cream white. Features front pleats, cropped hem, and side pockets. Minimalist drapery at its best.",
        "price": 95000,
        "currency": "IQD",
        "live_brand_id": 13, "local_brand_id": 1,
        "live_category_id": 19, "local_category_id": 4,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
        "fabric_type": "Fluid Poly-Blend",
        "size_type": "Standard",
        "stock_quantity": 25,
        "editorial_tags": "Modern Drape, Pleated Trousers",
        "storytelling_title": "Architectural Drapery",
        "storytelling_description": "Clean lines and a pleated waist construct a comfortable, fluid trouser that hangs perfectly for casual luxury styling.",
        "mood_aesthetic": "Contemporary Minimalist",
        "occasion": "Casual Luxury, Summer Evening",
        "garment_length": "95 سم",
        "care_instructions": "غسيل آلي بماء بارد",
        "color": "أبيض كريمي / Cream White",
        "material_details": "بوليستر 100%",
        "origin_country": "إسبانيا / Spain",
        "garment_weight": "خفيف",
        "sleeve_length": "طويل",
        "lining": "غير مبطن",
        "closure_type": "سحاب خفي",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 10}, {"size": "L", "stock": 7}]
    },
    {
        "id": "a9335c6b-a58d-4107-95b0-adb0af73b7e1",
        "name": "Zara Silk-Effect Draped Blouse",
        "description": "A high-neck satin-effect draped blouse in emerald green. Features long sleeves, back slit with buttons, and fluid fabric.",
        "price": 88000,
        "currency": "IQD",
        "live_brand_id": 13, "local_brand_id": 1,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1548624149-f7b2e8734b1a?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1548624149-f7b2e8734b1a?w=800",
        "fabric_type": "Satin Poly",
        "size_type": "Standard",
        "stock_quantity": 30,
        "editorial_tags": "Satin Fluid, Jewel Tone",
        "storytelling_title": "Fluid Emerald Elegance",
        "storytelling_description": "A blouse that shimmers with movement. Featuring a gorgeous high drape neckline and luxurious satin sheen fabric.",
        "mood_aesthetic": "Romantic Drape",
        "occasion": "Dinner, Cocktail",
        "garment_length": "65 سم",
        "care_instructions": "غسيل يدوي لطيف",
        "color": "أخضر زمردي / Emerald Green",
        "material_details": "بوليستر 100% (تأثير الحرير)",
        "origin_country": "البرتغال / Portugal",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام طويلة",
        "lining": "غير مبطن",
        "closure_type": "أزرار خلف الرقبة",
        "sizes": [{"size": "S", "stock": 10}, {"size": "M", "stock": 12}, {"size": "L", "stock": 8}]
    },
    {
        "id": "47fcbecd-ef75-4985-8a5e-9118d30c36db",
        "name": "Gucci Web Trim Cotton Polo",
        "description": "A classic stretch cotton piqué polo shirt in black, elevated by the green and red Web knit collar and cuffs.",
        "price": 650000,
        "currency": "IQD",
        "live_brand_id": 16, "local_brand_id": 4,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1626497764746-6dc36546b388?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1626497764746-6dc36546b388?w=800",
        "fabric_type": "Cotton Piqué",
        "size_type": "Standard",
        "stock_quantity": 12,
        "editorial_tags": "Luxury Pique, Web Ribbon",
        "storytelling_title": "Preppy Heritage Signature",
        "storytelling_description": "A sportswear staple refined. Made from breathable stretch cotton piqué, featuring Gucci's signature Web knit trims.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Smart Casual",
        "garment_length": "70 سم",
        "care_instructions": "غسيل يدوي فقط",
        "color": "أسود / Black",
        "material_details": "قطن 93%، إيلاستين 7%",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "متوسط",
        "sleeve_length": "أكمام قصيرة",
        "lining": "غير مبطن",
        "closure_type": "أزرار ياقة",
        "sizes": [{"size": "S", "stock": 4}, {"size": "M", "stock": 5}, {"size": "L", "stock": 3}]
    },
    {
        "id": "3be3eb84-40bd-487d-9bc2-ef040e75e55a",
        "name": "Gucci GG Canvas Trench Coat",
        "description": "A double-breasted trench coat in camel GG canvas, featuring leather buttons, waist belt, and signature silk lining.",
        "price": 3500000,
        "currency": "IQD",
        "live_brand_id": 16, "local_brand_id": 4,
        "live_category_id": 20, "local_category_id": 5,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "fabric_type": "GG Jacquard Canvas",
        "size_type": "Standard",
        "stock_quantity": 8,
        "editorial_tags": "GG Canvas, Trench Coat",
        "storytelling_title": "Grand Heritage Trench",
        "storytelling_description": "A lifetime investment piece. This iconic trench showcases the timeless GG logo canvas with premium leather finishes.",
        "mood_aesthetic": "Evening Elegance",
        "occasion": "Evening, Autumn",
        "garment_length": "110 سم",
        "care_instructions": "تنظيف جاف فقط",
        "color": "بيج جملي / Camel GG",
        "material_details": "قطن 70%، بوليستر 30% مع تفاصيل جلدية",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "ثقيل",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن بالكامل بالحرير",
        "closure_type": "أزرار مزدوجة وحزام",
        "sizes": [{"size": "XS", "stock": 2}, {"size": "S", "stock": 3}, {"size": "M", "stock": 3}]
    },

    # --- Batch 3 (8 products) ---
    {
        "id": "c6a6cc5a-f098-44e7-9a9f-24144b5eb6d6",
        "name": "Zara Abstract Print Satin Shirt",
        "description": "A flowing satin-finish shirt with an abstract monochromatic print. Relaxed fit, camp collar, and short sleeves.",
        "price": 75000,
        "currency": "IQD",
        "live_brand_id": 13, "local_brand_id": 1,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "fabric_type": "Satin Viscose",
        "size_type": "Standard",
        "stock_quantity": 30,
        "editorial_tags": "Abstract Satin, Resort Wear",
        "storytelling_title": "Modernist Monochrome Prints",
        "storytelling_description": "Designed for statement ease, this satin-finish shirt features an abstract art-house graphic print across a fluid camp-collar shape.",
        "mood_aesthetic": "Contemporary Minimalist",
        "occasion": "Resort, Casual Evening",
        "garment_length": "70 سم",
        "care_instructions": "غسيل آلي لطيف",
        "color": "أبيض وأسود / Monochrome",
        "material_details": "فيسكوز 100%",
        "origin_country": "إسبانيا / Spain",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام قصيرة",
        "lining": "غير مبطن",
        "closure_type": "أزرار أمامية",
        "sizes": [{"size": "S", "stock": 10}, {"size": "M", "stock": 12}, {"size": "L", "stock": 8}]
    },
    {
        "id": "123466ee-e8eb-4c3e-9b70-1b32933a0343",
        "name": "Zara Satin Slip Dress",
        "description": "A fluid satin midi slip dress in Champagne Gold. Features thin adjustable straps, cowl neck, and flared hem.",
        "price": 110000,
        "currency": "IQD",
        "live_brand_id": 13, "local_brand_id": 1,
        "live_category_id": 17, "local_category_id": 2,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
        "fabric_type": "Fluid Satin",
        "size_type": "Standard",
        "stock_quantity": 25,
        "editorial_tags": "Satin Slip, Minimalist Evening",
        "storytelling_title": "Pure Champagne Fluidity",
        "storytelling_description": "A classic slip silhouette draped in champagne satin, offering a minimalist yet dressy option for upscale events.",
        "mood_aesthetic": "Minimalist Core",
        "occasion": "Evening, Cocktail Party",
        "garment_length": "115 سم",
        "care_instructions": "غسيل يدوي بماء بارد",
        "color": "ذهبي شامبين / Champagne Gold",
        "material_details": "بوليستر 100%",
        "origin_country": "إسبانيا / Spain",
        "garment_weight": "خفيف",
        "sleeve_length": "بدون أكمام",
        "lining": "غير مبطن",
        "closure_type": "سحاب جانبي مخفي",
        "sizes": [{"size": "S", "stock": 8}, {"size": "M", "stock": 10}, {"size": "L", "stock": 7}]
    },
    {
        "id": "d5395223-1d8d-4ff8-91d6-75bad25c8dc2",
        "name": "Nike Windrunner Hooded Jacket",
        "description": "The classic Windrunner jacket in black and white chevron design. Lightweight, water-repellent fabric with breathable mesh lining.",
        "price": 155000,
        "currency": "IQD",
        "live_brand_id": 14, "local_brand_id": 2,
        "live_category_id": 20, "local_category_id": 5,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800",
        "fabric_type": "Water-Repellent Poly",
        "size_type": "Standard",
        "stock_quantity": 20,
        "editorial_tags": "Water Repellent, Windrunner",
        "storytelling_title": "Heritage Track Silhouette",
        "storytelling_description": "First designed in 1978, the Windrunner hooded jacket remains a legend with its iconic 26-degree chevron design and lightweight rain protection.",
        "mood_aesthetic": "Athletic Minimalist",
        "occasion": "Sport, Outdoor",
        "garment_length": "70 سم",
        "care_instructions": "غسيل آلي",
        "color": "أسود وأبيض / Black/White",
        "material_details": "بوليستر معاد تدويره 100%",
        "origin_country": "فيتنام / Vietnam",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن بالشبك",
        "closure_type": "سحاب كامل",
        "sizes": [{"size": "S", "stock": 6}, {"size": "M", "stock": 8}, {"size": "L", "stock": 6}]
    },
    {
        "id": "fc3d375f-70ce-4cbf-a78b-e247e11889ef",
        "name": "Nike Dri-FIT One Luxe Tank",
        "description": "A high-performance tank top in rose pink, made from buttery-soft Dri-FIT fabric that breathes easily and wicks sweat.",
        "price": 48000,
        "currency": "IQD",
        "live_brand_id": 14, "local_brand_id": 2,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800",
        "fabric_type": "Dri-FIT Luxe Knit",
        "size_type": "Standard",
        "stock_quantity": 35,
        "editorial_tags": "Dri-FIT Luxe, Sweat-Wicking",
        "storytelling_title": "Buttery Soft Performance",
        "storytelling_description": "Our most versatile tank, designed for yoga, runs, or weights. Woven from breathable jersey that keeps you dry and cool.",
        "mood_aesthetic": "Athleisure",
        "occasion": "Fitness, Casual",
        "garment_length": "60 سم",
        "care_instructions": "غسيل آلي بماء بارد",
        "color": "وردي / Rose Pink",
        "material_details": "بوليستر 88%، سباندكس 12%",
        "origin_country": "سريلانكا / Sri Lanka",
        "garment_weight": "خفيف للغاية",
        "sleeve_length": "بدون أكمام",
        "lining": "غير مبطن",
        "closure_type": "بدون سحاب",
        "sizes": [{"size": "S", "stock": 10}, {"size": "M", "stock": 15}, {"size": "L", "stock": 10}]
    },
    {
        "id": "35794d13-d459-4667-9e0c-04ad7c941e65",
        "name": "H&M Slim Fit Chino Shorts",
        "description": "Classic knee-length chino shorts in navy blue cotton twill. Features side pockets, welt back pockets, and zip fly.",
        "price": 35000,
        "currency": "IQD",
        "live_brand_id": 15, "local_brand_id": 3,
        "live_category_id": 19, "local_category_id": 4,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
        "fabric_type": "Cotton Twill",
        "size_type": "Standard",
        "stock_quantity": 40,
        "editorial_tags": "Summer Chino, Everyday Classic",
        "storytelling_title": "Weekend Chino Tailoring",
        "storytelling_description": "A warm-weather essential. These chinos are woven in sturdy cotton twill with a touch of stretch for ultimate ease.",
        "mood_aesthetic": "Minimalist Casual",
        "occasion": "Casual, Outdoor",
        "garment_length": "50 سم",
        "care_instructions": "غسيل آلي بماء دافئ",
        "color": "كحلي / Navy Blue",
        "material_details": "قطن 98%، إيلاستين 2%",
        "origin_country": "بنجلاديش / Bangladesh",
        "garment_weight": "متوسط",
        "sleeve_length": "قصير",
        "lining": "غير مبطن",
        "closure_type": "سحاب وزر",
        "sizes": [{"size": "S", "stock": 12}, {"size": "M", "stock": 15}, {"size": "L", "stock": 13}]
    },
    {
        "id": "44d336f6-9163-4add-a93d-9c611f485e83",
        "name": "H&M Tailored Tweed Jacket",
        "description": "A collarless tweed jacket in cream and black woven pattern. Features decorative metal buttons, frayed edges, and patch pockets.",
        "price": 85000,
        "currency": "IQD",
        "live_brand_id": 15, "local_brand_id": 3,
        "live_category_id": 20, "local_category_id": 5,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "fabric_type": "Tweed Blend",
        "size_type": "Standard",
        "stock_quantity": 20,
        "editorial_tags": "Tweed Classic, French Chic",
        "storytelling_title": "Classic Textured Tweed",
        "storytelling_description": "Bring French-chic to your daily wardrobe. This woven tweed jacket features decorative gold-tone buttons and elegant frayed trim detail.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Smart Casual, Dinner",
        "garment_length": "60 سم",
        "care_instructions": "تنظيف جاف فقط",
        "color": "تود كريمي وأسود / Tweed",
        "material_details": "بوليستر 80%، أكريليك 20%",
        "origin_country": "تركيا / Turkey",
        "garment_weight": "متوسط",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن بالكامل",
        "closure_type": "أزرار أمامية",
        "sizes": [{"size": "S", "stock": 6}, {"size": "M", "stock": 8}, {"size": "L", "stock": 6}]
    },
    {
        "id": "8615ae61-79b8-47d9-ac4a-296d3a770449",
        "name": "Gucci Tailored Beige Trousers",
        "description": "Luxury tailored beige trousers in a premium cotton-silk blend, decorated with clean minimalist drape and subtle side stitching.",
        "price": 1200000,
        "currency": "IQD",
        "live_brand_id": 16, "local_brand_id": 4,
        "live_category_id": 19, "local_category_id": 4,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
        "fabric_type": "Cotton Silk Blend",
        "size_type": "Standard",
        "stock_quantity": 10,
        "editorial_tags": "Stealth Wealth, Italian Tailoring",
        "storytelling_title": "Heritage Track Luxury",
        "storytelling_description": "Woven with double-knit Italian cotton-silk blend, these trousers unite archive elements with contemporary luxury leisurewear.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Casual Luxury, Travel",
        "garment_length": "100 سم",
        "care_instructions": "تنظيف جاف يفضل",
        "color": "بيج / Beige",
        "material_details": "قطن 70%، حرير 30%",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "متوسط",
        "sleeve_length": "طويل",
        "lining": "غير مبطن",
        "closure_type": "رباط خصر مرن",
        "sizes": [{"size": "S", "stock": 3}, {"size": "M", "stock": 4}, {"size": "L", "stock": 3}]
    },
    {
        "id": "8a437df1-7540-4b7e-b6eb-b5caba924a59",
        "name": "Gucci Silk Crepe Bow Blouse",
        "description": "A delicate silk crepe de chine blouse in off-white, adorned with a self-tie neck bow and GG mother-of-pearl buttons.",
        "price": 1850000,
        "currency": "IQD",
        "live_brand_id": 16, "local_brand_id": 4,
        "live_category_id": 18, "local_category_id": 3,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1548624149-f7b2e8734b1a?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1548624149-f7b2e8734b1a?w=800",
        "fabric_type": "Silk Crepe de Chine",
        "size_type": "Standard",
        "stock_quantity": 12,
        "editorial_tags": "Silk Crepe, Tie Neck Bow",
        "storytelling_title": "Romantic Bow Drape",
        "storytelling_description": "Crafted from fluid Italian silk crepe, this tie-neck bow blouse brings a romantic heritage feel to formal tailoring ensembles.",
        "mood_aesthetic": "Evening Elegance",
        "occasion": "Evening, Formal Gala",
        "garment_length": "68 سم",
        "care_instructions": "تنظيف جاف فقط",
        "color": "أوف وايت / Off-white",
        "material_details": "حرير 100%",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "خفيف للغاية",
        "sleeve_length": "أكمام طويلة",
        "lining": "غير مبطن",
        "closure_type": "أزرار صدفية أمامية",
        "sizes": [{"size": "XS", "stock": 3}, {"size": "S", "stock": 5}, {"size": "M", "stock": 4}]
    }
]

def login():
    try:
        data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode("utf-8")
        req = urllib.request.Request(
            LOGIN_URL,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            return res_data.get("access_token")
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def delete_product_live(token, prod_id):
    try:
        req = urllib.request.Request(
            f"{API_BASE_URL}/products/{prod_id}",
            method="DELETE",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "Mozilla/5.0"
            }
        )
        with urllib.request.urlopen(req) as res:
            print(f"Successfully deleted live screenshot product: {prod_id}")
    except Exception as e:
        print(f"Failed to delete live product {prod_id}: {e}")

def delete_product_local(prod_id):
    try:
        conn = sqlite3.connect("backend/vrital_dev.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM product_sizes WHERE product_id = ?", (prod_id,))
        cursor.execute("DELETE FROM product_images WHERE product_id = ?", (prod_id,))
        cursor.execute("DELETE FROM products WHERE id = ?", (prod_id,))
        conn.commit()
        conn.close()
        print(f"Successfully deleted local screenshot product: {prod_id}")
    except Exception as e:
        print(f"Failed to delete local product {prod_id}: {e}")

def create_product_live(token, product):
    try:
        payload = {
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "currency": product["currency"],
            "brand_id": product["live_brand_id"],
            "category_id": product["live_category_id"],
            "gender": product["gender"],
            "main_image_url": product["main_image_url"],
            "fabric_type": product["fabric_type"],
            "size_type": product["size_type"],
            "stock_quantity": product["stock_quantity"],
            "editorial_tags": product["editorial_tags"],
            "storytelling_title": product["storytelling_title"],
            "storytelling_description": product["storytelling_description"],
            "mood_aesthetic": product["mood_aesthetic"],
            "occasion": product["occasion"],
            "garment_length": product["garment_length"],
            "care_instructions": product["care_instructions"],
            "color": product["color"],
            "material_details": product["material_details"],
            "origin_country": product["origin_country"],
            "garment_weight": product["garment_weight"],
            "sleeve_length": product["sleeve_length"],
            "lining": product["lining"],
            "closure_type": product["closure_type"],
            "sizes": product["sizes"]
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            CREATE_PRODUCT_URL,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "User-Agent": "Mozilla/5.0"
            }
        )
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            print(f"Successfully restored live beautiful product: {product['name']} (ID: {res_data.get('id')})")
            return res_data.get("id")
    except Exception as e:
        if hasattr(e, "read"):
            print(f"Error adding live beautiful product: {e} | {e.read().decode('utf-8')}")
        else:
            print(f"Error adding live beautiful product: {e}")
        return None

def create_product_local(prod_id, product):
    try:
        conn = sqlite3.connect("backend/vrital_dev.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO products (
                id, name, description, price, currency, brand_id, category_id, gender,
                main_image_url, fabric_type, size_type, stock_quantity, is_active,
                editorial_tags, storytelling_title, storytelling_description, mood_aesthetic,
                occasion, garment_length, care_instructions, color, material_details,
                origin_country, garment_weight, sleeve_length, lining, closure_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prod_id, product["name"], product["description"], product["price"], product["currency"],
            product["local_brand_id"], product["local_category_id"], product["gender"],
            product["main_image_url"], product["fabric_type"], product["size_type"], product["stock_quantity"],
            1, product["editorial_tags"], product["storytelling_title"], product["storytelling_description"],
            product["mood_aesthetic"], product["occasion"], product["garment_length"], product["care_instructions"],
            product["color"], product["material_details"], product["origin_country"], product["garment_weight"],
            product["sleeve_length"], product["lining"], product["closure_type"]
        ))
        
        for s in product["sizes"]:
            cursor.execute("""
                INSERT INTO product_sizes (product_id, size, stock)
                VALUES (?, ?, ?)
            """, (prod_id, s["size"], s["stock"]))
            
        conn.commit()
        conn.close()
        print(f"Successfully restored local beautiful product: {product['name']}")
    except Exception as e:
        print(f"Error adding local beautiful product: {e}")

def main():
    print("Logging in to production API...")
    token = login()
    if not token:
        print("Could not retrieve authentication token. Aborting.")
        return
        
    print("Deleting 12 screenshot-based products...")
    for p_id in screenshot_product_ids:
        delete_product_live(token, p_id)
        delete_product_local(p_id)
        
    print("Restoring 20 beautiful garments...")
    for prod in beautiful_products:
        live_id = create_product_live(token, prod)
        if live_id:
            create_product_local(live_id, prod)
        else:
            # Fallback
            random_id = str(uuid.uuid4())
            create_product_local(random_id, prod)

if __name__ == "__main__":
    main()
