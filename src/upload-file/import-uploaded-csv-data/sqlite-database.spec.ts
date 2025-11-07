import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { SQLiteDatabase } from "./sqlite-database.js";

const TEST_DB_FILE = "CodeInfinity_Test2.db";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("SQLiteDatabase", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
  });

  it("should create the database file and table on initialize", async () => {
    const db = new SQLiteDatabase();
    await db.initialize();

    expect(fs.existsSync(TEST_DB_FILE)).toBe(true);

    // Verify table creation
    const hasTable = await new Promise<boolean>((resolve, reject) => {
      db["db"].get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='csv_import';",
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });

    expect(hasTable).toBe(true);
    await db.CommitAndClose();
  });

  it("should insert rows using InsertPrepared and commit successfully", async () => {
    const db = new SQLiteDatabase();
    await db.initialize();

    db.InsertPrepared("Alice", "Smith", "A.S", 30, "1995-01-01");
    db.InsertPrepared("Bob", "Jones", "B.J", 40, "1984-06-15");

    await db.CommitAndClose();

    const sqlite3 = await import("sqlite3");
    const verifyDb = new sqlite3.Database(TEST_DB_FILE);

    const rows = await new Promise<any[]>((resolve, reject) => {
      verifyDb.all("SELECT * FROM csv_import", (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveProperty("name", "Alice");
    expect(rows[1]).toHaveProperty("surname", "Jones");

    verifyDb.close();
  });

  it("should enforce unique constraint on (name, surname, dateofbirth)", async () => {
    const db = new SQLiteDatabase();
    await db.initialize();

    // First insert succeeds
    db.InsertPrepared("Charlie", "Brown", "C.B", 50, "1974-05-05");

    // Duplicate (same name, surname, dateofbirth) should be silently ignored
    db.InsertPrepared("Charlie", "Brown", "C.B", 51, "1974-05-05");

    await db.CommitAndClose();

    const sqlite3 = await import("sqlite3");
    const verifyDb = new sqlite3.Database(TEST_DB_FILE);

    const rows = await new Promise<any[]>((resolve, reject) => {
      verifyDb.all("SELECT * FROM csv_import", (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    expect(rows.length).toBe(1); // unique constraint works
    expect(rows[0].age).toBe(50); // original row kept
    verifyDb.close();
  });

  it("should handle commit and close even if no inserts were made", async () => {
    const db = new SQLiteDatabase();
    await db.initialize();

    // No InsertPrepared called
    await db.CommitAndClose();

    expect(fs.existsSync(TEST_DB_FILE)).toBe(true);
  });

  it("should not crash if InsertPrepared is called before initialize", async () => {
    const db = new SQLiteDatabase();

    // This should only warn, not throw
    db.InsertPrepared("Test", "User", "T.U", 25, "2000-01-01");

    await db.initialize();
    await db.CommitAndClose();

    expect(fs.existsSync(TEST_DB_FILE)).toBe(true);
  });
});
