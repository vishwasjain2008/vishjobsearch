import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobListing } from "@/types";
import {
  MapPin, Clock, DollarSign, Wifi, Building2,
  ExternalLink, ChevronRight, ShieldCheck, ShieldQuestion, ShieldX, Star,
} from "lucide-react";
import { isKnownH1BSponsor } from "@/lib/h1bSponsors";

// Use the direct apply link from the job listing (Greenhouse/Lever/Ashby/Workday direct URLs)
const buildApplyUrl = (job: JobListing): string => {
  if (job.applyLink && job.applyLink.startsWith("http")) return job.applyLink;
  const q = encodeURIComponent(`${job.title} ${job.company}`);
  return `https://www.google.com/search?q=${q}&ibp=htl;jobs`;
};

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  compact?: boolean;
}

const ScoreBadge = ({ score, label }: { score: number; label: string }) => {
  const color = score >= 80 ? "text-score-high" : score >= 65 ? "text-score-medium" : "text-score-low";
  const bg = score >= 80 ? "bg-success/10" : score >= 65 ? "bg-warning/10" : "bg-destructive/10";
  return (
    <div className={cn("flex flex-col items-center px-3 py-1.5 rounded-lg", bg)}>
      <span className={cn("text-lg font-bold leading-none", color)}>{score}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
};

const VisaBadge = ({ status, knownSponsor }: { status: JobListing["visaStatus"]; knownSponsor: boolean }) => {
  if (status === "rarely") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-visa-rarely">
        <ShieldX className="w-3 h-3" />
        Rarely Sponsors
      </span>
    );
  }
  if (knownSponsor) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-visa-friendly border border-success/30">
        <Star className="w-3 h-3 fill-current" />
        Known H1B Sponsor
      </span>
    );
  }
  if (status === "friendly") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-visa-friendly">
        <ShieldCheck className="w-3 h-3" />
        Visa Friendly
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-visa-unknown">
      <ShieldQuestion className="w-3 h-3" />
      Unknown
    </span>
  );
};

const TimingTag = ({ tag }: { tag: JobListing["timingTag"] }) => {
  if (tag === "new") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-new-badge text-white animate-pulse">🔥 New &lt;24h</span>
  );
  if (tag === "early") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-early-badge text-white">⚡ Early Opp &lt;48h</span>
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
  const knownSponsor = isKnownH1BSponsor(job.company);

  return (
    <Card
      className={cn(
        "group cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in",
        knownSponsor
          ? "border-success/40 hover:border-success/60 ring-1 ring-success/20"
          : "hover:border-primary/30"
      )}
      onClick={() => onSelect(job)}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
            knownSponsor ? "bg-success/10 border-success/30" : "bg-accent border-border"
          )}>
            <Building2 className={cn("w-5 h-5", knownSponsor ? "text-visa-friendly" : "text-accent-foreground")} />
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
          <VisaBadge status={job.visaStatus} knownSponsor={knownSponsor} />
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



  const color = score >= 80 ? "text-score-high" : score >= 65 ? "text-score-medium" : "text-score-low";
  const bg = score >= 80 ? "bg-success/10" : score >= 65 ? "bg-warning/10" : "bg-destructive/10";
  return (
    <div className={cn("flex flex-col items-center px-3 py-1.5 rounded-lg", bg)}>
      <span className={cn("text-lg font-bold leading-none", color)}>{score}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
};

const VisaBadge = ({ status }: { status: JobListing["visaStatus"] }) => {
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

const TimingTag = ({ tag }: { tag: JobListing["timingTag"] }) => {
  if (tag === "new") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-new-badge text-white animate-pulse">🔥 New &lt;24h</span>
  );
  if (tag === "early") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-early-badge text-white">⚡ Early Opp &lt;48h</span>
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
