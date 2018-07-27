import { join } from "path";
import { readdirSync, readFile } from "fs";

export const SOURCES_SCHEMA_FILE_PATH = join(__dirname, '..', 'data', 'sources-schema-v0.json');
export const SOURCES_DIR_PATH = join(__dirname, '..', 'data', 'sources');
export const SOURCES_FILENAMES = readdirSync(SOURCES_DIR_PATH).filter(filename => /^[a-z]{2}\.json$/.test(filename));
export const SOURCES_COUNTRIES = SOURCES_FILENAMES.map(filename => getCountryFromSourceFileName(filename));

export function formatSourcesFilePath(countryCode: string) {
    return join(SOURCES_DIR_PATH, `${countryCode}.json`);
}

export function getCountryFromSourceFileName(filename: string) {
    return filename.split(/\./)[0];
}

export function getSourcesByCountryCode(countryCode: string) {
    return new Promise<NewsSource[]>((resolve, reject) => {
        readFile(formatSourcesFilePath(countryCode), 'utf8', (error, data) => {
            if (error) {
                return reject(error);
            }
            resolve(JSON.parse(data) as NewsSource[]);
        });
    })
}

export type NewsSource = {
    id: string
    name: string
    url: string
    country: string
    languages: string[]
    feeds: NewsFeed[]
}

export type NewsFeed = {
    url: string
    language: string
}
