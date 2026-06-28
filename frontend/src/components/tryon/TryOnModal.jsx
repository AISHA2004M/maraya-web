/**
 * TryOnModal — AI Virtual Try-On Experience
 * ==========================================
 * Optimized loading pipeline with < 300ms first visual response.
 *
 * Stage lifecycle:
 *   idle → preparing → generating → result | error
 *
 * Features:
 *   - Instant skeleton UI on click (< 300ms)
 *   - Animated shimmer silhouette placeholder
 *   - Simulated 0–100% progress bar synced with real backend status
 *   - "This may take a few more seconds…" message after 10s
 *   - Cancel button during generation
 *   - Blocks duplicate requests
 *   - Before/After comparison slider on result
 *   - Retry + Download actions
 *   - Guest-friendly (no auth required)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, Loader2, AlertCircle, RotateCcw,
  Download, ChevronRight, ImageIcon, CheckCircle2,
  Camera, XCircle, Clock
} from "lucide-react";
import { submitTryOn, waitForTryOnResult, pollTryOnStatus, getTryOnResult } from "../../api/tryon";
import { useUserStore } from "../../store/useUserStore";

const PRESET_MODELS = [
  {
    id: "female_slim",
    name: "عارضة ممشوقة (Slim)",
    gender: "female",
    size: "S / M",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "female_medium",
    name: "عارضة قوام معتدل (Medium)",
    gender: "female",
    size: "M / L",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "female_plus",
    name: "عارضة قوام ممتلئ (Plus Size)",
    gender: "female",
    size: "XL / XXL",
    url: "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "male_slim",
    name: "عارض ممشوق (Slim)",
    gender: "male",
    size: "M",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "male_medium",
    name: "عارض قوام معتدل (Medium)",
    gender: "male",
    size: "L / XL",
    url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=500&auto=format&fit=crop",
  }
];

const urlToFile = async (url, filename) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/jpeg" });
};

// ─── Stage definitions ────────────────────────────────────────────────────────

const STAGES = {
  idle: "idle",
  preparing: "preparing",   // < 300ms: instant skeleton
  generating: "generating",  // AI processing
  result: "result",
  error: "error",
};

// Simulated progress checkpoints synced to backend polling states
// Real progress will jump ahead if backend completes early
const PROGRESS_TIMELINE = [
  { at: 0, pct: 5, label: "Preparing your silhouette…" },
  { at: 1, pct: 18, label: "Uploading portrait…" },
  { at: 3, pct: 35, label: "Analyzing body contours…" },
  { at: 6, pct: 52, label: "Extracting garment texture…" },
  { at: 9, pct: 67, label: "Compositing garment layers…" },
  { at: 12, pct: 78, label: "Neural drape rendering…" },
  { at: 16, pct: 88, label: "Finalising silhouette…" },
  { at: 20, pct: 94, label: "Almost ready…" },
];

// ─── Shimmer silhouette skeleton ──────────────────────────────────────────────

function SilhouetteSkeleton({ pct, label, isDelayed, onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 p-8">

      {/* Animated silhouette figure */}
      <div className="relative w-28 h-52 flex-shrink-0">
        {/* Body shimmer shape */}
        <div className="absolute inset-0 rounded-[50%_50%_40%_40%/60%_60%_40%_40%] bg-gradient-to-b from-neutral-200 to-neutral-300 animate-pulse overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animation: "shimmer 1.8s infinite", backgroundSize: "200% 100%" }}
          />
        </div>
        {/* Head */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-neutral-200 animate-pulse overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animation: "shimmer 1.8s infinite 0.3s", backgroundSize: "200% 100%" }}
          />
        </div>
        {/* Arms */}
        <div className="absolute top-8 -left-5 w-5 h-24 rounded-full bg-neutral-200 animate-pulse -rotate-6" />
        <div className="absolute top-8 -right-5 w-5 h-24 rounded-full bg-neutral-200 animate-pulse rotate-6" />
        {/* Legs */}
        <div className="absolute -bottom-20 left-4 w-8 h-24 rounded-full bg-neutral-200 animate-pulse -rotate-2" />
        <div className="absolute -bottom-20 right-4 w-8 h-24 rounded-full bg-neutral-200 animate-pulse rotate-2" />

        {/* Sparkle overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Sparkles size={20} className="text-black/20 animate-pulse" />
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-2 text-center max-w-[220px]">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-secondary">
          Vrital AI · Neural Drape Engine
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-light text-primary leading-relaxed"
          >
            {label}
          </motion.p>
        </AnimatePresence>
        {isDelayed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-red-500 font-semibold tracking-wider animate-pulse"
          >
            High demand, this may take a bit longer...
          </motion.p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[220px] space-y-1.5">
        <div className="flex justify-between text-[9px] text-secondary font-semibold">
          <span className="uppercase tracking-widest">Generating</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-[10px] text-secondary hover:text-red-500 font-semibold uppercase tracking-widest transition-colors"
      >
        <XCircle size={12} />
        Cancel
      </button>
    </div>
  );
}

// ─── Preparing skeleton (instant on click) ────────────────────────────────────

function PreparingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-5 p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border border-neutral-200 rounded-full animate-[spin_6s_linear_infinite]" />
        <div className="absolute inset-1.5 border-t-2 border-black rounded-full animate-[spin_2s_linear_infinite]" />
        <Sparkles size={16} className="absolute inset-0 m-auto text-black animate-pulse" />
      </div>
      <div className="space-y-2 text-center">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-secondary">
          Vrital AI · Fitting Room
        </p>
        <p className="text-sm font-light text-primary">Preparing Try-On…</p>
      </div>
      {/* Shimmer skeleton row */}
      <div className="w-full max-w-[220px] space-y-2">
        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-neutral-300 rounded-full animate-[progressScan_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="text-center text-[9px] text-secondary/50 uppercase tracking-widest">
          Connecting to AI engine…
        </p>
      </div>
    </div>
  );
}

// ─── Portrait uploader ────────────────────────────────────────────────────────

function PortraitUploader({ preview, onUpload, onClear, disabled }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) onUpload(f);
  }, [onUpload, disabled]);

  if (preview) {
    return (
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-rule group">
        <img src={preview} alt="Your portrait" className="w-full h-full object-cover" />
        {!disabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onClear}
              className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm flex items-center gap-2 hover:bg-neutral-100 transition-colors"
            >
              <RotateCcw size={11} /> Change Photo
            </button>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest px-2 py-1 uppercase rounded-sm">
          Your Portrait
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`w-full aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-all duration-200 ${disabled ? "opacity-40 cursor-not-allowed" :
          isDragOver ? "border-black bg-neutral-50 scale-[1.01] cursor-copy" :
            "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50 cursor-pointer"
        }`}
    >
      <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
        <Camera size={22} className="text-neutral-400" />
      </div>
      <div className="text-center space-y-1 px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Upload Your Photo</p>
        <p className="text-[11px] text-secondary font-light leading-relaxed">
          Drag & drop or click to browse<br />JPEG · PNG · WebP · Max 10 MB
        </p>
      </div>
      <p className="text-[9px] text-secondary/60 uppercase tracking-widest">
        Front-facing portrait works best
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); }}
      />
    </div>
  );
}

// ─── Before/After comparison slider ──────────────────────────────────────────

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

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function TryOnModal({ isOpen, onClose, product }) {
  const [portrait, setPortrait] = useState(null);
  const [portraitPreview, setPortraitPreview] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [loadingPresetId, setLoadingPresetId] = useState(null);
  const [stage, setStage] = useState(STAGES.idle);
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState(PROGRESS_TIMELINE[0].label);
  const [isDelayed, setIsDelayed] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [modelVariant, setModelVariant] = useState("balanced"); // fast | balanced | quality
  const { token, user } = useUserStore();

  const handleSelectPreset = async (model) => {
    if (stage === STAGES.preparing || stage === STAGES.generating) return;
    setLoadingPresetId(model.id);
    setError(null);
    try {
      const file = await urlToFile(model.url, `${model.id}.jpg`);
      setPortrait(file);
      setPortraitPreview(model.url);
      setSelectedPresetId(model.id);
    } catch (err) {
      console.error("Failed to load preset model image", err);
      setError("فشل تحميل صورة العارض الجاهزة. يرجى محاولة رفع صورتك بدلاً من ذلك.");
    } finally {
      setLoadingPresetId(null);
    }
  };

  // Refs for cleanup
  const cancelRef = useRef(false);      // Set true on cancel to abort polling
  const pollingOptionsRef = useRef({ cancelled: false });
  const progressRef = useRef(null);     // setInterval for progress simulation
  const delayTimerRef = useRef(null);   // setTimeout for 10s delay message
  const startTimeRef = useRef(0);

  // Reset everything on close
  useEffect(() => {
    if (!isOpen) {
      cancelRef.current = true;
      pollingOptionsRef.current.cancelled = true;
      clearInterval(progressRef.current);
      clearTimeout(delayTimerRef.current);
      setTimeout(() => {
        setPortrait(null);
        setPortraitPreview(null);
        setSelectedPresetId(null);
        setLoadingPresetId(null);
        setStage(STAGES.idle);
        setPct(0);
        setLabel(PROGRESS_TIMELINE[0].label);
        setIsDelayed(false);
        setResult(null);
        setError(null);
        cancelRef.current = false;
      }, 350); // wait for exit animation
    }
  }, [isOpen]);

  // Reset everything when product ID changes
  useEffect(() => {
    cancelRef.current = true;
    pollingOptionsRef.current.cancelled = true;
    clearInterval(progressRef.current);
    clearTimeout(delayTimerRef.current);
    setPortrait(null);
    setPortraitPreview(null);
    setSelectedPresetId(null);
    setLoadingPresetId(null);
    setStage(STAGES.idle);
    setPct(0);
    setLabel(PROGRESS_TIMELINE[0].label);
    setIsDelayed(false);
    setResult(null);
    setError(null);
    cancelRef.current = false;
  }, [product?.id]);

  // Simulate progress advances on a timeline
  const startProgressSimulation = () => {
    let stepIdx = 0;
    startTimeRef.current = Date.now();

    const tick = () => {
      if (cancelRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Find the last checkpoint whose time we've passed
      let current = PROGRESS_TIMELINE[0];
      for (const checkpoint of PROGRESS_TIMELINE) {
        if (elapsed >= checkpoint.at) current = checkpoint;
        else break;
      }
      setPct(current.pct);
      setLabel(current.label);
    };

    progressRef.current = setInterval(tick, 500);

    // 35-second delay message
    delayTimerRef.current = setTimeout(() => {
      if (!cancelRef.current) setIsDelayed(true);
    }, 35_000);
  };

  const stopProgress = (finalPct = 100) => {
    clearInterval(progressRef.current);
    clearTimeout(delayTimerRef.current);
    setPct(finalPct);
    setIsDelayed(false);
  };

  const handlePortraitUpload = (file) => {
    // Preload into browser cache immediately
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    setPortrait(file);
    setPortraitPreview(url);
    setError(null);
    setResult(null);
    if (stage === STAGES.error) setStage(STAGES.idle);
  };

  const handleGenerate = async () => {
    if (!portrait || !product?.id || stage === STAGES.preparing || stage === STAGES.generating) return;

    cancelRef.current = false;
    pollingOptionsRef.current = { cancelled: false };

    // ── STEP 1: Instant < 300ms visual response ────────────────────────
    setStage(STAGES.preparing);
    setPct(5);
    setLabel("Preparing your silhouette…");
    setError(null);
    setResult(null);

    // Also preload the product image into browser cache
    if (product.main_image_url) {
      const img = new Image();
      img.src = product.main_image_url;
    }

    // Small yield so React flushes the skeleton frame before the API call
    await new Promise((r) => setTimeout(r, 80));
    if (cancelRef.current) return;

    // ── STEP 2: Move to generating + start progress sim ────────────────
    setStage(STAGES.generating);
    startProgressSimulation();

    try {
      const extraPayload = {};
      if (user) {
        if (user.height) extraPayload.height = user.height;
        if (user.weight) extraPayload.weight = user.weight;
        if (user.body_bust) extraPayload.body_bust = user.body_bust;
        if (user.body_waist) extraPayload.body_waist = user.body_waist;
        if (user.body_hips) extraPayload.body_hips = user.body_hips;
        extraPayload.avatar = "Athletic M";
      }
      const dispatch = await submitTryOn(portrait, product.id, modelVariant, extraPayload);
      if (cancelRef.current) return;

      // Stop the client-side simulation timer and rely on backend progress updates
      clearInterval(progressRef.current);

      const jobId = dispatch.job_id || dispatch.session_id;

      if (dispatch.status === "completed" || dispatch.progress === 100) {
        // Cache hit / sync completion
        const resultRes = await getTryOnResult(jobId);
        if (cancelRef.current) return;
        stopProgress(100);
        setResult(resultRes.result_image_url);
        setStage(STAGES.result);
      } else {
        // Async mode — poll with real status + progress updates
        const resultUrl = await waitForTryOnResult(
          jobId,
          (progressPct, jobStatus) => {
            if (cancelRef.current) return;
            setPct(progressPct);
            // Dynamically set label based on progress range
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
        if (cancelRef.current) return;
        stopProgress(100);
        setResult(resultUrl);
        setStage(STAGES.result);
      }
    } catch (err) {
      if (cancelRef.current) return;
      stopProgress(0);
      setError(err.response?.data?.detail || err.message || "Try-on generation failed. Please try again.");
      setStage(STAGES.error);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    pollingOptionsRef.current.cancelled = true;
    stopProgress(0);
    setStage(STAGES.idle);
    setError(null);
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setStage(STAGES.idle);
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const res = await fetch(result);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vrital-silhouette-${product?.name?.replace(/\s+/g, "-").toLowerCase() || "result"}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(result, "_blank");
    }
  };

  const isGenerating = stage === STAGES.preparing || stage === STAGES.generating;
  const canGenerate = !!portrait && !!product?.id && !isGenerating;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={(e) => { if (e.target === e.currentTarget && !isGenerating) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="bg-white dark:bg-neutral-950 w-full max-w-4xl max-h-[92vh] rounded-xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isGenerating ? "bg-black" : "bg-black"}`}>
                  {isGenerating
                    ? <Loader2 size={14} className="text-white animate-spin" />
                    : <Sparkles size={14} className="text-white" />
                  }
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-wider uppercase text-primary">
                    AI Fitting Room
                  </h2>
                  <p className="text-[10px] text-secondary font-light">
                    {product?.brand?.name && `${product.brand.name} · `}{product?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isGenerating && onClose()}
                disabled={isGenerating}
                className="w-8 h-8 rounded-full border border-rule flex items-center justify-center text-secondary hover:text-primary hover:border-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X size={14} />
              </button>
            </div>

            {/* ── Body ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid md:grid-cols-[1fr_1fr] h-full min-h-[500px]">

                {/* Left: Controls */}
                <div className="p-6 space-y-5 border-r border-rule flex flex-col">

                  {/* Step 1: Portrait */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Portrait / عارض القياس</span>
                    </div>
                    <PortraitUploader
                      preview={portraitPreview}
                      onUpload={(file) => {
                        handlePortraitUpload(file);
                        setSelectedPresetId(null);
                      }}
                      onClear={() => { setPortrait(null); setPortraitPreview(null); setSelectedPresetId(null); }}
                      disabled={isGenerating}
                    />

                    {/* Preset Models selection */}
                    {!isGenerating && !portraitPreview && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-secondary block">
                          أو اختر عارضاً افتراضياً (Or Choose a Preset Model):
                        </span>
                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                          {PRESET_MODELS.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              disabled={isGenerating || loadingPresetId}
                              onClick={() => handleSelectPreset(model)}
                              className={`flex flex-col items-center shrink-0 p-1.5 rounded-lg border transition-all ${selectedPresetId === model.id
                                  ? "border-black bg-black/5 dark:bg-white/5"
                                  : "border-neutral-200 hover:border-neutral-400 bg-white dark:bg-neutral-900"
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
                  </div>

                  {/* Step 2: Product */}
                  {/* Step 2: Product */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Selected Piece</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border border-rule rounded-lg bg-neutral-50/50">
                      <div className="w-16 h-20 rounded-md overflow-hidden border border-rule shrink-0 bg-white">
                        {product?.main_image_url
                          ? <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-neutral-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        {product?.brand?.name && (
                          <p className="text-[9px] font-bold uppercase tracking-widest text-secondary">{product.brand.name}</p>
                        )}
                        <p className="text-sm font-medium text-primary truncate">{product?.name}</p>
                        {product?.price && (
                          <p className="text-xs text-secondary font-light mt-0.5">${Number(product.price).toFixed(2)}</p>
                        )}
                      </div>
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    </div>
                  </div>

                  {/* Step 3: Model Engine Option */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Engine Profile</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "fast", label: "Fast", desc: "Lower res (~0.5s)" },
                        { id: "balanced", label: "Balanced", desc: "Standard (~1.5s)" },
                        { id: "quality", label: "Quality", desc: "High details (~3s)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => setModelVariant(opt.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${modelVariant === opt.id
                              ? "border-black bg-black text-white"
                              : "border-neutral-200 hover:border-neutral-400 text-neutral-600 bg-white"
                            }`}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-wider">{opt.label}</span>
                          <span className={`text-[7px] mt-0.5 leading-tight ${modelVariant === opt.id ? "text-neutral-300" : "text-neutral-400"}`}>
                            {opt.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>


                  {/* Actions */}
                  <div className="mt-auto space-y-3 pt-2">

                    {/* Error state */}
                    {stage === STAGES.error && error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600"
                      >
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <p className="text-xs leading-relaxed">{error}</p>
                      </motion.div>
                    )}

                    {/* Result actions */}
                    {stage === STAGES.result ? (
                      <div className="flex gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex-1 border border-rule py-3 text-xs font-bold tracking-widest uppercase rounded-lg hover:border-black transition-colors flex items-center justify-center gap-2 text-primary"
                        >
                          <RotateCcw size={12} /> Retry
                        </button>
                        <button
                          onClick={handleDownload}
                          className="flex-1 bg-black text-white py-3 text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={12} /> Save Result
                        </button>
                      </div>
                    ) : (
                      /* Generate / error retry button */
                      <button
                        id="tryon-modal-generate-btn"
                        onClick={stage === STAGES.error ? handleRetry : handleGenerate}
                        disabled={!canGenerate && stage !== STAGES.error}
                        className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase rounded-lg disabled:opacity-30 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2.5"
                      >
                        {stage === STAGES.error ? (
                          <><RotateCcw size={13} /><span>Try Again</span></>
                        ) : !portrait ? (
                          <><Camera size={13} /><span>Upload Your Photo First</span></>
                        ) : (
                          <><Sparkles size={13} /><span>Generate Try-On</span><ChevronRight size={12} /></>
                        )}
                      </button>
                    )}

                    {!portrait && stage === STAGES.idle && (
                      <p className="text-center text-[10px] text-secondary font-light">
                        Upload a front-facing portrait to begin
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Visualizer */}
                <div className="flex flex-col bg-neutral-50/50 dark:bg-neutral-900/50 min-h-[500px]">
                  {/* Panel label */}
                  <div className="p-4 border-b border-rule shrink-0">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] font-bold uppercase tracking-widest text-secondary"
                      >
                        {stage === STAGES.result
                          ? "Rendered Silhouette"
                          : stage === STAGES.preparing || stage === STAGES.generating
                            ? "Generating Outfit…"
                            : "Awaiting Silhouette"}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Result / skeleton / idle area */}
                  <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {stage === STAGES.result ? (
                        <motion.div
                          key="result"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0"
                        >
                          <img
                            src={result}
                            alt="Rendered silhouette"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>

                      ) : stage === STAGES.preparing ? (
                        <motion.div
                          key="preparing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <PreparingSkeleton />
                        </motion.div>

                      ) : stage === STAGES.generating ? (
                        <motion.div
                          key="generating"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <SilhouetteSkeleton
                            pct={pct}
                            label={label}
                            isDelayed={isDelayed}
                            onCancel={handleCancel}
                          />
                        </motion.div>

                      ) : (
                        /* Idle / error state */
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="flex flex-col items-center text-center gap-3 opacity-30">
                            <Sparkles size={32} strokeWidth={1} />
                            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-secondary">
                              Awaiting Silhouette
                            </p>
                            <p className="text-xs text-secondary font-light max-w-[180px] leading-relaxed">
                              Upload your portrait and click Generate
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
