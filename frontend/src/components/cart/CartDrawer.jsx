/**
 * CartDrawer — Slide-In Luxury Bag Drawer
 * ========================================
 * Slides in from the right when an item is added or cart icon is clicked.
 * Includes:
 *   - Live Free Shipping threshold bar
 *   - Instant quantity modification & item removal
 *   - Promo code input with instant discount calculation
 *   - Direct checkout button & security trust signals
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, Loader2 } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useLanguageStore } from "../../store/useLanguageStore";
import { formatPrice, SHIPPING_THRESHOLD, getShippingCost } from "../../utils/formatPrice";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import api from "../../api/client";

export default function CartDrawer() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeFromCart, appliedPromo, setPromo, removePromo } = useCartStore();
  const { t, language } = useLanguageStore();

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const rawSubtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  
  // Calculate discount if promo is applied
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_percent > 0) {
      discountAmount = (rawSubtotal * appliedPromo.discount_percent) / 100;
    } else if (appliedPromo.discount_amount > 0) {
      discountAmount = Math.min(appliedPromo.discount_amount, rawSubtotal);
    }
  }

  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const shippingCost = getShippingCost(subtotalAfterDiscount);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  // Free shipping progress
  const progressToFree = Math.min(100, Math.round((rawSubtotal / SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, SHIPPING_THRESHOLD - rawSubtotal);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await api.post("/orders/apply-promo", {
        code: promoCodeInput.trim(),
        subtotal: rawSubtotal,
      });
      if (res.data.valid) {
        setPromo({
          code: res.data.code,
          discount_percent: res.data.discount_percent,
          discount_amount: Number(res.data.discount_amount),
        });
        setPromoCodeInput("");
      } else {
        setPromoError(res.data.message || "Invalid promo code");
      }
    } catch {
      // Fallback local promo validation
      const code = promoCodeInput.trim().toUpperCase();
      if (code === "MARAYA10" || code === "VRITAL10") {
        setPromo({ code: "MARAYA10", discount_percent: 10, discount_amount: 0 });
        setPromoCodeInput("");
      } else if (code === "ELEGANCE20") {
        setPromo({ code: "ELEGANCE20", discount_percent: 20, discount_amount: 0 });
        setPromoCodeInput("");
      } else {
        setPromoError("Invalid promo code");
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const checkoutPath = brand_slug ? `/brands/${brand_slug}/checkout` : "/checkout";
  const cartPath = brand_slug ? `/brands/${brand_slug}/cart` : "/cart";

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 text-primary"
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-rule flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" />
                <span className="font-serif text-lg font-normal tracking-wide">
                  {language === "ar" ? "حقيبة التسوق" : "Shopping Bag"}
                </span>
                <span className="text-[11px] font-sans font-bold bg-neutral-100 px-2 py-0.5 rounded-full text-secondary">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close bag"
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            <div className="px-6 py-3 bg-[#faf9f7] border-b border-rule text-xs">
              <div className="flex justify-between items-center mb-1.5 font-sans">
                <span className="text-[11px] text-secondary">
                  {amountNeeded > 0
                    ? `${language === "ar" ? "أضف" : "Add"} ${formatPrice(amountNeeded)} ${language === "ar" ? "للحصول على شحن مجاني" : "for Free Express Shipping"}`
                    : `✨ ${language === "ar" ? "مؤهل للشحن المجاني السريع!" : "You unlocked Free Express Shipping!"}`}
                </span>
                <span className="text-[10px] font-bold text-primary">{progressToFree}%</span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-ink h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressToFree}%` }}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mb-4 text-neutral-300">
                    <ShoppingBag size={28} strokeWidth={1} />
                  </div>
                  <p className="font-serif text-lg text-primary mb-1">
                    {language === "ar" ? "حقيبتك فارغة حالياً" : "Your bag is empty"}
                  </p>
                  <p className="text-xs text-secondary max-w-xs mb-6 font-light">
                    {language === "ar"
                      ? "استكشف أحدث الأزياء والماركات الفاخرة وجربها بالذكاء الاصطناعي."
                      : "Explore the newest collections and try them on with AI."}
                  </p>
                  <button
                    onClick={() => {
                      closeDrawer();
                      navigate(brand_slug ? `/brands/${brand_slug}/shop` : "/discover");
                    }}
                    className="btn-black text-xs py-3 px-6 uppercase tracking-widest font-bold"
                  >
                    {language === "ar" ? "تصفح التشكيلة" : "Explore Collections"}
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const key = item.cartKey || item.id;
                  return (
                    <div
                      key={key}
                      className="flex gap-4 py-3 border-b border-rule/50 last:border-b-0 items-center"
                    >
                      <img
                        src={resolveImageUrl(item.main_image_url || item.image, 200, 80)}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-20 object-cover bg-neutral-50 border border-rule flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=75&fm=webp&auto=format";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold tracking-widest uppercase text-secondary truncate">
                          {item.brand?.name || item.brand || "Atelier"}
                        </p>
                        <h4 className="text-xs font-medium text-primary truncate leading-snug">
                          {item.name}
                        </h4>
                        {item.selectedSize && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-secondary bg-neutral-100 px-1.5 py-0.5 rounded">
                            {language === "ar" ? "المقاس:" : "Size:"} {item.selectedSize}
                          </span>
                        )}
                        <p className="text-xs font-semibold text-primary mt-1">
                          {formatPrice(item.price)}
                        </p>

                        {/* Stepper */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-rule rounded">
                            <button
                              onClick={() => updateQuantity(key, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-7 text-center text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(key, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(key)}
                            aria-label="Remove item"
                            className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer with Checkout */}
            {items.length > 0 && (
              <div className="p-6 border-t border-rule bg-[#fcfcfa] space-y-3">
                {/* Promo Code Input */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} />
                      <span className="font-bold">{appliedPromo.code}</span>
                      <span>({appliedPromo.discount_percent > 0 ? `-${appliedPromo.discount_percent}%` : `-$${appliedPromo.discount_amount}`})</span>
                    </div>
                    <button
                      onClick={removePromo}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      {language === "ar" ? "إلغاء" : "Remove"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === "ar" ? "رمز الخصم (مثال: MARAYA10)" : "Promo code (e.g. MARAYA10)"}
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="flex-1 border border-rule px-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-ink"
                    />
                    <button
                      type="submit"
                      disabled={promoLoading}
                      className="bg-neutral-900 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                    >
                      {promoLoading ? <Loader2 size={12} className="animate-spin" /> : (language === "ar" ? "تطبيق" : "Apply")}
                    </button>
                  </form>
                )}
                {promoError && <p className="text-[10px] text-red-500">{promoError}</p>}

                {/* Pricing Breakdown */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between text-secondary">
                    <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span>{formatPrice(rawSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>{language === "ar" ? "الخصم" : "Discount"}</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-secondary">
                    <span>{language === "ar" ? "الشحن السريع" : "Shipping"}</span>
                    <span>{shippingCost === 0 ? (language === "ar" ? "مجاناً" : "FREE") : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-primary pt-2 border-t border-rule">
                    <span>{language === "ar" ? "الإجمالي" : "Estimated Total"}</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={() => {
                    closeDrawer();
                    navigate(checkoutPath);
                  }}
                  className="w-full btn-black py-3.5 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck size={14} />
                  <span>{language === "ar" ? "إتمام الشراء الآمن" : "Secure Checkout"}</span>
                  <ArrowRight size={14} />
                </button>

                <div className="flex justify-between items-center text-[10px] text-secondary pt-1">
                  <Link
                    to={cartPath}
                    onClick={closeDrawer}
                    className="hover:underline text-primary font-medium"
                  >
                    {language === "ar" ? "عرض تفاصيل الحقيبة الكاملة" : "View Full Bag Page"}
                  </Link>
                  <span className="flex items-center gap-1 opacity-70">
                    🔒 256-bit Encrypted
                  </span>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
