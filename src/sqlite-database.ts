import { Database } from 'sqlite3';
import { createReadStream } from 'fs';
// import { parse } from 'csv-parser';

export class SQLiteDatabase {
    private db = new Database('CodeInfinity_Test2.db');

    constructor() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS csv_import (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                surname TEXT,
                initials TEXT,
                age INTEGER,
                dateofbirth TEXT
            )`);
        });
    }

    public InsertData(name: string, surname: string, initials: string, age: number, dateofbirth: Date): void {
        const query = `INSERT INTO csv_import (name, surname, initials, age, dateofbirth) VALUES (?, ?, ?, ?, ?)`;
        this.db.run(query, [name, surname, initials, age, dateofbirth.toISOString()], function(err) {
            if (err) {
                return console.error('Error inserting data:', err.message);
            }
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
    }

// const db = new Database('mydatabase.db');

// // Create the table if it doesn't exist
// db.exec(`CREATE TABLE IF NOT EXISTS menuItems (
//   itemName TEXT,
//   itemDescription TEXT,
//   unitPrice REAL
// )`);

// // Prepare the insert statement
// const insertStatement = db.prepare(
//   `INSERT INTO menuItems (itemName, itemDescription, unitPrice) VALUES (?, ?, ?)`
// );

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
// db.serialize(() => {
//   db.run("BEGIN TRANSACTION;");
//   // The rest of the stream processing happens asynchronously
// });   
}