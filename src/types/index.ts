export interface WorkExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | "Present";
  description: string[];
  skills: string[];
}

export interface Education {
  degree: string;
  school: string;
  year: string;
  field: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  summary: string;
  skills: string[];
  tools: string[];
  industries: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  desiredTitles: string[];
  preferredLocations: string[];
  remotePreference: ("remote" | "hybrid" | "onsite" | "flexible")[];
  salaryMin: number;
  salaryMax: number;
  requiresVisaSponsorship: boolean;
  yearsOfExperience: number;
  resumeUploaded: boolean;
  resumeFileName?: string;
}

export type VisaStatus = "friendly" | "unknown" | "rarely";
export type JobTimingTag = "new" | "early" | "recent" | "old";
export type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  isRemote: boolean;
  isHybrid: boolean;
  description: string;
  requiredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  postedDate: string;
  applyLink: string;
  source: string;
  matchScore: number;
  priorityScore: number;
  competitionLevel: "low" | "medium" | "high";
  visaStatus: VisaStatus;
  timingTag: JobTimingTag;
  strongMatchSkills: string[];
  partialMatchSkills: string[];
  missingSkills: string[];
  industry: string;
  seniority: string;
}

export interface ApplicationNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job: JobListing;
  status: ApplicationStatus;
  appliedDate?: string;
  interviewDate?: string;
  followUpDate?: string;
  notes: ApplicationNote[];
  resumeVersion?: string;
  coverLetterGenerated: boolean;
}

export interface SkillGap {
  strong: string[];
  partial: string[];
  missing: string[];
}

export interface InterviewQuestion {
  question: string;
  suggestedAnswer: string;
  category: string;
}

export interface ResumeVersion {
  id: string;
  name: string;
  createdAt: string;
  targetJob?: string;
  content: string;
}

export interface DashboardStats {
  totalApplications: number;
  interviewRate: number;
  avgMatchScore: number;
  topIndustries: { name: string; count: number }[];
  applicationsThisWeek: number;
  newJobsToday: number;
  highMatchJobs: number;
}
