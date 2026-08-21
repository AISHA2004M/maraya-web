/**
 * Home — Flagship Luxury Digital Atelier (Rich Zara / High-Fashion Editorial Layout)
 * ===================================================================================
 * Complete multi-section editorial magazine experience:
 * 1. Cinematic Hero Campaign Banner
 * 2. Brand Story & Tailoring Philosophy
 * 3. Seasonal Campaign Editorial Grid (Summer/Spring)
 * 4. Evening Lookbook [After Hours] with Atelier Detailing
 * 5. Currently Coveted (In High Demand Horizontal Edit)
 * 6. The Luxury Canvas (Daily Foundations Asymmetric Triptych)
 * 7. Digital Atelier AI Suite (Visual Search & 4K Virtual Fitting Room)
 */
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { Sparkles, ArrowRight, Flame, Camera } from "lucide-react";
import api from "../api/client";
import { useLanguageStore } from "../store/useLanguageStore";
import { FALLBACK_PRODUCTS } from "../utils/fallbackData";

// Partition products dynamically across editorial sections
function partitionProducts(allProducts) {
  if (!allProducts || allProducts.length === 0) {
    return { seasonal: [], evening: [], trending: [], essentials: [] };
  }

  const usedIds = new Set();

  // 1. Evening Edit (Silk slip, dress, jackets)
  const evening = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    const name = (p.name || "").toLowerCase();
    const tags = (p.editorial_tags || "").toLowerCase();
    const match =
      name.includes("dress") ||
      name.includes("slip") ||
      name.includes("jacket") ||
      name.includes("biker") ||
      tags.includes("evening") ||
      tags.includes("hours");
    if (match) {
      usedIds.add(p.id);
      return true;
    }
    return false;
  }).slice(0, 2);

  // 2. High Demand / Trending (Sneakers, coats, trenches)
  const trending = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    const name = (p.name || "").toLowerCase();
    const match =
      name.includes("sneaker") ||
      name.includes("shoe") ||
      name.includes("air") ||
      name.includes("trench") ||
      Number(p.price) > 100;
    if (match) {
      usedIds.add(p.id);
      return true;
    }
    return false;
  }).slice(0, 4);

  // 3. Daily Foundations / Essentials (Tee, Chinos, trousers, shirts)
  const essentials = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    const name = (p.name || "").toLowerCase();
    const match =
      name.includes("tee") ||
      name.includes("t-shirt") ||
      name.includes("chino") ||
      name.includes("pant") ||
      name.includes("trouser") ||
      name.includes("linen") ||
      name.includes("shirt") ||
      name.includes("poplin") ||
      name.includes("denim");
    if (match) {
      usedIds.add(p.id);
      return true;
    }
    return false;
  }).slice(0, 3);

  // 4. Seasonal Edit (Anything else remaining)
  const seasonal = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    usedIds.add(p.id);
    return true;
  }).slice(0, 2);

  return { seasonal, evening, trending, essentials };
}

// Scroll-reveal intersection observer hook
function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

const FALLBACK_BRANDS_CMS = [
  {
    id: 1,
    name: "Zara",
    slug: "zara",
    description: "Modern street tailoring, unstructured coats, and sleek minimal aesthetics designed for the contemporary urban lifestyle.",
    logo_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=200&q=75",
    banner_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    hero_title: "Zara Atelier",
    hero_subtitle: "Modern street tailoring, unstructured coats, and sleek minimal aesthetics designed for the contemporary urban lifestyle.",
    hero_image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1600&fm=webp",
    hero_cta_text: "Shop The Campaign",
    story_title: "Philosophy of Modern Street Tailoring",
    story_description: "Zara Atelier reinterprets modern silhouettes through precision tailoring, tactile fabrics, and effortless versatility.",
    story_image_url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=75",
    philosophy_title: "Democratic Design",
    philosophy_text: "Style is a deeply personal signature, a silent dialogue between dress and context. We redefine contemporary luxury through influential structural lines.",
    accent_color: "#FFFFFF",
    font_family: "Montserrat, sans-serif",
    seasonal_title: "Summer/Spring Edit",
    seasonal_desc: "Curated drapes and contemporary lightweight textures engineered for effortless movement."
  },
  {
    id: 2,
    name: "Nike",
    slug: "nike",
    description: "Technological innovation meets high-performance streetwear. Pushing boundaries of movement, form, and performance fashion.",
    logo_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=75",
    banner_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80",
    hero_title: "Nike Lab",
    hero_subtitle: "Technological innovation meets high-performance streetwear.",
    hero_image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80",
    hero_cta_text: "Explore Nike",
    story_title: "The Athletic Evolution",
    story_description: "Pushing boundaries of movement, form, and athletic fashion. Engineered with custom technical fabrics and dynamic silhouettes.",
    story_image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=75",
    philosophy_title: "Performance & Style",
    philosophy_text: "Design should not compromise performance. Our garments are building blocks for motion and stature in urban spaces.",
    accent_color: "#F3F4F6",
    font_family: "Hanken Grotesk, sans-serif",
    seasonal_title: "Active Tech Campaign",
    seasonal_desc: "Technical details and raw pieces."
  },
  {
    id: 4,
    name: "Gucci",
    slug: "gucci",
    description: "Renowned Italian luxury fashion house redefining 21st-century luxury through influential, innovative, and progressive design codes.",
    logo_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=200&q=75",
    banner_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80",
    hero_title: "Gucci Atelier",
    hero_subtitle: "Redefining 21st-century luxury through innovative and progressive design codes.",
    hero_image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80",
    hero_cta_text: "Enter Gucci",
    story_title: "The Italian Silhouette",
    story_description: "A fluid draping narrative designed to float gracefully with movement. Crafted in our Italian ateliers with hand-painted motifs.",
    story_image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=75",
    philosophy_title: "Heritage & Drama",
    philosophy_text: "Style is a deeply personal signature, a silent dialogue between dress and context. We redefine luxury through influential codes.",
    accent_color: "#FAF5EC",
    font_family: "Bodoni Moda, serif",
    seasonal_title: "Autumnal Narrative",
    seasonal_desc: "Discover structural lines and seasonal drapes."
  }
];

export default function Home() {
  const { language } = useLanguageStore();
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const { data: products, isLoading } = useProducts();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!brand_slug) {
      navigate("/discover");
      return;
    }
    setBrandLoading(true);

    let active = true;
    const timer = setTimeout(() => {
      if (active && brandLoading) {
        const fallback = FALLBACK_BRANDS_CMS.find((b) => b.slug === brand_slug.toLowerCase());
        if (fallback) {
          setBrand(fallback);
          setBrandLoading(false);
        } else {
          navigate("/discover");
        }
      }
    }, 800);

    api.get(`/products/brands/slug/${brand_slug}`)
      .then((res) => {
        if (active) {
          setBrand(res.data);
          setBrandLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load brand", err);
        if (active) {
          const fallback = FALLBACK_BRANDS_CMS.find((b) => b.slug === brand_slug.toLowerCase());
          if (fallback) {
            setBrand(fallback);
            setBrandLoading(false);
          } else {
            navigate("/discover");
          }
        }
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [brand_slug, navigate]);

  // Apply typography
  useEffect(() => {
    if (brand) {
      const fontName = brand.font_family || "Hanken Grotesk, sans-serif";
      if (brand.font_family && brand.font_family.includes("Bodoni Moda")) {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      } else if (brand.font_family && brand.font_family.includes("Montserrat")) {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      document.body.style.fontFamily = fontName;
      if (brand.accent_color) {
        document.documentElement.style.setProperty("--accent-color", brand.accent_color);
      }
    }
    return () => {
      document.body.style.fontFamily = "";
      document.documentElement.style.setProperty("--accent-color", "");
    };
  }, [brand]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveals
  const [storyRef, storyVisible] = useScrollReveal();
  const [seasonRef, seasonVisible] = useScrollReveal();
  const [eveningRef, eveningVisible] = useScrollReveal();
  const [trendingRef, trendingVisible] = useScrollReveal();
  const [essentialsRef, essentialsVisible] = useScrollReveal();
  const [fittingRef, fittingVisible] = useScrollReveal();

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-black rounded-full animate-spin mx-auto" />
          <p className="font-display text-xs tracking-widest text-secondary uppercase">Entering Atelier...</p>
        </div>
      </div>
    );
  }

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

  const { seasonal, evening, trending, essentials } = partitionProducts(brandProducts);
  const brandBg = brand?.accent_color || "#FFFFFF";

  return (
    <div className="min-h-screen font-sans text-primary overflow-x-hidden transition-colors duration-500 bg-white" style={{ backgroundColor: brandBg }}>
      <Navbar />

      {/* 1. HERO CAMPAIGN SECTION (Cinematic & Clean) */}
      <section className="relative h-[100svh] w-full flex items-end overflow-hidden bg-black">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={brand?.hero_image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1600&fm=webp"}
            alt={brand?.name}
            className="absolute inset-0 w-full h-full object-cover will-change-transform scale-[1.05]"
            style={{
              transform: `scale(1.05) translateY(${scrollY * 0.08}px)`,
              transition: "transform 0.1s linear",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-6 md:px-12 pb-16 md:pb-24">
          <div className="max-w-xl space-y-6">
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-white/80">
              {brand?.seasonal_title || "AUTUMN VANGUARD EDIT"}
            </p>
            <h1
              className="heading-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-white tracking-tight"
              style={{ animation: "fadeSlideUp 0.8s ease both" }}
            >
              {brand?.hero_title || brand?.name || "Zara"}
            </h1>
            <p className="text-white/70 text-sm md:text-base font-light leading-relaxed max-w-sm">
              {brand?.hero_subtitle || brand?.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={`/brands/${brand_slug}/shop`}
                className="btn-black bg-white !text-black hover:bg-neutral-100 py-3.5 px-8 text-[10px] font-bold tracking-widest uppercase rounded-none transition-all shadow-lg"
              >
                {brand?.hero_cta_text || (language === "ar" ? "تسوق التشكيلة" : "Shop The Campaign")}
              </Link>
              <Link
                to={`/brands/${brand_slug}/tryon`}
                className="btn-outline !text-white !border-white/50 hover:!border-white hover:!bg-white/10 py-3.5 px-6 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm flex items-center gap-2 rounded-none transition-all"
              >
                <Sparkles size={12} className="text-amber-300" />
                <span>{language === "ar" ? "غرفة القياس الذكية" : "AI Try-On Room"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND STORY SECTION */}
      <section
        ref={storyRef}
        className={`max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32 transition-all duration-[900ms] ${
          storyVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
        }`}
      >
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
          <div className="space-y-6">
            <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
              The Brand Story
            </span>
            <h2 className="heading-serif text-3xl md:text-5xl text-primary font-light">
              {brand?.story_title || `Philosophy of ${brand?.name}`}
            </h2>
            <p className="text-secondary text-sm md:text-base font-light leading-relaxed">
              {brand?.story_description || brand?.description}
            </p>
            <div className="pt-2">
              <Link
                to={`/brands/${brand_slug}/shop?mood=Stealth+Wealth`}
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-primary hover:text-secondary border-b border-black pb-1 transition-colors"
              >
                <span>{language === "ar" ? "استكشف قطع الأتيلييه ←" : "Explore Atelier Edit →"}</span>
              </Link>
            </div>
          </div>

          <div className="aspect-[16/10] overflow-hidden rounded-sm border border-rule bg-neutral-50 shadow-sm relative group">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=80"
              alt="Atelier Studio"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6000ms]"
            />
          </div>
        </div>
      </section>

      {/* 3. SEASONAL CAMPAIGN GRID (Summer / Resort Edit) */}
      {seasonal.length > 0 && (
        <section
          ref={seasonRef}
          className={`border-t border-rule bg-[#faf9f7]/40 transition-all duration-[1000ms] ${
            seasonVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
          }`}
        >
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
            <div className="grid lg:grid-cols-[1fr_1.8fr] gap-12 lg:gap-24 items-start">
              
              {/* Campaign Story */}
              <div className="space-y-8 lg:sticky top-32">
                <div className="space-y-3">
                  <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
                    Seasonal Campaign
                  </span>
                  <h2 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.05]">
                    {brand?.seasonal_title || "Seasonal Edit"}
                  </h2>
                </div>

                <div className="aspect-[3/4] overflow-hidden bg-neutral-100 rounded-sm border border-rule">
                  <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                    alt="Seasonal Editorial"
                    className="w-full h-full object-cover transition-transform duration-[8000ms] hover:scale-105"
                  />
                </div>

                <p className="text-secondary text-sm font-light leading-relaxed max-w-sm">
                  {brand?.seasonal_desc || "Explore raw tailored pieces and elegant structural lines crafted for modern lifestyles."}
                </p>

                <Link
                  to={`/brands/${brand_slug}/shop?mood=Summer+Atelier`}
                  className="btn-black inline-flex items-center gap-2 py-3.5 px-8 text-[9px] font-bold tracking-[0.2em] uppercase rounded-none"
                >
                  <span>{language === "ar" ? "استكشف تشكيلة الصيف" : "Explore The Collection"}</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              {/* Products */}
              <div>
                <div className="flex justify-between items-baseline border-b border-rule pb-4 mb-12">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-secondary">
                    Bespoke Creations
                  </span>
                  <Link
                    to={`/brands/${brand_slug}/shop?mood=Summer+Atelier`}
                    className="text-[9px] text-primary font-bold uppercase tracking-widest hover:underline"
                  >
                    [ {seasonal.length} Unique Designs ]
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-16">
                  {seasonal.map((product, idx) => (
                    <div
                      key={product.id}
                      className={idx % 2 === 1 ? "md:translate-y-16 transition-transform duration-500" : ""}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 4. EVENING LOOKBOOK SECTION */}
      {evening.length > 0 && (
        <section
          ref={eveningRef}
          className={`border-t border-rule bg-white transition-all duration-[1000ms] ${
            eveningVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
          }`}
        >
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
            <div className="grid lg:grid-cols-[1.8fr_1fr] gap-12 lg:gap-24 items-start">
              
              {/* Products */}
              <div className="order-2 lg:order-1">
                <div className="flex justify-between items-baseline border-b border-rule pb-4 mb-12">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-secondary">
                    Evening Lookbook
                  </span>
                  <span className="text-[9px] text-secondary font-light uppercase tracking-widest">
                    [ After Hours ]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-16">
                  {evening.map((product) => (
                    <div key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Story */}
              <div className="order-1 lg:order-2 lg:sticky top-32 space-y-8">
                <div className="space-y-3">
                  <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
                    Sensory Details
                  </span>
                  <h2 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.05]">
                    Atelier<br />Detailing
                  </h2>
                </div>

                <div className="aspect-[3/4] overflow-hidden bg-neutral-900 rounded-sm border border-rule relative group shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"
                    alt="Evening Couture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6000ms]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-6">
                    <p className="text-white text-xs font-light tracking-wide">
                      Sensory draping in midnight silk and velvet.
                    </p>
                  </div>
                </div>

                <p className="text-secondary text-sm font-light leading-relaxed max-w-sm">
                  Experience sensory draping and fine tailoring. Every stitch designed to convey weight, presence, and status in daily outings.
                </p>

                <Link
                  to={`/brands/${brand_slug}/shop?mood=Evening+Elegance`}
                  className="btn-outline border-black text-black hover:bg-black hover:text-white inline-flex items-center gap-2 py-3.5 px-8 text-[9px] font-bold tracking-[0.2em] uppercase rounded-none transition-all"
                >
                  <span>{language === "ar" ? "تصفح أزياء السهرة" : "View Full Lookbook"}</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 5. CURRENTLY COVETED / TRENDING SECTION */}
      {trending.length > 0 && (
        <section
          ref={trendingRef}
          className={`border-t border-b border-rule bg-white/40 backdrop-blur-sm transition-all duration-[1000ms] ${
            trendingVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
          }`}
        >
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
            <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center justify-between mb-12">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <Flame size={16} strokeWidth={1.5} className="text-amber-600" />
                  <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase">
                    In High Demand
                  </span>
                </div>
                <h2 className="heading-serif text-3xl md:text-5xl text-primary font-light">
                  Currently Coveted
                </h2>
                <p className="text-secondary text-sm font-light leading-relaxed">
                  Boutique designs currently circulating in active digital dressing rooms.
                </p>
              </div>

              <Link
                to={`/brands/${brand_slug}/shop?sort=price_desc`}
                className="shrink-0 inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.25em] uppercase text-primary hover:text-secondary transition-colors"
              >
                <span>{language === "ar" ? "عرض الأكثر طلباً" : "View Hot Items"}</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-8 pb-6 pt-2 scrollbar-thin scrollbar-thumb-rule">
              {trending.map((product) => (
                <div key={product.id} className="w-[280px] md:w-[320px] shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. WARDROBE ESSENTIALS (Asymmetric Triptych) */}
      {essentials.length > 0 && (
        <section
          ref={essentialsRef}
          className={`border-t border-rule transition-all duration-[1000ms] ${
            essentialsVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
          }`}
        >
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-40">
            <div className="max-w-lg mx-auto text-center space-y-4 mb-24">
              <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
                Daily Foundations
              </span>
              <h2 className="heading-serif text-4xl md:text-5xl text-primary font-light">The Luxury Canvas</h2>
              <p className="text-secondary text-sm font-light leading-relaxed">
                Clean silhouettes stripped of unnecessary details. Made of premium fabrics to act as structural building blocks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
              {essentials.map((product, idx) => (
                <div
                  key={product.id}
                  className={`fade-up ${
                    idx === 1 ? "md:translate-y-12" : idx === 2 ? "md:-translate-y-6" : ""
                  }`}
                  style={{ animationDelay: `${idx * 120}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. DIGITAL ATELIER AI SUITE */}
      <section
        ref={fittingRef}
        className={`bg-[#0b0b0b] text-white border-t border-b border-neutral-900 transition-all duration-[1000ms] ${
          fittingVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36 space-y-16">
          
          <div className="max-w-xl space-y-4 text-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full backdrop-blur-sm">
              <Sparkles size={11} className="text-[#d4af37]" />
              <span className="text-[8px] font-bold tracking-[0.25em] text-[#e0d6c3] uppercase">
                {language === "en" ? "Digital Atelier · AI Experience Suite" : "الاستوديو الرقمي · جناح الذكاء الاصطناعي"}
              </span>
            </div>
            <h2 className="heading-serif text-4xl md:text-6xl font-light text-white leading-tight">
              {language === "en" ? "Future of Fashion Tech" : "مستقبل تقنيات الأزياء"}
            </h2>
            <p className="text-neutral-400 text-sm md:text-base font-light leading-relaxed">
              {language === "en"
                ? "Experience our flagship multimodal AI tools designed to transform how you discover, match, and virtually wear luxury fashion."
                : "جرب أدواتنا الرائدة بالذكاء الاصطناعي المصممة لإعادة ابتكار تجربة استكشاف ومطابقة وقياس الأزياء الفاخرة افتراضياً."}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Visual Search Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 md:p-12 flex flex-col justify-between space-y-8 relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6 text-start relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400">
                    <Camera size={18} />
                  </div>
                  <span className="text-[8px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                    AI Vision Match
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="heading-serif text-3xl md:text-4xl text-white font-light">
                    {language === "en" ? "Search by Image" : "ابحث بصورة أي قطعة"}
                  </h3>
                  <p className="text-neutral-400 text-xs md:text-sm font-light leading-relaxed">
                    {language === "en"
                      ? "Upload any outfit photo. Our multimodal vision AI scans all boutique houses to locate exact and matching silhouettes in seconds."
                      : "ارفع صورة أي إطلالة أو قطعة وسيبحث الذكاء الاصطناعي في كافة الماركات لعرض القطع المطابقة فوراً."}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-xl border border-neutral-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-300">
                    <span>{language === "en" ? "Precision Match Confidence" : "دقة المطابقة البصرية"}</span>
                    <span className="text-emerald-400 font-bold">98% Match</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[98%]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 relative z-10 text-start">
                <Link
                  to="/search-by-image"
                  className="inline-flex items-center gap-2.5 bg-white text-black text-[9px] font-bold tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-neutral-200 transition-all rounded-full shadow-md"
                >
                  <Camera size={13} />
                  <span>{language === "en" ? "Launch Visual Search" : "ابدأ البحث بالصورة"}</span>
                </Link>
              </div>
            </div>

            {/* Virtual Fitting Room Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 md:p-12 flex flex-col justify-between space-y-8 relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6 text-start relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#d4af37]">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[8px] font-bold tracking-widest uppercase text-[#d4af37] bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
                    Neural Drape 4K
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="heading-serif text-3xl md:text-4xl text-white font-light">
                    {language === "en" ? "Virtual Fitting Room" : "غرفة القياس الافتراضي"}
                  </h3>
                  <p className="text-neutral-400 text-xs md:text-sm font-light leading-relaxed">
                    {language === "en"
                      ? "Upload a portrait to see how any luxury piece drapes on your own body silhouette with photorealistic lighting before checkout."
                      : "ارفع صورتك الشخصية وجرب قياس وتفصيل أي قطعة على قوامك الحقيقي بدقة خرافية وسرعة فائقة."}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-xl border border-neutral-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-300">
                    <span>{language === "en" ? "Fabric Contour Alignment" : "محاذاة وانسيابية القماش"}</span>
                    <span className="text-[#d4af37] font-bold">100% Calibrated</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full w-[100%]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 relative z-10 text-start flex flex-wrap gap-3">
                <Link
                  to={`/brands/${brand_slug}/tryon`}
                  className="inline-flex items-center gap-2.5 bg-[#d4af37] text-black text-[9px] font-bold tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#e0be48] transition-all rounded-full shadow-md"
                >
                  <Sparkles size={13} />
                  <span>{language === "en" ? "Enter Fitting Room" : "ادخل غرفة القياس"}</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
