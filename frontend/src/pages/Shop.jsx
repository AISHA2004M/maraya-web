import { useState, useEffect } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import { useProducts, useBrands, useCategories } from "../hooks/useProducts";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/ui/SkeletonCard";
import { Search, SlidersHorizontal, X, ArrowUpDown, Sparkles } from "lucide-react";
import api from "../api/client";

export default function Shop() {
  const { brand_slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Brand CMS details
  const [brand, setBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(true);

  // Queries
  const { data: products, isLoading: isProductsLoading, isError } = useProducts();
  const { data: brands, isLoading: isBrandsLoading } = useBrands();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sortBy, setSortBy] = useState("default");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isEditorialLayout, setIsEditorialLayout] = useState(true);

  // Load brand details
  useEffect(() => {
    if (brand_slug) {
      setBrandLoading(true);
      api.get(`/products/brands/slug/${brand_slug}`)
        .then((res) => {
          setBrand(res.data);
          setBrandLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load brand metadata in Shop", err);
          setBrandLoading(false);
        });
    } else {
      setBrandLoading(false);
    }
  }, [brand_slug]);

  // Apply typography and dynamic accents
  useEffect(() => {
    if (brand) {
      const fontName = brand.font_family || "Hanken Grotesk, sans-serif";
      
      // Inject Google Font link if custom typography is selected
      if (brand.font_family && brand.font_family.includes("Bodoni Moda")) {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      } else if (brand.font_family && brand.font_family.includes("Montserrat")) {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }

      document.body.style.fontFamily = fontName;
      if (brand.accent_color) {
        document.documentElement.style.setProperty("--accent-color", brand.accent_color);
      }
    }
    return () => {
      document.body.style.fontFamily = "";
      document.documentElement.style.setProperty("--accent-color", "");
    };
  }, [brand]);

  // Sync search queries
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const handleBrandChange = (brandId) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleMoodChange = (moodName) => {
    setSelectedMoods((prev) =>
      prev.includes(moodName) ? prev.filter((m) => m !== moodName) : [...prev, moodName]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedMoods([]);
    setIsEditorialLayout(true);
    if (products && products.length > 0) {
      const prices = products.map((p) => Number(p.price));
      setMaxPrice(Math.ceil(Math.max(...prices)));
    }
    setSortBy("default");
  };

  // Filter products
  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.fabric_type || "").toLowerCase().includes(searchQuery.toLowerCase());

    const activeBrandId = brand ? brand.id : null;
    const matchesBrand = activeBrandId
      ? product.brand?.id === activeBrandId
      : (selectedBrands.length === 0 || selectedBrands.includes(product.brand?.id));

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(product.category?.id);

    const matchesPrice = Number(product.price) <= maxPrice;

    // Mood / Occasion mapping from database
    const productMood = product.mood_aesthetic || "Minimalist Core";
    const matchesMood = selectedMoods.length === 0 || selectedMoods.includes(productMood);

    return matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesMood;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
    return 0;
  });

  const highestPriceLimit = products && products.length > 0
    ? Math.ceil(Math.max(...products.map((p) => Number(p.price))))
    : 1000;

  return (
    <div className="min-h-screen bg-surface font-sans text-primary">
      <Navbar />

      {/* Header */}
      <section className="bg-white border-b border-rule pt-28 pb-12 px-6 md:px-12">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block">
            {brand ? `${brand.name} Atelier` : "L'Atelier Lookbook"}
          </span>
          <h1 className="heading-serif text-4xl md:text-6xl text-primary font-light">
            {brand ? `${brand.name} Catalog` : "The Catalog"}
          </h1>
          <p className="text-secondary text-sm font-light max-w-xl leading-relaxed">
            {brand 
              ? brand.description 
              : "Browse our unified edit of high-fashion garments from the world's most progressive design houses. Filter, select, and try them on virtually."}
          </p>
        </div>
      </section>

      {/* Content Layout */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 items-start">
          
          {/* Sidebar Filters */}
          <aside className="hidden lg:block space-y-8 sticky top-28 bg-white p-6 border border-rule rounded-sm shadow-sm">
            <div className="flex justify-between items-center border-b border-rule pb-4">
              <h3 className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <SlidersHorizontal size={14} /> Filters
              </h3>
              {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedMoods.length > 0 || searchQuery !== "" || sortBy !== "default") && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] text-secondary hover:text-black hover:underline uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Mood Occasion Filters */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">Moods & Occasions</h4>
              <div className="flex flex-wrap gap-2">
                {["Minimalist Core", "Evening Elegance", "Cozy Minimalism", "Stealth Wealth", "Avant-Garde"].map((mood) => {
                  const isSelected = selectedMoods.includes(mood);
                  return (
                    <button
                      key={mood}
                      onClick={() => handleMoodChange(mood)}
                      className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase border transition-all duration-300 rounded-full ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-transparent text-secondary border-[#eae6df] hover:border-black hover:text-primary"
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Filter */}
            {!brand && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">Brands</h4>
                {isBrandsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    <div className="shimmer h-6 w-16 rounded-full" />
                    <div className="shimmer h-6 w-20 rounded-full" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brands?.map((b) => {
                      const isSelected = selectedBrands.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleBrandChange(b.id)}
                          className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase border transition-all duration-300 rounded-full ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : "bg-transparent text-secondary border-[#eae6df] hover:border-black hover:text-primary"
                          }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Category Filter */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">Categories</h4>
              {isCategoriesLoading ? (
                <div className="flex flex-wrap gap-2">
                  <div className="shimmer h-6 w-16 rounded-full" />
                  <div className="shimmer h-6 w-20 rounded-full" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase border transition-all duration-300 rounded-full ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-transparent text-secondary border-[#eae6df] hover:border-black hover:text-primary"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">Max Price</h4>
                <span className="text-sm font-semibold">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="0"
                max={highestPriceLimit}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-black cursor-pointer bg-neutral-200 h-1 rounded-full"
              />
            </div>
          </aside>

          {/* Catalog grid area */}
          <div className="space-y-8">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 border border-rule rounded-sm shadow-sm text-primary">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                <input
                  type="text"
                  placeholder="Search drape, fabrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-rule rounded-sm text-xs outline-none bg-transparent focus:border-black transition-colors text-primary"
                />
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                {/* Grid Layout Toggle */}
                <div className="flex items-center border border-rule rounded-sm overflow-hidden">
                  <button
                    onClick={() => setIsEditorialLayout(true)}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      isEditorialLayout
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800 text-secondary"
                    }`}
                  >
                    Editorial Canvas
                  </button>
                  <button
                    onClick={() => setIsEditorialLayout(false)}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors border-l border-rule ${
                      !isEditorialLayout
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800 text-secondary"
                    }`}
                  >
                    Standard Grid
                  </button>
                </div>

                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 border border-rule px-4 py-2 rounded-sm text-xs hover:bg-surface-bright transition-colors"
                >
                  <SlidersHorizontal size={12} /> Filters
                </button>
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={12} className="text-secondary" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-rule px-3 py-2 rounded-sm text-xs bg-transparent outline-none focus:border-black cursor-pointer text-secondary"
                  >
                    <option value="default">Default Sort</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Curated For You editorial banner — shown when no filters are active */}
            {!isProductsLoading && !searchQuery && selectedBrands.length === 0 && selectedCategories.length === 0 && selectedMoods.length === 0 && sortedProducts.length > 0 && (
              <div className="mb-10 border border-rule bg-white p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-secondary">Curated For You</span>
                  <p className="heading-serif text-xl font-light text-primary max-w-xs">
                    Today's Edit — handpicked from across the catalog.
                  </p>
                  <p className="text-[11px] font-light text-secondary">
                    {sortedProducts.length} pieces across {categories?.length || 0} categories
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-secondary" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-secondary">AI Styled</span>
                </div>
              </div>
            )}

            {/* Asymmetric lookbook list */}
            {isProductsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} aspectRatio="3/4" />
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-24 bg-white border border-rule rounded-sm space-y-4">
                <p className="text-secondary text-sm font-light uppercase tracking-widest">No products match selection.</p>
                <button onClick={clearAllFilters} className="btn-black py-2.5 px-6 text-xs uppercase tracking-widest">Clear Filters</button>
              </div>
            ) : (
              <div className={isEditorialLayout ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-16 pt-4" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-4"}>
                {sortedProducts.map((product, idx) => {
                  // Stagger items to break straight grid lines when in editorial mode
                  const staggerClass = isEditorialLayout
                    ? (idx % 3 === 1 ? "editorial-grid-item-stagger" : idx % 3 === 2 ? "editorial-grid-item-stagger-neg" : "")
                    : "";

                  // Inject visual editorial quotes in middle of lookbook catalog (only in editorial layout)
                  if (isEditorialLayout && idx === 2) {
                    return (
                      <div key="quote-card" className="flex flex-col justify-center bg-neutral-900 text-white p-8 aspect-[3/4] rounded-sm shadow-sm space-y-4">
                        <span className="text-[8px] font-bold tracking-[0.25em] text-white/50 uppercase">Atelier Note</span>
                        <p className="heading-serif text-xl italic font-light leading-relaxed">
                          "Fashions fade, style is eternal."
                        </p>
                        <p className="text-[9px] uppercase tracking-widest text-white/40">— Yves Saint Laurent</p>
                      </div>
                    );
                  }

                  return (
                    <div key={product.id} className={`${staggerClass} transition-transform duration-500`}>
                      <ProductCard product={product} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filter Sidebar */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-80 bg-white h-full p-6 overflow-y-auto space-y-8 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-rule pb-4 mb-6">
                <h3 className="text-xs font-bold tracking-widest uppercase">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-secondary hover:text-black">
                  <X size={18} />
                </button>
              </div>

              {/* Mood list */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">Moods</h4>
                <div className="flex flex-wrap gap-2">
                  {["Minimalist Core", "Evening Elegance", "Streetwear", "Avant-Garde"].map((mood) => {
                    const isSelected = selectedMoods.includes(mood);
                    return (
                      <button
                        key={mood}
                        onClick={() => handleMoodChange(mood)}
                        className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase border transition-all duration-300 rounded-full ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-transparent text-secondary border-[#eae6df] hover:border-black hover:text-primary"
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brands list */}
              {!brand && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-xs font-bold tracking-wider uppercase text-secondary">Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {brands?.map((b) => {
                      const isSelected = selectedBrands.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleBrandChange(b.id)}
                          className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase border transition-all duration-300 rounded-full ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : "bg-transparent text-secondary border-[#eae6df] hover:border-black hover:text-primary"
                          }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full btn-black py-3 text-xs font-bold tracking-widest uppercase"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
