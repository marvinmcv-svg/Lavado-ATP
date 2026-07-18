"use client";
// Announcement bar (Step 4.7) — admin-editable text + active toggle.
import { Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/types";

export function AnnouncementBar({ settings }: { settings: SiteSettings | null }) {
  const lang = useLang((s) => s.lang);
  if (!settings?.announcementBarActive) return null;
  const text = lang === "en" ? settings.announcementBarTextEn : settings.announcementBarTextEs;
  if (!text) return null;
  return (
    <div className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
        <Sparkles className="size-3.5 shrink-0" />
        <span>{text}</span>
      </div>
    </div>
  );
}
