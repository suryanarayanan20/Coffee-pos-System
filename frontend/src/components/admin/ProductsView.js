import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import {
  Plus, PencilSimple, Trash, Coffee, CookingPot, X, MagnifyingGlass,
  CaretLeft, CaretRight, FloppyDisk
} from "@phosphor-icons/react";

export default function ProductsView() {
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "coffee", description: "", available: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (category !== "all") params.category = category;
      if (search) params.search = search;
      const res = await api().get("/products", { params });
      setProducts(res.data.products);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  }, [api, page, category, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price: "", category: "coffee", description: "", available: true });
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ name: product.name, price: String(product.price), category: product.category, description: product.description, available: product.available });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editing) {
        await api().put(`/products/${editing.id}`, payload);
      } else {
        await api().post("/products", payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api().delete(`/products/${id}`);
      load();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const fmt = (v) => Number(v).toFixed(2);

  return (
    <div className="p-6 h-full overflow-y-auto" data-testid="products-view">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2C1E16] mb-1" style={{ fontFamily: 'Outfit' }}>Products</h2>
          <p className="text-sm text-[#8A7969]">Manage your menu items</p>
        </div>
        <button
          data-testid="add-product-btn"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97757] text-white hover:bg-[#BF6245] transition-colors rounded-xl font-medium text-sm"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
          <input
            data-testid="products-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
            placeholder="Search products..."
          />
        </div>
        <div className="flex gap-2">
          {["all", "coffee", "food"].map(cat => (
            <button
              key={cat}
              data-testid={`products-filter-${cat}`}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === cat ? "bg-[#D97757] text-white" : "bg-[#F4F1EA] text-[#5C4A3D] hover:bg-[#EAE5D9]"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#EAE5D9] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EAE5D9]">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Product</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Category</th>
              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Price</th>
              <th className="text-center px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Status</th>
              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#EAE5D9]">
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-32 animate-pulse" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-16 animate-pulse" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-16 animate-pulse ml-auto" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-16 animate-pulse mx-auto" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-20 animate-pulse ml-auto" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#8A7969]">No products found</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="border-b border-[#EAE5D9] hover:bg-[#FDFBF7] transition-colors" data-testid={`product-row-${product.id.slice(0, 8)}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        product.category === "coffee" ? "bg-[#D97757]/10" : "bg-[#7A8A70]/10"
                      }`}>
                        {product.category === "coffee" ? <Coffee size={18} weight="duotone" className="text-[#D97757]" /> : <CookingPot size={18} weight="duotone" className="text-[#7A8A70]" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#2C1E16]">{product.name}</p>
                        <p className="text-xs text-[#8A7969] line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F4F1EA] text-[#5C4A3D] capitalize">{product.category}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-sm text-[#2C1E16]" style={{ fontFamily: 'JetBrains Mono' }}>
                    &#8377;{fmt(product.price)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      product.available ? "bg-[#7A8A70]/10 text-[#7A8A70]" : "bg-[#C95A49]/10 text-[#C95A49]"
                    }`}>
                      {product.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        data-testid={`edit-product-${product.id.slice(0, 8)}`}
                        onClick={() => openEdit(product)}
                        className="p-2 rounded-lg hover:bg-[#F4F1EA] text-[#5C4A3D] transition-colors"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        data-testid={`delete-product-${product.id.slice(0, 8)}`}
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg hover:bg-[#C95A49]/10 text-[#C95A49] transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border border-[#EAE5D9] text-[#5C4A3D] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors">
            <CaretLeft size={18} />
          </button>
          <span className="text-sm text-[#5C4A3D]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg border border-[#EAE5D9] text-[#5C4A3D] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors">
            <CaretRight size={18} />
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#2C1E16]/40 flex items-center justify-center p-6 z-50" data-testid="product-form-modal">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_8px_32px_rgba(44,30,22,0.12)] animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-[#EAE5D9]">
              <h3 className="font-bold text-lg text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>
                {editing ? "Edit Product" : "Add Product"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[#F4F1EA] text-[#5C4A3D] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Name</label>
                <input
                  data-testid="product-form-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Price (₹)</label>
                  <input
                    data-testid="product-form-price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({...form, price: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Category</label>
                  <select
                    data-testid="product-form-category"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
                  >
                    <option value="coffee">Coffee</option>
                    <option value="food">Food</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Description</label>
                <textarea
                  data-testid="product-form-description"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm resize-none"
                  placeholder="Brief description"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Available</label>
                <button
                  data-testid="product-form-available"
                  onClick={() => setForm({...form, available: !form.available})}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.available ? "bg-[#7A8A70]" : "bg-[#EAE5D9]"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.available ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#EAE5D9]">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-[#F4F1EA] text-[#2C1E16] hover:bg-[#EAE5D9] transition-colors rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                data-testid="product-form-save"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#D97757] text-white hover:bg-[#BF6245] transition-colors rounded-xl font-medium text-sm disabled:opacity-50"
              >
                <FloppyDisk size={18} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
