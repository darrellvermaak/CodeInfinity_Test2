import pkg from 'sqlite3';

export class SQLiteDatabase {
  private db!: pkg.Database;
  private insertStmt?: pkg.Statement;
  private insertedCount = 0;

  public async initialize(): Promise<void> {
    this.db = await new Promise((resolve, reject) => {
      const db = new pkg.Database('CodeInfinity_Test2.db', (err) => {
        if (err) return reject(err);
        resolve(db);
      });
    });

    await this.execAsync(`
      PRAGMA journal_mode = OFF;
      PRAGMA synchronous = OFF;
      PRAGMA cache_size = 1000000;
      PRAGMA locking_mode = EXCLUSIVE;
      PRAGMA temp_store = MEMORY;
    `);

    await this.execAsync(`
      CREATE TABLE IF NOT EXISTS csv_import (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        initials TEXT,
        age INTEGER,
        dateofbirth TEXT NOT NULL,
        UNIQUE(name, surname, dateofbirth)
      );
    `);

    await this.execAsync('BEGIN TRANSACTION;');

    this.insertStmt = this.db.prepare(
      'INSERT INTO csv_import (name, surname, initials, age, dateofbirth) VALUES (?, ?, ?, ?, ?)'
    );

    console.log('SQLite initialized and transaction started.');
  }

  private execAsync(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
  }

  public InsertPrepared(
    name: string,
    surname: string,
    initials: string,
    age: number,
    dateofbirth: string
  ): void {
    if (!this.insertStmt) {
      console.warn('Insert attempted before statement ready.');
      return;
    }

    this.insertStmt.run(name, surname, initials, age, dateofbirth, (err: any) => {
      if (err) {
        // optionally handle unique constraint violation silently
      } else {
        this.insertedCount++;
      }
    });
  }

  public async CommitAndClose(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.insertStmt) return resolve();

      this.insertStmt.finalize((err) => {
        if (err) return reject(err);

        this.db.exec('COMMIT;', (err) => {
          if (err) return reject(err);

          console.log(`${this.insertedCount.toLocaleString()} rows inserted!`);

          this.db.close((err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });
  }
}
