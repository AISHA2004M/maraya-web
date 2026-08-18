export const FALLBACK_PRODUCTS = [
  // ─── CUSTOM ADDED PIECES ──────────────────────────────────────────────────
  {
    id: "eb838ca7-45be-4986-a77b-96e87e2245ee",
    name: "Zara Draped Asymmetric Midi Dress",
    description: "An elegant sleeveless draped midi dress in deep chocolate brown, featuring an asymmetric hem and defined waistband.",
    price: 145000,
    currency: "IQD",
    brand_id: 1,
    brand: { id: 1, name: "Zara", slug: "zara" },
    category_id: 2,
    category: { id: 2, name: "Dresses" },
    gender: "women",
    main_image_url: "/uploads/eb838ca7-45be-4986-a77b-96e87e2245ee.jpg",
    fabric_type: "Satin Crepe",
    editorial_tags: "Evening Elegance, Draped",
    mood_aesthetic: "Stealth Wealth",
    occasion: "Cocktail Party",
    stock_quantity: 75,
    sizes: [
      { size: "XS", stock: 15 },
      { size: "S", stock: 15 },
      { size: "M", stock: 15 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 15 }
    ]
  },
  {
    id: "8750612d-0446-4251-9d9c-c299d1d1eb75",
    name: "Gucci Red Velvet Double-Breasted Blazer",
    description: "A luxurious double-breasted blazer in vibrant red velvet, featuring peak lapels, flap pockets, and structured shoulders. Made in Italy.",
    price: 2450000,
    currency: "IQD",
    brand_id: 4,
    brand: { id: 4, name: "Gucci", slug: "gucci" },
    category_id: 5,
    category: { id: 5, name: "Outerwear" },
    gender: "unisex",
    main_image_url: "/uploads/8750612d-0446-4251-9d9c-c299d1d1eb75.jpg",
    fabric_type: "Premium Velvet",
    editorial_tags: "Gala Nights, Velvet Luxe",
    mood_aesthetic: "Avant-Garde",
    occasion: "Formal, Gala",
    stock_quantity: 75,
    sizes: [
      { size: "XS", stock: 15 },
      { size: "S", stock: 15 },
      { size: "M", stock: 15 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 15 }
    ]
  },
  {
    id: "f02a279c-3ec8-436d-b2aa-4293840dca09",
    name: "Zara Oversized Sky Blue Poplin Shirt",
    description: "A relaxed, oversized poplin shirt in a fresh sky blue tone. Timeless and versatile for any occasion.",
    price: 85000,
    currency: "IQD",
    brand_id: 1,
    brand: { id: 1, name: "Zara", slug: "zara" },
    category_id: 3,
    category: { id: 3, name: "Tops" },
    gender: "unisex",
    main_image_url: "/uploads/f02a279c-3ec8-436d-b2aa-4293840dca09.png",
    fabric_type: "100% Poplin Cotton",
    editorial_tags: "Minimalist Core, Summer Essential",
    mood_aesthetic: "Cozy Minimalism",
    occasion: "Daily Outing",
    stock_quantity: 75,
    sizes: [
      { size: "XS", stock: 15 },
      { size: "S", stock: 15 },
      { size: "M", stock: 15 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 15 }
    ]
  },
  {
    id: "3c6b5f9b-11d8-49c7-a66c-b683dbe92593",
    name: "H&M Botanical Print Maxi Dress",
    description: "A flowing long-sleeve maxi dress in a beautiful blue and white botanical print, with a gathered waist and v-neckline.",
    price: 110000,
    currency: "IQD",
    brand_id: 3,
    brand: { id: 3, name: "H&M", slug: "hm" },
    category_id: 2,
    category: { id: 2, name: "Dresses" },
    gender: "women",
    main_image_url: "/uploads/3c6b5f9b-11d8-49c7-a66c-b683dbe92593.jpg",
    fabric_type: "Viscose Blend",
    editorial_tags: "Spring Garden, Botanical",
    mood_aesthetic: "Minimalist Core",
    occasion: "Daily Outing",
    stock_quantity: 75,
    sizes: [
      { size: "XS", stock: 15 },
      { size: "S", stock: 15 },
      { size: "M", stock: 15 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 15 }
    ]
  },
  {
    id: "313f681a-541d-4ad6-835a-cde83b8ba99d",
    name: "Zara Off-White Ruffled One-Shoulder Mini Dress",
    description: "An elegant one-shoulder mini dress with cascading ruffle detail in off-white. Perfect for parties.",
    price: 165000,
    currency: "IQD",
    brand_id: 1,
    brand: { id: 1, name: "Zara", slug: "zara" },
    category_id: 2,
    category: { id: 2, name: "Dresses" },
    gender: "women",
    main_image_url: "/uploads/313f681a-541d-4ad6-835a-cde83b8ba99d.jpg",
    fabric_type: "Poly Chiffon",
    editorial_tags: "Party Glam, Statement Ruffle",
    mood_aesthetic: "Evening Elegance",
    occasion: "Cocktail Party",
    stock_quantity: 75,
    sizes: [
      { size: "XS", stock: 15 },
      { size: "S", stock: 15 },
      { size: "M", stock: 15 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 15 }
    ]
  },

  // ─── ZARA ───────────────────────────────────────────────────────────────────
  { id: 1,  name: "Linen Halter Jumpsuit",           description: "Elegant white linen sleeveless halter jumpsuit, perfect for summer days.",             price: 89.99,  brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 2, name: "Dresses"   }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=400&q=75",  fabric_type: "Linen Blend",       editorial_tags: "Summer Atelier, Minimalist Core",       mood_aesthetic: "Minimalist Core",   occasion: "Daily Outing",    stock_quantity: 50  },
  { id: 3,  name: "Slim Fit Chinos",                 description: "Tailored slim-fit chino trousers in khaki.",                                           price: 59.99,  brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 4, name: "Bottoms"    }, gender: "men",    main_image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=75",  fabric_type: "Stretch Cotton",    editorial_tags: "Minimalist Core, Everyday Luxury",      mood_aesthetic: "Stealth Wealth",    occasion: "Smart Casual",    stock_quantity: 80  },
  { id: 8,  name: "Checked Wool Suit",               description: "A tailored three-piece suit featuring a classic blue check pattern.",                  price: 185.00, brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 5, name: "Outerwear" }, gender: "men",    main_image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=75",  fabric_type: "Wool Blend",        editorial_tags: "Classic Checked, Tailored",             mood_aesthetic: "Stealth Wealth",    occasion: "Formal",          stock_quantity: 30  },
  { id: 9,  name: "Structured Blazer",               description: "Sharp-shouldered blazer in ivory with a clean minimalist silhouette.",                 price: 129.99, brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 5, name: "Outerwear" }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=400&q=75",  fabric_type: "Poly Crepe",        editorial_tags: "Power Dressing, Minimalist Core",       mood_aesthetic: "Stealth Wealth",    occasion: "Business Formal", stock_quantity: 40  },
  { id: 10, name: "Satin Midi Skirt",                description: "Floor-grazing satin skirt in dusty rose with a subtle sheen.",                        price: 74.99,  brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 4, name: "Bottoms"    }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&q=75",  fabric_type: "Satin",             editorial_tags: "Evening Elegance, Statement Look",      mood_aesthetic: "Stealth Wealth",    occasion: "Cocktail Party",  stock_quantity: 45  },
  { id: 11, name: "Relaxed Linen Shirt",             description: "Breathable oversized linen shirt, perfect for layering.",                             price: 49.99,  brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 3, name: "Tops"       }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=75",  fabric_type: "100% Linen",        editorial_tags: "Summer Casual, Vacation Essentials",   mood_aesthetic: "Cozy Minimalism",   occasion: "Daily Outing",    stock_quantity: 90  },
  { id: 12, name: "Wide Leg Trousers",               description: "High-waisted wide-leg trousers in camel tailored fabric.",                            price: 89.99,  brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 4, name: "Bottoms"    }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1614251055880-ee96e4803393?auto=format&fit=crop&w=400&q=75",  fabric_type: "Tailored Crepe",    editorial_tags: "Power Dressing, Elegant Edit",         mood_aesthetic: "Stealth Wealth",    occasion: "Smart Casual",    stock_quantity: 60  },
  { id: 13, name: "Knit Cardigan",                   description: "Soft chunky knit cardigan in warm oatmeal tones.",                                    price: 69.99,  brand_id: 1, brand: { id: 1, name: "Zara", slug: "zara" }, category: { id: 5, name: "Outerwear" }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=400&q=75",  fabric_type: "Wool Knit",         editorial_tags: "Winter Warmth, Cozy Capsule",          mood_aesthetic: "Cozy Minimalism",   occasion: "Daily Outing",    stock_quantity: 55  },

  // ─── NIKE ───────────────────────────────────────────────────────────────────
  { id: 4,  name: "Air Max Sneakers",                description: "Iconic Nike Air Max for street and sport.",                                           price: 139.99, brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 1, name: "Clothing"   }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=75",  fabric_type: "Mesh/Synthetic",    editorial_tags: "Cyber Streetwear, Avant-Garde",        mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 60  },
  { id: 14, name: "Tech Fleece Hoodie",              description: "Lightweight tech fleece pullover hoodie for performance and style.",                   price: 109.99, brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 5, name: "Outerwear" }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=75",  fabric_type: "Tech Fleece",       editorial_tags: "Streetwear, Athletic Luxe",             mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 80  },
  { id: 15, name: "Dri-FIT Training Shirt",          description: "Sweat-wicking performance training shirt for intense workouts.",                       price: 44.99,  brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 3, name: "Tops"       }, gender: "men",    main_image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=75",  fabric_type: "Dri-FIT Polyester", editorial_tags: "Performance, Training Essentials",     mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 120 },
  { id: 16, name: "Windrunner Jacket",               description: "Iconic Nike Windrunner with bold color-block design and lightweight woven fabric.",    price: 119.99, brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 5, name: "Outerwear" }, gender: "men",    main_image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=75",  fabric_type: "Ripstop Nylon",     editorial_tags: "Sporty Luxe, Streetwear",              mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 50  },
  { id: 17, name: "Yoga Flow Leggings",              description: "High-waist yoga leggings with four-way stretch for full range of motion.",            price: 79.99,  brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 4, name: "Bottoms"    }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=400&q=75",  fabric_type: "Power Stretch",     editorial_tags: "Activewear, Performance Wear",         mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 100 },
  { id: 18, name: "Jordan Graphic Tee",              description: "Classic Jordan brand graphic tee with oversized logo.",                               price: 54.99,  brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 3, name: "Tops"       }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=400&q=75",  fabric_type: "Heavyweight Cotton", editorial_tags: "Streetwear, Archive Edit",             mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 70  },
  { id: 19, name: "Running Shorts",                  description: "Lightweight 5-inch running shorts with inner liner and zip pocket.",                   price: 39.99,  brand_id: 2, brand: { id: 2, name: "Nike", slug: "nike" }, category: { id: 4, name: "Bottoms"    }, gender: "men",    main_image_url: "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?auto=format&fit=crop&w=400&q=75",  fabric_type: "Dri-FIT",           editorial_tags: "Running, Performance",                  mood_aesthetic: "Avant-Garde",       occasion: "Active Urban",    stock_quantity: 90  },

  // ─── H&M ────────────────────────────────────────────────────────────────────
  { id: 2,  name: "Classic White Tee",               description: "Essential cotton crew-neck tee in crisp white.",                                       price: 29.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 3, name: "Tops"       }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=75",  fabric_type: "100% Cotton",       editorial_tags: "Minimalist Core, Daily Foundations",   mood_aesthetic: "Cozy Minimalism",   occasion: "Daily Outing",    stock_quantity: 200 },
  { id: 7,  name: "Denim Jacket",                    description: "Classic washed denim jacket, a wardrobe staple.",                                       price: 79.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 5, name: "Outerwear" }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=75",  fabric_type: "Denim",             editorial_tags: "Minimalist Core, Wardrobe Staples",    mood_aesthetic: "Cozy Minimalism",   occasion: "Daily Outing",    stock_quantity: 70  },
  { id: 20, name: "Floral Wrap Dress",               description: "Lightweight floral wrap dress with v-neckline, perfect for warm weather.",             price: 49.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 2, name: "Dresses"   }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=400&q=75",  fabric_type: "Woven Viscose",     editorial_tags: "Spring Garden, Feminine",               mood_aesthetic: "Minimalist Core",   occasion: "Daily Outing",    stock_quantity: 85  },
  { id: 21, name: "Oversized Blazer",                description: "Relaxed-fit oversized blazer in a warm beige tone.",                                  price: 89.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 5, name: "Outerwear" }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=400&q=75",  fabric_type: "Woven Mix",         editorial_tags: "Office Chic, Power Dressing",          mood_aesthetic: "Stealth Wealth",    occasion: "Smart Casual",    stock_quantity: 55  },
  { id: 22, name: "Ribbed Knit Sweater",             description: "Slim-fit ribbed knit turtleneck sweater in camel.",                                   price: 39.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 3, name: "Tops"       }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=75",  fabric_type: "Fine Rib Knit",     editorial_tags: "Autumn Layers, Cozy Chic",             mood_aesthetic: "Cozy Minimalism",   occasion: "Daily Outing",    stock_quantity: 110 },
  { id: 23, name: "Slim Straight Jeans",             description: "Classic straight-cut jeans in mid-blue wash.",                                         price: 59.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 4, name: "Bottoms"    }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=75",  fabric_type: "Stretch Denim",     editorial_tags: "Denim Edit, Everyday Wear",            mood_aesthetic: "Cozy Minimalism",   occasion: "Daily Outing",    stock_quantity: 130 },
  { id: 24, name: "Lace Trim Camisole",              description: "Delicate satin camisole with lace trim in ivory.",                                     price: 24.99,  brand_id: 3, brand: { id: 3, name: "H&M", slug: "hm"   }, category: { id: 3, name: "Tops"       }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=75",  fabric_type: "Satin/Lace",        editorial_tags: "Lingerie Inspired, Feminine",          mood_aesthetic: "Stealth Wealth",    occasion: "Evening Outing",  stock_quantity: 75  },

  // ─── GUCCI ──────────────────────────────────────────────────────────────────
  { id: 5,  name: "Leather Biker Jacket",            description: "Premium leather motorcycle jacket with silver hardware.",                               price: 299.99, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 5, name: "Outerwear" }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=75",  fabric_type: "Genuine Leather",   editorial_tags: "After Hours, Rock Couture",            mood_aesthetic: "Avant-Garde",       occasion: "Club & Concert",  stock_quantity: 25  },
  { id: 6,  name: "Mini Silk Slip Dress",            description: "Luxurious silk-satin slip dress in champagne.",                                        price: 199.99, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 2, name: "Dresses"   }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=75",  fabric_type: "Silk",              editorial_tags: "Evening Elegance, After Hours",        mood_aesthetic: "Stealth Wealth",    occasion: "Cocktail Party",  stock_quantity: 30  },
  { id: 25, name: "GG Monogram Cardigan",            description: "Fine wool cardigan with iconic GG jacquard monogram pattern.",                        price: 450.00, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 3, name: "Tops"       }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=75",  fabric_type: "Fine Wool",         editorial_tags: "Luxury Statement, Heritage Pattern",   mood_aesthetic: "Stealth Wealth",    occasion: "Smart Casual",    stock_quantity: 15  },
  { id: 26, name: "Silk Floral Blouse",              description: "Signature botanical floral print silk blouse with relaxed collar.",                    price: 380.00, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 3, name: "Tops"       }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=400&q=75",  fabric_type: "100% Silk",         editorial_tags: "Flora Print, Evening Garden",          mood_aesthetic: "Stealth Wealth",    occasion: "Cocktail Party",  stock_quantity: 20  },
  { id: 27, name: "Tailored Trench Coat",            description: "Classic double-breasted trench coat in a warm camel tone with signature details.",     price: 520.00, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 5, name: "Outerwear" }, gender: "unisex", main_image_url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=75",  fabric_type: "Gabardine",         editorial_tags: "Heritage Luxe, Statement Outerwear",   mood_aesthetic: "Stealth Wealth",    occasion: "Business Formal", stock_quantity: 12  },
  { id: 28, name: "Velvet Blazer",                   description: "Opulent deep burgundy velvet blazer with jewel-tone lining.",                         price: 420.00, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 5, name: "Outerwear" }, gender: "men",    main_image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=75",  fabric_type: "Velvet",            editorial_tags: "Gala Nights, Rock Couture",            mood_aesthetic: "Avant-Garde",       occasion: "Club & Concert",  stock_quantity: 18  },
  { id: 29, name: "Pleated Silk Trousers",           description: "Wide-leg pleated trousers in ivory silk for a polished evening look.",                 price: 340.00, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 4, name: "Bottoms"    }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=75",  fabric_type: "Heavy Silk",        editorial_tags: "Evening Elegance, Palazzo Style",     mood_aesthetic: "Stealth Wealth",    occasion: "Cocktail Party",  stock_quantity: 22  },
  { id: 30, name: "Embroidered Maxi Dress",          description: "Flowing chiffon maxi dress with hand-embroidered floral detailing.",                   price: 580.00, brand_id: 4, brand: { id: 4, name: "Gucci", slug: "gucci" }, category: { id: 2, name: "Dresses"   }, gender: "women",  main_image_url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=75",  fabric_type: "Silk Chiffon",      editorial_tags: "Garden Party, High Fashion",           mood_aesthetic: "Stealth Wealth",    occasion: "Formal",          stock_quantity: 10  },
];

export const FALLBACK_BRANDS = [
  { id: 1, name: "Zara",  slug: "zara"  },
  { id: 2, name: "Nike",  slug: "nike"  },
  { id: 3, name: "H&M",   slug: "hm"    },
  { id: 4, name: "Gucci", slug: "gucci" },
];

export const FALLBACK_CATEGORIES = [
  { id: 1, name: "Clothing"  },
  { id: 2, name: "Dresses"   },
  { id: 3, name: "Tops"      },
  { id: 4, name: "Bottoms"   },
  { id: 5, name: "Outerwear" },
];

export function findFallbackProduct(id) {
  if (!FALLBACK_PRODUCTS || FALLBACK_PRODUCTS.length === 0) return null;
  if (!id) return FALLBACK_PRODUCTS[0];

  const strId = String(id).toLowerCase();

  // 1. Exact ID match
  let found = FALLBACK_PRODUCTS.find(
    (p) => String(p.id).toLowerCase() === strId
  );
  if (found) return found;

  // 2. Name or tag substring match
  found = FALLBACK_PRODUCTS.find(
    (p) => p.name.toLowerCase().includes(strId) || strId.includes(p.name.toLowerCase())
  );
  if (found) return found;

  // 3. Numeric ID index fallback
  const numId = parseInt(id, 10);
  if (!isNaN(numId) && numId > 0) {
    return FALLBACK_PRODUCTS[(numId - 1) % FALLBACK_PRODUCTS.length];
  }

  // 4. Always return a valid product as ultimate safety net — NEVER fail to render
  return FALLBACK_PRODUCTS[0];
}
