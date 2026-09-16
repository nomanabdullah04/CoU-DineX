/**
 * CoU DineX — Application Constants
 */

export const APP_NAME = "CoU DineX";
export const APP_TAGLINE = "Your Campus. Your Food. Your Time.";
export const APP_UNIVERSITY = "Comilla University";
export const APP_SHORT_NAME = "DineX";

/** Navigation items for desktop sidebar */
export const NAV_ITEMS = [
  {
    label: "Home",
    href: "/home",
    icon: "Home",
    description: "Discover food around campus",
  },
  {
    label: "Explore",
    href: "/explore",
    icon: "Compass",
    description: "Browse all menus",
  },
  {
    label: "Orders",
    href: "/orders",
    icon: "ShoppingBag",
    description: "Track your orders",
  },
  {
    label: "Campus Map",
    href: "/map",
    icon: "Map",
    description: "Campus food locations",
  },
  {
    label: "Rewards",
    href: "/rewards",
    icon: "Gift",
    description: "Your loyalty points",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "User",
    description: "Account settings",
  },
] as const;

/** Mobile bottom navigation items */
export const MOBILE_NAV_ITEMS = [
  { label: "Home",    href: "/home",    icon: "Home" },
  { label: "Explore", href: "/explore", icon: "Compass" },
  { label: "Orders",  href: "/orders",  icon: "ShoppingBag" },
  { label: "Map",     href: "/map",     icon: "Map" },
  { label: "Profile", href: "/profile", icon: "User" },
] as const;

/** Food categories */
export const FOOD_CATEGORIES = [
  { id: "all",      label: "All" },
  { id: "rice",     label: "Rice" },
  { id: "biryani",  label: "Biryani" },
  { id: "burger",   label: "Burger" },
  { id: "pizza",    label: "Pizza" },
  { id: "snacks",   label: "Snacks" },
  { id: "drinks",   label: "Drinks" },
  { id: "desserts", label: "Desserts" },
  { id: "noodles",  label: "Noodles" },
  { id: "healthy",  label: "Healthy" },
] as const;

/** Order types */
export const ORDER_TYPES = [
  { id: "dine_in",  label: "Eat Here",  icon: "Utensils",  description: "Order at your table" },
  { id: "takeaway", label: "Takeaway",  icon: "ShoppingBag", description: "Pick up your order" },
  { id: "delivery", label: "Deliver",   icon: "MapPin",    description: "Delivered to your location" },
] as const;

/** User roles */
export const USER_ROLES = {
  STUDENT: "STUDENT",
  VISITOR: "VISITOR",
  STAFF: "STAFF",
  DELIVERY_AGENT: "DELIVERY_AGENT",
  KITCHEN_STAFF: "KITCHEN_STAFF",
  ADMIN: "ADMIN",
} as const;

/** Student verification statuses */
export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  MORE_INFO_REQUIRED: "MORE_INFO_REQUIRED",
} as const;

/** Order statuses */
export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  PICKED_UP: "PICKED_UP",
  DELIVERING: "DELIVERING",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

/** Departments at Comilla University */
export const COU_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Economics",
  "Bangla",
  "English",
  "History",
  "Islamic Studies",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Accounting & Information Systems",
  "Management Studies",
  "Marketing",
  "Finance & Banking",
  "Law",
  "Public Administration",
  "Sociology",
  "Political Science",
  "Geography & Environment",
  "Pharmacy",
  "Soil Science",
  "Microbiology",
] as const;

/** Halls at Comilla University */
export const COU_HALLS = [
  "Shaheed Mostafa Kamal Hall",
  "Bangabandhu Sheikh Mujibur Rahman Hall",
  "Bijoy Hall",
  "Muktijuddha Smriti Hall",
  "Shamsunnahar Hall",
  "Pritilata Hall",
  "Begum Khaleda Zia Hall",
] as const;

/** API routes */
export const API_ROUTES = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  STUDENT: {
    PROFILE: "/api/student/profile",
    VERIFICATION: "/api/student/verification",
  },
  MENU: {
    CATEGORIES: "/api/menu/categories",
    ITEMS: "/api/menu/items",
    ITEM: (id: string) => `/api/menu/items/${id}`,
  },
  ORDERS: {
    CREATE: "/api/orders",
    LIST: "/api/orders",
    DETAIL: (id: string) => `/api/orders/${id}`,
    TRACK: (id: string) => `/api/orders/${id}/track`,
  },
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
} as const;
