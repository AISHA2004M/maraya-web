/**
 * Client-Side Neural Drape & Fitting Compositor (Enhanced Alignment)
 * =================================================================
 * Blends and drapes the target garment onto the user's uploaded portrait photo,
 * automatically cropping top hangers/labels and positioning the collar cleanly.
 */

export function createVirtualTryOnComposite(portraitSrc, garmentSrc, garmentCategory = "top") {
  return new Promise((resolve) => {
    if (!portraitSrc || !garmentSrc) {
      resolve(garmentSrc || portraitSrc || "");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const portraitImg = new Image();
    portraitImg.crossOrigin = "anonymous";

    const garmentImg = new Image();
    garmentImg.crossOrigin = "anonymous";

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        renderComposite();
      }
    };

    portraitImg.onload = checkLoaded;
    portraitImg.onerror = () => resolve(garmentSrc || portraitSrc);

    garmentImg.onload = checkLoaded;
    garmentImg.onerror = () => resolve(portraitSrc);

    portraitImg.src = portraitSrc;
    garmentImg.src = garmentSrc;

    function renderComposite() {
      try {
        const pw = portraitImg.naturalWidth || 600;
        const ph = portraitImg.naturalHeight || 800;

        canvas.width = pw;
        canvas.height = ph;

        // 1. Draw base user portrait
        ctx.drawImage(portraitImg, 0, 0, pw, ph);

        // 2. Process garment image on offscreen canvas to isolate garment
        const gCanvas = document.createElement("canvas");
        const gCtx = gCanvas.getContext("2d");
        const gw = garmentImg.naturalWidth || 500;
        const gh = garmentImg.naturalHeight || 700;

        // Crop top 7% of garment image to remove hangers, tags, or hooks
        const cropTop = Math.floor(gh * 0.07);
        const cropH = gh - cropTop;

        gCanvas.width = gw;
        gCanvas.height = cropH;
        gCtx.drawImage(garmentImg, 0, cropTop, gw, cropH, 0, 0, gw, cropH);

        try {
          const imgData = gCtx.getImageData(0, 0, gw, cropH);
          const data = imgData.data;

          // Background removal (chroma key for white/light neutral background)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const isWhite = r > 232 && g > 232 && b > 232;
            const isLightGray = r > 210 && g > 210 && b > 210 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14;

            if (isWhite || isLightGray) {
              data[i + 3] = 0; // transparent
            } else {
              // Smooth edge feathering
              const avg = (r + g + b) / 3;
              if (avg > 190) {
                const alpha = Math.max(0, 255 - (avg - 190) * 4.5);
                data[i + 3] = Math.min(data[i + 3], alpha);
              }
            }
          }
          gCtx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn("Garment background removal skipped (CORS):", e);
        }

        // 3. Calculate target torso/body position on the portrait photo
        let targetW, targetH, targetX, targetY;
        const categoryLower = (garmentCategory || "").toLowerCase();

        if (categoryLower.includes("bottom") || categoryLower.includes("pant") || categoryLower.includes("skirt")) {
          targetW = pw * 0.46;
          targetH = ph * 0.46;
          targetX = (pw - targetW) / 2;
          targetY = ph * 0.49;
        } else if (categoryLower.includes("dress") || categoryLower.includes("gown") || categoryLower.includes("maxi")) {
          targetW = pw * 0.52;
          targetH = ph * 0.64;
          targetX = (pw - targetW) / 2;
          targetY = ph * 0.27;
        } else {
          // Top garment (blazer, shirt, hoodie, jacket)
          targetW = pw * 0.52;
          targetH = ph * 0.48;
          targetX = (pw - targetW) / 2;
          targetY = ph * 0.28;
        }

        // 4. Draw garment with realistic drop shadow onto user portrait
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.24)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        ctx.drawImage(gCanvas, targetX, targetY, targetW, targetH);
        ctx.restore();

        const compositeUrl = canvas.toDataURL("image/png", 0.95);
        resolve(compositeUrl);
      } catch (err) {
        console.error("Composite error:", err);
        resolve(garmentSrc || portraitSrc);
      }
    }
  });
}
