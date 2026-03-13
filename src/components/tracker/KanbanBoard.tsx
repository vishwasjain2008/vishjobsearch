import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { JobApplication, ApplicationStatus } from "@/types";
import { Building2, MoreHorizontal, Calendar, FileText, ExternalLink, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

const COLUMNS: { id: ApplicationStatus; label: string; color: string; dotColor: string }[] = [
  { id: "saved",     label: "Saved",     color: "bg-muted text-muted-foreground",        dotColor: "bg-muted-foreground" },
  { id: "applied",   label: "Applied",   color: "bg-accent text-accent-foreground",       dotColor: "bg-primary" },
  { id: "interview", label: "Interview", color: "bg-warning/10 text-score-medium",        dotColor: "bg-warning" },
  { id: "offer",     label: "Offer",     color: "bg-success/10 text-score-high",          dotColor: "bg-success" },
  { id: "rejected",  label: "Rejected",  color: "bg-destructive/10 text-score-low",       dotColor: "bg-destructive" },
];

/* ── Individual card ───────────────────────────────────────────────── */
interface AppCardProps {
  app: JobApplication;
  onDrop: (status: ApplicationStatus) => void;
  isDragging?: boolean;
}

const AppCardInner: React.FC<AppCardProps & { dragHandleProps?: React.HTMLAttributes<HTMLDivElement> }> = ({
  app, onDrop, isDragging, dragHandleProps,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const remaining = COLUMNS.filter((c) => c.id !== app.status);

  return (
    <div className={cn(
      "relative bg-card border border-border rounded-lg p-3 transition-all group animate-fade-in",
      isDragging ? "shadow-xl ring-2 ring-primary/30 opacity-90 rotate-1 scale-[1.02]" : "hover:shadow-sm",
    )}>
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="mt-0.5 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity cursor-grab active:cursor-grabbing shrink-0 touch-none"
        >
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-accent-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <button
            className="text-left group/link w-full"
            onClick={() => {
              const url = app.job.applyLink?.startsWith("http")
                ? app.job.applyLink
                : `https://www.google.com/search?q=${encodeURIComponent(`"${app.job.title}" ${app.job.company} job`)}&ibp=htl;jobs`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <p className="text-xs font-semibold text-foreground truncate group-hover/link:text-primary transition-colors flex items-center gap-1">
              {app.job.title}
              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover/link:opacity-60 transition-opacity" />
            </p>
          </button>
          <p className="text-xs text-muted-foreground truncate">{app.job.company}</p>
        </div>

        {/* Move menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg z-10 py-1">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Move to</p>
              {remaining.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onDrop(c.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors capitalize flex items-center gap-2"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dotColor)} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
          app.job.matchScore >= 80 ? "bg-success/10 text-score-high" :
          app.job.matchScore >= 65 ? "bg-warning/10 text-score-medium" : "bg-destructive/10 text-score-low"
        )}>
          {app.job.matchScore}% match
        </span>
        {app.job.isRemote && (
          <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-xs">Remote</span>
        )}
      </div>

      {(app.interviewDate || app.appliedDate) && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {app.interviewDate ? `Interview: ${app.interviewDate}` : `Applied: ${app.appliedDate}`}
        </div>
      )}

      {app.notes.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          {app.notes[0].text.slice(0, 40)}{app.notes[0].text.length > 40 ? "…" : ""}
        </div>
      )}
    </div>
  );
};

/* Sortable wrapper */
const SortableCard: React.FC<AppCardProps> = ({ app, onDrop }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { app },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AppCardInner app={app} onDrop={onDrop} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
};

/* ── Droppable column ──────────────────────────────────────────────── */
const KanbanColumn: React.FC<{
  col: typeof COLUMNS[number];
  items: JobApplication[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  isOver: boolean;
}> = ({ col, items, onStatusChange, isOver }) => {
  const { setNodeRef } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-64 flex flex-col rounded-xl transition-colors duration-150",
        isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-transparent"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold", col.color)}>
          {col.label}
        </span>
        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-muted text-muted-foreground text-xs font-bold">
          {items.length}
        </span>
      </div>

      <ScrollArea className="h-[calc(100vh-260px)]">
        <SortableContext items={items.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pr-1 pb-2 min-h-[48px]">
            {items.map((app) => (
              <SortableCard
                key={app.id}
                app={app}
                onDrop={(status) => onStatusChange(app.id, status)}
              />
            ))}
            {items.length === 0 && (
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                isOver ? "border-primary/40 bg-primary/5" : "border-border"
              )}>
                <p className="text-xs text-muted-foreground">Drop here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

/* ── Board ─────────────────────────────────────────────────────────── */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onStatusChange }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<ApplicationStatus | null>(null);

  const activeApp = applications.find((a) => a.id === activeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const getColumnOfItem = (id: string): ApplicationStatus | null => {
    const app = applications.find((a) => a.id === id);
    return app?.status ?? null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    // Could be a column id or a card id — resolve to column
    const colMatch = COLUMNS.find((c) => c.id === overId);
    if (colMatch) { setOverColumnId(colMatch.id); return; }
    setOverColumnId(getColumnOfItem(overId));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverColumnId(null);
    if (!over || !activeId) return;

    const overId = over.id as string;
    const colMatch = COLUMNS.find((c) => c.id === overId);
    const targetStatus: ApplicationStatus | null = colMatch
      ? colMatch.id
      : getColumnOfItem(overId);

    if (!targetStatus) return;
    const currentStatus = getColumnOfItem(activeId);
    if (currentStatus !== targetStatus) {
      onStatusChange(activeId, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            items={applications.filter((a) => a.status === col.id)}
            onStatusChange={onStatusChange}
            isOver={overColumnId === col.id}
          />
        ))}
      </div>

      {/* Drag overlay — floating ghost card */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeApp ? (
          <AppCardInner app={activeApp} onDrop={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
