"use client";
// App shell — toggles between public site and admin portal (single route).
// Shows a water splash preloader on initial load.
import { useEffect, useState } from "react";
import { PublicSite } from "@/components/site/public-site";
import { AdminPortal } from "@/components/admin/admin-portal";
import { SchemaOrg } from "@/components/site/schema-org";
import { Preloader } from "@/components/site/preloader";
import { useLang } from "@/lib/i18n";
import type { PublicData } from "@/lib/public-data";

type View = "public" | "admin";

export function AppShell({ data }: { data: PublicData }) {
  const [view, setView] = useState<View>("public");
  const setLang = useLang((s) => s.setLang);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("lang") : null;
    if (stored === "es" || stored === "en") setLang(stored);
  }, [setLang]);

  // allow ?admin=1 deep-link to skip straight to admin
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("admin=1")) {
      // one-time URL read on mount — safe to set state here
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("admin");
    }
  }, []);

  if (view === "admin" && data.business) {
    return (
      <>
        {/* noindex for admin surfaces — prevents search engines from indexing admin content */}
        <meta name="robots" content="noindex, nofollow" />
        <AdminPortal data={data} onExit={() => setView("public")} />
      </>
    );
  }

  return (
    <>
      <Preloader logoUrl={data.business?.logoUrl ?? null} />
      <SchemaOrg business={data.business!} settings={data.settings} reviews={data.reviews} />
      <PublicSite
        business={data.business!}
        settings={data.settings}
        categories={data.categories}
        services={data.services}
        pairs={data.pairs}
        reels={data.reels}
        reviews={data.reviews}
        reviewAverage={data.reviewAverage}
        onAdminClick={() => setView("admin")}
      />
    </>
  );
}
