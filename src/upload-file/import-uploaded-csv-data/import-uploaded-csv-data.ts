import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { SQLiteDatabase } from "./sqlite-database.js";

export class ImportUploadedCSVData {
  private sqliteDatabase: SQLiteDatabase;

  constructor() {
    this.sqliteDatabase = new SQLiteDatabase();
  }

  public async ImportCSVData(filepath: string): Promise<void> {
    const start = Date.now();
    await this.sqliteDatabase.initialize(); // 🔑 wait until DB ready
    let count = 0;

    await new Promise<void>((resolve, reject) => {
      createReadStream(filepath)
        .pipe(parse({ columns: true, trim: true, bom: true }))
        .on('data', (row) => {
          const { Name, Surname, Initials, Age, DateOfBirth } = row;
          if (!Name || !Surname || !DateOfBirth) return;

          const [day, month, year] = DateOfBirth.split('/');
          const dob = `${year}-${month}-${day}`;
          this.sqliteDatabase.InsertPrepared(Name, Surname, Initials, Age, dob);

          if (++count % 100_000 === 0)
            console.log(`${count.toLocaleString()} rows processed...`);
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    await this.sqliteDatabase.CommitAndClose();
    console.log(`Finished in ${((Date.now() - start)/1000).toFixed(1)}s`);
  }
}
