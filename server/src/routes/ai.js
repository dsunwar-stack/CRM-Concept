import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Real-AI backend for the Agent Workspace's "Analyse with AI" / "Generate
// draft" actions. Mirrors client/src/lib/simulatedAI.ts's contract so the
// frontend can call this first and fall back to the local simulation if
// no API key is configured or the call fails — no code changes needed to
// go from demo mode to a real model, just set ANTHROPIC_API_KEY.

const CASE_TYPES = [
  { id: "fraud", label: "Fraud / Unauthorised Transaction" },
  { id: "billing", label: "Billing Dispute" },
  { id: "access", label: "Account Access" },
  { id: "complaint", label: "Service Complaint" },
  { id: "general", label: "General Inquiry" },
];

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function notConfigured(res) {
  return res.status(503).json({
    error:
      "AI is not configured on this server. Set ANTHROPIC_API_KEY in server/.env and restart the API to enable real analysis.",
  });
}

function handleAnthropicError(err, res) {
  if (err instanceof Anthropic.AuthenticationError) {
    return res.status(502).json({ error: "The configured ANTHROPIC_API_KEY was rejected." });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return res.status(429).json({ error: "Rate limited by the Anthropic API — try again shortly." });
  }
  if (err instanceof Anthropic.APIError) {
    return res.status(502).json({ error: `Anthropic API error: ${err.message}` });
  }
  console.error(err);
  return res.status(500).json({ error: "Unexpected error calling the AI backend." });
}

router.post("/analyze", async (req, res) => {
  const client = getClient();
  if (!client) return notConfigured(res);

  const transcript = String(req.body?.transcript ?? "").trim();
  if (!transcript) return res.status(400).json({ error: "transcript is required." });

  const caseTypeList = CASE_TYPES.map((c) => `- ${c.id}: ${c.label}`).join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      system:
        "You triage customer support interactions (call/chat/email transcripts) for an operations team. " +
        "Reply with ONLY a single JSON object — no prose, no markdown fences — matching exactly this shape: " +
        '{"summary": string, "clarifyingQuestions": string[], "suggestedCaseTypeId": string, "confidence": "high"|"medium"|"low"}. ' +
        `suggestedCaseTypeId must be exactly one of these ids:\n${caseTypeList}\n` +
        "clarifyingQuestions should be 0-3 short questions an agent might still need to ask the customer; use an empty array if none are needed.",
      messages: [{ role: "user", content: `Transcript:\n${transcript}` }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) throw new Error("No text content in AI response.");

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const match = textBlock.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI response was not valid JSON.");
      parsed = JSON.parse(match[0]);
    }

    if (!CASE_TYPES.some((c) => c.id === parsed.suggestedCaseTypeId)) {
      parsed.suggestedCaseTypeId = "general";
    }

    res.json({
      summary: String(parsed.summary ?? ""),
      clarifyingQuestions: Array.isArray(parsed.clarifyingQuestions) ? parsed.clarifyingQuestions : [],
      suggestedCaseTypeId: parsed.suggestedCaseTypeId,
      confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "medium",
      source: "claude-opus-5",
    });
  } catch (err) {
    handleAnthropicError(err, res);
  }
});

router.post("/draft", async (req, res) => {
  const client = getClient();
  if (!client) return notConfigured(res);

  const { caseTypeLabel, tone, transcript } = req.body ?? {};
  if (!caseTypeLabel || !tone) {
    return res.status(400).json({ error: "caseTypeLabel and tone are required." });
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 512,
      output_config: { effort: "low" },
      system:
        "You draft customer support reply messages for an operations agent to review and send. " +
        "Write only the reply body — no subject line, no placeholders in brackets, no markdown. " +
        `Tone: ${tone}. Case type: ${caseTypeLabel}.`,
      messages: [
        {
          role: "user",
          content: `Original customer message:\n${transcript || "(no transcript provided)"}\n\nDraft the reply.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    res.json({ draft: textBlock?.text ?? "", source: "claude-opus-5" });
  } catch (err) {
    handleAnthropicError(err, res);
  }
});

export default router;
