import { db } from "../src/lib/db";
async function main() {
  // Delete test items
  const deletedGallery = await db.galleryItem.deleteMany({ where: { captionEs: { contains: "Test" } } });
  const deletedReviews = await db.review.deleteMany({ where: { reviewerName: { contains: "Test" } } });
  const deletedCustomers = await db.customer.deleteMany({ where: { name: { contains: "Test" } } });
  const deletedBookings = await db.booking.deleteMany({ where: { customerName: { contains: "E2E" } } });
  console.log(`Cleaned: ${deletedGallery.count} gallery, ${deletedReviews.count} reviews, ${deletedCustomers.count} customers, ${deletedBookings.count} bookings`);
}
main().finally(() => db.$disconnect());
