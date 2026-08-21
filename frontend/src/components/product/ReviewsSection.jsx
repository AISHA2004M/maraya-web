/**
 * ReviewsSection — Product reviews with star ratings
 * ====================================================
 * Features:
 *  - Aggregated rating summary (average + breakdown bars)
 *  - Individual review cards
 *  - "Write a review" form (auth required)
 *  - Verified Purchase badge
 *  - Skeleton loading state
 *
 * Props:
 *   productId (string) — required
 */
import { useState, useEffect } from "react";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import api from "../../api/client";

// ─── Star Rating Display ──────────────────────────────────────────────────────
function StarDisplay({ rating, size = 14, color = "#1a1c1c" }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? color : "none"}
          stroke={star <= rating ? color : "#ccc"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${star} stars`}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
        >
          <Star
            size={22}
            fill={star <= (hover || value) ? "#1a1c1c" : "none"}
            stroke={star <= (hover || value) ? "#1a1c1c" : "#ccc"}
            strokeWidth={1.5}
            style={{ transition: "fill 0.15s" }}
          />
        </button>
      ))}
    </span>
  );
}

// ─── Rating Summary Bar ───────────────────────────────────────────────────────
function RatingBar({ stars, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
      <span style={{ minWidth: 12, color: "#5e5e5e" }}>{stars}</span>
      <Star size={10} fill="#1a1c1c" stroke="#1a1c1c" strokeWidth={1.5} />
      <div style={{ flex: 1, height: 4, background: "#efefef", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#1a1c1c",
            borderRadius: 99,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ minWidth: 24, textAlign: "right", color: "#5e5e5e" }}>{count}</span>
    </div>
  );
}

// ─── Individual Review Card ───────────────────────────────────────────────────
function ReviewCard({ review }) {
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  return (
    <div style={{ padding: "1.25rem 0", borderBottom: "1px solid #f0f0f0" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "0.4rem" }}>
        <div className="flex items-center gap-3">
          <StarDisplay rating={review.rating} size={13} />
          {review.verified_purchase && (
            <span className="flex items-center gap-1" style={{ fontSize: "0.6rem", color: "#16a34a", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              <CheckCircle size={10} />
              Verified Purchase
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.7rem", color: "#9c9c9c" }}>{date}</span>
      </div>
      {review.title && (
        <p style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>{review.title}</p>
      )}
      {review.body && (
        <p style={{ fontSize: "0.8rem", color: "#444", lineHeight: 1.6 }}>{review.body}</p>
      )}
      <p style={{ fontSize: "0.7rem", color: "#9c9c9c", marginTop: "0.5rem" }}>
        — {review.reviewer_name || "Customer"}
      </p>
    </div>
  );
}

// ─── Write Review Form ────────────────────────────────────────────────────────
function WriteReviewForm({ productId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/reviews", { product_id: productId, rating, title, body });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem", padding: "1.5rem", background: "#fafafa", border: "1px solid #efefef" }}>
      <p className="label-upper-dark" style={{ marginBottom: "1rem" }}>Write a Review</p>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.75rem", color: "#5e5e5e", display: "block", marginBottom: "0.4rem" }}>
          Your Rating *
        </label>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <input
          className="input-box"
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <textarea
          className="input-box"
          placeholder="Share your experience..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          style={{ resize: "vertical" }}
        />
      </div>
      {error && <p style={{ color: "#e11d48", fontSize: "0.75rem", marginBottom: "0.75rem" }}>{error}</p>}
      <button className="btn-black" type="submit" disabled={loading}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

// ─── Main ReviewsSection ──────────────────────────────────────────────────────
export default function ReviewsSection({ productId }) {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, revRes] = await Promise.all([
        api.get(`/reviews/${productId}/summary`),
        api.get(`/reviews/${productId}`),
      ]);
      setSummary(sumRes.data);
      setReviews(revRes.data);
    } catch {
      // Silent fail — reviews are non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div style={{ padding: "2rem 0" }}>
        <div className="shimmer" style={{ height: 16, width: 120, borderRadius: 4, marginBottom: "1rem" }} />
        {[1, 2].map((i) => (
          <div key={i} style={{ padding: "1.25rem 0", borderBottom: "1px solid #f0f0f0" }}>
            <div className="shimmer" style={{ height: 12, width: 80, borderRadius: 4, marginBottom: "0.5rem" }} />
            <div className="shimmer" style={{ height: 12, width: "70%", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  const total = summary?.total_reviews || 0;
  const avg = summary?.average_rating || 0;

  return (
    <div style={{ padding: "2rem 0" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "1.5rem" }}>
        <div>
          <p className="label-upper-dark">Customer Reviews</p>
          {total > 0 && (
            <div className="flex items-center gap-3" style={{ marginTop: "0.5rem" }}>
              <StarDisplay rating={Math.round(avg)} size={16} />
              <span style={{ fontSize: "0.85rem", color: "#5e5e5e" }}>
                {avg.toFixed(1)} out of 5 · {total} {total === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>
        <button
          className="btn-outline"
          style={{ fontSize: "0.65rem" }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Rating breakdown bars */}
      {total > 0 && summary?.rating_breakdown && (
        <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: 280 }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar
              key={star}
              stars={star}
              count={summary.rating_breakdown[star] || 0}
              total={total}
            />
          ))}
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <WriteReviewForm
          productId={productId}
          onSuccess={() => { setShowForm(false); fetchData(); }}
        />
      )}

      {/* Reviews list */}
      {reviews.length === 0 && !showForm ? (
        <p style={{ color: "#9c9c9c", fontSize: "0.8rem", padding: "1rem 0" }}>
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        reviews.map((r) => <ReviewCard key={r.id} review={r} />)
      )}
    </div>
  );
}
