
import * as Ajv from 'ajv';
import { readFileSync } from 'fs';
import {
    SOURCES_SCHEMA_FILE_PATH,
    SOURCES_FILENAMES,
    getCountryFromSourceFileName,
    readSourcesByCountry,
} from '../data';

console.log('Validating sources...');

validateSources()
    .then(() => console.log('VALID sources!'))
    .catch(e => console.error(e));

async function validateSources() {
    const schema = JSON.parse(readFileSync(SOURCES_SCHEMA_FILE_PATH, 'utf8'));
    const ajv = new Ajv();
    ajv.addSchema(schema, 'sources');
    for (const filename of SOURCES_FILENAMES) {
        const countryCode = getCountryFromSourceFileName(filename);
        const sources = await readSourcesByCountry(countryCode);
        const valid = ajv.validate('sources', sources);
        if (!valid) {
            throw new Error(`Invalid file ${filename}: ${JSON.stringify(ajv.errors)}`);
        }
        for (const source of sources) {
            if (source.country !== countryCode) {
                throw new Error(`Invalid file ${filename} (country field): ${JSON.stringify(source)}`);
            }
            sources.forEach(item => {
                if (item === source) {
                    return;
                }
                if (item.id === source.id) {
                    throw new Error(`Source id must be unique by country file: ${filename} (${item.id})`);
                }
                if (item.url === source.url) {
                    throw new Error(`Source url must be unique by country file: ${filename} (${item.url})`);
                }
                source.feeds.forEach(sourceFeed => {
                    item.feeds.forEach(itemFeed => {
                        if (itemFeed.url === sourceFeed.url) {
                            throw new Error(`Source feed url must be unique: ${filename} (${item.url})`);
                        }
                    });
                });
            });
        }
    }

    return true;
}