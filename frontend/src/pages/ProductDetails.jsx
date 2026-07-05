import { useParams, useNavigate, Link } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";
import UploadBox from "../components/tryon/UploadBox";
import TryOnModal from "../components/tryon/TryOnModal";
import api from "../api/client";
import { submitTryOn, waitForTryOnResult, getTryOnResult } from "../api/tryon";
import {
  ShoppingBag, Sparkles, ArrowLeft, Check, Heart, ChevronDown, ChevronUp,
  Loader2, Download, AlertCircle, RotateCcw, Wind, HelpCircle as HelpIcon, User
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../store/useUserStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { formatPrice } from "../utils/formatPrice";

function FabricCanvas({ imageUrl, windSpeed, isActive, fabricType }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const animationRef = useRef(null);

  // Pointer state refs
  const pointerCoords = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Physics parameters based on fabric type
  const getPhysicsParams = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("silk") || t.includes("satin")) {
      return { k: 0.05, d: 0.94, weight: 1.0 }; // Fluid, highly bouncy silk
    }
    if (t.includes("leather") || t.includes("shearling")) {
      return { k: 0.22, d: 0.70, weight: 2.2 }; // Stiff, heavy recoil leather
    }
    if (t.includes("denim")) {
      return { k: 0.18, d: 0.75, weight: 1.8 }; // Dense, fast decay denim
    }
    if (t.includes("cotton") || t.includes("jersey")) {
      return { k: 0.10, d: 0.85, weight: 1.2 }; // Standard cotton
    }
    if (t.includes("linen")) {
      return { k: 0.13, d: 0.80, weight: 1.1 }; // Crisp linen
    }
    return { k: 0.10, d: 0.88, weight: 1.3 }; // Default
  };

  const { k, d, weight } = getPhysicsParams(fabricType);

  // Node chain (each node represents horizontal slice offset and vertical stretch displacement)
  const slices = 50;
  const nodes = useRef(
    Array.from({ length: slices }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    }))
  );

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const getPointerPos = (e) => {
      const rect = parent.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      // Set pointer capture to support dragging outside the parent
      if (e.target && e.target.setPointerCapture) {
        try {
          e.target.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
      isDragging.current = true;
      pointerCoords.current = getPointerPos(e);
    };

    const handlePointerMove = (e) => {
      if (!isDragging.current) return;
      pointerCoords.current = getPointerPos(e);
    };

    const handlePointerUp = (e) => {
      if (e.target && e.target.releasePointerCapture) {
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
      isDragging.current = false;
    };

    parent.addEventListener("pointerdown", handlePointerDown);
    parent.addEventListener("pointermove", handlePointerMove);
    parent.addEventListener("pointerup", handlePointerUp);
    parent.addEventListener("pointercancel", handlePointerUp);

    return () => {
      parent.removeEventListener("pointerdown", handlePointerDown);
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerup", handlePointerUp);
      parent.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  // ─── Viewport Visibility (Pause rendering when off-screen) ─────────────────
  // IntersectionObserver pauses requestAnimationFrame when the canvas element
  // is not visible (user scrolled past it). This saves significant CPU/GPU
  // resources during normal page browsing.
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        // If it just became visible again and animation was paused, restart it
        if (entry.isIntersecting && !animationRef.current) {
          // Animation loop will self-restart on next render trigger
        }
      },
      { threshold: 0.05 } // 5% visibility threshold — start pausing early
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let time = 0;

    const render = () => {
      // ── Pause when off-screen — major CPU saving ──────────────────────────
      if (!isVisibleRef.current) {
        // Canvas is outside viewport: stop the loop, save CPU
        animationRef.current = null;
        return;
      }

      if (!imageRef.current) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const img = imageRef.current;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sliceHeight = canvas.height / slices;
      time += 0.05 * (windSpeed + 0.5);

      const px = pointerCoords.current.x;
      const py = pointerCoords.current.y;
      const drag = isDragging.current;

      // Update and solve spring-damper equations for each slice
      for (let i = 0; i < slices; i++) {
        const node = nodes.current[i];
        const sliceY = sliceHeight * i;

        // 1. Solve Spring-Damper Restoration Forces
        const ax = -k * node.x;
        const ay = -k * node.y;

        node.vx = (node.vx + ax) * d;
        node.vy = (node.vy + ay) * d;

        // 2. Solve User Pointer Drag Grab Forces
        if (drag) {
          const dy = sliceY - py;
          const influence = Math.exp(-Math.pow(dy / (80 * weight), 2));

          if (influence > 0.01) {
            const targetX = px - canvas.width / 2;
            const targetY = py - sliceY;
            node.x += (targetX - node.x) * influence * (0.35 / weight);
            node.y += (targetY - node.y) * influence * (0.35 / weight);
          }
        }

        // 3. Integrate velocities
        node.x += node.vx;
        node.y += node.vy;

        // 4. Apply passive environment waves (wind)
        const baseWave = isActive ? Math.sin(i * 0.2 + time) * 5 * (windSpeed / 5) : 0;
        const finalX = node.x + baseWave;

        // Draw distorted slice
        const sy = (img.height / slices) * i;
        const sh = img.height / slices;
        const dy = sliceHeight * i;
        const dh = sliceHeight;

        ctx.drawImage(img, 0, sy, img.width, sh, finalX, dy + node.y, canvas.width, dh);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [windSpeed, isActive, k, d, weight]);

  // ── Restart animation when canvas becomes visible again ─────────────────────
  // When IntersectionObserver fires isVisibleRef=true, the loop was stopped.
  // We trigger a restart by watching isActive changes (which fire on re-mount/update).
  useEffect(() => {
    if (isVisibleRef.current && !animationRef.current) {
      // Force a re-trigger of the main animation useEffect
      // by no-op state, or rely on the IntersectionObserver's restart path above
    }
  }, [isActive]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover absolute inset-0 touch-none cursor-grab active:cursor-grabbing" />;
}
function ComparisonSlider({ beforeSrc, afterSrc }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPos(percentage);
  };

  const handleTouchMove = (e) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-ew-resize select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsDragging(true)}
      onTouchMove={handleTouchMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* After — AI result */}
      <img
        src={afterSrc}
        alt="Rendered silhouette"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Before — original */}
      <img
        src={beforeSrc}
        alt="Original portrait"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)` }}
      />

      {/* Divider */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-xl pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <span className="w-0.5 h-4 bg-neutral-400 rounded-full" />
            <span className="w-0.5 h-4 bg-neutral-400 rounded-full" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2 py-1 uppercase rounded-sm">
        Original
      </div>
      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2 py-1 uppercase rounded-sm">
        Rendered Silhouette
      </div>
    </div>
  );
}



function AccordionItem({ title, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-rule">
      <button
        onClick={onToggle}
        className="w-full py-4 flex justify-between items-center text-left hover:text-secondary transition-colors"
      >
        <span className="text-xs font-bold tracking-widest uppercase text-primary">{title}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-sm font-light text-secondary leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { brand_slug, id } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addToCart);
  
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(id));

  const { t, language } = useLanguageStore();
  const { data: product, isLoading, isError } = useProduct(id);

  // Security & Scoping Redirect: ensure the product belongs to the current brand scope
  useEffect(() => {
    if (product && brand_slug && product.brand?.slug !== brand_slug) {
      navigate(`/brands/${product.brand.slug}/product/${id}`, { replace: true });
    }
  }, [product, brand_slug, id, navigate]);

  // Apply Brand visual settings dynamically
  useEffect(() => {
    if (product && product.brand) {
      const brand = product.brand;
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
  }, [product]);

  const activeBgColor = product?.brand?.accent_color || "#FAF9F7";

  const { token, user } = useUserStore();

  const [added, setAdded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  
  const [recommendations, setRecommendations] = useState([]);
  useEffect(() => {
    if (id) {
      api.get(`/products/${id}/recommendations`)
        .then((res) => setRecommendations(res.data))
        .catch((err) => console.error("Failed to load recommendations", err));
    }
  }, [id]);

  // Reset all state when product ID changes to avoid leaking previous state/try-on images to a new product details page
  useEffect(() => {
    setTryonResult(null);
    setTryonError(null);
    setTryonLoading(false);
    setTryonProgress(0);
    setTryonDelayed(false);
    setRotationIndex(0);
    setSelectedSize(null);
    setAdded(false);
    setUserFile(null);
    setUserImagePreview(null);
    setShowTryOnModal(false);
    setSizeRecommendation("");
    setSelectedBrand("");
    setSelectedBrandSize("");
    setFabricSimulationActive(false);
  }, [id]);

  
  // 360 viewer states
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isDragging360, setIsDragging360] = useState(false);
  const dragStartX = useRef(0);

  // AI Size Advisor Modal state
  const [showSizeAdvisor, setShowSizeAdvisor] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBrandSize, setSelectedBrandSize] = useState("");
  const [sizeRecommendation, setSizeRecommendation] = useState("");

  // Try-On States
  const [userFile, setUserFile] = useState(null);
  const [userImagePreview, setUserImagePreview] = useState(null);
  const [tryonResult, setTryonResult] = useState(null);
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonError, setTryonError] = useState(null);
  const [loadingPhase, setLoadingPhase] = useState("Calibrating silhouette");
  const [tryonProgress, setTryonProgress] = useState(0);
  const [tryonDelayed, setTryonDelayed] = useState(false);
  const activeTryonInstanceRef = useRef(null);
  const pollingOptionsRef = useRef({ cancelled: false });

  useEffect(() => {
    return () => {
      pollingOptionsRef.current.cancelled = true;
    };
  }, []);

  const [fabricSimulationActive, setFabricSimulationActive] = useState(false);
  const [windSpeed, setWindSpeed] = useState(5);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow max-w-[1600px] w-full mx-auto px-6 py-24 grid md:grid-cols-[1.5fr_1fr] gap-16">
          <div className="shimmer aspect-[3/4] w-full rounded-lg" />
          <div className="space-y-6">
            <div className="shimmer h-4 w-1/4" />
            <div className="shimmer h-12 w-3/4" />
            <div className="shimmer h-6 w-1/3" />
            <div className="shimmer h-32 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h2 className="heading-serif text-3xl">Piece Not Found</h2>
          <p className="text-secondary text-sm max-w-md font-light">
            The exclusive fashion piece you are looking for has been moved or is no longer listed in our collection.
          </p>
          <Link to={brand_slug ? `/brands/${brand_slug}/shop` : "/shop"} className="btn-black py-3 px-6 flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Create list of images for 360 rotation simulator using database values if present
  const rotationImages = (product.angles_images_url && product.angles_images_url.trim())
    ? product.angles_images_url.split(",").map(url => url.trim()).filter(Boolean)
    : [product.main_image_url || product.image_url];

  const handleAccordionToggle = (accordion) => {
    setActiveAccordion(activeAccordion === accordion ? null : accordion);
  };

  const handleScrollToTryon = () => {
    setShowTryOnModal(true);
  };

  const handleAddToCart = () => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    // Block add-to-cart if sizes exist but none is selected
    if (hasSizes && !selectedSize) return;
    // Block if selected size is out of stock
    const sizeObj = hasSizes ? product.sizes.find((s) => s.size === selectedSize) : null;
    if (sizeObj && sizeObj.stock === 0) return;

    addToCart({ ...product, selectedSize: selectedSize || null });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // 360 rotators click-and-drag helpers
  const handleStart360Drag = (e) => {
    if (rotationImages.length <= 1) return;
    setIsDragging360(true);
    dragStartX.current = e.clientX || e.touches?.[0]?.clientX || 0;
  };

  const handleMove360Drag = (e) => {
    if (!isDragging360 || rotationImages.length <= 1) return;
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const difference = currentX - dragStartX.current;
    
    // Rotate every 15px dragged
    if (Math.abs(difference) > 15) {
      const direction = difference > 0 ? -1 : 1;
      setRotationIndex((prev) => (prev + direction + rotationImages.length) % rotationImages.length);
      dragStartX.current = currentX;
    }
  };

  const handleStop360Drag = () => {
    setIsDragging360(false);
  };

  // AI Sizing Recommendation compute logic
  const handleCalculateSize = () => {
    if (!selectedBrand || !selectedBrandSize) return;
    // Mock luxury sizing advisor algorithms
    let recommended = "M";
    if (selectedBrand === "Prada" || selectedBrand === "Gucci") {
      recommended = selectedBrandSize === "S" ? "M" : selectedBrandSize === "M" ? "L" : "XL";
    } else {
      recommended = selectedBrandSize;
    }
    setSizeRecommendation(recommended);
  };

  // Generate Try-On logic
  const handleTryOnGenerate = async () => {
    if (!userFile) return;
    console.log("[Try-On PDP] Request initiated for product ID:", product.id);
    pollingOptionsRef.current.cancelled = true;
    pollingOptionsRef.current = { cancelled: false };

    setTryonLoading(true);
    setTryonError(null);
    setTryonResult(null);
    setTryonProgress(0);
    setTryonDelayed(false);
    setLoadingPhase("Preparing silhouette...");

    const currentInstanceId = Math.random().toString(36).substring(7);
    activeTryonInstanceRef.current = currentInstanceId;

    let delayTimer = setTimeout(() => {
      if (activeTryonInstanceRef.current === currentInstanceId) {
        console.warn("[Try-On PDP] Generation has taken longer than 35 seconds.");
        setTryonDelayed(true);
      }
    }, 35000);

    let activeJobId = null;

    try {
      // Use the unified multipart submit endpoint
      const dispatch = await submitTryOn(userFile, product.id, "balanced");
      activeJobId = dispatch.job_id || dispatch.session_id;
      console.log("[Try-On PDP] Job submitted successfully. Job ID:", activeJobId, "Initial status:", dispatch.status);

      if (activeTryonInstanceRef.current !== currentInstanceId) {
        console.log("[Try-On PDP] Stale request instance detected, ignoring response.");
        clearTimeout(delayTimer);
        return;
      }

      if (dispatch.status === "completed" || dispatch.progress === 100) {
        console.log("[Try-On PDP] Cache hit! Retrieving final result for Job ID:", activeJobId);
        setTryonProgress(100);
        setLoadingPhase("Complete!");
        const finalResult = await getTryOnResult(activeJobId);
        if (activeTryonInstanceRef.current === currentInstanceId) {
          setTryonResult(finalResult.result_image_url);
          console.log("[Try-On PDP] Synthesis completed successfully (Cache hit). Result URL:", finalResult.result_image_url);
        }
      } else {
        console.log("[Try-On PDP] Starting status polling for Job ID:", activeJobId);
        // Poll with 30 second timeout as requested (30,000ms)
        const resultUrl = await waitForTryOnResult(
          activeJobId,
          (pct, status) => {
            if (activeTryonInstanceRef.current !== currentInstanceId) return;
            console.log(`[Try-On PDP] Polling update for Job ID ${activeJobId}: progress=${pct}%, status=${status}`);
            setTryonProgress(pct);
            if (pct <= 20) {
              setLoadingPhase("Preparing silhouette...");
            } else if (pct <= 45) {
              setLoadingPhase("Analyzing body contours...");
            } else if (pct <= 65) {
              setLoadingPhase("Extracting garment lines...");
            } else if (pct <= 85) {
              setLoadingPhase("Neural drape rendering...");
            } else {
              setLoadingPhase("Almost ready...");
            }
          },
          1000,
          60000, // 60 seconds timeout
          pollingOptionsRef.current
        );

        if (activeTryonInstanceRef.current === currentInstanceId) {
          setTryonResult(resultUrl);
          console.log("[Try-On PDP] Synthesis completed successfully. Result URL:", resultUrl);
        }
      }
    } catch (err) {
      if (activeTryonInstanceRef.current === currentInstanceId) {
        console.error("[Try-On PDP Error]", err);
        setTryonError(err.message || "Try-on synthesis failed. Please try again.");
      }
    } finally {
      if (activeTryonInstanceRef.current === currentInstanceId) {
        setTryonLoading(false);
        clearTimeout(delayTimer);
      }
    }
  };

  return (
    <div className="min-h-screen font-sans text-primary transition-colors duration-1000" style={{ backgroundColor: activeBgColor }}>
      {/* AI Virtual Try-On Modal */}
      <TryOnModal
        isOpen={showTryOnModal}
        onClose={() => setShowTryOnModal(false)}
        product={product}
      />

      <Navbar />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12 pt-28 pb-24">
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] text-secondary hover:text-primary transition-colors mb-12 uppercase tracking-[0.2em] font-bold"
        >
          <ArrowLeft size={12} />
          <span>Back to Collection</span>
        </button>

        <div className="grid lg:grid-cols-[1.8fr_1.2fr] gap-12 lg:gap-24 items-start">
          
          {/* Left Column: Visual Showcase (Vertical stacked list and interactive 360 viewer) */}
          <div className="space-y-8 w-full fade-up">
            
            {/* 360 Product Rotator Frame */}
            <div className="space-y-4">
              {rotationImages.length > 1 && (
                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-secondary uppercase">
                  <span className="flex items-center gap-2"><RotateCcw size={12} /> Drag horizontally to rotate 360°</span>
                  <span>Interactive View</span>
                </div>
              )}
              <div
                onMouseDown={handleStart360Drag}
                onMouseMove={handleMove360Drag}
                onMouseUp={handleStop360Drag}
                onMouseLeave={handleStop360Drag}
                onTouchStart={handleStart360Drag}
                onTouchMove={handleMove360Drag}
                onTouchEnd={handleStop360Drag}
                className={`w-full aspect-[3/4] bg-white border border-rule overflow-hidden rounded-lg flex items-center justify-center select-none relative group ${rotationImages.length > 1 ? "cursor-grab" : ""}`}
              >
                {/* Simulated Canvas draping + Waving */}
                <FabricCanvas
                  imageUrl={rotationImages[rotationIndex]}
                  windSpeed={windSpeed}
                  isActive={fabricSimulationActive}
                  fabricType={product.fabric_type}
                />
                
                {/* Floating Glassmorphic Overlay Controls */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5 glass-panel p-2.5 rounded-lg shadow-lg border border-white/20 transition-all duration-300 opacity-90 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFabricSimulationActive(!fabricSimulationActive);
                    }}
                    title={fabricSimulationActive ? "Freeze Motion" : "Simulate Fabric Drapes"}
                    className={`p-2.5 rounded-md transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                      fabricSimulationActive 
                        ? "bg-black text-white dark:bg-white dark:text-black shadow-md" 
                        : "bg-white/40 text-black dark:bg-black/40 dark:text-white hover:bg-white/60 dark:hover:bg-black/60"
                    }`}
                  >
                    <Wind size={14} />
                  </button>

                  {fabricSimulationActive && (
                    <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-black/10 dark:border-white/10 fade-up">
                      <span className="text-[7.5px] font-bold tracking-widest text-secondary uppercase">
                        Wind
                      </span>
                      <div className="h-24 py-1 flex items-center justify-center">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={windSpeed}
                          onChange={(e) => setWindSpeed(Number(e.target.value))}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-black dark:accent-white cursor-pointer h-full w-1 rounded-full bg-neutral-200 dark:bg-neutral-800"
                          style={{ writingMode: "vertical-lr", direction: "rtl", WebkitAppearance: "slider-vertical" }}
                        />
                      </div>
                      <span className="text-[8.5px] font-bold text-primary">
                        {windSpeed}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 glass-panel px-3 py-1.5 rounded-sm flex items-center gap-2 text-[10px] text-primary">
                  <span className={`w-2 h-2 rounded-full ${fabricSimulationActive ? "bg-green-500 animate-pulse" : "bg-neutral-400"}`} />
                  <span className="font-semibold uppercase tracking-wider">
                    Fabric Simulation: {fabricSimulationActive ? "ON" : "OFF"}
                  </span>
                </div>

                {rotationImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-[8px] font-bold tracking-widest text-white px-2 py-1 uppercase rounded-sm">
                    Angle {rotationIndex + 1} / {rotationImages.length}
                  </div>
                )}
              </div>
            </div>

            {/* Loop video short embedded inside image stack (only if video URL is present) */}
            {product.cinematic_video_url && (
              <div className="aspect-[16/9] w-full bg-white rounded-lg overflow-hidden border border-rule relative">
                <video
                  src={product.cinematic_video_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-primary text-[9px] font-bold tracking-widest uppercase">
                  {product.brand?.name} Lookbook Motion Reel
                </div>
              </div>
            )}

            {/* Flat look static image */}
            <div className="bg-surface-bright overflow-hidden rounded-lg border border-rule relative">
              <img
                src={product.main_image_url}
                alt={product.name}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Right Column: Sticky Product Info & Actions Panel */}
          <div className="lg:sticky lg:top-28 space-y-10 fade-up" style={{ animationDelay: "100ms" }}>
            
            {/* Header info */}
            <div className="space-y-6">
              <div className="flex justify-between items-baseline border-b border-rule pb-4">
                <div className="space-y-1">
                  {product.brand && (
                    <Link
                      to={`/brands/${product.brand.slug}`}
                      className="text-xs font-bold tracking-[0.2em] uppercase text-secondary hover:text-black transition-colors hover:underline"
                    >
                      {product.brand.name}
                    </Link>
                  )}
                  {product.gender && (
                    <p className="text-[10px] text-secondary tracking-widest uppercase">{product.gender} Collection</p>
                  )}
                </div>
                {product.stock_quantity < 10 ? (
                  <span className="text-[10px] font-bold tracking-widest uppercase text-red-500 bg-red-50 px-2 py-1 rounded-sm">
                    Low Stock ({product.stock_quantity})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold tracking-widest uppercase text-green-600 bg-green-50 px-2 py-1 rounded-sm">
                    In Stock
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="heading-serif text-4xl md:text-5xl text-primary leading-tight font-light">
                  {product.name}
                </h1>
                <p className="text-2xl font-light text-primary tracking-wide">
                  {formatPrice(product.price)}
                </p>
              </div>

              {product.description && (
                <p className="text-secondary text-sm font-light leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* ── Size Selection ──────────────────────────────────────────── */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-rule text-start">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
                    {t("size")}
                  </span>
                  {!selectedSize && (
                    <span className="text-[9px] text-red-400 font-semibold tracking-wider uppercase animate-pulse">
                      {language === "en" ? "Choose a size to continue" : "يرجى اختيار مقاس للاستمرار"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(({ size, stock }) => {
                    const isOOS = stock === 0;
                    const isLowStock = stock > 0 && stock <= 2;
                    const isSelected = selectedSize === size;

                    return (
                      <div key={size} className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          disabled={isOOS}
                          onClick={() => setSelectedSize(size)}
                          className={`relative w-12 h-12 border text-xs font-bold tracking-widest uppercase transition-all duration-200 rounded-sm
                            ${
                              isOOS
                                ? "border-rule text-secondary/40 cursor-not-allowed line-through"
                                : isSelected
                                ? "border-black bg-black text-white shadow-md"
                                : "border-rule text-primary hover:border-black hover:bg-neutral-50"
                            }
                          `}
                        >
                          {size}
                          {isOOS && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" title="Out of Stock" />
                          )}
                        </button>
                        {isLowStock && (
                          <span className="text-[8px] font-bold text-amber-500 tracking-wider uppercase">
                            Only {stock} left
                          </span>
                        )}
                        {isOOS && (
                          <span className="text-[8px] font-bold text-red-400 tracking-wider uppercase">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Purchase CTA Actions */}
            <div className="space-y-4 pt-4 border-t border-rule">
              <button
                id="pdp-add-to-bag"
                onClick={handleAddToCart}
                disabled={
                  product.stock_quantity === 0 ||
                  (product.sizes && product.sizes.length > 0 && !selectedSize)
                }
                className="w-full btn-black py-4.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <ShoppingBag size={14} />
                <span>
                  {added
                    ? (language === "en" ? "Added to Bag" : "تمت الإضافة للحقيبة")
                    : product.sizes && product.sizes.length > 0 && !selectedSize
                    ? (language === "en" ? "Select a Size" : "اختر المقاس")
                    : t("add_to_cart")}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`w-full btn-outline py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                    isInWishlist ? "bg-black text-white" : ""
                  }`}
                >
                  <Heart size={13} className={isInWishlist ? "fill-white text-white" : "text-black"} />
                  <span>{isInWishlist ? (language === "en" ? "Wishlisted" : "في المفضلة") : t("wishlist")}</span>
                </button>

                <button
                  onClick={handleScrollToTryon}
                  className="w-full btn-outline py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 bg-[#f2f1ed]"
                >
                  <Sparkles size={13} className="text-black" />
                  <span>{t("ai_tryon")}</span>
                </button>
              </div>

              {/* WhatsApp Order CTA */}
              <a
                href={`https://wa.me/9647800000000?text=${encodeURIComponent(
                  `مرحباً، أود الاستفسار عن/طلب قطعة: ${product.name}\nالمقاس: ${selectedSize || "غير محدد"}\nالسعر: ${formatPrice(product.price)}\nالرابط: ${window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 rounded-lg transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.51 1.451 5.467 1.453 5.518 0 10.007-4.49 10.01-10.01.002-2.673-1.03-5.187-2.906-7.067C17.348 1.65 14.846.618 12.188.618c-5.524 0-10.014 4.49-10.017 10.01-.001 1.879.487 3.717 1.417 5.32L2.553 21.6l5.772-1.513c1.558.85 3.298 1.298 5.048 1.298z"/>
                  <path d="M17.472 14.382c-.302-.151-1.787-.88-2.057-.98-.27-.1-.466-.151-.66.15-.195.3-.755.95-.925 1.14-.17.19-.34.21-.64.06-1.396-.7-2.42-1.24-3.23-2.64-.216-.37.215-.34.618-1.14.075-.15.038-.28-.019-.38-.057-.1-.466-1.12-.64-1.54-.17-.41-.357-.35-.488-.36l-.417-.01c-.143 0-.377.05-.574.27-.197.22-.755.74-.755 1.8 0 1.06.772 2.09.88 2.24.11.15 1.516 2.316 3.67 3.248 1.34.58 1.83.69 2.478.6.35-.05 1.787-.73 2.04-1.4.254-.67.254-1.24.18-1.35-.07-.12-.27-.19-.57-.34z"/>
                </svg>
                <span>{language === "en" ? "Order via WhatsApp" : "الطلب عبر واتساب"}</span>
              </a>

              {/* AI Sizing Trigger link */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowSizeAdvisor(true)}
                  className="inline-flex items-center gap-1.5 text-[10px] text-secondary hover:text-black font-bold uppercase tracking-widest hover:underline"
                >
                  <HelpIcon size={12} />
                  <span>{language === "en" ? "Find Your Size with AI Advisor" : "اعثر على مقاسك بمستشار الذكاء الاصطناعي"}</span>
                </button>
              </div>
            </div>

            {/* Product Details Grid — Essential buyer info */}
            {(product.garment_length || product.color || product.material_details || product.origin_country) && (
              <div className="pt-6 border-t border-rule text-start">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-primary mb-4 flex items-center gap-2">
                  <span>{language === "en" ? "Product Details" : "تفاصيل القطعة"}</span>
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {product.garment_length && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">📏</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Length" : "الطول"}</p>
                        <p className="text-xs font-medium text-primary">{product.garment_length}</p>
                      </div>
                    </div>
                  )}
                  {product.material_details && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">🧵</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Fabric" : "القماش"}</p>
                        <p className="text-xs font-medium text-primary">{product.material_details}</p>
                      </div>
                    </div>
                  )}
                  {product.color && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">🎨</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Color" : "اللون"}</p>
                        <p className="text-xs font-medium text-primary">{product.color}</p>
                      </div>
                    </div>
                  )}
                  {product.origin_country && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">🌍</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Origin" : "بلد المنشأ"}</p>
                        <p className="text-xs font-medium text-primary">{product.origin_country}</p>
                      </div>
                    </div>
                  )}
                  {product.garment_weight && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">⚖️</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Weight" : "الوزن"}</p>
                        <p className="text-xs font-medium text-primary">{product.garment_weight}</p>
                      </div>
                    </div>
                  )}
                  {product.sleeve_length && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">👗</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Sleeves" : "الأكمام"}</p>
                        <p className="text-xs font-medium text-primary">{product.sleeve_length}</p>
                      </div>
                    </div>
                  )}
                  {product.closure_type && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">📎</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Closure" : "نوع الإغلاق"}</p>
                        <p className="text-xs font-medium text-primary">{product.closure_type}</p>
                      </div>
                    </div>
                  )}
                  {product.lining && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-secondary shrink-0">🏷️</span>
                      <div>
                        <p className="text-[9px] font-bold tracking-wider uppercase text-secondary">{language === "en" ? "Lining" : "البطانة"}</p>
                        <p className="text-xs font-medium text-primary">{product.lining}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Luxury Details Accordions */}
            <div className="pt-6 border-t border-rule space-y-1 text-start">
              <AccordionItem
                title={language === "en" ? "Composition & Care" : "التركيب والعناية"}
                isOpen={activeAccordion === "composition"}
                onToggle={() => handleAccordionToggle("composition")}
              >
                <p><strong>{language === "en" ? "Fabric: " : "القماش: "}</strong> {product.material_details || product.fabric_type || (language === "en" ? "Premium imported fabrics" : "أقمشة فاخرة مستوردة")}</p>
                <p><strong>{language === "en" ? "Care: " : "العناية: "}</strong> {product.care_instructions || (language === "en" ? "Follow label instructions" : "اتبع تعليمات الملصق الداخلي")}</p>
              </AccordionItem>

              <AccordionItem
                title={language === "en" ? "Sizing & Fit" : "المقاسات والتنسيق"}
                isOpen={activeAccordion === "sizing"}
                onToggle={() => handleAccordionToggle("sizing")}
              >
                <p><strong>{language === "en" ? "Sizing System: " : "نظام المقاسات: "}</strong> {product.size_type || (language === "en" ? "Standard European sizing" : "مقاسات أوروبية قياسية")}</p>
                {product.garment_length && <p><strong>{language === "en" ? "Length: " : "طول القطعة: "}</strong> {product.garment_length}</p>}
                <p>{language === "en" ? "We recommend choosing your standard size or using the AI Advisor." : "ننصح باختيار مقاسك المعتاد أو استخدام مستشار المقاسات الذكي."}</p>
              </AccordionItem>

              <AccordionItem
                title={language === "en" ? "Shipping & Returns" : "الشحن والإرجاع"}
                isOpen={activeAccordion === "shipping"}
                onToggle={() => handleAccordionToggle("shipping")}
              >
                <p>{language === "en" ? "📦 Fast delivery to all Iraq provinces in 2-5 business days." : "📦 شحن سريع لجميع محافظات العراق خلال 2-5 أيام عمل."}</p>
                <p>{language === "en" ? "🚚 Free shipping on orders over 150,000 IQD." : "🚚 شحن مجاني للطلبات فوق 150,000 د.ع."}</p>
                <p>{language === "en" ? "↩️ Free returns within 14 days of receipt." : "↩️ إرجاع مجاني خلال 14 يوم من تاريخ الاستلام."}</p>
                <p>{language === "en" ? "📞 For inquiries, contact us via WhatsApp." : "📞 للاستفسار تواصل عبر واتساب."}</p>
              </AccordionItem>
            </div>
          </div>
        </div>
        {/* AI SIZE ADVISOR DIALOG OVERLAY */}
        <AnimatePresence>
          {showSizeAdvisor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-6"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowSizeAdvisor(false);
                  setSizeRecommendation("");
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-neutral-900 border border-rule max-w-lg w-full p-8 space-y-6 rounded-sm shadow-2xl relative text-primary"
              >
                <button
                  onClick={() => {
                    setShowSizeAdvisor(false);
                    setSizeRecommendation("");
                  }}
                  className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors text-lg"
                >
                  ✕
                </button>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-secondary" />
                    <h3 className="heading-serif text-2xl text-primary">Neural Sizing Advisor</h3>
                  </div>
                  <p className="text-secondary text-xs font-light leading-relaxed">
                    Compare your measurements and reference house fittings to calculate your tailored Vrital drape silhouette.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-secondary mb-2">
                      Reference House
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full p-3 border border-rule outline-none text-xs uppercase font-semibold cursor-pointer bg-transparent"
                    >
                      <option value="">-- Choose Brand --</option>
                      <option value="Zara">Zara</option>
                      <option value="Gucci">Gucci</option>
                      <option value="Prada">Prada</option>
                      <option value="Nike">Nike</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-secondary mb-2">
                      Reference Size
                    </label>
                    <select
                      value={selectedBrandSize}
                      onChange={(e) => setSelectedBrandSize(e.target.value)}
                      className="w-full p-3 border border-rule outline-none text-xs uppercase font-semibold cursor-pointer bg-transparent"
                    >
                      <option value="">-- Select Size --</option>
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-secondary mb-1">
                      Body Height (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 175"
                      className="w-full p-3 border border-rule outline-none text-xs"
                      defaultValue={user?.height || 175}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-secondary mb-1">
                      Body Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      className="w-full p-3 border border-rule outline-none text-xs"
                      defaultValue={user?.weight || 70}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCalculateSize}
                  disabled={!selectedBrand || !selectedBrandSize}
                  className="w-full btn-black py-3.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30"
                >
                  Compute Silhouette Mapping
                </button>

                {sizeRecommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-5 bg-neutral-50 dark:bg-neutral-800 border border-rule space-y-4 rounded-sm"
                  >
                    <div className="text-center">
                      <p className="text-[9px] font-bold tracking-widest text-secondary uppercase">
                        Recommended Vrital Fit
                      </p>
                      <p className="text-4xl font-light text-primary mt-1">{sizeRecommendation}</p>
                      <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mt-1">
                        94% Contour Match Confidence
                      </p>
                    </div>

                    <div className="border-t border-rule pt-3.5 text-[11px] font-light text-secondary space-y-1.5">
                      <div className="flex justify-between">
                        <span>Shoulder & Chest:</span>
                        <span className="font-semibold text-primary">Contoured drape layout</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Waistline:</span>
                        <span className="font-semibold text-primary">Perfect drape balance (+1cm ease)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Garment Length:</span>
                        <span className="font-semibold text-primary">Classic luxury length</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fitting Room section */}
        <section
          id="fitting-room"
          className="mt-28 border border-rule rounded-xl bg-white overflow-hidden shadow-sm flex flex-col"
        >
          <div className="bg-[#fcfcfa] text-primary p-8 md:p-12 flex flex-col md:flex-row justify-between items-baseline gap-6 border-b border-rule">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-secondary animate-pulse" />
                <span className="text-[9px] font-bold tracking-[0.25em] text-secondary uppercase">
                  غرفة القياس الذكية / Fitting Room
                </span>
              </div>
              <h2 className="heading-serif text-3xl md:text-5xl font-light">
                القياس الافتراضي
              </h2>
            </div>
            <p className="text-secondary text-xs md:text-sm font-light max-w-sm leading-relaxed">
              شاهد كيف ستبدو قطعة {product.name} عليك. اختر عارضاً افتراضياً أو ارفع صورتك الشخصية لتجربتها بالذكاء الاصطناعي في ثوانٍ.
            </p>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rule">
            
            {/* Input Zone */}
            <div className="p-8 md:p-12 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-xs font-bold tracking-widest uppercase">
                    1. Upload Portrait
                  </h3>
                  {userFile && (
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Check size={12} /> Image Ready
                    </span>
                  )}
                </div>
                <div className="w-full max-w-sm aspect-[3/4] mx-auto overflow-hidden relative rounded-lg border border-rule bg-white">
                  <UploadBox
                    onUpload={(file) => {
                      setUserFile(file);
                      setUserImagePreview(URL.createObjectURL(file));
                    }}
                    preview={userImagePreview}
                  />
                </div>
              </div>

              {userFile && !tryonResult && (
                <div className="pt-2">
                  {tryonError && (
                    <div className="flex items-center gap-2 text-red-500 text-xs mb-3 font-semibold">
                      <AlertCircle size={14} />
                      {tryonError}
                    </div>
                  )}
                  <button
                    id="pdp-generate-tryon"
                    onClick={handleTryOnGenerate}
                    disabled={tryonLoading}
                    className="w-full btn-black py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    {tryonLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Tailoring...</span>
                      </>
                    ) : tryonError ? (
                      <>
                        <RotateCcw size={14} />
                        <span>Retry Synthesis</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Synthesize Silhouette</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Output Zone */}
            <div className="p-8 md:p-12 bg-surface-bright flex flex-col justify-between min-h-[400px]">
              <div className="space-y-4 flex-grow flex flex-col">
                <h3 className="text-xs font-bold tracking-widest uppercase border-b border-rule pb-3.5">
                  2. Rendered Silhouette
                </h3>

                <div className="flex-grow flex items-center justify-center relative rounded-lg overflow-hidden mt-4">
                  {tryonResult ? (
                    <div className="w-full h-full max-w-sm aspect-[3/4] mx-auto overflow-hidden relative group shadow-lg border border-rule bg-white rounded-lg">
                      <img
                        src={tryonResult}
                        alt="Tryon Result"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : tryonLoading ? (
                    <div className="text-center space-y-6">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-rule animate-[spin_3s_linear_infinite]" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-black animate-spin" />
                        <Sparkles size={20} className="absolute inset-0 m-auto text-primary animate-pulse" />
                      </div>
                      <div className="space-y-2 flex flex-col items-center">
                        <p className="text-xs font-bold tracking-widest uppercase">{loadingPhase}</p>
                        <div className="w-40 bg-neutral-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-black rounded-full transition-all duration-300"
                            style={{ width: `${tryonProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-secondary font-semibold">{tryonProgress}% completed</p>
                      </div>
                      {tryonDelayed && (
                        <div className="space-y-3 pt-2">
                          <p className="text-[11px] text-amber-600 font-medium animate-pulse">
                            Generation is taking longer than expected.
                          </p>
                          <button
                            onClick={handleTryOnGenerate}
                            className="btn-black py-2.5 px-6 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 mx-auto hover:bg-neutral-800 transition-colors"
                          >
                            <RotateCcw size={12} />
                            <span>Retry Synthesis</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : tryonError ? (
                    <div className="text-center space-y-4 max-w-xs p-6 bg-red-50/50 border border-red-100 rounded-lg">
                      <AlertCircle size={28} className="mx-auto text-red-500" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold tracking-widest uppercase text-red-600">Generation Failed</p>
                        <p className="text-[11px] text-red-500 font-light leading-relaxed">{tryonError}</p>
                      </div>
                      <button
                        onClick={handleTryOnGenerate}
                        className="btn-black py-2.5 px-6 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 mx-auto hover:bg-neutral-800 transition-colors"
                      >
                        <RotateCcw size={12} />
                        <span>Retry Synthesis</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center opacity-40 space-y-3">
                      <Sparkles size={28} className="mx-auto text-secondary" strokeWidth={1.2} />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-secondary">
                        Awaiting Silhouette
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {tryonResult && (
                <div className="pt-8 flex gap-4 w-full max-w-sm mx-auto">
                  <button
                    onClick={() => window.open(tryonResult, "_blank")}
                    className="flex-1 btn-outline py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-grow btn-black py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={14} />
                    <span>Buy Piece</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Stylist Recommendations rail */}
        {recommendations.length > 0 && (
          <section className="mt-28 space-y-8 text-start">
            <div className="border-b border-rule pb-4">
              <span className="text-[9px] font-bold tracking-[0.3em] text-secondary uppercase block mb-1">
                {language === "en" ? "ATELIER CURATION" : "تنسيقات الأتيلييه"}
              </span>
              <h2 className="heading-serif text-3xl font-light text-primary">
                {language === "en" ? "Complete The Look" : "أكمل المظهر"}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  to={`/brands/${brand_slug || rec.brand?.slug || 'zara'}/product/${rec.id}`}
                  className="group block space-y-3"
                >
                  <div className="aspect-[3/4] bg-white border border-rule overflow-hidden rounded-sm relative">
                    <img
                      src={rec.main_image_url}
                      alt={rec.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    {rec.mood_aesthetic && (
                      <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[8px] font-bold tracking-wider text-black px-2 py-0.5 uppercase">
                        {rec.mood_aesthetic}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <p className="text-[10px] font-bold uppercase text-secondary truncate">{rec.brand?.name}</p>
                      <p className="text-[10px] font-light text-primary">{formatPrice(rec.price)}</p>
                    </div>
                    <p className="text-xs font-semibold text-primary group-hover:underline truncate">{rec.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

