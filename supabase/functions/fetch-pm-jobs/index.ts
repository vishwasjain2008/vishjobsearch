import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

interface JobResult {
  id: string;
  title: string;
  company: string;
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
  visaStatus: "friendly" | "unknown" | "rarely";
  timingTag: "new" | "early" | "recent" | "old";
  strongMatchSkills: string[];
  partialMatchSkills: string[];
  missingSkills: string[];
  industry: string;
  seniority: string;
}

// Strip ATS platform suffixes from company/title strings
function cleanATSName(name: string): string {
  return name
    .replace(/\s*[-–|]\s*(Greenhouse|Lever|Ashby|Workday|iCIMS|SmartRecruiters)\s*$/i, "")
    .replace(/^(Greenhouse|Lever|Ashby|Workday|iCIMS|SmartRecruiters)\s*[-–|]\s*/i, "")
    .replace(/^Job Application for\s+/i, "")
    .trim();
}

// Derive structured fields from a search result
function parseJobFromResult(result: FirecrawlSearchResult, idx: number): JobResult | null {
  const { url, title: rawTitle, description } = result;
  if (!url || !rawTitle || !description) return null;

  // Extract company from title patterns like "Senior PM at Stripe" or "Stripe | Senior PM"
  let title = rawTitle;
  let company = "Unknown";

  const atMatch = rawTitle.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|–-].*)?$/i);
  const pipeMatch = rawTitle.match(/^(.+?)\s*[|–-]\s*(.+?)\s*(?:job|career|role)?$/i);

  // Extract company from ATS URL path: jobs.lever.co/company/... or job-boards.greenhouse.io/company/...
  const atsCompanyMatch = url.match(/(?:jobs\.lever\.co|job-boards(?:\.eu)?\.greenhouse\.io|jobs\.ashbyhq\.com|job-boards\.eu\.greenhouse\.io)\/([a-z0-9_-]+)\//i);

  if (atMatch) {
    title = cleanATSName(atMatch[1].trim());
    company = cleanATSName(atMatch[2].trim());
  } else if (pipeMatch) {
    const pmKeywords = /product\s*manager|PM|head of product|director of product/i;
    if (pmKeywords.test(pipeMatch[1])) {
      title = cleanATSName(pipeMatch[1].trim());
      company = cleanATSName(pipeMatch[2].trim());
    } else {
      company = cleanATSName(pipeMatch[1].trim());
      title = cleanATSName(pipeMatch[2].trim());
    }
  } else if (atsCompanyMatch) {
    company = atsCompanyMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Override with URL slug if company resolved to an ATS platform name or is unknown
  const atsPlatformNames = /^(greenhouse|lever|ashby|workday|icims|smartrecruiters|unknown)$/i;
  if ((company === "Unknown" || company === "" || atsPlatformNames.test(company)) && atsCompanyMatch) {
    company = atsCompanyMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Clean title of ATS suffixes too
  title = cleanATSName(title);

  // Skip if doesn't look like a PM role
  const pmRegex = /product\s*manager|PM\b|head of product|vp.*product|director.*product|principal.*product/i;
  if (!pmRegex.test(title) && !pmRegex.test(rawTitle)) return null;

  // Determine remote/hybrid
  const text = `${description} ${rawTitle}`.toLowerCase();
  const isRemote = /\bremote\b/.test(text);
  const isHybrid = /\bhybrid\b/.test(text);

  // Extract location
  const locationMatch = description.match(
    /\b(Remote|New York|San Francisco|Seattle|Austin|Chicago|Boston|Los Angeles|London|Toronto|Vancouver|Atlanta|Denver|Miami|Palo Alto|Sunnyvale|Mountain View|Menlo Park)[,\s]*(NY|CA|WA|TX|IL|MA|UK|ON|BC|GA|CO|FL)?\b/i
  );
  const location = isRemote ? "Remote" : locationMatch ? locationMatch[0].trim() : "United States";

  // Extract salary
  const salaryMatch = description.match(/\$(\d{2,3})[Kk]?\s*[-–to]+\s*\$?(\d{2,3})[Kk]?/);
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  if (salaryMatch) {
    const a = parseInt(salaryMatch[1]);
    const b = parseInt(salaryMatch[2]);
    salaryMin = a < 500 ? a * 1000 : a;
    salaryMax = b < 500 ? b * 1000 : b;
  }

  // Skills extraction — common PM skills
  const pmSkills = [
    "Product Strategy", "Roadmap Planning", "Agile", "Scrum", "User Research",
    "A/B Testing", "SQL", "Data Analysis", "Stakeholder Management", "Go-to-Market",
    "OKRs", "KPIs", "Figma", "Jira", "Confluence", "Mixpanel", "Amplitude",
    "API Products", "B2B SaaS", "Consumer Products", "Growth", "Mobile", "AI/ML",
    "FinTech", "E-commerce", "Enterprise", "Platform", "Cross-functional",
    "Python", "Analytics", "Experimentation", "Discovery", "Prioritization",
  ];
  const combinedText = `${description} ${rawTitle}`.toLowerCase();
  const strongMatchSkills = pmSkills.filter((s) => combinedText.includes(s.toLowerCase())).slice(0, 5);

  // Seniority
  const lowerTitle = title.toLowerCase();
  const seniority =
    /director|vp\b|vice president|head of/.test(lowerTitle) ? "Director" :
    /principal|staff/.test(lowerTitle) ? "Principal" :
    /senior|sr\./.test(lowerTitle) ? "Senior" :
    /junior|jr\./.test(lowerTitle) ? "Junior" : "Mid-Senior";

  // Timing tag based on URL freshness heuristics
  const timingTag: JobResult["timingTag"] = idx < 5 ? "new" : idx < 15 ? "early" : "recent";

  // Match/priority scores (heuristic based on skills found)
  const matchScore = Math.min(95, 65 + strongMatchSkills.length * 5);
  const priorityScore = Math.min(95, 60 + strongMatchSkills.length * 5 + (isRemote ? 5 : 0));

  // Industry guess
  const industryMap: [RegExp, string][] = [
    [/fintech|payment|bank|finance|crypto/i, "FinTech"],
    [/health|medical|pharma|clinical/i, "HealthTech"],
    [/e-commerce|retail|marketplace|shop/i, "E-commerce"],
    [/saas|enterprise|b2b|platform/i, "SaaS"],
    [/ai|ml|machine learning|data/i, "Technology"],
    [/media|entertainment|gaming|content/i, "Media"],
  ];
  const industry = industryMap.find(([re]) => re.test(combinedText))?.[1] ?? "Technology";

  // Source from URL — show the ATS platform name
  const sourceMap: [RegExp, string][] = [
    [/greenhouse\.io/i, "Greenhouse"],
    [/lever\.co/i, "Lever"],
    [/ashbyhq\.com/i, "Ashby"],
    [/workday\.com/i, "Workday"],
    [/icims\.com/i, "iCIMS"],
    [/smartrecruiters\.com/i, "SmartRecruiters"],
    [/indeed\.com/i, "Indeed"],
    [/glassdoor\.com/i, "Glassdoor"],
  ];
  const source = sourceMap.find(([re]) => re.test(url))?.[1] ?? "Company Website";

  return {
    id: `real-${idx}-${Date.now()}`,
    title: title.trim(),
    company: company.trim(),
    location,
    isRemote,
    isHybrid,
    description: description.slice(0, 400),
    requiredSkills: strongMatchSkills.length ? strongMatchSkills : ["Product Strategy", "Roadmap Planning", "Agile"],
    salaryMin,
    salaryMax,
    postedDate: new Date(Date.now() - idx * 3 * 60 * 60 * 1000).toISOString(),
    applyLink: url,
    source,
    matchScore,
    priorityScore,
    competitionLevel: matchScore >= 85 ? "low" : matchScore >= 75 ? "medium" : "high",
    visaStatus: "unknown",
    timingTag,
    strongMatchSkills,
    partialMatchSkills: [],
    missingSkills: [],
    industry,
    seniority,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search queries to cast a wide net across job boards
    const queries = [
      "Senior Product Manager job opening 2025 site:greenhouse.io OR site:lever.co",
      "Product Manager hiring now site:ashbyhq.com OR site:workday.com",
      "Senior PM role apply site:jobs.lever.co OR site:boards.greenhouse.io",
      "Principal Product Manager job posting site:icims.com OR site:smartrecruiters.com",
      "Director of Product Management hiring 2025 site:greenhouse.io OR site:ashbyhq.com",
    ];

    const allResults: FirecrawlSearchResult[] = [];

    // Run searches in parallel, up to 3 queries to stay within credits
    const searchPromises = queries.slice(0, 3).map(async (query) => {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 10,
          scrapeOptions: { formats: [] }, // metadata only — no scrape needed
        }),
      });
      if (!res.ok) {
        console.error(`Search failed for: ${query}`, await res.text());
        return [];
      }
      const data = await res.json();
      return (data.data as FirecrawlSearchResult[]) ?? [];
    });

    const results = await Promise.allSettled(searchPromises);
    results.forEach((r) => {
      if (r.status === "fulfilled") allResults.push(...r.value);
    });

    // Deduplicate by URL and exclude LinkedIn
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      if (/linkedin\.com/i.test(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Parse into job listings
    const jobs: JobResult[] = unique
      .map((r, i) => parseJobFromResult(r, i))
      .filter((j): j is JobResult => j !== null);

    console.log(`Fetched ${unique.length} results → parsed ${jobs.length} PM jobs`);

    return new Response(JSON.stringify({ success: true, jobs, total: jobs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-pm-jobs error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
