import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "./db.js";
import { resolveSchemaFields } from "./rulesEngine.js";

// Seeds two demo accounts (standard + expert), one demo schema built from
// the exact Excel example in the product spec (section 5), and a demo
// triage pipeline matching the illustrative example in the spec (section 3).
// All of this is structural/demo data — no real customer or case records.

export function seedIfEmpty() {
  const data = db.get();
  if (data.users.length > 0) return;

  const now = new Date().toISOString();

  const standardUser = {
    id: nanoid(),
    email: "analyst@demo.caseflow.app",
    name: "Priya Analyst",
    passwordHash: bcrypt.hashSync("demo1234", 8),
    role: "standard",
    createdAt: now,
  };
  const expertUser = {
    id: nanoid(),
    email: "expert@demo.caseflow.app",
    name: "Sam Expert",
    passwordHash: bcrypt.hashSync("demo1234", 8),
    role: "expert",
    createdAt: now,
  };
  data.users.push(standardUser, expertUser);

  const schemaId = nanoid();
  data.schemas.push({
    id: schemaId,
    name: "Customer Case Intake",
    sourceType: "excel",
    createdBy: standardUser.id,
    createdAt: now,
    updatedAt: now,
  });

  const rawFields = [
    {
      fieldName: "Case Status",
      type: "select",
      optionsCount: 4,
      required: true,
      optionsList: ["Open", "In Review", "Escalated", "Closed"],
    },
    {
      fieldName: "Assigned Team",
      type: "select",
      optionsCount: 35,
      required: true,
      optionsList: Array.from({ length: 35 }, (_, i) => `Team ${i + 1}`),
    },
    {
      fieldName: "Priority",
      type: "select",
      optionsCount: 3,
      required: true,
      optionsList: ["Low", "Medium", "High"],
    },
    {
      fieldName: "Notes",
      type: "text",
      optionsCount: 0,
      required: false,
      optionsList: [],
    },
    {
      fieldName: "Date Received",
      type: "date",
      optionsCount: 0,
      required: true,
      optionsList: [],
    },
    {
      fieldName: "Requires Callback",
      type: "boolean",
      optionsCount: 2,
      required: false,
      optionsList: ["Yes", "No"],
    },
  ];

  const resolved = resolveSchemaFields(rawFields);
  resolved.forEach((field, index) => {
    data.fields.push({
      id: nanoid(),
      schemaId,
      order: index,
      ...field,
    });
  });

  data.auditLog.push({
    id: nanoid(),
    actorId: standardUser.id,
    actorName: standardUser.name,
    action: "schema.created",
    entityType: "schema",
    entityId: schemaId,
    details: { name: "Customer Case Intake", sourceType: "excel", fieldCount: resolved.length },
    createdAt: now,
  });

  // Demo triage pipeline — mirrors the illustrative example in the spec.
  const stageDefs = [
    { name: "Front Office", order: 0, avgWaitDays: 0.5, caseCount: 18 },
    { name: "Compliance Review", order: 1, avgWaitDays: 1, caseCount: 22 },
    {
      name: "Unassigned Queue",
      order: 2,
      avgWaitDays: 4.5,
      caseCount: 41,
      reasons: [
        "No auto-assignment rule configured for this queue — cases sit until a manager manually assigns them.",
        "Team capacity mismatch: 41 open cases against 3 active handlers.",
        "12 cases have been unassigned for over 5 days.",
      ],
    },
    { name: "Case Management", order: 3, avgWaitDays: 1.5, caseCount: 15 },
    { name: "Resolved", order: 4, avgWaitDays: 0, caseCount: 9 },
  ];

  stageDefs.forEach((s) => {
    data.triageStages.push({
      id: nanoid(),
      schemaId,
      name: s.name,
      order: s.order,
      avgWaitDays: s.avgWaitDays,
      caseCount: s.caseCount,
      reasons: s.reasons || [],
    });
  });

  db.persist();
}
