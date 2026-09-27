/**
 * CoU DineX — Phase 13 Innovation Layer Configuration
 * All smart calculations, queue heuristics, rewards, and eco score indicators
 * are centralized and fully configurable here.
 */

// 1. Campus Food Radar Configuration
export const RADAR_CONFIG = {
  // Number of minutes each pending order adds to preparation buffer
  queueTimeFactorMinutes: 2.5,
  // Base kitchen baseline preparation time
  basePrepMinutes: 12,
  // Table occupancy thresholds for crowd levels
  crowdThresholds: {
    low: 0.35,      // < 35% occupied -> LOW CROWD
    medium: 0.70,   // 35% - 70% occupied -> MEDIUM CROWD
    high: 0.85,     // > 70% occupied -> BUSY
  },
  // Default cafeteria operating hours
  operatingHours: {
    open: "08:00",
    close: "21:30",
  },
};

// 2. Smart Queue Heuristics Configuration
export const SMART_QUEUE_CONFIG = {
  // Typical campus rush periods (24h format [startHour, endHour])
  rushHours: [
    { name: "Breakfast Rush", startHour: 8.5, endHour: 10.0, rushLevel: "HIGH" },
    { name: "Lunch Rush", startHour: 12.5, endHour: 14.5, rushLevel: "PEAK" },
    { name: "Afternoon Snack", startHour: 16.5, endHour: 18.0, rushLevel: "MEDIUM" },
    { name: "Dinner Rush", startHour: 19.5, endHour: 21.0, rushLevel: "HIGH" },
  ],
  // Buffer suggested for placing order before peak
  suggestedAdvanceMinutes: 20,
};

// 3. Rewards & Loyalty Tier Configuration
export const REWARDS_CONFIG = {
  // Earn 1 reward point per X BDT spent
  takaPerPoint: 10,
  // Bonus points on milestones
  milestones: {
    firstOrder: 50,
    fifthOrder: 100,
    tenthOrder: 250,
    ecoDiningBonus: 15,
  },
  // Tier thresholds
  tiers: [
    { name: "Bronze Student", minPoints: 0, maxPoints: 200, color: "#CD7F32", badge: "🥉 Bronze", discountPercent: 0 },
    { name: "Silver Foodie", minPoints: 201, maxPoints: 600, color: "#94A3B8", badge: "🥈 Silver", discountPercent: 5 },
    { name: "Gold Campus VIP", minPoints: 601, maxPoints: 1200, color: "#F59E0B", badge: "🥇 Gold VIP", discountPercent: 8 },
    { name: "Platinum Legend", minPoints: 1201, maxPoints: 99999, color: "#0F766E", badge: "💎 Platinum", discountPercent: 12 },
  ],
  // Redeemable rewards catalogue
  redeemableRewards: [
    { id: "VOUCHER_20", title: "৳20 Off Any Meal", pointsCost: 100, discountAmount: 20, minSpend: 100 },
    { id: "FREE_COFFEE", title: "Free Hot / Cold Coffee", pointsCost: 200, discountAmount: 40, minSpend: 80 },
    { id: "VOUCHER_50", title: "৳50 Lunch Voucher", pointsCost: 350, discountAmount: 50, minSpend: 200 },
    { id: "FREE_BURGER", title: "Free Chicken Burger Combo", pointsCost: 600, discountAmount: 120, minSpend: 250 },
  ],
};

// 4. Eco Score Configuration (Indicative, non-scientific sustainable indicators)
export const ECO_SCORE_CONFIG = {
  disclaimer: "Indicative campus eco score based on university dining habit rules; not scientifically calibrated carbon accounting.",
  // Actions that add to eco score (0-100 scale)
  scoringRules: {
    dineInReusablePlates: 10,     // Ate inside cafeteria on stainless plates
    bringOwnTiffin: 15,           // Chose bring-your-own-box option
    plantBasedItem: 5,            // Vegetarian / vegan meal choice
    walkOrBikeDelivery: 8,        // Campus delivery fulfilled by bicycle or foot
    refusedPlasticCutlery: 5,     // Opted out of disposable plastic spoons
  },
  badges: [
    { score: 30, name: "Eco Explorer", icon: "🌱", description: "Beginning mindful dining on campus." },
    { score: 60, name: "Green Campus Hero", icon: "🍃", description: "Frequently avoiding single-use plastics." },
    { score: 85, name: "Sustainability Champion", icon: "🏆", description: "Leading CoU campus in eco-friendly habits." },
  ],
};

// 5. Verified Student Discounts Configuration
export const STUDENT_DISCOUNT_CONFIG = [
  {
    code: "STUDENT10",
    title: "10% Verified Student Discount",
    discountPercent: 10,
    maxDiscount: 40,
    minOrderAmount: 100,
    requiresVerifiedStudent: true,
    badge: "Student Verified",
  },
  {
    code: "HALLNIGHT",
    title: "Hall Late Night Dinner Special",
    discountPercent: 12,
    maxDiscount: 50,
    minOrderAmount: 150,
    requiresVerifiedStudent: false,
    badge: "Hall Resident",
  },
  {
    code: "FRESHER20",
    title: "New Student Welcome Bonus",
    discountPercent: 20,
    maxDiscount: 60,
    minOrderAmount: 120,
    requiresVerifiedStudent: true,
    badge: "Freshers Exclusive",
  },
];

// 6. Class Schedule Pre-Order Recommendations
export const CLASS_PREORDER_CONFIG = {
  // Suggest ordering if class ends within next X minutes
  notificationThresholdMinutes: 35,
  // Kitchen lead time needed before class dismisses
  leadTimeMinutes: 15,
};
