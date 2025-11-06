import {IncomingMessage, ServerResponse } from "node:http";
import { FileUploadController } from "./file-upload-controller.js";

export class FileUploadHandler {
  constructor(
    private fileUploadController = new FileUploadController()
  ) {}
  public async HandleUpload(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));

    req.on("end", async () => {
      try {
        const contentType = this.getValidContentType(req);

        const filename = this.fileUploadController.SaveFile(chunks, contentType)

        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`File "${filename}" uploaded successfully.`);
      } catch (err: any) {
        console.error("Upload error:", err);
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Upload failed: ${err.message}`);
      }
    });
  }

  private getValidContentType(req: IncomingMessage): string {
    const contentType = req.headers["content-type"];
    if (!contentType?.includes("multipart/form-data")) {
      throw new Error("Invalid Content-Type");
    }
    return contentType;
  }


}