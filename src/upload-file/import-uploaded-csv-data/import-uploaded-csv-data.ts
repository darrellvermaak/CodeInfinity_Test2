import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { SQLiteDatabase } from "./sqlite-database.js";

export class ImportUploadedCSVData {
    private sqliteDatabase: SQLiteDatabase;
    constructor() {
        this.sqliteDatabase = new SQLiteDatabase();
    }
    public ImportCSVData(filepath: string) {
        // Read the CSV file and process it
        createReadStream(filepath)
          .pipe(parse({ columns: true, trim: true })) // Adjust separator as needed
          .on('data', (row) => {
            // console.log(row);
            const { Name, Surname, Initials, Age, DateOfBirth } = row;
            // console.log(DateOfBirth);
            const [day, month, year] = DateOfBirth.split('/');
            const dob = `${year}-${month}-${day}`;
            // Execute the prepared statement for each row within the transaction
            this.sqliteDatabase.InsertPrepared(Name, Surname, Initials, Age, dob);
          })
          .on('end', () => {
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
          });
    }

// // Wrap the entire process in a serialize block for sequential execution

}