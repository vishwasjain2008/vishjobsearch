import React from "react";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import type { ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { useAppliedJobs } from "@/hooks/useAppliedJobs";

const Tracker: React.FC = () => {
  const { applications, updateStatus } = useAppliedJobs();

  const counts = {
    saved: applications.filter((a) => a.status === "saved").length,
    applied: applications.filter((a) => a.status === "applied").length,
    interview: applications.filter((a) => a.status === "interview").length,
    offer: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Application Tracker" subtitle={`${applications.length} applications tracked`} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          {[
            { id: "saved", label: "Saved", color: "bg-muted text-muted-foreground" },
            { id: "applied", label: "Applied", color: "bg-accent text-accent-foreground" },
            { id: "interview", label: "Interview", color: "bg-warning/10 text-score-medium" },
            { id: "offer", label: "Offer", color: "bg-success/10 text-score-high" },
            { id: "rejected", label: "Rejected", color: "bg-destructive/10 text-score-low" },
          ].map(({ id, label, color }) => (
            <div key={id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>
              {label}
              <span className="font-black">{counts[id as ApplicationStatus]}</span>
            </div>
          ))}
          <div className="flex-1" />
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Go to <strong>Job Discovery</strong> and check the <strong>Applied</strong> checkbox on any job to track it here.
              </p>
            </div>
          ) : (
            <KanbanBoard applications={applications} onStatusChange={updateStatus} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracker;
