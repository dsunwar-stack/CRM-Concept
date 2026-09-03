import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { COMPONENTS, NIELSEN_HEURISTICS } from "../rulesEngine.js";

const router = Router();

router.get("/heuristics", (_req, res) => {
  res.json({ heuristics: NIELSEN_HEURISTICS, components: Object.values(COMPONENTS) });
});

// The expert override system (spec section 6): the rules-engine default is
// strong and not editable by standard users. A small, defined group of
// expert users may override a field's component choice, but only through
// this guided justification flow — never a free text change straight to
// the default. All three fields are required before the override saves.
router.post("/fields/:fieldId", requireAuth, requireRole("expert"), (req, res) => {
  const { fieldId } = req.params;
  const { component, heuristic, researchReference, productJustification } = req.body || {};

  const data = db.get();
  const field = data.fields.find((f) => f.id === fieldId);
  if (!field) return res.status(404).json({ error: "Field not found." });

  if (!component || !Object.values(COMPONENTS).includes(component)) {
    return res.status(400).json({ error: "A valid replacement component is required." });
  }
  if (!heuristic || !NIELSEN_HEURISTICS.includes(heuristic)) {
    return res.status(400).json({ error: "A Nielsen usability heuristic must be selected." });
  }
  if (!researchReference || !String(researchReference).trim()) {
    return res.status(400).json({ error: "A user research reference is required." });
  }
  if (!productJustification || !String(productJustification).trim()) {
    return res.status(400).json({ error: "A product need justification is required." });
  }

  const now = new Date().toISOString();
  const override = {
    id: nanoid(),
    fieldId,
    schemaId: field.schemaId,
    previousComponent: field.activeComponentOverride || field.defaultComponent,
    component,
    heuristic,
    researchReference: String(researchReference).trim(),
    productJustification: String(productJustification).trim(),
    createdBy: req.user.sub,
    createdByName: req.user.name,
    createdAt: now,
  };
  data.overrides.push(override);

  data.auditLog.push({
    id: nanoid(),
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "field.override",
    entityType: "field",
    entityId: fieldId,
    details: {
      fieldName: field.fieldName,
      from: override.previousComponent,
      to: component,
      heuristic,
    },
    createdAt: now,
  });

  db.persist();
  res.status(201).json({ override });
});

router.delete("/fields/:fieldId", requireAuth, requireRole("expert"), (req, res) => {
  const { fieldId } = req.params;
  const data = db.get();
  const field = data.fields.find((f) => f.id === fieldId);
  if (!field) return res.status(404).json({ error: "Field not found." });

  const before = data.overrides.length;
  data.overrides = data.overrides.filter((o) => o.fieldId !== fieldId);
  if (data.overrides.length === before) {
    return res.status(404).json({ error: "No override exists for this field." });
  }

  const now = new Date().toISOString();
  data.auditLog.push({
    id: nanoid(),
    actorId: req.user.sub,
    actorName: req.user.name,
    action: "field.override_reverted",
    entityType: "field",
    entityId: fieldId,
    details: { fieldName: field.fieldName, revertedTo: field.defaultComponent },
    createdAt: now,
  });

  db.persist();
  res.json({ ok: true });
});

export default router;
