import { useState, useEffect } from "react";
import { Sparkles, Loader2, Upload, Check, Download, Image as ImageIcon } from "lucide-react";

const BACKDROPS = [
  { id: "paris", name: "Parisian Street", desc: "Chic classic Paris setting with soft lighting", img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600" },
  { id: "marble", name: "Marble Salon", desc: "Clean luxury showroom with marble columns", img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600" },
  { id: "studio", name: "Brutalist Studio", desc: "Industrial concrete wall background", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600" },
  { id: "runway", name: "Fashion Runway", desc: "Dramatic catwalk spotlights and audience bokeh", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600" },
];

export default function AssetGenerator() {
  const [garmentFile, setGarmentFile] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState("paris");
  const [customPrompt, setCustomPrompt] = useState("");
  const [lightingStyle, setLightingStyle] = useState("sun");
  const [modelPosture, setModelPosture] = useState("front");
  const [modelGender, setModelGender] = useState("female");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [outputImage, setOutputImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setGarmentFile(file);
      setGarmentPreview(URL.createObjectURL(file));
      setOutputImage(null);
    }
  };

  const handleGenerate = () => {
    if (!garmentFile) return;
    setLoading(true);
    setOutputImage(null);

    const phases = [
      "Isolating garment fibers...",
      "Removing flat-lay backdrop...",
      "Analyzing customized background prompt...",
      "Synthesizing lighting: " + (lightingStyle === "sun" ? "Warm Sun" : lightingStyle === "studio" ? "Moody Studio" : "Spotlight Runway"),
      "Applying posture staging: " + (modelPosture === "front" ? "Formal Front" : modelPosture === "walking" ? "Walking Gesture" : "Side Profile"),
      "Rendering photorealistic textures...",
    ];

    let currentPhase = 0;
    setPhase(phases[0]);

    const interval = setInterval(() => {
      currentPhase += 1;
      if (currentPhase < phases.length) {
        setPhase(phases[currentPhase]);
      } else {
        clearInterval(interval);
        // If there's a custom prompt, use a premium aesthetic. Else use backdropMap.
        if (customPrompt.trim() !== "") {
          setOutputImage("https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000"); // Gorgeous studio outdoor
        } else {
          const backdropMap = {
            paris: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000",
            marble: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1000",
            studio: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000",
            runway: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1000",
          };
          setOutputImage(backdropMap[selectedBackdrop]);
        }
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="p-10 font-sans max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div>
        <h1 className="heading-serif text-4xl mb-2 text-black">AI Editorial Generator</h1>
        <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase">
          Evolve raw flat lays into high-end fashion shoots
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Upload and parameters */}
        <div className="space-y-8 bg-white border border-gray-200 p-8 rounded-sm shadow-sm">
          
          {/* Garment Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 border-b pb-2">
              1. Upload Flat-lay / Garment Image
            </label>
            {garmentPreview ? (
              <div className="relative aspect-[4/3] bg-gray-50 border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center">
                <img src={garmentPreview} alt="Garment preview" className="h-full object-contain" />
                <button
                  onClick={() => {
                    setGarmentFile(null);
                    setGarmentPreview(null);
                    setOutputImage(null);
                  }}
                  className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-full text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="text-center space-y-2 text-gray-400">
                  <Upload size={32} className="mx-auto" strokeWidth={1.5} />
                  <span className="block text-xs font-bold tracking-wider uppercase text-gray-500">Upload Product Image</span>
                  <span className="block text-[10px] font-light">JPG, PNG up to 10MB</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Backdrop Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 border-b pb-2">
              2. Select Editorial Setting
            </label>
            <div className="grid grid-cols-2 gap-4">
              {BACKDROPS.map((bd) => (
                <div
                  key={bd.id}
                  onClick={() => {
                    setSelectedBackdrop(bd.id);
                    setCustomPrompt("");
                  }}
                  className={`cursor-pointer border p-4 flex gap-3 items-center rounded-sm transition-all ${
                    selectedBackdrop === bd.id && !customPrompt
                      ? "border-black bg-neutral-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img src={bd.img} alt={bd.name} className="w-12 h-16 object-cover rounded-sm" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-black">{bd.name}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-1">{bd.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Custom Background Prompt Box */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold tracking-wider uppercase text-gray-400 mb-1">
                Or generate custom setting with prompt
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Vintage Italian villa garden, soft sunset rim light"
                className="w-full p-3 border border-gray-200 text-xs rounded-sm outline-none focus:border-black placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Model Attributes */}
          <div className="space-y-4">
            <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 border-b pb-2">
              3. Custom Model & Posture Staging
            </label>
            
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Model Staging Style</p>
              <div className="flex gap-4">
                {["female", "male", "unisex"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setModelGender(g)}
                    className={`flex-1 py-2.5 border text-xs font-bold tracking-wider uppercase rounded-sm transition-all ${
                      modelGender === g
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 text-gray-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Lighting Environment</p>
              <div className="flex gap-4">
                {[
                  { id: "sun", label: "Warm Sun" },
                  { id: "studio", label: "Moody Studio" },
                  { id: "runway", label: "Spotlight Runway" }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLightingStyle(l.id)}
                    className={`flex-1 py-2 border text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all ${
                      lightingStyle === l.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 text-gray-400"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Model Pose / Posture</p>
              <div className="flex gap-4">
                {[
                  { id: "front", label: "Formal Front" },
                  { id: "walking", label: "Walking Gesture" },
                  { id: "side", label: "Side Profile" }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setModelPosture(p.id)}
                    className={`flex-1 py-2 border text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all ${
                      modelPosture === p.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 text-gray-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate trigger */}
          <button
            onClick={handleGenerate}
            disabled={!garmentFile || loading}
            className="w-full btn-black py-4 text-xs font-bold tracking-widest uppercase disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Synthesizing Model Asset...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Editorial Shot</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Visualizer Output */}
        <div className="bg-white border border-gray-200 p-8 rounded-sm shadow-sm min-h-[580px] flex flex-col justify-between">
          <div className="border-b pb-3.5 mb-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500">
              Output Creative Asset
            </h3>
          </div>

          <div className="flex-grow bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center relative overflow-hidden min-h-[420px]">
            {outputImage ? (
              <div className="w-full h-full relative group">
                <img src={outputImage} alt="AI Generated Look" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => window.open(outputImage, "_blank")}
                    className="bg-white text-black p-3.5 rounded-full hover:bg-gray-100 transition-colors shadow"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border border-gray-200 animate-[spin_3s_linear_infinite]" />
                  <div className="absolute inset-0 rounded-full border-t border-black animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-black animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold tracking-widest uppercase text-black">{phase}</p>
                  <p className="text-[10px] text-gray-400 font-light">Synthesizing environment lighting...</p>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-30 space-y-3">
                <ImageIcon size={32} className="mx-auto text-gray-400" strokeWidth={1.5} />
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Awaiting Generation</p>
              </div>
            )}
          </div>

          {outputImage && (
            <div className="pt-6 flex gap-4">
              <button
                onClick={() => window.open(outputImage, "_blank")}
                className="flex-1 border border-black text-black py-3 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-neutral-50 transition-colors"
              >
                Open in Full-Res
              </button>
              <button
                onClick={() => {
                  setOutputImage(null);
                  setGarmentFile(null);
                  setGarmentPreview(null);
                }}
                className="flex-1 btn-black py-3 text-xs font-bold tracking-widest uppercase"
              >
                Reset canvas
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
