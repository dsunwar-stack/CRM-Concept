import { useMemo, useState } from "react";
import { api } from "../api";
import {
  analyzeTranscript,
  draftReply,
  CASE_TYPES,
  SAMPLE_TRANSCRIPTS,
  type Analysis,
} from "../lib/simulatedAI";

type Channel = "call" | "chat" | "email";
type Tone = "empathetic" | "formal" | "concise";
type AiSource = "real" | "simulated";

const CHANNEL_LABELS: Record<Channel, string> = { call: "Call", chat: "Chat", email: "Email" };

export default function AgentWorkspacePage() {
  const [channel, setChannel] = useState<Channel>("chat");
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedCaseTypeId, setSelectedCaseTypeId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [routedToFraudQueue, setRoutedToFraudQueue] = useState(false);

  const [tone, setTone] = useState<Tone>("empathetic");
  const [draft, setDraft] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  const [analysisSource, setAnalysisSource] = useState<AiSource | null>(null);
  const [draftSource, setDraftSource] = useState<AiSource | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const caseType = useMemo(
    () => CASE_TYPES.find((c) => c.id === selectedCaseTypeId) ?? null,
    [selectedCaseTypeId]
  );

  function loadSample(sample: (typeof SAMPLE_TRANSCRIPTS)[number]) {
    setChannel(sample.channel);
    setTranscript(sample.text);
    resetDownstream();
  }

  function resetDownstream() {
    setAnalysis(null);
    setSelectedCaseTypeId(null);
    setCompletedTasks(new Set());
    setRoutedToFraudQueue(false);
    setDraft("");
    setAnalysisSource(null);
    setDraftSource(null);
    setAiNotice(null);
  }

  async function runAnalysis() {
    setIsAnalyzing(true);
    setAiNotice(null);
    try {
      // Try the real Claude-backed endpoint first — it 503s with a clear
      // message if the server has no ANTHROPIC_API_KEY configured, in
      // which case we fall back to the local scripted simulation below.
      const result = await api.post<Analysis>("/ai/analyze", { transcript });
      setAnalysis(result);
      setSelectedCaseTypeId(result.suggestedCaseTypeId);
      setAnalysisSource("real");
    } catch (err) {
      setAiNotice(
        `Real AI unavailable (${err instanceof Error ? err.message : "unknown error"}) — showing the built-in simulated analysis instead.`
      );
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      const result = analyzeTranscript(transcript);
      setAnalysis(result);
      setSelectedCaseTypeId(result.suggestedCaseTypeId);
      setAnalysisSource("simulated");
    } finally {
      setCompletedTasks(new Set());
      setRoutedToFraudQueue(false);
      setIsAnalyzing(false);
    }
  }

  function toggleTask(task: string) {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task);
      else next.add(task);
      return next;
    });
  }

  async function generateDraft() {
    if (!caseType) return;
    setIsDrafting(true);
    try {
      const result = await api.post<{ draft: string }>("/ai/draft", {
        caseTypeLabel: caseType.label,
        tone,
        transcript,
      });
      setDraft(result.draft);
      setDraftSource("real");
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      setDraft(draftReply(caseType.id, tone));
      setDraftSource("simulated");
    } finally {
      setIsDrafting(false);
    }
  }

  const progress = caseType ? Math.round((completedTasks.size / caseType.roadmap.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Case Assistant</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          One screen for the call, chat, or email that just came in — AI summarises it, suggests the
          case category, lays out the roadmap to resolve it, flags fraud risk, and can help draft the
          reply. No more switching between the phone/chat tool and a separate how-to guide.
        </p>
        <p className="mt-2 text-xs text-amber-600">
          Prototype note: calls a real Claude model on the backend when the server has
          <code className="mx-1 rounded bg-amber-50 px-1 py-0.5">ANTHROPIC_API_KEY</code> set (see
          <code className="mx-1 rounded bg-amber-50 px-1 py-0.5">server/.env.example</code>) — and
          automatically falls back to a scripted, keyword-based simulation in{" "}
          <code className="rounded bg-amber-50 px-1 py-0.5">client/src/lib/simulatedAI.ts</code>{" "}
          otherwise, so the flow always works without a key.
        </p>
        {aiNotice && (
          <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">{aiNotice}</p>
        )}
      </div>

      {/* Step 0 — intake */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Incoming interaction
          </h2>
          <div className="flex gap-1 rounded-md bg-slate-100 p-1">
            {(["call", "chat", "email"] as Channel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  channel === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {CHANNEL_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_TRANSCRIPTS.map((s) => (
            <button
              key={s.label}
              onClick={() => loadSample(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Load example: {s.label}
            </button>
          ))}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            resetDownstream();
          }}
          rows={4}
          placeholder={`Paste or type the ${CHANNEL_LABELS[channel].toLowerCase()} transcript / message here…`}
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          onClick={runAnalysis}
          disabled={!transcript.trim() || isAnalyzing}
          className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAnalyzing ? "Analysing…" : "Analyse with AI"}
        </button>
      </div>

      {analysis && caseType && (
        <>
          {/* Step 1 — summary + category */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 1 · Summary &amp; categorisation
              <SourceBadge source={analysisSource} />
            </h2>
            <p className="mt-2 text-sm text-slate-700">{analysis.summary}</p>

            {analysis.clarifyingQuestions.length > 0 && (
              <div className="mt-3 rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">AI suggests asking the customer:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {analysis.clarifyingQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Case category{" "}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (AI-suggested — 5 options, so it renders as radio buttons per the rules engine;
                  confirm or change it)
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                {CASE_TYPES.map((ct) => (
                  <label
                    key={ct.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      selectedCaseTypeId === ct.id
                        ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="case-type"
                      checked={selectedCaseTypeId === ct.id}
                      onChange={() => {
                        setSelectedCaseTypeId(ct.id);
                        setCompletedTasks(new Set());
                        setRoutedToFraudQueue(false);
                      }}
                    />
                    {ct.label}
                    {ct.id === analysis.suggestedCaseTypeId && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        AI pick
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Fraud signal */}
          {caseType.isFraudRisk && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-6">
              <p className="text-sm font-semibold text-red-800">⚠ Fraud signal detected</p>
              <p className="mt-1 text-sm text-red-700">
                This case matches patterns associated with unauthorised transactions. Recommended:
                route to the Fraud queue and freeze the affected card before continuing.
              </p>
              {routedToFraudQueue ? (
                <p className="mt-3 text-sm font-medium text-red-800">
                  ✓ Routed to Fraud queue and logged.
                </p>
              ) : (
                <button
                  onClick={() => setRoutedToFraudQueue(true)}
                  className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Route to Fraud queue
                </button>
              )}
            </div>
          )}

          {/* Step 2 — roadmap */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Step 2 &amp; 3 · Roadmap to resolution
              </h2>
              <span className="text-xs text-slate-500">{progress}% complete</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2">
              {caseType.roadmap.map((task, i) => (
                <li key={task} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={completedTasks.has(task)}
                    onChange={() => toggleTask(task)}
                    className="mt-0.5"
                  />
                  <span
                    className={`text-sm ${
                      completedTasks.has(task) ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  >
                    {i + 1}. {task}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Draft assist */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Draft a reply
              <SourceBadge source={draftSource} />
            </h2>
            <div className="mt-3 flex items-center gap-2">
              {(["empathetic", "formal", "concise"] as Tone[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full border px-3 py-1 text-xs capitalize ${
                    tone === t
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={generateDraft}
                disabled={isDrafting}
                className="ml-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isDrafting ? "Writing…" : draft ? "Regenerate" : "Generate draft"}
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder="AI-drafted reply will appear here — fully editable before you send."
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: "real" | "simulated" | null }) {
  if (!source) return null;
  return source === "real" ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-700">
      Claude Opus 5
    </span>
  ) : (
    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-slate-600">
      simulated
    </span>
  );
}
