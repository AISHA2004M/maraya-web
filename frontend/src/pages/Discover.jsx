import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import { Sparkles, Camera } from "lucide-react";

export default function Discover() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products/brands/all")
      .then((res) => {
        setBrands(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load brands", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-black rounded-full animate-spin mx-auto" />
          <p className="font-display text-xs tracking-widest text-secondary uppercase">Entering Vrital Ateliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col transition-colors duration-500">
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

        {/* ── AI Visual Search Feature — Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-32 pt-20 border-t border-[#eae6df]"
        >
          <div className="bg-white border border-[#eae6df] overflow-hidden">
            <div className="grid md:grid-cols-2 items-stretch min-h-[340px]">

              {/* Left: Text */}
              <div className="flex flex-col justify-center px-10 md:px-14 py-14 space-y-7">
                <div className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 border border-[#eae6df] rounded-full">
                  <Sparkles size={9} className="text-[#a89f91]" />
                  <span className="text-[7.5px] font-bold tracking-[0.3em] text-[#8e8577] uppercase">AI Feature · جديد</span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-4xl md:text-5xl font-light text-black tracking-tight leading-none">
                    Search by Image
                  </h2>
                  <p className="font-serif italic text-xl text-[#8e8577] font-light">ابحث بالصورة</p>
                  <p className="text-sm text-[#5c564c] font-light leading-relaxed max-w-sm pt-1">
                    Upload any garment — our AI instantly scans all ateliers and surfaces the closest visual matches with precision scores.
                  </p>
                  <p className="text-xs text-[#a89f91] font-light leading-relaxed max-w-sm">
                    ارفع صورة أي قطعة وسيبحث الذكاء الاصطناعي فوراً في جميع الماركات ويعرض لك أقرب المنتجات مع نسب التطابق الدقيقة.
                  </p>
                </div>

                <Link
                  to="/search-by-image"
                  className="inline-flex items-center gap-3 bg-black text-white text-[9px] font-bold tracking-[0.25em] uppercase px-10 py-4 hover:bg-[#1a1a1a] transition-all duration-300 rounded-none w-full sm:w-fit justify-center"
                >
                  <Camera size={12} />
                  Try Visual Search · جرّب الآن
                </Link>
              </div>

              {/* Right: Precise Match UI */}
              <div className="bg-[#f7f6f4] flex items-center justify-center p-10 md:p-14">
                <div className="w-full max-w-[280px] space-y-5">

                  {/* Scan frame */}
                  <div className="relative w-20 h-20 border border-[#c8c0b4] bg-white flex items-center justify-center mb-6 mx-auto">
                    <Camera size={26} className="text-[#8e8577]" />
                    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black" />
                    <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-black to-transparent opacity-50 animate-[scan_2s_linear_infinite]" />
                  </div>

                  {/* Precision match bars */}
                  {[
                    { label: "Floral Maxi Dress", brand: "Zara", score: 96 },
                    { label: "Linen Blazer", brand: "H&M", score: 89 },
                    { label: "Silk Midi Skirt", brand: "Mango", score: 81 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9.5px] font-semibold text-black tracking-wide">{item.label}</p>
                          <p className="text-[8px] text-[#a89f91] tracking-widest uppercase">{item.brand}</p>
                        </div>
                        <span className="text-xs font-bold text-black tabular-nums">{item.score}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-[3px] bg-[#eae6df] w-full rounded-none overflow-hidden">
                        <div
                          className="h-full bg-black rounded-none"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <p className="text-[8px] text-[#c8c0b4] tracking-widest uppercase text-center pt-1">Visual Similarity Score</p>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#eae6df] bg-white py-16 text-center text-[10px] font-bold tracking-widest text-secondary uppercase">
        Vrital Ateliers © {new Date().getFullYear()} — Powered by Advanced Fashion Infrastructures
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
    </div>
  );
}
