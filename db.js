const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dbFile = path.join(__dirname, "classmates.db");
const isNewDatabase = !fs.existsSync(dbFile);
const db = new Database(dbFile);

if (isNewDatabase) {
  db.exec(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      message TEXT,
      message_iv TEXT
    );
  `);

  const addAccount = db.prepare(
    "INSERT INTO accounts (username, password, display_name, message) VALUES (?, ?, ?, ?)"
  );

  addAccount.run("arjun", "Football123", "Arjun", null);
  addAccount.run("meera", "SummerFun2024", "Meera", null);
  addAccount.run("kabir", "ChessMaster9", "Kabir", null);
  addAccount.run("zara", "RainbowUnicorn", "Zara", null);

  console.log("Set up a fresh classmates.db with four accounts.");
} else {
  // Add the column for older databases if it doesn't exist
  try {
    db.exec("ALTER TABLE accounts ADD COLUMN message_iv TEXT");
  } catch (e) {
    // Ignore error if the column already exists
    if (!e.message.includes("duplicate column name")) {
      console.error(e.message);
    }
  }
}

module.exports = db;
