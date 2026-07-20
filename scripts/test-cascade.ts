import { db } from "../src/lib/db";
async function main() {
  const b = await db.business.findFirst();
  if (!b) { console.error("no business"); process.exit(1); }
  const cat = await db.serviceCategory.create({
    data: { businessId: b.id, nameEs: "Test Cascade", nameEn: "Test Cascade", sortOrder: 99, active: false },
  });
  const svc = await db.service.create({
    data: { businessId: b.id, categoryId: cat.id, nameEs: "Cascade Test Svc", nameEn: "Cascade Test Svc", descriptionEs: "", descriptionEn: "", priceType: "fixed", price: 0, currency: "BOB", available: false, sortOrder: 0 },
  });
  try {
    await db.serviceCategory.delete({ where: { id: cat.id } });
    console.log("FAIL: deleted category with services (no FK protection)");
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.log("PASS: FK constraint blocked deletion:", err.code || err.message?.slice(0, 80));
  }
  await db.service.delete({ where: { id: svc.id } });
  await db.serviceCategory.delete({ where: { id: cat.id } });
  console.log("Teardown: cascade test data cleaned");
}
main().finally(() => db.$disconnect());
