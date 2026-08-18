/**
 * TryOn API — Centralized virtual try-on API functions (Strict AI Pipeline)
 * =========================================================================
 * Centralized API calls for the async try-on pipeline:
 *   submitTryOn()         — POST /ai/try-on (multipart, portrait, product_id, garment_image_url)
 *   pollTryOnStatus()     — GET /ai/try-on/status/:id
 *   getTryOnResult()      — GET /ai/try-on/result/:id
 *   waitForTryOnResult()  — Promise-based polling helper with progress callbacks & strict error rejection
 */

import api from "./client";

/**
 * Submit a try-on request via the multipart endpoint.
 *
 * @param {File}   userImageFile  - The user's portrait photo file
 * @param {string} productId      - Product UUID to try on
 * @param {string} modelVariant   - AI model variant: fast | balanced | quality
 * @param {object} extraData      - Additional garment metadata (garment_image_url, etc.)
 * @returns {Promise<{ job_id: string, status: string, progress: number }>}
 */
export async function submitTryOn(userImageFile, productId, modelVariant = "balanced", extraData = {}) {
  const garmentUrl = extraData.garment_image_url || extraData.product_image || "";
  
  // Debug logging without printing huge Base64 strings
  console.log("[VirtualTryOn] Portrait ready:", userImageFile?.name || "portrait", userImageFile?.size ? `(${(userImageFile.size / 1024).toFixed(1)} KB)` : "");
  console.log("[VirtualTryOn] Product image:", garmentUrl || "(Resolved on backend via product ID)");
  console.log("[VirtualTryOn] Product ID:", productId);
  console.log("[VirtualTryOn] Sending try-on request...");

  const formData = new FormData();
  formData.append("user_image", userImageFile);
  formData.append("product_id", productId);
  formData.append("model_variant", modelVariant);

  if (garmentUrl) {
    formData.append("garment_image_url", garmentUrl);
  }
  if (extraData.product_ids) {
    formData.append("product_ids", JSON.stringify(extraData.product_ids));
  }
  if (extraData.avatar) formData.append("avatar", extraData.avatar);
  if (extraData.height) formData.append("height", extraData.height);
  if (extraData.weight) formData.append("weight", extraData.weight);
  if (extraData.body_bust) formData.append("body_bust", extraData.body_bust);
  if (extraData.body_waist) formData.append("body_waist", extraData.body_waist);
  if (extraData.body_hips) formData.append("body_hips", extraData.body_hips);

  const res = await api.post("/ai/try-on", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  });
  return res.data;
}

/**
 * Poll the status of a try-on session.
 *
 * @param {string} jobId - Try-on session/job UUID
 * @returns {Promise<{ job_id: string, status: string, progress: number }>}
 */
export async function pollTryOnStatus(jobId) {
  const res = await api.get(`/ai/try-on/status/${jobId}`);
  return res.data;
}

/**
 * Get the final result of a completed try-on session.
 *
 * @param {string} jobId - Try-on session/job UUID
 * @returns {Promise<{ job_id: string, status: string, result_image_url: string, inference_time_ms: number }>}
 */
export async function getTryOnResult(jobId) {
  const res = await api.get(`/ai/try-on/result/${jobId}`);
  return res.data;
}

/**
 * Fetch the authenticated user's try-on history.
 *
 * @returns {Promise<Array>}
 */
export async function getUserSessions() {
  try {
    const res = await api.get("/tryon/my-sessions");
    return res.data;
  } catch (err) {
    return [];
  }
}

export const getMySessions = getUserSessions;

/**
 * Wait for a try-on session to complete by polling every `intervalMs`.
 * Resolves with the result_image_url on completion, or rejects with an Error on failure/timeout.
 *
 * @param {string}   jobId          - Job UUID to poll
 * @param {Function} onProgress     - Callback called with progress percentage: (pct, status) => {}
 * @param {number}   intervalMs     - Polling interval (default 1000ms)
 * @param {number}   timeoutMs      - Max wait time (default 60s)
 * @returns {Promise<string>} - resolves with result_image_url
 */
export function waitForTryOnResult(
  jobId,
  onProgress = () => {},
  intervalMs = 1000,
  timeoutMs = 60_000,
  options = {}
) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const interval = setInterval(async () => {
      if (options.cancelled) {
        clearInterval(interval);
        reject(new Error("Try-on cancelled by user."));
        return;
      }

      try {
        const data = await pollTryOnStatus(jobId);
        if (options.cancelled) {
          clearInterval(interval);
          reject(new Error("Try-on cancelled by user."));
          return;
        }

        onProgress(data.progress || 0, data.status || "processing");

        if (data.status === "completed" || (data.progress && data.progress >= 100)) {
          clearInterval(interval);
          try {
            const resultData = await getTryOnResult(jobId);
            if (resultData && resultData.result_image_url) {
              resolve(resultData.result_image_url);
            } else {
              reject(new Error("Virtual try-on output was empty. Please try again."));
            }
          } catch (err) {
            reject(err);
          }
        } else if (data.status === "failed") {
          clearInterval(interval);
          reject(new Error("Unable to generate the virtual try-on result. Please try again."));
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error("Virtual try-on request timed out. Please try again."));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
}
