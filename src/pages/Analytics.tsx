import React from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockStats, mockApplications, mockJobs } from "@/data/mockData";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { BarChart3, TrendingUp, Target, Briefcase, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const weekData = [
  { day: "Mon", apps: 1, matches: 3 },
  { day: "Tue", apps: 2, matches: 5 },
  { day: "Wed", apps: 0, matches: 2 },
  { day: "Thu", apps: 3, matches: 7 },
  { day: "Fri", apps: 2, matches: 4 },
  { day: "Sat", apps: 1, matches: 3 },
  { day: "Sun", apps: 0, matches: 2 },
];

const Analytics: React.FC = () => {
  const maxApps = Math.max(...weekData.map((d) => d.apps));
  const maxMatches = Math.max(...weekData.map((d) => d.matches));

  const skillFreq = mockJobs.flatMap((j) => j.strongMatchSkills).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxFreq = Math.max(...topSkills.map(([, c]) => c));

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" subtitle="Track your job search performance" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Applications" value={mockStats.totalApplications} subtitle="All time" icon={Briefcase} trend={12} color="primary" />
          <StatsCard title="Interview Rate" value={`${mockStats.interviewRate}%`} subtitle="Interviews / apps" icon={TrendingUp} trend={5} color="success" />
          <StatsCard title="Avg Match Score" value={`${mockStats.avgMatchScore}`} subtitle="Across all jobs" icon={Target} color="primary" />
          <StatsCard title="This Week" value={mockStats.applicationsThisWeek} subtitle="Applications sent" icon={Clock} trend={-3} color="warning" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Weekly activity */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold">Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end gap-2 h-32">
                {weekData.map(({ day, apps, matches }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-24">
                      <div className="flex-1 rounded-t bg-primary/20 transition-all" style={{ height: `${maxApps > 0 ? (apps / maxApps) * 100 : 0}%` }} />
                      <div className="flex-1 rounded-t bg-success/30 transition-all" style={{ height: `${maxMatches > 0 ? (matches / maxMatches) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded bg-primary/30" />Applications
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded bg-success/30" />New Matches
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Application funnel */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold">Application Funnel</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {[
                { label: "Saved", count: 1, pct: 100, color: "bg-muted-foreground" },
                { label: "Applied", count: 24, pct: 85, color: "bg-primary" },
                { label: "Responses", count: 10, pct: 42, color: "bg-warning" },
                { label: "Interviews", count: 9, pct: 37, color: "bg-success" },
                { label: "Offers", count: 2, pct: 8, color: "bg-score-high" },
              ].map(({ label, count, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-muted-foreground shrink-0">{label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-xs font-semibold text-foreground text-right shrink-0">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top matching skills */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold">Your Most Valued Skills</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              {topSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-28 shrink-0 truncate">{skill}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / maxFreq) * 100}%` }} />
                  </div>
                  <span className="w-6 text-xs font-medium text-muted-foreground shrink-0">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top industries */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold">Jobs by Industry</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {mockStats.topIndustries.map(({ name, count }, i) => {
                const colors = ["bg-primary", "bg-success", "bg-warning", "bg-new-badge"];
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${colors[i % colors.length]}`} />
                    <span className="text-xs text-foreground flex-1">{name}</span>
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all`} style={{ width: `${(count / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
