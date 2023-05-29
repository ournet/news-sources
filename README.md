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
