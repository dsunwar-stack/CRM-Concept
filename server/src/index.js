import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./seed.js";
import authRoutes from "./routes/auth.js";
import schemaRoutes from "./routes/schemas.js";
import overrideRoutes from "./routes/overrides.js";
import triageRoutes from "./routes/triage.js";
import auditRoutes from "./routes/audit.js";
import aiRoutes from "./routes/ai.js";

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, product: "Caseflow" }));

app.use("/api/auth", authRoutes);
app.use("/api/schemas", schemaRoutes);
app.use("/api", overrideRoutes);
app.use("/api/triage", triageRoutes);
app.use("/api/audit-log", auditRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Caseflow API listening on http://localhost:${PORT}`);
});
