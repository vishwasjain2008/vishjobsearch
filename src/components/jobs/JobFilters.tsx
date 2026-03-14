import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

export interface FilterState {
  query: string;
  remote: boolean | null;
  salaryMin: number;
  source: string;
  visaFriendly: boolean;
  h1bOnly: boolean;
  minMatch: number;
  timing: string[];
  competition: string[];
}

interface JobFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export const defaultFilters: FilterState = {
  query: "",
  remote: null,
  salaryMin: 0,
  source: "",
  visaFriendly: false,
  h1bOnly: false,
  minMatch: 0,
  timing: [],
  competition: [],
};

export const JobFilters: React.FC<JobFiltersProps> = ({ filters, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const toggle = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleArr = (key: "timing" | "competition", val: string) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] });
  };

  const activeCount = [
    filters.remote !== null,
    filters.salaryMin > 0,
    filters.source !== "",
    filters.visaFriendly,
    filters.minMatch > 0,
    filters.timing.length > 0,
    filters.competition.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {activeCount > 0 && <Badge className="h-5 px-1.5 text-xs">{activeCount}</Badge>}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-border">
          {/* Search */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Search</Label>
            <Input
              placeholder="Title, company, skill..."
              value={filters.query}
              onChange={(e) => toggle("query", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Work type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Work Type</Label>
            <div className="flex gap-1.5">
              {[{ label: "All", v: null }, { label: "Remote", v: true }, { label: "Onsite", v: false }].map(({ label, v }) => (
                <button
                  key={label}
                  onClick={() => toggle("remote", v)}
                  className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors border",
                    filters.remote === v ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Min match */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 flex justify-between">
              <span>Min Match Score</span><span className="text-foreground font-medium">{filters.minMatch}+</span>
            </Label>
            <Slider
              min={0} max={90} step={10}
              value={[filters.minMatch]}
              onValueChange={([v]) => toggle("minMatch", v)}
              className="mt-1"
            />
          </div>

          {/* Salary */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 flex justify-between">
              <span>Min Salary</span>
              <span className="text-foreground font-medium">{filters.salaryMin > 0 ? `$${filters.salaryMin / 1000}k+` : "Any"}</span>
            </Label>
            <Slider
              min={0} max={200000} step={10000}
              value={[filters.salaryMin]}
              onValueChange={([v]) => toggle("salaryMin", v)}
              className="mt-1"
            />
          </div>

          {/* Timing */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Timing</Label>
            <div className="flex flex-wrap gap-1.5">
              {["new", "early", "recent"].map((t) => (
                <button
                  key={t}
                  onClick={() => toggleArr("timing", t)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition-colors",
                    filters.timing.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >{t === "new" ? "🔥 New <24h" : t === "early" ? "⚡ Early <48h" : "Recent"}</button>
              ))}
            </div>
          </div>

          {/* Competition */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Competition</Label>
            <div className="flex gap-1.5">
              {["low", "medium", "high"].map((c) => (
                <button
                  key={c}
                  onClick={() => toggleArr("competition", c)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition-colors",
                    filters.competition.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Visa */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.visaFriendly}
              onChange={(e) => toggle("visaFriendly", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Visa Friendly only</span>
          </label>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs h-8" onClick={() => onChange(defaultFilters)}>
              <X className="w-3.5 h-3.5" />Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
