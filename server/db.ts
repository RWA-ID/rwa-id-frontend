import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    merkle_root TEXT NOT NULL,
    entries TEXT NOT NULL,
    tree_data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

export const db = drizzle(sqlite, { schema });
export { sqlite };
