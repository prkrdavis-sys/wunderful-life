"use client";

import { motion } from "framer-motion";
import { useId, useRef, type Ref, type RefObject } from "react";

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
  /** Shown when a file or preview is present. Clears the native input before firing. */
  onRemove?: () => void;
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
    hint: "JPG, PNG, WebP — iPhone photos OK",
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

function clearFileInput(ref: RefObject<HTMLInputElement | null> | Ref<HTMLInputElement>) {
  if (typeof ref === "function") return;
  if (ref && "current" in ref && ref.current) {
    ref.current.value = "";
  }
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
  onRemove,
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
  // Keep remove available during busy uploads so a selection can be cancelled.
  const showRemove = Boolean(onRemove) && (hasSelection || hasPreview);
  const selected = hasSelection || hasPreview;

  return (
    <div className={`min-w-0 max-w-full ${className}`}>
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
      <div
        className={`group flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2 rounded-2xl border-2 px-3 py-3 sm:gap-x-3 sm:px-4 sm:py-3.5 ${
          selected
            ? "border-blush/50 bg-gradient-to-br from-blush/20 via-lavender/25 to-paper shadow-md shadow-blush/10"
            : "border-dashed border-blush/35 bg-gradient-to-br from-blush/10 via-lavender/15 to-cream/60 shadow-sm hover:border-blush-deep/45 hover:shadow-md hover:shadow-blush/15"
        }`}
      >
        <motion.label
          htmlFor={id}
          whileHover={
            disabled
              ? undefined
              : { y: -1, transition: { type: "spring", stiffness: 420, damping: 22 } }
          }
          whileTap={disabled ? undefined : { scale: 0.985 }}
          className={`flex min-w-[min(100%,11rem)] flex-1 cursor-pointer items-center gap-2 sm:gap-3 ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {hasPreview ? (
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brown/10 shadow-inner ring-2 ring-blush/25">
              {previewType === "video" ? (
                <video
                  src={
                    previewUrl
                      ? previewUrl.includes("#")
                        ? previewUrl
                        : `${previewUrl}#t=0.001`
                      : undefined
                  }
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl shadow-inner ring-2 ring-blush/20"
              animate={disabled ? undefined : { rotate: hasSelection ? 0 : [0, -6, 6, 0] }}
              transition={{ duration: 0.5, repeat: hasSelection ? 0 : Infinity, repeatDelay: 4 }}
            >
              {defaults.emoji}
            </motion.span>
          )}

          <span className="min-w-0 flex-1 text-left">
            <span className="font-display block truncate text-sm font-semibold tracking-wide text-forest">
              {selected ? defaults.selectedLabel : label}
            </span>
            {displayHint && !selected && (
              <span className="mt-0.5 block text-xs text-ink/75">{displayHint}</span>
            )}
            {selected && selectedName && (
              <span className="mt-1 flex min-w-0 max-w-full items-center gap-1 overflow-hidden rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-ellipsis whitespace-nowrap text-blush-deep">
                <span aria-hidden>💕</span>
                {friendlyFileName(selectedName)}
              </span>
            )}
          </span>
        </motion.label>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
          <label
            htmlFor={id}
            aria-hidden="true"
            className={`shrink-0 whitespace-nowrap rounded-full bg-forest/90 px-2.5 py-1.5 font-label text-[10px] font-semibold tracking-[0.14em] text-paper uppercase opacity-90 transition group-hover:bg-forest sm:px-3 ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            {selected ? "Swap" : "Browse"}
          </label>
          {showRemove && (
            <button
              type="button"
              onClick={() => {
                clearFileInput(inputRef);
                onRemove?.();
              }}
              aria-label="Remove upload"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brown/20 bg-white text-lg leading-none text-brown shadow-sm transition hover:border-blush-deep/50 hover:bg-blush/20 hover:text-blush-deep sm:h-10 sm:w-10"
            >
              <span aria-hidden>×</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
