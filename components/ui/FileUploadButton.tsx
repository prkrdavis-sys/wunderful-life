"use client";

import { motion } from "framer-motion";
import { useId, useRef, type Ref } from "react";

type FileUploadButtonProps = {
  accept?: string;
  buttonLabel?: string;
  hint?: string;
  selectedName?: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
};

function UploadIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

export function FileUploadButton({
  accept,
  buttonLabel = "Choose file",
  hint,
  selectedName,
  onChange,
  required,
  disabled,
  className = "",
  inputRef: externalInputRef,
}: FileUploadButtonProps) {
  const id = useId();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;

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
            : { scale: 1.02, y: -1, transition: { duration: 0.15 } }
        }
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-burgundy/35 bg-white px-4 py-2.5 text-sm font-medium text-indigo shadow-sm transition-colors hover:border-burgundy/55 hover:bg-lavender/20 focus-within:ring-2 focus-within:ring-burgundy/25 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        <UploadIcon />
        {selectedName ? "Change file" : buttonLabel}
      </motion.label>

      {selectedName ? (
        <p className="mt-1.5 truncate text-xs font-medium text-burgundy/90">
          {selectedName}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
