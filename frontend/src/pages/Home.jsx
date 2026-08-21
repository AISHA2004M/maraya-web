/**
 * Home — Ultra-Clean Luxury Brand Showcase
 * ==========================================
 * Contains strictly:
 * 1. Navbar
 * 2. Hero Campaign Banner (with Shop Collection CTA)
 * 3. The Brand Story (Philosophy of Modern Street Tailoring)
 * 4. Footer
 */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import api from "../api/client";
import { useLanguageStore } from "../store/useLanguageStore";

export default function Home() {
  const { language } = useLanguageStore();
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const defaultBrandData = {
    name: brand_slug ? brand_slug.toUpperCase() : "ZARA",
    hero_title: brand_slug ? brand_slug.toUpperCase() : "ZARA",
    hero_subtitle: "Modern street tailoring, unstructured coats, and sleek minimal aesthetics designed for the contemporary urban lifestyle.",
    hero_image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1600&fm=webp",
    story_title: "Philosophy of Modern Street Tailoring",
    story_description: "Zara Atelier reinterprets modern silhouettes through precision tailoring, tactile fabrics, and effortless versatility.",
    story_image_url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1000&q=80"
  };

  const [brand, setBrand] = useState(defaultBrandData);

  useEffect(() => {
    if (!brand_slug) {
      navigate("/discover");
      return;
    }

    let isMounted = true;
    api.get(`/products/brands/slug/${brand_slug}`)
      .then((res) => {
        if (isMounted && res.data) {
          setBrand(res.data);
        }
      })
      .catch(() => {
        // Keeps defaultBrandData on error / offline
      });

    return () => {
      isMounted = false;
    };
  }, [brand_slug, navigate]);


  return (
    <div className="min-h-screen bg-white font-sans text-primary selection:bg-black selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* 1. HERO CAMPAIGN BANNER */}
        <section className="relative h-[90vh] md:h-[95vh] w-full flex items-end overflow-hidden bg-neutral-900">
          <img
            src={brand?.hero_image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1600&fm=webp"}
            alt={brand?.name || "Brand Campaign"}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 md:px-12 pb-14 md:pb-20 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-white/80 block">
                {brand?.name || "ZARA"} · NEW COLLECTION
              </span>
              <h1 className="heading-serif text-5xl md:text-8xl text-white font-light tracking-tight leading-none">
                {brand?.name || "Zara"}
              </h1>
              <p className="text-white/70 text-xs md:text-sm font-light leading-relaxed max-w-md pt-1">
                {brand?.hero_subtitle || "Modern street tailoring, unstructured coats, and sleek minimal aesthetics designed for the contemporary urban lifestyle."}
              </p>
            </div>

            <div>
              <Link
                to={`/brands/${brand_slug}/shop`}
                className="btn-black bg-white !text-black hover:bg-neutral-200 py-4 px-10 text-[10px] font-bold tracking-[0.25em] uppercase rounded-none transition-all shadow-lg inline-block"
              >
                {language === "ar" ? "تسوق التشكيلة" : "SHOP COLLECTION"}
              </Link>
            </div>
          </div>
        </section>

        {/* 2. THE BRAND STORY */}
        <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 lg:gap-24 items-center">
            
            <div className="space-y-6">
              <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
                The Brand Story
              </span>
              <h2 className="heading-serif text-3xl md:text-5xl lg:text-6xl text-primary font-light leading-tight">
                {brand?.story_title || "Philosophy of Modern Street Tailoring"}
              </h2>
              <p className="text-secondary text-sm md:text-base font-light leading-relaxed max-w-lg">
                {brand?.story_description || "Zara Atelier reinterprets modern silhouettes through precision tailoring, tactile fabrics, and effortless versatility."}
              </p>
            </div>

            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 shadow-sm border border-rule">
              <img
                src={brand?.story_image_url || "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1000&q=80"}
                alt="Brand Story Atelier"
                className="w-full h-full object-cover"
              />
            </div>

          </div>
        </section>
      </main>

      {/* 3. FOOTER */}
      <Footer />
    </div>
  );
}
