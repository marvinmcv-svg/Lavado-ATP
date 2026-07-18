"use client";
// Admin portal shell — sidebar nav + view router for the 10 admin modules.
import * as React from "react";
import {
  LayoutDashboard, Wrench, CalendarDays, Users, KanbanSquare, BarChart3,
  PencilLine, Star, Shield, Settings as SettingsIcon, Droplets, ArrowLeft,
  Menu, Globe,
} from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PublicData } from "@/lib/public-data";
import { Dashboard } from "./dashboard";
import { ServicesManager } from "./services-manager";
import { Bookings } from "./bookings";
import { Customers } from "./customers";
import { LeadsKanban } from "./leads-kanban";
import { Analytics } from "./analytics";
import { SiteEditor } from "./site-editor";
import { ReviewsManager } from "./reviews-manager";
import { Staff } from "./staff";
import { Settings } from "./settings";

export type AdminView =
  | "dashboard" | "services" | "bookings" | "customers" | "leads"
  | "analytics" | "editor" | "reviews" | "staff" | "settings";

interface NavItem {
  id: AdminView;
  key: Parameters<typeof t>[1];
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", key: "admin_dashboard", icon: LayoutDashboard },
  { id: "services", key: "admin_services", icon: Wrench },
  { id: "bookings", key: "admin_bookings", icon: CalendarDays },
  { id: "customers", key: "admin_customers", icon: Users },
  { id: "leads", key: "admin_leads", icon: KanbanSquare },
  { id: "analytics", key: "admin_analytics", icon: BarChart3 },
  { id: "editor", key: "admin_editor", icon: PencilLine },
  { id: "reviews", key: "admin_reviews", icon: Star },
  { id: "staff", key: "admin_staff", icon: Shield },
  { id: "settings", key: "admin_settings", icon: SettingsIcon },
];

export function AdminPortal({ data, onExit }: { data: PublicData; onExit: () => void }) {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  const [view, setView] = React.useState<AdminView>("dashboard");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const brand = lang === "en" ? "Admin Portal" : "Portal Administrativo";
  const backLabel = t(lang, "admin_back");

  const goView = (next: AdminView) => {
    setView(next);
    setMobileOpen(false);
  };

  const SidebarInner = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <Droplets className="size-5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-base tracking-tight">
            lavado<span className="text-primary">atp</span>
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">{brand}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => goView(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{t(lang, item.key)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-bold transition-colors hover:bg-accent/40"
        >
          <Globe className="size-3.5" />
          <span className={cn(lang === "es" && "text-primary")}>ES</span>
          <span className="text-muted-foreground/50">/</span>
          <span className={cn(lang === "en" && "text-primary")}>EN</span>
        </button>
        <Button
          onClick={onExit}
          variant="outline"
          className="w-full justify-start gap-2"
          aria-label={backLabel}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar (>= lg) */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 border-r border-sidebar-border bg-sidebar">
        {SidebarInner}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              {SidebarInner}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Droplets className="size-4" />
            </span>
            <span className="font-extrabold text-sm tracking-tight">
              lavado<span className="text-primary">atp</span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {brand}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <AdminViewRouter view={view} data={data} />
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminViewRouter({ view, data }: { view: AdminView; data: PublicData }) {
  switch (view) {
    case "dashboard": return <Dashboard data={data} />;
    case "services": return <ServicesManager data={data} />;
    case "bookings": return <Bookings data={data} />;
    case "customers": return <Customers />;
    case "leads": return <LeadsKanban />;
    case "analytics": return <Analytics />;
    case "editor": return <SiteEditor data={data} />;
    case "reviews": return <ReviewsManager data={data} />;
    case "staff": return <Staff />;
    case "settings": return <Settings data={data} />;
    default: return null;
  }
}
