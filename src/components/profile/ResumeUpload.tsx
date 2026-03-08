import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeUploadProps {
  onUpload: (fileName: string) => void;
  uploaded: boolean;
  fileName?: string;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUpload, uploaded, fileName }) => {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type) && !file.name.endsWith(".docx") && !file.name.endsWith(".pdf")) {
      return;
    }
    setParsing(true);
    setTimeout(() => { setParsing(false); onUpload(file.name); }, 2500);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (uploaded && !parsing) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-score-high shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Resume uploaded</p>
          <p className="text-xs text-muted-foreground truncate">{fileName}</p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">Parsed ✓</Badge>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => inputRef.current?.click()}>
          Replace
        </Button>
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all",
        dragging ? "border-primary bg-accent/50" : "border-border hover:border-primary/50 hover:bg-muted/30",
        parsing && "pointer-events-none"
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {parsing ? (
        <>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Parsing your resume…</p>
            <p className="text-xs text-muted-foreground mt-1">Extracting skills, experience & education</p>
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
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <FileText className="w-3.5 h-3.5" />Browse File
          </Button>
        </>
      )}
    </div>
  );
};
