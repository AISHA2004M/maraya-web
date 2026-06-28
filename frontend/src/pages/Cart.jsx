import { useState, useRef } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useCartStore } from "../store/useCartStore";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Minus, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatPrice, SHIPPING_THRESHOLD, SHIPPING_COST, getShippingCost, formatShipping } from "../utils/formatPrice";

export default function Cart() {
  const { brand_slug } = useParams();
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const navigate = useNavigate();
  const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  // Track items being removed for slide-out animation
  const [removingIds, setRemovingIds] = useState(new Set());
  // Track quantity change for pulse animation
  const [pulsedIds, setPulsedIds] = useState(new Set());

  const handleRemove = (itemId) => {
    // Trigger slide-out animation first, then remove from store
    setRemovingIds((prev) => new Set([...prev, itemId]));
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 380);
  };

  const handleQuantityChange = (itemId, newQty) => {
    if (newQty < 1) return;
    updateQuantity(itemId, newQty);
    // Pulse the quantity display
    setPulsedIds((prev) => new Set([...prev, itemId]));
    setTimeout(() => {
      setPulsedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-primary">
      <Navbar />

      <main className="max-w-[1600px] w-full mx-auto px-6 md:px-12 py-12 md:py-24">
        {/* Back Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] text-secondary hover:text-primary transition-colors mb-16 uppercase tracking-[0.25em] font-bold"
        >
          <ArrowLeft size={12} />
          <span>Continue Shopping</span>
        </button>

        <div className="border-b border-rule pb-6 mb-12">
          <h1 className="heading-serif text-4xl md:text-5xl text-primary font-light flex items-baseline gap-4">
            Shopping Bag
            {items.length > 0 && (
              <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.2em] uppercase">
                / {items.length} {items.length === 1 ? "Item" : "Items"}
              </span>
            )}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center justify-center max-w-xl mx-auto fade-up">
            <div className="w-12 h-12 bg-[#fcfcfa] border border-rule flex items-center justify-center mb-6 rounded-full">
              <ShoppingBag size={18} className="text-secondary" strokeWidth={1.5} />
            </div>
            <h2 className="heading-serif text-2xl font-light text-primary mb-3">Your Bag is Empty</h2>
            <p className="text-secondary text-xs font-light max-w-sm mb-10 leading-relaxed">
              Explore our curated wardrobe edits from the world's most premium fashion houses and begin virtual try-on styling.
            </p>
            <Link to="/" className="btn-black py-4 px-10 text-[10px] font-bold tracking-widest uppercase rounded-none">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.8fr_1fr] gap-16 lg:gap-24 items-start fade-up">

            {/* List of Cart items */}
            <div className="divide-y divide-rule">
              {items.map((item) => {
                const isRemoving = removingIds.has(item.id);
                const isPulsed = pulsedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex gap-8 py-10 first:pt-0 last:pb-0"
                    style={{
                      transition: "opacity 0.38s ease, transform 0.38s ease",
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? "translateX(-24px)" : "translateX(0)",
                      pointerEvents: isRemoving ? "none" : "auto",
                    }}
                  >
                    {/* Image */}
                    <div className="w-32 aspect-[3/4] bg-[#fcfcfa] shrink-0 overflow-hidden border border-rule">
                      <img
                        src={item.main_image_url || item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300";
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            {item.brand && (
                              <p className="text-[9px] text-secondary font-bold tracking-[0.2em] uppercase">
                                {item.brand.name}
                              </p>
                            )}
                            <h3 className="heading-serif text-lg md:text-xl font-light text-primary leading-tight">
                              {item.name}
                            </h3>
                             {item.selectedSize ? (
                              <p className="text-[10px] text-secondary tracking-wide mt-1 uppercase">
                                Size: {item.selectedSize}
                              </p>
                            ) : item.size_type ? (
                              <p className="text-[10px] text-secondary tracking-wide mt-1 uppercase">
                                Size: {item.size_type.split("/")[0]}
                              </p>
                            ) : null}
                          </div>
                          <p
                            className="heading-serif text-lg font-light text-primary"
                            style={{
                              transition: "transform 0.2s ease",
                              transform: isPulsed ? "scale(1.08)" : "scale(1)",
                            }}
                          >
                            {formatPrice(Number(item.price) * item.quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-8">
                        {/* Minimalist Quantity Selector with micro-animation */}
                        <div className="flex items-center border border-rule bg-white">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-[#fcfcfa] transition-all"
                          >
                            <Minus size={10} />
                          </button>
                          <span
                            className="text-[10px] font-bold w-8 text-center text-primary transition-all duration-200"
                            style={{
                              transform: isPulsed ? "scale(1.2)" : "scale(1)",
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-[#fcfcfa] transition-all"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold group"
                        >
                          <Trash2
                            size={11}
                            strokeWidth={1.5}
                            className="transition-transform group-hover:scale-110"
                          />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Summary */}
            <div className="bg-[#fcfcfa] border border-rule p-8 md:p-10 space-y-8 lg:sticky lg:top-28">
              <h2 className="heading-serif text-2xl font-light text-primary border-b border-rule pb-4">
                Order Summary
              </h2>

              <div className="space-y-4 text-xs font-light">
                {/* Item breakdown */}
                <div className="space-y-2 pb-4 border-b border-rule">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-secondary">
                      <span className="truncate max-w-[60%]">{item.name} × {item.quantity}</span>
                      <span className="text-primary font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-secondary">
                  <span className="uppercase tracking-wider">المجموع الفرعي · Subtotal</span>
                  <span className="text-primary font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span className="uppercase tracking-wider">الشحن · Shipping</span>
                  <span className="text-green-700 font-semibold uppercase tracking-wider">
                    {formatShipping(total)}
                  </span>
                </div>
                <div className="rule pt-2" />
                <div className="flex justify-between text-sm font-semibold text-primary pt-2">
                  <span className="uppercase tracking-widest font-bold">المجموع · Total</span>
                  <span className="heading-serif text-lg font-light">{formatPrice(total + getShippingCost(total))}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Link
                  to={brand_slug ? `/brands/${brand_slug}/checkout` : "/checkout"}
                  id="checkout-btn"
                  className="btn-black w-full py-4 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 rounded-none"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={12} />
                </Link>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-[9px] text-secondary hover:text-primary tracking-widest uppercase font-bold transition-colors py-2"
                >
                  Clear Shopping Bag
                </button>
              </div>

              <div className="text-[9px] text-secondary leading-relaxed border-t border-rule pt-6 font-light uppercase tracking-wider space-y-1">
                <p>· شحن مجاني للطلبات فوق 150,000 د.ع</p>
                <p>· توصيل لجميع محافظات العراق</p>
                <p>· دفع آمن ومضمون</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
