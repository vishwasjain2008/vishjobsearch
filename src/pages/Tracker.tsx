import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import { mockApplications } from "@/data/mockData";
import type { JobApplication, ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, KanbanSquare, List } from "lucide-react";

const Tracker: React.FC = () => {
  const [apps, setApps] = useState<JobApplication[]>(mockApplications);

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  const counts = {
    saved: apps.filter((a) => a.status === "saved").length,
    applied: apps.filter((a) => a.status === "applied").length,
    interview: apps.filter((a) => a.status === "interview").length,
    offer: apps.filter((a) => a.status === "offer").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Application Tracker" subtitle={`${apps.length} applications tracked`} />
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
          <Button size="sm" className="gap-2 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />Add Application
          </Button>
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          <KanbanBoard applications={apps} onStatusChange={handleStatusChange} />
        </div>
      </div>
    </div>
  );
};

export default Tracker;
