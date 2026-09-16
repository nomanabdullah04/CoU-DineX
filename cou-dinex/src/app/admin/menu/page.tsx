'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Utensils, Sparkles, AlertTriangle } from 'lucide-react';
import { getItemImageUrl } from '@/lib/foodImages';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AdminMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isDailySpecial: boolean;
  preparationTimeMinutes: number;
  tags: string[];
  category: { id: string; name: string };
  cafeteria: { id: string; name: string };
  inventory: {
    currentStock: number;
    isSoldOut: boolean;
    lowStockThreshold: number;
  } | null;
  reviewCount: number;
  orderCount: number;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  imageUrl: string;
  isAvailable: boolean;
  isDailySpecial: boolean;
  preparationTimeMinutes: string;
  tags: string;
  categoryId: string;
  cafeteriaId: string;
  initialStock: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  imageUrl: '',
  isAvailable: true,
  isDailySpecial: false,
  preparationTimeMinutes: '15',
  tags: '',
  categoryId: '',
  cafeteriaId: '',
  initialStock: '0',
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cafeterias, setCafeterias] = useState<{ id: string; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AdminMenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/menu?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    fetch('/api/menu/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []));
    // Load cafeterias
    fetch('/api/admin/cafeterias').then(r => r.json()).then(d => setCafeterias(d.cafeterias ?? [])).catch(() => {});
  }, []);

  const handleSearchChange = (val: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: AdminMenuItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      discountPrice: item.discountPrice ? String(item.discountPrice) : '',
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
      isDailySpecial: item.isDailySpecial,
      preparationTimeMinutes: String(item.preparationTimeMinutes),
      tags: item.tags.join(', '),
      categoryId: item.category.id,
      cafeteriaId: item.cafeteria.id,
      initialStock: String(item.inventory?.currentStock ?? 0),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      alert('Name, price, and category are required.');
      return;
    }
    setSaving(true);
    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
      imageUrl: formData.imageUrl || null,
      isAvailable: formData.isAvailable,
      isDailySpecial: formData.isDailySpecial,
      preparationTimeMinutes: parseInt(formData.preparationTimeMinutes) || 15,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      categoryId: formData.categoryId,
      cafeteriaId: formData.cafeteriaId,
      ...(editItem ? { currentStock: parseInt(formData.initialStock) || 0 } : { initialStock: parseInt(formData.initialStock) || 0 }),
    };

    try {
      const url = editItem ? `/api/admin/menu/${editItem.id}` : '/api/admin/menu';
      const method = editItem ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowModal(false);
        loadItems();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteConfirm(null); loadItems(); }
    else alert('Failed to delete');
  };

  const handleToggleAvailability = async (item: AdminMenuItem) => {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    loadItems();
  };

  return (
    <div className="admin-menu-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">{total} items in the menu</p>
        </div>
        <button id="create-menu-item-btn" className="btn-primary" onClick={openCreate}>
          + Add Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-menu-toolbar">
        <div className="admin-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            id="admin-menu-search"
            placeholder="Search menu items…"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon flex items-center justify-center text-slate-400"><Utensils size={36} /></div>
          <h3 className="empty-title">No menu items yet</h3>
          <p className="empty-desc">Click &ldquo;Add Item&rdquo; to create your first menu item.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-menu-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Available</th>
                  <th>Orders</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <Image
                            src={item.imageUrl || getItemImageUrl(item.name)}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.cafeteria.name}</p>
                          {item.isDailySpecial && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Sparkles size={11} /> Special
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tag-chip">{item.category.name}</span>
                    </td>
                    <td>
                      <div>
                        <span className="font-bold text-teal-700">৳{item.price.toFixed(0)}</span>
                        {item.discountPrice && (
                          <span className="text-xs text-slate-400 line-through block">৳{item.discountPrice.toFixed(0)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {item.inventory ? (
                        <span className={`font-semibold ${item.inventory.isSoldOut ? 'text-red-500' : item.inventory.currentStock <= item.inventory.lowStockThreshold ? 'text-amber-500' : 'text-green-600'}`}>
                          {item.inventory.isSoldOut ? 'Sold Out' : item.inventory.currentStock}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={() => handleToggleAvailability(item)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td className="text-slate-600">{item.orderCount}</td>
                    <td className="text-slate-600">{item.reviewCount > 0 ? `${item.reviewCount} reviews` : '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-secondary text-xs px-3 py-1.5"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => setDeleteConfirm(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ===== Create/Edit Modal ===== */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>

            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input className="form-input" placeholder="e.g. Chicken Biryani" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Short description…" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (৳) *</label>
                <input className="form-input" type="number" min="0" step="0.5" placeholder="0.00" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Price (৳)</label>
                <input className="form-input" type="number" min="0" step="0.5" placeholder="Optional" value={formData.discountPrice} onChange={e => setFormData(f => ({ ...f, discountPrice: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input" value={formData.categoryId} onChange={e => setFormData(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prep Time (min)</label>
                <input className="form-input" type="number" min="1" value={formData.preparationTimeMinutes} onChange={e => setFormData(f => ({ ...f, preparationTimeMinutes: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input className="form-input" placeholder="https://…" value={formData.imageUrl} onChange={e => setFormData(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" placeholder="spicy, popular, veg" value={formData.tags} onChange={e => setFormData(f => ({ ...f, tags: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">{editItem ? 'Current Stock' : 'Initial Stock'}</label>
              <input className="form-input" type="number" min="0" value={formData.initialStock} onChange={e => setFormData(f => ({ ...f, initialStock: e.target.value }))} />
            </div>

            <div className="flex items-center gap-6 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={formData.isAvailable} onChange={e => setFormData(f => ({ ...f, isAvailable: e.target.checked }))} />
                <span className="text-sm font-semibold text-slate-700">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={formData.isDailySpecial} onChange={e => setFormData(f => ({ ...f, isDailySpecial: e.target.checked }))} />
                <span className="text-sm font-semibold text-slate-700">Daily Special</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirm Modal ===== */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 className="modal-title text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} /> Delete Item
            </h2>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this menu item? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" style={{ padding: '10px 20px' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}