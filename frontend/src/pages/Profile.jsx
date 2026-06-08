import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import api from "../api/client";
import { useUserStore } from "../store/useUserStore";
import { Sparkles, User, ArrowLeft, Ruler, Shield, Heart, Check, Loader2 } from "lucide-react";

const AVAILABLE_BRANDS = ["Gucci", "Prada", "Nike", "Zara", "Loro Piana", "Hermès", "SSENSE", "Balenciaga"];
const AVAILABLE_STYLES = ["Stealth Wealth", "Minimal Elegance", "Cozy Minimalism", "Avant-Garde", "Cyber Streetwear", "After Hours"];

export default function Profile() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const { token, user, setUser, logout } = useUserStore();

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const payload = {
        full_name: fullName,
        height,
        weight,
        body_bust: bust,
        body_waist: waist,
        body_hips: hips,
        brand_preferences: selectedBrands.join(","),
        style_preferences: selectedStyles.join(",")
      };

      const res = await api.patch("/users/me", payload);
      setUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save profile modifications.");
    } finally {
      setSaving(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-surface font-sans text-primary">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-6 md:px-12 pt-28 pb-24">
        {/* Back link */}
        <Link
          to={brand_slug ? `/brands/${brand_slug}` : "/"}
          className="flex items-center gap-2 text-[10px] text-secondary hover:text-primary transition-colors mb-12 uppercase tracking-[0.2em] font-bold"
        >
          <ArrowLeft size={12} />
          <span>Back to Atelier</span>
        </Link>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="animate-spin text-secondary" size={24} />
            <p className="text-xs uppercase tracking-widest text-secondary font-bold">Synchronizing Style Identity...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_2.5fr] gap-12 lg:gap-20 items-start">
            
            {/* Sidebar Details */}
            <div className="space-y-8 lg:sticky lg:top-28">
              <div className="space-y-4">
                <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
                  CUSTOMER IDENTITY
                </span>
                <h1 className="heading-serif text-3xl font-light leading-tight">
                  {fullName || "Style Member"}
                </h1>
                <p className="text-xs text-secondary font-light truncate">{email}</p>
              </div>

              <div className="border-t border-rule pt-6 space-y-4 text-xs font-light text-secondary">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-primary" />
                  <span>Cloud-Synced Profile Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler size={14} className="text-primary" />
                  <span>Drape Metrics Memory Active</span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate(brand_slug ? `/brands/${brand_slug}` : "/");
                }}
                className="w-full text-center py-3 border border-rule hover:border-black text-[10px] font-bold uppercase tracking-widest transition-colors bg-white mt-4"
              >
                Sign Out Identity
              </button>
            </div>

            {/* Main Form Area */}
            <form onSubmit={handleSave} className="space-y-12">
              
              {/* Box 1: Personal info */}
              <div className="bg-white border border-rule p-8 rounded-sm space-y-6 shadow-sm">
                <h2 className="text-xs font-bold tracking-widest uppercase border-b border-rule pb-3.5 flex items-center gap-2">
                  <User size={14} strokeWidth={1.5} />
                  <span>1. Personal Credentials</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jean Laurent"
                      className="w-full p-3 border border-rule outline-none text-xs font-light bg-transparent focus:border-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full p-3 border border-rule outline-none text-xs font-light bg-neutral-50 text-secondary cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Measurements */}
              <div className="bg-white border border-rule p-8 rounded-sm space-y-8 shadow-sm">
                <h2 className="text-xs font-bold tracking-widest uppercase border-b border-rule pb-3.5 flex items-center gap-2">
                  <Ruler size={14} strokeWidth={1.5} />
                  <span>2. Body Fitting Profile (Drape Metrics)</span>
                </h2>

                <p className="text-xs text-secondary font-light leading-relaxed max-w-xl">
                  These measurements are fed dynamically into our virtual try-on algorithms to calculate exact fabric draping, stretching, and silhouette mapping.
                </p>

                <div className="space-y-6">
                  {/* Height */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-secondary">
                      <span>Height</span>
                      <span className="text-primary font-bold">{height} cm</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="140"
                        max="220"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="flex-1 accent-black h-1 bg-neutral-100 rounded-full cursor-pointer"
                      />
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Math.max(140, Math.min(220, Number(e.target.value))))}
                        className="w-16 p-1 text-center border border-rule text-xs bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-secondary">
                      <span>Weight</span>
                      <span className="text-primary font-bold">{weight} kg</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="40"
                        max="140"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="flex-1 accent-black h-1 bg-neutral-100 rounded-full cursor-pointer"
                      />
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Math.max(40, Math.min(140, Number(e.target.value))))}
                        className="w-16 p-1 text-center border border-rule text-xs bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Chest / Bust */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-secondary">
                      <span>Chest / Bust Circumference</span>
                      <span className="text-primary font-bold">{bust} cm</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="70"
                        max="140"
                        value={bust}
                        onChange={(e) => setBust(Number(e.target.value))}
                        className="flex-1 accent-black h-1 bg-neutral-100 rounded-full cursor-pointer"
                      />
                      <input
                        type="number"
                        value={bust}
                        onChange={(e) => setBust(Math.max(70, Math.min(140, Number(e.target.value))))}
                        className="w-16 p-1 text-center border border-rule text-xs bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Waist */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-secondary">
                      <span>Waist Circumference</span>
                      <span className="text-primary font-bold">{waist} cm</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="50"
                        max="130"
                        value={waist}
                        onChange={(e) => setWaist(Number(e.target.value))}
                        className="flex-1 accent-black h-1 bg-neutral-100 rounded-full cursor-pointer"
                      />
                      <input
                        type="number"
                        value={waist}
                        onChange={(e) => setWaist(Math.max(50, Math.min(130, Number(e.target.value))))}
                        className="w-16 p-1 text-center border border-rule text-xs bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Hips */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-secondary">
                      <span>Hips Circumference</span>
                      <span className="text-primary font-bold">{hips} cm</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="70"
                        max="140"
                        value={hips}
                        onChange={(e) => setHips(Number(e.target.value))}
                        className="flex-1 accent-black h-1 bg-neutral-100 rounded-full cursor-pointer"
                      />
                      <input
                        type="number"
                        value={hips}
                        onChange={(e) => setHips(Math.max(70, Math.min(140, Number(e.target.value))))}
                        className="w-16 p-1 text-center border border-rule text-xs bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Preferences */}
              <div className="bg-white border border-rule p-8 rounded-sm space-y-8 shadow-sm">
                <h2 className="text-xs font-bold tracking-widest uppercase border-b border-rule pb-3.5 flex items-center gap-2">
                  <Heart size={14} strokeWidth={1.5} />
                  <span>3. Style & Brand Curation Preferences</span>
                </h2>

                {/* Brands */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Brand Curation</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_BRANDS.map(brand => {
                      const active = selectedBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleBrand(brand)}
                          className={`py-2 px-4 border text-xs font-semibold uppercase tracking-wider transition-colors ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-rule hover:border-black/50 text-secondary"
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Styles */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Style Aesthetics</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_STYLES.map(style => {
                      const active = selectedStyles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyle(style)}
                          className={`py-2 px-4 border text-xs font-semibold uppercase tracking-wider transition-colors ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-rule hover:border-black/50 text-secondary"
                          }`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-rule">
                <div>
                  {success && (
                    <span className="text-xs text-green-600 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      <Check size={14} /> Profile Synchronized Successfully
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-black py-4 px-12 text-xs font-bold tracking-widest uppercase flex items-center gap-2 min-w-[200px] justify-center"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  <span>{saving ? "Saving Draft..." : "Save Identity"}</span>
                </button>
              </div>

            </form>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
