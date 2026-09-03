/**
 * Profile Page — Luxury Member Atelier & Account Dashboard
 * ==========================================================
 * Features:
 *   - Tab 1: Orders History & Live Tracking Pipeline
 *   - Tab 2: AI Silhouette & Body Measurements
 *   - Tab 3: Style Preferences & Curated Houses
 *   - Tab 4: Account Security & Password Change
 */
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/ui/SEO";
import api from "../api/client";
import { useUserStore } from "../store/useUserStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { formatPrice } from "../utils/formatPrice";
import { 
  Sparkles, User, ArrowLeft, Ruler, Shield, Heart, 
  Check, Loader2, Package, Truck, Lock, LogOut, 
  Clock, CheckCircle2, ChevronRight, ExternalLink 
} from "lucide-react";

const AVAILABLE_BRANDS = ["Gucci", "Prada", "Nike", "Zara", "Loro Piana", "Hermès", "SSENSE", "Balenciaga"];
const AVAILABLE_STYLES = ["Stealth Wealth", "Minimal Elegance", "Cozy Minimalism", "Avant-Garde", "Cyber Streetwear", "After Hours"];

export default function Profile() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const { token, user, setUser, logout } = useUserStore();
  const { language } = useLanguageStore();

  const [activeTab, setActiveTab] = useState("orders"); // orders | measurements | preferences | security
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [bust, setBust] = useState(90);
  const [waist, setWaist] = useState(75);
  const [hips, setHips] = useState(95);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    api.get("/users/me")
      .then((res) => {
        const u = res.data;
        setUser(u);
        setFullName(u.full_name || "");
        setEmail(u.email || "");
        setHeight(u.height || 175);
        setWeight(u.weight || 70);
        setBust(u.body_bust || 90);
        setWaist(u.body_waist || 75);
        setHips(u.body_hips || 95);
        
        if (u.brand_preferences) {
          setSelectedBrands(u.brand_preferences.split(",").map(b => b.trim()).filter(Boolean));
        }
        if (u.style_preferences) {
          setSelectedStyles(u.style_preferences.split(",").map(s => s.trim()).filter(Boolean));
        }
      })
      .catch((err) => {
        console.error("Failed to load user profile", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch user orders
    setLoadingOrders(true);
    api.get("/orders/my-orders")
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.error("Failed to load orders", err))
      .finally(() => setLoadingOrders(false));
  }, [token, navigate, setUser]);

  const toggleBrand = (b) => {
    setSelectedBrands(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    );
  };

  const toggleStyle = (s) => {
    setSelectedStyles(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await api.put("/users/me", {
        full_name: fullName,
        height: Number(height),
        weight: Number(weight),
        body_bust: Number(bust),
        body_waist: Number(waist),
        body_hips: Number(hips),
        brand_preferences: selectedBrands.join(", "),
        style_preferences: selectedStyles.join(", "),
      });
      setUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col font-sans">
      <SEO
        title={language === "ar" ? "الملف الشخصي والطلبات" : "Member Atelier & Orders"}
        canonical="/profile"
      />
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-12 pt-28 pb-24">
        {/* Top Breadcrumb & User Tag */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-8 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
              {language === "ar" ? "أتيلييه العضو المميز" : "Exclusive Member Atelier"}
            </span>
            <h1 className="heading-serif text-3xl md:text-4xl font-light">
              {fullName || (language === "ar" ? "عضو مرايا" : "Maraya Member")}
            </h1>
            <p className="text-xs text-secondary font-mono mt-1">{email}</p>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-2 text-xs text-secondary hover:text-red-600 border border-rule px-4 py-2 bg-white transition-colors self-start md:self-auto"
          >
            <LogOut size={13} />
            <span>{language === "ar" ? "تسجيل الخروج" : "Sign Out"}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-rule mb-10 overflow-x-auto gap-2 md:gap-8 scrollbar-none">
          {[
            { id: "orders", label: language === "ar" ? "طلباتي والشحن" : "My Orders & Tracking", icon: Package, count: orders.length },
            { id: "measurements", label: language === "ar" ? "المقاسات والذكاء الاصطناعي" : "AI Fit & Measurements", icon: Ruler },
            { id: "preferences", label: language === "ar" ? "التفضيلات والماركات" : "Brand Preferences", icon: Sparkles },
            { id: "security", label: language === "ar" ? "الأمان وكلمة المرور" : "Security & Password", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 text-xs uppercase tracking-widest font-bold whitespace-nowrap transition-all relative ${
                  isActive ? "text-primary font-black" : "text-secondary hover:text-primary"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-800">
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {loadingOrders ? (
              <div className="p-12 text-center">
                <Loader2 size={24} className="animate-spin text-secondary mx-auto mb-2" />
                <p className="text-xs text-secondary">{language === "ar" ? "جاري تحميل الطلبات..." : "Loading orders history..."}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-rule p-16 text-center max-w-md mx-auto">
                <Package size={32} className="text-neutral-300 mx-auto mb-4" />
                <h3 className="heading-serif text-xl font-light mb-2">
                  {language === "ar" ? "لا توجد طلبات سابقة" : "No orders placed yet"}
                </h3>
                <p className="text-xs text-secondary mb-6 leading-relaxed">
                  {language === "ar"
                    ? "عند إتمام أي طلب أزياء، ستتمكن من تتبع حالة الشحن والتوصيل خطوة بخطوة هنا."
                    : "Once you place an order, you will be able to track every stage of courier delivery here."}
                </p>
                <Link
                  to={brand_slug ? `/brands/${brand_slug}/shop` : "/discover"}
                  className="btn-black text-xs py-3 px-6 uppercase font-bold tracking-widest inline-block"
                >
                  {language === "ar" ? "تصفح التشكيلة" : "Start Shopping"}
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  });
                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-rule p-6 md:p-8 space-y-6 shadow-sm hover:border-neutral-400 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-primary">
                              #{order.id.slice(0, 8)}...
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              order.status === "delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-ink text-white"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-secondary mt-1">
                            {language === "ar" ? "تاريخ الطلب:" : "Placed on:"} {dateStr}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-primary">
                            {formatPrice(order.total_amount)}
                          </span>
                          <Link
                            to={`/track-order/${order.id}`}
                            className="btn-black text-[11px] py-2 px-4 uppercase tracking-wider font-bold flex items-center gap-1.5"
                          >
                            <Truck size={12} />
                            <span>{language === "ar" ? "تتبع الشحنة" : "Track Order"}</span>
                          </Link>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
                          {language === "ar" ? "القطع المطلوبة" : "Ordered Items"} ({order.items?.length || 0})
                        </span>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="p-2.5 bg-[#faf9f7] border border-rule/60 text-xs flex justify-between items-center">
                              <span className="font-mono text-[11px] text-secondary truncate">
                                Item #{it.product_id?.slice(0, 6)}...
                              </span>
                              <span className="font-semibold text-primary">
                                {it.quantity}x {formatPrice(it.price_at_purchase)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Measurements */}
        {activeTab === "measurements" && (
          <form onSubmit={handleSaveProfile} className="bg-white border border-rule p-8 md:p-10 max-w-3xl space-y-8">
            <div>
              <h3 className="heading-serif text-2xl font-light mb-1">
                {language === "ar" ? "قياسات القوام الدقيقة" : "Couture Silhouette Measurements"}
              </h3>
              <p className="text-xs text-secondary font-light">
                {language === "ar"
                  ? "تُستخدم هذه القياسات لضبط محاكاة تجربة القياس الافتراضية واقتراح المقاس الدقيق (S/M/L) لكل ماركة."
                  : "Used to calibrate AI Try-On garment drape and deliver accurate size guidance across international brands."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "الطول (سم)" : "Height (cm)"}
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "الوزن (كغ)" : "Weight (kg)"}
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "محيط الصدر (سم)" : "Bust (cm)"}
                </label>
                <input
                  type="number"
                  value={bust}
                  onChange={(e) => setBust(e.target.value)}
                  className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "محيط الخصر (سم)" : "Waist (cm)"}
                </label>
                <input
                  type="number"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "محيط الأرداف (سم)" : "Hips (cm)"}
                </label>
                <input
                  type="number"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                  className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 rounded">
                <Check size={14} />
                <span>{language === "ar" ? "تم حفظ التعديلات بنجاح!" : "Measurements saved successfully!"}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-black text-xs py-3.5 px-8 uppercase tracking-widest font-bold flex items-center gap-2"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              <span>{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ القياسات" : "Save Measurements")}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Preferences */}
        {activeTab === "preferences" && (
          <form onSubmit={handleSaveProfile} className="bg-white border border-rule p-8 md:p-10 max-w-3xl space-y-8">
            <div>
              <h3 className="heading-serif text-2xl font-light mb-1">
                {language === "ar" ? "الماركات وبيوت الأزياء المفضلة" : "Preferred Fashion Houses"}
              </h3>
              <p className="text-xs text-secondary font-light mb-4">
                {language === "ar" ? "اختر الماركات لتخصيص خلاصة المنتجات واقتراحات التجربة." : "Curate your feed with your preferred ateliers."}
              </p>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_BRANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBrand(b)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                      selectedBrands.includes(b)
                        ? "bg-ink text-white border-ink"
                        : "bg-white text-secondary border-rule hover:border-ink"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-rule">
              <h3 className="heading-serif text-2xl font-light mb-1">
                {language === "ar" ? "الأنماط والأذواق المفضلة" : "Aesthetic Archetypes"}
              </h3>
              <p className="text-xs text-secondary font-light mb-4">
                {language === "ar" ? "حدد الأنماط التي تعبر عن ذوقك الشخصي." : "Select the aesthetics that match your wardrobe vision."}
              </p>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                      selectedStyles.includes(s)
                        ? "bg-ink text-white border-ink"
                        : "bg-white text-secondary border-rule hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-black text-xs py-3.5 px-8 uppercase tracking-widest font-bold flex items-center gap-2"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              <span>{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ التفضيلات" : "Save Preferences")}</span>
            </button>
          </form>
        )}

        {/* Tab 4: Security */}
        {activeTab === "security" && (
          <form onSubmit={handleChangePassword} className="bg-white border border-rule p-8 md:p-10 max-w-xl space-y-6">
            <div>
              <h3 className="heading-serif text-2xl font-light mb-1">
                {language === "ar" ? "أمان الحساب وكلمة المرور" : "Account Security"}
              </h3>
              <p className="text-xs text-secondary font-light">
                {language === "ar" ? "تحديث كلمة المرور لحماية حسابك وتفاصيل طلباتك." : "Update your password to keep your member account protected."}
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                {language === "ar" ? "كلمة المرور الحالية" : "Current Password"}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                {language === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full border border-rule p-2.5 text-xs focus:outline-none focus:border-ink"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-red-600">{passwordError}</p>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 rounded">
                <Check size={14} />
                <span>{language === "ar" ? "تم تغيير كلمة المرور بنجاح!" : "Password updated successfully!"}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-black text-xs py-3.5 px-8 uppercase tracking-widest font-bold flex items-center gap-2"
            >
              {passwordLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              <span>{passwordLoading ? (language === "ar" ? "جاري التحديث..." : "Updating...") : (language === "ar" ? "تحديث كلمة المرور" : "Update Password")}</span>
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
