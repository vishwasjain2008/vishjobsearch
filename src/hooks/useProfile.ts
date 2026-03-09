import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CandidateProfile } from "@/types";

const emptyProfile: CandidateProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
  location: "",
  currentTitle: "",
  summary: "",
  skills: [],
  tools: [],
  industries: [],
  experience: [],
  education: [],
  certifications: [],
  desiredTitles: [],
  preferredLocations: [],
  remotePreference: [],
  salaryMin: 0,
  salaryMax: 0,
  requiresVisaSponsorship: false,
  yearsOfExperience: 0,
  resumeUploaded: false,
  resumeFileName: undefined,
};

export function useProfile() {
  const [profile, setProfileState] = useState<CandidateProfile>(emptyProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);

      if (uid) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();

        if (data && mounted) {
          // remote_preference: stored as text in DB, migrate to array gracefully
          let remoteArr: CandidateProfile["remotePreference"] = [];
          if (data.remote_preference) {
            try {
              const parsed = JSON.parse(data.remote_preference);
              if (Array.isArray(parsed)) remoteArr = parsed;
              else remoteArr = [parsed as any];
            } catch {
              remoteArr = [data.remote_preference as any];
            }
          }

          setProfileState({
            id: data.id,
            name: data.name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            location: data.location ?? "",
            currentTitle: data.current_title ?? "",
            summary: data.summary ?? "",
            skills: data.skills ?? [],
            tools: data.tools ?? [],
            industries: data.industries ?? [],
            experience: (data.experience as any) ?? [],
            education: (data.education as any) ?? [],
            certifications: (data.certifications as any) ?? [],
            desiredTitles: data.desired_titles ?? [],
            preferredLocations: data.preferred_locations ?? [],
            remotePreference: remoteArr,
            salaryMin: data.salary_min ?? 0,
            salaryMax: data.salary_max ?? 0,
            requiresVisaSponsorship: data.requires_visa_sponsorship ?? false,
            yearsOfExperience: data.years_of_experience ?? 0,
            resumeUploaded: !!data.resume_file_name,
            resumeFileName: data.resume_file_name ?? undefined,
          });
        }
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const saveProfile = useCallback(async (p: CandidateProfile) => {
    setProfileState(p);
    if (!userId) return;
    await supabase.from("profiles").upsert({
      user_id: userId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      location: p.location,
      current_title: p.currentTitle,
      summary: p.summary,
      skills: p.skills,
      tools: p.tools,
      industries: p.industries,
      experience: p.experience as any,
      education: p.education as any,
      certifications: p.certifications as any,
      desired_titles: p.desiredTitles,
      preferred_locations: p.preferredLocations,
      // Store array as JSON string (DB column is text)
      remote_preference: JSON.stringify(p.remotePreference),
      salary_min: p.salaryMin,
      salary_max: p.salaryMax,
      requires_visa_sponsorship: p.requiresVisaSponsorship,
      years_of_experience: p.yearsOfExperience,
      resume_file_name: p.resumeFileName,
    } as any, { onConflict: "user_id" });
  }, [userId]);

  return { profile, setProfile: saveProfile, userId, loading };
}
