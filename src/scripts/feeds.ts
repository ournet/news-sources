import { execFile } from "child_process";

/**
 * Shared helpers for auditing news feeds.
 *
 * HTTP goes through `curl`, not node's fetch: undici reports
 * UND_ERR_CONNECT_TIMEOUT for a lot of hosts that answer in ~200ms,
 * which makes live feeds look dead.
 */

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export const REQUEST_TIMEOUT_SECONDS = 30;
export const STALE_DAYS = 30;

const META_SEPARATOR = "===CURLMETA===";

export type FeedKind =
  | "OK"
  | "STALE"
  | "EMPTY_FEED"
  | "NOT_FEED"
  | "HTML_NOT_FEED"
  | "NETWORK_ERROR"
  | string;

export type CurlResponse = {
  status: number;
  contentType: string;
  finalUrl: string;
  body: string;
  transportError?: string;
};

export type FeedCheck = {
  url: string;
  kind: FeedKind;
  finalUrl?: string;
  status?: number;
  contentType?: string;
  redirected?: boolean;
  items?: number;
  latest?: string | null;
  ageDays?: number | null;
  error?: string;
};

export function curlGet(
  url: string,
  timeoutSeconds = REQUEST_TIMEOUT_SECONDS
): Promise<CurlResponse> {
  return new Promise<CurlResponse>((resolve) => {
    execFile(
      "curl",
      [
        "-sSL",
        "--compressed",
        "--max-time",
        String(timeoutSeconds),
        "--max-redirs",
        "10",
        "-A",
        USER_AGENT,
        "-H",
        "Accept: application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.8",
        "-H",
        "Accept-Language: ro,ru,en;q=0.8",
        "-w",
        `\n${META_SEPARATOR}\n%{http_code}\t%{content_type}\t%{url_effective}`,
        url
      ],
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const text = stdout || "";
        const at = text.lastIndexOf(META_SEPARATOR);
        if (at < 0) {
          return resolve({
            status: 0,
            contentType: "",
            finalUrl: url,
            body: "",
            transportError:
              (stderr && stderr.trim()) ||
              (error && error.message) ||
              "no response"
          });
        }
        const meta = text
          .substring(at + META_SEPARATOR.length)
          .replace(/^\n/, "")
          .split("\t");
        resolve({
          status: Number(meta[0]) || 0,
          contentType: (meta[1] || "").split(";")[0],
          finalUrl: meta[2] || url,
          body: text.substring(0, at).replace(/\n$/, "")
        });
      }
    );
  });
}

function parseDates(body: string): Date[] {
  const dates: Date[] = [];
  const re = /<(?:pubDate|dc:date|published|updated|lastBuildDate)[^>]*>([\s\S]*?)<\//gi;
  let match = re.exec(body);
  while (match) {
    const raw = match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const date = new Date(raw);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1990) {
      dates.push(date);
    }
    match = re.exec(body);
  }
  return dates;
}

function countItems(body: string): number {
  const rss = (body.match(/<item[\s>]/gi) || []).length;
  const atom = (body.match(/<entry[\s>]/gi) || []).length;
  return Math.max(rss, atom);
}

export function normalizeUrl(url: string): string {
  const withoutProtocol = url.replace(/^https?:\/\//i, "");
  return withoutProtocol.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
}

export function classifyBody(body: string, contentType: string) {
  const head = body.substring(0, 4000);
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(head)) {
    const isHtml =
      /<!doctype html|<html[\s>]/i.test(head) || /text\/html/i.test(contentType);
    return {
      kind: isHtml ? "HTML_NOT_FEED" : "NOT_FEED",
      items: 0,
      latest: null as Date | null,
      ageDays: null as number | null
    };
  }
  const items = countItems(body);
  const dates = parseDates(body);
  let latest: Date | null = null;
  for (const date of dates) {
    if (!latest || date.getTime() > latest.getTime()) {
      latest = date;
    }
  }
  const ageDays =
    latest === null ? null : (Date.now() - latest.getTime()) / 86400000;
  let kind = "OK";
  if (items === 0) {
    kind = "EMPTY_FEED";
  } else if (ageDays !== null && ageDays > STALE_DAYS) {
    kind = "STALE";
  }
  return { kind, items, latest, ageDays };
}

export async function checkFeed(url: string): Promise<FeedCheck> {
  const response = await curlGet(url);
  if (response.transportError) {
    return { url, kind: "NETWORK_ERROR", error: response.transportError };
  }
  const base = {
    url,
    finalUrl: response.finalUrl,
    status: response.status,
    contentType: response.contentType,
    redirected: normalizeUrl(response.finalUrl) !== normalizeUrl(url)
  };
  if (response.status < 200 || response.status >= 300) {
    return Object.assign({}, base, {
      kind: `HTTP_${response.status}`,
      items: 0
    });
  }
  const classified = classifyBody(response.body, response.contentType);
  return Object.assign({}, base, {
    kind: classified.kind,
    items: classified.items,
    latest: classified.latest
      ? classified.latest.toISOString().substring(0, 10)
      : null,
    ageDays: classified.ageDays === null ? null : Math.round(classified.ageDays)
  });
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers: Promise<void>[] = [];
  const size = Math.min(limit, items.length);
  for (let i = 0; i < size; i++) {
    workers.push(
      (async () => {
        while (next < items.length) {
          const index = next++;
          results[index] = await fn(items[index]);
        }
      })()
    );
  }
  await Promise.all(workers);
  return results;
}

export function pad(value: string, width: number): string {
  let out = value;
  while (out.length < width) {
    out += " ";
  }
  return out;
}

export function formatCheck(check: FeedCheck, label: string): string {
  let line = `${pad(check.kind, 14)} ${pad(label, 20)} ${check.url}`;
  if (check.redirected) {
    line += `\n${pad("", 35)}-> ${check.finalUrl}`;
  }
  if (check.items) {
    line += ` (items=${check.items}, latest=${check.latest}, age=${check.ageDays}d)`;
  }
  if (check.error) {
    line += ` [${check.error}]`;
  }
  return line;
}
