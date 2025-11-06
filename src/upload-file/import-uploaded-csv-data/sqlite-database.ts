import pkg from 'sqlite3';

export class SQLiteDatabase {
  private db: pkg.Database;
  private insertStmt?: pkg.Statement;

  constructor() {
    this.db = new pkg.Database('CodeInfinity_Test2.db', (err) => {
      if (err) {
        console.error('DB open error:', err);
        process.exit(1);
      }
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
      if (err) console.error('Insert failed:', err);
    });
  }

  public close() {
    this.insertStmt?.finalize();
    this.db.close((err) => {
      if (err) console.error('Close error:', err);
    });
  }
}