# news-sources

A repository of news sources for every country. Data is stored in JSON files.

## Node.js usage

```ts
import { getSources, getSource } from 'news-sources';
const sources = await getSources('ru'); // Russian sources
const source = await getSource('ru', 'vesti.ru');
```

## Node.js API

### readSources(countryCode: string): Promise<NewsSource[]>

Reads news sources from a JSON file by `countryCode` (2 letters country code).
Data is not cached.

### getSources(countryCode: string): Promise<NewsSource[]>

Gets news sources from a JSON file by `countryCode` (2 letters country code).
Data is cached.

## Current countries

- `md` - Moldova
- `ro` - Romania
- `ru` - Russia
- `bg` - Bulgaria
- `in` - India
- `it` - Italy
- `hu` - Hungary
- `cz` - Czech Republic
- `es` - Spain

## Contributing

Files you can contribute are in `data/sources` directory.
Each file contains news sources for a single country.

You can add a new file or update existing ones.

Before commiting run `yarn validate` or `npm run validate` to validate the data.

## Auditing feeds

Feeds die and move. Two scripts help keep them current, one country at a time:

```sh
npm run tsc

# health-check every feed of a country (exits 1 if any feed is not OK)
npm run check-feeds -- ro
npm run check-feeds -- ro --json ro-report.json
npm run check-feeds -- --urls https://a1.ro/rss/,https://www.zf.ro/rss/

# look for a replacement feed when one died
npm run discover-feeds -- http://www.business24.ro/ http://evz.ro/
```

`check-feeds` reports one of `OK`, `STALE` (no item newer than 30 days),
`EMPTY_FEED`, `HTML_NOT_FEED`, `HTTP_<code>` or `NETWORK_ERROR`, plus the item
count, the newest item date and any redirect the feed now takes.

Notes from earlier audits, worth keeping in mind before disabling anything:

- **`HTTP_403` usually is not a dead feed.** Cloudflare-protected sites reject
  every scripted client, homepage included. Open the feed in a real browser
  before touching it.
- **A failure to resolve may be local.** Confirm against a public resolver
  (`dig +short @8.8.8.8 example.md`) before calling a domain gone.
- **WordPress sites that redirect `/feed/` to the homepage** often still serve
  the site-wide feed at `/feed/?post_type=post`, and category feeds
  (`/<category>/feed/`) usually work too.
- **To disable a source, empty its `feeds` array** and keep the entry, so the
  source is not rediscovered and re-added later.
- Feeds hosted on the `news.ournet.ro` / `news.click.md` rss-proxy are managed
  outside this repo; report them instead of editing them.
