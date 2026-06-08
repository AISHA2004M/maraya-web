import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Loader2, Store } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/client";

export default function PartnerRegister() {
  const [fullName, setFullName] = useState("");
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
      const res = await api.post("/auth/register-partner", { 
        full_name: fullName,
        email, 
        password 
      });
      const bSlug = res.data.brand_slug || "zara";
      setAuth({ email, full_name: fullName }, res.data.access_token, res.data.role, bSlug);
      navigate(`/partner/${bSlug}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
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
          <h1 className="text-2xl font-black text-primary">Partner Registration</h1>
          <p className="text-secondary text-sm mt-1">Join the Vrital Ecosystem</p>
        </div>

        <div className="admin-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-secondary mb-1.5 block font-medium">Brand / Store Name</label>
              <input
                id="admin-name"
                type="text"
                className="input-admin"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Acme Apparel"
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1.5 block font-medium">Work Email</label>
              <input
                id="admin-email"
                type="email"
                className="input-admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store@example.com"
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1.5 block font-medium">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  className="input-admin pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-error bg-error-container border border-error/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              id="admin-register-btn"
              type="submit"
              disabled={loading}
              className="btn-admin w-full justify-center py-3 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "Creating Account..." : "Create Partner Account"}
            </button>
          </form>

          <p className="text-[12px] text-secondary text-center mt-6">
            Already have a partner account?{" "}
            <Link to="/partner/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
