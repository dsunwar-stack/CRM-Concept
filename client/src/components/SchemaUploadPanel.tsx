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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Generate a new form from a schema</h2>
      <p className="mt-1 text-sm text-slate-500">
        Build one field-by-field here, upload an Excel sheet (the primary path most PMs and
        analysts already work in), or import JSON directly for technical/system integration use.
      </p>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {(["build", "excel", "json"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t === "build" ? "Build a form" : t === "excel" ? "Excel upload (.xlsx)" : "JSON import"}
          </button>
        ))}
      </div>

      {tab === "build" ? (
        <SchemaBuilderForm onCreated={onCreated} />
      ) : tab === "excel" ? (
        <form onSubmit={submitExcel} className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">
            Expected columns: <code>Field Name</code>, <code>Type</code>{" "}
            (select / text / longtext / date / boolean / number), <code>Options Count</code>,{" "}
            <code>Required</code>, <code>Options List</code> (comma-separated).
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Schema name (optional — defaults to the file name)
            </label>
            <input
              type="text"
              value={excelName}
              onChange={(e) => setExcelName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Customer Onboarding Case"
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFileLabel(e.target.files?.[0]?.name ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {fileLabel && <p className="mt-1 text-xs text-slate-500">Selected: {fileLabel}</p>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Generating…" : "Upload & generate form"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitJson} className="mt-4 space-y-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Schema JSON</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Generating…" : "Import & generate form"}
          </button>
        </form>
      )}
    </div>
  );
}
