"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { getItemImageUrl } from '@/lib/foodImages';
import {
  Clock,
  Star,
  FileText,
  Package,
  Building2,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Sparkles,
  MessageSquare,
  ShoppingBag,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; fullName: string; avatarUrl: string | null };
}

interface FoodDetail {
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
  inventory: { currentStock: number; isSoldOut: boolean; lowStockThreshold: number } | null;
  avgRating: number | null;
  reviewCount: number;
  reviews: Review[];
}

function StarDisplay({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-xl ${i < full ? 'text-amber-400' : i === full && half ? 'text-amber-300' : 'text-slate-300'}`}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card">
      <div className="flex items-center gap-3 mb-2">
        <div className="review-avatar">
          {review.user.avatarUrl ? (
            <Image src={review.user.avatarUrl} alt={review.user.fullName} fill className="rounded-full object-cover" />
          ) : (
            <span className="text-lg">{review.user.fullName.charAt(0)}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-800">{review.user.fullName}</p>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
            <span className="text-xs text-slate-400">
              {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
      {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}
    </div>
  );
}

export default function FoodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [item, setItem] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    fetch(`/api/menu/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setItem)
      .catch(() => setError('Food item not found.'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="food-detail-page">
        <div className="food-detail-inner animate-pulse">
          <div className="food-detail-image-wrap bg-slate-200 rounded-2xl" />
          <div className="food-detail-info">
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-slate-200 rounded w-full mb-2" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="food-detail-page flex items-center justify-center min-h-[60vh]">
        <div className="empty-state">
          <div className="empty-icon flex items-center justify-center text-slate-400">
            <AlertCircle size={36} />
          </div>
          <h3 className="empty-title">Item Not Found</h3>
          <p className="empty-desc">{error}</p>
          <button className="btn-primary mt-4" onClick={() => router.back()}>← Go Back</button>
        </div>
      </div>
    );
  }

  const effectivePrice = item.discountPrice ?? item.price;
  const hasDiscount = item.discountPrice !== null && item.discountPrice < item.price;
  const lowStock = item.inventory && !item.inventory.isSoldOut && item.inventory.currentStock <= item.inventory.lowStockThreshold;

  return (
    <div className="food-detail-page">
      {/* Back */}
      <button className="back-btn" onClick={() => router.back()}>
        ← Back to Menu
      </button>

      <div className="food-detail-inner">
        {/* Left: Image */}
        <div className="food-detail-image-section">
          <div className="food-detail-image-wrap">
            <Image
              src={item.imageUrl || getItemImageUrl(item.name)}
              alt={item.name}
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.isDailySpecial && (
                <span className="badge-special text-sm px-3 py-1.5 inline-flex items-center gap-1.5">
                  <Sparkles size={13} /> Daily Special
                </span>
              )}
              {hasDiscount && (
                <span className="badge-discount text-sm px-3 py-1.5">
                  -{Math.round(((item.price - item.discountPrice!) / item.price) * 100)}% OFF
                </span>
              )}
            </div>

            {item.isSoldOut && (
              <div className="sold-out-overlay rounded-2xl">
                <span className="sold-out-text text-2xl">SOLD OUT</span>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="detail-stats-row">
            <div className="detail-stat">
              <span className="detail-stat-icon"><Clock size={15} /></span>
              <span className="detail-stat-label">Prep Time</span>
              <span className="detail-stat-value">{item.preparationTimeMinutes} min</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-icon"><Star size={15} className="text-amber-500 fill-amber-500" /></span>
              <span className="detail-stat-label">Rating</span>
              <span className="detail-stat-value">{item.avgRating ? `${item.avgRating}/5` : 'N/A'}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-icon"><FileText size={15} /></span>
              <span className="detail-stat-label">Reviews</span>
              <span className="detail-stat-value">{item.reviewCount}</span>
            </div>
            {item.inventory && (
              <div className="detail-stat">
                <span className="detail-stat-icon"><Package size={15} /></span>
                <span className="detail-stat-label">Stock</span>
                <span className="detail-stat-value">{item.inventory.currentStock}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="food-detail-info">
          {/* Category + Cafeteria */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="tag-chip">{item.category.name}</span>
            <span className="tag-chip tag-chip-secondary inline-flex items-center gap-1.5">
              <Building2 size={13} /> {item.cafeteria.name}
            </span>
            {item.cafeteria.isOpen ? (
              <span className="status-open">Open</span>
            ) : (
              <span className="status-closed">Closed</span>
            )}
          </div>

          <h1 className="food-detail-title">{item.name}</h1>

          {/* Rating */}
          {item.avgRating && (
            <div className="flex items-center gap-2 mb-4">
              <StarDisplay rating={item.avgRating} />
              <span className="text-slate-500 text-sm">{item.avgRating} · {item.reviewCount} reviews</span>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="food-detail-desc">{item.description}</p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {item.tags.map((tag) => (
                <span key={tag} className="tag-chip"># {tag}</span>
              ))}
            </div>
          )}

          {/* Availability Alerts */}
          {item.isSoldOut ? (
            <div className="alert-sold-out">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>This item is currently sold out. Check back later!</span>
            </div>
          ) : lowStock ? (
            <div className="alert-low-stock">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <span>Only {item.inventory?.currentStock} left! Order soon.</span>
            </div>
          ) : (
            <div className="alert-available">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span>Available now — {item.preparationTimeMinutes} min prep time</span>
            </div>
          )}

          {/* Price */}
          <div className="price-section">
            <span className="food-detail-price">৳{effectivePrice.toFixed(0)}</span>
            {hasDiscount && (
              <span className="food-detail-price-original">৳{item.price.toFixed(0)}</span>
            )}
          </div>

          {/* Quantity + Add */}
          {!item.isSoldOut && (
            <div className="cart-actions">
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity === 1}
                >−</button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                >+</button>
              </div>
              <button
                className="add-to-cart-btn"
                style={{
                  background: addedSuccess
                    ? "#059669"
                    : "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
                  transition: "background 0.2s ease",
                }}
                onClick={() => {
                  addItem(
                    {
                      id: item.id,
                      name: item.name,
                      price: effectivePrice,
                      originalPrice: item.price,
                      imageUrl: item.imageUrl || getItemImageUrl(item.name),
                      cafeteriaId: item.cafeteria.id,
                      cafeteriaName: item.cafeteria.name,
                      preparationTimeMinutes: item.preparationTimeMinutes,
                    },
                    quantity
                  );
                  setAddedSuccess(true);
                  setTimeout(() => setAddedSuccess(false), 2500);
                }}
              >
                {addedSuccess ? (
                  <span>Added to Cart!</span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag size={16} /> Add to Cart · ৳{(effectivePrice * quantity).toFixed(0)}
                  </span>
                )}
              </button>
              {addedSuccess && (
                <Link
                  href="/cart"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--primary)",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  View Cart →
                </Link>
              )}
            </div>
          )}

          {/* Cafeteria Status */}
          {!item.cafeteria.isOpen && (
            <p className="text-sm text-amber-600 mt-2 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-600" />
              <span>The cafeteria is currently closed. Orders can be placed when it reopens.</span>
            </p>
          )}
        </div>
      </div>

      {/* ===== Reviews Section ===== */}
      <div className="reviews-section">
        <h2 className="reviews-title">
          Customer Reviews
          {item.avgRating && (
            <span className="reviews-rating-badge">
              ★ {item.avgRating} · {item.reviewCount} reviews
            </span>
          )}
        </h2>

        {item.reviews.length === 0 ? (
          <div className="empty-state py-12">
            <div className="empty-icon flex items-center justify-center text-slate-400">
              <MessageSquare size={36} />
            </div>
            <h3 className="empty-title">No reviews yet</h3>
            <p className="empty-desc">Be the first to review this item after ordering!</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {item.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}