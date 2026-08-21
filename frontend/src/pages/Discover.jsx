import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import { Sparkles, Camera } from "lucide-react";
import { useLanguageStore } from "../store/useLanguageStore";
import SEO from "../components/ui/SEO";


const FALLBACK_BRANDS = [
  {
    id: 1,
    name: "ZARA",
    slug: "zara",
    hero_title: "The Urban Vanguard",
    description: "Modern street tailoring, unstructured coats, and sleek minimal aesthetics designed for the contemporary urban lifestyle.",
    banner_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: 2,
    name: "GUCCI",
    slug: "gucci",
    hero_title: "Eclectic Heritage",
    description: "Opulent Italian craftsmanship, bold signature patterns, and timeless luxury tailored for statement elegance.",
    banner_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: 3,
    name: "H&M",
    slug: "hm",
    hero_title: "Essential Simplicity",
    description: "Versatile capsule wardrobes, relaxed silhouettes, and effortless everyday luxury.",
    banner_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: 4,
    name: "NIKE",
    slug: "nike",
    hero_title: "Performance Engineering",
    description: "High-tech sportswear, activewear innovation, and iconographic athletic footwear.",
    banner_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=75",
  }
];

export default function Discover() {
  const { language } = useLanguageStore();
  const [brands, setBrands] = useState(FALLBACK_BRANDS);

  useEffect(() => {
    let mounted = true;

    api.get("/products/brands/all")
      .then((res) => {
        if (mounted && res.data && res.data.length > 0) {
          setBrands(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load brands", err);
      });

    return () => {
      mounted = false;
    };
  }, []);


  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col transition-colors duration-500">
      <SEO
        title="Discover Fashion Brands"
        description="Explore top fashion brands on Vrital. Shop Zara, Gucci, Nike, H&M and more with AI-powered virtual try-on. See how clothes look on you before buying."
        canonical="/discover"
        jsonLd={{
          "@context": "https://schema.org/",
          "@type": "WebPage",
          name: "Discover Fashion Brands — Vrital",
          description: "Browse curated fashion brands and shop with AI Virtual Try-On.",
          url: "https://vrital.com/discover",
        }}
      />
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-screen-xl mx-auto px-6 py-20 md:py-32">
        
        {/* Editorial Header */}
        <div className="max-w-4xl mx-auto text-center mb-32 mt-4 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-[#eae6df] rounded-full">
            <Sparkles size={11} className="text-[#a89f91] animate-pulse" />
            <span className="text-[8px] font-bold tracking-[0.3em] text-[#8e8577] uppercase">The Collection of Independent Houses</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none text-black">
            The Digital <br />
            <span className="italic font-serif">Ateliers</span>
          </h1>
          <div className="w-12 h-[1px] bg-black/20 mx-auto" />
          <p className="text-sm md:text-base text-[#5c564c] font-light leading-relaxed max-w-2xl mx-auto">
            A single engineering core powering independent digital boutiques. Browse each atelier as an autonomous house of design with its own campaigns, distinct visual rules, and storytelling product records.
          </p>
        </div>


        {/* Chapters Directory */}
        <div className="space-y-48">
          {brands.map((brand, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.section
                key={brand.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.95, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="grid md:grid-cols-12 gap-8 md:gap-16 items-center border-b border-[#eae6df] pb-32 md:pb-48 last:border-b-0 last:pb-0"
              >
                {/* Image Section */}
                <div className={`col-span-12 md:col-span-7 ${isEven ? "md:order-1" : "md:order-2"}`}>
                  <Link
                    to={`/brands/${brand.slug}`}
                    className="group block overflow-hidden bg-[#eae6df] border border-[#eae6df] rounded-none aspect-[16/10] relative shadow-sm"
                  >
                    <img
                      src={brand.banner_url || brand.hero_image_url || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200"}
                      alt={brand.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-[1600ms] ease-out"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </Link>
                </div>

                {/* Narrative Section */}
                <div className={`col-span-12 md:col-span-5 flex flex-col justify-center space-y-6 ${isEven ? "md:order-2 md:pl-10" : "md:order-1 md:pr-10"}`}>
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-[#8e8577] uppercase block">
                      CHAPTER {String(index + 1).padStart(2, "0")} / {brand.name}
                    </span>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-black tracking-tight leading-none">
                      {brand.name}
                    </h2>
                    {brand.hero_title && (
                      <p className="font-serif italic text-lg md:text-xl text-[#8e8577] font-light">
                        "{brand.hero_title}"
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-[#5c564c] font-light leading-relaxed max-w-md">
                    {brand.description || "Explore limited edition silhouettes, tactile materials, and forward-thinking apparel engineered for modern elegance."}
                  </p>

                  <div className="pt-4">
                    <Link
                      to={`/brands/${brand.slug}`}
                      className="inline-flex items-center justify-center border border-black bg-transparent text-black text-[9px] font-bold tracking-[0.25em] uppercase px-10 py-4 hover:bg-black hover:text-white transition-all duration-500 rounded-none w-full sm:w-auto"
                    >
                      Enter House
                    </Link>
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#eae6df] bg-white py-16 text-center text-[10px] font-bold tracking-widest text-secondary uppercase">
        Vrital Ateliers © {new Date().getFullYear()} — Powered by Advanced Fashion Infrastructures
      </footer>
    </div>
  );
}
