import { CSVGenerator } from './generate-csv.js';

console.log('✅ csvWorker.js loaded');
const generator = new CSVGenerator();

onmessage = (event) => {
    const { count } = event.data;
    const csv = generator.generateCSV(count);
    postMessage({ csv });
};