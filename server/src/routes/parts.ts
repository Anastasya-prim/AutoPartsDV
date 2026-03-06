import { Router, Request, Response } from "express";
import { queryAll } from "../database";

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

const PARTS_SQL = `
  SELECT p.*,
         s.name   AS supplier_name,
         s.url    AS supplier_url,
         s.region AS supplier_region,
         s.status AS supplier_status
  FROM parts p
  JOIN suppliers s ON s.id = p.supplier_id
  WHERE p.article = ?
`;

const ANALOGS_SQL = `
  SELECT p.*,
         s.name   AS supplier_name,
         s.url    AS supplier_url,
         s.region AS supplier_region,
         s.status AS supplier_status
  FROM parts p
  JOIN suppliers s ON s.id = p.supplier_id
  WHERE p.is_analog = 1 AND p.analog_for = ? AND p.article != ?
`;

// GET /api/parts/:article
router.get("/:article", (req: Request, res: Response): void => {
  const article = decodeURIComponent(req.params.article);

  const offerRows = queryAll(PARTS_SQL, [article]);
  const offers = offerRows.map(formatResult);

  const originalArticle =
    offers.length > 0 && offers[0].isAnalog && offers[0].analogFor
      ? offers[0].analogFor
      : article;

  const analogRows = queryAll(ANALOGS_SQL, [originalArticle, article]);
  const analogs = analogRows.map(formatResult);

  if (offers.length === 0 && analogs.length === 0) {
    res.status(404).json({ error: "По артикулу ничего не найдено" });
    return;
  }

  res.json({ article, offers, analogs });
});

export default router;
