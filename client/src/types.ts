export type Role = "standard" | "expert";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type ComponentType =
  | "toggle"
  | "radio"
  | "dropdown"
  | "typeahead"
  | "date_picker"
  | "checkbox"
  | "textarea"
  | "text_input"
  | "stepper"
  | "slider";

export interface FieldOverride {
  id: string;
  fieldId: string;
  previousComponent: ComponentType;
  component: ComponentType;
  heuristic: string;
  researchReference: string;
  productJustification: string;
  createdByName: string;
  createdAt: string;
}

export interface SchemaField {
  id: string;
  schemaId: string;
  order: number;
  fieldName: string;
  type: string;
  optionsCount: number;
  required: boolean;
  optionsList: string[];
  defaultComponent: ComponentType;
  defaultRationale: string;
  activeOverride: FieldOverride | null;
}

export interface Schema {
  id: string;
  name: string;
  sourceType: "excel" | "json";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fieldCount?: number;
  hasJourney?: boolean;
  journeySourceField?: string | null;
}

export interface JourneyInfo {
  derived: boolean;
  sourceField: string | null;
  stageCount: number;
}

export interface TriageStage {
  id: string;
  schemaId: string;
  name: string;
  order: number;
  avgWaitDays: number;
  caseCount: number;
  reasons: string[];
  isBottleneck: boolean;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}
