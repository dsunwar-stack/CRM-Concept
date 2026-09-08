import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Schema } from "../types";
import SchemaBuilderForm from "./SchemaBuilderForm";

const JSON_EXAMPLE = `{
  "name": "Complaint Handling",
  "fields": [
    { "fieldName": "Complaint Type", "type": "select", "optionsCount": 4, "required": true,
      "optionsList": ["Billing", "Service", "Product", "Other"] },
    { "fieldName": "Severity", "type": "select", "optionsCount": 2, "required": true,
      "optionsList": ["Standard", "Urgent"] },
    { "fieldName": "Description", "type": "longtext", "required": true },
    { "fieldName": "Date Logged", "type": "date", "required": true }
  ]
}`;

type Tab = "excel" | "json" | "build";

export default function SchemaUploadPanel({ onCreated }: { onCreated: () => void }) {
  const [tab, setTab] = useState<Tab>("build");
  const [excelName, setExcelName] = useState("");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(JSON_EXAMPLE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function submitExcel(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an .xlsx file first.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (excelName) form.append("name", excelName);
      const res = await api.postForm<{ schema: Schema }>("/schemas/excel", form);
      onCreated();
      navigate(`/schemas/${res.schema.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitJson(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await api.post<{ schema: Schema }>("/schemas/json", parsed);
      onCreated();
      navigate(`/schemas/${res.schema.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON.");
    } finally {
      setSubmitting(false);
    }
  }

  const TAB_LABELS: Record<Tab, string> = {
    build: "Build a form",
    excel: "Excel upload (.xlsx)",
    json: "JSON import",
  };

  return (
    <article className="slds-card">
      <div className="slds-card__header slds-grid">
        <header className="slds-media slds-media_center slds-has-flexi-truncate">
          <div className="slds-media__body">
            <h2 className="slds-card__header-title">Generate a new form from a schema</h2>
          </div>
        </header>
      </div>
      <div className="slds-card__body slds-card__body_inner">
        <p className="slds-text-body_small slds-text-color_weak">
          Build one field-by-field here, upload an Excel sheet (the primary path most PMs and
          analysts already work in), or import JSON directly for technical/system integration use.
        </p>

        <div className="slds-tabs_default slds-m-top_small">
          <ul className="slds-tabs_default__nav" role="tablist">
            {(["build", "excel", "json"] as Tab[]).map((t) => (
              <li
                key={t}
                className={`slds-tabs_default__item ${tab === t ? "slds-is-active" : ""}`}
                role="presentation"
              >
                <button
                  type="button"
                  className="slds-tabs_default__link"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {TAB_LABELS[t]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {tab === "build" ? (
          <SchemaBuilderForm onCreated={onCreated} />
        ) : tab === "excel" ? (
          <form onSubmit={submitExcel} className="slds-m-top_medium">
            <p className="slds-text-body_small slds-text-color_weak slds-m-bottom_small">
              Expected columns: <code>Field Name</code>, <code>Type</code> (select / text /
              longtext / date / boolean / number), <code>Options Count</code>,{" "}
              <code>Required</code>, <code>Options List</code> (comma-separated).
            </p>
            <div className="slds-form-element slds-m-bottom_medium">
              <label className="slds-form-element__label" htmlFor="excel-name">
                Schema name (optional — defaults to the file name)
              </label>
              <div className="slds-form-element__control">
                <input
                  id="excel-name"
                  type="text"
                  value={excelName}
                  onChange={(e) => setExcelName(e.target.value)}
                  className="slds-input"
                  placeholder="Customer Onboarding Case"
                />
              </div>
            </div>
            <div className="slds-form-element slds-m-bottom_medium">
              <div className="slds-form-element__control">
                <div className="slds-file-selector slds-file-selector_files">
                  <div className="slds-file-selector__dropzone">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="slds-file-selector__input slds-assistive-text"
                      id="excel-file-input"
                      onChange={(e) => setFileLabel(e.target.files?.[0]?.name ?? null)}
                    />
                    <label className="slds-file-selector__body" htmlFor="excel-file-input">
                      <span className="slds-file-selector__button slds-button slds-button_neutral">
                        Upload File
                      </span>
                      <span className="slds-file-selector__text slds-medium-show">or Drop File</span>
                    </label>
                  </div>
                </div>
                {fileLabel && <p className="slds-text-body_small slds-text-color_weak slds-m-top_x-small">Selected: {fileLabel}</p>}
              </div>
            </div>
            {error && <p className="slds-text-color_error slds-text-body_small slds-m-bottom_small">{error}</p>}
            <button type="submit" disabled={submitting} className="slds-button slds-button_brand">
              {submitting ? "Generating…" : "Upload & generate form"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitJson} className="slds-m-top_medium">
            <div className="slds-form-element slds-m-bottom_medium">
              <label className="slds-form-element__label" htmlFor="schema-json">
                Schema JSON
              </label>
              <div className="slds-form-element__control">
                <textarea
                  id="schema-json"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  className="slds-textarea"
                  style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                />
              </div>
            </div>
            {error && <p className="slds-text-color_error slds-text-body_small slds-m-bottom_small">{error}</p>}
            <button type="submit" disabled={submitting} className="slds-button slds-button_brand">
              {submitting ? "Generating…" : "Import & generate form"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
