import { checkFeed, curlGet, normalizeUrl } from "./feeds";

/**
 * Looks for working feed URLs of a site, for when its known feed died.
 *
 *   npm run discover-feeds -- http://www.business24.ro/ http://evz.ro/
 *
 * Candidates come from the site's <link rel="alternate"> tags, from
 * anchors that look like feeds, and from the usual feed paths.
 */

const COMMON_PATHS = [
  "/rss",
  "/rss/",
  "/feed",
  "/feed/",
  "/rss.xml",
  "/feed.xml",
  "/atom.xml",
  "/index.xml",
  "/rss/index",
  "/rss/index.xml",
  "/feeds/all.xml",
  "/?feed=rss2",
  // WordPress sites that redirect /feed/ to the homepage often still
  // serve the site-wide feed behind an explicit post_type query.
  "/feed/?post_type=post"
];

const MAX_CANDIDATES = 40;

function absoluteUrl(href: string, base: string): string | null {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }
  const match = /^(https?:\/\/[^\/]+)/i.exec(base);
  if (!match) {
    return null;
  }
  if (href.indexOf("//") === 0) {
    return `https:${href}`;
  }
  return href.indexOf("/") === 0 ? match[1] + href : `${match[1]}/${href}`;
}

function originOf(url: string): string {
  const match = /^(https?:\/\/[^\/]+)/i.exec(url);
  return match ? match[1] : url.replace(/\/$/, "");
}

async function candidatesOf(siteUrl: string): Promise<string[]> {
  const found: string[] = [];
  const add = (url: string | null) => {
    if (url && found.indexOf(url) < 0) {
      found.push(url);
    }
  };

  const response = await curlGet(siteUrl, 20);
  let baseUrl = siteUrl;
  if (response.transportError) {
    console.log(`   ! homepage unreachable: ${response.transportError}`);
  } else {
    baseUrl = response.finalUrl;
    if (normalizeUrl(baseUrl) !== normalizeUrl(siteUrl)) {
      console.log(`   site redirects -> ${baseUrl}`);
    }
    const linkRe = /<link\b[^>]*>/gi;
    let link = linkRe.exec(response.body);
    while (link) {
      const tag = link[0];
      if (/rel=["']?alternate/i.test(tag) && /(rss|atom)\+xml/i.test(tag)) {
        const href = /href=["']([^"']+)["']/i.exec(tag);
        if (href) {
          add(absoluteUrl(href[1], baseUrl));
        }
      }
      link = linkRe.exec(response.body);
    }
    const anchorRe = /<a\b[^>]*href=["']([^"']*(?:rss|feed|atom)[^"']*)["']/gi;
    let anchor = anchorRe.exec(response.body);
    while (anchor) {
      if (!/facebook|twitter|x\.com|youtube|instagram|feedburner\.com\/~/i.test(anchor[1])) {
        add(absoluteUrl(anchor[1], baseUrl));
      }
      anchor = anchorRe.exec(response.body);
    }
  }

  const origin = originOf(baseUrl);
  for (const path of COMMON_PATHS) {
    add(origin + path);
  }
  return found.slice(0, MAX_CANDIDATES);
}

async function discover(siteUrl: string) {
  console.log(`\n=== ${siteUrl} ===`);
  const candidates = await candidatesOf(siteUrl);
  console.log(`   ${candidates.length} candidates`);

  let working = 0;
  for (const candidate of candidates) {
    const check = await checkFeed(candidate);
    if (check.kind !== "OK" && check.kind !== "STALE") {
      continue;
    }
    working++;
    const redirect = check.redirected ? ` -> ${check.finalUrl}` : "";
    console.log(
      `   ${check.kind === "OK" ? "OK  " : "STALE"} ${candidate}${redirect} ` +
        `(items=${check.items}, latest=${check.latest}, age=${check.ageDays}d)`
    );
  }
  if (!working) {
    console.log("   no working feed found");
  }
}

async function main() {
  const sites = process.argv.slice(2).filter((arg) => /^https?:\/\//i.test(arg));
  if (!sites.length) {
    throw new Error("Usage: discover-feeds <siteUrl> [siteUrl...]");
  }
  for (const site of sites) {
    await discover(site);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
