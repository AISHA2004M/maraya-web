/**
 * ForgotPassword Page — Luxury Password Recovery
 * ===============================================
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/ui/SEO";
import { useLanguageStore } from "../store/useLanguageStore";
import api from "../api/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { language } = useLanguageStore();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [demoToken, setDemoToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
      if (res.data.reset_token) {
        setDemoToken(res.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col">
      <SEO
        title={language === "ar" ? "استعادة كلمة المرور" : "Forgot Password"}
        description="Reset your Vrital account password."
        canonical="/forgot-password"
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-28">
        <div className="w-full max-w-md bg-white border border-rule p-8 md:p-10 shadow-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[10px] text-secondary hover:text-primary uppercase tracking-widest font-bold mb-6 transition-colors"
          >
            <ArrowLeft size={12} />
            <span>{language === "ar" ? "العودة لتسجيل الدخول" : "Back to Sign In"}</span>
          </Link>

          <h1 className="heading-serif text-3xl font-light mb-2">
            {language === "ar" ? "استعادة الحساب" : "Reset Password"}
          </h1>
          <p className="text-xs text-secondary font-light mb-8 leading-relaxed">
            {language === "ar"
              ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لتعيين كلمة مرور جديدة."
              : "Enter the email associated with your account and we will generate a secure reset link."}
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{language === "ar" ? "تم إرسال رابط الاستعادة!" : "Reset Link Generated!"}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {language === "ar"
                    ? `إذا كان ${email} مسجلاً لدينا، فستصلك التعليمات في صندوق الوارد.`
                    : `If ${email} is registered, instructions have been dispatched.`}
                </p>
              </div>

              {demoToken && (
                <div className="p-4 bg-neutral-50 border border-rule text-xs space-y-2">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                    {language === "ar" ? "رابط الاستعادة المباشر (للتجربة السريعة):" : "Direct Reset Link (For Demo / Development):"}
                  </p>
                  <Link
                    to={`/reset-password?token=${demoToken}`}
                    className="block btn-black text-center text-xs py-2.5 uppercase font-bold tracking-widest"
                  >
                    {language === "ar" ? "تعيين كلمة المرور الآن ←" : "Proceed to Set New Password →"}
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border border-rule pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle size={13} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-black py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>{loading ? (language === "ar" ? "جاري الإرسال..." : "Sending...") : (language === "ar" ? "إرسال رابط الاستعادة" : "Send Reset Link")}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
