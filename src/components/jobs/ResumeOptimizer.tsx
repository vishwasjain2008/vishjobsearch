import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CandidateProfile, JobListing } from "@/types";

interface ResumeOptimizerProps {
  job: JobListing;
  profile: CandidateProfile;
}

export const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({ job, profile }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const resp = await fetch(`${supabaseUrl}/functions/v1/optimize-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({ profile, job, type: "resume" }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json();
        if (resp.status === 429) toast({ title: "Rate limited", description: err.error, variant: "destructive" });
        else if (resp.status === 402) toast({ title: "Credits needed", description: err.error, variant: "destructive" });
        else throw new Error(err.error ?? "Generation failed");
        setLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const chunk = JSON.parse(json)?.choices?.[0]?.delta?.content ?? "";
            if (chunk) { acc += chunk; setContent(acc); }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [job, profile, toast]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-3">
      <Button onClick={generate} disabled={loading} size="sm" className="w-full gap-2">
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5" />{content ? "Regenerate" : "Generate AI Resume Optimization"}</>
        )}
      </Button>

      {content ? (
        <div className="relative rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Tailored for {job.company}</span>
              <Badge variant="secondary" className="text-xs">AI Generated</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={copyToClipboard}>
              {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
            </Button>
          </div>
          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin font-mono">
            {content}
            {loading && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />}
          </div>
        </div>
      ) : !loading && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Click generate to get AI-tailored resume content optimized for {job.title} at {job.company}
        </p>
      )}
    </div>
  );
};
