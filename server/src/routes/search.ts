import { Router, Response } from "express";
import { v4 as uuid } from "uuid";
import { AuthRequest, optionalAuth } from "../middleware/auth";
import { queryAll, execute } from "../database";

const router = Router();

function formatResult(row: Record<string, any>) {
  return {
    id: row.id,
    supplier: {
      id: row.supplier_id,
      name: row.supplier_name,
      url: row.supplier_url,
      region: row.supplier_region,
      status: row.supplier_status,
    },
    brand: row.brand,
    article: row.article,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    inStock: row.in_stock === 1,
    deliveryDays: row.delivery_days,
    isAnalog: row.is_analog === 1,
    analogFor: row.analog_for,
  };
}

const SEARCH_SQL = `
  SELECT p.*,
         s.name   AS supplier_name,
         s.url    AS supplier_url,
         s.region AS supplier_region,
         s.status   AS supplier_status,
         s.api_type AS supplier_api_type
  FROM parts p
  JOIN suppliers s ON s.id = p.supplier_id
  WHERE LOWER(p.article) LIKE ? OR LOWER(p.name) LIKE ? OR LOWER(p.brand) LIKE ?
`;

// GET /api/search?q=...
router.get("/", optionalAuth, (req: AuthRequest, res: Response): void => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    res.status(400).json({ error: "Параметр q обязателен" });
    return;
  }
  if (q.length > 100) {
    res.status(400).json({ error: "Запрос слишком длинный (макс. 100 символов)" });
    return;
  }

  const pattern = `%${q.toLowerCase()}%`;
  const rows = queryAll(SEARCH_SQL, [pattern, pattern, pattern]);

  const results = rows.map(formatResult);
  const exact = results.filter((r) => !r.isAnalog);
  const analogs = results.filter((r) => r.isAnalog);

  if (req.user) {
    execute(
      "INSERT INTO search_history (id, user_id, query, results_count, created_at) VALUES (?, ?, ?, ?, ?)",
      [uuid(), req.user.userId, q, results.length, new Date().toISOString()]
    );
  }

  res.json({ query: q, total: results.length, exact, analogs });
});

export default router;