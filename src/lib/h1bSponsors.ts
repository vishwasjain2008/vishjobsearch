/**
 * Known H1B Sponsor List
 * Derived from USCIS H-1B Employer Data Hub (public data):
 * https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub
 * Matched case-insensitively against company names.
 */
export const H1B_SPONSORS = new Set([
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
  // Health / BioTech
  "epic systems", "veeva", "tempus", "illumina", "moderna",
  // Media / Entertainment
  "spotify", "twitch", "reddit", "pinterest", "snap", "tiktok", "bytedance",
  // Enterprise / Security
  "crowdstrike", "splunk", "zscaler", "fortinet", "rapid7",
  // Dev Tools / Infra
  "atlassian", "github", "gitlab", "hashicorp", "confluent", "mongodb",
  "supabase", "vercel",
  // Other high-volume H1B tech employers
  "linkedin", "dropbox", "box", "zoom", "slack", "airbnb", "expedia",
  "booking", "tripadvisor", "yelp", "glassdoor",
  // Consulting / staffing
  "cognizant", "infosys", "wipro", "tata consultancy", "hcl",
  "accenture", "deloitte", "capgemini",
]);

export function isKnownH1BSponsor(company: string): boolean {
  const lower = company.toLowerCase();
  for (const sponsor of H1B_SPONSORS) {
    if (lower.includes(sponsor)) return true;
  }
  return false;
}
