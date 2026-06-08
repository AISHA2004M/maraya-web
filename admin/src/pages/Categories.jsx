import { useEffect, useState } from "react";
import { getCategories } from "../api/products";
import api from "../api/client";
import { Plus, Tag } from "lucide-react";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    getCategories().then(setCats).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post("/products/categories", { name: newName, parent_id: parentId || null });
      setNewName("");
      setParentId("");
      load();
    } catch {
      alert("Failed to add category");
    } finally {
      setAdding(false);
    }
  };

  const topLevel = cats.filter((c) => !c.parent_id);
  const subOf = (id) => cats.filter((c) => c.parent_id === id);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
        <Tag size={22} />
        Categories
      </h1>
      <p className="text-secondary text-sm mb-8">{cats.length} categories (hierarchical)</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="admin-card">
          <h2 className="font-bold mb-4 text-sm">Add Category</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Name</label>
              <input
                id="category-name"
                className="input-admin"
                placeholder="e.g. Dresses"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Parent Category (optional)</label>
              <select id="category-parent" className="input-admin" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">None (top-level)</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={adding} className="btn-admin w-full justify-center">
              <Plus size={14} />
              {adding ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Tree */}
        <div className="lg:col-span-2 admin-card">
          <h2 className="font-bold mb-4 text-sm">Category Tree</h2>
          {loading ? (
            <p className="text-secondary text-sm">Loading...</p>
          ) : topLevel.length === 0 ? (
            <p className="text-secondary text-sm">No categories yet.</p>
          ) : (
            <ul className="space-y-2">
              {topLevel.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-surface-container-low">
                    <Tag size={13} className="text-primary shrink-0" />
                    <span className="font-medium text-sm">{c.name}</span>
                    <span className="text-xs text-secondary ml-auto">id:{c.id}</span>
                  </div>
                  {subOf(c.id).map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 py-1.5 px-3 ml-6 mt-1 rounded-lg bg-surface-container-low">
                      <span className="text-secondary text-xs">└</span>
                      <Tag size={11} className="text-secondary" />
                      <span className="text-sm text-secondary">{sub.name}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
