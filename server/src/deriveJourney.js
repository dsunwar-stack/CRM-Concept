import { nanoid } from "nanoid";

// Turns a schema's own status-like field into its triage journey — the
// spec's principle that "the same schema that builds the form also powers
// the triage map." A field named status/stage/state/pipeline wins if one
// exists; otherwise the first select-shaped field with a plausible number
// of pipeline steps (2-8) is used. No matching field -> no journey, and
// the schema's form still works fine on its own.

const STATUS_NAME_HINT = /status|stage|state|pipeline/i;
const TERMINAL_HINT = /closed|resolved|done|complete|completed|cancelled|canceled/i;

function pickStatusField(fields) {
  const candidates = fields.filter(
    (f) => Array.isArray(f.optionsList) && f.optionsList.length >= 2 && f.optionsList.length <= 8
  );
  if (candidates.length === 0) return null;
  return candidates.find((f) => STATUS_NAME_HINT.test(f.fieldName)) || candidates[0];
}

// Deterministic pseudo-random generator seeded by a string, so the demo
// wait-time/volume numbers stay stable across repeated views of the same
// schema instead of reshuffling on every fetch.
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

export function deriveTriageStages(schemaId, fields) {
  const statusField = pickStatusField(fields);
  if (!statusField) return { stages: [], sourceField: null };

  const options = statusField.optionsList;
  const rand = seededRandom(`${schemaId}:${statusField.fieldName}`);

  const nonTerminalIndexes = options.map((_, i) => i).filter((i) => !TERMINAL_HINT.test(options[i]));
  const bottleneckIndex =
    nonTerminalIndexes.length > 0
      ? nonTerminalIndexes[Math.floor(rand() * nonTerminalIndexes.length)]
      : -1;

  const stages = options.map((name, index) => {
    const isTerminal = TERMINAL_HINT.test(name);
    const isBottleneck = index === bottleneckIndex;
    const avgWaitDays = isTerminal
      ? 0
      : Number((isBottleneck ? 2.5 + rand() * 3 : 0.3 + rand() * 1.5).toFixed(1));
    const caseCount = Math.round(
      isTerminal ? 5 + rand() * 10 : isBottleneck ? 25 + rand() * 25 : 8 + rand() * 20
    );

    return {
      id: nanoid(),
      schemaId,
      name,
      order: index,
      avgWaitDays,
      caseCount,
      reasons: isBottleneck
        ? [
            `No explicit routing rule detected for "${name}" — cases can sit until someone manually picks them up.`,
            `Wait time here is well above the other stages in this journey — check whether "${name}" has enough assigned handlers.`,
          ]
        : [],
    };
  });

  return { stages, sourceField: statusField.fieldName };
}
