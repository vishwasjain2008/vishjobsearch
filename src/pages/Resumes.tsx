import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Download, Star, Edit3, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const Resumes: React.FC = () => {
  const { profile } = useProfile();
  const [selected, setSelected] = useState("r1");

  const firstName = profile.name?.split(" ")[0] || "Your";

  const resumeVersions = [
    { id: "r1", name: "Base Resume", createdAt: "2024-01-01", targetJob: null, tags: ["Base"] },
    { id: "r2", name: "Senior PM – Tech Focus", createdAt: "2024-01-15", targetJob: "Senior Product Manager at Google", tags: ["Tailored", "Big Tech"] },
    { id: "r3", name: "Growth PM Version", createdAt: "2024-01-20", targetJob: "Senior PM – Growth at Airbnb", tags: ["Tailored", "Growth"] },
    { id: "r4", name: "FinTech PM Version", createdAt: "2024-01-22", targetJob: "Senior PM – Payments at Stripe", tags: ["Tailored", "FinTech"] },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Resume Manager" subtitle="Manage and compare all your resume versions" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{resumeVersions.length} versions saved</p>
          <Button size="sm" className="gap-2 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />New Version
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resumeVersions.map((rv) => (
            <div
              key={rv.id}
              onClick={() => setSelected(rv.id)}
              className={`group bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selected === rv.id ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected === rv.id ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{rv.name}</p>
                  <p className="text-xs text-muted-foreground">{rv.createdAt}</p>
                  {rv.targetJob && <p className="text-xs text-muted-foreground mt-0.5 truncate">{rv.targetJob}</p>}
                </div>
                {rv.id === "r1" && <Star className="w-4 h-4 text-warning shrink-0" />}
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {rv.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>

              <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1">
                  <Download className="w-3 h-3" />PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1">
                  <Download className="w-3 h-3" />DOCX
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add new */}
          <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors min-h-[140px]">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">AI-Tailored Resume</p>
              <p className="text-xs text-muted-foreground mt-0.5">Select a PM job to auto-generate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resumes;
