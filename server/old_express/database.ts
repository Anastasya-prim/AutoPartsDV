import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "autoparts.db");

let db: SqlJsDatabase;

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON;");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      registered_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id       TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      url      TEXT NOT NULL,
      region   TEXT NOT NULL,
      status   TEXT NOT NULL DEFAULT 'online',
      api_type TEXT NOT NULL DEFAULT 'api'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS parts (
      id            TEXT PRIMARY KEY,
      supplier_id   TEXT NOT NULL,
      brand         TEXT NOT NULL,
      article       TEXT NOT NULL,
      name          TEXT NOT NULL,
      price         REAL NOT NULL,
      quantity      INTEGER NOT NULL DEFAULT 0,
      in_stock      INTEGER NOT NULL DEFAULT 1,
      delivery_days INTEGER NOT NULL DEFAULT 0,
      is_analog     INTEGER NOT NULL DEFAULT 0,
      analog_for    TEXT,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS search_history (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      query         TEXT NOT NULL,
      results_count INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  seedData();
  saveDatabase();
  console.log("  База данных инициализирована");
}

function seedData(): void {
  const result = db.exec("SELECT COUNT(*) as cnt FROM suppliers");
  const count = result[0]?.values[0]?.[0] as number;
  if (count > 0) return;

  const suppliers = [
    ["rossko",    "Rossko",    "https://ussuri.rossko.ru", "Уссурийск",   "online",      "api"],
    ["mxgroup",   "MX Group",  "https://mxgroup.ru",       "Владивосток", "online",      "api"],
    ["autotrade", "AutoTrade", "https://autotrade.su",      "Уссурийск",   "online",      "api"],
    ["tiss",      "TISS",      "https://my.tiss.ru",        "Владивосток", "online",      "api"],
    ["autobiz",   "AutoBiz",   "https://autobiz.ru",        "Владивосток", "online",      "api"],
    ["am25",      "AM25",      "https://am25.ru",           "Владивосток", "maintenance", "scraper"],
    ["trustauto", "TrustAuto", "https://trustautovl.ru",    "Владивосток", "online",      "scraper"],
  ];

  for (const s of suppliers) {
    db.run(
      "INSERT INTO suppliers (id, name, url, region, status, api_type) VALUES (?, ?, ?, ?, ?, ?)",
      s
    );
  }

  const parts: (string | number | null)[][] = [
    ["1",  "rossko",    "TOYOTA", "48157-33062",    "Опора амортизатора передняя левая",   1350, 5,  1, 0, 0, null],
    ["2",  "mxgroup",   "TOYOTA", "48157-33062",    "Опора амортизатора передняя левая",   1280, 12, 1, 0, 0, null],
    ["3",  "autotrade", "TOYOTA", "48157-33062",    "Опора амортизатора передняя левая",   1420, 2,  1, 1, 0, null],
    ["4",  "tiss",      "TOYOTA", "48157-33062",    "Опора стойки передняя левая",         1500, 0,  0, 3, 0, null],
    ["5",  "autobiz",   "TOYOTA", "48157-33062",    "Опора амортизатора передняя левая",   1310, 8,  1, 0, 0, null],
    ["6",  "mxgroup",   "FEBEST", "TSB-ACR50F",     "Опора амортизатора передняя",         640,  25, 1, 0, 1, "48157-33062"],
    ["7",  "rossko",    "CTR",    "CVKH-109",       "Опора стойки передняя",               580,  8,  1, 0, 1, "48157-33062"],
    ["8",  "autotrade", "MASUMA", "SAM-1102",       "Опора амортизатора",                  720,  4,  1, 1, 1, "48157-33062"],
    ["9",  "trustauto", "SAT",    "ST-48157-33062", "Опора амортизатора передняя лев.",     490,  15, 1, 0, 1, "48157-33062"],
    ["10", "tiss",      "JIKIU",  "JM-12015",       "Опора передней стойки",               850,  0,  0, 5, 1, "48157-33062"],
  ];

  for (const p of parts) {
    db.run(
      "INSERT INTO parts (id, supplier_id, brand, article, name, price, quantity, in_stock, delivery_days, is_analog, analog_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      p
    );
  }

  console.log("  База заполнена начальными данными (7 поставщиков, 10 запчастей)");
}

export function saveDatabase(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDb(): SqlJsDatabase {
  return db;
}

// --- Вспомогательные обёртки для удобного API ---

export function queryAll(sql: string, params: any[] = []): Record<string, any>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, any>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(sql: string, params: any[] = []): Record<string, any> | undefined {
  const rows = queryAll(sql, params);
  return rows[0];
}

export function execute(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase();
}
