import type { ComponentType } from "./types";

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  toggle: "Toggle / switch",
  radio: "Radio buttons",
  dropdown: "Dropdown / select",
  typeahead: "Typeahead / searchable select",
  date_picker: "Calendar date picker",
  checkbox: "Checkbox",
  textarea: "Multi-line textarea",
  text_input: "Single-line text input",
  stepper: "Stepper",
  slider: "Slider",
};

export const COMPONENT_OPTIONS: ComponentType[] = [
  "toggle",
  "radio",
  "dropdown",
  "typeahead",
  "date_picker",
  "checkbox",
  "textarea",
  "text_input",
  "stepper",
  "slider",
];
