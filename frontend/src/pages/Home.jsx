import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { Sparkles, ArrowRight, Flame, ChevronRight } from "lucide-react";
import api from "../api/client";

// Helper to partition products dynamically so they NEVER repeat
function partitionProducts(allProducts) {
  if (!allProducts || allProducts.length === 0) {
    return { seasonal: [], evening: [], trending: [], essentials: [] };
  }

  const usedIds = new Set();

  // 1. Evening Edit (Silk slip, dress, jackets)
  const evening = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    const name = p.name.toLowerCase();
    const match =
      name.includes("dress") ||
      name.includes("slip") ||
      name.includes("jacket") ||
      name.includes("biker") ||
      p.editorial_tags?.toLowerCase().includes("evening") ||
      p.editorial_tags?.toLowerCase().includes("hours");
    if (match) {
      usedIds.add(p.id);
      return true;
    }
    return false;
  }).slice(0, 2);

  // 2. High Demand / Trending (Sneakers, or higher priced items)
  const trending = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    const name = p.name.toLowerCase();
    const match =
      name.includes("sneaker") ||
      name.includes("shoe") ||
      name.includes("air") ||
      Number(p.price) > 100;
    if (match) {
      usedIds.add(p.id);
      return true;
    }
    return false;
  }).slice(0, 3);

  // 3. Daily Foundations / Essentials (Tee, Chinos, trousers)
  const essentials = allProducts.filter((p) => {
    if (usedIds.has(p.id)) return false;
    const name = p.name.toLowerCase();
    const match =
      name.includes("tee") ||
      name.includes("t-shirt") ||
      name.includes("chino") ||
      name.includes("pant") ||
      name.includes("trouser") ||
      name.includes("linen") ||
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

export default function Home() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const { data: products, isLoading } = useProducts();

  const [scrollY, setScrollY] = useState(0);

  // Fetch brand CMS details
  useEffect(() => {
    if (!brand_slug) {
      navigate("/discover");
      return;
    }
    setBrandLoading(true);
    api.get(`/products/brands/slug/${brand_slug}`)
      .then((res) => {
        setBrand(res.data);
        setBrandLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load brand", err);
        navigate("/discover");
      });
  }, [brand_slug, navigate]);

  // Apply typography and dynamic accents
  useEffect(() => {
    if (brand) {
      const fontName = brand.font_family || "Hanken Grotesk, sans-serif";
      
      // Inject Google Font link if custom typography is selected
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
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
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
          <p className="font-display text-xs tracking-widest text-secondary uppercase">Entering Boutique...</p>
        </div>
      </div>
    );
  }

  const brandProducts = products ? products.filter((p) => p.brand_id === brand?.id) : [];
  const { seasonal, evening, trending, essentials } = partitionProducts(brandProducts);

  const brandBg = brand?.accent_color || "#FFFFFF";

  return (
    <div className="min-h-screen font-sans text-primary overflow-x-hidden transition-colors duration-500" style={{ backgroundColor: brandBg }}>
      <Navbar />

      {/* 1. HERO CAMPAIGN SECTION */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        </div>

        {/* Hero Narrative content */}
        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-6 md:px-12 pb-16 md:pb-24">
          <div className="max-w-xl space-y-6">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70">
              {brand?.seasonal_title || "ATELIER EDIT"}
            </p>
            <h1
              className="heading-serif text-5xl md:text-7xl lg:text-8xl leading-[1.0] text-white"
              style={{ animation: "fadeSlideUp 0.8s ease both" }}
            >
              {brand?.hero_title || brand?.name}
            </h1>
            <p className="text-white/60 text-sm md:text-base font-light leading-relaxed max-w-sm">
              {brand?.hero_subtitle || brand?.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={`/brands/${brand_slug}/shop`}
                className="btn-black bg-white !text-black hover:bg-neutral-100 py-3.5 px-8 text-[10px] font-bold tracking-widest uppercase rounded-none"
              >
                {brand?.hero_cta_text || "Shop the Campaign"}
              </Link>
              <Link
                to={`/brands/${brand_slug}/tryon`}
                className="flex items-center gap-2 text-white text-[10px] font-bold tracking-widest uppercase border border-white/30 hover:border-white py-3.5 px-8 transition-colors"
              >
                <Sparkles size={12} />
                Fitting Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND STORY SECTION (Bespoke Philosophy Block) */}
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
          </div>
          {brand?.story_image_url && (
            <div className="aspect-[16/10] overflow-hidden rounded border border-rule bg-neutral-50 shadow-sm">
              <img
                src={brand.story_image_url}
                alt={brand.story_title}
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-[4000ms]"
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. SEASONAL CAMPAIGN GRID (Seasonal Products) */}
      {seasonal.length > 0 && (
        <section
          ref={seasonRef}
          className={`border-t border-rule transition-all duration-[1000ms] ${
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
                {brand?.story_image_url && (
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                    <img
                      src={brand.story_image_url}
                      alt="Seasonal Edit"
                      className="w-full h-full object-cover transition-transform duration-[8000ms] hover:scale-105"
                    />
                  </div>
                )}
                <p className="text-secondary text-sm font-light leading-relaxed max-w-sm">
                  {brand?.seasonal_desc || "Explore raw tailored pieces and elegant structural lines crafted for modern lifestyles."}
                </p>
                <Link
                  to={`/brands/${brand_slug}/shop`}
                  className="inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase text-primary hover:text-secondary transition-colors"
                >
                  <span>Explore the Collection</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              {/* Products */}
              <div>
                <div className="flex justify-between items-baseline border-b border-rule pb-4 mb-12">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-secondary">
                    Bespoke Creations
                  </span>
                  <span className="text-[9px] text-secondary font-light uppercase tracking-widest">
                    [ {seasonal.length} Unique Designs ]
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-16">
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

      {/* 4. IMMERSIVE BRAND PHILOSOPHY / QUOTE */}
      {brand?.philosophy_text && (
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden text-center px-6 border-t border-b border-rule bg-white/40 backdrop-blur-sm">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
              Atelier Philosophy
            </span>
            <blockquote className="heading-serif text-3xl md:text-5xl italic font-light leading-relaxed text-primary">
              "{brand.philosophy_text}"
            </blockquote>
            <cite className="text-[10px] font-bold tracking-widest uppercase text-secondary not-italic block mt-4">
              — {brand.philosophy_title || brand.name}
            </cite>
          </div>
        </section>
      )}

      {/* 5. EVENING LOOKBOOK SECTION */}
      {evening.length > 0 && (
        <section
          ref={eveningRef}
          className={`border-t border-rule transition-all duration-[1000ms] ${
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

                <div className="grid grid-cols-2 gap-x-8 gap-y-16">
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
                {brand?.logo_url && (
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-50 border border-rule flex items-center justify-center p-12">
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain opacity-70"
                    />
                  </div>
                )}
                <p className="text-secondary text-sm font-light leading-relaxed max-w-sm">
                  Experience sensory draping and fine tailoring. Every stitch designed to convey weight, presence, and status in daily outings.
                </p>
                <Link
                  to={`/brands/${brand_slug}/shop`}
                  className="inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase text-primary hover:text-secondary transition-colors"
                >
                  <span>View Full Lookbook</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 6. COVETED / TRENDING SECTION */}
      {trending.length > 0 && (
        <section
          ref={trendingRef}
          className={`border-t border-b border-rule bg-white/30 backdrop-blur-sm transition-all duration-[1000ms] ${
            trendingVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
          }`}
        >
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
            <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center justify-between mb-12">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <Flame size={16} strokeWidth={1.5} className="text-secondary" />
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
                to={`/brands/${brand_slug}/shop`}
                className="shrink-0 inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.25em] uppercase text-primary hover:text-secondary transition-colors"
              >
                <span>View Hot Items</span>
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

      {/* 7. WARDROBE ESSENTIALS (Asymmetric Triptych) */}
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

      {/* 8. DIGITAL ATELIER PROMO (AI Try-On Highlight) */}
      <section
        ref={fittingRef}
        className={`bg-white/40 backdrop-blur-sm border-t border-b border-rule transition-all duration-[1000ms] ${
          fittingVisible ? "opacity-100 translate-y-0" : "opacity-100 translate-y-12"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36 grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="space-y-8 max-w-lg">
            <div className="space-y-3">
              <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
                The Digital Atelier
              </span>
              <h2 className="heading-serif text-5xl md:text-6xl text-primary leading-tight font-light">
                Bespoke Fitting Room
              </h2>
            </div>
            <p className="text-secondary text-sm font-light leading-relaxed">
              Upload a portrait photo to witness the accurate drape of {brand?.name} apparel on your own body before checkout.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to={`/brands/${brand_slug}/tryon`}
                className="inline-flex items-center justify-center gap-2.5 bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold tracking-widest uppercase py-4 px-8 hover:bg-neutral-800 transition-colors"
              >
                <Sparkles size={13} />
                <span>Enter Fitting Room</span>
              </Link>
              <Link
                to={`/brands/${brand_slug}/shop`}
                className="inline-flex items-center justify-center gap-2 border border-rule text-secondary hover:border-black text-[10px] font-bold tracking-widest uppercase py-4 px-8 transition-colors"
              >
                <span>Browse Designs</span>
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden border border-rule bg-neutral-50">
            <img
              src={brand?.hero_image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200"}
              alt="AI digital Tryon"
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[8000ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
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
