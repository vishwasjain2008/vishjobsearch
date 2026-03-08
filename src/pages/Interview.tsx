import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockJobs, mockProfile } from "@/data/mockData";
import { BookOpen, MessageSquare, Target, ChevronDown, ChevronUp, Sparkles, Brain } from "lucide-react";

const interviewData: Record<string, { question: string; category: string; answer: string }[]> = {
  j1: [
    { question: "How would you approach analyzing Google Search quality metrics at scale?", category: "Technical", answer: "Based on your BigQuery and Python experience, discuss distributed processing, defining quality KPIs, and iterating with product teams." },
    { question: "Tell me about a time you influenced a product decision using data.", category: "Behavioral", answer: "Use the TechCorp revenue forecasting model as an example — $X impact, stakeholder communication, and cross-team influence." },
    { question: "Walk me through your A/B testing methodology.", category: "Technical", answer: "Describe hypothesis formation, sample size calculation, significance thresholds, and how you communicated results at GrowthStartup." },
    { question: "How do you ensure your dashboards are adopted by non-technical users?", category: "Communication", answer: "Highlight your self-service dashboard that served 200+ stakeholders — focus on design choices and training approach." },
    { question: "What metrics would you use to measure Search quality?", category: "Product", answer: "CTR, NDCG, session quality, query reformulations, zero-result rates — tie back to your analytics experience." },
  ],
};

const Interview: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = useState(mockJobs[0].id);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const selectedJob = mockJobs.find((j) => j.id === selectedJobId) || mockJobs[0];
  const questions = interviewData[selectedJobId] || interviewData["j1"];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  const catColors: Record<string, string> = {
    Technical: "bg-accent text-accent-foreground",
    Behavioral: "bg-warning/10 text-score-medium",
    Communication: "bg-success/10 text-score-high",
    Product: "bg-new-badge/10 text-new-badge",
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Interview Preparation" subtitle="AI-generated questions and answers based on your profile" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* Job selector */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-bold">Select Job to Prepare For</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {mockJobs.slice(0, 5).map((job) => (
                <button
                  key={job.id}
                  onClick={() => { setSelectedJobId(job.id); setGenerated(false); setExpandedQ(null); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${selectedJobId === job.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
                >
                  <p className="font-semibold">{job.title}</p>
                  <p className={`mt-0.5 ${selectedJobId === job.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{job.company}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Interview Questions</h2>
                <p className="text-xs text-muted-foreground">{selectedJob.title} at {selectedJob.company}</p>
              </div>
              <Button size="sm" className="gap-2 text-xs h-8" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" />Regenerate</>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              {questions.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                  <button
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${catColors[item.category] || "bg-muted text-muted-foreground"}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.question}</p>
                    </div>
                    {expandedQ === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                  </button>
                  {expandedQ === i && (
                    <div className="px-4 pb-4 pt-0 border-t border-border">
                      <div className="flex items-center gap-2 mb-2 mt-3">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">Suggested Answer (based on your resume)</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Study topics */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />Key Topics to Study
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {selectedJob.requiredSkills.slice(0, 6).map((skill) => (
                  <div key={skill} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="text-sm">{skill}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {[
                  "Research the company's latest data initiatives",
                  "Prepare 3 STAR-format behavioral stories",
                  "Know your SQL optimization techniques cold",
                  "Practice talking through your TechCorp dashboard project",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">→</span>{tip}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
