import { useRef } from "react";

export default function UploadBox({ onUpload, preview }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    onUpload(file);
  };

  return (
    <div
      className="relative border border-rule cursor-pointer group overflow-hidden bg-[#f5f5f3] w-full h-full flex flex-col justify-center items-center"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="Your photo"
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105"
          />
          {/* Hover overlay to change photo */}
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 p-4 text-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider block">Click to change photo</span>
            <span className="text-[11px] font-medium block">اضغط لتغيير الصورة</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-10 min-h-[320px]">
          {/* Upload icon — minimal line art */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-rule stroke-muted" strokeWidth="1.5">
            <rect x="4" y="12" width="32" height="24" rx="1" stroke="currentColor" />
            <path d="M20 8V28M20 8L13 15M20 8L27 15" stroke="currentColor" />
          </svg>
          <div className="text-center">
            <p className="label-upper mb-1">Drop your photo here</p>
            <p className="text-xs text-subtle">or click to browse · JPG, PNG, WebP</p>
          </div>
        </div>
      )}
      {!preview && (
        <div className="absolute inset-0 border-2 border-dashed border-rule group-hover:border-ink transition-colors pointer-events-none m-2" />
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
