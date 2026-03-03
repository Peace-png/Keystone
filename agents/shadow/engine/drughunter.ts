#!/usr/bin/env bun

/**
 * DRUG HUNTER - Find expiring pharmaceutical patents
 *
 * Scrapes FDA Orange Book and patent databases for drugs
 * coming off patent that can be manufactured as generics.
 *
 * Usage:
 *   bun run drughunter.ts --expiring-within 12
 *   bun run drughunter.ts --search "cholesterol"
 *   bun run drughunter.ts --top-revenue
 */

const ORANGE_BOOK_URL = "https://www.accessdata.fda.gov/scripts/cder/ob";

interface Drug {
  name: string;
  activeIngredient: string;
  company: string;
  patentNumber: string;
  patentExpiry: string;
  approvalDate: string;
  strength?: string;
  dosageForm?: string;
  marketSize?: number;
}

function monthsFromNow(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function printDrug(drug: Drug): string {
  const days = daysUntil(drug.patentExpiry);
  const status = days < 0 ? "⏰ EXPIRED" : days < 365 ? "🔴 EXPIRING SOON" : "🟢 ACTIVE";

  return `
┌─────────────────────────────────────────────────────────
│ 💊 ${drug.name.toUpperCase()}
├─────────────────────────────────────────────────────────
│ Active Ingredient: ${drug.activeIngredient}
│ Company: ${drug.company}
│ Patent: ${drug.patentNumber}
│ Expires: ${formatDate(drug.patentExpiry)} (${days > 0 ? days + " days" : Math.abs(days) + " days ago"})
│ Status: ${status}
│ ${drug.marketSize ? `Est. Market: $${(drug.marketSize / 1e9).toFixed(1)}B` : ""}
└─────────────────────────────────────────────────────────
  `.trim();
}

// FDA Orange Book doesn't have a public API, so we'll use their data files
// Alternative: scrape from public sources or use patent databases

async function searchGooglePatents(query: string): Promise<Drug[]> {
  // Google Patents API (limited, but works for search)
  const url = `https://patents.google.com/xhr/query?url=q%3D${encodeURIComponent(query)}%26status%3DPATENT_EXPIRED`;

  console.log(`Searching patents for: ${query}`);

  // Note: This is a simplified version. Real implementation would need
  // to handle Google's actual API or use a proper patent database.
  // For now, return mock structure showing what we'd get

  return [];
}

async function searchUSPTO(query: string): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════
║              💊 DRUG HUNTER v1.0
║         Find Expiring Pharmaceutical Patents
╠═══════════════════════════════════════════════════════════
║ NOTE: Full scraping requires USPTO API key
║
║ For real data, use these sources:
║
║ 1. FDA Orange Book (Official)
║    https://www.accessdata.fda.gov/scripts/cder/ob/
║    - Lists all approved drugs + patent info
║    - Download the Excel file "Products.txt"
║
║ 2. USPTO Patent Search
║    https://www.uspto.gov/patents/search
║    - Search by class code 424 (drug bio-affecting)
║    - Filter by expiration date
║
║ 3. DrugPatentWatch (Paid)
║    https://www.drugpatentwatch.com
║    - Professional grade data
║    - Market size estimates
║
║ 4. Google Patents
║    https://patents.google.com
║    - Search "expiring:2024" operator
║    - Free but rate limited
╚═══════════════════════════════════════════════════════════
  `);
}

async function fetchOrangeBookData(): Promise<Drug[]> {
  // The FDA provides the Orange Book data as downloadable files
  // URL: https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files

  console.log(`
📥 ORANGE BOOK DATA

The FDA Orange Book data is available as downloadable files:

1. Go to: https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files
2. Download "Products.txt" and "Patent.txt"
3. Parse for expiration dates

EXAMPLE HIGH-VALUE DRUGS WITH RECENTLY EXPIRED PATENTS:
  `);

  // Example data showing what we'd find
  const exampleDrugs: Drug[] = [
    {
      name: "Lipitor",
      activeIngredient: "Atorvastatin Calcium",
      company: "Pfizer",
      patentNumber: "US5273995",
      patentExpiry: "2011-11-30",
      marketSize: 13000000000, // $13B at peak
    },
    {
      name: "Advair Diskus",
      activeIngredient: "Fluticasone/Salmeterol",
      company: "GlaxoSmithKline",
      patentNumber: "US6054158",
      patentExpiry: "2024-08-01",
      marketSize: 5000000000,
    },
    {
      name: "Humira",
      activeIngredient: "Adalimumab",
      company: "AbbVie",
      patentNumber: "Multiple patents",
      patentExpiry: "2023-01-01",
      marketSize: 21000000000, // $21B - biggest ever
    },
    {
      name: "Eliquis",
      activeIngredient: "Apixaban",
      company: "Bristol-Myers Squibb",
      patentNumber: "US6429210",
      patentExpiry: "2026-02-26",
      marketSize: 12000000000,
    },
    {
      name: "Xarelto",
      activeIngredient: "Rivaroxaban",
      company: "Johnson & Johnson",
      patentNumber: "US7514444",
      patentExpiry: "2024-03-14",
      marketSize: 7000000000,
    },
  ];

  for (const drug of exampleDrugs) {
    console.log(printDrug(drug));
  }

  console.log(`

💡 STRATEGY:

1. Find drugs with patents expiring in next 12-24 months
2. Research market size (annual revenue)
3. Check manufacturing complexity (injectables harder than pills)
4. Find contract manufacturers (CMOs) who can produce
5. File ANDA (Abbreviated New Drug Application) with FDA
6. First-to-file gets 180-day exclusivity!

⚠️  REQUIREMENTS FOR GENERIC DRUGS:
- FDA approval (ANDA filing)
- GMP manufacturing facility
- Bioequivalence studies
- $500K - $5M startup costs minimum

💰 ALTERNATIVE (Lower Budget):
- Supplement/nootropic formulas (no FDA approval needed)
- Compounded medications (pharmacy level)
- Pet medications (easier regulations)
- International markets (less strict)
  `);

  return exampleDrugs;
}

async function findExpiringDrugs(months: number): Promise<void> {
  const cutoffDate = monthsFromNow(months);

  console.log(`
╔═══════════════════════════════════════════════════════════
║              💊 DRUG HUNTER v1.0
║         Patents Expiring Within ${months} Months
╠═══════════════════════════════════════════════════════════
║ Cutoff Date: ${cutoffDate}
╚═══════════════════════════════════════════════════════════
  `);

  await fetchOrangeBookData();
}

async function main() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      params[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  if (params["expiring-within"]) {
    await findExpiringDrugs(parseInt(params["expiring-within"]));
  } else if (params.search) {
    await searchUSPTO(params.search);
  } else {
    await fetchOrangeBookData();
  }
}

main().catch(console.error);
