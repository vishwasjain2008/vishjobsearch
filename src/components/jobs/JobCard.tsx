import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { JobListing } from "@/types";
import {
  MapPin, Clock, DollarSign, Wifi, Building2,
  ExternalLink, ChevronRight, ShieldCheck, ShieldQuestion, ShieldX, Star,
  AlertTriangle, XCircle, Bookmark,
} from "lucide-react";
import { isKnownH1BSponsor } from "@/lib/h1bSponsors";

const buildApplyUrl = (job: JobListing): string => {
  if (job.applyLink && job.applyLink.startsWith("http")) return job.applyLink;
  const q = encodeURIComponent(`${job.title} ${job.company}`);
  return `https://www.google.com/search?q=${q}&ibp=htl;jobs`;
};

const JOB_EXPIRY_DAYS = 90;

function jobAgeDays(postedDate: string): number {
  return (Date.now() - new Date(postedDate).getTime()) / (1000 * 60 * 60 * 24);
}

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  onMarkApplied: (job: JobListing) => void;
  onBookmark?: (job: JobListing, saved: boolean) => void;
  isBookmarked?: boolean;
  index?: number;
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

async function check404(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(5000) });
    if (res.status === 404 || res.status === 410) return true;
    return false;
  } catch {
    return false;
  }
}

type ExpiryState = "unknown" | "checking" | "expired" | "ok";

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect, onMarkApplied, onBookmark, isBookmarked = false, index, compact }) => {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const hoursAgo = Math.round((Date.now() - new Date(job.postedDate).getTime()) / 36e5);
  const timeLabel = hoursAgo < 1 ? "Just now" : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
  const knownSponsor = isKnownH1BSponsor(job.company);
  const ageDays = jobAgeDays(job.postedDate);
  const mayBeExpired = ageDays >= JOB_EXPIRY_DAYS;

  const [expiryState, setExpiryState] = useState<ExpiryState>("unknown");
  const [appliedChecked, setAppliedChecked] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    onBookmark?.(job, next);
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildApplyUrl(job);

    if (expiryState === "expired") {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(`"${job.title}" ${job.company} job`)}&ibp=htl;jobs`, "_blank", "noopener,noreferrer");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    if (expiryState === "unknown") {
      setExpiryState("checking");
      const is404 = await check404(url);
      setExpiryState(is404 ? "expired" : "ok");
    }
  };

  const handleAppliedChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setAppliedChecked(true);
      onMarkApplied(job);
    }
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in",
        knownSponsor
          ? "border-success/40 hover:border-success/60 ring-1 ring-success/20"
          : "hover:border-primary/30",
        bookmarked && "ring-1 ring-primary/30 border-primary/30",
        mayBeExpired && expiryState !== "ok" && "opacity-75"
      )}
      onClick={() => onSelect(job)}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Number badge */}
          {index !== undefined && (
            <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-2">
              {index}
            </span>
          )}
...
                {/* Bookmark button */}
                <button
                  onClick={handleBookmark}
                  title={bookmarked ? "Remove bookmark" : "Save for later"}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    bookmarked
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
                </button>
                <ScoreBadge score={job.matchScore} label="Match" />
                <ScoreBadge score={job.priorityScore} label="Priority" />
              </div>
            </div>
          </div>
        </div>

        {/* Expiry banners */}
        {expiryState === "expired" && (
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
            <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
            <span className="text-xs font-medium text-destructive">Job expired — clicking Apply will search for it instead</span>
          </div>
        )}
        {mayBeExpired && expiryState !== "expired" && expiryState !== "ok" && (
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
            <span className="text-xs font-medium text-warning">May be expired · posted {Math.floor(ageDays)}d ago</span>
          </div>
        )}

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

          {/* Action row: Apply (primary) · Applied checkbox · View (ghost) */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Apply — primary, larger */}
            <Button
              size="sm"
              variant={expiryState === "expired" ? "destructive" : "default"}
              className="h-8 px-4 text-xs font-semibold"
              onClick={handleApply}
              disabled={expiryState === "checking"}
            >
              {expiryState === "expired" ? (
                <><XCircle className="w-3.5 h-3.5 mr-1" />Expired</>
              ) : expiryState === "checking" ? (
                <span className="animate-pulse">Checking…</span>
              ) : (
                <><ExternalLink className="w-3.5 h-3.5 mr-1" />Apply</>
              )}
            </Button>

            {/* Applied checkbox */}
            <label
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors cursor-pointer select-none text-xs font-medium",
                appliedChecked
                  ? "bg-success/10 border-success/40 text-score-high"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Checkbox
                checked={appliedChecked}
                onCheckedChange={handleAppliedChange}
                className="h-3.5 w-3.5"
                aria-label="Mark as applied"
              />
              Applied
            </label>

            {/* View — ghost */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs"
              onClick={(e) => { e.stopPropagation(); onSelect(job); }}
            >
              View
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
