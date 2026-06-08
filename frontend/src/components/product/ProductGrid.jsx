import ProductCard from "./ProductCard";
import { useProducts } from "../../hooks/useProducts";

export default function ProductGrid({ filters = {} }) {
  const { data: products, isLoading, isError } = useProducts(filters);

  if (isLoading) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="break-inside-avoid">
            <div className="shimmer aspect-[3/4] mb-4" />
            <div className="shimmer h-3 w-1/3 mb-2" />
            <div className="shimmer h-4 w-2/3 mb-2" />
            <div className="shimmer h-3 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-32 text-center">
        <p className="text-xs text-[#5e5e5e] tracking-[0.2em] uppercase">
          Could not load the collection.
        </p>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="py-32 text-center">
        <p className="text-xs text-[#5e5e5e] tracking-[0.2em] uppercase">No pieces found matching your selection.</p>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
      {products.map((product, i) => (
        <div
          key={product.id}
          className="break-inside-avoid fade-up mb-8"
          style={{ animationDelay: `${(i % 4) * 100}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
