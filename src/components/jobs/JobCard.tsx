import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { JobListing } from "@/types";

// Build a LinkedIn job search URL so the link goes to the real filtered listing
const buildApplyUrl = (job: JobListing) =>
  `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&f_C=&origin=JOBS_HOME_SEARCH_BUTTON`;
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobListing } from "@/types";
import {
  MapPin, Clock, DollarSign, Wifi, Building2, TrendingUp,
  Star, ExternalLink, ChevronRight, ShieldCheck, ShieldQuestion, ShieldX,
} from "lucide-react";

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  compact?: boolean;
}

const ScoreBadge: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  const color = score >= 80 ? "text-score-high" : score >= 65 ? "text-score-medium" : "text-score-low";
  const bg = score >= 80 ? "bg-success/10" : score >= 65 ? "bg-warning/10" : "bg-destructive/10";
  return (
    <div className={cn("flex flex-col items-center px-3 py-1.5 rounded-lg", bg)}>
      <span className={cn("text-lg font-bold leading-none", color)}>{score}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
};

const VisaBadge: React.FC<{ status: JobListing["visaStatus"] }> = ({ status }) => {
  const map = {
    friendly: { icon: ShieldCheck, color: "text-visa-friendly", bg: "bg-success/10", label: "Visa Friendly" },
    unknown: { icon: ShieldQuestion, color: "text-visa-unknown", bg: "bg-muted", label: "Unknown" },
    rarely: { icon: ShieldX, color: "text-visa-rarely", bg: "bg-destructive/10", label: "Rarely Sponsors" },
  };
  const { icon: Icon, color, bg, label } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", bg, color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const TimingTag: React.FC<{ tag: JobListing["timingTag"] }> = ({ tag }) => {
  if (tag === "new") return (
    <Badge className="bg-new-badge text-white border-0 text-xs animate-pulse">🔥 New &lt;24h</Badge>
  );
  if (tag === "early") return (
    <Badge className="bg-early-badge text-white border-0 text-xs">⚡ Early Opp &lt;48h</Badge>
  );
  return null;
};

const formatSalary = (min?: number, max?: number) => {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return null;
};

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect, compact }) => {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const hoursAgo = Math.round((Date.now() - new Date(job.postedDate).getTime()) / 36e5);
  const timeLabel = hoursAgo < 1 ? "Just now" : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;

  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 animate-fade-in"
      onClick={() => onSelect(job)}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0 border border-border">
            <Building2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <ScoreBadge score={job.matchScore} label="Match" />
                <ScoreBadge score={job.priorityScore} label="Priority" />
              </div>
            </div>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <TimingTag tag={job.timingTag} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
            <MapPin className="w-3 h-3" />
            {job.location}
          </span>
          {job.isRemote && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              <Wifi className="w-3 h-3" />
              Remote
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
              <DollarSign className="w-3 h-3" />
              {salary}
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
            <Clock className="w-3 h-3" />
            {timeLabel}
          </span>
          <VisaBadge status={job.visaStatus} />
        </div>

        {/* Skills */}
        {!compact && (
          <div className="flex flex-wrap gap-1 mt-3">
            {job.strongMatchSkills.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded bg-success/10 text-score-high text-xs font-medium">{s}</span>
            ))}
            {job.missingSkills.slice(0, 2).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded bg-destructive/10 text-score-low text-xs font-medium">{s}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{job.source}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className={cn("text-xs font-medium capitalize",
              job.competitionLevel === "low" ? "text-score-high" :
              job.competitionLevel === "medium" ? "text-score-medium" : "text-score-low"
            )}>
              {job.competitionLevel} competition
            </span>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); window.open(buildApplyUrl(job), "_blank", "noopener,noreferrer"); }}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Apply
            </Button>
            <Button size="sm" className="h-7 px-3 text-xs" onClick={(e) => { e.stopPropagation(); onSelect(job); }}>
              View
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
