# news-sources

A repository of news sources for every country. Data is stored in JSON files.

## Node.js usage

```ts
import { readSources } from 'news-sources'
const sources = await readSources('ru'); // Russian sources
```

## Node.js API

### readSources(countryCode: string): Promise<NewsSource[]>

Reads news sources from a JSON file by `countryCode` (2 letters country code).
Data is not cached.

## Current countries

- `md` - Moldova
- `ro` - Romania
- `ru` - Russia
- `bg` - Bulgaria

## Contributing

Files you can contribute are in `data/sources` directory.
Each file contains news sources in a single country.

You can add a new file or update existing ones.

Before commiting run `yarn validate` or `npm run validate` to validate the data.
