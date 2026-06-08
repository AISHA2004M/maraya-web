import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { createProduct, updateProduct, getProduct, getBrands, getCategories } from "../api/products";
import api from "../api/client";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function ProductForm() {
  const { brand_slug, id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const role = useAuthStore((s) => s.role);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // 4 visual angles state
  const [angles, setAngles] = useState({
    front: "",
    back: "",
    side: "",
    detail: ""
  });

  // Sizes & stock state: { XS: 0, S: 0, M: 0, L: 0, XL: 0 }
  const STANDARD_SIZES = ["XS", "S", "M", "L", "XL"];
  const [sizeStock, setSizeStock] = useState(
    Object.fromEntries(STANDARD_SIZES.map((s) => [s, 0]))
  );

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const mainImageUrl = watch("main_image_url");

  useEffect(() => {
    getBrands().then(setBrands);
    getCategories().then(setCategories);
    if (isEdit) {
      getProduct(id).then((p) => {
        reset(p);
        if (p.angles_images_url) {
          const urls = p.angles_images_url.split(",");
          setAngles({
            front: urls[0] || p.main_image_url || "",
            back: urls[1] || "",
            side: urls[2] || "",
            detail: urls[3] || ""
          });
        } else {
          setAngles({
            front: p.main_image_url || "",
            back: "",
            side: "",
            detail: ""
          });
        }
        // Pre-populate existing sizes
        if (p.sizes && p.sizes.length > 0) {
          const loaded = Object.fromEntries(STANDARD_SIZES.map((s) => [s, 0]));
          p.sizes.forEach(({ size, stock }) => {
            if (size in loaded) loaded[size] = stock;
          });
          setSizeStock(loaded);
        }
      });
    }
  }, [id, isEdit, reset]);

  const handleAngleUpload = async (file, slot) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.url;
      setAngles((prev) => {
        const updated = { ...prev, [slot]: url };
        if (slot === "front") {
          setValue("main_image_url", url, { shouldValidate: true });
        }
        return updated;
      });
    } catch (err) {
      alert("Failed to upload angle image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    // Join angles in comma-separated list
    const anglesList = [angles.front, angles.back, angles.side, angles.detail].filter(Boolean).join(",");
    data.angles_images_url = anglesList;
    if (!data.main_image_url && angles.front) {
      data.main_image_url = angles.front;
    }

    // Attach sizes — only include sizes with stock > 0 to keep payload minimal;
    // always send all sizes so the backend can clear old ones on update.
    data.sizes = STANDARD_SIZES.map((s) => ({ size: s, stock: Number(sizeStock[s]) || 0 }));

    try {
      if (isEdit) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      navigate(`/partner/${brand_slug}/products`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      <h1 className="text-2xl font-black mb-8">{isEdit ? "Edit Product" : "Add New Product"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="text-xs text-secondary mb-1.5 block font-medium">Product Name *</label>
            <input
              id="product-name"
              {...register("name", { required: true })}
              className={`input-admin ${errors.name ? "border-red-400/50" : ""}`}
              placeholder="e.g. Floral Maxi Dress"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Price (USD) *</label>
            <input
              id="product-price"
              type="number"
              step="0.01"
              {...register("price", { required: true, min: 0 })}
              className="input-admin"
              placeholder="89.99"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Stock Quantity</label>
            <input
              id="product-stock"
              type="number"
              {...register("stock_quantity")}
              className="input-admin"
              placeholder="100"
            />
          </div>

          {/* Brand */}
          {role !== "partner" && (
            <div>
              <label className="text-xs text-secondary mb-1.5 block font-medium">Brand</label>
              <select id="product-brand" {...register("brand_id")} className="input-admin">
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Category</label>
            <select id="product-category" {...register("category_id")} className="input-admin">
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Gender</label>
            <select id="product-gender" {...register("gender")} className="input-admin">
              <option value="">Any</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>

          {/* Fabric */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Fabric Type</label>
            <input
              {...register("fabric_type")}
              className="input-admin"
              placeholder="e.g. 100% Cotton"
            />
          </div>

          {/* Multi-Image Angle Uploader */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs text-secondary block font-bold uppercase tracking-wider">Product Presentation Images (4 Angles) *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["front", "back", "side", "detail"].map((angle) => {
                const imgUrl = angles[angle];
                const inputId = `file-${angle}`;
                return (
                  <div
                    key={angle}
                    className="border-2 border-dashed border-outline-variant hover:border-black/35 rounded-lg p-3 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer relative min-h-[140px] transition-colors text-center"
                    onClick={() => document.getElementById(inputId).click()}
                  >
                    {imgUrl ? (
                      <div className="relative group w-full h-full aspect-[3/4] overflow-hidden rounded border border-rule">
                        <img src={imgUrl} alt={`${angle} preview`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-white uppercase font-bold tracking-wider">Change {angle}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 opacity-65 group hover:opacity-100">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-secondary stroke-current" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{angle} Angle</span>
                        <span className="text-[8px] text-secondary">Click to upload</span>
                      </div>
                    )}
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) handleAngleUpload(file, angle);
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <input type="hidden" {...register("main_image_url", { required: true })} />
            {errors.main_image_url && (
              <p className="text-xs text-red-500 mt-1">At least the front image is required</p>
            )}
          </div>

          {/* Editorial Storytelling Section Header */}
          <div className="md:col-span-2 border-t border-rule pt-6 mt-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-secondary">Luxury Storytelling & Editorial</h3>
            <p className="text-[10px] text-secondary font-light mt-1">Craft narrative descriptions and assign seasonal aesthetic moods to this design.</p>
          </div>

          {/* Storytelling Title */}
          <div className="md:col-span-2">
            <label className="text-xs text-secondary mb-1.5 block font-medium">Editorial Narrative Title</label>
            <input
              id="storytelling-title"
              {...register("storytelling_title")}
              className="input-admin"
              placeholder="e.g. The Botanical Silhouette"
            />
          </div>

          {/* Storytelling Description */}
          <div className="md:col-span-2">
            <label className="text-xs text-secondary mb-1.5 block font-medium">Long-Form Storytelling Description</label>
            <textarea
              id="storytelling-description"
              {...register("storytelling_description")}
              className="input-admin"
              rows={4}
              placeholder="Explain the background narrative, fabric selection details, and craft origin..."
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-xs text-secondary mb-1.5 block font-medium">Short Standard Description</label>
            <textarea
              id="product-description"
              {...register("description")}
              className="input-admin"
              rows={2}
              placeholder="Brief overview summary of the piece..."
            />
          </div>

          {/* Cinematic Video Link */}
          <div className="md:col-span-2">
            <label className="text-xs text-secondary mb-1.5 block font-medium">Cinematic Lookbook Video URL</label>
            <input
              id="product-video"
              {...register("cinematic_video_url")}
              className="input-admin"
              placeholder="e.g. https://assets.mixkit.co/videos/preview/mixkit-fashion-video.mp4"
            />
          </div>

          {/* Mood Aesthetic */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Mood & Aesthetic</label>
            <input
              id="product-mood"
              {...register("mood_aesthetic")}
              className="input-admin"
              placeholder="e.g. Stealth Wealth"
            />
          </div>

          {/* Occasion */}
          <div>
            <label className="text-xs text-secondary mb-1.5 block font-medium">Occasion</label>
            <input
              id="product-occasion"
              {...register("occasion")}
              className="input-admin"
              placeholder="e.g. Resort Wear"
            />
          </div>

          {/* Sizes & Stock Section */}
          <div className="md:col-span-2 border-t border-rule pt-6 mt-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-secondary">Sizes &amp; Stock Availability</h3>
            <p className="text-[10px] text-secondary font-light mt-1 mb-4">Set the available stock quantity for each size. Set to 0 to mark a size as out of stock.</p>
            <div className="grid grid-cols-5 gap-3">
              {STANDARD_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-primary">{size}</span>
                  <input
                    id={`size-stock-${size}`}
                    type="number"
                    min="0"
                    value={sizeStock[size]}
                    onChange={(e) =>
                      setSizeStock((prev) => ({ ...prev, [size]: Math.max(0, Number(e.target.value)) }))
                    }
                    className={`input-admin text-center px-2 ${
                      sizeStock[size] === 0 ? "opacity-40" : ""
                    }`}
                    placeholder="0"
                  />
                  <span className={`text-[9px] font-semibold tracking-wider uppercase ${
                    sizeStock[size] === 0
                      ? "text-red-400"
                      : sizeStock[size] <= 2
                      ? "text-amber-500"
                      : "text-green-600"
                  }`}>
                    {sizeStock[size] === 0 ? "Out of Stock" : sizeStock[size] <= 2 ? `Low (${sizeStock[size]})` : `${sizeStock[size]} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Tags */}
          <div className="md:col-span-2">
            <label className="text-xs text-secondary mb-1.5 block font-medium">Editorial Tags (Comma-separated)</label>
            <input
              id="product-tags"
              {...register("editorial_tags")}
              className="input-admin"
              placeholder="e.g. Evening Elegance, Seasonal Statement"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
          <button
            id="save-product-btn"
            type="submit"
            disabled={saving}
            className="btn-admin min-w-[120px] justify-center"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
