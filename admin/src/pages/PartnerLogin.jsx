import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Loader2, Store } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/client";

export default function PartnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.role !== "partner" && res.data.role !== "admin") {
        throw new Error("Unauthorized access. Partner account required.");
      }
      const bSlug = res.data.brand_slug || "zara";
      setAuth({ email }, res.data.access_token, res.data.role, bSlug);
      navigate(`/partner/${bSlug}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4" >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" >
            <Store size={26} className="text-primary" />
          </div>
          <div className="label-upper-dark text-secondary tracking-widest mb-3">MEMBERS ENTRANCE</div>
          <h1 className="text-2xl font-black text-primary heading-serif">Access the Studio</h1>
          <p className="text-secondary text-sm mt-1 px-4">Enter your exclusive fashion secret to enter the couture experience.</p>
        </div>

        <div className="admin-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-secondary mb-1.5 block font-medium">Email</label>
              <input
                id="partner-email"
                type="email"
                className="input-admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1.5 block font-medium uppercase tracking-widest">FASHION SECRET</label>
              <div className="relative">
                <input
                  id="partner-password"
                  type={showPass ? "text" : "password"}
                  className="input-admin pr-10"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-secondary"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-error bg-error-container rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              id="partner-login-btn"
              type="submit"
              disabled={loading}
              className="btn-admin w-full justify-center py-3"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "ENTER STUDIO"}
            </button>
          </form>

          <p className="text-[12px] text-secondary text-center mt-6 border-t border-outline-variant pt-4">
            Are you a store owner?{" "}
            <Link to="/partner/register" className="text-primary font-medium hover:underline">
              Register your brand
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
