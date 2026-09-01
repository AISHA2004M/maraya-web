/**
 * TryOn API — Centralized virtual try-on API functions
 * =====================================================
 * All AI calls are routed through the backend API.
 * The AI provider key is managed server-side only (never exposed to the browser).
 */

import api from "./client";

// In-memory store for immediate cache-hit results returned in the 202 response.
const directResultsStore = new Map();

/**
 * Submit a try-on request through the backend API.
 * Returns immediately with a job_id — poll for status/result.
 */
export async function submitTryOn(userImageFile, productId, modelVariant = "balanced", extraData = {}) {
  const garmentUrl = extraData.garment_image_url || extraData.product_image || "";

  console.log("[VirtualTryOn] Submitting try-on request to backend...");
  console.log("[VirtualTryOn] Portrait:", userImageFile?.name || "portrait", userImageFile?.size ? `(${(userImageFile.size / 1024).toFixed(1)} KB)` : "");
  console.log("[VirtualTryOn] Product ID:", productId);

  const formData = new FormData();
  formData.append("user_image", userImageFile);
  formData.append("product_id", productId);
  formData.append("model_variant", modelVariant);

  if (garmentUrl) formData.append("garment_image_url", garmentUrl);
  if (extraData.product_ids) formData.append("product_ids", JSON.stringify(extraData.product_ids));
  if (extraData.avatar) formData.append("avatar", extraData.avatar);
  if (extraData.height) formData.append("height", extraData.height);
  if (extraData.weight) formData.append("weight", extraData.weight);
  if (extraData.body_bust) formData.append("body_bust", extraData.body_bust);
  if (extraData.body_waist) formData.append("body_waist", extraData.body_waist);
  if (extraData.body_hips) formData.append("body_hips", extraData.body_hips);

  // Generate a request ID for end-to-end tracing across frontend and backend logs
  const requestId = `fe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const res = await api.post("/ai/try-on", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-Request-ID": requestId,
    },
    timeout: 60000, // 60s for the initial submission (upload + DB record creation)
  });

  const data = res.data;

  // Cache hit: backend returned result immediately
  if (data.status === "completed" && data.result_image_url) {
    directResultsStore.set(data.job_id, data.result_image_url);
  }

  return data;
}

/**
 * Poll the status of a try-on session.
 */
export async function pollTryOnStatus(jobId) {
  if (jobId && directResultsStore.has(jobId)) {
    return {
      job_id: jobId,
      status: "completed",
      progress: 100,
      result_image_url: directResultsStore.get(jobId),
    };
  }
  const res = await api.get(`/ai/try-on/status/${jobId}`);
  return res.data;
}

/**
 * Get the final result of a completed try-on session.
 */
export async function getTryOnResult(jobId) {
  if (jobId && directResultsStore.has(jobId)) {
    return {
      job_id: jobId,
      status: "completed",
      result_image_url: directResultsStore.get(jobId),
      inference_time_ms: 0,
    };
  }
  const res = await api.get(`/ai/try-on/result/${jobId}`);
  return res.data;
}

/**
 * Fetch the authenticated user's try-on history.
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
 *
 * Key improvements:
 * - timeoutMs 185s (matches backend task_soft_time_limit=180s)
 * - Uses result_image_url directly from status if available
 * - Exponential backoff on network errors (avoids hammering backend on blips)
 * - Distinguishes "failed" (hard error) from "timed out" (soft, retryable)
 */
export function waitForTryOnResult(
  jobId,
  onProgress = () => {},
  intervalMs = 1500,
  timeoutMs = 185_000,
  options = {}
) {
  return new Promise((resolve, reject) => {
    if (jobId && directResultsStore.has(jobId)) {
      onProgress(100, "completed");
      resolve(directResultsStore.get(jobId));
      return;
    }

    const start = Date.now();
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;

    const interval = setInterval(async () => {
      if (options.cancelled) {
        clearInterval(interval);
        reject(new Error("Try-on cancelled by user."));
        return;
      }

      try {
        const data = await pollTryOnStatus(jobId);
        consecutiveErrors = 0; // Reset on success

        if (options.cancelled) {
          clearInterval(interval);
          reject(new Error("Try-on cancelled by user."));
          return;
        }

        onProgress(data.progress || 0, data.status || "processing");

        if (data.status === "completed" || (data.progress && data.progress >= 100)) {
          clearInterval(interval);
          try {
            if (data.result_image_url) {
              resolve(data.result_image_url);
              return;
            }
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
          reject(new Error("The virtual try-on generation failed. Please try with a different photo or garment."));
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error("Virtual try-on is taking longer than expected. Please try again — your request may still be processing."));
        }
      } catch (err) {
        consecutiveErrors++;
        console.warn(`[VirtualTryOn] Poll error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err.message);

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          clearInterval(interval);
          reject(new Error("Lost connection while waiting for your try-on result. Please check your internet connection and try again."));
          return;
        }
        // Otherwise absorb the error and keep polling (transient network blip)
      }
    }, intervalMs);
  });
}
