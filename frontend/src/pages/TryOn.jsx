import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import UploadBox from "../components/tryon/UploadBox";
import { useProducts } from "../hooks/useProducts";
import api from "../api/client";
import { Sparkles, Loader2, AlertCircle, ArrowLeft, Trash2, History, User, Download } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { submitTryOn, waitForTryOnResult, getTryOnResult, pollTryOnStatus } from "../api/tryon";


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

  // Body profile state
  const [avatar, setAvatar] = useState("Athletic M");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [bodyBust, setBodyBust] = useState(90);
  const [bodyWaist, setBodyWaist] = useState(75);
  const [bodyHips, setBodyHips] = useState(95);

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
  const pollingRef = useRef(null);
  const delayTimerRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };
  }, []);

  // Fitting History (persistent in localStorage & cloud database)
  const [history, setHistory] = useState([]);

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

    // 10-second delay warning
    delayTimerRef.current = setTimeout(() => {
      setIsDelayed(true);
    }, 10000);

    try {
      // Dispatch async try-on job — returns 202 immediately
      const dispatch = await submitTryOn(userFile, selectedGarments[0]?.id, modelVariant);
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
          }
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
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="heading-serif text-5xl text-primary mb-3">Atelier Fitting Room</h1>
          <p className="text-secondary text-base max-w-xl font-light">
            Evolve your style. Upload your portrait, build an outfit, configure your avatar drapes, and preview results with AI.
          </p>
        </div>

        {!token && (
          <div className="bg-[#fcfcfa] border border-rule p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-light text-secondary uppercase tracking-widest fade-up">
            <span>Sign in to sync your wardrobe history and access your try-ons across all devices.</span>
            <Link
              to="/login"
              className="btn-black py-2.5 px-6 text-[9.5px] font-bold tracking-widest uppercase rounded-none animate-pulse"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start flex-1 fade-up" style={{ animationDelay: "80ms" }}>
          
          {/* Left Column: Input Panel */}
          <div className="space-y-10">
            {/* Step 1: Portrait upload */}
            <div className="space-y-4 bg-white p-6 border border-rule rounded-sm">
              <h2 className="text-xs font-bold tracking-widest uppercase text-primary border-b border-rule pb-3">
                1. Upload Portrait
              </h2>
              <UploadBox
                onUpload={(file) => {
                  setUserFile(file);
                  setUserImagePreview(URL.createObjectURL(file));
                  setResult(null); // Reset result on new upload
                }}
                preview={userImagePreview}
              />
            </div>

            {/* Step 2: Body Profile / Avatar */}
            <div className="space-y-4 bg-white dark:bg-neutral-900 p-6 border border-rule rounded-sm text-primary">
              <h2 className="text-xs font-bold tracking-widest uppercase text-primary border-b border-rule pb-3">
                2. Body Profile & Draping Measurements
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {["Athletic M", "Slim M", "Hourglass F", "Petite F", "Curve F", "Plus Size"].map((av) => (
                  <button
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`py-3 px-4 text-xs font-semibold tracking-wider uppercase border transition-all ${
                      avatar === av
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-rule hover:border-black/50 text-secondary"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <div className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">
                      <span>Height</span>
                      <span>{height} cm</span>
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
                      <span>Weight</span>
                      <span>{weight} kg</span>
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
                      <span>Bust/Chest</span>
                      <span>{bodyBust} cm</span>
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
                      <span>Waist</span>
                      <span>{bodyWaist} cm</span>
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
                      <span>Hips</span>
                      <span>{bodyHips} cm</span>
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

            {/* Step 3: Visual Style Collage Canvas */}
            <div className="space-y-4 bg-white p-6 border border-rule rounded-sm text-primary">
              <div className="flex justify-between items-center border-b border-rule pb-3">
                <h2 className="text-xs font-bold tracking-widest uppercase text-primary">
                  3. Build Style Collage Canvas
                </h2>
                {collageItems.length > 0 && (
                  <button
                    onClick={() => setCollageItems([])}
                    className="text-[10px] text-red-500 uppercase hover:underline"
                  >
                    Clear Board
                  </button>
                )}
              </div>

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
                      Outfit Moodboard Canvas
                    </p>
                    <p className="text-[11px] font-light mt-1 max-w-[280px] leading-relaxed">
                      Select pieces from the catalog below, drag them to compose, and scale using the controls.
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
                      {/* Controls header */}
                      <div className="flex justify-between items-center text-[7.5px] border-b border-rule pb-1 mb-1 shrink-0 select-none">
                        <span className="font-bold text-secondary truncate w-10">{item.brand || "Atelier"}</span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateCollageItem(item.id, { scale: Math.max(0.6, item.scale - 0.1) });
                            }}
                            className="w-3.5 h-3.5 border border-rule flex items-center justify-center bg-white hover:bg-neutral-50"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateCollageItem(item.id, { scale: Math.min(1.4, item.scale + 0.1) });
                            }}
                            className="w-3.5 h-3.5 border border-rule flex items-center justify-center bg-white hover:bg-neutral-50"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCollageItem(item.id);
                            }}
                            className="text-red-500 hover:text-red-700 ml-1 font-bold"
                          >
                            ✕
                          </button>
                        </div>
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
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Available Catalog</p>
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

            {/* Action execution */}
            {!result && (
              <div className="space-y-4">
                {/* AI Engine Profile Selector */}
                <div className="space-y-3 bg-[#fcfcfa] p-4 border border-rule">
                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-secondary">
                    AI Engine Profile
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "fast", label: "Fast", desc: "Lower res (~0.5s)" },
                      { id: "balanced", label: "Balanced", desc: "Standard (~1.5s)" },
                      { id: "quality", label: "Quality", desc: "High details (~3s)" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={loading}
                        onClick={() => setModelVariant(opt.id)}
                        className={`flex flex-col items-center justify-center p-2.5 border text-center transition-all ${
                          modelVariant === opt.id
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 hover:border-neutral-400 text-neutral-600 bg-white"
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
                      <span>{label}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles size={14} />
                      <span>Execute Virtual Try-On</span>
                    </div>
                  )}
                </button>
                {!token && result && (
                  <p className="text-center text-[10px] text-secondary font-light mt-3">
                    <Link to="/login" className="underline hover:text-black">Sign in</Link> to save your fitting history across devices.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Visualizer panel & before/after comparison slider */}
          <div className="space-y-8 lg:sticky top-28 bg-white border border-rule p-6 rounded-sm min-h-[600px] flex flex-col">
            <div className="border-b border-rule pb-3 flex justify-between items-center">
              <h2 className="text-xs font-bold tracking-widest uppercase text-primary">
                Atelier Try-On Result
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
                    <Download size={11} /> Save
                  </button>
                )}
                {result && (
                  <button
                    onClick={() => setResult(null)}
                    className="text-[10px] font-semibold uppercase text-secondary hover:text-black"
                  >
                    Reset Canvas
                  </button>
                )}
              </div>
            </div>

            {/* Result area with Slider or waiting code */}
            <div className="flex-1 relative bg-surface-bright flex items-center justify-center overflow-hidden border border-rule min-h-[450px]">
              {result ? (
                /* Before/After Split slider */
                <div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  className="absolute inset-0 select-none cursor-ew-resize overflow-hidden w-full h-full"
                >
                  {/* Before: User Portrait */}
                  <div className="absolute inset-0 bg-cover bg-center">
                    <img
                      src={userImagePreview}
                      alt="Before Portrait"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  {/* After: Tryon Result (positioned relative to slider percentage) */}
                  <div
                    className="absolute inset-y-0 left-0 right-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={result}
                      alt="Tryon Result"
                      className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
                      style={{ width: containerRef.current?.getBoundingClientRect().width }}
                    />
                  </div>

                  {/* Slider Divider Bar */}
                  <div
                    className="absolute inset-y-0 w-1 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    {/* Circle Handle */}
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-black/20 flex items-center justify-center shadow-lg pointer-events-none">
                      <div className="flex gap-0.5 text-black">
                        <span className="w-1 h-3 bg-black/40 rounded-full" />
                        <span className="w-1 h-3 bg-black/40 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-sm z-20">
                    Result
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-sm z-20">
                    Original
                  </div>
                </div>
              ) : (
                /* Empty / Loading screen */
                <div className="flex flex-col items-center justify-center text-center p-10">
                  {loading ? (
                    <div className="space-y-6 w-full max-w-xs">
                      {/* Animated spinner */}
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="w-full h-full border border-rule rounded-full animate-[spin_4s_linear_infinite] opacity-30" />
                        <div className="absolute inset-2 border-t border-black/80 rounded-full animate-[spin_2s_linear_infinite]" />
                        <div className="absolute inset-5 border-r border-black/40 rounded-full animate-[spin_1.2s_linear_infinite_reverse]" />
                        <Sparkles size={18} className="absolute inset-0 m-auto text-black animate-pulse" />
                      </div>

                      {/* Stage message */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-secondary">Vrital AI Atelier</p>
                        <p
                          key={label}
                          className="text-sm font-light text-primary leading-relaxed transition-all duration-500"
                          style={{ animation: 'fadeIn 0.5s ease' }}
                        >
                          {label}
                        </p>
                        {isDelayed && (
                          <p className="text-[10px] text-red-500 font-semibold tracking-wider animate-pulse">
                            High demand, this may take a bit longer...
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      {jobStatus && (
                        <div className="inline-flex items-center justify-center gap-2 border border-rule px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold text-secondary mx-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          {jobStatus === 'queued' ? 'In Queue' : 'Processing'} ({pct}%)
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>

                      {/* Cancel button */}
                      <button
                        onClick={() => {
                          if (pollingRef.current) clearInterval(pollingRef.current);
                          clearTimeout(delayTimerRef.current);
                          setLoading(false);
                          setJobStatus(null);
                        }}
                        className="text-[10px] text-secondary hover:text-red-500 font-bold uppercase tracking-widest transition-colors mt-2"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-35 flex flex-col items-center">
                      <Sparkles size={28} className="mb-3" strokeWidth={1.2} />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary">Awaiting Fit Canvas</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Try-on History Drawer */}
            <div className="pt-4 border-t border-rule space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-secondary">
                <span className="flex items-center gap-1.5"><History size={12} /> Fitting Session History</span>
                {history.length > 0 && (
                  <button onClick={handleClearHistory} className="text-red-500 hover:underline">
                    Clear History
                  </button>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                {history.length === 0 ? (
                  <p className="text-secondary text-[11px] font-light">No sessions recorded.</p>
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
                        className="w-56 shrink-0 cursor-pointer border border-rule hover:border-black transition-all rounded-sm bg-white p-3 flex gap-3 relative group text-primary"
                      >
                        <div className="w-14 h-20 bg-[#fcfcfa] overflow-hidden rounded-sm relative shrink-0 border border-rule">
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
                                : "Custom Outfit"}
                            </p>
                          </div>
                          {h.height && (
                            <div className="text-[8.5px] text-secondary font-light space-y-0.5">
                              <p>Measurements:</p>
                              <p className="font-semibold text-primary">
                                H:{h.height}cm · W:{h.weight}kg
                              </p>
                              <p>
                                B:{h.body_bust || h.bodyBust || 90} · W:{h.body_waist || h.bodyWaist || 75} · H:{h.body_hips || h.bodyHips || 95}
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
