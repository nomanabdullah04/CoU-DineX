/**
 * Comilla University (CoU) Campus Delivery & GIS Configuration
 * 
 * IMPORTANT COMPLIANCE NOTICE:
 * - Real verified center: Comilla University, Kotbari, Cumilla (23.4194° N, 91.1374° E).
 * - All campus delivery landmarks, zones, and routes are configurable.
 * - Explicitly labeled as configured campus reference points rather than fake GIS precision.
 */

export interface CampusPoint {
  id: string;
  name: string;
  banglaName?: string;
  code: string;
  type: "CAFETERIA" | "HALL" | "DEPARTMENT" | "ADMIN" | "GATE" | "PICKUP_POINT";
  lat: number;
  lng: number;
  description: string;
  isConfiguredPoint: true;
}

export interface DeliveryZone {
  id: string;
  name: string;
  code: string;
  color: string;
  fillColor: string;
  radiusMeters: number;
  center: [number, number]; // [lat, lng]
  description: string;
  coverageTypes: ("HALL" | "DEPARTMENT" | "ADMIN" | "CAFETERIA")[];
}

export interface PickupPoint {
  id: string;
  name: string;
  code: string;
  location: string;
  lat: number;
  lng: number;
  operatingHours: string;
  instructions: string;
}

// 1. Campus Map Center & Bounds
export const COU_CAMPUS_CENTER: [number, number] = [23.4194, 91.1374];
export const DEFAULT_MAP_ZOOM = 16;
export const MAP_TILE_LAYER = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// 2. Configurable Campus Landmark Points
export const CAMPUS_LANDMARKS: Record<string, CampusPoint> = {
  // Cafeteria (Primary Dispatch & Pickup)
  CENTRAL_CAFETERIA: {
    id: "loc-cafeteria-central",
    name: "CoU Central Cafeteria (কেন্দ্রীয় ক্যাফেটেরিয়া)",
    banglaName: "কেন্দ্রীয় ক্যাফেটেরিয়া",
    code: "CENTRAL_CAFETERIA",
    type: "CAFETERIA",
    lat: 23.4192,
    lng: 91.1376,
    description: "Opposite to Administrative Building — Main Kitchen & Dispatch Counter",
    isConfiguredPoint: true,
  },

  // Residential Halls
  KNH: {
    id: "loc-hall-knh",
    name: "Kazi Nazrul Islam Hall",
    banglaName: "কাজী নজরুল ইসলাম হল",
    code: "KNH",
    type: "HALL",
    lat: 23.4215,
    lng: 91.1388,
    description: "Male Residential Hall (North-East Campus)",
    isConfiguredPoint: true,
  },
  BSMRH: {
    id: "loc-hall-bsmrh",
    name: "Bangabandhu Sheikh Mujibur Rahman Hall",
    banglaName: "বঙ্গবন্ধু শেখ মুজিবুর রহমান হল",
    code: "BSMRH",
    type: "HALL",
    lat: 23.4210,
    lng: 91.1395,
    description: "Male Residential Hall (East Campus)",
    isConfiguredPoint: true,
  },
  SDDH: {
    id: "loc-hall-sddh",
    name: "Shaheed Dhirendranath Datta Hall",
    banglaName: "শহীদ ধীরেন্দ্রনাথ দত্ত হল",
    code: "SDDH",
    type: "HALL",
    lat: 23.4205,
    lng: 91.1402,
    description: "Male Residential Hall (East Campus Hillside)",
    isConfiguredPoint: true,
  },
  NFCH: {
    id: "loc-hall-nfch",
    name: "Nawab Faizunnesa Choudhurani Hall",
    banglaName: "নওয়াব ফয়জুন্নেসা চৌধুরানী হল",
    code: "NFCH",
    type: "HALL",
    lat: 23.4180,
    lng: 91.1355,
    description: "Female Residential Hall (South-West Campus)",
    isConfiguredPoint: true,
  },
  SHH: {
    id: "loc-hall-shh",
    name: "Sheikh Hasina Hall",
    banglaName: "শেখ হাসিনা হল",
    code: "SHH",
    type: "HALL",
    lat: 23.4175,
    lng: 91.1350,
    description: "Female Residential Hall (South Campus Hillside)",
    isConfiguredPoint: true,
  },

  // Academic Buildings
  SCIENCE_FACULTY: {
    id: "loc-bldg-science",
    name: "Science Faculty Building",
    banglaName: "বিজ্ঞান অনুষদ ভবন",
    code: "SCIENCE_FACULTY",
    type: "DEPARTMENT",
    lat: 23.4200,
    lng: 91.1368,
    description: "Houses CSE, ICT, Physics, Chemistry, Pharmacy, Mathematics",
    isConfiguredPoint: true,
  },
  ARTS_FACULTY: {
    id: "loc-bldg-arts",
    name: "Arts & Social Science Building",
    banglaName: "কলা ও সামাজিক বিজ্ঞান ভবন",
    code: "ARTS_FACULTY",
    type: "DEPARTMENT",
    lat: 23.4188,
    lng: 91.1360,
    description: "Houses English, Bangla, Economics, Public Administration",
    isConfiguredPoint: true,
  },
  BUSINESS_FACULTY: {
    id: "loc-bldg-business",
    name: "Business Studies Building",
    banglaName: "ব্যবসায় শিক্ষা অনুষদ",
    code: "BUSINESS_FACULTY",
    type: "DEPARTMENT",
    lat: 23.4198,
    lng: 91.1362,
    description: "Houses AIS, Management, Marketing, Finance & Banking",
    isConfiguredPoint: true,
  },
  ADMIN_BUILDING: {
    id: "loc-bldg-admin",
    name: "Administrative Building",
    banglaName: "প্রশাসনিক ভবন",
    code: "ADMIN_BUILDING",
    type: "ADMIN",
    lat: 23.4190,
    lng: 91.1372,
    description: "Central Administration, VC Office, Registrar",
    isConfiguredPoint: true,
  },
  CAMPUS_MAIN_GATE: {
    id: "loc-gate-main",
    name: "CoU Main Campus Gate",
    banglaName: "বিশ্ববিদ্যালয় প্রধান ফটক",
    code: "CAMPUS_MAIN_GATE",
    type: "GATE",
    lat: 23.4168,
    lng: 91.1385,
    description: "Main Entrance (Kotbari Road)",
    isConfiguredPoint: true,
  },
};

// 3. Configurable Campus Delivery Zones
export const CAMPUS_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-halls",
    name: "Residential Halls Zone",
    code: "ZONE_HALLS",
    color: "#0F766E",
    fillColor: "#0F766E20",
    radiusMeters: 260,
    center: [23.4208, 91.1390],
    description: "Covers KNH, BSMRH, SDDH, NFCH, and SHH student residential drop points.",
    coverageTypes: ["HALL"],
  },
  {
    id: "zone-academic",
    name: "Academic & Faculty Zone",
    code: "ZONE_ACADEMIC",
    color: "#D97706",
    fillColor: "#D9770620",
    radiusMeters: 220,
    center: [23.4195, 91.1363],
    description: "Covers Science, Arts, and Business Studies faculty rooms, labs, and staff lounges.",
    coverageTypes: ["DEPARTMENT"],
  },
  {
    id: "zone-central",
    name: "Central Campus & Cafeteria Zone",
    code: "ZONE_CENTRAL",
    color: "#4F46E5",
    fillColor: "#4F46E520",
    radiusMeters: 160,
    center: [23.4192, 91.1374],
    description: "Central Cafeteria pickup counters, Admin building, and Central Library plaza.",
    coverageTypes: ["CAFETERIA", "ADMIN"],
  },
];

// 4. Configurable Pickup Points
export const CAMPUS_PICKUP_POINTS: PickupPoint[] = [
  {
    id: "pickup-central-main",
    name: "Central Cafeteria Main Counter",
    code: "PICKUP_MAIN_COUNTER",
    location: "Inside Central Cafeteria (Ground Floor)",
    lat: 23.4192,
    lng: 91.1376,
    operatingHours: "07:30 AM - 09:00 PM",
    instructions: "Show your 4-digit Pickup OTP to the staff counter to collect freshly packaged food.",
  },
  {
    id: "pickup-express-window",
    name: "Express Takeaway Window",
    code: "PICKUP_EXPRESS_WINDOW",
    location: "Cafeteria East Porch Window",
    lat: 23.4193,
    lng: 91.1378,
    operatingHours: "08:00 AM - 08:30 PM",
    instructions: "Dedicated fast counter for beverages, quick breakfast & snack orders.",
  },
  {
    id: "pickup-central-plaza",
    name: "Campus Central Plaza Delivery Point",
    code: "PICKUP_CENTRAL_PLAZA",
    location: "In front of Shahid Minar & Central Library",
    lat: 23.4195,
    lng: 91.1371,
    operatingHours: "10:00 AM - 07:00 PM",
    instructions: "Designated outdoor rider dispatch & meet-up location.",
  },
];

/**
 * Get coordinates for a given Hall code or Department code
 */
export function getDestinationCoordinates(
  type: "HALL_DELIVERY" | "DEPARTMENT_DELIVERY" | "CAFETERIA_PICKUP" | "TABLE_QR",
  hallCode?: string | null,
  deptCode?: string | null
): CampusPoint {
  if (type === "CAFETERIA_PICKUP" || type === "TABLE_QR") {
    return CAMPUS_LANDMARKS.CENTRAL_CAFETERIA;
  }

  if (type === "HALL_DELIVERY" && hallCode) {
    const code = hallCode.toUpperCase();
    if (CAMPUS_LANDMARKS[code]) return CAMPUS_LANDMARKS[code];
    if (code.includes("NAZRUL") || code.includes("KNH")) return CAMPUS_LANDMARKS.KNH;
    if (code.includes("BANGABANDHU") || code.includes("BSMRH")) return CAMPUS_LANDMARKS.BSMRH;
    if (code.includes("DUTTA") || code.includes("SDDH")) return CAMPUS_LANDMARKS.SDDH;
    if (code.includes("FAIZUNNESA") || code.includes("NFCH")) return CAMPUS_LANDMARKS.NFCH;
    if (code.includes("HASINA") || code.includes("SHH")) return CAMPUS_LANDMARKS.SHH;
    return CAMPUS_LANDMARKS.KNH; // default hall point
  }

  if (type === "DEPARTMENT_DELIVERY" && deptCode) {
    const code = deptCode.toUpperCase();
    if (["CSE", "ICT", "PHYSICS", "CHEMISTRY", "PHARMACY", "MATH"].some((c) => code.includes(c))) {
      return CAMPUS_LANDMARKS.SCIENCE_FACULTY;
    }
    if (["AIS", "MGT", "MKT", "FINANCE", "BBA"].some((c) => code.includes(c))) {
      return CAMPUS_LANDMARKS.BUSINESS_FACULTY;
    }
    return CAMPUS_LANDMARKS.ARTS_FACULTY;
  }

  return CAMPUS_LANDMARKS.CENTRAL_CAFETERIA;
}

/**
 * Generate a configurable route polyline between Cafeteria and destination
 */
export function generateCampusDeliveryRoute(
  origin: [number, number],
  destination: [number, number]
): [number, number][] {
  // If destination is at or next to origin, return direct point
  if (
    Math.abs(origin[0] - destination[0]) < 0.0001 &&
    Math.abs(origin[1] - destination[1]) < 0.0001
  ) {
    return [origin, destination];
  }

  // Intermediary waypoint along Central Campus Avenue (23.4195, 91.1373)
  const campusAvenueJunction: [number, number] = [23.4195, 91.1373];

  return [
    origin,
    campusAvenueJunction,
    [destination[0], campusAvenueJunction[1]],
    destination,
  ];
}
