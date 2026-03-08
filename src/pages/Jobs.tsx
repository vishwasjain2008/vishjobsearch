import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters, FilterState, defaultFilters } from "@/components/jobs/JobFilters";
import { JobDetail } from "@/components/jobs/JobDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockJobs } from "@/data/mockData";
import type { JobListing } from "@/types";
import { RefreshCw, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const Jobs: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "match" | "recent">("priority");
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    let result = [...mockJobs];
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filters.remote === true) result = result.filter((j) => j.isRemote);
    if (filters.remote === false) result = result.filter((j) => !j.isRemote);
    if (filters.salaryMin > 0) result = result.filter((j) => (j.salaryMin ?? 0) >= filters.salaryMin);
    if (filters.minMatch > 0) result = result.filter((j) => j.matchScore >= filters.minMatch);
    if (filters.visaFriendly) result = result.filter((j) => j.visaStatus === "friendly");
    if (filters.timing.length > 0) result = result.filter((j) => filters.timing.includes(j.timingTag));
    if (filters.competition.length > 0) result = result.filter((j) => filters.competition.includes(j.competitionLevel));

    result.sort((a, b) =>
      sortBy === "priority" ? b.priorityScore - a.priorityScore :
      sortBy === "match" ? b.matchScore - a.matchScore :
      new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );
    return result;
  }, [filters, sortBy]);

  const newCount = mockJobs.filter((j) => j.timingTag === "new").length;
  const earlyCount = mockJobs.filter((j) => j.timingTag === "early").length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Job Discovery"
        subtitle={`${mockJobs.length} jobs found · ${newCount} new today · ${earlyCount} early opportunities`}
      />

      <div className="flex flex-1 min-h-0">
        {/* Filters sidebar */}
        <div className={cn("shrink-0 overflow-y-auto p-4 border-r border-border scrollbar-thin transition-all", showFilters ? "w-64" : "w-0 p-0 overflow-hidden border-0")}>
          <JobFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex min-w-0">
          <div className={cn("flex-1 flex flex-col min-w-0 transition-all", selectedJob ? "max-w-[55%]" : "")}>
            {/* Sort/filter bar */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card/50">
              <Button
                variant="ghost" size="sm"
                className="gap-2 h-8 text-xs"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Sliders className="w-3.5 h-3.5" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">{filtered.length} results</span>
              <div className="flex gap-1">
                {[
                  { id: "priority", label: "Priority" },
                  { id: "match", label: "Match" },
                  { id: "recent", label: "Recent" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setSortBy(id as typeof sortBy)}
                    className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                      sortBy === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >{label}</button>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Jobs list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <p className="text-lg font-semibold text-foreground">No jobs match your filters</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filtered.map((job) => (
                  <JobCard key={job.id} job={job} onSelect={setSelectedJob} />
                ))
              )}
            </div>
          </div>

          {/* Job detail panel */}
          {selectedJob && (
            <div className="w-[45%] max-w-md shrink-0 border-l border-border overflow-hidden">
              <JobDetail job={selectedJob} onClose={() => setSelectedJob(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
