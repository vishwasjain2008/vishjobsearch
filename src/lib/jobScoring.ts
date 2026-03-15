import type { JobListing, CandidateProfile } from "@/types";
import { isKnownH1BSponsor } from "@/lib/h1bSponsors";

/**
 * Re-scores a job against the user's actual profile.
 * Returns updated matchScore, priorityScore, strongMatchSkills,
 * partialMatchSkills, missingSkills, and competitionLevel.
 */
export function scoreJobAgainstProfile(
  job: JobListing,
  profile: CandidateProfile
): Partial<JobListing> {
  const hasProfile =
    profile.skills.length > 0 ||
    profile.tools.length > 0 ||
    profile.yearsOfExperience > 0;

  // Fall back to original scores if no profile data yet
  if (!hasProfile) return {};

  const profileKeywords = [
    ...profile.skills,
    ...profile.tools,
    ...profile.industries,
    ...profile.desiredTitles,
  ].map((k) => k.toLowerCase());

  const jobText =
    `${job.title} ${job.description} ${job.requiredSkills.join(" ")}`.toLowerCase();

  // Skills breakdown
  const allJobSkills = job.requiredSkills.length
    ? job.requiredSkills
    : ["Product Strategy", "Roadmap Planning", "Agile"];

  const strongMatchSkills: string[] = [];
  const partialMatchSkills: string[] = [];
  const missingSkills: string[] = [];

  allJobSkills.forEach((skill) => {
    const s = skill.toLowerCase();
    const exactMatch = profileKeywords.some((k) => k === s || k.includes(s) || s.includes(k));
    const partialMatch =
      !exactMatch &&
      profileKeywords.some((k) => {
        const words = k.split(/\s+/);
        return words.some((w) => w.length > 3 && s.includes(w));
      });

    if (exactMatch) strongMatchSkills.push(skill);
    else if (partialMatch) partialMatchSkills.push(skill);
    else missingSkills.push(skill);
  });

  // Also check profile skills against job description
  profile.skills.slice(0, 10).forEach((skill) => {
    if (jobText.includes(skill.toLowerCase()) && !strongMatchSkills.includes(skill)) {
      strongMatchSkills.push(skill);
    }
  });

  // Base match score from skill overlap
  const totalSkills = Math.max(allJobSkills.length, 1);
  const skillScore = Math.round(
    (strongMatchSkills.length / totalSkills) * 50 +
    (partialMatchSkills.length / totalSkills) * 15
  );
  let matchScore = Math.min(95, 50 + skillScore);

  // YOE seniority alignment bonus
  const yoe = profile.yearsOfExperience;
  const seniorityMatch =
    (yoe >= 7 && /director|vp|head/i.test(job.seniority)) ||
    (yoe >= 4 && /senior|principal/i.test(job.seniority)) ||
    (yoe >= 2 && /mid|associate/i.test(job.seniority)) ||
    (yoe >= 1 && job.seniority === "Mid-Senior");
  if (seniorityMatch) matchScore = Math.min(95, matchScore + 8);

  // Salary alignment bonus
  if (profile.salaryMin > 0 && job.salaryMin && job.salaryMin >= profile.salaryMin) {
    matchScore = Math.min(95, matchScore + 5);
  }

  // Priority score: match + context boosts — H1B sponsors get the biggest lift
  const knownSponsor = isKnownH1BSponsor(job.company);
  const visaBoost = knownSponsor ? 30 : job.visaStatus === "friendly" ? 18 : 0;
  const remoteBoost =
    job.isRemote && profile.remotePreference.includes("remote") ? 8 : 0;
  const industryBoost =
    profile.industries.some((i) =>
      job.industry.toLowerCase().includes(i.toLowerCase())
    )
      ? 5
      : 0;

  const priorityScore = Math.min(
    98,
    matchScore + visaBoost + remoteBoost + industryBoost
  );

  const competitionLevel: JobListing["competitionLevel"] =
    matchScore >= 80 ? "low" : matchScore >= 65 ? "medium" : "high";

  return {
    matchScore,
    priorityScore,
    strongMatchSkills: strongMatchSkills.slice(0, 6),
    partialMatchSkills: partialMatchSkills.slice(0, 4),
    missingSkills: missingSkills.slice(0, 4),
    competitionLevel,
  };
}

/**
 * Deduplicates jobs by normalized company + title.
 * Keeps the entry with the highest priorityScore.
 */
export function deduplicateJobs(jobs: JobListing[]): JobListing[] {
  const seen = new Map<string, JobListing>();

  for (const job of jobs) {
    const key = normalizeForDedup(job.company) + "||" + normalizeForDedup(job.title);
    const existing = seen.get(key);
    if (!existing || job.priorityScore > existing.priorityScore) {
      seen.set(key, job);
    }
  }

  return Array.from(seen.values());
}

function normalizeForDedup(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b(senior|sr|junior|jr|principal|staff|lead|associate|mid|head of)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
