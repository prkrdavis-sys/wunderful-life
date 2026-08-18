"use client";

import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";

type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function fitHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  const minHeight = el.offsetHeight;
  const borderY = minHeight - el.clientHeight;
  el.style.height = `${Math.max(minHeight, el.scrollHeight + borderY) + 2}px`;
}

/**
 * Text field that grows with its content so wrapped lines (and descenders)
 * are never clipped. Single-line fields (`rows={1}`) keep Enter from inserting
 * a newline; longer fields stay multiline.
 */
export function AutoResizeTextarea({
  rows = 1,
  className = "",
  onChange,
  onKeyDown,
  value,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => fitHeight(el);
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [value, rows]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={rows}
      value={value}
      onChange={(event) => {
        fitHeight(event.currentTarget);
        onChange?.(event);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (rows === 1 && event.key === "Enter") {
          event.preventDefault();
        }
        onKeyDown?.(event);
      }}
      className={`block min-w-0 resize-none overflow-hidden ${className}`.trim()}
    />
  );
}
