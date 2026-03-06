import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { queryOne, execute } from "../database";

const router = Router();

// GET /api/profile
router.get("/", requireAuth, (req: AuthRequest, res: Response): void => {
  const user = queryOne(
    "SELECT id, name, email, role, registered_at FROM users WHERE id = ?",
    [req.user!.userId]
  );

  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    registeredAt: user.registered_at,
  });
});

// PUT /api/profile
router.put("/", requireAuth, (req: AuthRequest, res: Response): void => {
  const { name, email } = req.body;
  const userId = req.user!.userId;

  const current = queryOne("SELECT * FROM users WHERE id = ?", [userId]);
  if (!current) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  const newName = name !== undefined ? String(name).trim() : current.name as string;
  const newEmail = email !== undefined ? String(email).toLowerCase().trim() : current.email as string;

  if (newName.length < 2) {
    res.status(400).json({ error: "Имя — минимум 2 символа" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    res.status(400).json({ error: "Укажите корректный email" });
    return;
  }

  if (newEmail !== current.email) {
    const taken = queryOne("SELECT id FROM users WHERE email = ? AND id != ?", [newEmail, userId]);
    if (taken) {
      res.status(400).json({ error: "Этот email уже занят" });
      return;
    }
  }

  execute("UPDATE users SET name = ?, email = ? WHERE id = ?", [newName, newEmail, userId]);

  const updated = queryOne(
    "SELECT id, name, email, role, registered_at FROM users WHERE id = ?",
    [userId]
  )!;

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    registeredAt: updated.registered_at,
  });
});

export default router;
