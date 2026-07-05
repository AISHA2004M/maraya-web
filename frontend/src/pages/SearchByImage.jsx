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
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950 text-primary flex flex-col transition-colors duration-500">
      <Navbar />

      <main className="flex-grow max-w-[1600px] mx-auto px-6 md:px-12 py-12 w-full flex flex-col">
        {/* Header */}
        <div className="mb-10 fade-up">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs text-secondary hover:text-primary transition-colors mb-6 uppercase tracking-widest font-semibold"
          >
            <ArrowLeft size={14} /> {language === "ar" ? "العودة" : "Back"}
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="heading-serif text-4xl md:text-5xl text-primary mb-3">
                {t("visual_search_title")}
              </h1>
              <p className="text-secondary text-sm max-w-2xl font-light leading-relaxed">
                {t("visual_search_desc")}
              </p>
            </div>
            {hasSearched && (
              <button
                onClick={resetSearch}
                className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-secondary hover:text-black dark:hover:text-white transition-colors py-2 border-b border-transparent hover:border-black dark:hover:border-white align-self-start md:align-self-auto"
              >
                <RefreshCw size={12} /> {language === "ar" ? "بدء بحث جديد" : "New Search"}
              </button>
            )}
          </div>
        </div>

        {/* Search Hub */}
        {!imagePreview && !loading && !hasSearched ? (
          <div className="max-w-2xl w-full mx-auto bg-white dark:bg-neutral-900 border border-rule p-8 md:p-12 text-center space-y-8 fade-up my-auto shadow-sm">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mx-auto border border-rule">
                <Camera size={24} className="text-secondary" />
              </div>
              <h2 className="heading-serif text-2xl text-primary">{t("drag_drop_search")}</h2>
              <p className="text-secondary text-xs max-w-md mx-auto leading-relaxed">
                {language === "ar" ? "اسحب وأفلت أي صورة لقطعة ملابس هنا أو تصفح ملفاتك، وسنقوم بالبحث عن قطع مشابهة أو مطابقة لها بالذكاء الاصطناعي في ثوانٍ." : "Drag and drop any garment image here or browse your files. We will search for identical or visually similar pieces using AI."}
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-neutral-300 hover:border-black dark:hover:border-white rounded-sm p-12 transition-colors cursor-pointer relative"
              onClick={() => document.getElementById("file-upload-input").click()}
            >
              <span className="text-xs text-secondary tracking-widest font-semibold uppercase">
                {language === "ar" ? "اسحب الصورة هنا أو اضغط للاختيار" : "Drop image here or click to browse"}
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
          <div className="grid lg:grid-cols-[1fr_3.5fr] gap-10 items-start">
            
            {/* Left Column: Upload hub / Query preview */}
            <div className="space-y-6 lg:sticky top-28">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative border border-rule rounded-sm bg-white dark:bg-neutral-900 transition-all duration-300 p-2 flex flex-col items-center justify-center text-center min-h-[350px] overflow-hidden shadow-sm"
              >
                {imagePreview && (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/5">
                    <img
                      src={imagePreview}
                      alt="Query Image"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Premium Scanner Animation */}
                    {loading && (
                      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-white text-center">
                        {/* Floating scanner line */}
                        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-[scan_2s_linear_infinite]" />
                        
                        <div className="z-10 space-y-4">
                          <div className="w-12 h-12 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin mx-auto" />
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400">Scanning Image</p>
                          <p className="text-xs font-light text-white/95 max-w-[200px] leading-relaxed transition-all duration-500 animate-pulse">
                            {scanningText}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {imageFile && !loading && !hasSearched && (
                <button
                  onClick={executeVisualSearch}
                  className="w-full btn-black py-4 px-6 text-[10px] font-bold tracking-widest uppercase rounded-none flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  {language === "ar" ? "بدء البحث البصري" : "Run Visual Search"}
                </button>
              )}
            </div>

            {/* Right Column: Filters and Results Grid */}
            <div className="space-y-8">
              
              {/* Filters Sidebar/Bar */}
              {hasSearched && (
                <div className="bg-white dark:bg-neutral-900 border border-rule p-5 rounded-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-rule pb-2.5">
                    <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary">
                      <Sliders size={13} /> {language === "ar" ? "تصفية النتائج" : "Filter Results"}
                    </span>
                    {(selectedBrand || selectedCategory || selectedColor || priceRange !== 150) && (
                      <button
                        onClick={() => {
                          setSelectedBrand("");
                          setSelectedCategory("");
                          setSelectedColor("");
                          setPriceRange(150);
                        }}
                        className="text-[9.5px] text-red-500 hover:underline uppercase tracking-wider font-bold"
                      >
                        {t("clear_filters")}
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Brand select */}
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold tracking-widest text-secondary uppercase block">
                        {t("filter_brand")}
                      </label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full bg-transparent border border-rule px-3 py-2 text-xs text-primary focus:border-black outline-none rounded-none"
                      >
                        <option value="">{language === "ar" ? "جميع الماركات" : "All Brands"}</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category select */}
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold tracking-widest text-secondary uppercase block">
                        {t("filter_category")}
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-transparent border border-rule px-3 py-2 text-xs text-primary focus:border-black outline-none rounded-none"
                      >
                        <option value="">{language === "ar" ? "جميع الأقسام" : "All Categories"}</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Color input */}
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold tracking-widest text-secondary uppercase block">
                        {t("filter_color")}
                      </label>
                      <input
                        type="text"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        placeholder={language === "ar" ? "مثال: أحمر، أسود" : "e.g. Red, Black"}
                        className="w-full bg-transparent border border-rule px-3 py-2 text-xs text-primary focus:border-black outline-none rounded-none"
                      />
                    </div>

                    {/* Price budget */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[8.5px] font-bold tracking-widest text-secondary uppercase">
                        <span>{t("filter_price")}</span>
                        <span>{priceRange} USD</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={priceRange}
                        onChange={(e) => setPriceRange(parseInt(e.target.value))}
                        className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Results Grid */}
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-neutral-200 border-t-black dark:border-t-white rounded-full animate-spin" />
                    <p className="text-xs text-secondary tracking-widest uppercase font-light">
                      {language === "ar" ? "جاري مطابقة المتجهات اللونية والبصرية بالذكاء الاصطناعي..." : "AI Vector search matching in progress..."}
                    </p>
                  </div>
                ) : hasSearched ? (
                  filteredResults.length === 0 ? (
                    <div className="border border-rule bg-white dark:bg-neutral-900 p-16 text-center space-y-4 flex flex-col items-center justify-center">
                      <Camera size={32} className="opacity-25" />
                      <p className="text-xs text-secondary tracking-wide max-w-sm">
                        {t("no_visual_results")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                        {language === "ar" ? `تم العثور على ${filteredResults.length} قطعة مشابهة` : `Found ${filteredResults.length} similar items`}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {filteredResults.map((product) => {
                          const matchPct = Math.round(product.similarity_score * 100);
                          const brandPath = product.brand ? `/brands/${product.brand.slug}` : "";
                          const productUrl = product.brand ? `/brands/${product.brand.slug}/product/${product.id}` : `/product/${product.id}`;

                          return (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white dark:bg-neutral-900 border border-rule group relative flex flex-col h-full hover:shadow-lg transition-all duration-300"
                            >
                              {/* Similarity Score Badge */}
                              <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-sm z-20">
                                {matchPct}% {language === "ar" ? "تطابق" : "Match"}
                              </div>

                              {/* Image container */}
                              <Link to={productUrl} className="block overflow-hidden relative aspect-[3/4] bg-neutral-50 dark:bg-neutral-800">
                                <img
                                  src={product.main_image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </Link>

                              {/* Details */}
                              <div className="p-4 flex flex-col flex-grow">
                                <div className="flex-grow space-y-1">
                                  {product.brand && (
                                    <Link
                                      to={brandPath}
                                      className="text-[8.5px] font-bold tracking-widest text-secondary uppercase hover:underline"
                                    >
                                      {product.brand.name}
                                    </Link>
                                  )}
                                  <h3 className="text-xs font-semibold text-primary line-clamp-1">
                                    <Link to={productUrl} className="hover:underline">
                                      {product.name}
                                    </Link>
                                  </h3>
                                </div>

                                <div className="mt-3 pt-3 border-t border-rule flex items-center justify-between">
                                  <span className="text-xs font-bold text-primary">
                                    {product.price} {product.currency || "USD"}
                                  </span>
                                  <Link
                                    to={productUrl}
                                    className="text-[8.5px] font-bold tracking-widest text-secondary group-hover:text-black dark:group-hover:text-white uppercase transition-colors"
                                  >
                                    {language === "ar" ? "عرض القطعة" : "View Piece"} &rarr;
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
                  <div className="border border-rule bg-white dark:bg-neutral-900 p-16 text-center space-y-4 flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Sparkles size={32} className="opacity-25" />
                    <p className="text-xs text-secondary tracking-wide max-w-sm">
                      {language === "ar" ? "ارفع صورة بالعمود الأيسر لبدء مقارنة الذكاء الاصطناعي" : "Upload an image in the left panel to begin AI matching"}
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      <Footer />

      {/* Embedded Scan Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
    </div>
  );
}
