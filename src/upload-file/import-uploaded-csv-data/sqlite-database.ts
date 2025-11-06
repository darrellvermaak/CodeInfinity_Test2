import pkg from 'sqlite3';

export class SQLiteDatabase {
  private db: pkg.Database;
  private insertStmt?: pkg.Statement;
  private insertedCount = 0;

  constructor() {
    this.db = new pkg.Database('CodeInfinity_Test2.db', (err) => {
      if (err) {
        console.error('DB open error:', err);
        throw err;
      }
      // MAX SPEED SETTINGS
      this.db.exec(`
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA cache_size = 1000000;
        PRAGMA locking_mode = EXCLUSIVE;
        PRAGMA temp_store = MEMORY;
      `);
      console.log('Hello, CodeInfinity Test 2!');
      this.setupDatabase();
    });
  }

  private setupDatabase() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS csv_import (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        initials TEXT,
        age INTEGER,
        dateofbirth TEXT NOT NULL,
        UNIQUE(name, surname, dateofbirth)
      );
    `;

    this.db.exec(createTable, (err) => {
      if (err) {
        console.error('Table creation failed:', err);
        return;
      }

      // Begin transaction once
      this.db.exec('BEGIN TRANSACTION;');

      const stmt = this.db.prepare(
        'INSERT INTO csv_import (name, surname, initials, age, dateofbirth) VALUES (?, ?, ?, ?, ?)'
      );

      stmt.run = stmt.run.bind(stmt); // ensure correct this
      this.insertStmt = stmt;
    });
  }

  public InsertPrepared(
    name: string,
    surname: string,
    initials: string,
    age: number,
    dateofbirth: string
  ) {
    if (!this.insertStmt) {
      console.warn('DB not ready yet');
      return;
    }
    this.insertStmt.run(name, surname, initials, age, dateofbirth, (err: any) => {
      if (err) {
        // console.error('Insert failed:', err);
      } else {
        this.insertedCount++;
      }
    });
  }

  public async CommitAndClose(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.insertStmt?.finalize();
      this.db.exec('COMMIT;', (err) => {
        if (err) return reject(err);
        // Get real row count
        

        console.log(`${this.insertedCount.toLocaleString()} rows inserted at warp speed!`);

        this.db.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}