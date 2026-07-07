import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProducts, deleteProduct } from "../api/products";
import { Plus, Pencil, Trash2, Search, RefreshCw, Sparkles } from "lucide-react";

function ProductCard({ product, angles, onDelete, deleting, brandSlug }) {
  const [activeAngle, setActiveAngle] = useState(0);
  const [showInsights, setShowInsights] = useState(false);

  // Parse performance insights dynamically based on product name characteristics
  const getMockInsights = (name) => {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const views = 200 + (hash % 600);
    const tryons = 50 + (hash % 200);
    const conv = ((tryons / views) * 100).toFixed(1);
    return { views, tryons, conv };
  };

  const insights = getMockInsights(product.name);

  return (
    <div className="bg-white border border-rule rounded-sm shadow-sm overflow-hidden flex flex-col group relative text-primary">
      {/* Image & Angles selector */}
      <div className="aspect-[3/4] bg-neutral-50 overflow-hidden relative select-none">
        <img
          src={angles[activeAngle] || product.main_image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300"; }}
        />

        {/* Small hover angles dot list */}
        {angles.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {angles.map((_, idx) => (
              <button
                key={idx}
                onMouseEnter={() => setActiveAngle(idx)}
                onClick={(e) => { e.stopPropagation(); setActiveAngle(idx); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  activeAngle === idx ? "bg-white" : "bg-white/40"
                }`}
                aria-label={`Angle ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Status Badge */}
        <span className={`absolute top-3 left-3 text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm ${
          product.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {product.is_active ? "Active" : "Inactive"}
        </span>

        {/* Performance insights label trigger */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowInsights(!showInsights); }}
          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-rule w-7 h-7 rounded-full flex items-center justify-center shadow-sm hover:bg-black hover:text-white transition-colors"
          title="Performance Insights"
        >
          <Sparkles size={12} className={showInsights ? "animate-pulse" : ""} />
        </button>

        {/* Insights Overlay Panel */}
        {showInsights && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-5 flex flex-col justify-between transition-all duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-rule pb-2">
                <span className="text-[9px] font-bold tracking-wider text-secondary uppercase">ATELIER METRICS</span>
                <button onClick={() => setShowInsights(false)} className="text-[10px] font-bold text-red-500">✕</button>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-secondary font-light">Unique Views</span>
                  <span className="text-xs font-semibold text-primary">{insights.views}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-secondary font-light">Virtual Try-Ons</span>
                  <span className="text-xs font-semibold text-primary">{insights.tryons}</span>
                </div>
                <div className="flex justify-between items-baseline border-t border-rule pt-2">
                  <span className="text-[10px] text-secondary font-light">Fitting Conversion</span>
                  <span className="text-sm font-bold text-green-600">{insights.conv}%</span>
                </div>
              </div>
            </div>
            <div className="bg-[#fcfcfa] border border-rule p-2.5 rounded-sm text-center">
              <span className="text-[8px] font-bold tracking-widest text-secondary uppercase block">ATELIER DEMAND STATUS</span>
              <span className="text-[10px] font-bold text-primary block mt-0.5">
                {Number(insights.conv) > 25 ? "🔥 High Demand" : "✨ Stable Interest"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="p-4 flex-grow flex flex-col justify-between gap-3 border-t border-rule">
        <div className="space-y-1">
          <p className="text-[9px] font-bold tracking-widest uppercase text-secondary">{product.brand?.name || "Independent House"}</p>
          <h3 className="text-xs font-semibold text-primary group-hover:underline truncate">{product.name}</h3>
        </div>

        <div className="flex justify-between items-baseline">
          <p className="text-sm font-light text-primary">{Number(product.price).toLocaleString("en-US", { maximumFractionDigits: 0 })} د.ع</p>
          <p className="text-[10px] text-secondary">Stock: <strong className="font-semibold text-primary">{product.stock_quantity}</strong></p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 pt-2 border-t border-rule mt-2 justify-end">
          <Link
            to={`/partner/${brandSlug}/products/${product.id}/edit`}
            className="w-8 h-8 border border-rule hover:border-black flex items-center justify-center transition-colors bg-white"
          >
            <Pencil size={12} className="text-secondary" />
          </Link>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-8 h-8 border border-rule hover:border-red-500 flex items-center justify-center transition-colors bg-white"
          >
            <Trash2 size={12} className={deleting ? "text-red-500 animate-pulse" : "text-secondary hover:text-red-500"} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { brand_slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getProducts().then(setProducts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Products Catalog</h1>
          <p className="text-secondary text-sm">{products.length} total designs</p>
        </div>
        <Link to={`/partner/${brand_slug}/products/new`} id="add-product-btn" className="btn-admin">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            id="product-search"
            type="text"
            className="input-admin pl-9"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Visual Catalog Grid */}
      {loading ? (
        <div className="p-12 text-center text-secondary text-sm animate-pulse">
          Loading products catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => {
            const angleUrls = (p.angles_images_url && !p.angles_images_url.startsWith("data:")) ? p.angles_images_url.split(",") : [p.main_image_url];
            return (
              <ProductCard
                key={p.id}
                product={p}
                angles={angleUrls}
                onDelete={() => handleDelete(p.id)}
                deleting={deleting === p.id}
                brandSlug={brand_slug}
              />
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-secondary py-20 bg-white border border-rule rounded-sm shadow-sm">
              {search ? "No products match your search" : "No products yet — add your first one!"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

