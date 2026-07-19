import { db } from "../src/lib/db";
async function main() {
  const b = await db.business.findFirst();
  if (!b) { console.error("no business"); process.exit(1); }
  await db.business.update({
    where: { id: b.id },
    data: {
      phone: "+591 67409051",  // REAL WhatsApp from Instagram/Facebook bio
      logoUrl: "/uploads/lavadoatp-logo.jpg",
      brandColors: { primary: "#2E5F8A", secondary: "#4A90E2", accent: "#4A90E2" },
    },
  });
  console.log("✅ Updated: phone=+591 67409051, logo=/uploads/lavadoatp-logo.jpg, brandColors=blue");
}
main().finally(() => db.$disconnect());
