import { readSourcesByCountry, NewsSource, NewsFeed } from "./data";

const sourcesMap = new Map<string, NewsSource[]>();

const getSources = async (countryCode: string): Promise<NewsSource[]> => {
  const sources = sourcesMap.get(countryCode);
  if (sources) return sources;
  return readSourcesByCountry(countryCode).then((r) => {
    sourcesMap.set(countryCode, r || []);
    return r || [];
  });
};

const getSource = (
  countryCode: string,
  id: string
): Promise<NewsSource | null> =>
  getSources(countryCode).then(
    (items) => items.find((it) => it.id === id) || null
  );

export {
  readSourcesByCountry as readSources,
  NewsFeed,
  NewsSource,
  getSources,
  getSource
};
