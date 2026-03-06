import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { queryOne, execute } from "../database";
import { generateToken } from "../middleware/auth";

const router = Router();

function formatUser(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    registeredAt: row.registered_at,
  };
}

// POST /api/auth/register
router.post("/register", (req: Request, res: Response): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Имя обязательно (минимум 2 символа)" });
    return;
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Укажите корректный email" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Пароль должен быть не менее 6 символов" });
    return;
  }

  const existing = queryOne("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
  if (existing) {
    res.status(400).json({ error: "Email уже зарегистрирован" });
    return;
  }

  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  const registeredAt = new Date().toISOString();

  execute(
    "INSERT INTO users (id, name, email, password_hash, role, registered_at) VALUES (?, ?, ?, ?, 'user', ?)",
    [id, name.trim(), email.toLowerCase().trim(), passwordHash, registeredAt]
  );

  const user = queryOne("SELECT * FROM users WHERE id = ?", [id])!;
  const token = generateToken({ userId: user.id as string, role: user.role as string });

  res.status(201).json({ user: formatUser(user), token });
});

// POST /api/auth/login
router.post("/login", (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Заполните email и пароль" });
    return;
  }

  const user = queryOne("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);

  if (!user || !bcrypt.compareSync(password, user.password_hash as string)) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  const token = generateToken({ userId: user.id as string, role: user.role as string });
  res.json({ user: formatUser(user), token });
});

export default router;
