import { Database, Statement } from 'sqlite3';
import { createReadStream } from 'fs';
// import { parse } from 'csv-parser';

export class SQLiteDatabase {
    private db = new Database('CodeInfinity_Test2.db');
    private insertStatement: Statement;

    constructor() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS csv_import (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                surname TEXT,
                initials TEXT,
                age INTEGER,
                dateofbirth DATE
            )`);
        });

        this.insertStatement = this.db.prepare(
            `INSERT INTO csv_import (name, surname, initials, age, dateofbirth) VALUES (?, ?, ?, ?, ?)`
        );

        this.db.serialize(() => {
            this.db.run("BEGIN TRANSACTION;");
        });   
    }

    public InsertData(name: string, surname: string, initials: string, age: number, dateofbirth: Date): void {
        const query = `INSERT INTO csv_import (name, surname, initials, age, dateofbirth) VALUES (?, ?, ?, ?, ?)`;
        this.db.run(query, [name, surname, initials, age, dateofbirth], function(err) {
            if (err) {
                return console.error('Error inserting data:', err.message);
            }
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
    }

    public InsertPrepared(name: string, surname: string, initials: string, age: number, dateofbirth: Date): void {
        this.insertStatement.run([name, surname, initials, age, dateofbirth], function(err) {
            if (err) {
                return console.error('Error inserting data with prepared statement:', err.message);
            }
            console.log(`A row has been inserted with rowid ${this.lastID} using prepared statement`);
        });
    }

    public FinalizeInsertions(): void {
        this.insertStatement.finalize();
        this.db.run("END;", () => {
            console.log("All data successfully inserted.");
            this.db.close();
        });
    }

// // Read the CSV file and process it
// createReadStream('path/to/your/file.csv')
//   .pipe(parse({ separator: ',' })) // Adjust separator as needed
//   .on('data', (row) => {
//     // Execute the prepared statement for each row within the transaction
//     insertStatement.run(row.itemName, row.itemDescription, parseFloat(row.unitPrice));
//   })
//   .on('end', () => {
//     // Finalize the statement and end the transaction
//     insertStatement.finalize();
//     db.run("END;", () => {
//       console.log("CSV file successfully processed and inserted.");
//       db.close();
//     });
//   });

// // Wrap the entire process in a serialize block for sequential execution
}