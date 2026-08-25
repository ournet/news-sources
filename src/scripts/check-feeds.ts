import { writeFileSync } from "fs";
import { readSourcesByCountry, SOURCES_COUNTRIES } from "../data";
import { checkFeed, FeedCheck, formatCheck, mapLimit } from "./feeds";

/**
 * Checks the health of every feed of a country.
 *
 *   npm run check-feeds -- ro
 *   npm run check-feeds -- ro --json ro-report.json
 *   npm run check-feeds -- --urls https://a1.ro/rss/,https://www.zf.ro/rss/
 *
 * Exit code is 1 when at least one feed is not OK, so it can gate CI.
 */

type Target = { id: string; url: string };

const CONCURRENCY = 8;

function argValue(name: string): string | null {
  const at = process.argv.indexOf(name);
  return at > -1 && process.argv[at + 1] ? process.argv[at + 1] : null;
}

async function readTargets(): Promise<Target[]> {
  const urls = argValue("--urls");
  if (urls) {
    return urls.split(",").map((url) => ({ id: "-", url: url.trim() }));
  }
  const countryCode = process.argv[2];
  if (!countryCode || countryCode.indexOf("--") === 0) {
    throw new Error(
      `Usage: check-feeds <countryCode> [--json file]. Known: ${SOURCES_COUNTRIES.join(", ")}`
    );
  }
  const sources = await readSourcesByCountry(countryCode);
  const targets: Target[] = [];
  for (const source of sources) {
    for (const feed of source.feeds) {
      targets.push({ id: source.id, url: feed.url });
    }
  }
  return targets;
}

async function main() {
  const targets = await readTargets();
  console.log(`Checking ${targets.length} feeds...\n`);

  const results = await mapLimit(targets, CONCURRENCY, async (target) => {
    const check = await checkFeed(target.url);
    console.log(formatCheck(check, target.id));
    return Object.assign({ id: target.id }, check) as FeedCheck & { id: string };
  });

  const jsonOut = argValue("--json");
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify(results, null, 2));
    console.log(`\nReport written to ${jsonOut}`);
  }

  const counts: { [kind: string]: number } = {};
  for (const result of results) {
    counts[result.kind] = (counts[result.kind] || 0) + 1;
  }
  const kinds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  console.log("\n--- SUMMARY ---");
  for (const kind of kinds) {
    console.log(`${String(counts[kind])}\t${kind}`);
  }

  const broken = results.filter((result) => result.kind !== "OK");
  if (broken.length) {
    console.log(
      `\n${broken.length} feed(s) need attention. Run discover-feeds on their sites to look for a new URL.`
    );
    console.log(
      "Careful: HTTP_403 is often bot protection (Cloudflare), not a dead feed. Confirm in a real browser before disabling."
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
