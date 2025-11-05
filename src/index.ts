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
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { statSync, createReadStream, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';

console.log("Hello, CodeInfinity Test 2!");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = resolve(__dirname, "public");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function sendFile(res: ServerResponse, filePath: string, ext: string) {
  try {
    const stats = statSync(filePath);
    const stream = createReadStream(filePath);

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Content-Length": stats.size,
      // Optional: enable caching for static assets
      // 'Cache-Control': 'public, max-age=31536000',
    });

    stream.pipe(res);
    stream.on("error", () => send404(res));
  } catch (err) {
    send404(res);
  }
}

function send404(res: ServerResponse) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 - Not Found");
}

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];
  req.on('data', chunk => chunks.push(chunk as Buffer));

  req.on('end', async () => {
    try {
      const contentType = req.headers['content-type'];
      if (!contentType?.includes('multipart/form-data')) {
        throw new Error('Invalid Content-Type');
      }

      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) throw new Error('Missing boundary');
      const boundary = `--${boundaryMatch[1]}`;
      const boundaryBuffer = Buffer.from(boundary);

      const body = Buffer.concat(chunks);
      let start = 0;
      const parts: Buffer[] = [];
      let pos = body.indexOf(boundaryBuffer, start);

      while (pos !== -1) {
        const next = body.indexOf(boundaryBuffer, pos + boundaryBuffer.length);
        if (next === -1) break;
        const part = body.slice(pos + boundaryBuffer.length + 2, next - 2);
        if (part.length > 0) parts.push(part);
        pos = next;
      }

      let filename: string | null = null;
      let fileData: Buffer | null = null;

      for (const part of parts) {
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;

        const headers = part.slice(0, headerEnd).toString('utf8');
        const content = part.slice(headerEnd + 4);

        const match = headers.match(/name="csv_file_to_upload"; filename="([^"]+)"/);
        if (match) {
          filename = match[1] as string;
          fileData = content;
          break;
        }
      }

      if (!filename || !fileData) {
        throw new Error('No file found in upload');
      }

      const uploadDir = resolve(__dirname, 'uploads');
      mkdirSync(uploadDir, { recursive: true });
      const filePath = resolve(uploadDir, filename);

      // Use writeFileSync (synchronous, safe here)
      writeFileSync(filePath, fileData);

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`File "${filename}" uploaded successfully.`);
    } catch (err: any) {
      console.error('Upload error:', err);
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Upload failed: ${err.message}`);
    }
  });
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Basic security: disallow paths that try to escape public/
  const rawUrl = req.url ?? "/";
  const safeUrl = decodeURIComponent(rawUrl).replace(/\.\./g, "");
  const filePath = resolve(
    PUBLIC_DIR,
    safeUrl === "/" ? "index.html" : safeUrl.slice(1)
  );

  // Add this inside createServer callback, after static file logic
  if (req.method === "POST" && req.url === "/submit") {
    handleUpload(req, res);
    return;
  }
  // Ensure the requested file is inside public/
  if (!filePath.startsWith(PUBLIC_DIR)) {
    send404(res);
    return;
  }

  const ext = extname(filePath).toLowerCase();

  if (!existsSync(filePath)) {
    // If the exact file doesn't exist but it's a clean URL,
    // fall back to index.html (SPA-style routing)
    if (!ext && rawUrl.endsWith("/")) {
      sendFile(res, resolve(PUBLIC_DIR, "index.html"), ".html");
    } else {
      send404(res);
    }
    return;
  }

  // Serve the file
  sendFile(res, filePath, ext);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(
    `Open the URL in your browser and click "Generate & Save 1M Rows".`
  );
});
