import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Sparkles, Sun, Moon, Camera, Heart, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "../../store/useCartStore";
import { useUserStore } from "../../store/useUserStore";
import useWishlistStore from "../../store/useWishlistStore";
import CartDrawer from "../cart/CartDrawer";
import AIFashionStylist from "../stylist/AIFashionStylist";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../api/client";
import { useLanguageStore } from "../../store/useLanguageStore";
import { useCurrencyStore, CURRENCIES } from "../../store/useCurrencyStore";


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
  const [brand, setBrand] = useState(null);

  useEffect(() => {
    if (brand_slug && brand_slug !== "undefined" && brand_slug !== "null") {
      api.get(`/products/brands/slug/${brand_slug}`)
        .then((res) => {
          setBrand(res.data);
        })
        .catch((err) => {
          console.error("Navbar failed to fetch brand details", err);
        });
    } else {
      setBrand(null);
    }
  }, [brand_slug]);


  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const wishlistCount = useWishlistStore((s) => s.count);
  const { token, logout, role, brandSlug } = useUserStore();
  const { t, language, setLanguage } = useLanguageStore();
  const { currentCurrency, setCurrency } = useCurrencyStore();


  const logoLink = brand_slug ? `/brands/${brand_slug}` : "/discover";
  const brandDisplayName = brand_slug ? brand_slug.toUpperCase() : "VRITAL";

  const navLinks = brand_slug ? [
    { to: `/brands/${brand_slug}`, label: t("atelier") },
    { to: `/brands/${brand_slug}/shop`, label: t("shop_all") },
  ] : [];


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
    const query = searchQuery.toLowerCase();
    const matchName = p.name?.toLowerCase().includes(query);
    const matchTag = p.editorial_tags?.toLowerCase().includes(query);
    const matchBrand = selectedBrand ? (p.brand?.name === selectedBrand) : true;
    return (matchName || matchTag) && matchBrand;
  });

  return (
    <>
      <CartDrawer />
      <AIFashionStylist />
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-rule">

        <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          
          {/* Left Navigation & Brand Mark */}
          <div className="flex items-center gap-8">
            <Link to={logoLink} className="flex items-baseline gap-3 group">
              <span className="font-serif text-2xl font-light tracking-tight text-primary uppercase">
                {brandDisplayName}
              </span>
              {brand_slug && (
                <span className="hidden sm:inline-block text-[9px] font-mono tracking-widest text-secondary uppercase opacity-60">
                  / Atelier
                </span>
              )}
            </Link>

            {brand_slug && (
              <Link to="/discover" className="hidden md:inline-flex items-center text-[10px] font-bold tracking-wider text-secondary uppercase hover:text-black transition-colors">
                {t("directory")}
              </Link>
            )}
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={label}
                  to={to}
                  className="label-upper-dark hover:text-secondary transition-colors text-[10px] tracking-wider"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4 md:gap-5 ml-auto md:ml-0 text-primary">
            
            {/* Multi-Currency Switcher */}
            <select
              value={currentCurrency}
              onChange={(e) => {
                setCurrency(e.target.value);
                window.dispatchEvent(new Event("storage"));
              }}
              aria-label="Currency"
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 border border-neutral-200 hover:border-black rounded-sm bg-transparent text-primary focus:outline-none cursor-pointer hidden md:block"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c} className="bg-white text-black text-xs">
                  {c} ({CURRENCIES[c].symbol})
                </option>
              ))}
            </select>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border border-neutral-200 hover:border-black rounded-sm transition-colors text-primary"
            >
              {language === "en" ? "العربية" : "English"}
            </button>


            {/* AI Visual Search Capsule Button */}
            <Link
              to="/search-by-image"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[9px] font-bold tracking-widest uppercase hover:bg-neutral-800 transition-all rounded-full shadow-sm group border border-neutral-800"
              title={language === "en" ? "Search by Image with AI" : "البحث بالصورة بواسطة الذكاء الاصطناعي"}
            >
              <Camera size={13} className="group-hover:scale-110 transition-transform text-neutral-300" />
              <span className="hidden sm:inline">{language === "en" ? "Visual Search" : "ابحث بالصورة"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </Link>

            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hover:text-secondary transition-colors"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            {/* Wishlist Link */}
            <Link
              to={brand_slug ? `/brands/${brand_slug}/wishlist` : "/wishlist"}
              aria-label="Wishlist"
              className="relative hover:text-secondary transition-colors hidden sm:block"
              title="Saved Items"
            >
              <Heart size={18} strokeWidth={1.5} className={wishlistCount > 0 ? "fill-ink text-ink" : ""} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Order Tracking Quick Link */}
            <Link
              to="/track-order"
              aria-label="Track Order"
              className="hover:text-secondary transition-colors hidden lg:block"
              title="Track Order"
            >
              <Truck size={18} strokeWidth={1.5} />
            </Link>

            {token ? (
              <div className="flex items-center gap-4">
                {role === "admin" && (
                  <a
                    href="http://localhost:5174/admin"
                    className="label-upper hover:text-ink transition-colors hidden md:block"
                  >
                    {t("dashboard")}
                  </a>
                )}
                {role === "partner" && (
                  <a
                    href={`http://localhost:5174/partner/${brandSlug || "zara"}`}
                    className="label-upper hover:text-ink transition-colors hidden md:block"
                  >
                    {t("dashboard")}
                  </a>
                )}
                <Link
                  to={brand_slug ? `/brands/${brand_slug}/profile` : "/profile"}
                  className="label-upper hover:text-ink transition-colors hidden md:block"
                >
                  {t("profile")}
                </Link>
                <button
                  onClick={logout}
                  className="label-upper hover:text-ink transition-colors hidden md:block"
                >
                  {t("sign_out")}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                id="login-button"
                className="label-upper hover:text-ink transition-colors hidden md:block"
              >
                {t("sign_in")}
              </Link>
            )}


            {/* Cart Button (Opens Slide-in Drawer) */}
            <button
              onClick={openDrawer}
              id="cart-button"
              aria-label="Open Shopping Bag"
              className="relative hover:text-secondary transition-colors cursor-pointer"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-ink text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
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
                  placeholder={language === "ar" ? "ابحث عن الملابس، الماركات، الخامات..." : "SEARCH GARMENTS, FABRICS OR BRAND HOUSES..."}
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
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    navigate("/search-by-image");
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 text-[10px] uppercase tracking-widest font-semibold text-secondary whitespace-nowrap border border-rule"
                  title="Search by Image / البحث بالصورة"
                >
                  <Camera size={15} />
                  <span>{language === "ar" ? "البحث بالصورة" : "Search by Image"}</span>
                </button>
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
          <div className="px-8 py-8 flex flex-col gap-4 text-start">
            {token ? (
              <>
                {role === "admin" && (
                  <a href="http://localhost:5174/admin" className="label-upper text-start" onClick={() => setMenuOpen(false)}>{t("dashboard")}</a>
                )}
                {role === "partner" && (
                  <a href={`http://localhost:5174/partner/${brandSlug || "zara"}`} className="label-upper text-start" onClick={() => setMenuOpen(false)}>{t("dashboard")}</a>
                )}
                <Link to={brand_slug ? `/brands/${brand_slug}/profile` : "/profile"} className="label-upper text-start" onClick={() => setMenuOpen(false)}>{t("profile")}</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="label-upper text-start">{t("sign_out")}</button>
              </>
            ) : (
              <Link to="/login" className="label-upper text-start" onClick={() => setMenuOpen(false)}>{t("sign_in")}</Link>
            )}
          </div>

        </div>
      )}
    </>
  );
}
