/**
 * Home — Pure Luxury Minimalist Boutique (Zara / Celine / Saint Laurent Standard)
 * ===============================================================================
 * Ultra-clean, uncluttered, pure high-fashion experience:
 * - High-Resolution Editorial Hero with clean typography.
 * - Pristine Product Grid with instant Try-On & Bag interactions.
 */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { Sparkles, ArrowRight } from "lucide-react";
import api from "../api/client";
import { useLanguageStore } from "../store/useLanguageStore";
import { FALLBACK_PRODUCTS } from "../utils/fallbackData";

export default function Home() {
  const { language } = useLanguageStore();
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const { data: products, isLoading } = useProducts();
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (!brand_slug) {
      navigate("/discover");
      return;
    }
    setBrandLoading(true);

    api.get(`/products/brands/slug/${brand_slug}`)
      .then((res) => {
        setBrand(res.data);
      })
      .catch((err) => {
        console.error("Failed to load brand", err);
        setBrand({
          name: brand_slug.toUpperCase(),
          hero_title: brand_slug.toUpperCase(),
          hero_subtitle: "New Collection · Autumn/Winter Edition",
          hero_image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1600&fm=webp",
        });
      })
      .finally(() => setBrandLoading(false));
  }, [brand_slug, navigate]);

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border border-neutral-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // Merge products
  const dbProducts = products || [];
  const activeProducts = [...dbProducts];
  FALLBACK_PRODUCTS.forEach((fp) => {
    const exists = dbProducts.some((dp) => dp.name.toLowerCase() === fp.name.toLowerCase());
    if (!exists) activeProducts.push(fp);
  });

  const canonicalSlug = brand_slug?.toLowerCase();
  const fallbackBrandMap = { zara: 1, nike: 2, hm: 3, gucci: 4 };
  const fallbackId = fallbackBrandMap[canonicalSlug];

  const brandProducts = activeProducts.filter(
    (p) => p.brand?.slug?.toLowerCase() === canonicalSlug || 
           p.brand_id === brand?.id ||
           p.brand_id === fallbackId
  );

  // Category filter
  const filteredProducts = brandProducts.filter((p) => {
    if (activeCategory === "all") return true;
    const name = (p.name || "").toLowerCase();
    const cat = (p.category?.name || "").toLowerCase();
    const tags = (p.editorial_tags || "").toLowerCase();

    if (activeCategory === "dresses") return name.includes("dress") || cat.includes("dress") || tags.includes("dress");
    if (activeCategory === "tops") return name.includes("shirt") || name.includes("jacket") || name.includes("coat") || name.includes("blazer") || cat.includes("top");
    if (activeCategory === "bottoms") return name.includes("trouser") || name.includes("pant") || name.includes("skirt") || cat.includes("bottom");
    return true;
  });

  const categories = [
    { id: "all", labelEn: "All", labelAr: "الكل" },
    { id: "dresses", labelEn: "Dresses", labelAr: "فساتين" },
    { id: "tops", labelEn: "Jackets & Tops", labelAr: "جواكيت وقمصان" },
    { id: "bottoms", labelEn: "Trousers", labelAr: "بناطيل" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-primary selection:bg-black selection:text-white">
      <Navbar />

      {/* 1. MINIMALIST LUXURY HERO (Full-Screen Pure High Fashion) */}
      <section className="relative h-[90vh] md:h-[95vh] w-full flex items-end overflow-hidden bg-neutral-900">
        <img
          src={brand?.hero_image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1600&fm=webp"}
          alt={brand?.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 md:px-12 pb-14 md:pb-20 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-white/80 block">
              {brand?.name || "ZARA"} · NEW COLLECTION
            </span>
            <h1 className="heading-serif text-5xl md:text-8xl text-white font-light tracking-tight leading-none">
              {brand?.name || "Atelier"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/brands/${brand_slug}/shop`}
              className="btn-black bg-white !text-black hover:bg-neutral-200 py-3.5 px-8 text-[10px] font-bold tracking-widest uppercase rounded-none transition-all shadow-md"
            >
              {language === "ar" ? "تسوق التشكيلة" : "Shop Collection"}
            </Link>
            <Link
              to={`/brands/${brand_slug}/tryon`}
              className="btn-outline !text-white !border-white/50 hover:!border-white hover:!bg-white/10 py-3.5 px-6 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm flex items-center gap-2 rounded-none transition-all"
            >
              <Sparkles size={12} className="text-amber-300" />
              <span>{language === "ar" ? "غرفة القياس الذكية" : "AI Try-On"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PURE & CLEAN PRODUCT FEED */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-16 md:py-24">
        
        {/* Minimalist Header with Clean Category Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-rule mb-12">
          <h2 className="heading-serif text-2xl md:text-3xl text-primary font-light">
            {language === "ar" ? "المجموعة الحصرية" : "The Collection"}
          </h2>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 border transition-all ${
                  activeCategory === cat.id
                    ? "bg-black text-white border-black"
                    : "bg-transparent text-secondary border-rule hover:border-black hover:text-primary"
                }`}
              >
                {language === "ar" ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Clean 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Minimalist Explore Footer Link */}
        <div className="text-center pt-20 border-t border-rule mt-20">
          <Link
            to={`/brands/${brand_slug}/shop`}
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-primary hover:text-secondary border-b border-black pb-1.5 transition-colors"
          >
            <span>{language === "ar" ? "استعراض كافة قطع المتجر" : "View All Pieces in Store"}</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
