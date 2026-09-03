import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { login, register } from "../api/auth";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAuth = useUserStore((s) => s.setAuth);
  const { t, language } = useLanguageStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let data;
      if (isRegister) {
        await register(email, password, name);
        data = await login(email, password);
      } else {
        data = await login(email, password);
      }
        
      const bSlug = data.brand_slug || null;
      setAuth({ email, full_name: name }, data.access_token, data.role, bSlug);
      
      if (data.role === "admin") {
        window.location.href = "http://localhost:5174/admin";
      } else if (data.role === "partner") {
        window.location.href = `http://localhost:5174/partner/${bSlug || "zara"}`;
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
            <span className="heading-serif text-2xl text-primary mt-2">{language === "ar" ? "مرايا" : "Maraya"}</span>
          </Link>
        </div>

        <div className="bg-white border border-outline-variant rounded-lg p-8 shadow-sm">
          <div className="label-upper-dark text-center mb-3 text-secondary tracking-widest">
            {isRegister 
              ? (language === "en" ? "NEW GUEST" : "عضو جديد") 
              : (language === "en" ? "MEMBERS ENTRANCE" : "بوابة الأعضاء")}
          </div>
          <h1 className="text-2xl font-bold text-primary mb-1 text-center heading-serif">
            {isRegister 
              ? (language === "en" ? "Join the Atelier" : "الانضمام للأتيلييه") 
              : (language === "en" ? "Access the Studio" : "الدخول للأستوديو")}
          </h1>
          <p className="text-sm text-secondary mb-6 text-center px-4">
            {isRegister 
              ? (language === "en" ? "Join Maraya to unlock the digital couture experience." : "انضم إلى مرايا لفتح تجربة الأزياء الرقمية الراقية.") 
              : (language === "en" ? "Enter your exclusive fashion secret to enter the couture experience." : "أدخل الرمز السري الخاص بك للدخول إلى تجربة تصميم الأزياء.")}
          </p>

          {/* Social Sign-In Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await api.post("/auth/social-login", {
                    provider: "google",
                    email: "guest.google@vrital.com",
                    full_name: "Google Member"
                  });
                  setAuth(res.data.access_token, res.data.role, res.data.brand_slug);
                  navigate(from, { replace: true });
                } catch (e) {
                  setError("Social login failed");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center justify-center gap-2 border border-rule hover:border-black py-2.5 px-3 rounded text-xs font-semibold text-primary transition-all hover:bg-neutral-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await api.post("/auth/social-login", {
                    provider: "apple",
                    email: "guest.apple@vrital.com",
                    full_name: "Apple Member"
                  });
                  setAuth(res.data.access_token, res.data.role, res.data.brand_slug);
                  navigate(from, { replace: true });
                } catch (e) {
                  setError("Social login failed");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center justify-center gap-2 border border-rule hover:border-black py-2.5 px-3 rounded text-xs font-semibold text-primary transition-all hover:bg-neutral-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.14 1.87-1 2.98 1.07.08 2.17-.51 2.83-1.33z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-rule"></div>
            <span className="flex-shrink mx-4 text-[10px] text-secondary uppercase font-bold tracking-widest">
              {language === "en" ? "or continue with email" : "أو بالبريد الإلكتروني"}
            </span>
            <div className="flex-grow border-t border-rule"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="label-upper-dark mb-1 block text-start">{t("full_name")}</label>
                <input
                  id="full-name-input"
                  type="text"
                  className="input-white"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}


            <div>
              <label className="label-upper-dark mb-1 block text-start">{t("email")}</label>
              <input
                id="email-input"
                type="email"
                className="input-white text-start"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label-upper-dark block text-start">{language === "en" ? "FASHION SECRET" : "كلمة المرور"}</label>
                {!isRegister && (
                  <Link
                    to="/forgot-password"
                    className="text-[10px] text-secondary hover:text-primary hover:underline"
                  >
                    {language === "en" ? "Forgot password?" : "نسيت كلمة المرور؟"}
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPass ? "text" : "password"}
                  className="input-white pr-10 text-start"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute ${language === "en" ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 text-secondary hover:text-primary`}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>



            {error && (
              <p className="text-xs text-error bg-error-container border border-error/20 rounded py-2 px-3">
                {error}
              </p>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-black w-full justify-center py-4 mt-4"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? (language === "en" ? "Please wait..." : "جاري التحقق...") : isRegister ? t("register_title") : (language === "en" ? "ENTER STUDIO" : "تسجيل الدخول")}</span>
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-8 pt-6 border-t border-outline-variant">
            {isRegister 
              ? (language === "en" ? "Already have an account?" : "لديك حساب بالفعل؟") 
              : (language === "en" ? "Don't have an account?" : "ليس لديك حساب؟")}{" "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-primary font-bold hover:underline transition-colors ml-1"
            >
              {isRegister ? t("sign_in") : (language === "en" ? "Register" : "سجل الآن")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
