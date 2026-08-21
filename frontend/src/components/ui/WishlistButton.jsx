/**
 * WishlistButton — Heart icon with optimistic toggle
 * ===================================================
 * Used on ProductCard, ProductDetails, and SearchByImage.
 * Instantly updates UI (optimistic), then syncs to server.
 *
 * Props:
 *   productId (string)  — required
 *   size (number)       — icon size in px (default: 18)
 *   className (string)  — additional classes
 *   showCount (bool)    — show total wishlist count badge
 */
import { Heart } from "lucide-react";
import useWishlistStore from "../../store/useWishlistStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function WishlistButton({
  productId,
  size = 18,
  className = "",
  showLabel = false,
}) {
  const { isSaved, toggle } = useWishlistStore();
  const { isAuthenticated } = useAuthStore ? useAuthStore() : { isAuthenticated: false };
  const navigate = useNavigate();
  const saved = isSaved(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggle(productId);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex items-center gap-1.5 transition-all duration-200 ${className}`}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
    >
      <Heart
        size={size}
        fill={saved ? "#e11d48" : "none"}
        stroke={saved ? "#e11d48" : "currentColor"}
        strokeWidth={1.5}
        style={{
          transition: "fill 0.2s ease, stroke 0.2s ease, transform 0.15s ease",
          transform: saved ? "scale(1.1)" : "scale(1)",
        }}
      />
      {showLabel && (
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {saved ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
