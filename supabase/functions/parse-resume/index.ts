import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractJson(raw: string): unknown {
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/[{\[]/);
  const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || last === -1) throw new Error("No JSON found in AI response");
  cleaned = cleaned.substring(start, last + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { fileBase64, mimeType } = await req.json();
    if (!fileBase64) throw new Error("fileBase64 is required");

    const prompt = `You are an expert resume parser. Extract ALL information from this resume document and return it as valid JSON only (no markdown, no code blocks, just raw JSON).

Parse the resume and extract all information into this exact JSON structure:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state or country",
  "currentTitle": "most recent job title",
  "summary": "professional summary (2-4 sentences describing the person's background)",
  "yearsOfExperience": <number>,
  "skills": ["array of skills listed or demonstrated"],
  "tools": ["array of tools and software used"],
  "industries": ["array of industries worked in"],
  "experience": [
    {
      "title": "exact job title",
      "company": "exact company name",
      "startDate": "Mon YYYY",
      "endDate": "Mon YYYY or Present",
      "description": ["bullet point 1", "bullet point 2", "bullet point 3"],
      "skills": ["skills used in this role"]
    }
  ],
  "education": [
    {
      "degree": "e.g. B.S. or M.B.A.",
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

IMPORTANT: Extract the EXACT information from the resume. Do not invent or assume any details. Return ONLY the JSON object, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType ?? "application/pdf"};base64,${fileBase64}`,
                },
              },
            ],
          },
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
    console.log("AI raw response length:", rawContent.length);

    const parsed = extractJson(rawContent);

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
