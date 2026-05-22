/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NepseSage — NEPSE Sector Normalizer                 ║
 * ║  Maps every raw string NEPSE returns to one of the 16 official  ║
 * ║  NEPSE sector categories. Call normalizeSector() on any raw     ║
 * ║  sectorName / sectorDescription before storing to MongoDB.      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Official NEPSE sectors (from nepseportal.com.np sector table):
 *  1.  Commercial Banks
 *  2.  Development Banks
 *  3.  Finance
 *  4.  Microfinance
 *  5.  Life Insurance
 *  6.  Non Life Insurance
 *  7.  Hydro Power
 *  8.  Manufacturing And Processing
 *  9.  Hotels And Tourism
 * 10.  Trading
 * 11.  Investment
 * 12.  Mutual Fund
 * 13.  Others
 * 14.  Corporate Debenture
 * 15.  Preference Share
 * 16.  Promoter Share
 */

// ─── Canonical names ──────────────────────────────────────────────────────────

export const NEPSE_SECTORS = [
  "Commercial Banks",
  "Development Banks",
  "Finance",
  "Microfinance",
  "Life Insurance",
  "Non Life Insurance",
  "Hydro Power",
  "Manufacturing And Processing",
  "Hotels And Tourism",
  "Trading",
  "Investment",
  "Mutual Fund",
  "Others",
  "Corporate Debenture",
  "Preference Share",
  "Promoter Share",
];

// ─── Lookup map: normalized lowercase keyword fragments → canonical name ───────
// Keys are lowercase substrings that uniquely identify each sector.
// The matcher tries each key against the lowercased input string.

const SECTOR_MAP = [
  // ── Debt / Equity instruments (MUST come first to override company name matches) ────
  { match: ["debenture", "bond", "corporate debenture"],   canonical: "Corporate Debenture" },
  { match: ["preference share", "preferred share"],        canonical: "Preference Share" },
  { match: ["promoter share", "promoter"],                 canonical: "Promoter Share" },

  // ── Banks (Dev Banks MUST come before Commercial Banks) ────────────────────
  { match: ["development bank", "dev bank", "bikas bank"],  canonical: "Development Banks" },
  { match: ["commercial bank", "cb bank", "commercial b", "bank"], canonical: "Commercial Banks" },

  // ── NBFIs ──────────────────────────────────────────────────────────────────
  { match: ["finance company", "finance co", " finance"],   canonical: "Finance" },
  { match: ["microfinance", "micro finance", "micro-finance", "laghubitta", "laghu bitta", "lagubitta", "laghubittiya"], canonical: "Microfinance" },

  // ── Insurance (Life MUST come before Non-Life) ─────────────────────────────
  { match: ["life insurance", "life insur", "jeevan bima", "micro life"],  canonical: "Life Insurance" },
  { match: ["non life", "non-life", "general insurance", "general insur", "fire and marine", "sanchayakosh", "insurance company", "insurance limited", "insurance co", "insurance"], canonical: "Non Life Insurance" },

  // ── Energy ─────────────────────────────────────────────────────────────────
  { match: ["hydro", "hydropower", "hydro power", "electricity", "energy", "solar", "wind power", "jalvidhyut", "jal vidhyut", "jalabidhyut", "jalabidyut", "jalavidhyut", "jalavidyut", "jal bidyut", "urja", "power company", "power partner", "power development", "power ltd", "power limited", "power compant", "vidyut", "bidyut", "green ventures"], canonical: "Hydro Power" },

  // ── Manufacturing ──────────────────────────────────────────────────────────
  { match: ["manufactur", "processing", "production", "cement", "noodle", "brewery", "distillery", "paint", "sugar", "textile", "cable", "pipe", "agriculture", "krishi", "minerals", "agritech", "industries", "spinning mills", "pharmaceuticals", "panel"], canonical: "Manufacturing And Processing" },

  // ── Tourism ────────────────────────────────────────────────────────────────
  { match: ["hotel", "tourism", "resort", "travel", "airline", "aviation", "hills", "darshan", "cable car"], canonical: "Hotels And Tourism" },

  // ── Trading ────────────────────────────────────────────────────────────────
  { match: ["trading", "tradings", "trade company", "trade tower", "bazar"], canonical: "Trading" },

  // ── Investment / Funds ─────────────────────────────────────────────────────
  { match: ["investment company", "investment co", "citizen investment", "nabil invest", "infrastructure and development", "emerging nepal", "holdings", "investment nepal"], canonical: "Investment" },
  { match: ["mutual fund", "scheme", "nepsemf", "fund", "yojana", "focus 40"], canonical: "Mutual Fund" },

  // ── Catch-all ──────────────────────────────────────────────────────────────
  { match: ["other"],                                       canonical: "Others" },
];

// ─── normalizer ───────────────────────────────────────────────────────────────

/**
 * Maps a raw NEPSE sector string to one of the 16 official canonical names.
 *
 * Strategy:
 *  1. Exact match (case-insensitive) against canonical list
 *  2. Substring match against SECTOR_MAP keyword fragments
 *  3. Falls back to "Others"
 *
 * @param {string|null|undefined} raw  — e.g. "Commercial Bank", "Hydro Power",
 *                                        "Laghubitta", "MICROFINANCE COMPANY"
 * @returns {string}  — one of the 16 canonical sector names
 */
export function normalizeSector(raw) {
  if (!raw || typeof raw !== "string") return "Others";

  const trimmed = raw.trim();
  if (!trimmed) return "Others";

  const lower = trimmed.toLowerCase();

  // 1. Exact match against canonical list (case-insensitive)
  const exact = NEPSE_SECTORS.find((s) => s.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Prefix/substring match — order matters (more specific entries first)
  for (const { match, canonical } of SECTOR_MAP) {
    if (match.some((kw) => lower.includes(kw))) {
      return canonical;
    }
  }

  // 3. Unknown/unrecognised — log for debugging and fall back to Others
  console.warn(`[sectorNormalizer] Unrecognised sector: "${trimmed}" → "Others"`);
  return "Others";
}

/**
 * Backfills the sector field for all MarketData documents that currently
 * have sector = "Unknown" or sector = "Others" (often left by live price sync).
 *
 * This is a one-time repair job — run it from a script or admin route after
 * seedCompanyMaster has populated the correct sector from the company list.
 *
 * NOTE: This function does NOT make any NEPSE API calls. It re-normalises
 * whatever is already stored in companyName/sector. To get correct sectors
 * you must first run seedCompanyMaster() which fetches from the company list API.
 */
export async function backfillSectors(MarketData) {
  const stale = await MarketData.find({
    $or: [{ sector: "Unknown" }, { sector: "Others" }, { sector: null }, { sector: "" }],
  }).select("symbol sector companyName instrumentType");

  console.log(`[backfillSectors] ${stale.length} documents need sector backfill`);

  let fixed = 0;
  for (const doc of stale) {
    // Try to infer sector from companyName or instrumentType
    const candidate = doc.companyName || doc.instrumentType || "";
    const normalized = normalizeSector(candidate);
    if (normalized !== "Others") {
      await MarketData.updateOne({ symbol: doc.symbol }, { $set: { sector: normalized } });
      fixed++;
    }
  }

  console.log(`[backfillSectors] Fixed ${fixed}/${stale.length} documents`);
  return { total: stale.length, fixed };
}
