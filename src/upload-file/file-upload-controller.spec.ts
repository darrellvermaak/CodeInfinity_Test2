import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { FileUploadController } from "./file-upload-controller.js";

// Mock the ImportUploadedCSVData dependency
class MockImportUploadedCSVData {
  ImportCSVData = vi.fn().mockResolvedValue(undefined);
}

describe("FileUploadController", () => {
  let controller: FileUploadController;
  let mockImporter: MockImportUploadedCSVData;

  const boundary = "----WebKitFormBoundaryabc123";
  const uploadDir = path.resolve("src/uploads");
  const testFileName = "test.csv";
  const testFilePath = path.resolve(uploadDir, testFileName);

  beforeEach(() => {
    mockImporter = new MockImportUploadedCSVData();
    controller = new FileUploadController(mockImporter as any);

    // cleanup uploads folder
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  it("should parse multipart data, save file, and call ImportCSVData", async () => {
    const csvContent = "Name,Surname,Initials,Age,DateOfBirth\nAlice,Smith,A.S,30,01/01/1995";
    const contentType = `multipart/form-data; boundary=${boundary}`;

    const body = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="csv_file_to_upload"; filename="${testFileName}"\r\n`,
      "Content-Type: text/csv\r\n\r\n",
      csvContent,
      `\r\n--${boundary}--\r\n`,
    ].join("");

    const chunks = [Buffer.from(body)];

    const filename = await controller.SaveFile(chunks, contentType);

    // 1️⃣ Filename should be returned
    expect(filename).toBe(testFileName);

    // 2️⃣ File should exist in uploads folder
    expect(fs.existsSync(testFilePath)).toBe(true);

    // 3️⃣ Contents should match
    const written = fs.readFileSync(testFilePath, "utf8");
    expect(written).toContain("Alice,Smith");

    // 4️⃣ ImportCSVData should have been called
    expect(mockImporter.ImportCSVData).toHaveBeenCalledTimes(1);
    expect(mockImporter.ImportCSVData).toHaveBeenCalledWith(expect.stringContaining(testFileName));
  });

  it("should throw if boundary is missing from content type", async () => {
    const chunks = [Buffer.from("dummy data")];

    await expect(controller.SaveFile(chunks, "multipart/form-data")).rejects.toThrow(
      "Missing boundary"
    );
  });

  it("should throw if no file found in upload", async () => {
    const badBody = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="something_else"\r\n\r\n`,
      "no file here",
      `\r\n--${boundary}--\r\n`,
    ].join("");

    const contentType = `multipart/form-data; boundary=${boundary}`;
    const chunks = [Buffer.from(badBody)];

    await expect(controller.SaveFile(chunks, contentType)).rejects.toThrow("No file found in upload");
  });

  it("should create uploads folder if it does not exist", async () => {
    const csvContent = "Name,Surname,Initials,Age,DateOfBirth\nBob,Jones,B.J,40,06/15/1984";
    const contentType = `multipart/form-data; boundary=${boundary}`;

    const body = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="csv_file_to_upload"; filename="${testFileName}"\r\n`,
      "Content-Type: text/csv\r\n\r\n",
      csvContent,
      `\r\n--${boundary}--\r\n`,
    ].join("");

    const chunks = [Buffer.from(body)];

    // delete uploads folder before running
    if (fs.existsSync(uploadDir)) fs.rmSync(uploadDir, { recursive: true, force: true });
    expect(fs.existsSync(uploadDir)).toBe(false);

    await controller.SaveFile(chunks, contentType);

    expect(fs.existsSync(uploadDir)).toBe(true);
    expect(fs.existsSync(testFilePath)).toBe(true);
  });
});
