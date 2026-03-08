import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { profile, job, type } = await req.json();
    if (!profile || !job) throw new Error("profile and job are required");

    const isResume = type !== "cover-letter";

    const systemPrompt = isResume
      ? `You are an expert resume writer and ATS optimization specialist. You tailor resumes to specific job descriptions to maximize interview chances.`
      : `You are an expert cover letter writer. You craft compelling, personalized cover letters that get candidates noticed.`;

    const profileSummary = `
Candidate: ${profile.name}
Current Title: ${profile.currentTitle}
Summary: ${profile.summary}
Skills: ${profile.skills?.join(", ")}
Tools: ${profile.tools?.join(", ")}
Experience: ${JSON.stringify(profile.experience?.slice(0, 3))}
Education: ${JSON.stringify(profile.education)}
Years of Experience: ${profile.yearsOfExperience}
    `.trim();

    const jobSummary = `
Job Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.requiredSkills?.join(", ")}
Description: ${job.description}
Seniority: ${job.seniority}
Industry: ${job.industry}
    `.trim();

    const userPrompt = isResume
      ? `Optimize this candidate's resume for the following job listing. 

CANDIDATE PROFILE:
${profileSummary}

TARGET JOB:
${jobSummary}

Please provide:
1. A tailored professional summary (2-3 sentences) that mirrors keywords from the job description
2. Optimized bullet points for the top 2 most relevant work experiences (3-4 bullets each), rephrased to emphasize skills the job needs
3. A prioritized skills section with the most relevant skills first
4. 3-5 specific ATS keywords from the job description they should weave in
5. One sentence on what to highlight in an interview

Format your response with clear sections using headers like "## Tailored Summary", "## Optimized Experience", "## Skills", "## ATS Keywords", "## Interview Tip".`
      : `Write a compelling cover letter for this candidate applying to this job.

CANDIDATE PROFILE:
${profileSummary}

TARGET JOB:
${jobSummary}

Write a professional, 3-paragraph cover letter (opening hook, value proposition with 2-3 specific achievements, closing with call to action). 
Keep it under 300 words. Use the candidate's real experience. Address it to the Hiring Manager at ${job.company}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${t}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("optimize-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
