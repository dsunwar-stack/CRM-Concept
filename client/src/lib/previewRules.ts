// Client-side mirror of server/src/rulesEngine.js, used only to give
// live feedback while building a schema by hand — the server is still the
// authority and recomputes this on save, so the two must stay in sync but
// a client preview drifting for a moment is not a correctness bug.
import type { ComponentType } from "../types";

export interface BuilderFieldInput {
  type: string;
  optionsCount: number;
  min?: string;
  max?: string;
  expectedLength?: string;
}

export function previewComponent(
  field: BuilderFieldInput,
  booleanFieldCountInSchema: number
): ComponentType {
  const type = field.type.toLowerCase().trim();

  if (type === "date") return "date_picker";

  if (type === "boolean") {
    return booleanFieldCountInSchema > 1 ? "toggle" : "checkbox";
  }

  if (type === "number") {
    const min = field.min !== undefined && field.min !== "" ? Number(field.min) : undefined;
    const max = field.max !== undefined && field.max !== "" ? Number(field.max) : undefined;
    if (min !== undefined && max !== undefined) {
      const span = max - min;
      if (Number.isFinite(span) && span <= 20) {
        return span <= 10 ? "stepper" : "slider";
      }
    }
    return "text_input";
  }

  if (type === "longtext" || type === "textarea") return "textarea";

  if (type === "text") {
    const expectedLength = field.expectedLength ? Number(field.expectedLength) : 0;
    return expectedLength > 100 ? "textarea" : "text_input";
  }

  const optionsCount = field.optionsCount || 0;
  if (optionsCount === 2) return "toggle";
  if (optionsCount >= 3 && optionsCount <= 5) return "radio";
  if (optionsCount >= 6 && optionsCount <= 20) return "dropdown";
  if (optionsCount > 20) return "typeahead";
  return "text_input";
}
