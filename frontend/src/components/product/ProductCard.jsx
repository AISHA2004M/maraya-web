/**
 * ProductCard — Optimized for performance and memory safety
 * ===========================================================
 *
 * MEMORY LEAK FIX:
 * Before: hoverTimer stored in useState → creates new closure on every render,
 *         timer reference lost between renders → interval leaks on unmount.
 * After:  hoverTimerRef in useRef → stable reference, proper cleanup guaranteed
 *         via useEffect return function regardless of how component unmounts.
 *
 * PERFORMANCE:
 * - Selector memoization via stable store subscriptions
 * - Image src swapping only on hover (no preloading of all angle images)
 * - Cleanup guaranteed on unmount (no orphaned setIntervals)
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { formatPrice } from "../../utils/formatPrice";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { brand_slug } = useParams();
  // ─── Store selectors (stable references, no re-render on unrelated changes) ──
  const addToCart      = useCartStore((s) => s.addToCart);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist   = useWishlistStore((s) => s.isInWishlist(product.id));

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [added, setAdded]               = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // ─── Refs (stable across renders — no re-render when changed) ─────────────
  // Using useRef for the timer avoids the memory leak pattern where
  // setState on an unmounted component causes a React warning + potential leak.
  const hoverTimerRef = useRef(null);
  const addedTimerRef = useRef(null);

  // ─── Image angles ──────────────────────────────────────────────────────────
  const rawAngles = product.angles_images_url
    ? product.angles_images_url.split(",").map((u) => u.trim()).filter(Boolean)
    : [
        product.main_image_url ||
          product.image_url ||
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
      ];

  const angles = rawAngles.map(resolveImageUrl);

  // ─── Hover handlers ────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback(() => {
    if (angles.length <= 1) return;
    // Clear any existing interval before starting a new one (defensive)
    if (hoverTimerRef.current) clearInterval(hoverTimerRef.current);
    hoverTimerRef.current = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % angles.length);
    }, 1200);
  }, [angles.length]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearInterval(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setActiveImgIndex(0);
  }, []);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  // This is the critical fix: guarantees both timers are cleared
  // even if the component unmounts while an interval is running
  // (e.g. user navigates away mid-hover, or product list re-renders).
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearInterval(hoverTimerRef.current);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  // ─── Cart add handler ──────────────────────────────────────────────────────
  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    // Use ref for this timer too — avoids setState-after-unmount warning
    addedTimerRef.current = setTimeout(() => {
      setAdded(false);
      addedTimerRef.current = null;
    }, 1800);
  }, [addToCart, product]);

  const detailPath = brand_slug 
    ? `/brands/${brand_slug}/product/${product.id}` 
    : `/brands/${product.brand?.slug || 'zara'}/product/${product.id}`;

  const tryonPath = brand_slug 
    ? `/brands/${brand_slug}/tryon` 
    : `/brands/${product.brand?.slug || 'zara'}/tryon`;

  return (
    <Link
      to={detailPath}
      className="group block transition-all duration-500 ease-out hover:-translate-y-1 will-change-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image container */}
      <div className="product-card-img aspect-[3/4] mb-4 bg-neutral-50 overflow-hidden relative transition-all duration-500 ease-out group-hover:shadow-[0_15px_30px_rgba(26,28,28,0.04)]">
        <img
          src={angles[activeImgIndex]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-[8000ms] ease-out group-hover:scale-[1.02] will-change-transform"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600";
          }}
        />

        {/* Hover overlay actions */}
        <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            id={`add-cart-${product.id}`}
            onClick={handleAddToCart}
            className="w-full bg-white/95 backdrop-blur-sm py-3.5 text-[0.65rem] font-bold tracking-widest uppercase text-ink hover:bg-ink hover:text-white transition-all duration-200"
          >
            {added ? "Added to Bag ✓" : "Add to Bag"}
          </button>
        </div>

        {/* Top actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product);
            }}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className="w-8 h-8 bg-white flex items-center justify-center shadow-sm hover:bg-ink hover:text-white transition-all"
          >
            <Heart
              size={13}
              className={isInWishlist ? "fill-ink text-ink" : "text-black"}
              strokeWidth={1.5}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(tryonPath, { state: product });
            }}
            id={`tryon-${product.id}`}
            aria-label="Try on virtually"
            className="w-8 h-8 bg-white flex items-center justify-center shadow-sm hover:bg-ink hover:text-white transition-all"
          >
            <Sparkles size={13} strokeWidth={1.5} />
          </button>
        </div>

        {/* Low stock tag */}
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <div className="absolute top-3 left-3">
            <span className="tag bg-red-50 text-red-500 border border-red-100">
              Low Stock
            </span>
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="space-y-1 text-left">
        <p className="label-upper text-secondary text-[8.5px] font-bold tracking-widest uppercase">
          {product.brand?.name || "\u00a0"}
        </p>
        <p className="text-sm font-medium leading-snug text-primary">{product.name}</p>
        <p className="text-xs text-secondary font-light mb-1">
          {formatPrice(product.price)}
        </p>
        {product.editorial_tags && (
          <p className="text-[8px] text-secondary font-medium tracking-wide uppercase italic opacity-75">
            {product.editorial_tags.split(",").slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
