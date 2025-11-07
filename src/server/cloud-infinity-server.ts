import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { resolve, extname } from "node:path";
import { createReadStream, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { FileUploadHandler } from "../upload-file/file-upload-handler.js";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename).replace('/server', '');

const PUBLIC_DIR = resolve(__dirname, "public");
const PORT = Number(process.env.PORT) || 3000;

export class CloudInfinityServer {
  constructor(
    private fileUploadHandler: FileUploadHandler = new FileUploadHandler()
  ) {}

  public StartServer(): void {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.method === "POST" && req.url === "/submit") {
        this.fileUploadHandler.HandleUpload(req, res);
        return;
      }

      this.handleGet(req, res);
    });

    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(
            `Open the URL in your browser and click "Generate & Save 1M Rows".`
        );
    });
  }

  private async handleGet(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const rawUrl = req.url ?? "/";
    const filePath = this.makeSafeURL(rawUrl);
    // Ensure the requested file is inside public/
    if (!filePath.startsWith(PUBLIC_DIR)) {
      this.send404(res);
      return;
    }

    const ext = extname(filePath).toLowerCase();

    if (!existsSync(filePath)) {
      // If the exact file doesn't exist but it's a clean URL,
      // fall back to index.html (SPA-style routing)
      if (!ext && rawUrl.endsWith("/")) {
        this.sendFile(res, resolve(PUBLIC_DIR, "index.html"), ".html");
      } else {
        this.send404(res);
      }
      return;
    }

    this.sendFile(res, filePath, ext);
  }

  private makeSafeURL(reqUrl: string): string {
    // Basic security: disallow paths that try to escape public/
    const rawUrl = reqUrl;
    const safeUrl = decodeURIComponent(rawUrl).replace(/\.\./g, "");
    const filePath = resolve(
      PUBLIC_DIR,
      safeUrl === "/" ? "index.html" : safeUrl.slice(1)
    );
    return filePath;
  }

  private send404(res: ServerResponse): void {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 - Not Found");
  }

  private sendFile(res: ServerResponse, filePath: string, ext: string): void {
    try {
      const stats = statSync(filePath);
      const stream = createReadStream(filePath);

      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Content-Length": stats.size,
        // 'Cache-Control': 'public, max-age=31536000',  // enable caching for static assets - disabled for development
      });

      stream.pipe(res);
      stream.on("error", () => this.send404(res));
    } catch (err) {
      this.send404(res);
    }
  }
}
