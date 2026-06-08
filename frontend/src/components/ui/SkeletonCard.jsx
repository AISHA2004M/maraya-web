/**
 * SkeletonCard — Luxury shimmer placeholder for product cards
 * Used during API fetching in Shop.jsx and Home.jsx
 */

export default function SkeletonCard({ aspectRatio = "3/4" }) {
  return (
    <div className="skeleton-card animate-pulse">
      {/* Image placeholder */}
      <div
        className="skeleton-image bg-[#f0ede8]"
        style={{ aspectRatio }}
      >
        {/* Shimmer overlay */}
        <div className="skeleton-shimmer" />
      </div>

      {/* Text placeholders */}
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-line skeleton-line--long" />
        <div className="skeleton-line skeleton-line--price" />
      </div>

      <style>{`
        .skeleton-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-image {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 1px;
        }

        .skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 40%,
            rgba(255, 255, 255, 0.7) 50%,
            rgba(255, 255, 255, 0.5) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s ease infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .skeleton-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 0 2px;
        }

        .skeleton-line {
          height: 10px;
          background: #f0ede8;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .skeleton-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s ease infinite;
          animation-delay: 0.1s;
        }

        .skeleton-line--short { width: 45%; height: 8px; }
        .skeleton-line--long  { width: 80%; height: 12px; }
        .skeleton-line--price { width: 35%; height: 10px; margin-top: 2px; }
      `}</style>
    </div>
  );
}
