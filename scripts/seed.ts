// Seed script for lavadoatp — run with: bun run scripts/seed.ts
// Idempotent: wipes and re-seeds all lavadoatp data on each run.
// All media URLs are REAL pressure-washing photos sourced from the public web
// via the image-search service (no AI-generated imagery). See DATA_AUDIT.md.

import { db } from "../src/lib/db";

async function main() {
  console.log("🌱 Seeding lavadoatp database...");

  // Clean slate (order matters for FK constraints)
  await db.auditLog.deleteMany();
  await db.analyticsEvent.deleteMany();
  await db.galleryItem.deleteMany();
  await db.review.deleteMany();
  await db.staffMember.deleteMany();
  await db.lead.deleteMany();
  await db.booking.deleteMany();
  await db.customer.deleteMany();
  await db.service.deleteMany();
  await db.serviceCategory.deleteMany();
  await db.siteSettings.deleteMany();
  await db.business.deleteMany();

  // ── BUSINESS ──────────────────────────────────────────────────────────
  const business = await db.business.create({
    data: {
      name: "lavadoatp",
      slug: "lavadoatp",
      phone: "+591 707 14288",
      address: "Av. Radial 27, Santa Cruz de la Sierra, Bolivia",
      lat: -17.7833,
      lng: -63.1821,
      googleMapsUrl: "https://www.google.com/maps/place/Santa+Cruz+de+la+Sierra",
      serviceArea: {
        mode: "radius",
        radius_km: 25,
        center_lat: -17.7833,
        center_lng: -63.1821,
        zones: ["Centro", "Equipetrol", "Urubó", "Plan 3000", "La Guardia", "Porongo", "Warnes", "Cotoca"],
      },
      openingHours: {
        mon: { open: "08:00", close: "18:00" },
        tue: { open: "08:00", close: "18:00" },
        wed: { open: "08:00", close: "18:00" },
        thu: { open: "08:00", close: "18:00" },
        fri: { open: "08:00", close: "18:00" },
        sat: { open: "08:00", close: "16:00" },
        sun: { open: null, close: null },
      },
      serviceType: "Pressure washing service",
      languages: ["es", "en"],
      brandColors: { primary: "#0f766e", secondary: "#f59e0b", accent: "#06b6d4" },
      logoUrl: null,
      timezone: "America/La_Paz",
      currency: "BOB",
      instagramUrl: "https://www.instagram.com/lavadoatp/",
    },
  });

  // ── SITE SETTINGS ─────────────────────────────────────────────────────
  await db.siteSettings.create({
    data: {
      businessId: business.id,
      heroHeadlineEs: "Recupera el brillo de tu propiedad",
      heroHeadlineEn: "Restore the shine to your property",
      heroSubheadlineEs: "Lavado a presión profesional en Santa Cruz. Resultados que se ven en la primera pasada.",
      heroSubheadlineEn: "Professional pressure washing in Santa Cruz. Results you can see on the first pass.",
      ctaTextEs: "Cotización Gratis por WhatsApp",
      ctaTextEn: "Free Quote on WhatsApp",
      announcementBarTextEs: "🎉 10% OFF en tu primer lavado de driveway — Cotiza por WhatsApp",
      announcementBarTextEn: "🎉 10% OFF your first driveway wash — Quote on WhatsApp",
      announcementBarActive: true,
      whatsappGreetingEs: "Hola, vi su página web y quisiera una cotización para mis superficies...",
      whatsappGreetingEn: "Hi, I saw your website and would like a quote for my surfaces...",
      quoteCalculatorConfig: {
        tiers: [
          { label: "Pequeño", labelEn: "Small", sqmMax: 50, multiplier: 1.0 },
          { label: "Mediano", labelEn: "Medium", sqmMax: 150, multiplier: 1.6 },
          { label: "Grande", labelEn: "Large", sqmMax: 400, multiplier: 2.8 },
          { label: "Muy grande", labelEn: "X-Large", sqmMax: 100000, multiplier: 4.5 },
        ],
      },
    },
  });

  // ── SERVICE CATEGORIES ────────────────────────────────────────────────
  const catRes = await db.serviceCategory.create({
    data: { businessId: business.id, nameEs: "Residencial", nameEn: "Residential", sortOrder: 0, active: true },
  });
  const catCom = await db.serviceCategory.create({
    data: { businessId: business.id, nameEs: "Comercial", nameEn: "Commercial", sortOrder: 1, active: true },
  });
  const catSpe = await db.serviceCategory.create({
    data: { businessId: business.id, nameEs: "Especializado", nameEn: "Specialty", sortOrder: 2, active: true },
  });

  const IMG = "https://sfile.chatglm.cn/images-ppt";
  // ── SERVICES ──────────────────────────────────────────────────────────
  const services = [
    // Residencial
    {
      categoryId: catRes.id, businessId: business.id,
      nameEs: "Lavado de Driveway / Entrada", nameEn: "Driveway Wash",
      descriptionEs: "Eliminamos manchas de aceite, hongos y tierra de concreto y pavimento. Recupera el color original.",
      descriptionEn: "We remove oil stains, mold and dirt from concrete and pavement. Restores the original color.",
      priceType: "starting_at", price: 250, currency: "BOB",
      afterPhotoUrl: `${IMG}/5952e65baadb.jpg`, beforePhotoUrl: `${IMG}/582aa7a3d23e.jpg`,
      videoPosterUrl: `${IMG}/3a5d851f0074.jpg`, available: true, sortOrder: 0,
    },
    {
      categoryId: catRes.id, businessId: business.id,
      nameEs: "Lavado de Fachada", nameEn: "House Facade Wash",
      descriptionEs: "Soft wash para fachadas de ladrillo, estuco y pintura. Sin dañar la pintura.",
      descriptionEn: "Soft wash for brick, stucco and painted facades. Won't damage the paint.",
      priceType: "starting_at", price: 600, currency: "BOB",
      afterPhotoUrl: `${IMG}/b76ddfdc306b.png`, beforePhotoUrl: `${IMG}/0f441b847762.jpeg`,
      videoPosterUrl: `${IMG}/fd23d94691d1.jpg`, available: true, sortOrder: 1,
    },
    {
      categoryId: catRes.id, businessId: business.id,
      nameEs: "Lavado de Deck / Terraza", nameEn: "Deck / Patio Wash",
      descriptionEs: "Madera, baldosa y composite. Prepara tu terraza para el asado.",
      descriptionEn: "Wood, tile and composite. Get your patio BBQ-ready.",
      priceType: "fixed", price: 350, currency: "BOB",
      afterPhotoUrl: `${IMG}/f12fa0cfa08c.jpg`, beforePhotoUrl: `${IMG}/5870aacfd9a6.jpg`,
      available: true, sortOrder: 2,
    },
    {
      categoryId: catRes.id, businessId: business.id,
      nameEs: "Limpieza de Piscina y Alrededores", nameEn: "Pool Surround Cleaning",
      descriptionEs: "Limpieza profunda del deck de piscina y bordes antideslizantes.",
      descriptionEn: "Deep clean of pool deck and anti-slip edges.",
      priceType: "quote_only", price: null, currency: "BOB",
      available: false, sortOrder: 3,
    },
    // Comercial
    {
      categoryId: catCom.id, businessId: business.id,
      nameEs: "Fachada Comercial / Local", nameEn: "Commercial Storefront",
      descriptionEs: "Limpieza de vidrieras, toldos y fachadas para locales y oficinas.",
      descriptionEn: "Cleaning of storefronts, awnings and facades for shops and offices.",
      priceType: "starting_at", price: 1200, currency: "BOB",
      afterPhotoUrl: `${IMG}/da169b59aa7c.jpg`, beforePhotoUrl: `${IMG}/8062670e2c6e.jpg`,
      videoPosterUrl: `${IMG}/0689f4536910.png`, available: true, sortOrder: 0,
    },
    {
      categoryId: catCom.id, businessId: business.id,
      nameEs: "Estacionamiento / Playa", nameEn: "Parking Lot Wash",
      descriptionEs: "Limpieza de playas de estacionamiento, líneas y drenajes. Servicio nocturno disponible.",
      descriptionEn: "Cleaning of parking lots, lines and drains. Night service available.",
      priceType: "quote_only", price: null, currency: "BOB",
      afterPhotoUrl: `${IMG}/a397d927d7cb.jpg`, available: true, sortOrder: 1,
    },
    {
      categoryId: catCom.id, businessId: business.id,
      nameEs: "Limpieza Post-Obra", nameEn: "Post-Construction Cleanup",
      descriptionEs: "Remoción de cemento, polvo y residuos de obra de superficies nuevas.",
      descriptionEn: "Removal of cement, dust and construction debris from new surfaces.",
      priceType: "quote_only", price: null, currency: "BOB",
      available: true, sortOrder: 2,
    },
    // Especializado
    {
      categoryId: catSpe.id, businessId: business.id,
      nameEs: "Lavado de Techo / Canaletas", nameEn: "Roof & Gutter Wash",
      descriptionEs: "Remoción de musgo, hongos y hojas. Prolonga la vida de tu techo.",
      descriptionEn: "Removal of moss, mold and leaves. Extends your roof's life.",
      priceType: "starting_at", price: 800, currency: "BOB",
      afterPhotoUrl: `${IMG}/1154cc32bb34.jpg`, available: true, sortOrder: 0,
    },
    {
      categoryId: catSpe.id, businessId: business.id,
      nameEs: "Remoción de Graffiti", nameEn: "Graffiti Removal",
      descriptionEs: "Técnicas de baja y alta presión para eliminar pintura sin dañar la superficie.",
      descriptionEn: "Low and high pressure techniques to remove paint without surface damage.",
      priceType: "quote_only", price: null, currency: "BOB",
      afterPhotoUrl: `${IMG}/d13e37e4209c.jpg`, available: true, sortOrder: 1,
    },
    {
      categoryId: catSpe.id, businessId: business.id,
      nameEs: "Lavado de Flota / Camiones", nameEn: "Fleet / Truck Wash",
      descriptionEs: "Limpieza de flotas comerciales, camiones y maquinaria pesada.",
      descriptionEn: "Cleaning of commercial fleets, trucks and heavy machinery.",
      priceType: "starting_at", price: 450, currency: "BOB",
      afterPhotoUrl: `${IMG}/8c67e311a6cf.jpg`, available: true, sortOrder: 2,
    },
  ];
  for (const s of services) {
    await db.service.create({ data: s });
  }

  // ── GALLERY ITEMS (before/after pairs + general + reel posters) ───────
  const pair1 = "pair-driveway";
  const pair2 = "pair-wall";
  const pair3 = "pair-concrete";
  const gallery = [
    // before/after pairs (real photos, same-job pairing flagged in DATA_AUDIT)
    { mediaUrl: `${IMG}/582aa7a3d23e.jpg`, mediaType: "photo", source: "instagram", isBeforeAfter: true, pairId: pair1, pairRole: "before", captionEs: "Driveway — antes", captionEn: "Driveway — before", sortOrder: 0 },
    { mediaUrl: `${IMG}/ad2f79e69616.jpg`, mediaType: "photo", source: "instagram", isBeforeAfter: true, pairId: pair1, pairRole: "after", captionEs: "Driveway — después", captionEn: "Driveway — after", sortOrder: 1 },
    { mediaUrl: `${IMG}/0f441b847762.jpeg`, mediaType: "photo", source: "instagram", isBeforeAfter: true, pairId: pair2, pairRole: "before", captionEs: "Fachada — antes", captionEn: "Facade — before", sortOrder: 2 },
    { mediaUrl: `${IMG}/8062670e2c6e.jpg`, mediaType: "photo", source: "instagram", isBeforeAfter: true, pairId: pair2, pairRole: "after", captionEs: "Fachada — después", captionEn: "Facade — after", sortOrder: 3 },
    { mediaUrl: `${IMG}/5870aacfd9a6.jpg`, mediaType: "photo", source: "instagram", isBeforeAfter: true, pairId: pair3, pairRole: "before", captionEs: "Concreto — antes", captionEn: "Concrete — before", sortOrder: 4 },
    { mediaUrl: `${IMG}/d6e775b8f15f.png`, mediaType: "photo", source: "instagram", isBeforeAfter: true, pairId: pair3, pairRole: "after", captionEs: "Concreto — después", captionEn: "Concrete — after", sortOrder: 5 },
    // general photos
    { mediaUrl: `${IMG}/a2bfd81c1daa.jpg`, mediaType: "photo", source: "instagram", isBeforeAfter: false, captionEs: "Trabajo de driveway en Equipetrol", captionEn: "Driveway job in Equipetrol", sortOrder: 6 },
    { mediaUrl: `${IMG}/81ab57f6469f.jpeg`, mediaType: "photo", source: "instagram", isBeforeAfter: false, captionEs: "Limpieza de patio", captionEn: "Patio cleaning", sortOrder: 7 },
    { mediaUrl: `${IMG}/b712be6469b7.jpg`, mediaType: "photo", source: "instagram", isBeforeAfter: false, captionEs: "Equipo en acción", captionEn: "Crew in action", sortOrder: 8 },
    { mediaUrl: `${IMG}/02f718959425.png`, mediaType: "photo", source: "instagram", isBeforeAfter: false, captionEs: "Resultado final", captionEn: "Final result", sortOrder: 9 },
    // reel posters (poster only — real Reel video file must be uploaded via admin)
    { mediaUrl: `${IMG}/80191282b673.png`, mediaType: "video", source: "instagram", isBeforeAfter: false, posterUrl: `${IMG}/80191282b673.png`, captionEs: "Reel: Lavado de driveway en 4K", captionEn: "Reel: Driveway wash in 4K", sortOrder: 10 },
    { mediaUrl: `${IMG}/3a5d851f0074.jpg`, mediaType: "video", source: "instagram", isBeforeAfter: false, posterUrl: `${IMG}/3a5d851f0074.jpg`, captionEs: "Reel: Transformación de fachada", captionEn: "Reel: Facade transformation", sortOrder: 11 },
    { mediaUrl: `${IMG}/f341aa294277.jpg`, mediaType: "video", source: "instagram", isBeforeAfter: false, posterUrl: `${IMG}/f341aa294277.jpg`, captionEs: "Reel: El momento exacto de la limpieza", captionEn: "Reel: The exact moment of cleaning", sortOrder: 12 },
  ];
  for (const g of gallery) {
    await db.galleryItem.create({ data: { businessId: business.id, active: true, ...g } });
  }

  // ── REVIEWS ───────────────────────────────────────────────────────────
  const reviews = [
    { reviewerName: "Marcela Rojas", starRating: 5, reviewText: "Quedé impresionada con el resultado de mi driveway. Parecía nuevo. Llegaron puntuales y muy profesionales. Recomiendo 100%.", reviewDate: new Date(Date.now() - 7 * 86400000), source: "google" },
    { reviewerName: "Carlos Gutiérrez", starRating: 5, reviewText: "Lavaron la fachada de mi negocio y la diferencia es increíble. Se nota que saben lo que hacen. Volveré a contratarlos.", reviewDate: new Date(Date.now() - 14 * 86400000), source: "google" },
    { reviewerName: "Andrea Suárez", starRating: 5, reviewText: "Muy buen servicio y a buen precio. Respondieron rápido por WhatsApp y coordinaron todo sin complicaciones.", reviewDate: new Date(Date.now() - 21 * 86400000), source: "google" },
    { reviewerName: "Jorge Méndez", starRating: 4, reviewText: "Buen trabajo en general, llegaron un poco tarde pero el resultado fue excelente. Los techos quedaron impecables.", reviewDate: new Date(Date.now() - 30 * 86400000), source: "google" },
    { reviewerName: "Patricia Núñez", starRating: 5, reviewText: "Los contraté para limpieza post-obra y superaron expectativas. Recomendados totalmente en Santa Cruz.", reviewDate: new Date(Date.now() - 45 * 86400000), source: "google" },
    { reviewerName: "Ricardo Paz", starRating: 5, reviewText: "Profesionales de verdad. Me mandaron fotos del antes y después. Mi deck de piscina quedó como recién instalado.", reviewDate: new Date(Date.now() - 60 * 86400000), source: "facebook" },
  ];
  for (const r of reviews) {
    await db.review.create({ data: { businessId: business.id, visibleOnSite: true, ...r } });
  }

  // ── STAFF ─────────────────────────────────────────────────────────────
  const staff = [
    { userId: "owner-1", role: "owner", name: "Andrés Toledo", email: "andres@lavadoatp.com", active: true },
    { userId: "manager-1", role: "manager", name: "Lucía Vargas", email: "lucia@lavadoatp.com", active: true },
    { userId: "crew-1", role: "crew", name: "Miguel Choque", email: "miguel@lavadoatp.com", active: true },
    { userId: "crew-2", role: "crew", name: "Diego Flores", email: "diego@lavadoatp.com", active: true },
  ];
  for (const s of staff) {
    await db.staffMember.create({ data: { businessId: business.id, ...s } });
  }

  // ── CUSTOMERS ─────────────────────────────────────────────────────────
  const customers = [
    { name: "Marcela Rojas", phone: "+591 707 11234", email: "marcela.r@gmail.com", propertyType: "residential", address: "Barrio Equipetrol, Calle 5 #15", visitCount: 2, totalSpend: 850, tags: ["Residencial", "Recurrente"], internalNotes: "Cliente VIP. Prefiere coordinar por WhatsApp." },
    { name: "Carlos Gutiérrez", phone: "+591 722 55678", email: "carlos.g@negocio.com", propertyType: "commercial", address: "Av. Monseñor Rivero 200", visitCount: 1, totalSpend: 1200, tags: ["Comercial"], internalNotes: "Local comercial. Lavado de fachada trimestral." },
    { name: "Andrea Suárez", phone: "+591 755 99881", email: "andrea.s@gmail.com", propertyType: "residential", address: "Urubó, residencial Las Palmas", visitCount: 1, totalSpend: 350, tags: ["Residencial", "Primera vez"], internalNotes: "" },
    { name: "Jorge Méndez", phone: "+591 699 22334", email: "jorge.mendez@gmail.com", propertyType: "residential", address: "Plan 3000, Mza 12", visitCount: 3, totalSpend: 1950, tags: ["Residencial", "Recurrente", "VIP"], internalNotes: "Techo y driveway cada 6 meses." },
    { name: "Restaurante El Mesón", phone: "+591 3 3425566", email: "contacto@elmeson.com", propertyType: "commercial", address: "Av. Ichilo 350", visitCount: 4, totalSpend: 3600, tags: ["Comercial", "Recurrente"], internalNotes: "Limpieza mensual de estacionamiento." },
  ];
  for (const c of customers) {
    await db.customer.create({ data: { businessId: business.id, ...c } });
  }

  // ── BOOKINGS ──────────────────────────────────────────────────────────
  const svcList = await db.service.findMany({ where: { businessId: business.id } });
  const custList = await db.customer.findMany({ where: { businessId: business.id } });
  const now = new Date();
  const dayMs = 86400000;
  const bookings = [
    { customerName: "Marcela Rojas", customerPhone: "+591 707 11234", customerId: custList[0].id, serviceId: svcList[0].id, propertyAddress: "Barrio Equipetrol, Calle 5 #15", propertySizeSqm: 60, scheduledAt: new Date(now.getTime() + 1 * dayMs + 9 * 3600000), status: "confirmed", crewAssigned: "Miguel Choque", quotedAmount: 280, zone: "Equipetrol" },
    { customerName: "Carlos Gutiérrez", customerPhone: "+591 722 55678", customerId: custList[1].id, serviceId: svcList[4].id, propertyAddress: "Av. Monseñor Rivero 200", propertySizeSqm: 200, scheduledAt: new Date(now.getTime() + 2 * dayMs + 14 * 3600000), status: "pending", crewAssigned: null, quotedAmount: 1200, zone: "Centro" },
    { customerName: "Restaurante El Mesón", customerPhone: "+591 3 3425566", customerId: custList[4].id, serviceId: svcList[5].id, propertyAddress: "Av. Ichilo 350", propertySizeSqm: 400, scheduledAt: new Date(now.getTime() + 3 * dayMs + 8 * 3600000), status: "pending", crewAssigned: null, quotedAmount: 1800, depositAmount: 500, depositPaid: false, zone: "Centro" },
    { customerName: "Andrea Suárez", customerPhone: "+591 755 99881", customerId: custList[2].id, serviceId: svcList[2].id, propertyAddress: "Urubó, residencial Las Palmas", propertySizeSqm: 80, scheduledAt: new Date(now.getTime() - 1 * dayMs + 10 * 3600000), status: "completed", crewAssigned: "Diego Flores", quotedAmount: 350, zone: "Urubó" },
    { customerName: "Jorge Méndez", customerPhone: "+591 699 22334", customerId: custList[3].id, serviceId: svcList[7].id, propertyAddress: "Plan 3000, Mza 12", propertySizeSqm: 180, scheduledAt: new Date(now.getTime() - 3 * dayMs + 11 * 3600000), status: "completed", crewAssigned: "Miguel Choque", quotedAmount: 800, zone: "Plan 3000" },
    { customerName: "Patricia Núñez", customerPhone: "+591 733 44556", customerId: null, serviceId: svcList[6].id, propertyAddress: "Av. Bush 450", propertySizeSqm: 350, scheduledAt: new Date(now.getTime() + 5 * dayMs + 9 * 3600000), status: "confirmed", crewAssigned: "Diego Flores", quotedAmount: 2200, depositAmount: 700, depositPaid: true, zone: "Equipetrol" },
    { customerName: "Ricardo Paz", customerPhone: "+591 711 77889", customerId: null, serviceId: svcList[0].id, propertyAddress: "La Guardia, Urb. Santa Bárbara", propertySizeSqm: 70, scheduledAt: new Date(now.getTime() + 6 * dayMs + 15 * 3600000), status: "in_progress", crewAssigned: "Miguel Choque", quotedAmount: 300, zone: "La Guardia" },
  ];
  for (const b of bookings) {
    await db.booking.create({ data: { businessId: business.id, ...b } });
  }

  // ── LEADS (Kanban) ────────────────────────────────────────────────────
  const leads = [
    { source: "quote_calculator", name: "Sofía Ríos", phone: "+591 744 55123", message: "Lavado de driveway aprox 80m². Cotizó Bs 400-540.", zone: "Equipetrol", serviceType: "Driveway Wash", propertySize: "Mediano", status: "new" },
    { source: "whatsapp_widget", name: "Fernando Cruz", phone: "+591 765 22098", message: "Necesito lavar la fachada de mi casa, 2 pisos.", zone: "Urubó", status: "new" },
    { source: "quote_calculator", name: "Negocio El Roble", phone: "+591 3 3421100", message: "Estacionamiento comercial 400m². Cotizó rango Bs 3360-4700.", zone: "Centro", serviceType: "Parking Lot Wash", propertySize: "Grande", status: "contacted" },
    { source: "contact_form", name: "Valeria M.", phone: "+591 788 90112", message: "Limpieza post-obra de casa nueva en Porongo.", zone: "Porongo", status: "contacted" },
    { source: "whatsapp_widget", name: "Hugo Sandoval", phone: "+591 712 33445", message: "Graffiti en pared del negocio. Urgente.", zone: "Plan 3000", status: "qualified" },
    { source: "quote_calculator", name: "Marcela Rojas", phone: "+591 707 11234", message: "Cliente recurrente — driveway + deck.", zone: "Equipetrol", serviceType: "Driveway Wash", propertySize: "Mediano", status: "converted" },
    { source: "direct_call", name: "Gimnasio FitZone", phone: "+591 3 3457788", message: "Lavado mensual de fachada e ingresos.", zone: "Warnes", status: "closed" },
  ];
  for (const l of leads) {
    await db.lead.create({ data: { businessId: business.id, ...l } });
  }

  // ── ANALYTICS (seed 30 days of events for dashboard) ──────────────────
  const categories = ["Residencial", "Comercial", "Especializado"];
  const zones = ["Equipetrol", "Centro", "Urubó", "Plan 3000", "La Guardia", "Porongo", "Warnes", "Cotoca"];
  for (let d = 29; d >= 0; d--) {
    const dayStart = new Date(now.getTime() - d * dayMs);
    const pageViews = 30 + Math.floor(Math.random() * 50);
    for (let i = 0; i < pageViews; i++) {
      await db.analyticsEvent.create({
        data: {
          businessId: business.id,
          eventType: "page_view",
          metadata: { path: "/", referrer: Math.random() > 0.6 ? "instagram.com" : "direct" },
          userAgent: "Mozilla/5.0",
          createdAt: new Date(dayStart.getTime() + Math.floor(Math.random() * dayMs)),
        },
      });
    }
    const waClicks = Math.floor(pageViews * 0.18);
    for (let i = 0; i < waClicks; i++) {
      await db.analyticsEvent.create({
        data: {
          businessId: business.id,
          eventType: "whatsapp_click",
          metadata: { zone: zones[Math.floor(Math.random() * zones.length)] },
          createdAt: new Date(dayStart.getTime() + Math.floor(Math.random() * dayMs)),
        },
      });
    }
    const quotes = Math.floor(waClicks * 0.4);
    for (let i = 0; i < quotes; i++) {
      await db.analyticsEvent.create({
        data: {
          businessId: business.id,
          eventType: "quote_calculator_used",
          metadata: { service: svcList[Math.floor(Math.random() * svcList.length)].nameEn, category: categories[Math.floor(Math.random() * categories.length)] },
          createdAt: new Date(dayStart.getTime() + Math.floor(Math.random() * dayMs)),
        },
      });
    }
    const sectionViews = Math.floor(pageViews * 0.5);
    for (let i = 0; i < sectionViews; i++) {
      await db.analyticsEvent.create({
        data: {
          businessId: business.id,
          eventType: "service_section_view",
          metadata: { category: categories[Math.floor(Math.random() * categories.length)] },
          createdAt: new Date(dayStart.getTime() + Math.floor(Math.random() * dayMs)),
        },
      });
    }
  }

  // ── AUDIT LOG ─────────────────────────────────────────────────────────
  const auditEntries = [
    { actorName: "Andrés Toledo", action: "Actualizó headline del hero", tableName: "site_settings", createdAt: new Date(now.getTime() - 2 * 3600000) },
    { actorName: "Lucía Vargas", action: "Confirmó reserva de Marcela Rojas", tableName: "bookings", createdAt: new Date(now.getTime() - 5 * 3600000) },
    { actorName: "Andrés Toledo", action: "Agregó servicio 'Lavado de Flota'", tableName: "services", createdAt: new Date(now.getTime() - 26 * 3600000) },
    { actorName: "Lucía Vargas", action: "Aprobó reseña de Marcela Rojas", tableName: "reviews", createdAt: new Date(now.getTime() - 30 * 3600000) },
    { actorName: "Andrés Toledo", action: "Movió lead 'Fernando Cruz' a Contactado", tableName: "leads", createdAt: new Date(now.getTime() - 50 * 3600000) },
    { actorName: "Miguel Choque", action: "Marcó reserva de Andrea Suárez como completada", tableName: "bookings", createdAt: new Date(now.getTime() - 2 * dayMs) },
    { actorName: "Andrés Toledo", action: "Actualizó zonas de cobertura", tableName: "businesses", createdAt: new Date(now.getTime() - 3 * dayMs) },
  ];
  for (const a of auditEntries) {
    await db.auditLog.create({ data: { businessId: business.id, ...a } });
  }

  console.log("✅ Seed complete.");
  console.log(`   Business: ${business.name}`);
  console.log(`   Services: ${services.length}`);
  console.log(`   Gallery items: ${gallery.length}`);
  console.log(`   Reviews: ${reviews.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Bookings: ${bookings.length}`);
  console.log(`   Leads: ${leads.length}`);
  console.log(`   Staff: ${staff.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
