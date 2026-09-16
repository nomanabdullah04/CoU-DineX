/**
 * CoU DineX — TypeScript Types & Interfaces
 */

/* ---------- User & Auth ---------- */
export type UserRole =
  | "STUDENT"
  | "VISITOR"
  | "STAFF"
  | "DELIVERY_AGENT"
  | "KITCHEN_STAFF"
  | "ADMIN";

export type VerificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MORE_INFO_REQUIRED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Student extends User {
  universityId: string;
  department: string;
  session: string;
  hall?: string;
  verificationStatus: VerificationStatus;
  rewardPoints: number;
  ecoScore: number;
}

/* ---------- Menu ---------- */
export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  itemCount: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  category: string;
  categoryId: string;
  isAvailable: boolean;
  isPopular: boolean;
  isVegetarian: boolean;
  preparationTime: number; // in minutes
  rating: number;
  reviewCount: number;
  cafeteriaId: string;
  cafeteriaName: string;
  tags: string[];
}

/* ---------- Cart ---------- */
export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  specialNote?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

/* ---------- Order ---------- */
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  orderType: OrderType;
  status: OrderStatus;
  deliveryLocation?: string;
  tableNumber?: string;
  specialInstructions?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ---------- Location ---------- */
export interface DeliveryLocation {
  id: string;
  label: string;
  type: "HALL" | "DEPARTMENT" | "BUILDING" | "SPOT";
  description?: string;
}

/* ---------- Notification ---------- */
export type NotificationType =
  | "ORDER_UPDATE"
  | "VERIFICATION"
  | "PROMOTION"
  | "SYSTEM"
  | "REWARD";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

/* ---------- Review ---------- */
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  menuItemId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

/* ---------- UI ---------- */
export type Theme = "light" | "dark" | "system";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

/* ---------- API ---------- */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
