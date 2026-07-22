import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import UploadBox from "../components/tryon/UploadBox";
import { useProducts } from "../hooks/useProducts";
import api from "../api/client";
import { Sparkles, Loader2, AlertCircle, ArrowLeft, Trash2, History, User, Download } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { submitTryOn, waitForTryOnResult, getTryOnResult, pollTryOnStatus } from "../api/tryon";


const PRESET_MODELS = [
  {
    id: "female_slim",
    name: "عارضة ممشوقة (Slim)",
    gender: "female",
    size: "S / M",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500&h=750&auto=format&fit=crop",
  },
  {
    id: "female_medium",
    name: "عارضة قوام معتدل (Medium)",
    gender: "female",
    size: "M / L",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&h=750&auto=format&fit=crop",
  },
  {
    id: "female_plus",
    name: "عارضة قوام ممتلئ (Plus Size)",
    gender: "female",
    size: "XL / XXL",
    url: "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=500&h=750&auto=format&fit=crop",
  },
  {
    id: "male_slim",
    name: "عارض ممشوق (Slim)",
    gender: "male",
    size: "M",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&h=750&auto=format&fit=crop",
  },
  {
    id: "male_medium",
    name: "عارض قوام معتدل (Medium)",
    gender: "male",
    size: "L / XL",
    url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=500&h=750&auto=format&fit=crop",
  }
];


const urlToFile = async (url, filename) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/jpeg" });
};

export default function TryOn() {
  const { brand_slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const preloadedProduct = location.state;

  // Brand CMS details
  const [brand, setBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(true);

  // Products query to allow look building
  const { data: products } = useProducts();

  const { token, user } = useUserStore();
  const { t, language } = useLanguageStore();

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
          console.error("Failed to load brand metadata in TryOn", err);
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

  const brandProducts = products && brand ? products.filter((p) => p.brand_id === brand.id) : (products || []);

  // Multi-garment states
  const [selectedGarments, setSelectedGarments] = useState([]);
  const [collageItems, setCollageItems] = useState([]);

  // Keep selectedGarments in sync with collageItems
  useEffect(() => {
    if (products) {
      const gList = collageItems.map(item => products.find(p => p.id === item.id)).filter(Boolean);
      setSelectedGarments(gList);
    }
  }, [collageItems, products]);

  // Pre-populate if arriving from product details
  useEffect(() => {
    if (preloadedProduct && products) {
      const exists = collageItems.some(item => item.id === preloadedProduct.id);
      if (!exists) {
        setCollageItems([
          {
            id: preloadedProduct.id,
            name: preloadedProduct.name,
            imageUrl: preloadedProduct.main_image_url || preloadedProduct.image_url,
            brand: preloadedProduct.brand?.name,
            x: 80,
            y: 70,
            scale: 1
          }
        ]);
      }
    }
  }, [preloadedProduct, products]);

  // User portrait upload
  const [userFile, setUserFile] = useState(null);
  const [userImagePreview, setUserImagePreview] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [loadingPresetId, setLoadingPresetId] = useState(null);

  const handleSelectPreset = async (model) => {
    if (loading || jobStatus === "queued" || jobStatus === "processing") return;
    setLoadingPresetId(model.id);
    setError(null);
    try {
      const file = await urlToFile(model.url, `${model.id}.jpg`);
      setUserFile(file);
      setUserImagePreview(model.url);
      setSelectedPresetId(model.id);
      setResult(null); // Reset result on new upload/preset
    } catch (err) {
      console.error("Failed to load preset model image", err);
      setError("فشل تحميل صورة العارض الجاهزة. يرجى محاولة رفع صورتك بدلاً من ذلك.");
    } finally {
      setLoadingPresetId(null);
    }
  };

  // Body profile state
  const [avatar, setAvatar] = useState("Athletic M");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [bodyBust, setBodyBust] = useState(90);
  const [bodyWaist, setBodyWaist] = useState(75);
  const [bodyHips, setBodyHips] = useState(95);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-fill body measurements from user profile
  useEffect(() => {
    if (user) {
      if (user.height) setHeight(user.height);
      if (user.weight) setWeight(user.weight);
      if (user.body_bust) setBodyBust(user.body_bust);
      if (user.body_waist) setBodyWaist(user.body_waist);
      if (user.body_hips) setBodyHips(user.body_hips);
    }
  }, [user]);

  // Clear preset model selection if it becomes incompatible with selected garments gender
  useEffect(() => {
    if (selectedPresetId && selectedGarments.length > 0) {
      const currentPreset = PRESET_MODELS.find(m => m.id === selectedPresetId);
      if (currentPreset) {
        const hasWomen = selectedGarments.some(g => (g.gender || "").toLowerCase() === "women");
        const hasMen = selectedGarments.some(g => (g.gender || "").toLowerCase() === "men");
        
        if (hasWomen && !hasMen && currentPreset.gender !== "female") {
          setSelectedPresetId(null);
          setUserFile(null);
          setUserImagePreview(null);
        } else if (hasMen && !hasWomen && currentPreset.gender !== "male") {
          setSelectedPresetId(null);
          setUserFile(null);
          setUserImagePreview(null);
        }
      }
    }
  }, [selectedGarments, selectedPresetId]);

  // Try-on generation state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Async job polling state
  const [sessionId, setSessionId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // queued | processing | completed | failed
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState("Preparing your silhouette…");
  const [isDelayed, setIsDelayed] = useState(false);
  const [modelVariant, setModelVariant] = useState("balanced"); // fast | balanced | quality
  const pollingOptionsRef = useRef({ cancelled: false });
  const delayTimerRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingOptionsRef.current.cancelled = true;
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };
  }, []);

  // Fitting History (persistent in localStorage & cloud database)
  const [history, setHistory] = useState([]);

  // Filter preset models based on selected garments gender
  const filteredPresetModels = PRESET_MODELS.filter((model) => {
    if (selectedGarments.length === 0) return true;
    const hasWomen = selectedGarments.some((g) => (g.gender || "").toLowerCase() === "women");
    const hasMen = selectedGarments.some((g) => (g.gender || "").toLowerCase() === "men");
    if (hasWomen && !hasMen) return model.gender === "female";
    if (hasMen && !hasWomen) return model.gender === "male";
    return true;
  });

  // Helper to map list of garment IDs to product objects from products query
  const resolveGarments = (garmentsListStr, primaryProdId) => {
    if (!products) return [];
    let ids = [];
    if (garmentsListStr) {
      try {
        ids = JSON.parse(garmentsListStr);
      } catch (e) {
        console.error(e);
      }
    }
    if (ids.length === 0 && primaryProdId) {
      ids = [primaryProdId];
    }
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  };

  useEffect(() => {
    if (token && products) {
      // Fetch cloud try-on history
      api.get("/tryon/my-sessions")
        .then((res) => {
          setHistory(res.data);
        })
        .catch((e) => {
          console.error("Failed to load cloud history:", e);
        });
    } else if (!token) {
      // Guest: fall back to local storage
      const saved = localStorage.getItem("vrital_tryon_history");
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [token, products]);

  const saveToHistory = (newSessionOrUrl, garmentsUsed) => {
    if (token) {
      // If it's a cloud session object
      setHistory((prev) => [newSessionOrUrl, ...prev].slice(0, 10));
    } else {
      const entry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        resultUrl: newSessionOrUrl,
        garments: garmentsUsed,
        avatar,
        height,
        weight,
        bodyBust,
        bodyWaist,
        bodyHips,
      };
      const newHist = [entry, ...history].slice(0, 10);
      setHistory(newHist);
      localStorage.setItem("vrital_tryon_history", JSON.stringify(newHist));
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("vrital_tryon_history");
  };

  // Garment selection handlers
  const toggleGarment = (prod) => {
    setCollageItems((prev) => {
      const exists = prev.some((item) => item.id === prod.id);
      if (exists) {
        return prev.filter((item) => item.id !== prod.id);
      } else {
        return [
          ...prev,
          {
            id: prod.id,
            name: prod.name,
            imageUrl: prod.main_image_url || prod.image_url,
            brand: prod.brand?.name,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            scale: 1.0
          }
        ];
      }
    });
  };

  const handleUpdateCollageItem = (itemId, updates) => {
    setCollageItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveCollageItem = (itemId) => {
    setCollageItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Helper to get selected garments category type
  const getGarmentCategoryType = () => {
    if (!selectedGarments || selectedGarments.length === 0) return null;
    if (selectedGarments.length > 1) return "full"; // multi-garment outfit

    const g = selectedGarments[0];
    const cat = (g.category?.name || "").toLowerCase();
    const name = (g.name || "").toLowerCase();
    const desc = (g.description || "").toLowerCase();

    // Full Body keywords
    const fullBodyKeywords = ["dress", "gown", "jumpsuit", "romper", "two-piece", "set", "outfit", "suit", "co-ord", "tracksuit", "combo", "uniform", "robe"];
    // Lower Body keywords
    const lowerBodyKeywords = ["pant", "jean", "trouser", "short", "skirt", "legging", "bottom"];
    // Upper Body keywords
    const upperBodyKeywords = ["shirt", "t-shirt", "tee", "blouse", "sweater", "hoodie", "jacket", "coat", "top", "blazer", "cardigan", "pullover", "outerwear"];

    if (fullBodyKeywords.some(k => cat.includes(k) || name.includes(k) || desc.includes(k))) {
      return "full";
    }
    if (lowerBodyKeywords.some(k => cat.includes(k) || name.includes(k) || desc.includes(k))) {
      return "lower";
    }
    if (upperBodyKeywords.some(k => cat.includes(k) || name.includes(k) || desc.includes(k))) {
      return "upper";
    }

    if (cat.includes("bottom")) return "lower";
    if (cat.includes("top") || cat.includes("outer")) return "upper";

    return "upper";
  };

  const renderUserGuidance = () => {
    return null;
  };

  const handleGenerate = async () => {
    if (!userFile || selectedGarments.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSessionId(null);
    setJobStatus("queued");
    setPct(5);
    setLabel("Preparing your silhouette…");
    setIsDelayed(false);
    pollingOptionsRef.current = { cancelled: false };

    // 35-second delay warning
    delayTimerRef.current = setTimeout(() => {
      setIsDelayed(true);
    }, 35000);

    try {
      // Dispatch async try-on job — returns 202 immediately
      const extraPayload = {
        product_ids: selectedGarments.map((g) => g.id),
        avatar,
        height,
        weight,
        body_bust: bodyBust,
        body_waist: bodyWaist,
        body_hips: bodyHips,
      };
      const dispatch = await submitTryOn(userFile, selectedGarments[0]?.id, modelVariant, extraPayload);
      const jobId = dispatch.job_id || dispatch.session_id;
      setSessionId(jobId);
      setJobStatus(dispatch.status);

      if (dispatch.status === "completed" || dispatch.progress === 100) {
        clearTimeout(delayTimerRef.current);
        const resultRes = await getTryOnResult(jobId);
        setResult(resultRes.result_image_url);
        saveToHistory(
          token 
            ? { id: jobId, ...resultRes } 
            : resultRes.result_image_url, 
          [...selectedGarments]
        );
        setLoading(false);
      } else {
        // Poll status + progress
        const resultUrl = await waitForTryOnResult(
          jobId,
          (progressPct, jobStatus) => {
            setPct(progressPct);
            setJobStatus(jobStatus);
            if (progressPct <= 20) setLabel("Preparing your silhouette…");
            else if (progressPct <= 45) setLabel("Analyzing body contours…");
            else if (progressPct <= 65) setLabel("Extracting garment texture…");
            else if (progressPct <= 85) setLabel("Neural drape rendering…");
            else setLabel("Almost ready…");
          },
          1000,
          120000,
          pollingOptionsRef.current
        );
        clearTimeout(delayTimerRef.current);
        setResult(resultUrl);
        // Get final result details for history if token is present
        let resultObj = resultUrl;
        if (token) {
          try {
            const finalDetails = await getTryOnResult(jobId);
            resultObj = { id: jobId, ...finalDetails };
          } catch (_) {}
        }
        saveToHistory(resultObj, [...selectedGarments]);
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(delayTimerRef.current);
      setError(err.response?.data?.detail || err.message || "Fitting session failed. Please try again.");
      setLoading(false);
    }
  };

  // Before/After comparison slider logic
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = (e) => handleMove(e.clientX);
  const handleTouchMove = (e) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 flex-1 w-full flex flex-col">
        {/* Header */}
        <div className="mb-10 fade-up">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs text-secondary hover:text-primary transition-colors mb-6 uppercase tracking-widest font-semibold"
          >
            <ArrowLeft size={14} /> {language === "ar" ? "العودة" : "Back"}
          </button>
          <h1 className="heading-serif text-4xl md:text-5xl text-primary mb-3">{t("tryon_title")}</h1>
          <p className="text-secondary text-base max-w-xl font-light leading-relaxed">
            {t("tryon_subtitle")}
          </p>
        </div>

        {!token && (
          <div className="bg-[#fcfcfa] border border-rule p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-light text-secondary uppercase tracking-widest fade-up">
            <span>
              {language === "ar" 
                ? "سجّل الدخول لمزامنة سجل خزانة ملابسك والوصول إلى قياساتك عبر جميع الأجهزة." 
                : "Sign in to sync your wardrobe history and access your try-ons across all devices."}
            </span>
            <Link
              to="/login"
              className="btn-black py-2.5 px-6 text-[9.5px] font-bold tracking-widest uppercase rounded-none animate-pulse"
            >
              {t("sign_in")}
            </Link>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start flex-1 fade-up" style={{ animationDelay: "80ms" }}>
          
          {/* Left Column: Input Panel */}
          <div className="space-y-10">
            {/* Step 1: Portrait upload */}
            <div className="space-y-4 bg-white dark:bg-neutral-900 p-6 border border-rule rounded-sm text-primary">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <h2 className="text-xs font-bold tracking-widest uppercase text-primary text-start">
                  {t("upload_portrait")}
                </h2>
                {userImagePreview && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserFile(null);
                      setUserImagePreview(null);
                      setSelectedPresetId(null);
                      setResult(null);
                    }}
                    className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={11} /> {t("remove_image")}
                  </button>
                )}
              </div>
              {!userImagePreview && renderUserGuidance()}
              <div className="w-full max-w-sm aspect-[3/4] mx-auto overflow-hidden relative rounded-lg border border-rule bg-white dark:bg-neutral-950">
                <UploadBox
                  onUpload={(file) => {
                    setUserFile(file);
                    setUserImagePreview(URL.createObjectURL(file));
                    setSelectedPresetId(null);
                    setResult(null); // Reset result on new upload
                  }}
                  preview={userImagePreview}
                />
              </div>

              {/* Preset Models selection */}
              {!loading && !userImagePreview && (
                <div className="space-y-2 pt-2 text-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block">
                    {t("choose_preset")}
                  </span>
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    {filteredPresetModels.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        disabled={loading || loadingPresetId}
                        onClick={() => handleSelectPreset(model)}
                        className={`flex flex-col items-center shrink-0 p-1.5 rounded-lg border transition-all ${
                          selectedPresetId === model.id
                            ? "border-black bg-black/5 dark:bg-white/5"
                            : "border-neutral-200 hover:border-neutral-400 bg-white dark:bg-neutral-950"
                        }`}
                        style={{ width: "80px" }}
                      >
                        <div className="w-12 h-16 rounded overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-50 relative shrink-0">
                          {loadingPresetId === model.id && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 size={12} className="text-white animate-spin" />
                            </div>
                          )}
                          <img src={model.url} alt={model.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8px] font-bold mt-1 text-center truncate w-full text-primary leading-tight">
                          {model.gender === "female" ? "عارضة" : "عارض"}
                        </span>
                        <span className="text-[7px] text-secondary mt-0.5 font-light">
                          {model.size}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            {/* Step 2: Visual Style Collage Canvas (Always Visible) */}
            <div className="space-y-4 bg-white p-6 border border-rule rounded-sm text-primary">
              <div className="flex justify-between items-center border-b border-rule pb-3">
                <h2 className="text-xs font-bold tracking-widest uppercase text-primary">
                  2. لوحة تنسيق الإطلالة (Style Collage)
                </h2>
                {collageItems.length > 0 && (
                  <button
                    onClick={() => setCollageItems([])}
                    className="text-[10px] text-red-500 uppercase hover:underline"
                  >
                    {language === "ar" ? "مسح اللوحة" : "Clear Board"}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-secondary font-light leading-relaxed mb-3 text-start">
                {language === "ar"
                  ? "💡 يمكنك تحديد قطعتين معاً (مثلاً قميص وبنطلون) لتجربتهما معاً كطقم متكامل!"
                  : "💡 You can select two pieces (e.g. a top and a bottom) to try them on together as a full outfit!"}
              </p>

              {/* Style Collage Canvas Container */}
              <div
                className="w-full h-80 bg-[#fbfbf9] border border-rule rounded-sm relative overflow-hidden select-none cursor-default"
                style={{
                  backgroundImage: "radial-gradient(#e5e4de 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.activeDragId) return;
                  const canvasRect = e.currentTarget.getBoundingClientRect();
                  let newX = e.clientX - canvasRect.left - e.currentTarget.offsetX;
                  let newY = e.clientY - canvasRect.top - e.currentTarget.offsetY;
                  
                  // Keep item within bounds of canvas
                  newX = Math.max(0, Math.min(canvasRect.width - 80, newX));
                  newY = Math.max(0, Math.min(canvasRect.height - 100, newY));
                  
                  handleUpdateCollageItem(e.currentTarget.activeDragId, { x: newX, y: newY });
                }}
                onPointerUp={(e) => {
                  e.currentTarget.activeDragId = null;
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.activeDragId = null;
                }}
                onPointerDown={(e) => {
                  e.currentTarget.activeDragId = null;
                }}
              >
                {collageItems.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40 p-6 pointer-events-none">
                    <Sparkles size={24} className="mb-2 text-secondary" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-secondary">
                      لوحة تصميم المظهر (Moodboard)
                    </p>
                    <p className="text-[11px] font-light mt-1 max-w-[280px] leading-relaxed">
                      {language === "ar" 
                        ? "اختر القطع من المعرض أدناه، واسحبها هنا للتنسيق وتعديل المقاس."
                        : "Select garments from the catalog below, and drag them here to style."}
                    </p>
                  </div>
                ) : (
                  collageItems.map((item) => (
                    <div
                      key={item.id}
                      className="absolute bg-white border border-rule rounded shadow-sm flex flex-col cursor-move select-none p-1.5"
                      style={{
                        left: `${item.x}px`,
                        top: `${item.y}px`,
                        width: "90px",
                        height: "120px",
                        transform: `scale(${item.scale})`,
                        transformOrigin: "center center",
                        zIndex: 10
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const canvas = e.currentTarget.parentElement;
                        const rect = e.currentTarget.getBoundingClientRect();
                        canvas.activeDragId = item.id;
                        canvas.offsetX = e.clientX - rect.left;
                        canvas.offsetY = e.clientY - rect.top;
                      }}
                    >
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollageItems(collageItems.filter((i) => i.id !== item.id));
                        }}
                        className="absolute top-1 right-1 w-4 h-4 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center text-[8px] z-20"
                      >
                        ✕
                      </button>
                      {/* Scale Controls */}
                      <div className="absolute bottom-1 right-1 flex gap-1 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCollageItem(item.id, { scale: Math.min(1.5, item.scale + 0.1) });
                          }}
                          className="w-4 h-4 bg-black/60 hover:bg-black text-white rounded flex items-center justify-center text-[10px]"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCollageItem(item.id, { scale: Math.max(0.6, item.scale - 0.1) });
                          }}
                          className="w-4 h-4 bg-black/60 hover:bg-black text-white rounded flex items-center justify-center text-[10px]"
                        >
                          -
                        </button>
                      </div>
                      {/* Image */}
                      <div className="flex-1 bg-neutral-50 overflow-hidden relative rounded-sm">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>
                      <p className="text-[7.5px] font-bold text-primary truncate mt-1 text-center pointer-events-none">{item.name}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Scrollable grid to select garments */}
              <div className="space-y-2 text-start">
                <p className="text-[10px] font-semibold text-secondary tracking-widest">
                  {language === "ar" ? "الملابس المتاحة (Catalog)" : "Available Garments (Catalog)"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                  {brandProducts?.map((prod) => {
                    const isSelected = selectedGarments.some((g) => g.id === prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleGarment(prod)}
                        className={`cursor-pointer border p-3 flex flex-col gap-2 rounded-sm transition-all ${
                          isSelected ? "border-black bg-neutral-50" : "border-rule hover:border-black/40"
                        }`}
                      >
                        <div className="aspect-[3/4] bg-neutral-100 overflow-hidden">
                          <img
                            src={prod.main_image_url || prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-secondary truncate">{prod.brand?.name}</p>
                          <p className="text-xs text-primary font-medium truncate">{prod.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Advanced Toggle */}
            <div className="pt-2 text-start">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-black transition-colors flex items-center gap-1.5"
              >
                <span>{showAdvanced ? "Collapse Advanced Settings / إخفاء الخيارات المتقدمة" : "Expand Advanced Settings / خيارات القياس المتقدمة"}</span>
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-6 mt-4">
                {/* Step 3: Body Profile / Avatar */}
                <div className="space-y-4 bg-white dark:bg-neutral-900 p-6 border border-rule rounded-sm text-primary">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-primary border-b border-rule pb-3">
                    3. مواصفات الجسم والمقاسات (Body Profile)
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "Athletic M", name: "رياضي (Athletic M)" },
                      { id: "Slim M", name: "نحيف (Slim M)" },
                      { id: "Hourglass F", name: "ساعة رملية (Hourglass F)" },
                      { id: "Petite F", name: "قوام ناعم (Petite F)" },
                      { id: "Curve F", name: "قوام ممتلئ (Curve F)" },
                      { id: "Plus Size", name: "وزن زائد (Plus Size)" }
                    ].map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatar(av.id)}
                        className={`py-3 px-4 text-xs font-semibold tracking-wider uppercase border transition-all ${
                          avatar === av.id
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-rule hover:border-black/50 text-secondary"
                        }`}
                      >
                        {av.name}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">
                          <span>الطول (Height)</span>
                          <span>{height} سم</span>
                        </div>
                        <input
                          type="range"
                          min="150"
                          max="210"
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">
                          <span>الوزن (Weight)</span>
                          <span>{weight} كغم</span>
                        </div>
                        <input
                          type="range"
                          min="45"
                          max="120"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <div className="flex justify-between text-[9px] text-secondary font-bold uppercase tracking-wider mb-1">
                          <span>الصدر (Bust)</span>
                          <span>{bodyBust} سم</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="130"
                          value={bodyBust}
                          onChange={(e) => setBodyBust(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-secondary font-bold uppercase tracking-wider mb-1">
                          <span>الخصر (Waist)</span>
                          <span>{bodyWaist} سم</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="110"
                          value={bodyWaist}
                          onChange={(e) => setBodyWaist(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-secondary font-bold uppercase tracking-wider mb-1">
                          <span>الأرداف (Hips)</span>
                          <span>{bodyHips} سم</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="130"
                          value={bodyHips}
                          onChange={(e) => setBodyHips(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Engine Profile Selector */}
                {!result && (
                  <div className="space-y-3 bg-[#fcfcfa] dark:bg-neutral-900 p-4 border border-rule text-primary text-start">
                    <h3 className="text-[10px] font-bold tracking-widest uppercase text-secondary">
                      {language === "ar" ? "دقة محرك الذكاء الاصطناعي (AI Engine)" : "AI Engine Accuracy"}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "fast", label: language === "ar" ? "سريع (Fast)" : "Fast", desc: language === "ar" ? "دقة منخفضة (~0.5ث)" : "Low res (~0.5s)" },
                        { id: "balanced", label: language === "ar" ? "متوازن (Balanced)" : "Balanced", desc: language === "ar" ? "دقة قياسية (~1.5ث)" : "Std res (~1.5s)" },
                        { id: "quality", label: language === "ar" ? "جودة (Quality)" : "Quality", desc: language === "ar" ? "تفاصيل كاملة (~3ث)" : "Full details (~3s)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={loading}
                          onClick={() => setModelVariant(opt.id)}
                          className={`flex flex-col items-center justify-center p-2.5 border text-center transition-all ${
                            modelVariant === opt.id
                              ? "border-black bg-black text-white"
                              : "border-neutral-200 hover:border-neutral-400 text-neutral-600 bg-white dark:bg-neutral-950"
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">{opt.label}</span>
                          <span className={`text-[8px] mt-0.5 leading-tight ${modelVariant === opt.id ? "text-neutral-300" : "text-neutral-400"}`}>
                            {opt.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Action execution */}
            {!result && (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  id="generate-tryon-btn"
                  onClick={handleGenerate}
                  disabled={!userFile || selectedGarments.length === 0 || loading}
                  className="btn-black w-full py-4.5 text-xs font-bold tracking-widest uppercase disabled:opacity-35"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>{label === "Preparing your silhouette…" ? "جاري تحضير المقاسات..." :
                            label === "Uploading portrait…" ? "جاري رفع الصورة..." :
                            label === "Analyzing body contours…" ? "جاري تحليل الجسم..." :
                            label === "Extracting garment texture…" ? "جاري قراءة تفاصيل القماش..." :
                            label === "Compositing garment layers…" ? "جاري تركيب الملابس..." :
                            label === "Neural drape rendering…" ? "جاري المعالجة الذكية..." :
                            label === "Finalising silhouette…" ? "جاري اللمسات الأخيرة..." :
                            label === "Almost ready…" ? "على وشك الانتهاء..." : label}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles size={14} />
                      <span>بدء القياس بالذكاء الاصطناعي (Try-On)</span>
                    </div>
                  )}
                </button>
                {!token && result && (
                  <p className="text-center text-[10px] text-secondary font-light mt-3">
                    <Link to="/login" className="underline hover:text-black">سجّل الدخول</Link> لحفظ سجل القياسات الخاص بك على أجهزتك.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Visualizer panel & before/after comparison slider */}
          <div className="space-y-8 lg:sticky top-28 bg-white dark:bg-neutral-900 border border-rule p-6 rounded-sm min-h-[600px] flex flex-col">
            <div className="border-b border-rule pb-3 flex justify-between items-center">
              <h2 className="text-xs font-bold tracking-widest uppercase text-primary">
                {t("tryon_result")}
              </h2>
              <div className="flex items-center gap-3">
                {result && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(result);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "vrital-tryon-result.jpg";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        window.open(result, "_blank");
                      }
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-secondary hover:text-black transition-colors"
                  >
                    <Download size={11} /> {t("save_image")}
                  </button>
                )}
                {result && (
                  <button
                    onClick={() => setResult(null)}
                    className="text-[10px] font-semibold uppercase text-secondary hover:text-black"
                  >
                    {t("reset")}
                  </button>
                )}
              </div>
            </div>

            {/* Result area with Slider or waiting code */}
            <div className="flex-1 relative bg-surface-bright flex items-center justify-center overflow-hidden border border-rule min-h-[450px]">
              {result ? (
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={result}
                    alt="Tryon Result"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-sm z-20">
                    نتيجة القياس (AI Result)
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center">
                  {/* Underlay the model image if selected/uploaded */}
                  {userImagePreview && (
                    <img
                      src={userImagePreview}
                      alt="Active Model"
                      className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none transition-opacity duration-500"
                    />
                  )}

                  {loading ? (
                    <div className="space-y-6 w-full max-w-xs z-10 bg-white/95 dark:bg-black/95 p-6 border border-rule rounded-sm shadow-md backdrop-blur-sm">
                      {/* Animated spinner */}
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="w-full h-full border border-rule rounded-full animate-[spin_4s_linear_infinite] opacity-30" />
                        <div className="absolute inset-1.5 border-t border-black/80 rounded-full animate-[spin_2s_linear_infinite]" />
                        <div className="absolute inset-3.5 border-r border-black/40 rounded-full animate-[spin_1.2s_linear_infinite_reverse]" />
                        <Sparkles size={16} className="absolute inset-0 m-auto text-black animate-pulse" />
                      </div>

                      {/* Stage message */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-secondary">الذكاء الاصطناعي (Vrital AI)</p>
                        <p
                          key={label}
                          className="text-xs font-light text-primary leading-relaxed transition-all duration-500"
                          style={{ animation: 'fadeIn 0.5s ease' }}
                        >
                          {label === "Preparing your silhouette…" ? "جاري تحضير المقاسات وتحديد أبعاد الموديل..." :
                           label === "Uploading portrait…" ? "جاري رفع وتحميل صورة العارض..." :
                           label === "Analyzing body contours…" ? "جاري تحليل زوايا الجسم وتفاصيل الطول والوزن..." :
                           label === "Extracting garment texture…" ? "جاري استخراج تفاصيل وقماش القطعة المحددة..." :
                           label === "Compositing garment layers…" ? "جاري تركيب وتنسيق طبقات الملابس على الجسم..." :
                           label === "Neural drape rendering…" ? "جاري معالجة وتفصيل طيات القماش بالذكاء الاصطناعي..." :
                           label === "Finalising silhouette…" ? "جاري وضع اللمسات النهائية للصورة..." :
                           label === "Almost ready…" ? "النتيجة توشك على الاكتمال..." : label}
                        </p>
                      </div>

                      {/* Status badge */}
                      {jobStatus && (
                        <div className="inline-flex items-center justify-center gap-2 border border-rule px-2.5 py-1 text-[8.5px] uppercase tracking-widest font-semibold text-secondary mx-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          {jobStatus === 'queued' ? 'في قائمة الانتظار' : 'جاري المعالجة'} ({pct}%)
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>

                      {/* Cancel button */}
                      <button
                        onClick={() => {
                          pollingOptionsRef.current.cancelled = true;
                          clearTimeout(delayTimerRef.current);
                          setLoading(false);
                          setJobStatus(null);
                        }}
                        className="text-[9px] text-secondary hover:text-red-500 font-bold uppercase tracking-widest transition-colors mt-2"
                      >
                        إلغاء الطلب (Cancel Request)
                      </button>
                    </div>
                  ) : userImagePreview ? (
                    <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-sm z-20">
                      العارض الحالي (Active Model)
                    </div>
                  ) : (
                    <div className="opacity-35 flex flex-col items-center">
                      <Sparkles size={28} className="mb-3" strokeWidth={1.2} />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary">بانتظار بدء القياس (Awaiting Fit)</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Try-on History Drawer */}
            <div className="pt-4 border-t border-rule space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-secondary">
                <span className="flex items-center gap-1.5"><History size={12} /> سجل جلسات القياس الافتراضي (History)</span>
                {history.length > 0 && (
                  <button onClick={handleClearHistory} className="text-red-500 hover:underline">
                    مسح السجل (Clear)
                  </button>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                {history.length === 0 ? (
                  <p className="text-secondary text-[11px] font-light">لا يوجد جلسات قياس مسجلة.</p>
                ) : (
                  history.map((h) => {
                    const resolvedResultUrl = h.result_image_url || h.resultUrl;
                    const resolvedDate = h.created_at ? new Date(h.created_at).toLocaleDateString() : h.date;
                    const resolvedGarments = h.garments || resolveGarments(h.garments_list, h.product_id);
                    const resolvedAvatar = h.avatar || "Fit";

                    return (
                      <div
                        key={h.id}
                        onClick={() => setResult(resolvedResultUrl)}
                        className="w-56 shrink-0 cursor-pointer border border-rule hover:border-black transition-all rounded-sm bg-white dark:bg-neutral-950 p-3 flex gap-3 relative group text-primary"
                      >
                        <div className="w-14 h-20 bg-[#fcfcfa] dark:bg-neutral-900 overflow-hidden rounded-sm relative shrink-0 border border-rule">
                          <img src={resolvedResultUrl} alt="Tryon history snapshot" className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-1 bg-black/75 text-[6px] text-white px-1 py-0.5 uppercase tracking-widest rounded-sm">
                            {resolvedAvatar.split(" ")[0]}
                          </div>
                        </div>
                        <div className="text-left flex flex-col justify-between overflow-hidden">
                          <div>
                            <p className="text-[8px] font-bold text-secondary uppercase tracking-widest">{resolvedDate}</p>
                            <p className="text-[10px] font-medium text-primary truncate">
                              {resolvedGarments && resolvedGarments.length > 0
                                ? resolvedGarments.map((g) => g.name).join(", ")
                                : "ملابس مخصصة (Custom Outfit)"}
                            </p>
                          </div>
                          {h.height && (
                            <div className="text-[8.5px] text-secondary font-light space-y-0.5" dir="rtl">
                              <p>المقاسات (Measurements):</p>
                              <p className="font-semibold text-primary">
                                الطول:{h.height}سم · الوزن:{h.weight}كغم
                              </p>
                              <p>
                                ص:{h.body_bust || h.bodyBust || 90} · خ:{h.body_waist || h.bodyWaist || 75} · ك:{h.body_hips || h.bodyHips || 95}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
