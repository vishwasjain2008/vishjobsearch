import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { JobListing, CandidateProfile } from "@/types";
import { ResumeOptimizer } from "@/components/jobs/ResumeOptimizer";
import {
  X, MapPin, DollarSign, Clock, Wifi, Building2, ExternalLink,
  MessageSquare, BookOpen, ShieldCheck, ShieldQuestion, ShieldX,
  CheckCircle2, AlertCircle, XCircle, Sparkles, Star,
} from "lucide-react";

interface JobDetailProps {
  job: JobListing | null;
  onClose: () => void;
}

const interviewQuestions = [
  { q: "Walk me through a data analysis project you're most proud of.", cat: "Behavioral" },
  { q: "How would you approach building a KPI dashboard from scratch?", cat: "Technical" },
  { q: "Describe a time you influenced a business decision with data.", cat: "Behavioral" },
  { q: "How do you handle missing or dirty data?", cat: "Technical" },
  { q: "What metrics would you track to measure the success of a new feature?", cat: "Product" },
];

export const JobDetail: React.FC<JobDetailProps> = ({ job, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  if (!job) return null;

  const salary = job.salaryMin && job.salaryMax
    ? `$${(job.salaryMin / 1000).toFixed(0)}k – $${(job.salaryMax / 1000).toFixed(0)}k`
    : "Not disclosed";

  const hoursAgo = Math.round((Date.now() - new Date(job.postedDate).getTime()) / 36e5);
  const timeLabel = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => { setOptimizing(false); setOptimized(true); }, 2200);
  };

  const visaMap = {
    friendly: { icon: ShieldCheck, color: "text-visa-friendly", label: "Visa Friendly", desc: "This company has filed H-1B petitions in the past 3 years." },
    unknown: { icon: ShieldQuestion, color: "text-visa-unknown", label: "Unknown Sponsorship", desc: "No H-1B data available for this company." },
    rarely: { icon: ShieldX, color: "text-visa-rarely", label: "Rarely Sponsors", desc: "This company has limited H-1B history." },
  };
  const visa = visaMap[job.visaStatus];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border">
          <Building2 className="w-6 h-6 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground leading-tight">{job.title}</h2>
          <p className="text-sm text-muted-foreground">{job.company} · {job.source}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{job.location}
            </span>
            {job.isRemote && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                <Wifi className="w-3 h-3" />Remote OK
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />{salary}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />Posted {timeLabel}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
        {[
          { label: "Match Score", value: job.matchScore, sub: "Resume vs JD" },
          { label: "Priority Score", value: job.priorityScore, sub: "Apply first" },
        ].map(({ label, value, sub }) => (
          <div key={label} className={cn("rounded-xl p-3 text-center border",
            value >= 80 ? "bg-success/10 border-success/20" :
            value >= 65 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20"
          )}>
            <p className={cn("text-3xl font-black",
              value >= 80 ? "text-score-high" : value >= 65 ? "text-score-medium" : "text-score-low"
            )}>{value}</p>
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 grid grid-cols-4 h-8">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
          <TabsTrigger value="resume" className="text-xs">Resume AI</TabsTrigger>
          <TabsTrigger value="prep" className="text-xs">Prep</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-4 space-y-4 mt-0">
            <div>
              <h4 className="text-sm font-semibold mb-2">Job Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">{s}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <visa.icon className={cn("w-4 h-4", visa.color)} />
                <span className={cn("text-sm font-medium", visa.color)}>{visa.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{visa.desc}</p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={() => window.open(job.applyLink)}>
                <ExternalLink className="w-4 h-4" />Apply Now
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Star className="w-4 h-4" />Save Job
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="p-4 space-y-4 mt-0">
            {[
              { title: "Strong Match", skills: job.strongMatchSkills, icon: CheckCircle2, color: "text-score-high", bg: "bg-success/10" },
              { title: "Partial Match", skills: job.partialMatchSkills, icon: AlertCircle, color: "text-score-medium", bg: "bg-warning/10" },
              { title: "Missing Skills", skills: job.missingSkills, icon: XCircle, color: "text-score-low", bg: "bg-destructive/10" },
            ].map(({ title, skills, icon: Icon, color, bg }) => (
              <div key={title}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", color)} />
                  <h4 className="text-sm font-semibold">{title}</h4>
                  <Badge variant="secondary" className="text-xs">{skills.length}</Badge>
                </div>
                {skills.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className={cn("px-2 py-0.5 rounded text-xs font-medium", bg, color)}>{s}</span>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">None</p>}
              </div>
            ))}
            {job.missingSkills.length > 0 && (
              <div className="rounded-xl bg-accent border border-border p-3">
                <p className="text-xs font-semibold text-foreground mb-1">💡 Improvement Tips</p>
                <ul className="space-y-1">
                  {job.missingSkills.map((s) => (
                    <li key={s} className="text-xs text-muted-foreground">• Take a {s} course on Coursera or Udemy</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resume" className="p-4 space-y-4 mt-0">
            <div className="rounded-xl border border-border p-4 bg-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">AI Resume Optimizer</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Automatically tailor your resume for this specific role. Inserts relevant keywords, improves ATS compatibility for Greenhouse, Lever & Workday.
              </p>
              {!optimized ? (
                <Button className="w-full gap-2" onClick={handleOptimize} disabled={optimizing}>
                  {optimizing ? (
                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Optimizing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Optimize Resume for This Job</>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-score-high">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Resume optimized!</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Download className="w-3.5 h-3.5" />PDF
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Download className="w-3.5 h-3.5" />DOCX
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border p-4 bg-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Cover Letter Generator</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Generate a personalized cover letter using your resume and this job description.</p>
              <Button variant="outline" className="w-full gap-2">
                <MessageSquare className="w-4 h-4" />Generate Cover Letter
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="prep" className="p-4 space-y-4 mt-0">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Likely Interview Questions</h4>
            </div>
            <div className="space-y-3">
              {interviewQuestions.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="text-xs">{item.cat}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.q}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Based on your experience at TechCorp and GrowthStartup, highlight your {item.cat === "Technical" ? "technical skills and methodologies" : "impact and results"}.
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
