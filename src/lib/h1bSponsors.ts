/**
 * Known H1B Sponsor List
 * Derived from USCIS H-1B Employer Data Hub (public data):
 * https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub
 * Matched case-insensitively against company names.
 *
 * Tier 1 = Large-cap, consistent high-volume H1B filers
 * Tier 2 = Mid-size tech, well-known to sponsor
 * Tier 3 = Smaller / growth-stage, confirmed H1B history
 */
export const H1B_SPONSORS = new Set([
  // ── Tier 1: Big Tech ─────────────────────────────────────────────────────────
  "google", "alphabet", "microsoft", "amazon", "apple", "meta", "netflix",
  "salesforce", "oracle", "ibm", "intel", "qualcomm", "nvidia",

  // ── Tier 1: Cloud / Enterprise SaaS ─────────────────────────────────────────
  "servicenow", "workday", "sap", "adobe", "vmware", "palo alto networks",
  "cloudflare", "datadog", "snowflake", "databricks", "twilio",
  "zendesk", "hubspot", "freshworks", "okta", "elastic",

  // ── Tier 1: FinTech ──────────────────────────────────────────────────────────
  "stripe", "block", "square", "paypal", "braintree", "adyen", "affirm",
  "robinhood", "coinbase", "chime", "plaid", "brex",

  // ── Tier 1: E-commerce / Marketplace ────────────────────────────────────────
  "ebay", "etsy", "shopify", "doordash", "instacart", "grubhub", "wayfair",
  "chewy", "poshmark",

  // ── Tier 1: Rideshare / Mobility ─────────────────────────────────────────────
  "uber", "lyft",

  // ── Tier 1: Media / Social ────────────────────────────────────────────────────
  "spotify", "twitch", "reddit", "pinterest", "snap", "tiktok", "bytedance",
  "linkedin", "dropbox", "box", "zoom", "slack", "airbnb",
  "expedia", "booking", "tripadvisor", "yelp", "glassdoor",

  // ── Tier 1: Health / BioTech ─────────────────────────────────────────────────
  "epic systems", "veeva", "tempus", "illumina", "moderna",

  // ── Tier 1: Security ─────────────────────────────────────────────────────────
  "crowdstrike", "splunk", "zscaler", "fortinet", "rapid7",

  // ── Tier 1: Dev Tools / Infra ─────────────────────────────────────────────────
  "atlassian", "github", "gitlab", "hashicorp", "confluent", "mongodb",
  "supabase", "vercel",

  // ── Tier 1: Consulting / Staffing (large H1B filers) ─────────────────────────
  "cognizant", "infosys", "wipro", "tata consultancy", "hcl",
  "accenture", "deloitte", "capgemini",

  // ── Tier 2: Collaboration / Productivity ────────────────────────────────────
  "figma", "notion", "airtable", "miro", "asana", "monday", "clickup",
  "coda", "loom", "calendly", "zapier",

  // ── Tier 2: Developer Tools / Observability ──────────────────────────────────
  "pagerduty", "new relic", "dynatrace", "grafana", "harness",
  "launchdarkly", "honeycomb", "postman", "jfrog", "circleci",
  "algolia", "sendbird", "contentful",

  // ── Tier 2: Data / Analytics ────────────────────────────────────────────────
  "fivetran", "dbt labs", "monte carlo", "collibra", "alation",
  "starburst", "airbyte", "thoughtspot", "amplitude", "mixpanel",
  "heap", "fullstory", "segment",

  // ── Tier 2: Security ────────────────────────────────────────────────────────
  "sentinelone", "lacework", "wiz", "snyk", "tenable", "qualys",
  "abnormal security", "recorded future", "cybereason",
  "checkmarx", "veracode",

  // ── Tier 2: FinTech / HR Tech ─────────────────────────────────────────────────
  "marqeta", "ramp", "rippling", "gusto", "carta", "navan",
  "mercury", "deel", "lattice", "culture amp", "braze",
  "iterable", "klaviyo",

  // ── Tier 2: AI / ML ──────────────────────────────────────────────────────────
  "openai", "anthropic", "cohere", "scale ai", "hugging face",
  "weights and biases", "labelbox", "c3.ai", "datarobot",
  "palantir",

  // ── Tier 2: Healthcare / Life Sciences ───────────────────────────────────────
  "flatiron health", "benchling", "doximity", "color health",
  "recursion", "insitro", "pathai",

  // ── Tier 2: E-commerce / Marketplace (Growth) ────────────────────────────────
  "faire", "thumbtack", "nextdoor", "canva",

  // ── Tier 2: Cloud / Infrastructure ───────────────────────────────────────────
  "fastly", "akamai",

  // ── Tier 2: Gaming / Entertainment ───────────────────────────────────────────
  "roblox", "unity", "epic games", "draftkings",

  // ── Tier 3: Growth-stage, confirmed H1B sponsors ─────────────────────────────
  "qualtrics", "medallia", "sprinklr", "brainware",
  "epam", "globant", "thoughtworks",
  "tanium", "exabeam",
  "intercom", "front", "zenefits",
  "toast", "samsara",
  "benchling", "benchscape",
  "glean", "moveworks", "workato",
  "samsara", "verkada",
  "grammarly", "duolingo",
  "noom", "calm", "headspace",
]);

export function isKnownH1BSponsor(company: string): boolean {
  const lower = company.toLowerCase();
  for (const sponsor of H1B_SPONSORS) {
    if (lower.includes(sponsor)) return true;
  }
  return false;
}

/**
 * Returns the sponsor tier for UI badging.
 * Tier 1 = flagship H1B sponsors (large-cap)
 * Tier 2 = mid-size confirmed sponsors
 * Tier 3 = growth-stage confirmed sponsors
 */
export function getH1BTier(company: string): 1 | 2 | 3 | null {
  const lower = company.toLowerCase();

  const tier1 = [
    "google", "alphabet", "microsoft", "amazon", "apple", "meta", "netflix",
    "salesforce", "oracle", "ibm", "intel", "qualcomm", "nvidia",
    "servicenow", "workday", "sap", "adobe", "vmware", "palo alto networks",
    "cloudflare", "datadog", "snowflake", "databricks", "twilio",
    "zendesk", "hubspot", "okta", "stripe", "block", "square", "paypal",
    "affirm", "robinhood", "coinbase", "chime", "plaid", "brex",
    "uber", "lyft", "airbnb", "spotify", "reddit", "pinterest", "snap",
    "linkedin", "dropbox", "box", "zoom", "slack", "shopify", "doordash",
    "instacart", "ebay", "etsy", "crowdstrike", "splunk", "zscaler",
    "fortinet", "atlassian", "github", "gitlab", "mongodb", "confluent",
  ];

  const tier2 = [
    "figma", "notion", "airtable", "miro", "asana", "monday", "clickup",
    "pagerduty", "new relic", "dynatrace", "grafana", "harness",
    "launchdarkly", "postman", "jfrog", "algolia", "fivetran", "dbt labs",
    "thoughtspot", "amplitude", "mixpanel", "heap", "fullstory", "segment",
    "sentinelone", "lacework", "wiz", "snyk", "tenable",
    "marqeta", "ramp", "rippling", "gusto", "carta", "navan",
    "openai", "anthropic", "cohere", "scale ai", "hugging face", "palantir",
    "flatiron health", "benchling", "doximity", "canva", "fastly",
    "roblox", "unity", "braze", "iterable", "klaviyo",
  ];

  if (tier1.some((s) => lower.includes(s))) return 1;
  if (tier2.some((s) => lower.includes(s))) return 2;
  if (isKnownH1BSponsor(company)) return 3;
  return null;
}
