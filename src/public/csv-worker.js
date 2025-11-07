import { CSVGenerator } from './generate-csv.js';

const generator = new CSVGenerator();

onmessage = (event) => {
    const { count } = event.data;
    const csv = generator.generateCSV(count);
    postMessage({ csv });
};