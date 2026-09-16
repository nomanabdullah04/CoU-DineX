'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { getItemImageUrl } from '@/lib/foodImages';
import { Search, Sparkles, Clock } from 'lucide-react';

// ============ Types ============
interface Category {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isSoldOut: boolean;
  isDailySpecial: boolean;
  preparationTimeMinutes: number;
  tags: string[];
  category: { id: string; name: string };
  cafeteria: { id: string; name: string; isOpen: boolean };
  avgRating: number | null;
  reviewCount: number;
}



// ============ Star Rating Component ============
function StarRating({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) return <span className="text-xs text-slate-400">No reviews</span>;
  const stars = Math.round(rating);
  return (
    <span className="flex items-center gap-1">
      <span className="text-amber-400 text-xs">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      <span className="text-xs text-slate-500">({count})</span>
    </span>
  );
}

// ============ Food Card ============
function FoodCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const { addItem } = useCart();
  const effectivePrice = item.discountPrice ?? item.price;
  const hasDiscount = item.discountPrice !== null && item.discountPrice < item.price;

  return (
    <div
      className="food-card group"
      onClick={!item.isSoldOut ? onClick : undefined}
      style={{ cursor: item.isSoldOut ? 'not-allowed' : 'pointer' }}
    >
      {/* Image */}
      <div className="food-card-image-wrap">
        <Image
          src={item.imageUrl || getItemImageUrl(item.name)}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isDailySpecial && (
            <span className="badge-special inline-flex items-center gap-1">
              <Sparkles size={11} /> Special
            </span>
          )}
          {hasDiscount && (
            <span className="badge-discount">
              -{Math.round(((item.price - item.discountPrice!) / item.price) * 100)}%
            </span>
          )}
        </div>

        {/* Sold Out Overlay */}
        {item.isSoldOut && (
          <div className="sold-out-overlay">
            <span className="sold-out-text">SOLD OUT</span>
          </div>
        )}

        {/* Prep time */}
        <div className="absolute bottom-2 right-2">
          <span className="prep-time-badge inline-flex items-center gap-1">
            <Clock size={11} /> {item.preparationTimeMinutes}m
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="food-card-body">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="food-card-title">{item.name}</h3>
        </div>

        {item.description && (
          <p className="food-card-desc">{item.description}</p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}

        {/* Price & Action */}
        <div className="food-card-footer">
          <div className="flex items-baseline gap-1.5">
            <span className="price-current">৳{effectivePrice.toFixed(0)}</span>
            {hasDiscount && (
              <span className="price-original">৳{item.price.toFixed(0)}</span>
            )}
          </div>
          {!item.isSoldOut && (
            <div className="flex items-center gap-1.5">
              <button
                className="add-btn"
                style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
              >
                View
              </button>
              <button
                className="add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addItem({
                    id: item.id,
                    name: item.name,
                    price: effectivePrice,
                    originalPrice: item.price,
                    imageUrl: item.imageUrl || getItemImageUrl(item.name),
                    cafeteriaId: item.cafeteria?.id || 'central-cafeteria',
                    cafeteriaName: item.cafeteria?.name || 'Central Cafeteria',
                    preparationTimeMinutes: item.preparationTimeMinutes,
                  });
                }}
                title="Add to cart"
              >
                + Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Skeleton Card ============
function SkeletonCard() {
  return (
    <div className="food-card animate-pulse">
      <div className="food-card-image-wrap bg-slate-200" />
      <div className="food-card-body">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-full mb-1" />
        <div className="h-3 bg-slate-200 rounded w-2/3 mb-3" />
        <div className="flex justify-between">
          <div className="h-5 bg-slate-200 rounded w-16" />
          <div className="h-8 bg-slate-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ============ Main Page ============
export default function ExplorePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [available, setAvailable] = useState('true');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories
  useEffect(() => {
    setCategoriesLoading(true);
    fetch('/api/menu/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Load items
  const loadItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '24',
      sort,
    });
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (available) params.set('available', available);

    try {
      const res = await fetch(`/api/menu?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, available, sort, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id === selectedCategory ? '' : id);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="explore-page">
      {/* ===== Hero Search ===== */}
      <div className="explore-hero">
        <div className="explore-hero-inner">
          <h1 className="explore-title">What would you like to eat?</h1>
          <p className="explore-subtitle">Browse the CoU DineX cafeteria menu</p>
          <div className="explore-search-bar">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="menu-search"
              type="text"
              placeholder="Search rice, chicken, fish…"
              className="explore-search-input"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="explore-body">
        {/* ===== Sidebar Filters ===== */}
        <aside className="explore-sidebar">
          {/* Availability */}
          <div className="filter-section">
            <h3 className="filter-title">Availability</h3>
            <div className="filter-options">
              {[
                { label: 'Available Now', value: 'true' },
                { label: 'All Items', value: '' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-chip ${available === opt.value ? 'active' : ''}`}
                  onClick={() => { setAvailable(opt.value); setPage(1); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="filter-section">
            <h3 className="filter-title">Sort By</h3>
            <div className="filter-options">
              {[
                { label: 'Popular', value: 'popular' },
                { label: 'Price: Low', value: 'price_asc' },
                { label: 'Price: High', value: 'price_desc' },
                { label: 'Newest', value: 'newest' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-chip ${sort === opt.value ? 'active' : ''}`}
                  onClick={() => { setSort(opt.value); setPage(1); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <h3 className="filter-title">Categories</h3>
            {categoriesLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 bg-slate-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="filter-options">
                <button
                  className={`filter-chip w-full justify-start ${selectedCategory === '' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('')}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`filter-chip w-full justify-start ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {cat.name}
                    <span className="ml-auto text-xs opacity-60">({cat.itemCount})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ===== Main Grid ===== */}
        <main className="explore-main">
          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">
              {loading ? 'Loading…' : `${total} item${total !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="food-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon flex items-center justify-center text-slate-400">
                <Search size={36} />
              </div>
              <h3 className="empty-title">No items found</h3>
              <p className="empty-desc">Try adjusting your filters or search terms</p>
              <button
                className="btn-primary mt-4"
                onClick={() => { setSearch(''); setSelectedCategory(''); setAvailable(''); setPage(1); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="food-grid">
                {items.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    onClick={() => router.push(`/explore/${item.id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}