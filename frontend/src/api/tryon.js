/**
 * TryOn API — Centralized virtual try-on API functions (Optimized)
 * ===============================================================
 * Centralized API calls for the optimized async pipeline:
 *   submitTryOn()         — POST /ai/try-on (multipart, guest-friendly, caching, model variant)
 *   pollTryOnStatus()     — GET /ai/try-on/status/:id
 *   getTryOnResult()      — GET /ai/try-on/result/:id
 *   waitForTryOnResult()  — Promise-based polling helper with progress callbacks
 */

import api from "./client";

/**
 * Submit a try-on request via the optimized multipart endpoint.
 *
 * @param {File}   userImageFile  - The user's portrait photo file
 * @param {string} productId      - Product UUID to try on
 * @param {string} modelVariant   - AI model variant: fast | balanced | quality
 * @returns {Promise<{ job_id: string, status: string, progress: number }>}
 */
export async function submitTryOn(userImageFile, productId, modelVariant = "balanced", extraData = {}) {
  const formData = new FormData();
  formData.append("user_image", userImageFile);
  formData.append("product_id", productId);
  formData.append("model_variant", modelVariant);

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
  const res = await api.get("/tryon/my-sessions");
  return res.data;
}

// Legacy exports — keep backward compat
export const generateTryOn = async (payload) => {
  const res = await api.post("/tryon/generate", payload);
  return res.data;
};

export const getMySessions = getUserSessions;

/**
 * Wait for a try-on session to complete by polling every `intervalMs`.
 * Resolves with the result_image_url on completion.
 * Rejects with an Error on failure or timeout.
 *
 * @param {string}   jobId          - Job UUID to poll
 * @param {Function} onProgress     - Callback called with progress percentage: (pct, status) => {}
 * @param {number}   intervalMs     - Polling interval (default 1000ms for fast updates)
 * @param {number}   timeoutMs      - Max wait time (default 120s)
 * @returns {Promise<string>} - resolves with result_image_url
 */
export function waitForTryOnResult(
  jobId,
  onProgress = () => {},
  intervalMs = 1000,
  timeoutMs = 120_000,
  options = {}
) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const interval = setInterval(async () => {
      if (options.cancelled) {
        clearInterval(interval);
        reject(new Error("Try-on cancelled."));
        return;
      }

      try {
        const data = await pollTryOnStatus(jobId);
        if (options.cancelled) {
          clearInterval(interval);
          reject(new Error("Try-on cancelled."));
          return;
        }

        onProgress(data.progress, data.status);

        if (data.status === "completed" || data.progress === 100) {
          clearInterval(interval);
          try {
            const resultData = await getTryOnResult(jobId);
            resolve(resultData.result_image_url);
          } catch (err) {
            reject(new Error("Failed to retrieve final try-on image."));
          }
        } else if (data.status === "failed") {
          clearInterval(interval);
          reject(new Error("Try-on generation failed. Please try again."));
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error("Try-on timed out. Please try again."));
        }
      } catch (err) {
        if (options.cancelled) {
          clearInterval(interval);
          reject(new Error("Try-on cancelled."));
          return;
        }
        clearInterval(interval);
        reject(new Error("Lost connection while generating your look. Please retry."));
      }
    }, intervalMs);
  });
}

