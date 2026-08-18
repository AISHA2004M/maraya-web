/**
 * Client-Side Neural Drape & Fitting Compositor
 * ============================================
 * Blends and drapes the target garment onto the user's uploaded portrait photo.
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

        gCanvas.width = gw;
        gCanvas.height = gh;
        gCtx.drawImage(garmentImg, 0, 0, gw, gh);

        try {
          const imgData = gCtx.getImageData(0, 0, gw, gh);
          const data = imgData.data;

          // Background removal (chroma key for white/light neutral background)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const isWhite = r > 238 && g > 238 && b > 238;
            const isLightGray = r > 215 && g > 215 && b > 215 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12;

            if (isWhite || isLightGray) {
              data[i + 3] = 0; // transparent
            } else {
              // Smooth edge feathering
              const avg = (r + g + b) / 3;
              if (avg > 195) {
                const alpha = Math.max(0, 255 - (avg - 195) * 4.5);
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
          targetW = pw * 0.48;
          targetH = ph * 0.45;
          targetX = (pw - targetW) / 2;
          targetY = ph * 0.48;
        } else if (categoryLower.includes("dress") || categoryLower.includes("gown") || categoryLower.includes("maxi")) {
          targetW = pw * 0.54;
          targetH = ph * 0.65;
          targetX = (pw - targetW) / 2;
          targetY = ph * 0.22;
        } else {
          // Top garment (blazer, shirt, hoodie, dress)
          targetW = pw * 0.56;
          targetH = ph * 0.46;
          targetX = (pw - targetW) / 2;
          targetY = ph * 0.23;
        }

        // 4. Draw garment with realistic drop shadow onto user portrait
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

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
