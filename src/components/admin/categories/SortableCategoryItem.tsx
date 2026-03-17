import React from 'react';
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const SortableCategoryItem = ({ id, children }: { id: number; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none" as React.CSSProperties['touchAction'],
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 flex cursor-grab items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md active:cursor-grabbing"
    >
      {children}
    </div>
  );
};