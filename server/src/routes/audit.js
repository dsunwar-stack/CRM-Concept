import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (_req, res) => {
  const data = db.get();
  const log = [...data.auditLog].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ log });
});

export default router;
