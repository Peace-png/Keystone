#!/usr/bin/env bun

/**
 * GHOST HUNTER - Find abandoned GitHub repos with value
 *
 * Usage:
 *   bun run ghunter.ts --topic security --min-stars 500 --years-dead 2
 *   bun run ghunter.ts --language typescript --min-stars 1000
 *   bun run ghunter.ts --user someuser --check-abandoned
 */

const GITHUB_API = "https://api.github.com";

interface Repo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  language: string;
  owner: { login: string; html_url: string };
  topics?: string[];
}

interface SearchResult {
  items: Repo[];
  total_count: number;
}

function yearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split("T")[0];
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRepo(repo: Repo): string {
  const daysDead = daysSince(repo.pushed_at);
  const yearsDead = (daysDead / 365).toFixed(1);

  return `
┌─────────────────────────────────────────────────────
│ ${repo.full_name}
├─────────────────────────────────────────────────────
│ Stars: ${repo.stargazers_count.toLocaleString()} | Forks: ${repo.forks_count} | Issues: ${repo.open_issues_count}
│ Dead: ${daysDead} days (${yearsDead} years)
│ Lang: ${repo.language || "Unknown"}
│ URL: ${repo.html_url}
│ Owner: ${repo.owner.login}
│ Desc: ${repo.description?.slice(0, 60) || "No description"}...
└─────────────────────────────────────────────────────
  `.trim();
}

async function searchGitHub(query: string, token?: string): Promise<SearchResult> {
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "GhostHunter/1.0",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const res = await fetch(url, { headers });

  if (res.status === 403) {
    console.error("Rate limited! Add GITHUB_TOKEN env var for higher limits.");
    process.exit(1);
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

async function getContactInfo(owner: string, token?: string): Promise<{ email?: string; blog?: string }> {
  const url = `${GITHUB_API}/users/${owner}`;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "GhostHunter/1.0",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return {};

  const data = await res.json();
  return { email: data.email, blog: data.blog };
}

function printTemplate(repo: Repo, contact?: { email?: string; blog?: string }) {
  console.log(`
═══════════════════════════════════════════════════════
CONTACT TEMPLATE FOR: ${repo.full_name}
═══════════════════════════════════════════════════════

Hey ${repo.owner.login},

I came across ${repo.name} and it's really impressive. I can see it has ${repo.stargazers_count} stars and people are still finding it useful.

I noticed the project hasn't been updated in a while, and I was wondering if you'd consider transferring ownership? I'd love to:
- Fix open bugs and issues
- Update dependencies
- Keep the project alive for the community

Totally understand if you're not interested or have other plans. Just wanted to ask.

Thanks for building it in the first place!

Best,
[Your name]

───────────────────────────────────────────────────────
OWNER: ${repo.owner.login}
GitHub: ${repo.owner.html_url}
${contact?.email ? `Email: ${contact.email}` : ""}
${contact?.blog ? `Website: ${contact.blog}` : ""}
═══════════════════════════════════════════════════════
  `);
}

async function main() {
  const args = process.argv.slice(2);

  // Parse args
  const params: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      params[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  // Build query
  const minStars = params["min-stars"] || "500";
  const yearsDead = parseInt(params["years-dead"] || "2");
  const topic = params.topic;
  const language = params.language;
  const user = params.user;
  const deadSince = yearsAgo(yearsDead);

  let query = `stars:>${minStars} pushed:<${deadSince}`;

  if (topic) query += ` topic:${topic}`;
  if (language) query += ` language:${language}`;
  if (user) query += ` user:${user}`;

  console.log(`
╔═══════════════════════════════════════════════════════
║           👻 GHOST HUNTER v1.0
║     Find abandoned repos worth reviving
╠═══════════════════════════════════════════════════════
║ Query: ${query}
║ Min Stars: ${minStars}
║ Dead Since: ${deadSince}
╚═══════════════════════════════════════════════════════
  `);

  const token = process.env.GITHUB_TOKEN;
  const results = await searchGitHub(query, token);

  console.log(`\nFound ${results.total_count} dead repos. Top 10:\n`);

  const topRepos = results.items.slice(0, 10);

  for (const repo of topRepos) {
    console.log(formatRepo(repo));
  }

  // Show contact info for top hit
  if (params.contact !== "false" && topRepos.length > 0) {
    console.log("\n\n📬 Contact info for top result:\n");
    const contact = await getContactInfo(topRepos[0].owner.login, token);
    printTemplate(topRepos[0], contact);
  }

  console.log(`
\n💡 TIP: Set GITHUB_TOKEN env var for higher rate limits
         Generate one at: https://github.com/settings/tokens
  `);
}

main().catch(console.error);
