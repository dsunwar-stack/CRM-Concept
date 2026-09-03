import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { resolveSchemaFields } from "../rulesEngine.js";
import { deriveTriageStages } from "../deriveJourney.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function normalizeRawField(row) {
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
      if (found && row[found] !== undefined && row[found] !== "") return row[found];
    }
    return undefined;
  };

  const optionsListRaw = get("Options List", "optionsList");
  const optionsList = Array.isArray(optionsListRaw)
    ? optionsListRaw
    : typeof optionsListRaw === "string"
    ? optionsListRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const requiredRaw = get("Required", "required");
  const required =
    typeof requiredRaw === "boolean"
      ? requiredRaw
      : String(requiredRaw ?? "").trim().toLowerCase() === "yes" ||
        String(requiredRaw ?? "").trim().toLowerCase() === "true";

  return {
    fieldName: String(get("Field Name", "fieldName") ?? "").trim(),
    type: String(get("Type", "type") ?? "text").trim().toLowerCase(),
    optionsCount: Number(get("Options Count", "optionsCount") ?? optionsList.length ?? 0) || 0,
    required,
    optionsList,
    min: get("Min", "min"),
    max: get("Max", "max"),
    expectedLength: get("Expected Length", "expectedLength"),
  };
}

function persistSchema({ name, sourceType, rawFields, userId, userName }) {
  const data = db.get();
  const schemaId = nanoid();
  const now = new Date().toISOString();

  const resolved = resolveSchemaFields(rawFields);
  const savedFields = resolved.map((field, index) => {
    const record = { id: nanoid(), schemaId, order: index, ...field };
    data.fields.push(record);
    return record;
  });

  // The same schema that builds the form also powers the triage map: a
  // status-like field's options become the case journey's stages.
  const { stages, sourceField } = deriveTriageStages(schemaId, savedFields);
  data.triageStages.push(...stages);

  data.schemas.push({
    id: schemaId,
    name,
    sourceType,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    journeySourceField: sourceField,
  });

  data.auditLog.push({
    id: nanoid(),
    actorId: userId,
    actorName: userName,
    action: "schema.created",
    entityType: "schema",
    entityId: schemaId,
    details: {
      name,
      sourceType,
      fieldCount: savedFields.length,
      journeyDerivedFrom: sourceField,
      journeyStageCount: stages.length,
    },
    createdAt: now,
  });

  db.persist();
  return {
    schema: data.schemas.find((s) => s.id === schemaId),
    fields: savedFields,
    journey: { derived: stages.length > 0, sourceField, stageCount: stages.length },
  };
}

router.use(requireAuth);

router.get("/", (_req, res) => {
  const data = db.get();
  const schemas = data.schemas.map((s) => ({
    ...s,
    fieldCount: data.fields.filter((f) => f.schemaId === s.id).length,
    hasJourney: data.triageStages.some((t) => t.schemaId === s.id),
  }));
  res.json({ schemas });
});

router.get("/:id", (req, res) => {
  const data = db.get();
  const schema = data.schemas.find((s) => s.id === req.params.id);
  if (!schema) return res.status(404).json({ error: "Schema not found." });

  const fields = data.fields
    .filter((f) => f.schemaId === schema.id)
    .sort((a, b) => a.order - b.order)
    .map((f) => {
      const override = data.overrides
        .filter((o) => o.fieldId === f.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      return { ...f, activeOverride: override || null };
    });

  res.json({ schema, fields });
});

router.post("/json", (req, res) => {
  const { name, fields } = req.body || {};
  if (!name || !Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ error: "A schema name and a non-empty fields array are required." });
  }
  // Advanced JSON path (spec section 5): fields are supplied directly in
  // our own field shape rather than as Excel-style column headers.
  const rawFields = fields.map((f) => ({
    fieldName: String(f.fieldName ?? f.field_name ?? "").trim(),
    type: String(f.type ?? "text").trim().toLowerCase(),
    optionsCount: Number(f.optionsCount ?? f.options_count ?? (f.optionsList || []).length ?? 0) || 0,
    required: Boolean(f.required),
    optionsList: Array.isArray(f.optionsList ?? f.options_list) ? f.optionsList ?? f.options_list : [],
    min: f.min,
    max: f.max,
    expectedLength: f.expectedLength ?? f.expected_length,
  }));
  const invalid = rawFields.find((f) => !f.fieldName);
  if (invalid) return res.status(400).json({ error: "Every field needs a fieldName." });

  const result = persistSchema({
    name,
    sourceType: "json",
    rawFields,
    userId: req.user.sub,
    userName: req.user.name,
  });
  res.status(201).json(result);
});

router.post("/excel", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "An .xlsx file is required (field name 'file')." });
  const name = (req.body && req.body.name) || req.file.originalname.replace(/\.[^.]+$/, "");

  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  } catch {
    return res.status(400).json({ error: "Could not parse the uploaded file as an Excel workbook." });
  }
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (rows.length === 0) {
    return res.status(400).json({ error: "The first sheet has no rows." });
  }

  const rawFields = rows.map(normalizeRawField).filter((f) => f.fieldName);
  if (rawFields.length === 0) {
    return res.status(400).json({ error: "No rows had a 'Field Name' value." });
  }

  const result = persistSchema({
    name,
    sourceType: "excel",
    rawFields,
    userId: req.user.sub,
    userName: req.user.name,
  });
  res.status(201).json(result);
});

export default router;
