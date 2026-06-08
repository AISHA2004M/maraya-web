import { useParams, Link } from "react-router-dom";
import { useBrand, useProducts } from "../hooks/useProducts";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function BrandDetails() {
  const { id } = useParams();
  const { data: brand, isLoading: isBrandLoading, isError: isBrandError } = useBrand(id);
  const { data: products, isLoading: isProductsLoading } = useProducts({ brand_id: id });

  if (isBrandLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="shimmer w-12 h-12 rounded-full mx-auto" />
            <div className="shimmer w-48 h-6 mx-auto" />
            <div className="shimmer w-32 h-4 mx-auto" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isBrandError || !brand) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 py-32">
          <h2 className="heading-serif text-3xl font-light">Brand Not Found</h2>
          <p className="text-secondary text-sm max-w-md font-light">
            The luxury digital storefront you are looking for does not exist or has been moved.
          </p>
          <Link to="/" className="btn-black py-3.5 px-8 text-xs font-bold tracking-widest uppercase rounded-none">
            <ArrowLeft size={14} /> <span>Back to Atelier</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-primary">
      <Navbar />

      {/* Editorial Split Hero Banner */}
      <section className="relative w-full bg-[#fcfcfa] border-b border-rule grid lg:grid-cols-[1.2fr_0.8fr] min-h-[60vh] md:min-h-[70vh] items-stretch">
        
        {/* Left Side: Brand Narrative & Identity */}
        <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center space-y-8 max-w-3xl z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {brand.logo_url && (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-8 h-8 rounded-full border border-rule bg-white object-contain"
                />
              )}
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">
                Atelier Brand Showcase
              </span>
            </div>
            <h1 className="heading-serif text-5xl md:text-7xl lg:text-8xl leading-none text-primary font-light">
              {brand.name}
            </h1>
          </div>
          <p className="text-secondary text-sm md:text-base font-light leading-relaxed max-w-lg">
            {brand.description || "Representing excellence, luxury tailoring, and classic structural forms suited for the modern high fashion enthusiast."}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <span className="tag-muted">Atelier Certified</span>
            <span className="tag-muted">Neural Drape Active</span>
            <span className="tag-muted">Exclusive Curation</span>
          </div>
        </div>

        {/* Right Side: Showcase image */}
        <div className="relative bg-[#fcfcfa] min-h-[350px] lg:min-h-0 overflow-hidden border-t lg:border-t-0 lg:border-l border-rule">
          {brand.banner_url ? (
            <img
              src={brand.banner_url}
              alt={brand.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[12000ms] hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-neutral-50" />
          )}
        </div>
      </section>

      {/* Brand Catalog Section */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="space-y-16">
          <div className="flex flex-col sm:flex-row justify-between items-baseline border-b border-rule pb-4 gap-4">
            <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">
              The {brand.name} Collection
            </h3>
            <p className="text-secondary text-xs font-light">
              {products ? products.length : 0} curated silhouette options
            </p>
          </div>

          {isProductsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shimmer h-[350px] w-full rounded-sm" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-24 bg-[#fcfcfa] border border-dashed border-rule rounded-sm">
              <p className="text-secondary text-xs uppercase tracking-widest font-bold">
                No products listed for this house
              </p>
            </div>
          ) : (
            /* Staggered Asymmetrical Lookbook Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-20 items-start">
              {products.map((product, idx) => {
                let colSpanClass = "lg:col-span-4";
                let wrapperClass = "fade-up";

                // Asymmetric visual mapping
                if (idx === 0) {
                  colSpanClass = "lg:col-span-8";
                } else if (idx === 2) {
                  colSpanClass = "lg:col-span-4 md:translate-y-12";
                } else if (idx === 4) {
                  colSpanClass = "lg:col-span-6";
                } else if (idx === 5) {
                  colSpanClass = "lg:col-span-6 md:-translate-y-8";
                }

                return (
                  <div key={product.id} className={`${colSpanClass} ${wrapperClass}`}>
                    <ProductCard product={product} />
                  </div>
                );
              })}

              {/* Editorial Philosophy Card */}
              {products.length > 1 && (
                <div className="lg:col-span-4 flex flex-col justify-center p-8 md:p-10 bg-[#fcfcfa] border border-rule aspect-[3/4] font-sans md:translate-y-12">
                  <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-secondary mb-6">
                    House Creed
                  </span>
                  <blockquote className="heading-serif text-xl italic text-primary leading-relaxed">
                    "Style is a deeply personal signature, a silent dialogue between dress and context."
                  </blockquote>
                  <cite className="text-[8px] font-bold tracking-widest text-secondary uppercase mt-6 not-italic">
                    — Creative Direction
                  </cite>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Campaign Section */}
      <section className="bg-[#fcfcfa] border-t border-b border-rule py-20 md:py-28 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-secondary block">
            Virtual Staging
          </span>
          <h2 className="heading-serif text-3xl md:text-5xl text-primary font-light">Experience the Fitting Room</h2>
          <p className="text-secondary text-xs md:text-sm font-light leading-relaxed max-w-lg mx-auto">
            Instantly render any {brand.name} item on your digital silhouette using our AI virtual dressing room. Take the guesswork out of sizing and proportions.
          </p>
          <div className="pt-6">
            <Link
              to="/tryon"
              className="btn-black py-4 px-10 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 w-fit mx-auto rounded-none"
            >
              <Sparkles size={13} /> <span>Open Fitting Room</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
