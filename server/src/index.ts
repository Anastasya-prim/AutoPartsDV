import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { initDatabase } from "./database";

import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import searchRoutes from "./routes/search";
import partsRoutes from "./routes/parts";
import historyRoutes from "./routes/history";
import suppliersRoutes from "./routes/suppliers";

async function main() {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  console.log("Инициализация базы данных...");
  await initDatabase();

  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/parts", partsRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/suppliers", suppliersRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`\nСервер запущен: http://localhost:${PORT}`);
    console.log(`Тест API:       http://localhost:${PORT}/test.html`);
    console.log(`Health-check:   http://localhost:${PORT}/api/health`);
    console.log(`\nЭндпоинты:`);
    console.log(`  POST   /api/auth/register`);
    console.log(`  POST   /api/auth/login`);
    console.log(`  PUT    /api/auth/password`);
    console.log(`  GET    /api/profile`);
    console.log(`  PUT    /api/profile`);
    console.log(`  GET    /api/search?q=...`);
    console.log(`  GET    /api/parts/:article`);
    console.log(`  GET    /api/history`);
    console.log(`  DELETE /api/history`);
    console.log(`  DELETE /api/history/:id`);
    console.log(`  GET    /api/suppliers`);
    console.log(`  POST   /api/suppliers`);
    console.log(`  PUT    /api/suppliers/:id`);
    console.log(`  DELETE /api/suppliers/:id`);
  });
}

main().catch((err) => {
  console.error("Ошибка запуска сервера:", err);
  process.exit(1);
});
