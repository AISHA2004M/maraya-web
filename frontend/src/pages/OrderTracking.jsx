/**
 * OrderTracking — Live Order Status & Carrier Pipeline
 * =====================================================
 * Displays real-time progress of an order with carrier tracking info,
 * delivery estimations, cancellation capability, and item summaries.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, CheckCircle2, Truck, Clock, ShieldCheck, 
  Search, ArrowLeft, AlertCircle, RefreshCw, XCircle, 
  MapPin, Calendar, HelpCircle 
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/ui/SEO";
import { useLanguageStore } from "../store/useLanguageStore";
import { formatPrice } from "../utils/formatPrice";
import api from "../api/client";

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguageStore();

  const [orderIdInput, setOrderIdInput] = useState(id || "");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const fetchTracking = async (orderIdToFetch) => {
    if (!orderIdToFetch?.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/orders/track/${orderIdToFetch.trim()}`);
      setTrackingData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Order not found. Please verify your Order ID.");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTracking(id);
    }
  }, [id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      navigate(`/track-order/${orderIdInput.trim()}`);
      fetchTracking(orderIdInput.trim());
    }
  };

  const handleCancelOrder = async () => {
    if (!trackingData?.order_id) return;
    if (!window.confirm(language === "ar" ? "هل أنت متأكد من إلغاء هذا الطلب؟" : "Are you sure you want to cancel this order?")) {
      return;
    }
    setCancelling(true);
    try {
      await api.patch(`/orders/${trackingData.order_id}/cancel`);
      setCancelSuccess(true);
      fetchTracking(trackingData.order_id);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col">
      <SEO
        title={language === "ar" ? "تتبع حالة الطلب" : "Track Order"}
        description="Track your Maraya luxury apparel delivery with real-time status updates."
        canonical="/track-order"
      />
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 md:px-12 pt-28 pb-24">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] text-secondary hover:text-primary transition-colors mb-8 uppercase tracking-[0.2em] font-bold"
        >
          <ArrowLeft size={12} />
          <span>{language === "ar" ? "العودة" : "Back"}</span>
        </button>

        {/* Header Search Box */}
        <div className="bg-white border border-rule p-8 mb-10 shadow-sm">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="heading-serif text-3xl md:text-4xl font-light">
              {language === "ar" ? "تتبع مسار شحنتك" : "Track Your Delivery"}
            </h1>
            <p className="text-xs text-secondary font-light">
              {language === "ar"
                ? "أدخل رقم الطلب المرسل إلى بريدك الإلكتروني لمعرفة المرحلة الحالية للشحنة."
                : "Enter your order ID from your confirmation receipt to view live progress."}
            </p>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md mx-auto pt-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={language === "ar" ? "رقم الطلب (مثال: 550e8400-...)" : "Order ID (e.g. 550e8400-...)"}
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full border border-rule pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-ink"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-black text-xs px-6 py-2.5 uppercase tracking-widest font-bold flex items-center gap-1.5"
              >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : (language === "ar" ? "تتبع" : "Track")}
              </button>
            </form>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 pt-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Details View */}
        {trackingData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Status Summary Bar */}
            <div className="bg-white border border-rule p-6 md:p-8">
              <div className="grid md:grid-cols-4 gap-6 pb-6 border-b border-rule">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
                    {language === "ar" ? "رقم الطلب" : "Order Reference"}
                  </span>
                  <span className="text-xs font-mono font-semibold text-primary truncate block">
                    {trackingData.order_id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
                    {language === "ar" ? "الناقل والتتبع" : "Carrier & Tracking"}
                  </span>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Truck size={13} className="text-neutral-500" />
                    {trackingData.carrier} · {trackingData.tracking_number || "Processing"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
                    {language === "ar" ? "الموعد المتوقع للتسليم" : "Estimated Delivery"}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Calendar size={13} />
                    {trackingData.estimated_delivery}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
                    {language === "ar" ? "الحالة الحالية" : "Current Status"}
                  </span>
                  <span className="inline-block px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-ink text-white">
                    {trackingData.status_label}
                  </span>
                </div>
              </div>

              {/* Progress Meter */}
              <div className="pt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-secondary font-medium">{language === "ar" ? "مؤشر الشحن" : "Shipping Progress"}</span>
                  <span className="font-bold text-primary">{trackingData.progress_percentage}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-ink h-full transition-all duration-1000 rounded-full"
                    style={{ width: `${trackingData.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Left 2 Cols: Step List */}
              <div className="md:col-span-2 bg-white border border-rule p-6 md:p-8">
                <h3 className="text-xs uppercase font-bold tracking-widest text-secondary mb-6">
                  {language === "ar" ? "مراحل الشحن والتسليم" : "Detailed Journey Pipeline"}
                </h3>

                <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
                  {trackingData.steps?.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Step marker */}
                      <div
                        className={`absolute -left-6 md:-left-8 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                          step.completed
                            ? "bg-ink border-ink text-white"
                            : step.current
                            ? "bg-white border-ink text-ink animate-pulse"
                            : "bg-white border-neutral-300 text-neutral-300"
                        }`}
                      >
                        {step.completed ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>

                      <div>
                        <h4 className={`text-xs font-semibold ${step.completed || step.current ? "text-primary" : "text-neutral-400"}`}>
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-secondary font-light mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Address & Actions */}
              <div className="space-y-6">
                <div className="bg-white border border-rule p-6 space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-secondary">
                    {language === "ar" ? "عنوان التوصيل" : "Delivery Destination"}
                  </h3>
                  <div className="flex items-start gap-2.5 text-xs text-primary font-light">
                    <MapPin size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span>{trackingData.shipping_address || "Standard Address on File"}</span>
                  </div>

                  <div className="pt-3 border-t border-rule text-xs space-y-1">
                    <div className="flex justify-between text-secondary">
                      <span>{language === "ar" ? "عدد القطع" : "Items in Package"}</span>
                      <span className="font-semibold text-primary">{trackingData.items_count}</span>
                    </div>
                    <div className="flex justify-between text-secondary">
                      <span>{language === "ar" ? "إجمالي الفاتورة" : "Invoice Total"}</span>
                      <span className="font-semibold text-primary">{formatPrice(trackingData.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Box */}
                <div className="bg-white border border-rule p-6 space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-secondary">
                    {language === "ar" ? "المساعدة والإدارة" : "Assistance & Support"}
                  </h3>

                  {trackingData.status === "pending" || trackingData.status === "confirmed" ? (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={13} />
                      <span>{cancelling ? (language === "ar" ? "جاري الإلغاء..." : "Cancelling...") : (language === "ar" ? "إلغاء الطلب" : "Cancel Order")}</span>
                    </button>
                  ) : null}

                  <a
                    href="mailto:concierge@vrital.com"
                    className="w-full btn-outline py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle size={13} />
                    <span>{language === "ar" ? "تواصل مع خدمة العملاء" : "Contact Concierge"}</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
