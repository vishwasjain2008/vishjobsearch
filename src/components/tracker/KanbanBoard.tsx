import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { JobApplication, ApplicationStatus } from "@/types";
import { Building2, MoreHorizontal, Calendar, FileText, ExternalLink } from "lucide-react";

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: "saved", label: "Saved", color: "bg-muted text-muted-foreground" },
  { id: "applied", label: "Applied", color: "bg-accent text-accent-foreground" },
  { id: "interview", label: "Interview", color: "bg-warning/10 text-score-medium" },
  { id: "offer", label: "Offer", color: "bg-success/10 text-score-high" },
  { id: "rejected", label: "Rejected", color: "bg-destructive/10 text-score-low" },
];

const AppCard: React.FC<{ app: JobApplication; onDrop: (status: ApplicationStatus) => void }> = ({ app, onDrop }) => {
  const [showMenu, setShowMenu] = useState(false);
  const remaining = COLUMNS.filter((c) => c.id !== app.status);

  return (
    <div className="relative bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all group animate-fade-in">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
            <button
              className="text-left group/link w-full"
              onClick={() => {
                const url = app.job.applyLink?.startsWith("http") ? app.job.applyLink : `https://www.google.com/search?q=${encodeURIComponent(`"${app.job.title}" ${app.job.company} job`)}&ibp=htl;jobs`;
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
        <div className="relative">
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
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors capitalize"
                >
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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onStatusChange }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {COLUMNS.map((col) => {
        const items = applications.filter((a) => a.status === col.id);
        return (
          <div key={col.id} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold", col.color)}>
                {col.label}
              </span>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{items.length}</Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="space-y-2 pr-1">
                {items.map((app) => (
                  <AppCard key={app.id} app={app} onDrop={(status) => onStatusChange(app.id, status)} />
                ))}
                {items.length === 0 && (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground">No applications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};
