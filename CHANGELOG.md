# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-25

A full feed audit of eight countries: `ro`, `md`, `es`, `in`, `bg`, `hu`, `cz`
and `it`. Every feed was fetched and classified, dead ones were disabled, moved
ones were repointed, and missing major outlets were added. `ru` was left
untouched.

Feed health across the audited countries, before and after:

| country | before | after |
| ------- | ------ | ----- |
| ro      | 27/36  | 44/46 |
| md      | 44/74  | 59/65 |
| es      | 29/38  | 37/41 |
| in      | 26/53  | 34/54 |
| bg      | 22/39  | 31/33 |
| hu      | 26/39  | 38/38 |
| cz      | 30/40  | 40/41 |
| it      | 33/69  | 66/68 |

### Breaking

- The `md` source id `Rupor.md` is now `rupor.md`. The old id violated the
  schema's lowercase pattern, which meant `npm run validate` could never pass
  on `md.json`. Consumers keying on the old id must remap it.
- One of the two duplicate `es` `lavanguardia.com` entries was removed. They
  were identical except that the kept one carries three feeds and the removed
  one carried only the first, so no feed is lost.
- The `hu` `naplo` source now points at haon.hu, since naplo.hu redirects
  there. Its id stays `naplo`, so its id and name no longer match.

### Added

- `check-feeds` and `discover-feeds` scripts, with the traps found during the
  audit documented in the README. `check-feeds <country>` classifies every feed
  as OK / STALE / EMPTY_FEED / HTML_NOT_FEED / HTTP_&lt;code&gt; / NETWORK_ERROR and
  exits non-zero when anything needs attention; `discover-feeds <siteUrl...>`
  looks for a replacement feed.
- 43 major outlets that were missing: g4media, news.ro, profit.ro,
  stiripesurse, spotmedia, economedia, recorder and ziare.com (`ro`); diez,
  moldova1, anticoruptie, bani.md, nordnews and sinteza (`md`); abc,
  20minutos, elconfidencial, europapress, infolibre and elcorreo (`es`);
  economictimes, livemint and deccanherald (`in`); capital.bg, fakti and sega
  (`bg`); telex, 444, magyarnemzet, mandiner and valaszonline (`hu`);
  seznamzpravy, respekt, forum24, info.cz and denikreferendum (`cz`); skytg24,
  open, ilmanifesto, linkiesta, internazionale, wired and tpi (`it`).

### Changed

- Repointed feeds that had moved, including whole-publisher migrations:
  repubblica's nine local editions (`/rss/rss2.0.xml` to
  `/rss/cronaca/rss2.0.xml`, all frozen since 2023-12-16), corriere's sections
  (to `/dynamic-feed/rss/section/`), ilsole24ore's seven renamed categories,
  firstpost's eight (to `/commonfeeds/v1/mfp/rss/`) and tribuneindia's four (to
  publish.tribuneindia.com).
- Smaller repoints across every audited country, mostly `rss.php`-era paths
  moving to `/feed/` or `/rss`, plus outlets that moved domain: rfi.ro to
  rfi.fr/ro, iprima to cnn.iprima.cz, espresso to lespresso.it.
- Swapped `news.click.md` rss-proxy feeds for the site's own feed where the
  proxy was empty or erroring (tv8, zdg, jurnal). Working proxies were left
  alone, as were all `news.ournet.ro` proxies.

### Removed

- Disabled sources with nothing left to fetch, by emptying their `feeds` array
  and keeping the entry. Causes ranged from domains that no longer resolve
  (canal3, publika, aif, vedomosti, investor.hu) through outlets that closed
  or merged (nol, magyaridok, halonoviny) to sites that dropped RSS while
  staying online (rtve, gazzetta, ilgiornale, ilpost, outlookindia, trud).
- `cz` `rozhlas` was disabled as a duplicate: its feed redirects to the one
  `irozhlas.cz` already carries, so both would ingest the same articles.

### Fixed

- `npm run validate` passes for the first time. It was blocked by a duplicate
  id in `es.json`, then by a duplicate url in `in.json`, where the
  `abplive.com` entry carried tribuneindia.com as its url.
- Feed health checks now use curl rather than node's fetch, which reported
  `UND_ERR_CONNECT_TIMEOUT` for around thirty hosts that answer in ~200ms.

### Notes

- Roughly twenty `in` feeds and a handful elsewhere still report 403 to
  scripted clients. They were each verified healthy in a real browser and left
  enabled. The block is not user-agent based, so fetching them needs a
  browser-like client or an rss-proxy.
- `kp`, `tv6.md` and `a-tv.md` (`md`) and digi24 (`ro`, not added) resolve
  publicly but are unreachable from the machine the audit ran on, so they could
  not be confirmed either way.

## [0.1.13] and earlier

No changelog was kept for these releases; see the git history.
