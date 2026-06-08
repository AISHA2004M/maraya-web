import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { Sparkles, Building2, Save, ArrowLeft, Loader2, Image, AlignLeft, Palette, Type } from "lucide-react";

export default function BrandCMS() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields State
  const [form, setForm] = useState({
    description: "",
    logo_url: "",
    banner_url: "",
    hero_title: "",
    hero_subtitle: "",
    hero_image_url: "",
    hero_cta_text: "",
    story_title: "",
    story_description: "",
    story_image_url: "",
    philosophy_title: "",
    philosophy_text: "",
    accent_color: "#FFFFFF",
    font_family: "Hanken Grotesk, sans-serif",
    seasonal_title: "",
    seasonal_desc: ""
  });

  useEffect(() => {
    if (!brand_slug) return;
    setLoading(true);
    api.get(`/products/brands/slug/${brand_slug}`)
      .then((res) => {
        setBrand(res.data);
        setForm({
          description: res.data.description || "",
          logo_url: res.data.logo_url || "",
          banner_url: res.data.banner_url || "",
          hero_title: res.data.hero_title || "",
          hero_subtitle: res.data.hero_subtitle || "",
          hero_image_url: res.data.hero_image_url || "",
          hero_cta_text: res.data.hero_cta_text || "",
          story_title: res.data.story_title || "",
          story_description: res.data.story_description || "",
          story_image_url: res.data.story_image_url || "",
          philosophy_title: res.data.philosophy_title || "",
          philosophy_text: res.data.philosophy_text || "",
          accent_color: res.data.accent_color || "#FFFFFF",
          font_family: res.data.font_family || "Hanken Grotesk, sans-serif",
          seasonal_title: res.data.seasonal_title || "",
          seasonal_desc: res.data.seasonal_desc || ""
        });
      })
      .catch((err) => {
        console.error("Failed to load brand details for CMS", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [brand_slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brand) return;
    setSaving(true);
    setSuccess(false);

    try {
      await api.patch(`/products/brands/${brand.id}/cms`, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save brand CMS modifications.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-secondary mx-auto" size={24} />
          <p className="text-xs uppercase tracking-widest text-secondary font-bold">Synchronizing Brand Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans text-primary">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <Building2 size={22} />
            {brand?.name} Atelier CMS
          </h1>
          <p className="text-secondary text-sm">Configure your boutique homepage visual identity, seasonal edits, and narrative assets.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs flex items-center gap-1.5 uppercase font-bold tracking-wider hover:text-black transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          
          {/* Main Form Body */}
          <div className="space-y-6">
            
            {/* 1. Identity & Logos */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <Image size={14} />
                Identity & Canvas Images
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Logo URL</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  />
                  {form.logo_url && (
                    <img src={form.logo_url} alt="Logo preview" className="h-10 mt-2 object-contain bg-[#111111] p-1 border border-outline-variant rounded" />
                  )}
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Banner Banner URL</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.banner_url}
                    onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                  />
                  {form.banner_url && (
                    <img src={form.banner_url} alt="Banner preview" className="h-10 mt-2 object-cover border border-outline-variant rounded w-full" />
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-secondary mb-1.5 block">Boutique Synopsis / Description</label>
                <textarea
                  className="input-admin min-h-[60px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {/* 2. Hero Campaign Block */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <Sparkles size={14} />
                Hero Campaign Billboard
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Hero Headline</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.hero_title}
                    onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Hero CTA Button Text</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.hero_cta_text}
                    onChange={(e) => setForm({ ...form, hero_cta_text: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Hero Image Billboard URL</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.hero_image_url}
                    onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Hero Subtext Description</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.hero_subtitle}
                    onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                  />
                </div>
              </div>
              {form.hero_image_url && (
                <img src={form.hero_image_url} alt="Hero preview" className="w-full h-32 object-cover border border-outline-variant rounded" />
              )}
            </div>

            {/* 3. Brand Story Narrative */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <AlignLeft size={14} />
                House Story & Editorial Biography
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Story Headline</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.story_title}
                    onChange={(e) => setForm({ ...form, story_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Story Image URL</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.story_image_url}
                    onChange={(e) => setForm({ ...form, story_image_url: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-secondary mb-1.5 block">Story Narrative Biography Text</label>
                <textarea
                  className="input-admin min-h-[80px]"
                  value={form.story_description}
                  onChange={(e) => setForm({ ...form, story_description: e.target.value })}
                />
              </div>
              {form.story_image_url && (
                <img src={form.story_image_url} alt="Story preview" className="w-full h-32 object-cover border border-outline-variant rounded" />
              )}
            </div>

            {/* 4. Seasonal Campaign Narratives */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <AlignLeft size={14} />
                Seasonal Collection Settings
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Seasonal Collection Title</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.seasonal_title}
                    onChange={(e) => setForm({ ...form, seasonal_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Seasonal Description</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.seasonal_desc}
                    onChange={(e) => setForm({ ...form, seasonal_desc: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 5. Philosophy Quote */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <AlignLeft size={14} />
                Creative Philosophy Quote
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Philosophical Author / Title</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.philosophy_title}
                    onChange={(e) => setForm({ ...form, philosophy_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">Philosophical Manifesto Text</label>
                  <input
                    type="text"
                    className="input-admin"
                    value={form.philosophy_text}
                    onChange={(e) => setForm({ ...form, philosophy_text: e.target.value })}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Design System Settings & Live Preview */}
          <div className="space-y-6">
            
            {/* Visual Identity Settings */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <Palette size={14} />
                Bespoke Design Token
              </h2>
              
              <div>
                <label className="text-xs text-secondary mb-1.5 block">Accent Color (Boutique Background)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 border border-outline-variant rounded cursor-pointer"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-admin flex-1"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block">Typography Font Family</label>
                <select
                  className="input-admin"
                  value={form.font_family}
                  onChange={(e) => setForm({ ...form, font_family: e.target.value })}
                >
                  <option value="Hanken Grotesk, sans-serif">Hanken Grotesk (Modern Sans)</option>
                  <option value="Bodoni Moda, serif">Bodoni Moda (Luxury Classic Serif)</option>
                  <option value="Montserrat, sans-serif">Montserrat (Structured Geometric)</option>
                </select>
              </div>
            </div>

            {/* Live Theme Preview Box */}
            <div className="admin-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-outline-variant pb-2">
                <Type size={14} />
                Live Theme Preview
              </h2>
              
              <div 
                className="p-6 border border-outline-variant rounded-xl text-center space-y-4 transition-all duration-300"
                style={{ 
                  backgroundColor: form.accent_color,
                  fontFamily: form.font_family,
                  color: "#111111"
                }}
              >
                <span className="text-[8px] font-bold tracking-[0.2em] opacity-60 uppercase">ATELIER NARRATIVE</span>
                <h3 className="text-xl font-bold tracking-tight">
                  {form.hero_title || brand?.name}
                </h3>
                <p className="text-[10px] opacity-75 max-w-[200px] mx-auto leading-relaxed">
                  {form.hero_subtitle || "Visual styling applied dynamically."}
                </p>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-black text-white text-[8px] font-bold tracking-widest uppercase rounded-none"
                  style={{ border: "1px solid black" }}
                >
                  {form.hero_cta_text || "Enter Atelier"}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="space-y-3">
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-4 py-3 rounded-lg text-center font-bold uppercase tracking-wider animate-pulse">
                  Settings Saved Successfully
                </div>
              )}
              
              <button
                type="submit"
                disabled={saving}
                className="btn-admin w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>{saving ? "Synchronizing CMS..." : "Publish to Boutique"}</span>
              </button>
            </div>

          </div>

        </div>
      </form>
      
    </div>
  );
}
