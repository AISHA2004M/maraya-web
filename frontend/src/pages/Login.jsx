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
            <span className="heading-serif text-2xl text-primary mt-2">Vrital</span>
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
          <p className="text-sm text-secondary mb-8 text-center px-4">
            {isRegister 
              ? (language === "en" ? "Join Vrital to unlock the digital couture experience." : "انضم إلى مرايا لفتح تجربة الأزياء الرقمية الراقية.") 
              : (language === "en" ? "Enter your exclusive fashion secret to enter the couture experience." : "أدخل الرمز السري الخاص بك للدخول إلى تجربة تصميم الأزياء.")}
          </p>

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
              <label className="label-upper-dark mb-1 block text-start">{language === "en" ? "FASHION SECRET" : "كلمة المرور"}</label>
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
