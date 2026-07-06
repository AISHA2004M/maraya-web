import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useLanguageStore } from "../store/useLanguageStore";
import { Camera, ArrowLeft, Sparkles, Sliders, RefreshCw, Upload } from "lucide-react";

export default function SearchByImage() {
  const { t, language } = useLanguageStore();
  const navigate = useNavigate();
  const { brand_slug } = useParams();

  // ── State ────────────────────────────────────────────────────────────────
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [scanningText, setScanningText] = useState("");
  const [results, setResults]           = useState([]);
  const [hasSearched, setHasSearched]   = useState(false);
  const [filtersOpen, setFiltersOpen]   = useState(false); // mobile filter toggle

  // Filters
  const [brands, setBrands]                   = useState([]);
  const [categories, setCategories]           = useState([]);
  const [selectedBrand, setSelectedBrand]     = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedColor, setSelectedColor]     = useState("");
  const [priceRange, setPriceRange]           = useState(300);

  // ── Scanning text carousel ───────────────────────────────────────────────
  const scanningTexts = [
    language === "ar" ? "تحليل بكسلات الصورة..." : "Analysing image pixels…",
    language === "ar" ? "تحديد نوع القطعة وقصتها..." : "Identifying garment type…",
    language === "ar" ? "استخراج البصمة اللونية والملمس..." : "Extracting colour & texture…",
    language === "ar" ? "مطابقة المتجهات مع قاعدة الماركات..." : "Matching vectors against catalog…",
    language === "ar" ? "ترتيب النتائج وحساب نسبة التطابق..." : "Ranking closest matches…",
  ];

  useEffect(() => {
    api.get("/products/brands/all").then(r => setBrands(r.data)).catch(() => {});
    api.get("/products/categories/all").then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let iv;
    if (loading) {
      let i = 0;
      setScanningText(scanningTexts[0]);
      iv = setInterval(() => {
        i = (i + 1) % scanningTexts.length;
        setScanningText(scanningTexts[i]);
      }, 2400);
    }
    return () => clearInterval(iv);
  }, [loading, language]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const pickFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResults([]);
    setHasSearched(false);
  };

  const handleImageChange = (e) => pickFile(e.target.files[0]);
  const handleDragOver    = (e) => e.preventDefault();
  const handleDrop        = (e) => { e.preventDefault(); pickFile(e.dataTransfer.files[0]); };

  const executeVisualSearch = async () => {
    if (!imageFile) return;
    setLoading(true);
    setHasSearched(false);
    const fd = new FormData();
    fd.append("file", imageFile);
    try {
      const res = await api.post("/products/search-by-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(res.data);
      setHasSearched(true);
    } catch (e) {
      console.error("Visual search failed", e);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setImageFile(null);
    setImagePreview(null);
    setResults([]);
    setHasSearched(false);
    setSelectedBrand("");
    setSelectedCategory("");
    setSelectedColor("");
    setPriceRange(300);
    setFiltersOpen(false);
  };

  // ── Client-side filter ───────────────────────────────────────────────────
  const filteredResults = results.filter((p) => {
    if (selectedBrand    && p.brand_id    !== parseInt(selectedBrand))    return false;
    if (selectedCategory && p.category_id !== parseInt(selectedCategory)) return false;
    if (selectedColor) {
      const c = (p.color || "").toLowerCase();
      if (!c.includes(selectedColor.toLowerCase())) return false;
    }
    if (parseFloat(p.price) > priceRange) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedBrand(""); setSelectedCategory("");
    setSelectedColor(""); setPriceRange(300);
  };
  const hasActiveFilters = selectedBrand || selectedCategory || selectedColor || priceRange !== 300;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 flex flex-col gap-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="border-b border-[#eae6df] pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] text-[#8e8577] hover:text-black transition-colors mb-4 uppercase tracking-widest font-semibold"
          >
            <ArrowLeft size={12} />
            {language === "ar" ? "العودة" : "Back"}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-bold tracking-[0.3em] text-[#a89f91] uppercase mb-1">
                AI Feature · بحث ذكي
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black tracking-tight">
                {language === "ar" ? "ابحث بالصورة" : "Search by Image"}
              </h1>
              <p className="text-[#5c564c] text-xs sm:text-sm font-light leading-relaxed mt-1 max-w-lg">
                {language === "ar"
                  ? "ارفع صورة أي قطعة وسيجد الذكاء الاصطناعي أشبه المنتجات بدقة عالية."
                  : "Upload any garment photo — AI finds the closest visual matches across all brands."}
              </p>
            </div>
            {hasSearched && (
              <button
                onClick={resetSearch}
                className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-[#8e8577] hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5 self-start sm:self-auto"
              >
                <RefreshCw size={11} />
                {language === "ar" ? "بحث جديد" : "New Search"}
              </button>
            )}
          </div>
        </div>

        {/* ── Upload Hero (initial state) ──────────────────────────────── */}
        {!imagePreview && !loading && !hasSearched && (
          <div className="flex-grow flex items-center justify-center py-8">
            <div
              className="w-full max-w-md border border-[#eae6df] bg-white p-8 sm:p-12 text-center space-y-6 cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload-input").click()}
            >
              <div className="w-14 h-14 rounded-full bg-[#f7f6f4] border border-[#eae6df] flex items-center justify-center mx-auto">
                <Camera size={22} className="text-[#8e8577]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-light text-black">
                  {language === "ar" ? "ارفع صورة قطعة ملابس" : "Upload a Garment Photo"}
                </h2>
                <p className="text-[#8e8577] text-xs leading-relaxed font-light">
                  {language === "ar"
                    ? "اسحب وأفلت أو اضغط للاختيار من جهازك. يدعم JPG, PNG, WebP."
                    : "Drag & drop or tap to browse. Supports JPG, PNG, WebP."}
                </p>
              </div>

              {/* Drop area */}
              <div className="border-2 border-dashed border-[#d9d4cc] hover:border-black rounded-none py-8 px-4 transition-colors">
                <Upload size={20} className="mx-auto text-[#c8c0b4] mb-2" />
                <span className="text-[10px] text-[#a89f91] tracking-widest font-semibold uppercase">
                  {language === "ar" ? "اسحب هنا أو اضغط للاختيار" : "Drop here · or click to browse"}
                </span>
              </div>

              <input
                id="file-upload-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* ── Workspace (after image selected) ────────────────────────── */}
        {(imagePreview || loading || hasSearched) && (
          <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10 items-start">

            {/* Left column: image + search btn (sticky on desktop) */}
            <div className="w-full lg:sticky lg:top-24 space-y-3">
              {/* Image preview box */}
              <div
                className="relative w-full bg-[#f7f6f4] border border-[#eae6df] overflow-hidden"
                style={{ aspectRatio: "4/5" }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview && (
                  <>
                    <img
                      src={imagePreview}
                      alt="Query"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Scanner overlay */}
                    {loading && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 px-4 text-center">
                        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent animate-[scan_2s_linear_infinite]" />
                        <div className="w-9 h-9 border-2 border-[#eae6df] border-t-black rounded-full animate-spin" />
                        <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-black">Scanning…</p>
                        <p className="text-[10px] text-[#5c564c] font-light leading-relaxed max-w-[160px]">
                          {scanningText}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* File name */}
              {imageFile && (
                <p className="text-[9px] text-[#a89f91] truncate text-center">{imageFile.name}</p>
              )}

              {/* Change image link */}
              <button
                onClick={() => document.getElementById("file-upload-input-2").click()}
                className="w-full text-[9px] text-[#8e8577] hover:text-black tracking-widest uppercase transition-colors border border-[#eae6df] hover:border-black py-2"
              >
                {language === "ar" ? "تغيير الصورة" : "Change Image"}
              </button>
              <input id="file-upload-input-2" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

              {/* Run search button */}
              {imageFile && !loading && !hasSearched && (
                <button
                  onClick={executeVisualSearch}
                  className="w-full bg-black text-white text-[9px] font-bold tracking-[0.25em] uppercase py-4 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} />
                  {language === "ar" ? "بدء البحث البصري" : "Run Visual Search"}
                </button>
              )}
            </div>

            {/* Right column: filters + results */}
            <div className="w-full space-y-5 min-w-0">

              {/* ── Mobile filter toggle ── */}
              {hasSearched && (
                <button
                  onClick={() => setFiltersOpen(v => !v)}
                  className="lg:hidden w-full flex items-center justify-between border border-[#eae6df] px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase text-[#5c564c]">
                    <Sliders size={12} />
                    {language === "ar" ? "تصفية النتائج" : "Filter Results"}
                  </span>
                  <span className="text-[9px] text-[#a89f91]">{filtersOpen ? "▲" : "▼"}</span>
                </button>
              )}

              {/* ── Filters panel ── */}
              {hasSearched && (
                <div className={`border border-[#eae6df] bg-white p-4 sm:p-5 space-y-4 ${filtersOpen ? "block" : "hidden lg:block"}`}>
                  <div className="flex items-center justify-between border-b border-[#eae6df] pb-3">
                    <span className="hidden lg:flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase text-[#5c564c]">
                      <Sliders size={12} />
                      {language === "ar" ? "تصفية النتائج" : "Filter Results"}
                    </span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-[8.5px] text-red-500 hover:underline uppercase tracking-wider font-bold ml-auto"
                      >
                        {language === "ar" ? "مسح الفلاتر" : "Clear All"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {/* Brand */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold tracking-widest text-[#a89f91] uppercase block">
                        {language === "ar" ? "الماركة" : "Brand"}
                      </label>
                      <select
                        value={selectedBrand}
                        onChange={e => setSelectedBrand(e.target.value)}
                        className="w-full bg-white border border-[#eae6df] px-2 py-2 text-[11px] text-black focus:border-black outline-none"
                      >
                        <option value="">{language === "ar" ? "الكل" : "All"}</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold tracking-widest text-[#a89f91] uppercase block">
                        {language === "ar" ? "القسم" : "Category"}
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full bg-white border border-[#eae6df] px-2 py-2 text-[11px] text-black focus:border-black outline-none"
                      >
                        <option value="">{language === "ar" ? "الكل" : "All"}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {/* Color */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold tracking-widest text-[#a89f91] uppercase block">
                        {language === "ar" ? "اللون" : "Colour"}
                      </label>
                      <input
                        type="text"
                        value={selectedColor}
                        onChange={e => setSelectedColor(e.target.value)}
                        placeholder={language === "ar" ? "أسود، أبيض..." : "Black, White…"}
                        className="w-full bg-white border border-[#eae6df] px-2 py-2 text-[11px] text-black focus:border-black outline-none"
                      />
                    </div>
                    {/* Price */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[8px] font-bold tracking-widest text-[#a89f91] uppercase">
                        <span>{language === "ar" ? "السعر" : "Price"}</span>
                        <span>≤ {priceRange} USD</span>
                      </div>
                      <input
                        type="range" min="10" max="500" step="5"
                        value={priceRange}
                        onChange={e => setPriceRange(parseInt(e.target.value))}
                        className="w-full accent-black h-1 appearance-none bg-[#eae6df] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Results area ── */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-10 h-10 border-2 border-[#eae6df] border-t-black rounded-full animate-spin" />
                  <p className="text-[9px] text-[#a89f91] tracking-widest uppercase">
                    {language === "ar" ? "جاري المطابقة البصرية..." : "AI visual matching in progress…"}
                  </p>
                </div>

              ) : hasSearched && filteredResults.length === 0 ? (
                /* No results */
                <div className="border border-[#eae6df] bg-white py-16 px-6 text-center flex flex-col items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-[#f7f6f4] border border-[#eae6df] flex items-center justify-center">
                    <Camera size={22} className="text-[#c8c0b4]" />
                  </div>
                  <div className="space-y-2 max-w-xs">
                    <p className="text-sm font-semibold text-black">
                      {language === "ar" ? "لا توجد نتائج مشابهة" : "No similar items found"}
                    </p>
                    <p className="text-xs text-[#8e8577] leading-relaxed font-light">
                      {language === "ar"
                        ? "لم يجد الذكاء الاصطناعي قطعة مشابهة بنسبة 75% أو أعلى في قاعدة بيانات الماركات."
                        : "The AI found no items with 75%+ visual similarity across all available brands."}
                    </p>
                  </div>
                  <button
                    onClick={resetSearch}
                    className="inline-flex items-center gap-2 border border-[#eae6df] hover:border-black text-[9px] font-bold tracking-widest uppercase px-8 py-3 transition-colors"
                  >
                    <RefreshCw size={11} />
                    {language === "ar" ? "جرّب صورة أخرى" : "Try Another Image"}
                  </button>
                </div>

              ) : hasSearched ? (
                /* Results grid */
                <div className="space-y-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#a89f91]">
                    {language === "ar"
                      ? `${filteredResults.length} قطعة مشابهة`
                      : `${filteredResults.length} similar item${filteredResults.length !== 1 ? "s" : ""} found`}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {filteredResults.map((product, idx) => {
                      const matchPct  = Math.round(product.similarity_score * 100);
                      const brandPath = product.brand ? `/brands/${product.brand.slug}` : "";
                      const productUrl = product.brand
                        ? `/brands/${product.brand.slug}/product/${product.id}`
                        : `/product/${product.id}`;

                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.035 }}
                          className="bg-white border border-[#eae6df] group flex flex-col hover:shadow-md transition-shadow duration-300"
                        >
                          {/* Product image */}
                          <Link
                            to={productUrl}
                            className="block relative overflow-hidden bg-[#f7f6f4]"
                            style={{ aspectRatio: "3/4" }}
                          >
                            <img
                              src={product.main_image_url}
                              alt={product.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </Link>

                          {/* Card details */}
                          <div className="p-3 sm:p-4 flex flex-col gap-2 flex-grow">
                            {/* Brand */}
                            {product.brand ? (
                              <Link
                                to={brandPath}
                                className="inline-flex w-fit items-center px-2 py-0.5 bg-[#f7f6f4] border border-[#eae6df] hover:border-black transition-colors"
                              >
                                <span className="text-[7.5px] sm:text-[8px] font-bold tracking-[0.18em] text-black uppercase">
                                  {product.brand.name}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-[8px] text-[#a89f91]">—</span>
                            )}

                            {/* Name */}
                            <h3 className="text-[11px] sm:text-xs font-semibold text-black line-clamp-1 leading-snug">
                              <Link to={productUrl} className="hover:underline">{product.name}</Link>
                            </h3>

                            {/* Match bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[7.5px] text-[#a89f91] uppercase tracking-widest font-semibold">
                                  {language === "ar" ? "تطابق" : "Match"}
                                </span>
                                <span className="text-[10px] font-bold text-black tabular-nums">{matchPct}%</span>
                              </div>
                              <div className="h-[2px] bg-[#eae6df] w-full overflow-hidden">
                                <div
                                  className="h-full bg-black"
                                  style={{ width: `${matchPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Price + view */}
                            <div className="mt-auto pt-2 border-t border-[#eae6df] flex items-center justify-between">
                              <span className="text-[11px] sm:text-xs font-bold text-black">
                                {product.price} {product.currency || "USD"}
                              </span>
                              <Link
                                to={productUrl}
                                className="text-[7.5px] sm:text-[8px] font-bold tracking-widest text-[#8e8577] hover:text-black uppercase transition-colors"
                              >
                                {language === "ar" ? "عرض" : "View"} →
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

              ) : (
                /* Idle right panel (image selected, not searched yet) */
                <div className="border border-[#eae6df] bg-[#f7f6f4] py-16 px-6 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
                  <Sparkles size={24} className="text-[#c8c0b4]" />
                  <p className="text-xs text-[#8e8577] font-light max-w-xs">
                    {language === "ar"
                      ? "اضغط على زر البحث في الأسفل لبدء المطابقة البصرية بالذكاء الاصطناعي"
                      : "Press 'Run Visual Search' to start AI matching"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%   { top: 0%;   }
          50%  { top: 100%; }
          100% { top: 0%;   }
        }
      ` }} />
    </div>
  );
}
