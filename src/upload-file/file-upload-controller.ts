import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { ImportUploadedCSVData } from "./import-uploaded-csv-data/import-uploaded-csv-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename).replace("/upload-file", "");

export class FileUploadController {
  constructor(
    private importUploadedCSVData: ImportUploadedCSVData = new ImportUploadedCSVData()
  ) {}

  public async SaveFile(chunks: Buffer[], contentType: string): Promise<string> {
    const boundaryBuffer = this.getBoundaryBuffer(contentType);
    const body = Buffer.concat(chunks);
    const bodyParts: Buffer[] = this.makeParts(body, boundaryBuffer);

    const { filename, fileData } = this.parseBodyParts(bodyParts);

    const filepath = this.writeFileToUploads(filename, fileData);
    await this.importUploadedCSVData.ImportCSVData(filepath);

    return filename;
  }

  private getBoundaryBuffer(contentType: string): Buffer<ArrayBuffer> {
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) throw new Error("Missing boundary");
    const boundary = `--${boundaryMatch[1]}`;
    const boundaryBuffer = Buffer.from(boundary);
    return boundaryBuffer;
  }

  private makeParts(
    body: Buffer<ArrayBuffer>,
    boundaryBuffer: Buffer<ArrayBuffer>
  ): Buffer<ArrayBufferLike>[] {
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
    return parts;
  }

  private parseBodyParts(parts: Buffer<ArrayBufferLike>[]): {
    filename: string;
    fileData: Buffer;
  } {
    let filename: string | null = null;
    let fileData: Buffer | null = null;

    for (const part of parts) {
      const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
      if (headerEnd === -1) continue;

      const headers = part.slice(0, headerEnd).toString("utf8");
      const content = part.slice(headerEnd + 4);

      const match = headers.match(
        /name="csv_file_to_upload"; filename="([^"]+)"/
      );
      if (match) {
        filename = match[1] as string;
        fileData = content;
        break;
      }
    }

    if (!filename || !fileData) {
      throw new Error("No file found in upload");
    }

    return { filename, fileData };
  }

  private writeFileToUploads(filename: string, fileData: Buffer): string {
    const uploadDir = resolve(__dirname, "uploads");
    mkdirSync(uploadDir, { recursive: true });
    const filePath = resolve(uploadDir, filename);

    // Use writeFileSync (synchronous, safe here)
    writeFileSync(filePath, fileData);
    return filePath;
  }
}
