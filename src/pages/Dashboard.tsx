import React from "react";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { JobCard } from "@/components/jobs/JobCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockJobs, mockStats, mockApplications } from "@/data/mockData";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import type { JobListing } from "@/types";
import {
  Briefcase, TrendingUp, BarChart3, Zap, Clock, Star,
  CheckCircle2, AlertCircle, Building2, ArrowRight, Sparkles,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const firstName = profile.name?.split(" ")[0] || "there";
  const initials = profile.name
    ? profile.name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("")
    : "?";

  const topJobs = [...mockJobs].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);
  const earlyJobs = mockJobs.filter((j) => j.timingTag === "new" || j.timingTag === "early");
  const recentApps = mockApplications.slice(0, 4);

  const statusColors: Record<string, string> = {
    saved: "bg-muted text-muted-foreground",
    applied: "bg-accent text-accent-foreground",
    interview: "bg-warning/10 text-score-medium",
    offer: "bg-success/10 text-score-high",
    rejected: "bg-destructive/10 text-score-low",
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle={`Welcome back, ${firstName}! Here's your job search overview.`} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="New Jobs Today" value={mockStats.newJobsToday} subtitle="Matching your profile" icon={Briefcase} trend={15} color="primary" />
          <StatsCard title="High Match Jobs" value={mockStats.highMatchJobs} subtitle="Score ≥ 80%" icon={TrendingUp} trend={8} color="success" />
          <StatsCard title="Avg Match Score" value={`${mockStats.avgMatchScore}%`} subtitle="Across all jobs" icon={BarChart3} color="primary" />
          <StatsCard title="Interview Rate" value={`${mockStats.interviewRate}%`} subtitle="Of applications" icon={Zap} trend={5} color="warning" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Top priority jobs */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">🎯 Top Priority PM Jobs</h2>
                <p className="text-xs text-muted-foreground">Ranked by Apply Priority Score</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/jobs")}>
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-3">
              {topJobs.map((job) => (
                <JobCard key={job.id} job={job} onSelect={() => navigate("/jobs")} compact />
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Profile summary */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-bold">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{profile.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{profile.currentTitle || "Product Manager"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted p-2.5 text-center">
                    <p className="text-lg font-black text-foreground">{profile.yearsOfExperience || "—"}</p>
                    <p className="text-xs text-muted-foreground">Years Exp.</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5 text-center">
                    <p className="text-lg font-black text-foreground">{profile.skills.length || "—"}</p>
                    <p className="text-xs text-muted-foreground">Skills</p>
                  </div>
                </div>
                {profile.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Top Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => navigate("/profile")}>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Early opportunities */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <span>⚡ Early Opportunities</span>
                  <Badge className="bg-new-badge text-white border-0 text-xs">{earlyJobs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {earlyJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/jobs")}>
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <span className={`text-xs font-bold ${job.matchScore >= 80 ? "text-score-high" : "text-score-medium"}`}>
                      {job.matchScore}%
                    </span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs h-8 gap-1.5" onClick={() => navigate("/jobs")}>
                  View all early jobs <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Application tracker summary */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Recent Applications</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={() => navigate("/tracker")}>
                  Kanban view <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {recentApps.map((app) => (
                  <div key={app.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{app.job.title}</p>
                      <p className="text-xs text-muted-foreground">{app.job.company}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top industries */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold">Top Industries for Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {mockStats.topIndustries.map(({ name, count }, i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="text-muted-foreground">{count} jobs</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs h-8 gap-1.5 mt-2" onClick={() => navigate("/analytics")}>
                View analytics <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
