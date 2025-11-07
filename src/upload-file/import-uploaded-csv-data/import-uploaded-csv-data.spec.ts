import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { ImportUploadedCSVData } from "./import-uploaded-csv-data.js";
import { SQLiteDatabase } from "./sqlite-database.js";

const TEST_DB_FILE = "CodeInfinity_Test2.db";
const TEST_CSV_PATH = path.resolve("test-data/sample.csv");

// Small helper: wait for SQLite to flush writes to disk
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("ImportUploadedCSVData", () => {
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
    await sleep(100);
  });

  afterEach(async () => {
    if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
    await sleep(100);
  });

  it("should import valid rows and skip invalid ones", async () => {
    const importer = new ImportUploadedCSVData();
    await importer.ImportCSVData(TEST_CSV_PATH);

    // DB is now closed and flushed — safe to reopen
    const db = new SQLiteDatabase();
    await db.initialize();

    const rows = await new Promise<any[]>((resolve, reject) => {
      db["db"].all(
        "SELECT name, surname, initials, age, dateofbirth FROM csv_import ORDER BY name",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    await db.CommitAndClose();

    expect(rows.length).toBe(3);
    const names = rows.map(r => r.name);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).toContain("Charlie");
  });

  it("should not insert duplicates on multiple imports", async () => {
    const importer = new ImportUploadedCSVData();
    await sleep(100);
    await importer.ImportCSVData(TEST_CSV_PATH);
    await sleep(100);
    await importer.ImportCSVData(TEST_CSV_PATH);

    await sleep(100);

    const db = new SQLiteDatabase();
    await sleep(100);
    await db.initialize();

    const rows = await new Promise<any[]>((resolve, reject) => {
      db["db"].all("SELECT * FROM csv_import", (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    await db.CommitAndClose();

    // UNIQUE(name, surname, dateofbirth) prevents duplicates
    expect(rows.length).toBe(3);
  });

  it("should create the database file and table automatically", async () => {
    const importer = new ImportUploadedCSVData();
    await importer.ImportCSVData(TEST_CSV_PATH);

    expect(fs.existsSync(TEST_DB_FILE)).toBe(true);

    const db = new SQLiteDatabase();
    await db.initialize();

    const hasTable = await new Promise<boolean>((resolve) => {
      db["db"].get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='csv_import';",
        (err, row) => resolve(!!row)
      );
    });

    await db.CommitAndClose();
    expect(hasTable).toBe(true);
  });
});
