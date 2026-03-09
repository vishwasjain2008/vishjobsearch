import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CandidateProfile } from "@/types";

interface ResumeUploadProps {
  /** Called once with the filename AND the AI-parsed profile — single atomic update, no race condition */
  onComplete: (fileName: string, parsed?: Partial<CandidateProfile>) => void;
  uploaded: boolean;
  fileName?: string;
  userId?: string | null;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Strip the data URL prefix, return only the base64 content
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onComplete,
  uploaded,
  fileName,
  userId,
}) => {
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "parsing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    const validExts = [".pdf", ".docx"];
    const hasValidExt = validExts.some((e) => file.name.toLowerCase().endsWith(e));
    if (!hasValidExt) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }

    setErrorMsg("");
    setStage("uploading");

    try {
      // Upload to storage
      if (userId) {
        const path = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
        if (uploadErr) throw new Error(uploadErr.message);
      }

      // Extract text & call AI
      setStage("parsing");
      const resumeText = await extractTextFromFile(file);

      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/parse-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Parsing failed");
      }

      const { profile: parsed } = await res.json();
      setStage("done");

      // Single atomic callback — no race condition
      onComplete(file.name, parsed ?? undefined);

      toast({ title: "✅ Resume parsed!", description: "Your profile has been auto-filled from your resume." });
    } catch (e: any) {
      setStage("error");
      setErrorMsg(e.message ?? "Upload failed");
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isProcessing = stage === "uploading" || stage === "parsing";
  const isDone = uploaded || stage === "done";

  if (isDone && !isProcessing) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-score-high shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Resume uploaded & parsed</p>
          <p className="text-xs text-muted-foreground truncate">{fileName}</p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">AI Parsed ✓</Badge>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setStage("idle"); inputRef.current?.click(); }}>
          Replace
        </Button>
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">Upload failed</p>
          <p className="text-xs text-muted-foreground">{errorMsg}</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setStage("idle"); inputRef.current?.click(); }}>
          Try Again
        </Button>
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={cn(
        "rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-all",
        !isProcessing && "cursor-pointer",
        dragging ? "border-primary bg-accent/50" : "border-border hover:border-primary/50 hover:bg-muted/30",
        isProcessing && "pointer-events-none opacity-80"
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {isProcessing ? (
        <>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {stage === "uploading" ? "Uploading resume…" : "AI is parsing your resume…"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stage === "uploading" ? "Saving to secure storage" : "Extracting skills, experience & education"}
            </p>
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Upload className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Drop your resume here</p>
            <p className="text-xs text-muted-foreground mt-1">PDF or DOCX · up to 20MB</p>
            <p className="text-xs text-primary mt-1 font-medium">AI will auto-fill your profile</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <FileText className="w-3.5 h-3.5" />Browse File
          </Button>
        </>
      )}
    </div>
  );
};
