import { useEffect, useState } from "react";
import { getBrands } from "../api/products";
import api from "../api/client";
import { Plus, Building2 } from "lucide-react";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", logo_url: "" });
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    getBrands().then(setBrands).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setAdding(true);
    try {
      await api.post("/products/brands", form);
      setForm({ name: "", description: "", logo_url: "" });
      load();
    } catch {
      alert("Failed to add brand");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
        <Building2 size={22} />
        Brands
      </h1>
      <p className="text-secondary text-sm mb-8">{brands.length} brands</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="admin-card">
          <h2 className="font-bold mb-4 text-sm">Add Brand</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Name *</label>
              <input
                id="brand-name"
                className="input-admin"
                placeholder="e.g. Gucci"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Description</label>
              <input
                className="input-admin"
                placeholder="Brief description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Logo URL</label>
              <input
                className="input-admin"
                placeholder="https://..."
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            </div>
            <button type="submit" disabled={adding} className="btn-admin w-full justify-center">
              <Plus size={14} />
              {adding ? "Adding..." : "Add Brand"}
            </button>
          </form>
        </div>

        {/* Brands List */}
        <div className="lg:col-span-2 admin-card">
          <h2 className="font-bold mb-4 text-sm">All Brands</h2>
          {loading ? (
            <p className="text-secondary text-sm">Loading...</p>
          ) : brands.length === 0 ? (
            <p className="text-secondary text-sm">No brands yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {brands.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                      <Building2 size={14} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    {b.description && (
                      <p className="text-[10px] text-secondary truncate">{b.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
