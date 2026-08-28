"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";

type NativeSortableOptions = {
  disabled?: boolean;
};

export function useNativeSortable(
  onReorder: (fromId: string, toId: string) => void,
  options: NativeSortableOptions = {},
) {
  const { disabled = false } = options;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const didDragRef = useRef(false);

  const setDragging = useCallback((id: string | null) => {
    draggingIdRef.current = id;
    setDraggingId(id);
  }, []);

  const resetDrag = useCallback(() => {
    setDragging(null);
    setOverId(null);
  }, [setDragging]);

  const handleProps = useCallback(
    (id: string) => ({
      draggable: !disabled,
      onDragStart: (event: DragEvent<HTMLButtonElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        didDragRef.current = true;
        setDragging(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
      },
      onDragEnd: () => {
        resetDrag();
      },
    }),
    [disabled, resetDrag, setDragging],
  );

  const targetProps = useCallback(
    (id: string) => ({
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (disabled || !draggingIdRef.current) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOverId((current) => (current === id ? current : id));
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (disabled) return;
        event.preventDefault();
        const from = draggingIdRef.current ?? event.dataTransfer.getData("text/plain");
        resetDrag();
        if (from && from !== id) onReorder(from, id);
      },
    }),
    [disabled, onReorder, resetDrag],
  );

  const itemProps = useCallback(
    (id: string) => ({
      ...handleProps(id),
      ...targetProps(id),
      onPointerDown: () => {
        didDragRef.current = false;
      },
    }),
    [handleProps, targetProps],
  );

  const consumeDidDrag = useCallback(() => {
    const didDrag = didDragRef.current;
    didDragRef.current = false;
    return didDrag;
  }, []);

  return {
    draggingId,
    overId,
    handleProps,
    targetProps,
    itemProps,
    consumeDidDrag,
  };
}
