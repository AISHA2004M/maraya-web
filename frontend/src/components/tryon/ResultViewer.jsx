import { Download, Share2, ShoppingBag } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";

export default function ResultViewer({ resultUrl, product }) {
  const addToCart = useCartStore((s) => s.addToCart);

  if (!resultUrl) return null;

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="relative">
        <img src={resultUrl} alt="AI Try-On Result" className="w-full object-cover rounded-t-2xl" />
        <div className="absolute top-3 left-3">
          <span className="badge badge-brand">AI Result</span>
        </div>
      </div>
      <div className="p-4 flex gap-3">
        <button
          onClick={() => window.open(resultUrl, "_blank")}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
        >
          <Download size={15} />
          <span>Save</span>
        </button>
        {product && (
          <button
            onClick={() => addToCart(product)}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
          >
            <ShoppingBag size={15} />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  );
}
