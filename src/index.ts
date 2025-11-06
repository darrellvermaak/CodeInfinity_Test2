// import { fileURLToPath } from "url";
// import { join, dirname } from "path";
// import { CSVFileGeneration } from "./csv-file-generation.js";

// console.log("Hello, CodeInfinity Test 2!");
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const csvFileGeneration = new CSVFileGeneration();
// const csvData = csvFileGeneration.GenerateCSVData(1000000);
// const fs = await import('fs');
// const filePath = join(__dirname, 'generated_data.csv');
// fs.writeFileSync(filePath, csvData);
// console.log(filePath);
// server.ts
import { CloudInfinityServer } from "./server.js";

console.log("Hello, CodeInfinity Test 2!");

CloudInfinityServer.StartServer();