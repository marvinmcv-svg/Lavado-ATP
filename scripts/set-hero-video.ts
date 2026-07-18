import { db } from "../src/lib/db";
async function main() {
  const s = await db.siteSettings.findFirst();
  if (!s) { console.error("no settings"); process.exit(1); }
  await db.siteSettings.update({ where: { id: s.id }, data: { heroVideoUrl: "/uploads/hero-moho-cleaning.mp4", heroVideoPosterUrl: "https://sfile.chatglm.cn/images-ppt/3a5d851f0074.jpg" } });
  console.log("✅ heroVideoUrl set");
}
main().finally(() => db.$disconnect());
