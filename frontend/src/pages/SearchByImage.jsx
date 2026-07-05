import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useLanguageStore } from "../store/useLanguageStore";
import { Camera, ArrowLeft, Sparkles, Filter, X, Sliders, RefreshCw } from "lucide-react";

export default function SearchByImage() {
  const { t, language } = useLanguageStore();
  const navigate = useNavigate();
  const { brand_slug } = useParams();

  // State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanningText, setScanningText] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters state
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [priceRange, setPriceRange] = useState(150); // Max budget limit

  // Scan texts carousel
  const scanningTexts = [
    language === "ar" ? "تحليل بكسلات الصورة وزواياها..." : "Analyzing image pixels & contours...",
    language === "ar" ? "تحديد نوع قطعة الملابس وقصتها..." : "Identifying garment type & structure...",
    language === "ar" ? "استخراج البصمة اللونية والملمس..." : "Extracting color palette & texture...",
    language === "ar" ? "مطابقة المتجهات مع قاعدة بيانات الماركات..." : "Matching vector embeddings against brands catalog...",
    language === "ar" ? "ترتيب النتائج وحساب نسبة التطابق..." : "Ranking closest matches..."
  ];

  // Fetch filter metadata on mount
  useEffect(() => {
    api.get("/products/brands/all")
      .then((res) => setBrands(res.data))
      .catch((err) => console.error("Failed to load brands", err));

    api.get("/products/categories/all")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  // Update scanning text while loading
  useEffect(() => {
    let interval;
    if (loading) {
      let idx = 0;
      setScanningText(scanningTexts[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % scanningTexts.length;
        setScanningText(scanningTexts[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading, language]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResults([]);
      setHasSearched(false);
    }
  };

  const executeVisualSearch = async () => {
    if (!imageFile) return;

    setLoading(true);
    setHasSearched(false);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await api.post("/products/search-by-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(response.data);
      setHasSearched(true);
    } catch (err) {
      console.error("Visual search request failed", err);
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
    setPriceRange(150);
  };

  // Local filter applications
  const filteredResults = results.filter((product) => {
    if (selectedBrand && product.brand_id !== parseInt(selectedBrand)) return false;
    if (selectedCategory && product.category_id !== parseInt(selectedCategory)) return false;
    if (selectedColor) {
      const pColor = (product.color || "").toLowerCase();
      const sColor = selectedColor.toLowerCase();
      if (!pColor.includes(sColor)) return false;
    }
    if (priceRange && parseFloat(product.price) > priceRange) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1500px] mx-auto px-6 md:px-12 py-12 w-full flex flex-col">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] text-[#8e8577] hover:text-black transition-colors mb-6 uppercase tracking-widest font-semibold"
          >
            <ArrowLeft size={13} /> {language === "ar" ? "العودة" : "Back"}
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#eae6df] pb-6">
            <div>
              <p className="text-[8px] font-bold tracking-[0.3em] text-[#a89f91] uppercase mb-2">AI Feature · بحث ذكي</p>
              <h1 className="font-display text-4xl md:text-5xl font-light text-black tracking-tight">
                {t("visual_search_title")}
              </h1>
              <p className="text-[#5c564c] text-sm max-w-xl font-light leading-relaxed mt-2">
                {t("visual_search_desc")}
              </p>
            </div>
            {hasSearched && (
              <button
                onClick={resetSearch}
                className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-[#8e8577] hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5"
              >
                <RefreshCw size={11} /> {language === "ar" ? "بحث جديد" : "New Search"}
              </button>
            )}
          </div>
        </div>

        {/* Search Hub */}
        {!imagePreview && !loading && !hasSearched ? (
          /* ── Centered upload hero ── */
          <div className="max-w-xl w-full mx-auto bg-white border border-[#eae6df] p-10 md:p-14 text-center space-y-8 my-auto">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#f7f6f4] flex items-center justify-center mx-auto border border-[#eae6df]">
                <Camera size={22} className="text-[#8e8577]" />
              </div>
              <h2 className="font-display text-2xl font-light text-black">{t("drag_drop_search")}</h2>
              <p className="text-[#5c564c] text-xs max-w-md mx-auto leading-relaxed font-light">
                {language === "ar"
                  ? "اسحب وأفلت صورة قطعة ملابس أو تصفح ملفاتك — سيبحث الذكاء الاصطناعي في جميع الماركات ويعرض أقرب المنتجات مع نسبة التطابق الدقيقة."
                  : "Drop a garment photo or browse your files — AI scans all brands and surfaces the closest matches with precision similarity scores."}
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#d9d4cc] hover:border-black rounded-none p-12 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-upload-input").click()}
            >
              <span className="text-[10px] text-[#a89f91] tracking-widest font-semibold uppercase">
                {language === "ar" ? "اسحب الصورة هنا أو اضغط للاختيار" : "Drop image here · or click to browse"}
              </span>
              <input
                id="file-upload-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          /* ── Two-column workspace ── */
          <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">

            {/* Left: image preview + search button */}
            <div className="space-y-4 lg:sticky top-28">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative border border-[#eae6df] bg-[#f7f6f4] overflow-hidden aspect-[4/5]"
              >
                {imagePreview && (
                  <div className="absolute inset-0">
                    <img src={imagePreview} alt="Query" className="w-full h-full object-cover" />

                    {loading && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent animate-[scan_2s_linear_infinite]" />
                        <div className="w-10 h-10 border-2 border-[#eae6df] border-t-black rounded-full animate-spin" />
                        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black">Scanning</p>
                        <p className="text-[10px] text-[#5c564c] font-light max-w-[180px] leading-relaxed">{scanningText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata under image */}
              {imageFile && (
                <p className="text-[9px] text-[#a89f91] tracking-wide truncate">{imageFile.name}</p>
              )}

              {imageFile && !loading && !hasSearched && (
                <button
                  onClick={executeVisualSearch}
                  className="w-full bg-black text-white text-[9px] font-bold tracking-[0.25em] uppercase py-4 px-6 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} />
                  {language === "ar" ? "بدء البحث البصري" : "Run Visual Search"}
                </button>
              )}
            </div>

            {/* Right: filters + results */}
            <div className="space-y-6">

              {/* Filters bar */}
              {hasSearched && (
                <div className="border border-[#eae6df] bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#eae6df] pb-3">
                    <span className="flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase text-[#5c564c]">
                      <Sliders size={12} /> {language === "ar" ? "تصفية النتائج" : "Filter Results"}
                    </span>
                    {(selectedBrand || selectedCategory || selectedColor || priceRange !== 150) && (
                      <button
                        onClick={() => { setSelectedBrand(""); setSelectedCategory(""); setSelectedColor(""); setPriceRange(150); }}
                        className="text-[8.5px] text-red-500 hover:underline uppercase tracking-wider font-bold"
                      >
                        {t("clear_filters")}
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold tracking-widest text-[#a89f91] uppercase block">{t("filter_brand")}</label>
                      <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full bg-white border border-[#eae6df] px-3 py-2 text-xs text-black focus:border-black outline-none">
                        <option value="">{language === "ar" ? "جميع الماركات" : "All Brands"}</option>
                        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold tracking-widest text-[#a89f91] uppercase block">{t("filter_category")}</label>
                      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-white border border-[#eae6df] px-3 py-2 text-xs text-black focus:border-black outline-none">
                        <option value="">{language === "ar" ? "جميع الأقسام" : "All Categories"}</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold tracking-widest text-[#a89f91] uppercase block">{t("filter_color")}</label>
                      <input type="text" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}
                        placeholder={language === "ar" ? "أحمر، أسود..." : "Red, Black..."}
                        className="w-full bg-white border border-[#eae6df] px-3 py-2 text-xs text-black focus:border-black outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[8px] font-bold tracking-widest text-[#a89f91] uppercase">
                        <span>{t("filter_price")}</span>
                        <span>{priceRange} USD</span>
                      </div>
                      <input type="range" min="10" max="300" step="5" value={priceRange}
                        onChange={(e) => setPriceRange(parseInt(e.target.value))}
                        className="w-full accent-black cursor-pointer h-1 appearance-none bg-[#eae6df]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Results grid */}
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="w-10 h-10 border-2 border-[#eae6df] border-t-black rounded-full animate-spin" />
                    <p className="text-[9px] text-[#a89f91] tracking-widest uppercase font-light">
                      {language === "ar" ? "جاري المطابقة البصرية..." : "AI visual matching in progress..."}
                    </p>
                  </div>
                ) : hasSearched ? (
                  filteredResults.length === 0 ? (
                    <div className="border border-[#eae6df] bg-white p-16 text-center space-y-3 flex flex-col items-center">
                      <Camera size={28} className="text-[#c8c0b4]" />
                      <p className="text-xs text-[#8e8577] max-w-sm">{t("no_visual_results")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Count line */}
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#a89f91]">
                        {language === "ar" ? `${filteredResults.length} قطعة مشابهة` : `${filteredResults.length} similar items found`}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredResults.map((product, idx) => {
                          const matchPct = Math.round(product.similarity_score * 100);
                          const brandPath = product.brand ? `/brands/${product.brand.slug}` : "";
                          const productUrl = product.brand
                            ? `/brands/${product.brand.slug}/product/${product.id}`
                            : `/product/${product.id}`;

                          return (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="bg-white border border-[#eae6df] group flex flex-col hover:shadow-md transition-shadow duration-300"
                            >
                              {/* Image */}
                              <Link to={productUrl} className="block relative overflow-hidden aspect-[3/4] bg-[#f7f6f4]">
                                <img
                                  src={product.main_image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </Link>

                              {/* Card body */}
                              <div className="p-4 flex flex-col gap-3 flex-grow">
                                {/* Brand badge */}
                                <div className="flex items-center justify-between">
                                  {product.brand ? (
                                    <Link
                                      to={brandPath}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f7f6f4] border border-[#eae6df] hover:border-black transition-colors"
                                    >
                                      <span className="text-[8px] font-bold tracking-[0.2em] text-black uppercase">
                                        {product.brand.name}
                                      </span>
                                    </Link>
                                  ) : (
                                    <span className="text-[8px] text-[#a89f91] uppercase tracking-widest">—</span>
                                  )}
                                </div>

                                {/* Product name */}
                                <h3 className="text-xs font-semibold text-black line-clamp-1 leading-snug">
                                  <Link to={productUrl} className="hover:underline">{product.name}</Link>
                                </h3>

                                {/* Match precision bar */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-[#a89f91] uppercase tracking-widest font-semibold">
                                      {language === "ar" ? "تطابق" : "Match"}
                                    </span>
                                    <span className="text-[10px] font-bold text-black tabular-nums">{matchPct}%</span>
                                  </div>
                                  <div className="h-[2px] bg-[#eae6df] w-full overflow-hidden">
                                    <div className="h-full bg-black transition-all duration-700" style={{ width: `${matchPct}%` }} />
                                  </div>
                                </div>

                                {/* Footer row */}
                                <div className="mt-auto pt-2 border-t border-[#eae6df] flex items-center justify-between">
                                  <span className="text-xs font-bold text-black">
                                    {product.price} {product.currency || "USD"}
                                  </span>
                                  <Link to={productUrl} className="text-[8px] font-bold tracking-widest text-[#8e8577] hover:text-black uppercase transition-colors">
                                    {language === "ar" ? "عرض" : "View"} →
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="border border-[#eae6df] bg-[#f7f6f4] p-16 text-center space-y-3 flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Sparkles size={28} className="text-[#c8c0b4]" />
                    <p className="text-xs text-[#8e8577] max-w-sm font-light">
                      {language === "ar" ? "ارفع صورة لبدء البحث البصري" : "Upload an image to begin AI visual matching"}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%   { top: 0%; }
          50%  { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
    </div>
  );
}

