import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ImportUploadedCSVData } from "../upload-file/import-uploaded-csv-data/import-uploaded-csv-data.js";
import { SQLiteDatabase } from "../upload-file/import-uploaded-csv-data/sqlite-database.js";
import fs from "fs";
import path from "path";

// Utility: remove test DB if it exists
const TEST_DB_PATH = "CodeInfinity_Test2.db";
const TEST_CSV_PATH = path.resolve("test-data/sample.csv");

describe("ImportUploadedCSVData", () => {
  beforeEach(() => {
    // clean up previous test DB
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it("should import valid rows from CSV and skip invalid ones", async () => {
    const importer = new ImportUploadedCSVData();

    // This awaits initialize() + streaming + CommitAndClose()
    await importer.ImportCSVData(TEST_CSV_PATH);

    // NOW the DB is fully committed and closed → safe to reopen
    const verifier = new SQLiteDatabase();
    await verifier.initialize();

    const rows = await new Promise<any[]>((resolve, reject) => {
      verifier["db"].all("SELECT name FROM csv_import ORDER BY name", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    await verifier.CommitAndClose();

    expect(rows.length).toBe(3);
    expect(rows.map(r => r.name)).toContain("Alice");
    expect(rows.map(r => r.name)).toContain("Bob");
    expect(rows.map(r => r.name)).toContain("Charlie");
  });

  it("should handle multiple imports without crashing", async () => {
    const importer = new ImportUploadedCSVData();

    await importer.ImportCSVData(TEST_CSV_PATH);
    await importer.ImportCSVData(TEST_CSV_PATH); // run twice

    const db = new SQLiteDatabase();
    await db.initialize();

    const rows = await new Promise<any[]>((resolve, reject) => {
      db["db"].all("SELECT * FROM csv_import;", (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    // Because of UNIQUE constraint (name, surname, dateofbirth), duplicates are ignored
    expect(rows.length).toBe(3);

    await db.CommitAndClose();
  });

  it("should create database and table if not exists", async () => {
    const importer = new ImportUploadedCSVData();
    await importer.ImportCSVData(TEST_CSV_PATH);

    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

    const db = new SQLiteDatabase();
    await db.initialize();

    const hasTable = await new Promise<boolean>((resolve) => {
      db["db"].get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='csv_import';`,
        (err, row) => resolve(!!row)
      );
    });

    expect(hasTable).toBe(true);
    await db.CommitAndClose();
  });
});
