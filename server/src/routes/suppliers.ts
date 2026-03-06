import { Router, Request, Response } from "express";
import { AuthRequest, requireAuth, requireAdmin } from "../middleware/auth";
import { queryAll, queryOne, execute } from "../database";

const router = Router();

function formatSupplier(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    region: row.region,
    status: row.status,
    apiType: row.api_type,
  };
}

const VALID_STATUSES = ["online", "offline", "maintenance"];
const VALID_API_TYPES = ["api", "scraper"];

// GET /api/suppliers  — список (доступен всем)
router.get("/", (_req: Request, res: Response): void => {
  const rows = queryAll("SELECT * FROM suppliers ORDER BY name");
  res.json({ suppliers: rows.map(formatSupplier) });
});

// GET /api/suppliers/:id
router.get("/:id", (req: Request, res: Response): void => {
  const row = queryOne("SELECT * FROM suppliers WHERE id = ?", [req.params.id]);
  if (!row) {
    res.status(404).json({ error: "Поставщик не найден" });
    return;
  }
  res.json(formatSupplier(row));
});

// POST /api/suppliers  — создать (только admin)
router.post("/", requireAuth, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { id, name, url, region, status, apiType } = req.body;

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    res.status(400).json({ error: "id обязателен" });
    return;
  }
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name обязателен" });
    return;
  }
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url обязателен" });
    return;
  }
  if (!region || typeof region !== "string") {
    res.status(400).json({ error: "region обязателен" });
    return;
  }

  const s = status || "online";
  const at = apiType || "api";

  if (!VALID_STATUSES.includes(s)) {
    res.status(400).json({ error: `status должен быть: ${VALID_STATUSES.join(", ")}` });
    return;
  }
  if (!VALID_API_TYPES.includes(at)) {
    res.status(400).json({ error: `apiType должен быть: ${VALID_API_TYPES.join(", ")}` });
    return;
  }

  const existing = queryOne("SELECT id FROM suppliers WHERE id = ?", [id.trim()]);
  if (existing) {
    res.status(400).json({ error: "Поставщик с таким id уже существует" });
    return;
  }

  execute(
    "INSERT INTO suppliers (id, name, url, region, status, api_type) VALUES (?, ?, ?, ?, ?, ?)",
    [id.trim(), name.trim(), url.trim(), region.trim(), s, at]
  );

  const created = queryOne("SELECT * FROM suppliers WHERE id = ?", [id.trim()])!;
  res.status(201).json(formatSupplier(created));
});

// PUT /api/suppliers/:id  — обновить (только admin)
router.put("/:id", requireAuth, requireAdmin, (req: AuthRequest, res: Response): void => {
  const current = queryOne("SELECT * FROM suppliers WHERE id = ?", [req.params.id]);
  if (!current) {
    res.status(404).json({ error: "Поставщик не найден" });
    return;
  }

  const { name, url, region, status, apiType } = req.body;

  const newName = name !== undefined ? String(name).trim() : current.name as string;
  const newUrl = url !== undefined ? String(url).trim() : current.url as string;
  const newRegion = region !== undefined ? String(region).trim() : current.region as string;
  const newStatus = status !== undefined ? String(status) : current.status as string;
  const newApiType = apiType !== undefined ? String(apiType) : current.api_type as string;

  if (!VALID_STATUSES.includes(newStatus)) {
    res.status(400).json({ error: `status должен быть: ${VALID_STATUSES.join(", ")}` });
    return;
  }
  if (!VALID_API_TYPES.includes(newApiType)) {
    res.status(400).json({ error: `apiType должен быть: ${VALID_API_TYPES.join(", ")}` });
    return;
  }

  execute(
    "UPDATE suppliers SET name = ?, url = ?, region = ?, status = ?, api_type = ? WHERE id = ?",
    [newName, newUrl, newRegion, newStatus, newApiType, req.params.id]
  );

  const updated = queryOne("SELECT * FROM suppliers WHERE id = ?", [req.params.id])!;
  res.json(formatSupplier(updated));
});

// DELETE /api/suppliers/:id  — удалить (только admin)
router.delete("/:id", requireAuth, requireAdmin, (req: AuthRequest, res: Response): void => {
  const existing = queryOne("SELECT id FROM suppliers WHERE id = ?", [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: "Поставщик не найден" });
    return;
  }

  execute("DELETE FROM suppliers WHERE id = ?", [req.params.id]);
  res.json({ message: "Поставщик удалён" });
});

export default router;
