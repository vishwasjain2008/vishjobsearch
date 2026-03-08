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

    const { resumeText } = await req.json();
    if (!resumeText) throw new Error("resumeText is required");

    const systemPrompt = `You are an expert resume parser. Extract structured information from resume text and return it as valid JSON only (no markdown, no code blocks, just raw JSON).`;

    const userPrompt = `Parse this resume and extract all information into this exact JSON structure:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state or country",
  "currentTitle": "most recent job title",
  "summary": "professional summary or objective (2-4 sentences)",
  "yearsOfExperience": number,
  "skills": ["array", "of", "technical", "skills"],
  "tools": ["array", "of", "tools", "and", "software"],
  "industries": ["array", "of", "industries", "worked", "in"],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "startDate": "Mon YYYY",
      "endDate": "Mon YYYY or Present",
      "description": ["bullet point 1", "bullet point 2"],
      "skills": ["skills", "used"]
    }
  ],
  "education": [
    {
      "degree": "B.S. or M.S. etc",
      "field": "field of study",
      "school": "school name",
      "year": "graduation year"
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuing organization",
      "year": "year obtained"
    }
  ]
}

Resume text:
${resumeText}

Return ONLY the JSON object, nothing else.`;

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
        stream: false,
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

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "";

    // Clean up any accidental markdown code fences
    const cleaned = rawContent.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({ profile: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
