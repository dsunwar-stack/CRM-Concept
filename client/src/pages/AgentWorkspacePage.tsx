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
    <div className="slds-grid slds-grid_vertical slds-gutters_direct-y">
      <div>
        <h1 className="slds-text-heading_medium">AI Case Assistant</h1>
        <p className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small" style={{ maxWidth: 720 }}>
          One screen for the call, chat, or email that just came in — AI summarises it, suggests the
          case category, lays out the roadmap to resolve it, flags fraud risk, and can help draft the
          reply. No more switching between the phone/chat tool and a separate how-to guide.
        </p>
        <p className="slds-text-body_small slds-m-top_x-small" style={{ color: "var(--slds-g-color-warning-base-30, #92400e)" }}>
          Prototype note: calls a real Claude model on the backend when the server has{" "}
          <code className="slds-badge slds-badge_lightest slds-m-horizontal_xx-small">ANTHROPIC_API_KEY</code> set
          (see <code className="slds-badge slds-badge_lightest slds-m-horizontal_xx-small">server/.env.example</code>) —
          and automatically falls back to a scripted, keyword-based simulation in{" "}
          <code className="slds-badge slds-badge_lightest slds-m-horizontal_xx-small">
            client/src/lib/simulatedAI.ts
          </code>{" "}
          otherwise, so the flow always works without a key.
        </p>
        {aiNotice && (
          <div className="slds-notify slds-notify_alert slds-theme_shade slds-m-top_x-small">
            <p className="slds-text-body_small">{aiNotice}</p>
          </div>
        )}
      </div>

      {/* Step 0 — intake */}
      <article className="slds-card">
        <div className="slds-card__body slds-card__body_inner">
          <div className="slds-grid slds-grid_align-spread slds-grid_vertical-align-center slds-wrap">
            <h2 className="slds-text-title_caps slds-text-color_weak">Incoming interaction</h2>
            <div className="slds-radio_button-group" role="radiogroup" aria-label="Channel">
              {(["call", "chat", "email"] as Channel[]).map((c) => (
                <span key={c} className="slds-button slds-radio_button">
                  <input
                    type="radio"
                    id={`channel-${c}`}
                    name="channel"
                    checked={channel === c}
                    onChange={() => setChannel(c)}
                  />
                  <label className="slds-radio_button__label" htmlFor={`channel-${c}`}>
                    <span className="slds-radio_faux">{CHANNEL_LABELS[c]}</span>
                  </label>
                </span>
              ))}
            </div>
          </div>

          <div className="slds-grid slds-wrap slds-gutters_x-small slds-m-top_small">
            {SAMPLE_TRANSCRIPTS.map((s) => (
              <div className="slds-col slds-no-flex slds-m-bottom_x-small" key={s.label}>
                <button
                  onClick={() => loadSample(s)}
                  className="slds-button slds-button_neutral slds-button_small"
                >
                  Load example: {s.label}
                </button>
              </div>
            ))}
          </div>

          <div className="slds-form-element slds-m-top_small">
            <div className="slds-form-element__control">
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  resetDownstream();
                }}
                rows={4}
                placeholder={`Paste or type the ${CHANNEL_LABELS[channel].toLowerCase()} transcript / message here…`}
                className="slds-textarea"
              />
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={!transcript.trim() || isAnalyzing}
            className="slds-button slds-button_brand slds-m-top_small"
          >
            {isAnalyzing ? "Analysing…" : "Analyse with AI"}
          </button>
        </div>
      </article>

      {analysis && caseType && (
        <>
          {/* Step 1 — summary + category */}
          <article className="slds-card">
            <div className="slds-card__body slds-card__body_inner">
              <h2 className="slds-text-title_caps slds-text-color_weak slds-grid slds-grid_vertical-align-center">
                Step 1 · Summary &amp; categorisation
                <SourceBadge source={analysisSource} />
              </h2>
              <p className="slds-text-body_regular slds-m-top_x-small">{analysis.summary}</p>

              {analysis.clarifyingQuestions.length > 0 && (
                <div className="slds-box slds-theme_shade slds-m-top_small">
                  <p className="slds-text-title_caps slds-text-color_weak">AI suggests asking the customer:</p>
                  <ul className="slds-list_dotted slds-m-top_x-small">
                    {analysis.clarifyingQuestions.map((q) => (
                      <li key={q} className="slds-text-body_small">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="slds-m-top_medium">
                <p className="slds-form-element__label slds-m-bottom_x-small">
                  Case category{" "}
                  <span className="slds-text-body_small slds-text-color_weak">
                    (AI-suggested — 5 options, so it renders as radio buttons per the rules engine;
                    confirm or change it)
                  </span>
                </p>
                <div className="slds-grid slds-wrap slds-gutters_x-small">
                  {CASE_TYPES.map((ct) => (
                    <div className="slds-col slds-no-flex slds-m-bottom_x-small" key={ct.id}>
                      <span className="slds-radio">
                        <input
                          type="radio"
                          id={`case-type-${ct.id}`}
                          name="case-type"
                          checked={selectedCaseTypeId === ct.id}
                          onChange={() => {
                            setSelectedCaseTypeId(ct.id);
                            setCompletedTasks(new Set());
                            setRoutedToFraudQueue(false);
                          }}
                        />
                        <label
                          className={`slds-radio__label slds-box slds-box_x-small slds-p-horizontal_small ${
                            selectedCaseTypeId === ct.id ? "slds-theme_shade" : ""
                          }`}
                          htmlFor={`case-type-${ct.id}`}
                        >
                          <span className="slds-radio_faux" />
                          <span className="slds-form-element__label">
                            {ct.label}
                            {ct.id === analysis.suggestedCaseTypeId && (
                              <span className="slds-badge slds-badge_lightest slds-m-left_x-small">AI pick</span>
                            )}
                          </span>
                        </label>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Fraud signal */}
          {caseType.isFraudRisk && (
            <article className="slds-card">
              <div className="slds-card__body slds-card__body_inner slds-theme_error">
                <p className="slds-text-heading_small">⚠ Fraud signal detected</p>
                <p className="slds-text-body_small slds-m-top_xx-small">
                  This case matches patterns associated with unauthorised transactions. Recommended:
                  route to the Fraud queue and freeze the affected card before continuing.
                </p>
                {routedToFraudQueue ? (
                  <p className="slds-text-body_regular slds-m-top_small" style={{ fontWeight: 600 }}>
                    ✓ Routed to Fraud queue and logged.
                  </p>
                ) : (
                  <button
                    onClick={() => setRoutedToFraudQueue(true)}
                    className="slds-button slds-button_destructive slds-m-top_small"
                  >
                    Route to Fraud queue
                  </button>
                )}
              </div>
            </article>
          )}

          {/* Step 2 — roadmap */}
          <article className="slds-card">
            <div className="slds-card__body slds-card__body_inner">
              <div className="slds-grid slds-grid_align-spread slds-grid_vertical-align-center">
                <h2 className="slds-text-title_caps slds-text-color_weak">Step 2 &amp; 3 · Roadmap to resolution</h2>
                <span className="slds-text-body_small slds-text-color_weak">{progress}% complete</span>
              </div>
              <div className="slds-progress-bar slds-progress-bar_small slds-m-top_x-small" aria-valuenow={progress}>
                <span className="slds-progress-bar__value" style={{ width: `${progress}%` }}>
                  <span className="slds-assistive-text">Progress: {progress}%</span>
                </span>
              </div>
              <ul className="slds-m-top_medium">
                {caseType.roadmap.map((task, i) => (
                  <li key={task} className="slds-grid slds-p-vertical_xx-small">
                    <span className="slds-checkbox">
                      <input
                        type="checkbox"
                        id={`task-${i}`}
                        checked={completedTasks.has(task)}
                        onChange={() => toggleTask(task)}
                      />
                      <label className="slds-checkbox__label" htmlFor={`task-${i}`}>
                        <span className="slds-checkbox_faux" />
                        <span
                          className={`slds-form-element__label slds-text-body_regular ${
                            completedTasks.has(task) ? "slds-text-color_weak" : ""
                          }`}
                          style={completedTasks.has(task) ? { textDecoration: "line-through" } : undefined}
                        >
                          {i + 1}. {task}
                        </span>
                      </label>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Draft assist */}
          <article className="slds-card">
            <div className="slds-card__body slds-card__body_inner">
              <h2 className="slds-text-title_caps slds-text-color_weak slds-grid slds-grid_vertical-align-center">
                Draft a reply
                <SourceBadge source={draftSource} />
              </h2>
              <div className="slds-grid slds-grid_vertical-align-center slds-gutters_x-small slds-m-top_small slds-wrap">
                <div className="slds-col slds-no-flex">
                  <div className="slds-radio_button-group" role="radiogroup" aria-label="Tone">
                    {(["empathetic", "formal", "concise"] as Tone[]).map((t) => (
                      <span key={t} className="slds-button slds-radio_button">
                        <input
                          type="radio"
                          id={`tone-${t}`}
                          name="tone"
                          checked={tone === t}
                          onChange={() => setTone(t)}
                        />
                        <label className="slds-radio_button__label" htmlFor={`tone-${t}`}>
                          <span className="slds-radio_faux" style={{ textTransform: "capitalize" }}>
                            {t}
                          </span>
                        </label>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="slds-col slds-no-flex">
                  <button
                    onClick={generateDraft}
                    disabled={isDrafting}
                    className="slds-button slds-button_brand slds-button_small"
                  >
                    {isDrafting ? "Writing…" : draft ? "Regenerate" : "Generate draft"}
                  </button>
                </div>
              </div>
              <div className="slds-form-element slds-m-top_small">
                <div className="slds-form-element__control">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    placeholder="AI-drafted reply will appear here — fully editable before you send."
                    className="slds-textarea"
                  />
                </div>
              </div>
            </div>
          </article>
        </>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: "real" | "simulated" | null }) {
  if (!source) return null;
  return source === "real" ? (
    <span className="slds-badge slds-theme_success slds-m-left_x-small" style={{ textTransform: "none" }}>
      Claude Opus 5
    </span>
  ) : (
    <span className="slds-badge slds-badge_lightest slds-m-left_x-small" style={{ textTransform: "none" }}>
      simulated
    </span>
  );
}
