import type { HTMLAttributes } from "react";
import { smallButtonClass } from "@/components/admin/site-editor/constants";

/** Move an item within a list, returning a new array. */
export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Insert the item at `fromIndex` before the item currently at `toIndex`. */
export function moveItemTo<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) return items;
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  next.splice(insertAt, 0, moved);
  return next;
}

export function uniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Reorder / remove controls shared by every repeatable list row. */
export function RowControls({
  label,
  index,
  count,
  onMove,
  onRemove,
  dragHandleProps,
  disableReorder = false,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  disableReorder?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
        {label} {index + 1}
      </p>
      <div className="flex items-center gap-1">
        {dragHandleProps && (
          <button
            type="button"
            {...dragHandleProps}
            aria-label={`Drag ${label} ${index + 1} to reorder`}
            className={`${smallButtonClass} cursor-grab active:cursor-grabbing`}
          >
            Drag
          </button>
        )}
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={disableReorder || index === 0}
          aria-label={`Move ${label} ${index + 1} up`}
          className={smallButtonClass}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={disableReorder || index === count - 1}
          aria-label={`Move ${label} ${index + 1} down`}
          className={smallButtonClass}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} ${index + 1}`}
          className={`${smallButtonClass} hover:border-blush-deep/60 hover:text-blush-deep`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function AddRowButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-dashed border-forest/40 px-4 py-2 text-sm font-medium text-forest transition hover:bg-forest/5 disabled:cursor-not-allowed disabled:border-brown/20 disabled:bg-cream/40 disabled:text-muted disabled:hover:bg-cream/40"
    >
      + {label}
    </button>
  );
}
