// Bilingual ES/EN translations + client-side language store (Step 3.8).
// Default language auto-detected; preference stored in localStorage key "lang".

import { create } from "zustand";

export type Lang = "es" | "en";

export const translations = {
  es: {
    // nav
    nav_services: "Servicios",
    nav_beforeafter: "Antes y Después",
    nav_reels: "Videos",
    nav_area: "Zonas",
    nav_quote: "Cotizador",
    nav_reviews: "Reseñas",
    nav_admin: "Admin",
    // hero
    hero_badge: "Lavado a presión profesional · Santa Cruz, Bolivia",
    hero_cta: "Cotización Gratis por WhatsApp",
    hero_cta_alt: "Ver servicios",
    hero_stats_jobs: "Trabajos realizados",
    hero_stats_rating: "Calificación promedio",
    hero_stats_response: "Tiempo de respuesta",
    // announcement
    announcement: "🎉 10% OFF en tu primer lavado de driveway — Cotiza por WhatsApp",
    // services
    services_title: "Nuestros Servicios",
    services_subtitle: "Resultados profesionales para cada superficie. Precios transparentes, trabajo garantizado.",
    services_fixed: "Precio",
    services_from: "Desde",
    services_quote: "Cotización personalizada",
    services_unavailable: "No disponible temporalmente",
    services_request: "Solicitar este servicio",
    cat_residential: "Residencial",
    cat_commercial: "Comercial",
    cat_specialty: "Especializado",
    // before/after
    beforeafter_title: "Antes y Después",
    beforeafter_subtitle: "Resultados reales del mismo trabajo. Arrastra para revelar la transformación.",
    beforeafter_drag: "Arrastra para comparar",
    before: "Antes",
    after: "Después",
    // reels
    reels_title: "Míranos trabajar",
    reels_subtitle: "La satisfacción de ver la suciedad desaparecer. Toca para escuchar.",
    // service area
    area_title: "Zonas que atendemos",
    area_subtitle: "Cubrimos el gran Santa Cruz y alrededores. ¿No ves tu zona? Escríbenos.",
    area_hours: "Horario de hoy",
    area_open: "Abierto ahora",
    area_closed: "Cerrado",
    area_directions: "Cómo llegar",
    area_radius: "Radio de cobertura",
    // quote calculator
    quote_title: "Cotizador instantáneo",
    quote_subtitle: "Estima el rango de precio de tu trabajo en segundos. Sin compromiso.",
    quote_step_service: "1. ¿Qué necesitas lavar?",
    quote_step_size: "2. Tamaño de la superficie",
    quote_step_result: "3. Tu estimación",
    quote_size_small: "Pequeño",
    quote_size_medium: "Mediano",
    quote_size_large: "Grande",
    quote_estimate: "Estimación",
    quote_range: "rango estimado",
    quote_disclaimer: "Estimación referencial. El precio final se confirma tras inspección.",
    quote_confirm: "Confirmar por WhatsApp",
    quote_pick_service: "Selecciona un servicio",
    quote_pick_size: "Selecciona un tamaño",
    // reviews
    reviews_title: "Lo que dicen nuestros clientes",
    reviews_subtitle: "Reseñas reales de trabajos reales.",
    reviews_based_on: "basado en",
    reviews_count: "reseñas",
    // footer
    footer_about_title: "lavadoatp",
    footer_about: "Lavado a presión profesional en Santa Cruz de la Sierra. Recuperamos el brillo de tu propiedad con equipos de alta presión y productos biodegradables.",
    footer_contact: "Contacto",
    footer_hours: "Horario",
    footer_follow: "Síguenos",
    footer_rights: "Todos los derechos reservados.",
    footer_links: "Enlaces",
    // whatsapp widget
    wa_tooltip: "Cotización gratis por WhatsApp",
    wa_greeting: "Hola, vi su página web y quisiera una cotización para mis superficies...",
    // admin
    admin_title: "Portal Administrativo",
    admin_back: "Volver al sitio",
    admin_dashboard: "Dashboard",
    admin_services: "Servicios",
    admin_bookings: "Reservas",
    admin_customers: "Clientes",
    admin_leads: "Leads",
    admin_analytics: "Analítica",
    admin_editor: "Editor del sitio",
    admin_reviews: "Reseñas",
    admin_staff: "Personal",
    admin_settings: "Configuración",
    admin_kpi_pageviews: "Vistas hoy",
    admin_kpi_whatsapp: "Clics WhatsApp hoy",
    admin_kpi_quotes: "Cotizaciones hoy",
    admin_kpi_bookings: "Reservas pendientes",
    admin_kpi_leads: "Leads nuevos",
    admin_kpi_services: "Servicios activos",
    admin_activity: "Actividad reciente",
    admin_quickactions: "Acciones rápidas",
    admin_add_service: "Agregar servicio",
    admin_new_booking: "Nueva reserva",
    admin_view_leads: "Ver leads",
    admin_open_editor: "Abrir editor",
    // status
    status_pending: "Pendiente",
    status_confirmed: "Confirmado",
    status_in_progress: "En progreso",
    status_completed: "Completado",
    status_cancelled: "Cancelado",
  },
  en: {
    nav_services: "Services",
    nav_beforeafter: "Before & After",
    nav_reels: "Videos",
    nav_area: "Service Area",
    nav_quote: "Quote",
    nav_reviews: "Reviews",
    nav_admin: "Admin",
    hero_badge: "Professional pressure washing · Santa Cruz, Bolivia",
    hero_cta: "Free Quote on WhatsApp",
    hero_cta_alt: "View services",
    hero_stats_jobs: "Jobs completed",
    hero_stats_rating: "Average rating",
    hero_stats_response: "Response time",
    announcement: "🎉 10% OFF your first driveway wash — Quote on WhatsApp",
    services_title: "Our Services",
    services_subtitle: "Professional results for every surface. Transparent pricing, guaranteed work.",
    services_fixed: "Price",
    services_from: "From",
    services_quote: "Custom quote",
    services_unavailable: "Temporarily unavailable",
    services_request: "Request this service",
    cat_residential: "Residential",
    cat_commercial: "Commercial",
    cat_specialty: "Specialty",
    beforeafter_title: "Before & After",
    beforeafter_subtitle: "Real results from the same job. Drag to reveal the transformation.",
    beforeafter_drag: "Drag to compare",
    before: "Before",
    after: "After",
    reels_title: "Watch us work",
    reels_subtitle: "The satisfaction of watching grime disappear. Tap to hear.",
    area_title: "Areas we serve",
    area_subtitle: "We cover greater Santa Cruz and surroundings. Don't see your area? Message us.",
    area_hours: "Today's hours",
    area_open: "Open now",
    area_closed: "Closed",
    area_directions: "Get directions",
    area_radius: "Coverage radius",
    quote_title: "Instant quote",
    quote_subtitle: "Estimate your job's price range in seconds. No commitment.",
    quote_step_service: "1. What do you need washed?",
    quote_step_size: "2. Surface size",
    quote_step_result: "3. Your estimate",
    quote_size_small: "Small",
    quote_size_medium: "Medium",
    quote_size_large: "Large",
    quote_estimate: "Estimate",
    quote_range: "estimated range",
    quote_disclaimer: "Reference estimate. Final price confirmed after inspection.",
    quote_confirm: "Confirm on WhatsApp",
    quote_pick_service: "Select a service",
    quote_pick_size: "Select a size",
    reviews_title: "What our customers say",
    reviews_subtitle: "Real reviews from real jobs.",
    reviews_based_on: "based on",
    reviews_count: "reviews",
    footer_about_title: "lavadoatp",
    footer_about: "Professional pressure washing in Santa Cruz de la Sierra. We restore the shine to your property with high-pressure equipment and biodegradable products.",
    footer_contact: "Contact",
    footer_hours: "Hours",
    footer_follow: "Follow us",
    footer_rights: "All rights reserved.",
    footer_links: "Links",
    wa_tooltip: "Free quote on WhatsApp",
    wa_greeting: "Hi, I saw your website and would like a quote for my surfaces...",
    admin_title: "Admin Portal",
    admin_back: "Back to site",
    admin_dashboard: "Dashboard",
    admin_services: "Services",
    admin_bookings: "Bookings",
    admin_customers: "Customers",
    admin_leads: "Leads",
    admin_analytics: "Analytics",
    admin_editor: "Site Editor",
    admin_reviews: "Reviews",
    admin_staff: "Staff",
    admin_settings: "Settings",
    admin_kpi_pageviews: "Views today",
    admin_kpi_whatsapp: "WhatsApp clicks today",
    admin_kpi_quotes: "Quotes today",
    admin_kpi_bookings: "Pending bookings",
    admin_kpi_leads: "New leads",
    admin_kpi_services: "Active services",
    admin_activity: "Recent activity",
    admin_quickactions: "Quick actions",
    admin_add_service: "Add service",
    admin_new_booking: "New booking",
    admin_view_leads: "View leads",
    admin_open_editor: "Open editor",
    status_pending: "Pending",
    status_confirmed: "Confirmed",
    status_in_progress: "In progress",
    status_completed: "Completed",
    status_cancelled: "Cancelled",
  },
} as const;

export type TranslationKey = keyof typeof translations["es"];

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const getInitialLang = (): Lang => {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem("lang");
  if (stored === "es" || stored === "en") return stored;
  const browser = window.navigator.language?.toLowerCase() ?? "es";
  return browser.startsWith("en") ? "en" : "es";
};

export const useLang = create<LangState>((set, get) => ({
  lang: "es",
  setLang: (l) => {
    if (typeof window !== "undefined") window.localStorage.setItem("lang", l);
    set({ lang: l });
  },
  toggle: () => {
    const next = get().lang === "es" ? "en" : "es";
    get().setLang(next);
  },
}));

// Hook to initialize language on the client after mount (avoids hydration
// mismatch — server always renders "es", client may swap).
export function useInitLang() {
  const setLang = useLang((s) => s.setLang);
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("lang");
    if (stored === "es" || stored === "en") {
      // will be applied in an effect by the component using this
    }
    return () => setLang(getInitialLang());
  }
  return () => {};
}

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations.es[key] ?? key;
}
