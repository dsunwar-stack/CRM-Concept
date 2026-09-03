import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

// The triage map (spec section 3): every stage a case passes through, with
// live case volume and average wait time so bottlenecks are visible at a
// glance. The worst-performing stage is flagged; clicking a flagged stage
// reveals why. This reads demo/synthetic stage stats only — never real
// case records — consistent with the data-light architecture in section 7.
router.get("/", (req, res) => {
  const data = db.get();
  const schemaId = req.query.schemaId;
  let stages = data.triageStages;
  if (schemaId) stages = stages.filter((s) => s.schemaId === schemaId);
  stages = [...stages].sort((a, b) => a.order - b.order);

  const worst = stages.reduce(
    (max, s) => (s.avgWaitDays > (max?.avgWaitDays ?? -Infinity) ? s : max),
    null
  );

  const withFlags = stages.map((s) => ({
    ...s,
    isBottleneck: worst ? s.id === worst.id && s.avgWaitDays > 0 : false,
  }));

  res.json({ stages: withFlags });
});

export default router;
