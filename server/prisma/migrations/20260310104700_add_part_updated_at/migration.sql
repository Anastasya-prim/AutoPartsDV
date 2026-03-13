-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "in_stock" INTEGER NOT NULL DEFAULT 1,
    "delivery_days" INTEGER NOT NULL DEFAULT 0,
    "is_analog" INTEGER NOT NULL DEFAULT 0,
    "analog_for" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_parts" ("analog_for", "article", "brand", "delivery_days", "id", "in_stock", "is_analog", "name", "price", "quantity", "supplier_id") SELECT "analog_for", "article", "brand", "delivery_days", "id", "in_stock", "is_analog", "name", "price", "quantity", "supplier_id" FROM "parts";
DROP TABLE "parts";
ALTER TABLE "new_parts" RENAME TO "parts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
