"use client";

import { motion } from "framer-motion";
import { useId, useRef, type Ref } from "react";

type FileUploadKind = "photo" | "video" | "thumbnail" | "file";

type FileUploadButtonProps = {
  accept?: string;
  kind?: FileUploadKind;
  buttonLabel?: string;
  hint?: string;
  selectedName?: string | null;
  previewUrl?: string | null;
  previewType?: "image" | "video";
  onChange: (file: File | null) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
};

const kindDefaults: Record<
  FileUploadKind,
  { emoji: string; label: string; selectedLabel: string; hint: string }
> = {
  photo: {
    emoji: "✨",
    label: "Add a photo",
    selectedLabel: "Pick another",
    hint: "JPG, PNG, or WebP",
  },
  video: {
    emoji: "🎬",
    label: "Add your video",
    selectedLabel: "Swap video",
    hint: "MP4, MOV, or M4V",
  },
  thumbnail: {
    emoji: "🖼️",
    label: "Add a cover image",
    selectedLabel: "New cover",
    hint: "PNG, JPEG, WebP, or SVG",
  },
  file: {
    emoji: "📎",
    label: "Add a file",
    selectedLabel: "Replace file",
    hint: "",
  },
};

function friendlyFileName(name: string): string {
  const base = name.split("/").pop() ?? name;
  if (base.length <= 28) return base;
  return `${base.slice(0, 12)}…${base.slice(-10)}`;
}

export function FileUploadButton({
  accept,
  kind = "file",
  buttonLabel,
  hint,
  selectedName,
  previewUrl,
  previewType = "image",
  onChange,
  required,
  disabled,
  className = "",
  inputRef: externalInputRef,
}: FileUploadButtonProps) {
  const id = useId();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const defaults = kindDefaults[kind];
  const label = buttonLabel ?? defaults.label;
  const displayHint = hint ?? defaults.hint;
  const hasSelection = Boolean(selectedName);
  const hasPreview = Boolean(previewUrl);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null);
        }}
      />
      <motion.label
        htmlFor={id}
        whileHover={
          disabled
            ? undefined
            : { scale: 1.015, y: -2, transition: { type: "spring", stiffness: 420, damping: 22 } }
        }
        whileTap={disabled ? undefined : { scale: 0.985 }}
        className={`group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3.5 transition-shadow ${
          hasSelection || hasPreview
            ? "border-pink/50 bg-gradient-to-br from-pink/20 via-lavender/25 to-paper shadow-md shadow-pink/10"
            : "border-dashed border-pink/35 bg-gradient-to-br from-pink/10 via-lavender/15 to-cream/60 shadow-sm hover:border-pink-deep/45 hover:shadow-md hover:shadow-pink/15"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        {hasPreview ? (
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brown/10 shadow-inner ring-2 ring-pink/25">
            {previewType === "video" ? (
              <video
                src={previewUrl ?? undefined}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- blob/local preview URLs
              <img
                src={previewUrl ?? undefined}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </span>
        ) : (
          <motion.span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl shadow-inner ring-2 ring-pink/20"
            animate={disabled ? undefined : { rotate: hasSelection ? 0 : [0, -6, 6, 0] }}
            transition={{ duration: 0.5, repeat: hasSelection ? 0 : Infinity, repeatDelay: 4 }}
          >
            {defaults.emoji}
          </motion.span>
        )}

        <span className="min-w-0 flex-1 text-left">
          <span className="font-display block text-sm font-semibold tracking-wide text-burgundy">
            {hasSelection || hasPreview ? defaults.selectedLabel : label}
          </span>
          {displayHint && !hasSelection && !hasPreview && (
            <span className="mt-0.5 block text-xs text-indigo/75">{displayHint}</span>
          )}
          {(hasSelection || hasPreview) && selectedName && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-pink-deep">
              <span aria-hidden>💕</span>
              {friendlyFileName(selectedName)}
            </span>
          )}
        </span>

        <span
          aria-hidden
          className="shrink-0 rounded-full bg-burgundy/90 px-3 py-1.5 font-label text-[10px] font-semibold tracking-[0.14em] text-paper uppercase opacity-90 transition group-hover:bg-burgundy"
        >
          {hasSelection || hasPreview ? "Swap" : "Browse"}
        </span>
      </motion.label>
    </div>
  );
}
