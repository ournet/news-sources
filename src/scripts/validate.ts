
import * as Ajv from 'ajv';
import { readFileSync } from 'fs';
import {
    SOURCES_SCHEMA_FILE_PATH,
    SOURCES_FILENAMES,
    getCountryFromSourceFileName,
    getSourcesByCountryCode,
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
        const sources = await getSourcesByCountryCode(countryCode);
        const valid = ajv.validate('sources', sources);
        if (!valid) {
            throw new Error(`Invalid file ${filename}: ${JSON.stringify(ajv.errors)}`);
        }
        for (const source of sources) {
            if (source.country !== countryCode) {
                throw new Error(`Invalid file ${filename} (country field): ${JSON.stringify(source)}`);
            }
        }
    }

    return true;
}