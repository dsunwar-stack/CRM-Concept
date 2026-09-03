// The embedded design-principle rules engine (product spec, section 4).
// A field's option count — plus a small set of additional default rules —
// determines its component. This is enforced, not a suggestion a builder
// can skip; the only way around it is the guided expert override flow.

export const COMPONENTS = {
  TOGGLE: "toggle",
  RADIO: "radio",
  DROPDOWN: "dropdown",
  TYPEAHEAD: "typeahead",
  DATE_PICKER: "date_picker",
  CHECKBOX: "checkbox",
  TEXTAREA: "textarea",
  TEXT_INPUT: "text_input",
  STEPPER: "stepper",
  SLIDER: "slider",
};

const LONG_TEXT_THRESHOLD = 100;

/**
 * Resolve the enforced default component + human-readable rationale for a
 * single schema field, given the field's type and, for boolean fields,
 * whether it sits alongside other boolean fields in the same schema
 * (grouped booleans render as toggles; a lone one renders as a checkbox).
 */
export function resolveComponent(field, { booleanFieldCountInSchema = 1 } = {}) {
  const type = (field.type || "").toLowerCase().trim();
  const optionsCount = Number(field.optionsCount ?? field.options_count ?? 0);

  if (type === "date") {
    return {
      component: COMPONENTS.DATE_PICKER,
      rationale: "Dates use a calendar picker, not free text, to avoid format errors.",
    };
  }

  if (type === "boolean" || type === "yesno" || type === "yes/no") {
    if (booleanFieldCountInSchema > 1) {
      return {
        component: COMPONENTS.TOGGLE,
        rationale:
          "Yes/No field presented alongside other binary settings, so it renders as a toggle.",
      };
    }
    return {
      component: COMPONENTS.CHECKBOX,
      rationale: "A single Yes/No field renders as a checkbox.",
    };
  }

  if (type === "number") {
    const min = field.min ?? field.minValue;
    const max = field.max ?? field.maxValue;
    const hasKnownRange = min !== undefined && min !== null && max !== undefined && max !== null;
    if (hasKnownRange) {
      const span = Number(max) - Number(min);
      if (Number.isFinite(span) && span <= 20) {
        return {
          component: span <= 10 ? COMPONENTS.STEPPER : COMPONENTS.SLIDER,
          rationale:
            "Numeric field with a small, known valid range renders as a stepper/slider rather than open text.",
        };
      }
    }
    return {
      component: COMPONENTS.TEXT_INPUT,
      rationale: "Numeric field with no small known range renders as open text input.",
    };
  }

  if (type === "longtext" || type === "textarea") {
    return {
      component: COMPONENTS.TEXTAREA,
      rationale: "Long free text (over ~100 characters expected) renders as a multi-line textarea.",
    };
  }

  if (type === "text") {
    const expectedLength = Number(field.expectedLength ?? field.expected_length ?? 0);
    if (expectedLength > LONG_TEXT_THRESHOLD) {
      return {
        component: COMPONENTS.TEXTAREA,
        rationale: "Long free text (over ~100 characters expected) renders as a multi-line textarea.",
      };
    }
    return {
      component: COMPONENTS.TEXT_INPUT,
      rationale: "Short free text renders as a single-line input.",
    };
  }

  // Default: option-count-driven selection field ("select").
  if (optionsCount === 2) {
    return {
      component: COMPONENTS.TOGGLE,
      rationale: "2 options: binary choices read fastest as a single switch, not a list.",
    };
  }
  if (optionsCount >= 3 && optionsCount <= 5) {
    return {
      component: COMPONENTS.RADIO,
      rationale: "3–5 options: all choices visible at once with no extra click; ideal at this size.",
    };
  }
  if (optionsCount >= 6 && optionsCount <= 20) {
    return {
      component: COMPONENTS.DROPDOWN,
      rationale:
        "6–20 options: too many for radio buttons to stay scannable, small enough not to need search.",
    };
  }
  if (optionsCount > 20) {
    return {
      component: COMPONENTS.TYPEAHEAD,
      rationale: "20+ options: scanning becomes slower than typing once a list is this long.",
    };
  }

  return {
    component: COMPONENTS.TEXT_INPUT,
    rationale: "No option count or recognised type supplied; defaulted to a plain text input.",
  };
}

/**
 * Resolve components for every field in a schema, taking into account
 * schema-wide context (e.g. how many boolean fields exist).
 */
export function resolveSchemaFields(fields) {
  const booleanFieldCountInSchema = fields.filter((f) =>
    ["boolean", "yesno", "yes/no"].includes((f.type || "").toLowerCase().trim())
  ).length;

  return fields.map((field) => {
    const { component, rationale } = resolveComponent(field, { booleanFieldCountInSchema });
    return { ...field, defaultComponent: component, defaultRationale: rationale };
  });
}

export const NIELSEN_HEURISTICS = [
  "Visibility of system status",
  "Match between system and the real world",
  "User control and freedom",
  "Consistency and standards",
  "Error prevention",
  "Recognition rather than recall",
  "Flexibility and efficiency of use",
  "Aesthetic and minimalist design",
  "Help users recognize, diagnose, and recover from errors",
  "Help and documentation",
];
