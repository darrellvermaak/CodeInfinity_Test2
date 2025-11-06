import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { SQLiteDatabase } from "./sqlite-database.js";

export class ImportUploadedCSVData {
    private sqliteDatabase: SQLiteDatabase;
    constructor() {
        this.sqliteDatabase = new SQLiteDatabase();
    }
    public async ImportCSVData(filepath: string): Promise<void> {
        let count = 0;
        await new Promise<void>((resolve, reject) => {
          // Read the CSV file and process it
          createReadStream(filepath)
            .pipe(parse({ columns: true, trim: true, bom: true })) // Adjust separator as needed
            .on('data', (row) => {
              // console.log(row);
              const { Name, Surname, Initials, Age, DateOfBirth } = row;
              if (!Name || !Surname || !DateOfBirth) return; // skip invalid
              // console.log(DateOfBirth);
              const [day, month, year] = DateOfBirth.split('/');
              const dob = `${year}-${month}-${day}`;
              // Execute the prepared statement for each row within the transaction
              this.sqliteDatabase.InsertPrepared(Name, Surname, Initials, Age, dob);
              if (++count % 100_000 === 0) console.log(`${count.toLocaleString()} rows processed...`);
            })
            .on('end', () => {
              resolve()
              // this.sqliteDatabase.FinalizeInsertions();
              // Finalize the statement and end the transaction
              // insertStatement.finalize();
              // db.run("END;", () => {
              //   console.log("CSV file successfully processed and inserted.");
              //   db.close();
              // });
            })
            .on('error', (err) => {
              console.error('Error:', err);
              reject;
          });
        });
        await this.sqliteDatabase.CommitAndClose();
    }

// // Wrap the entire process in a serialize block for sequential execution

}