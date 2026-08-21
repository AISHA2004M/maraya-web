/**
 * Wishlist Page — Dedicated Saved Items Atelier
 * ===============================================
 * Editorial high-fashion layout for saved garments.
 * Features:
 *   - Quick "Move to Bag" with automatic CartDrawer reveal
 *   - Direct 1-click "Virtual Try-On"
 *   - Share wishlist link
 *   - Synchronized with server & local persistence
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Sparkles, Trash2, ArrowLeft, Share2, Check, ExternalLink } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/ui/SEO";
import useWishlistStore from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { formatPrice } from "../utils/formatPrice";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import api from "../api/client";

export default function Wishlist() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const { items: savedIds, toggle, clearAll } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const { t, language } = useLanguageStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [movingId, setMovingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Fetch full product details for saved items
    api.get("/products")
      .then((res) => {
        if (!mounted) return;
        const allProds = res.data || [];
        const filtered = allProds.filter((p) => savedIds.has(p.id));
        setProducts(filtered);
      })
      .catch((err) => {
        console.error("Failed to load wishlist products:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [savedIds]);

  const handleMoveToBag = (product) => {
    setMovingId(product.id);
    addToCart(product, null, true);
    setTimeout(() => {
      toggle(product.id);
      setMovingId(null);
    }, 400);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col">
      <SEO
        title={language === "ar" ? "قائمة الرغبات والمحفوظات" : "My Saved Wishlist"}
        description="View and manage your curated luxury fashion wishlist with instant Virtual Try-On."
        canonical="/wishlist"
      />
      <Navbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 md:px-12 pt-28 pb-24">
        {/* Navigation Breadcrumb */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] text-secondary hover:text-primary transition-colors uppercase tracking-[0.2em] font-bold"
          >
            <ArrowLeft size={12} />
            <span>{language === "ar" ? "العودة" : "Back to Gallery"}</span>
          </button>

          {products.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-rule px-3 py-1.5 bg-white transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                <span>{copied ? (language === "ar" ? "تم نسخ الرابط!" : "Link Copied!") : (language === "ar" ? "مشاركة القائمة" : "Share Wishlist")}</span>
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-neutral-400 hover:text-red-500 transition-colors px-2 py-1"
              >
                {language === "ar" ? "إفراغ الكل" : "Clear All"}
              </button>
            </div>
          )}
        </div>

        {/* Header Title */}
        <div className="border-b border-rule pb-6 mb-12 flex justify-between items-baseline">
          <div>
            <h1 className="heading-serif text-4xl md:text-5xl font-light text-primary flex items-baseline gap-4">
              {language === "ar" ? "المحفوظات" : "Wishlist"}
              <span className="text-xs font-sans font-bold text-secondary tracking-[0.2em] uppercase">
                / {savedIds.size} {language === "ar" ? "قطع" : (savedIds.size === 1 ? "Item" : "Items")}
              </span>
            </h1>
            <p className="text-xs text-secondary font-light mt-2 max-w-lg">
              {language === "ar"
                ? "تشكيلتك المختارة من الأزياء الفاخرة. يمكنك تجربتها افتراضياً أو نقلها للحقيبة في أي وقت."
                : "Your curated luxury selection. Experience them with AI Virtual Try-On or move them to your bag anytime."}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="shimmer aspect-[3/4] w-full" />
                <div className="shimmer h-3 w-1/3" />
                <div className="shimmer h-4 w-2/3" />
                <div className="shimmer h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white border border-rule flex items-center justify-center mb-6 shadow-sm">
              <Heart size={24} className="text-neutral-300" strokeWidth={1.5} />
            </div>
            <h2 className="heading-serif text-2xl font-light text-primary mb-2">
              {language === "ar" ? "لا توجد عناصر محفوظة بعد" : "Your wishlist is empty"}
            </h2>
            <p className="text-xs text-secondary max-w-xs mb-8 font-light leading-relaxed">
              {language === "ar"
                ? "احفظ القطع التي تعجبك أثناء التصفح بالنقر على أيقونة القلب لتجربتها ومقارنتها لاحقاً."
                : "Save your favorite garments while browsing by clicking the heart icon to try them on or purchase later."}
            </p>
            <Link
              to={brand_slug ? `/brands/${brand_slug}/shop` : "/discover"}
              className="btn-black py-3.5 px-8 text-xs uppercase tracking-widest font-bold"
            >
              {language === "ar" ? "استكشف الماركات العالمية" : "Discover Collections"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {products.map((product) => {
                const bSlug = product.brand?.slug || brand_slug || "zara";
                const detailPath = `/brands/${bSlug}/product/${product.id}`;
                const tryonPath = `/brands/${bSlug}/tryon`;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="group bg-white border border-rule/60 p-4 flex flex-col justify-between hover:shadow-[0_15px_30px_rgba(26,28,28,0.06)] transition-all"
                  >
                    {/* Image & Quick Actions */}
                    <div className="relative aspect-[3/4] bg-[#f7f6f4] overflow-hidden mb-4">
                      <Link to={detailPath} className="block w-full h-full">
                        <img
                          src={resolveImageUrl(product.main_image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600";
                          }}
                        />
                      </Link>

                      {/* Remove button */}
                      <button
                        onClick={() => toggle(product.id)}
                        aria-label="Remove from wishlist"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 hover:bg-white transition-all shadow-sm"
                      >
                        <Heart size={14} fill="#e11d48" stroke="#e11d48" />
                      </button>

                      {/* Try-On badge */}
                      <button
                        onClick={() => navigate(tryonPath, { state: product })}
                        className="absolute bottom-2 left-2 right-2 bg-ink/90 backdrop-blur-sm text-white py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black"
                      >
                        <Sparkles size={12} />
                        <span>{language === "ar" ? "تجربة افتراضية بالذكاء الاصطناعي" : "AI Virtual Try-On"}</span>
                      </button>
                    </div>

                    {/* Product Metadata */}
                    <div className="space-y-1.5 mb-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                        {product.brand?.name || "Atelier"}
                      </p>
                      <Link to={detailPath} className="block">
                        <h3 className="text-xs font-semibold text-primary truncate hover:underline">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs font-light text-primary">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleMoveToBag(product)}
                      disabled={movingId === product.id}
                      className="w-full btn-outline py-2.5 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-ink hover:text-white transition-colors"
                    >
                      <ShoppingBag size={12} />
                      <span>{movingId === product.id ? (language === "ar" ? "تم النقل..." : "Moved!") : (language === "ar" ? "نقل إلى الحقيبة" : "Move to Bag")}</span>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
