/**
 * ResetPassword Page — Enter New Password
 * ========================================
 */
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/ui/SEO";
import { useLanguageStore } from "../store/useLanguageStore";
import api from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { language } = useLanguageStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid reset token");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password. Token may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-primary flex flex-col">
      <SEO
        title={language === "ar" ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
        canonical="/reset-password"
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-28">
        <div className="w-full max-w-md bg-white border border-rule p-8 md:p-10 shadow-sm">
          <h1 className="heading-serif text-3xl font-light mb-2">
            {language === "ar" ? "تعيين كلمة مرور جديدة" : "New Password"}
          </h1>
          <p className="text-xs text-secondary font-light mb-8">
            {language === "ar"
              ? "اختر كلمة مرور قوية لتأمين حسابك."
              : "Choose a secure password for your Vrital account."}
          </p>

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded space-y-3 text-center">
              <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
              <p className="text-xs font-bold">
                {language === "ar" ? "تم تحديث كلمة المرور بنجاح!" : "Password updated successfully!"}
              </p>
              <p className="text-[11px] text-emerald-700">
                {language === "ar" ? "جاري تحويلك لصفحة تسجيل الدخول..." : "Redirecting to sign in..."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-rule pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-secondary mb-1.5">
                  {language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
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
                <span>{loading ? (language === "ar" ? "جاري التحديث..." : "Updating...") : (language === "ar" ? "حفظ وتأكيد" : "Save New Password")}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
