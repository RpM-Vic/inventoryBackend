import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const __dirname=process.cwd()

const dbPath = path.resolve(__dirname, './data/db.sqlite3');

const db = new Database(dbPath);

db.exec('PRAGMA journal_mode = WAL;');

db.exec('PRAGMA foreign_keys = ON;');

export default db;