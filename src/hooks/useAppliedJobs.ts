/**
 * Persists the set of job IDs the user has marked "Applied" across sessions.
 * Jobs in this set are hidden from Job Discovery and sent to the App Tracker.
 */
import { useState, useCallback, useEffect } from "react";
import type { JobListing, JobApplication } from "@/types";

const STORAGE_KEY = "appliedJobIds";
const APPLICATIONS_KEY = "trackerApplications";

function loadAppliedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAppliedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function saveApplications(apps: JobApplication[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

export function useAppliedJobs() {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(loadAppliedIds);
  const [applications, setApplications] = useState<JobApplication[]>(loadApplications);

  // Keep storage in sync
  useEffect(() => { saveAppliedIds(appliedIds); }, [appliedIds]);
  useEffect(() => { saveApplications(applications); }, [applications]);

  const markApplied = useCallback((job: JobListing) => {
    setAppliedIds((prev) => {
      if (prev.has(job.id)) return prev;
      const next = new Set(prev);
      next.add(job.id);
      return next;
    });

    setApplications((prev) => {
      if (prev.some((a) => a.jobId === job.id)) return prev;
      const newApp: JobApplication = {
        id: `app-${job.id}-${Date.now()}`,
        jobId: job.id,
        job,
        status: "applied",
        appliedDate: new Date().toISOString().split("T")[0],
        notes: [],
        coverLetterGenerated: false,
      };
      return [newApp, ...prev];
    });
  }, []);

  const unmarkApplied = useCallback((jobId: string) => {
    setAppliedIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
    setApplications((prev) => prev.filter((a) => a.jobId !== jobId));
  }, []);

  const updateStatus = useCallback((id: string, status: JobApplication["status"]) => {
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  }, []);

  return { appliedIds, applications, markApplied, unmarkApplied, updateStatus };
}
