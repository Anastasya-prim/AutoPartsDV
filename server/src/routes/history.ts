import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { queryAll, execute } from "../database";

const router = Router();

// GET /api/history
router.get("/", requireAuth, (req: AuthRequest, res: Response): void => {
  const rows = queryAll(
    "SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC",
    [req.user!.userId]
  );

  const history = rows.map((r) => ({
    id: r.id,
    query: r.query,
    resultsCount: r.results_count,
    createdAt: r.created_at,
  }));

  res.json({ history });
});

// DELETE /api/history  — очистить всю историю
router.delete("/", requireAuth, (req: AuthRequest, res: Response): void => {
  execute("DELETE FROM search_history WHERE user_id = ?", [req.user!.userId]);
  res.json({ message: "История очищена" });
});

// DELETE /api/history/:id  — удалить одну запись
router.delete("/:id", requireAuth, (req: AuthRequest, res: Response): void => {
  const existing = queryAll(
    "SELECT id FROM search_history WHERE id = ? AND user_id = ?",
    [req.params.id, req.user!.userId]
  );

  if (existing.length === 0) {
    res.status(404).json({ error: "Запись не найдена" });
    return;
  }

  execute("DELETE FROM search_history WHERE id = ? AND user_id = ?", [req.params.id, req.user!.userId]);
  res.json({ message: "Запись удалена" });
});

export default router;
