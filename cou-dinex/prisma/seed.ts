import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting CoU DineX Phase 2 Database Seeding...");

  // 1. Departments (Comilla University)
  const departmentsData = [
    { name: "Computer Science & Engineering", code: "CSE", faculty: "Faculty of Engineering", building: "Academic Building 2" },
    { name: "Information & Communication Technology", code: "ICT", faculty: "Faculty of Engineering", building: "Academic Building 2" },
    { name: "Pharmacy", code: "PHR", faculty: "Faculty of Science", building: "Science Building" },
    { name: "Economics", code: "ECO", faculty: "Faculty of Social Sciences", building: "Social Science Building" },
    { name: "Management Studies", code: "MGT", faculty: "Faculty of Business Studies", building: "Business Studies Building" },
    { name: "English", code: "ENG", faculty: "Faculty of Arts & Humanities", building: "Arts Building" },
    { name: "Mathematics", code: "MATH", faculty: "Faculty of Science", building: "Science Building" },
    { name: "Physics", code: "PHY", faculty: "Faculty of Science", building: "Science Building" },
  ];

  console.log("Seeding departments...");
  for (const dept of departmentsData) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, faculty: dept.faculty, building: dept.building },
      create: dept,
    });
  }

  // 2. Residential Halls (Comilla University)
  const hallsData = [
    { name: "Kazi Nazrul Islam Hall", code: "KNH", type: "MALE" },
    { name: "Bangabandhu Sheikh Mujibur Rahman Hall", code: "BSMRH", type: "MALE" },
    { name: "Shaheed Dhirendranath Datta Hall", code: "SDDH", type: "MALE" },
    { name: "Nawab Faizunnesa Choudhurani Hall", code: "NFCH", type: "FEMALE" },
    { name: "Sheikh Hasina Hall", code: "SHH", type: "FEMALE" },
  ];

  console.log("Seeding residential halls...");
  for (const hall of hallsData) {
    await prisma.hall.upsert({
      where: { code: hall.code },
      update: { name: hall.name, type: hall.type },
      create: hall,
    });
  }

  // 3. Central Cafeteria
  console.log("Seeding Central Cafeteria...");
  const cafeteria = await prisma.cafeteria.upsert({
    where: { slug: "central-cafeteria" },
    update: {
      name: "CoU Central Cafeteria (কেন্দ্রীয় ক্যাফেটেরিয়া)",
      location: "Opposite to Administrative Building, Comilla University Campus",
      isOpen: true,
      openingTime: "07:30 AM",
      closingTime: "09:00 PM",
    },
    create: {
      name: "CoU Central Cafeteria (কেন্দ্রীয় ক্যাফেটেরিয়া)",
      slug: "central-cafeteria",
      location: "Opposite to Administrative Building, Comilla University Campus",
      isOpen: true,
      openingTime: "07:30 AM",
      closingTime: "09:00 PM",
    },
  });

  // 4. Dining Tables (QR ordering)
  console.log("Seeding dining tables...");
  for (let i = 1; i <= 10; i++) {
    const tableNumber = `T-${String(i).padStart(2, "0")}`;
    const qrCode = `COU-DINEX-TABLE-${tableNumber}`;
    await prisma.diningTable.upsert({
      where: {
        cafeteriaId_tableNumber: {
          cafeteriaId: cafeteria.id,
          tableNumber,
        },
      },
      update: { capacity: i <= 4 ? 4 : 6 },
      create: {
        cafeteriaId: cafeteria.id,
        tableNumber,
        qrCode,
        capacity: i <= 4 ? 4 : 6,
        isOccupied: false,
      },
    });
  }

  // 5. Menu Categories
  console.log("Seeding menu categories...");
  const categoriesData = [
    { name: "Breakfast & Morning", slug: "breakfast", displayOrder: 1 },
    { name: "Lunch & Meals", slug: "lunch-meals", displayOrder: 2 },
    { name: "Snacks & Fast Food", slug: "snacks", displayOrder: 3 },
    { name: "Tea & Beverages", slug: "beverages", displayOrder: 4 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const category = await prisma.menuCategory.upsert({
      where: {
        cafeteriaId_slug: {
          cafeteriaId: cafeteria.id,
          slug: cat.slug,
        },
      },
      update: { name: cat.name, displayOrder: cat.displayOrder, isActive: true },
      create: {
        cafeteriaId: cafeteria.id,
        name: cat.name,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, category.id);
  }

  // 6. Sample Menu Items & Initial Inventory
  console.log("Seeding sample menu items and inventory...");
  const sampleItems = [
    {
      categorySlug: "breakfast",
      name: "Special Khichuri with Dim Bhaji",
      description: "Hot bhuna khichuri served with fresh onion-chilli egg omelette",
      price: 45.0,
      discountPrice: 40.0,
      isDailySpecial: true,
      preparationTimeMinutes: 10,
      tags: ["Breakfast", "Popular", "Bengali"],
      initialStock: 80,
    },
    {
      categorySlug: "breakfast",
      name: "Paratha with Daal & Alur Dom",
      description: "Crispy handmade parathas (2 pcs) served with spiced daal & potato curry",
      price: 30.0,
      discountPrice: null,
      isDailySpecial: false,
      preparationTimeMinutes: 5,
      tags: ["Breakfast", "Budget-Friendly"],
      initialStock: 100,
    },
    {
      categorySlug: "lunch-meals",
      name: "CoU Special Chicken Biryani",
      description: "Fragrant Chinigura rice with tender chicken piece, boiled egg & salad",
      price: 120.0,
      discountPrice: 110.0,
      isDailySpecial: true,
      preparationTimeMinutes: 15,
      tags: ["Lunch", "Best Seller", "Student Favourite"],
      initialStock: 120,
    },
    {
      categorySlug: "lunch-meals",
      name: "Shorshe Ilish with Steamed Rice",
      description: "Traditional mustard Hilsa fish curry with steaming hot fragrant rice",
      price: 180.0,
      discountPrice: null,
      isDailySpecial: false,
      preparationTimeMinutes: 20,
      tags: ["Fish", "Traditional", "Bengali"],
      initialStock: 35,
    },
    {
      categorySlug: "snacks",
      name: "Crispy Singara (2 pcs)",
      description: "Hot and crunchy potato-peanut stuffed singara with tamarind chutney",
      price: 15.0,
      discountPrice: null,
      isDailySpecial: false,
      preparationTimeMinutes: 5,
      tags: ["Snacks", "Tea-time"],
      initialStock: 150,
    },
    {
      categorySlug: "snacks",
      name: "Chicken Samucha (2 pcs)",
      description: "Spicy minced chicken filled samosa fried to golden perfection",
      price: 20.0,
      discountPrice: null,
      isDailySpecial: false,
      preparationTimeMinutes: 5,
      tags: ["Snacks", "Crispy"],
      initialStock: 100,
    },
    {
      categorySlug: "beverages",
      name: "CoU Special Milk Tea (দুধ চা)",
      description: "Cardamom infused rich condensed milk tea",
      price: 10.0,
      discountPrice: null,
      isDailySpecial: false,
      preparationTimeMinutes: 5,
      tags: ["Hot", "Tea", "Campus Legend"],
      initialStock: 300,
    },
    {
      categorySlug: "beverages",
      name: "Chilled Sweet Lassi",
      description: "Refreshing yogurt drink blended with ice and roasted cumin pinch",
      price: 40.0,
      discountPrice: 35.0,
      isDailySpecial: false,
      preparationTimeMinutes: 5,
      tags: ["Cold", "Refreshing"],
      initialStock: 60,
    },
  ];

  for (const item of sampleItems) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    // Check if item already exists by name & cafeteria
    const existing = await prisma.menuItem.findFirst({
      where: {
        cafeteriaId: cafeteria.id,
        name: item.name,
      },
    });

    let menuItemId = existing?.id;

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          categoryId,
          description: item.description,
          price: item.price,
          discountPrice: item.discountPrice,
          isDailySpecial: item.isDailySpecial,
          preparationTimeMinutes: item.preparationTimeMinutes,
          tags: item.tags,
        },
      });
    } else {
      const created = await prisma.menuItem.create({
        data: {
          cafeteriaId: cafeteria.id,
          categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          discountPrice: item.discountPrice,
          isDailySpecial: item.isDailySpecial,
          preparationTimeMinutes: item.preparationTimeMinutes,
          tags: item.tags,
        },
      });
      menuItemId = created.id;
    }

    if (menuItemId) {
      await prisma.inventory.upsert({
        where: { menuItemId },
        update: {
          currentStock: item.initialStock,
          dailyStartingStock: item.initialStock,
          lowStockThreshold: 10,
          isSoldOut: false,
        },
        create: {
          cafeteriaId: cafeteria.id,
          menuItemId,
          currentStock: item.initialStock,
          dailyStartingStock: item.initialStock,
          lowStockThreshold: 10,
          isSoldOut: false,
        },
      });
    }
  }

  console.log("✅ CoU DineX Phase 2 Database Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
