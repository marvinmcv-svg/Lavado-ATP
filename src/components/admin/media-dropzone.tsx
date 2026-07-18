"use client";
// Shared upload hook + dropzone UI for admin. POSTs multipart to /api/admin/upload.
import { useState, useCallback } from "react";
import { UploadCloud, Loader2, X, ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadResult {
  url: string;
  mediaType: "image" | "video";
  filename: string;
  size: number;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(`Subiendo ${file.name}...`);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "upload_failed");
      }
      return data as UploadResult;
    } catch (e) {
      console.error("upload error", e);
      return null;
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, []);

  return { upload, uploading, progress };
}

interface DropzoneProps {
  label: string;
  value: string | null;
  mediaType: "image" | "video";
  onChange: (url: string | null, mediaType?: "image" | "video") => void;
  className?: string;
  compact?: boolean;
}

export function MediaDropzone({ label, value, mediaType, onChange, className, compact }: DropzoneProps) {
  const { upload, uploading, progress } = useUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const result = await upload(file);
    if (result) {
      onChange(result.url, result.mediaType);
    }
  };

  const accept = mediaType === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif";

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-start gap-3">
        {/* Preview */}
        {value ? (
          <div className="relative shrink-0 rounded-lg overflow-hidden border border-border bg-muted" style={{ width: compact ? 64 : 96, height: compact ? 64 : 96 }}>
            {mediaType === "video" ? (
              <video src={value} className="size-full object-cover" muted playsInline preload="metadata" />
            ) : (
              <img src={value} alt="" className="size-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              aria-label="Quitar"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}

        {/* Dropzone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-center",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
            compact ? "py-3 px-2" : "py-6 px-4",
          )}
        >
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">{progress}</span>
            </>
          ) : (
            <>
              {mediaType === "video" ? <Video className="size-5 text-muted-foreground" /> : <ImageIcon className="size-5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                {value ? "Cambiar" : "Subir o arrastrar aquí"}
              </span>
              {!compact && (
                <span className="text-[10px] text-muted-foreground/70">
                  {mediaType === "video" ? "MP4, WebM · max 60MB" : "JPG, PNG, WebP · max 60MB"}
                </span>
              )}
            </>
          )}
        </label>
      </div>
      {/* URL display (editable) */}
      {value && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value, mediaType)}
          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="https://..."
        />
      )}
    </div>
  );
}

export { UploadCloud };
