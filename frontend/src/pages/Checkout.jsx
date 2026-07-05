import { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useLanguageStore } from "../store/useLanguageStore";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import api from "../api/client";
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, CreditCard } from "lucide-react";
import { formatPrice, getShippingCost, formatShipping } from "../utils/formatPrice";

export default function Checkout() {
  const { brand_slug } = useParams();
  const { items, clearCart } = useCartStore();
  const { t, language } = useLanguageStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");

  // Credit Card mock fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const shipping = getShippingCost(subtotal);
  const total = subtotal + shipping;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError(null);

    const orderPayload = {
      full_name: fullName,
      shipping_address: `${address}, ${city}, ${zipCode}`,
      payment_method: paymentMethod,
      items: items.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
        price_at_purchase: Number(i.price),
      })),
    };

    try {
      const response = await api.post("/orders/checkout", orderPayload);
      setOrderResult(response.data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.detail || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderResult) {
    return (
      <div className="min-h-screen bg-white font-sans text-primary flex flex-col">
        <Navbar />
        <main className="max-w-2xl w-full mx-auto px-6 py-24 flex-1 flex flex-col items-center justify-center text-center fade-up">
          <div className="w-12 h-12 text-secondary bg-[#fcfcfa] border border-rule flex items-center justify-center rounded-full mb-6">
            <CheckCircle2 size={24} strokeWidth={1.5} />
          </div>
          <h1 className="heading-serif text-4xl lg:text-5xl text-primary font-light mb-4">
            Thank You
          </h1>
          <p className="text-secondary text-xs font-light max-w-sm mb-10 leading-relaxed uppercase tracking-wider">
            Your purchase was completed successfully. A configuration summary is sent to{" "}
            <span className="text-primary font-semibold lowercase">{email}</span>.
          </p>

          <div className="w-full bg-[#fcfcfa] border border-rule p-8 rounded-none text-left mb-12 space-y-4 font-light text-xs text-secondary uppercase tracking-wider">
            <div className="flex justify-between">
              <span>Order Reference:</span>
              <span className="text-primary font-bold">{orderResult.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Status:</span>
              <span className="text-primary font-bold">
                {orderResult.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amount Transacted:</span>
              <span className="text-primary font-bold">{formatPrice(orderResult.total_amount)}</span>
            </div>
          </div>
          <Link to={brand_slug ? `/brands/${brand_slug}` : "/"} className="btn-black py-4 px-12 text-[10px] font-bold tracking-widest uppercase rounded-none">
            <span>Continue to Atelier</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-primary">
      <Navbar />

      <main className="max-w-[1600px] w-full mx-auto px-6 md:px-12 py-12 md:py-24">
        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] text-secondary hover:text-primary transition-colors mb-16 uppercase tracking-[0.25em] font-bold"
        >
          <ArrowLeft size={12} />
          <span>Back to Bag</span>
        </button>

        <div className="border-b border-rule pb-6 mb-12">
          <h1 className="heading-serif text-4xl md:text-5xl text-primary font-light">
            Checkout
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 border border-rule bg-[#fcfcfa] max-w-md mx-auto rounded-none">
            <p className="text-secondary text-xs mb-6 uppercase tracking-wider font-light">No items in your bag to checkout.</p>
            <Link to="/" className="btn-black py-3 px-8 text-[10px] font-bold tracking-widest uppercase rounded-none">
              Shop Collections
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 lg:gap-24 items-start fade-up">
            
            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="space-y-16">
              
              {/* Shipping Information */}
              <div className="space-y-8 text-start">
                <h2 className="text-[10px] font-bold tracking-widest uppercase border-b border-rule pb-4 text-secondary">
                  {t("shipping_info")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">{t("full_name")} *</label>
                    <input
                      type="text"
                      className="input-white py-3 text-xs tracking-wider"
                      placeholder={language === "en" ? "John Doe" : "محمد علي"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">{t("email")} *</label>
                    <input
                      type="email"
                      className="input-white py-3 text-xs tracking-wider"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">{t("street_address")} *</label>
                    <input
                      type="text"
                      className="input-white py-3 text-xs tracking-wider"
                      placeholder={language === "en" ? "District, Street, Near landmark" : "اسم المنطقة والشارع وأقرب نقطة دالة"}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">{t("province")} *</label>
                      <select
                        className="input-white py-3 text-xs tracking-wider bg-white cursor-pointer"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      >
                        <option value="">{language === "en" ? "Select Province" : "اختر المحافظة"}</option>
                        <option value="بغداد">بغداد</option>
                        <option value="البصرة">البصرة</option>
                        <option value="أربيل">أربيل</option>
                        <option value="النجف">النجف</option>
                        <option value="كربلاء">كربلاء</option>
                        <option value="السليمانية">السليمانية</option>
                        <option value="كركوك">كركوك</option>
                        <option value="الموصل">الموصل</option>
                        <option value="ذي قار">ذي قار</option>
                        <option value="بابل">بابل</option>
                        <option value="واسط">واسط</option>
                        <option value="ميسان">ميسان</option>
                        <option value="المثنى">المثنى</option>
                        <option value="القادسية">القادسية</option>
                        <option value="صلاح الدين">صلاح الدين</option>
                        <option value="ديالى">ديالى</option>
                        <option value="الأنبار">الأنبار</option>
                        <option value="دهوك">دهوك</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">{t("phone")} *</label>
                      <input
                        type="tel"
                        className="input-white py-3 text-xs tracking-wider"
                        placeholder="07XX XXX XXXX"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-8 text-start">
                <h2 className="text-[10px] font-bold tracking-widest uppercase border-b border-rule pb-4 text-secondary">
                  {t("payment_method")}
                </h2>

                <div className="flex gap-4 border border-rule p-1.5 bg-[#fcfcfa] mb-8">
                  {["دفع عند الاستلام", "Credit Card", "زين كاش"].map((method) => {
                    const active = paymentMethod === method;
                    let displayLabel = method;
                    if (method === "دفع عند الاستلام") displayLabel = language === "en" ? "Cash on Delivery" : "دفع عند الاستلام";
                    else if (method === "Credit Card") displayLabel = language === "en" ? "Credit Card" : "بطاقة ائتمان";
                    else if (method === "زين كاش") displayLabel = language === "en" ? "Zain Cash" : "زين كاش";

                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2.5 text-[9px] tracking-widest uppercase transition-colors font-bold rounded-none ${
                          active
                            ? "bg-black text-white"
                            : "bg-transparent text-secondary hover:text-primary"
                        }`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "Credit Card" ? (
                  <div className="space-y-6 bg-white border border-rule p-8">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">Card Number *</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="input-white pr-10 py-3 text-xs tracking-wider"
                          placeholder="•••• •••• •••• ••••"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          required
                        />
                        <CreditCard size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">Expiry Date *</label>
                        <input
                          type="text"
                          className="input-white py-3 text-xs tracking-wider"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-secondary mb-2">CVV *</label>
                        <input
                          type="password"
                          className="input-white py-3 text-xs tracking-wider"
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#fcfcfa] border border-rule p-8 text-center">
                    <p className="text-secondary text-[11px] font-light uppercase tracking-wider leading-relaxed">
                      Authenticate your secure {paymentMethod} transaction upon order submission.
                    </p>
                  </div>
                )}
              </div>

              {/* Error block */}
              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-100 p-4 font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-black w-full py-4.5 justify-center text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 rounded-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{language === "en" ? "Processing..." : "جاري تأكيد الطلب..."}</span>
                  </>
                ) : (
                  <>
                    <span>{t("confirm_order")} · {formatPrice(total + getShippingCost(total))}</span>
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Sidebar Summary */}
            <div className="bg-[#fcfcfa] border border-rule p-8 md:p-10 space-y-8 lg:sticky lg:top-28">
              <h2 className="heading-serif text-2xl font-light text-primary border-b border-rule pb-4 text-start">
                {language === "en" ? "Your Order" : "طلبك"}
              </h2>

              <div className="divide-y divide-rule max-h-[350px] overflow-auto pr-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                    <div className="w-16 aspect-[3/4] bg-white shrink-0 overflow-hidden border border-rule">
                      <img
                        src={item.main_image_url || item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 font-light text-[11px] space-y-1">
                      <h4 className="heading-serif text-sm font-light text-primary truncate leading-tight">{item.name}</h4>
                      {item.brand && <p className="text-[9px] text-secondary font-bold uppercase tracking-wider">{item.brand.name}</p>}
                      <p className="text-secondary uppercase">{language === "en" ? "Qty:" : "الكمية:"} {item.quantity}</p>
                      <p className="text-primary font-medium">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rule pt-2" />

              <div className="space-y-4 text-xs font-light">
                <div className="flex justify-between text-secondary">
                  <span className="uppercase tracking-wider">{t("subtotal")}</span>
                  <span className="text-primary font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span className="uppercase tracking-wider">{t("shipping")}</span>
                  <span className="text-green-700 font-semibold uppercase tracking-wider">
                    {formatShipping(subtotal)}
                  </span>
                </div>
                <div className="rule pt-2" />
                <div className="flex justify-between text-sm font-semibold text-primary pt-2">
                  <span className="uppercase tracking-widest font-bold">{t("total")}</span>
                  <span className="heading-serif text-lg font-light">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
