import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchResult {
  url: string;
  title: string;
  description: string;
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

// ─── H1B Sponsor List ────────────────────────────────────────────────────────
// Derived from USCIS H-1B Employer Data Hub (public, one-time data):
// https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub
// Top tech/product companies with consistent H1B approval history.
// Matched case-insensitively against parsed company names.
const H1B_SPONSORS = new Set([
  // Big Tech
  "google", "alphabet", "microsoft", "amazon", "apple", "meta", "netflix",
  "salesforce", "oracle", "ibm", "intel", "qualcomm", "nvidia",
  // Cloud / SaaS
  "servicenow", "workday", "sap", "adobe", "vmware", "palo alto networks",
  "cloudflare", "datadog", "snowflake", "databricks", "twilio",
  "zendesk", "hubspot", "freshworks", "okta", "elastic",
  // FinTech
  "stripe", "block", "square", "paypal", "braintree", "adyen", "affirm",
  "robinhood", "coinbase", "chime", "plaid", "brex",
  // E-commerce / Marketplace
  "ebay", "etsy", "shopify", "doordash", "instacart", "grubhub", "wayfair",
  "chewy", "poshmark",
  // Rideshare / Mobility
  "uber", "lyft",
  // Health / Bio Tech
  "epic systems", "veeva", "tempus", "illumina", "moderna",
  // Media / Entertainment
  "spotify", "twitch", "reddit", "pinterest", "snap", "tiktok", "bytedance",
  // Enterprise / Security
  "crowdstrike", "splunk", "zscaler", "fortinet", "rapid7",
  // Dev Tools / Infra
  "atlassian", "github", "gitlab", "hashicorp", "confluent", "mongodb",
  "elastic", "supabase", "vercel",
  // Other high-volume H1B tech employers
  "linkedin", "dropbox", "box", "zoom", "slack", "airbnb", "expedia",
  "booking", "tripadvisor", "yelp", "glassdoor",
  // Consulting / staffing (large H1B filers, but product roles exist)
  "cognizant", "infosys", "wipro", "tata consultancy", "hcl",
  "accenture", "deloitte", "capgemini",
]);

/** Returns true if the company name matches any known H1B sponsor */
function isKnownH1BSponsor(company: string): boolean {
  const lower = company.toLowerCase();
  for (const sponsor of H1B_SPONSORS) {
    if (lower.includes(sponsor)) return true;
  }
  return false;
}

// Strip ATS platform suffixes from company/title strings
function cleanATSName(name: string): string {
  return name
    .replace(/\s*[-–|]\s*(Greenhouse|Lever|Ashby|Workday|iCIMS|SmartRecruiters)\s*$/i, "")
    .replace(/^(Greenhouse|Lever|Ashby|Workday|iCIMS|SmartRecruiters)\s*[-–|]\s*/i, "")
    .replace(/^Job Application for\s+/i, "")
    .trim();
}

// ─── URL Validity Guard ───────────────────────────────────────────────────────
// Returns true only if the URL looks like a direct, individual job posting page.
function isDirectJobURL(url: string): boolean {
  // Must be HTTPS
  if (!url.startsWith("https://")) return false;

  // Explicit blocklist — aggregator listing pages, blog posts, search result pages
  const blocklist = [
    // Search/listing pages (not individual jobs)
    /indeed\.com\/q-/i,
    /indeed\.com\/jobs/i,
    /glassdoor\.com\/Job\/jobs\.htm/i,
    /glassdoor\.com\/job-listing/i,
    /linkedin\.com\/jobs\/search/i,
    // Blog / article / resource pages
    /\/blog\//i,
    /\/article\//i,
    /\/news\//i,
    /\/resources\//i,
    /\/guides\//i,
    /\/insights\//i,
    // Known aggregator / listicle domains
    /productschool\.com/i,
    /migratemate\.co/i,
    /scouts\.yutori\.com/i,
    /yutori\.com/i,
    /remoterocketship\.com\/.*jobs$/i,     // listing pages (allow individual job pages)
    /builtinchicago\.org.*\/jobs$/i,
    /builtin\.com.*\/jobs$/i,
    // Career landing pages (not individual job postings)
    /\/careers\/?$/i,
    /\/jobs\/?$/i,
    /\/open-roles\/?$/i,
    /\/join-us\/?$/i,
    // Generic visa-info / job-board pages
    /visa-sponsorship-jobs\/product-manager/i,
    /q-product-manager/i,
  ];
  if (blocklist.some((re) => re.test(url))) return false;

  // Allowlist — known ATS domains that always serve individual job pages
  const atsAllowlist = [
    /greenhouse\.io\/.+\/jobs\//i,
    /lever\.co\/.+\//i,
    /ashbyhq\.com\/.+\/jobs\//i,
    /myworkdayjobs\.com\/.+\/job\//i,
    /icims\.com\//i,
    /smartrecruiters\.com\//i,
    /jobs\.generalcatalyst\.com\//i,
    /microsoft\.ai\/job\//i,
    /careers\.snowflake\.com\/.+\/job\//i,
    /workday\.wd\d+\.myworkdayjobs\.com/i,
  ];
  // If it matches a known ATS, it's valid
  if (atsAllowlist.some((re) => re.test(url))) return true;

  // For everything else: must contain a path segment that looks like a job ID / slug
  // (at least 2 path segments after the domain, last segment non-trivial)
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2) return false;
    const lastSeg = segments[segments.length - 1];
    // Must not be a pure keyword like "jobs", "careers", "apply"
    if (/^(jobs|careers|apply|positions|openings|roles|work|hiring|product-manager|senior-product-manager)$/.test(lastSeg)) return false;
  } catch {
    return false;
  }

  return true;
}

// Reject titles that look like search result pages / job listing aggregations
function isSpuriousTitle(title: string): boolean {
  // e.g. "15,450 senior product manager Jobs in the United States, November 2025"
  if (/^\d[\d,]+\s+.+\bjobs?\b/i.test(title)) return true;
  // e.g. "Senior Product Manager Jobs in United States | LinkedIn"
  if (/\bjobs?\s+(in|at|for|near)\b.{0,60}(linkedin|indeed|glassdoor|ziprecruiter|monster|simplyhired|dice|builtin|wellfound|angellist)/i.test(title)) return true;
  // e.g. "Product Manager Jobs, Employment | Indeed.com"
  if (/\bjobs?,?\s+(employment|opportunities|openings|listings|postings)\b/i.test(title)) return true;
  // e.g. "Search Product Manager Jobs" or "Find Product Manager Jobs"
  if (/^(search|find|browse|view|explore)\s+.+\bjobs?\b/i.test(title)) return true;
  // e.g. "Product Manager Jobs | Nov 2025 | ..."
  if (/\bjobs?\s*\|\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i.test(title)) return true;
  // e.g. "Product Manager Job Listings" or "Product Manager Careers"
  if (/\b(job listings|job board|job search|career opportunities|current openings|open positions)\b/i.test(title)) return true;
  return false;
}

// Derive structured fields from a search result
function parseJobFromResult(result: SearchResult, idx: number): JobResult | null {
  const { url, title: rawTitle, description } = result;
  if (!url || !rawTitle || !description) return null;

  // Reject search result / listing page titles
  if (isSpuriousTitle(rawTitle)) return null;

  // Reject URLs that aren't direct individual job postings
  if (!isDirectJobURL(url)) return null;

  // Extract company from title patterns like "Senior PM at Stripe" or "Stripe | Senior PM"
  let title = rawTitle;
  let company = "Unknown";

  const atMatch = rawTitle.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|–-].*)?$/i);
  const pipeMatch = rawTitle.match(/^(.+?)\s*[|–-]\s*(.+?)\s*(?:job|career|role)?$/i);

  // Extract company from ATS URL path: jobs.lever.co/company/... or job-boards.greenhouse.io/company/...
  const atsPathCompanyMatch = url.match(/(?:jobs\.lever\.co|job-boards(?:\.eu)?\.greenhouse\.io|jobs\.ashbyhq\.com|job-boards\.eu\.greenhouse\.io)\/([a-z0-9_-]+)\//i);

  // For Workday: subdomain is often the company (stripe.wd1.myworkdayjobs.com)
  // but many companies use generic subdomains (careers, remote, jobs) — detect those
  const genericSubdomains = /^(careers|jobs|remote|external|internal|apply|portal|recruit|hiring|talent|work|team|ingredients|corporate|hr)$/i;
  const workdaySubdomainMatch = url.match(/^https?:\/\/([a-z0-9_-]+)\.wd\d+\.myworkdayjobs\.com\//i);
  // Also try to extract company from URL path segment after language code: /en-US/CompanyName/job/...
  const workdayPathCompanyMatch = url.match(/myworkdayjobs\.com\/[a-z-]+\/([A-Za-z0-9_-]+(?:\s[A-Za-z0-9_-]+)?)\//i);

  const isGenericWorkdaySubdomain = workdaySubdomainMatch && genericSubdomains.test(workdaySubdomainMatch[1]);
  const atsCompanyMatch = atsPathCompanyMatch ?? workdaySubdomainMatch;

  // For Workday URLs, determine company from subdomain or path
  if (workdaySubdomainMatch) {
    // If subdomain is a real company name (not generic), use it
    const subdomainCompany = workdaySubdomainMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!isGenericWorkdaySubdomain) {
      company = subdomainCompany;
    } else if (workdayPathCompanyMatch) {
      // Try path-based company name for generic subdomains
      company = workdayPathCompanyMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    } else {
      // Fall back to title parsing for generic subdomains
      company = subdomainCompany; // will be overridden below if title has better info
    }
    // Extract clean title from title patterns
    if (atMatch) title = cleanATSName(atMatch[1].trim());
    else if (pipeMatch) title = cleanATSName(pipeMatch[1].trim());
  } else if (atMatch) {
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

  // Override with URL slug if company resolved to an ATS platform name or is unknown (non-Workday URLs)
  const atsPlatformNames = /^(greenhouse|lever|ashby|workday|icims|smartrecruiters|unknown)$/i;
  if (!workdaySubdomainMatch && (company === "Unknown" || company === "" || atsPlatformNames.test(company)) && atsCompanyMatch) {
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

  // Reject non-US jobs — detect explicit foreign country/city mentions in description or title
  const nonUSRegex = /\b(Canada|Toronto|Vancouver|Montreal|Ottawa|Calgary|Edmonton|UK|United Kingdom|London|Manchester|Edinburgh|Australia|Sydney|Melbourne|Brisbane|India|Bangalore|Mumbai|Delhi|Hyderabad|Israel|Tel Aviv|Germany|Berlin|Munich|France|Paris|Netherlands|Amsterdam|Singapore|Japan|Tokyo|Brazil|São Paulo|Argentina|Buenos Aires|Mexico|New Zealand|Ireland|Dublin|Poland|Warsaw|Spain|Madrid|Barcelona|Sweden|Stockholm|Denmark|Copenhagen|Norway|Oslo|Finland|Helsinki|Switzerland|Zurich|Geneva)\b/i;
  if (nonUSRegex.test(`${description} ${rawTitle}`)) return null;

  // Extract US location
  const locationMatch = description.match(
    /\b(Remote|New York|San Francisco|Seattle|Austin|Chicago|Boston|Los Angeles|Atlanta|Denver|Miami|Palo Alto|Sunnyvale|Mountain View|Menlo Park|San Jose|San Diego|Portland|Phoenix|Dallas|Houston|Minneapolis|Detroit|Nashville|Raleigh|Salt Lake City|Pittsburgh)[,\s]*(NY|CA|WA|TX|IL|MA|GA|CO|FL|OR|AZ|MN|MI|TN|NC|UT|PA)?\b/i
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

  // Visa sponsorship detection:
  // 1) Text-based regex on description
  // 2) Known H1B sponsor list (USCIS data) — overrides "unknown" → "friendly"
  const visaFriendlyRegex = /sponsor(s|ed|ing)?\s+(visa|work\s*auth|h[-\s]?1b)|will\s+sponsor|visa\s+sponsor(ship)?|h[-\s]?1b\s+sponsor|open\s+to\s+sponsor|support(s)?\s+visa|immigration\s+support/i;
  const visaRarelyRegex = /not\s+(able|eligible|authorized)\s+to\s+sponsor|no\s+visa\s+sponsor|unable\s+to\s+sponsor|cannot\s+sponsor|does\s+not\s+sponsor|sponsorship\s+not\s+(available|provided)|must\s+be\s+(authorized|eligible)\s+to\s+work|must\s+not\s+require\s+sponsor/i;
  const textVisaStatus: JobResult["visaStatus"] =
    visaFriendlyRegex.test(combinedText) ? "friendly" :
    visaRarelyRegex.test(combinedText) ? "rarely" : "unknown";

  // If text says "rarely" keep it; otherwise H1B list can upgrade to "friendly"
  const knownSponsor = isKnownH1BSponsor(company);
  const visaStatus: JobResult["visaStatus"] =
    textVisaStatus === "rarely" ? "rarely" :
    (textVisaStatus === "friendly" || knownSponsor) ? "friendly" : "unknown";

  // Match/priority scores — large boost for known H1B sponsors so they always surface first
  const visaBoost = knownSponsor ? 30 : visaStatus === "friendly" ? 18 : 0;
  const matchScore = Math.min(98, 65 + strongMatchSkills.length * 5);
  const priorityScore = Math.min(98, 60 + strongMatchSkills.length * 5 + (isRemote ? 5 : 0) + visaBoost);

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
    [/myworkdayjobs\.com/i, "Workday"],
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
    visaStatus,
    timingTag,
    strongMatchSkills,
    partialMatchSkills: [],
    missingSkills: [],
    industry,
    seniority,
  };
}

const CACHE_TTL_DAYS = 10; // Only hit Tavily once every 10 days to conserve API credits

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if cache is still fresh
    const { data: meta } = await supabase
      .from("job_cache_meta")
      .select("last_fetched_at, total_jobs")
      .eq("id", 1)
      .single();

    const forceRefresh = (await req.json().catch(() => ({}))).forceRefresh === true;
    const lastFetched = meta?.last_fetched_at ? new Date(meta.last_fetched_at) : null;
    const ageMs = lastFetched ? Date.now() - lastFetched.getTime() : Infinity;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const cacheIsStale = ageDays >= CACHE_TTL_DAYS;

    // Serve from cache if fresh and not forcing a refresh
    if (!cacheIsStale && !forceRefresh && meta?.total_jobs > 0) {
      const { data: cachedJobs } = await supabase
        .from("cached_jobs")
        .select("*")
        .order("priority_score", { ascending: false });

      if (cachedJobs && cachedJobs.length > 0) {
        const jobs = cachedJobs.map((j) => ({
          id: j.id, title: j.title, company: j.company, location: j.location,
          isRemote: j.is_remote, isHybrid: j.is_hybrid, description: j.description,
          requiredSkills: j.required_skills, salaryMin: j.salary_min, salaryMax: j.salary_max,
          postedDate: j.posted_date, applyLink: j.apply_link, source: j.source,
          matchScore: j.match_score, priorityScore: j.priority_score,
          competitionLevel: j.competition_level, visaStatus: j.visa_status,
          timingTag: j.timing_tag, strongMatchSkills: j.strong_match_skills,
          partialMatchSkills: j.partial_match_skills, missingSkills: j.missing_skills,
          industry: j.industry, seniority: j.seniority,
        }));
        console.log(`Served ${jobs.length} jobs from cache (age: ${ageDays.toFixed(1)} days)`);
        return new Response(JSON.stringify({
          success: true, jobs, total: jobs.length,
          fromCache: true, cachedAt: meta.last_fetched_at,
          nextRefreshDays: Math.ceil(CACHE_TTL_DAYS - ageDays),
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!TAVILY_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Tavily not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Search queries focused on known H1B sponsors ────────────────────────────
    // ~75% of queries are company-specific to ensure H1B sponsors dominate results.
    // Remaining ~25% catch visa-sponsorship-explicit listings from any company.
    const queries = [
      // ── Big Tech H1B sponsors ──────────────────────────────────────────────────
      "Product Manager Google site:greenhouse.io OR site:lever.co",
      "Product Manager Microsoft site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Amazon site:greenhouse.io OR site:lever.co OR site:amazon.jobs",
      "Product Manager Meta site:greenhouse.io OR site:lever.co",
      "Product Manager Apple site:greenhouse.io OR site:myworkdayjobs.com",
      "Product Manager Salesforce site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Nvidia site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      // ── Cloud / SaaS H1B sponsors ─────────────────────────────────────────────
      "Product Manager Snowflake site:greenhouse.io OR site:lever.co",
      "Product Manager Databricks site:greenhouse.io OR site:lever.co",
      "Product Manager Datadog site:greenhouse.io OR site:lever.co",
      "Product Manager ServiceNow site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Workday site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Cloudflare site:greenhouse.io OR site:lever.co",
      "Product Manager Okta site:greenhouse.io OR site:lever.co",
      // ── FinTech H1B sponsors ───────────────────────────────────────────────────
      "Product Manager Stripe site:greenhouse.io OR site:lever.co",
      "Product Manager PayPal site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Coinbase site:greenhouse.io OR site:lever.co OR site:ashbyhq.com",
      "Product Manager Robinhood site:greenhouse.io OR site:lever.co OR site:ashbyhq.com",
      "Product Manager Affirm site:greenhouse.io OR site:lever.co",
      // ── Other top H1B tech sponsors ───────────────────────────────────────────
      "Product Manager Uber site:greenhouse.io OR site:lever.co",
      "Product Manager Lyft site:greenhouse.io OR site:lever.co",
      "Product Manager Airbnb site:greenhouse.io OR site:lever.co",
      "Product Manager LinkedIn site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Spotify site:greenhouse.io OR site:lever.co OR site:ashbyhq.com",
      "Product Manager Adobe site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Oracle site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager IBM site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com",
      "Product Manager Atlassian site:greenhouse.io OR site:lever.co",
      "Product Manager Shopify site:greenhouse.io OR site:lever.co",
      "Product Manager DoorDash site:greenhouse.io OR site:lever.co OR site:ashbyhq.com",
      // ── H1B / Visa explicit catch-all (any company that declares sponsorship) ──
      "Product Manager H1B visa sponsorship sponsor United States site:greenhouse.io OR site:lever.co",
      "Senior Product Manager will sponsor H-1B visa 2025 United States site:ashbyhq.com OR site:greenhouse.io",
      "Product Manager visa sponsorship offered United States site:myworkdayjobs.com",
    ];

    const allResults: SearchResult[] = [];

    // Run all queries in parallel via Tavily
    const searchPromises = queries.map(async (query) => {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          max_results: 15,
          search_depth: "basic",
          include_answer: false,
          include_raw_content: false,
        }),
      });
      if (!res.ok) {
        console.error(`Tavily search failed for: ${query}`, await res.text());
        return [];
      }
      const data = await res.json();
      // Tavily returns { results: [{ url, title, content, score }] }
      return ((data.results ?? []) as { url: string; title: string; content: string }[]).map((r) => ({
        url: r.url,
        title: r.title,
        description: r.content,
      })) as SearchResult[];
    });

    const results = await Promise.allSettled(searchPromises);
    results.forEach((r) => {
      if (r.status === "fulfilled") allResults.push(...r.value);
    });

    // Deduplicate by URL — noise/aggregator URLs are filtered in parseJobFromResult via isDirectJobURL
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Parse into job listings
    const jobs: JobResult[] = unique
      .map((r, i) => parseJobFromResult(r, i))
      .filter((j): j is JobResult => j !== null)
      // Sort: visa-friendly first, then unknown, then rarely
      .sort((a, b) => {
        const rank = { friendly: 0, unknown: 1, rarely: 2 };
        return rank[a.visaStatus] - rank[b.visaStatus];
      });

    console.log(`Tavily: fetched ${unique.length} results → parsed ${jobs.length} PM jobs`);

    // Save to cache — clear old jobs first, then insert new batch
    const now = new Date().toISOString();
    await supabase.from("cached_jobs").delete().neq("id", "__placeholder__");
    await supabase.from("cached_jobs").insert(
      jobs.map((j) => ({
        id: j.id, title: j.title, company: j.company, location: j.location,
        is_remote: j.isRemote, is_hybrid: j.isHybrid, description: j.description,
        required_skills: j.requiredSkills, salary_min: j.salaryMin, salary_max: j.salaryMax,
        posted_date: j.postedDate, apply_link: j.applyLink, source: j.source,
        match_score: j.matchScore, priority_score: j.priorityScore,
        competition_level: j.competitionLevel, visa_status: j.visaStatus,
        timing_tag: j.timingTag, strong_match_skills: j.strongMatchSkills,
        partial_match_skills: j.partialMatchSkills, missing_skills: j.missingSkills,
        industry: j.industry, seniority: j.seniority, cached_at: now,
      }))
    );
    await supabase.from("job_cache_meta").update({ last_fetched_at: now, total_jobs: jobs.length }).eq("id", 1);
    console.log(`Saved ${jobs.length} jobs to cache`);

    return new Response(JSON.stringify({
      success: true, jobs, total: jobs.length,
      fromCache: false, cachedAt: now, nextRefreshDays: CACHE_TTL_DAYS,
    }), {
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
