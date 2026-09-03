import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Data-light architecture (product spec, section 7): this store only ever
// holds form/schema structures, override rationale, audit records, and
// synthetic/demo triage stage stats — never real customer or case records.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "store.json");

function defaultData() {
  return {
    users: [],
    schemas: [],
    fields: [],
    overrides: [],
    auditLog: [],
    triageStages: [],
    demoCases: [],
  };
}

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    const data = defaultData();
    save(data);
    return data;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

let cache = load();

export const db = {
  get() {
    return cache;
  },
  persist() {
    save(cache);
  },
  reset() {
    cache = defaultData();
    save(cache);
  },
};
