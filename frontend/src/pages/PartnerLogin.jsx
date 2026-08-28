import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import api from "../api/client";

export default function PartnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAuth = useUserStore((s) => s.setAuth);

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
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-black text-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Store size={26} />
          </div>
          <div className="text-xs text-gray-500 tracking-widest mb-2 font-mono">MEMBERS ENTRANCE</div>
          <h1 className="text-2xl font-bold text-gray-900">Access the Studio</h1>
          <p className="text-gray-500 text-sm mt-1 px-4">Enter your partner credentials to access the management portal.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email</label>
              <input
                id="partner-email"
                type="email"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                value={email}
                placeholder="partner@vrital.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="partner-password"
                  type={showPass ? "text" : "password"}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all pr-10"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              id="partner-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white font-medium text-sm rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "ENTER STUDIO"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
