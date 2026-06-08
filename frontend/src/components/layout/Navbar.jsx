import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Sparkles, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "../../store/useCartStore";
import { useUserStore } from "../../store/useUserStore";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../api/client";

const EDITORIAL_TAGS = ["Stealth Wealth", "Minimal Elegance", "Cozy Minimalism", "Avant-Garde", "Evening Elegance", "Summer Atelier"];
const BOUTIQUE_HOUSES = ["Gucci", "Prada", "Nike", "Zara", "Loro Piana", "Hermès", "SSENSE"];

export default function Navbar() {
  const navigate = useNavigate();
  const { brand_slug } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Search Overlay States
  const [searchProducts, setSearchProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const items = useCartStore((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const { token, logout, role, brandSlug } = useUserStore();

  const logoLink = brand_slug ? `/brands/${brand_slug}` : "/discover";
  const brandDisplayName = brand_slug ? brand_slug.toUpperCase() : "VRITAL";

  const navLinks = brand_slug ? [
    { to: `/brands/${brand_slug}`, label: "Atelier" },
    { to: `/brands/${brand_slug}/shop`, label: "Shop All" },
    { to: `/brands/${brand_slug}/tryon`, label: "AI Try‑On" },
  ] : [
    { to: "/discover", label: "Discover Houses" }
  ];

  // Fetch search candidates
  useEffect(() => {
    if (searchOpen) {
      api.get("/products")
        .then((res) => {
          setSearchProducts(res.data);
        })
        .catch((err) => console.error("Failed to load products for search", err));
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setSearchQuery("");
      setSelectedBrand("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [searchOpen]);

  // Force light mode to respect the user's styling preference for a pure white theme
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("vrital_theme", "light");
  }, []);

  // Compute autocomplete results
  const filteredProducts = searchProducts.filter((p) => {
    const matchesQuery = !searchQuery ? true : (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.editorial_tags || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.mood_aesthetic || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesBrand = !selectedBrand ? true : (p.brand?.name || "").toLowerCase() === selectedBrand.toLowerCase();
    return matchesQuery && matchesBrand;
  });

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-rule transition-colors duration-300">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1 text-primary"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo / Brand Name */}
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-3">
            {brand_slug && (
              <Link to="/discover" className="hidden md:inline-flex items-center text-[10px] font-bold tracking-wider text-secondary uppercase hover:text-black transition-colors">
                ← Directory
              </Link>
            )}
            <Link
              to={logoLink}
              className="font-display text-2xl tracking-widest2 font-light text-primary"
            >
              {brandDisplayName}
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <Link
                key={label}
                to={to}
                className="label-upper-dark hover:text-secondary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-5 ml-auto md:ml-0 text-primary">
            
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hover:text-secondary transition-colors"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>



            {token ? (
              <div className="flex items-center gap-4">
                {role === "admin" && (
                  <a
                    href="http://localhost:5175/admin"
                    className="label-upper hover:text-ink transition-colors hidden md:block"
                  >
                    Dashboard
                  </a>
                )}
                {role === "partner" && (
                  <a
                    href={`http://localhost:5175/partner/${brandSlug || "zara"}`}
                    className="label-upper hover:text-ink transition-colors hidden md:block"
                  >
                    Dashboard
                  </a>
                )}
                <Link
                  to={brand_slug ? `/brands/${brand_slug}/profile` : "/profile"}
                  className="label-upper hover:text-ink transition-colors hidden md:block"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="label-upper hover:text-ink transition-colors hidden md:block"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                id="login-button"
                className="label-upper hover:text-ink transition-colors hidden md:block"
              >
                Sign In
              </Link>
            )}


            {/* Cart Icon */}
            <Link to={brand_slug ? `/brands/${brand_slug}/cart` : "/cart"} id="cart-button" className="relative hover:text-secondary transition-colors">
              <ShoppingBag size={18} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-ink text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Full-Screen Luxury Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col text-primary p-6 md:p-12 overflow-y-auto"
          >
            {/* Header Control */}
            <div className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-rule pb-4 mb-10">
              <span className="text-[10px] font-bold tracking-[0.25em] text-secondary uppercase">
                VRITAL DIGITAL SEARCH
              </span>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
              >
                <span>Close</span>
                <X size={18} />
              </button>
            </div>

            {/* Input Form */}
            <div className="max-w-6xl w-full mx-auto mb-12">
              <div className="flex items-center gap-4 border-b-2 border-black pb-3">
                <Search size={28} className="text-secondary shrink-0" strokeWidth={1.2} />
                <input
                  autoFocus
                  type="text"
                  placeholder="SEARCH GARMENTS, FABRICS OR BRAND HOUSES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim() !== "") {
                      navigate(brand_slug ? `/brands/${brand_slug}/shop?search=${encodeURIComponent(searchQuery.trim())}` : `/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchOpen(false);
                    }
                  }}
                  className="w-full text-xl md:text-3xl font-light tracking-wide outline-none bg-transparent placeholder:text-neutral-300"
                />
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="max-w-6xl w-full mx-auto grid md:grid-cols-[1fr_2.2fr] gap-12 lg:gap-20 flex-grow">
              
              {/* Left Column: Tag Suggestions & Brand Filters */}
              <div className="space-y-10">
                {/* Brand filter buttons */}
                <div className="space-y-4">
                  <h3 className="text-[9px] font-bold tracking-widest uppercase text-secondary">
                    Filter by Boutique House
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedBrand(selectedBrand === "" ? "" : "")}
                      className={`py-1.5 px-3 border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        !selectedBrand ? "border-black bg-black text-white" : "border-rule text-secondary"
                      }`}
                    >
                      All Houses
                    </button>
                    {BOUTIQUE_HOUSES.map((brand) => {
                      const active = selectedBrand.toLowerCase() === brand.toLowerCase();
                      return (
                        <button
                          key={brand}
                          onClick={() => setSelectedBrand(active ? "" : brand)}
                          className={`py-1.5 px-3 border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            active ? "border-black bg-black text-white" : "border-rule text-secondary hover:border-black/50"
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editorial Tags suggestions */}
                <div className="space-y-4">
                  <h3 className="text-[9px] font-bold tracking-widest uppercase text-secondary">
                    Editorial Suggestions
                  </h3>
                  <div className="flex flex-col gap-2.5 items-start">
                    {EDITORIAL_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          setSelectedBrand("");
                        }}
                        className="text-sm font-light text-secondary hover:text-black transition-colors border-b border-transparent hover:border-black/30 pb-0.5"
                      >
                        — {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Autocomplete results list */}
              <div className="space-y-6">
                <h3 className="text-[9px] font-bold tracking-widest uppercase text-secondary border-b border-rule pb-3">
                  Atelier Results ({filteredProducts.length})
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        const targetSlug = brand_slug || product.brand?.slug || "zara";
                        navigate(`/brands/${targetSlug}/product/${product.id}`);
                        setSearchOpen(false);
                      }}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="aspect-[3/4] bg-neutral-100 overflow-hidden border border-rule rounded-sm relative">
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                        {product.mood_aesthetic && (
                          <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[8px] font-bold tracking-wider text-black px-2 py-0.5 uppercase">
                            {product.mood_aesthetic}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <p className="text-[10px] font-bold uppercase text-secondary truncate">{product.brand?.name}</p>
                          <p className="text-[10px] font-light text-primary">${Number(product.price).toFixed(2)}</p>
                        </div>
                        <p className="text-xs font-semibold text-primary group-hover:underline truncate">{product.name}</p>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="sm:col-span-2 lg:col-span-3 text-center py-20 text-secondary">
                      <p className="text-sm font-light">No boutique designs match your query.</p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedBrand("");
                        }}
                        className="text-xs font-bold uppercase tracking-wider text-black underline mt-2"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>


      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col pt-14 text-primary">
          <nav className="flex flex-col px-8 py-10 gap-8 border-b border-rule">
            {navLinks.map(({ to, label }) => (
              <Link
                key={label}
                to={to}
                className="font-display text-3xl font-light"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-8 py-8 flex flex-col gap-4">
            {token ? (
              <>
                {role === "admin" && (
                  <a href="http://localhost:5175/admin" className="label-upper text-left" onClick={() => setMenuOpen(false)}>Dashboard</a>
                )}
                {role === "partner" && (
                  <a href={`http://localhost:5175/partner/${brandSlug || "zara"}`} className="label-upper text-left" onClick={() => setMenuOpen(false)}>Dashboard</a>
                )}
                <Link to={brand_slug ? `/brands/${brand_slug}/profile` : "/profile"} className="label-upper text-left" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="label-upper text-left">Sign Out</button>
              </>
            ) : (
              <Link to="/login" className="label-upper" onClick={() => setMenuOpen(false)}>Sign In</Link>
            )}
          </div>

        </div>
      )}
    </>
  );
}
