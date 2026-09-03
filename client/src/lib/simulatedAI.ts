// Deterministic, keyword-based stand-in for a real LLM call. This runs
// entirely client-side — no API key, no network call, no real customer
// data involved — so the interactive flow can be demoed immediately.
// Swapping this module for a real model call is the only change needed
// to make the workflow genuinely AI-powered later.

export interface CaseType {
  id: string;
  label: string;
  isFraudRisk?: boolean;
  roadmap: string[];
}

export const CASE_TYPES: CaseType[] = [
  {
    id: "fraud",
    label: "Fraud / Unauthorised Transaction",
    isFraudRisk: true,
    roadmap: [
      "Verify customer identity (security questions)",
      "Freeze the card / account",
      "Log a fraud case with transaction references",
      "Route to the Fraud queue",
      "Send the customer a fraud-confirmation notice",
    ],
  },
  {
    id: "billing",
    label: "Billing Dispute",
    roadmap: [
      "Verify account identity",
      "Pull the last 3 transactions",
      "Check for a duplicate or mis-applied charge",
      "Issue a refund or explain the charge",
      "Send a confirmation email",
    ],
  },
  {
    id: "access",
    label: "Account Access",
    roadmap: [
      "Verify identity",
      "Send a password reset link",
      "Confirm the MFA device",
      "Unlock the account",
      "Confirm the issue is resolved",
    ],
  },
  {
    id: "complaint",
    label: "Service Complaint",
    roadmap: [
      "Acknowledge and empathise",
      "Review case history",
      "Offer a resolution or goodwill gesture",
      "Log complaint details",
      "Schedule a 48-hour follow-up",
    ],
  },
  {
    id: "general",
    label: "General Inquiry",
    roadmap: [
      "Understand the question",
      "Provide the answer or a resource link",
      "Confirm the customer is satisfied",
      "Close the case",
    ],
  },
];

export interface SampleTranscript {
  channel: "call" | "chat" | "email";
  label: string;
  text: string;
}

export const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    channel: "call",
    label: "Unrecognised transaction",
    text: "Customer: Hi, I'm looking at my statement and there's a £340 charge from a merchant I've never heard of. I definitely didn't make this purchase, my card must have been stolen or something. Can someone help me sort this out urgently?",
  },
  {
    channel: "chat",
    label: "Duplicate charge",
    text: "Customer: Hey, I think I got charged twice for my subscription this month. £29.99 shows up on the 1st and again on the 3rd. Can you check and refund the extra one?",
  },
  {
    channel: "email",
    label: "Locked out of account",
    text: "Subject: Can't log in\n\nHi, I've been trying to log into my account since yesterday and it keeps saying my password is incorrect, even after I reset it twice. I also don't seem to be getting the verification code. Please help, I need access today.",
  },
  {
    channel: "chat",
    label: "Frustrated, general complaint",
    text: "Customer: This is the third time I've had to contact you about the same issue and nobody seems to actually fix it. I'm honestly considering cancelling. Can someone actually help me this time?",
  },
];

export interface Analysis {
  summary: string;
  clarifyingQuestions: string[];
  suggestedCaseTypeId: string;
  confidence: "high" | "medium" | "low";
}

const KEYWORD_RULES: { pattern: RegExp; caseTypeId: string }[] = [
  { pattern: /\b(fraud|unauthoris|unauthoriz|didn'?t make|stolen|never heard of|not mine)\b/i, caseTypeId: "fraud" },
  { pattern: /\b(charged twice|duplicate|refund|billing|invoice|overcharged)\b/i, caseTypeId: "billing" },
  { pattern: /\b(log ?in|password|locked out|access|mfa|verification code)\b/i, caseTypeId: "access" },
  { pattern: /\b(complain|unhappy|frustrat|third time|cancel|poor service)\b/i, caseTypeId: "complaint" },
];

export function analyzeTranscript(text: string): Analysis {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      summary: "No transcript provided yet.",
      clarifyingQuestions: [],
      suggestedCaseTypeId: "general",
      confidence: "low",
    };
  }

  const match = KEYWORD_RULES.find((rule) => rule.pattern.test(trimmed));
  const caseTypeId = match?.caseTypeId ?? "general";
  const caseType = CASE_TYPES.find((c) => c.id === caseTypeId)!;

  const firstSentence = trimmed.split(/[.?!\n]/)[0]?.trim().slice(0, 160) || trimmed.slice(0, 160);

  const summaries: Record<string, string> = {
    fraud: `Customer reports an unrecognised or unauthorised transaction. Possible fraud signal detected — treat as a priority.`,
    billing: `Customer reports being charged more than once, or disputes a charge on their account.`,
    access: `Customer is unable to log into their account and needs help regaining access.`,
    complaint: `Customer expresses frustration about a recurring or unresolved issue.`,
    general: `Customer has a general question or request. No strong signal for a specific case type — confirm the category manually.`,
  };

  const clarifyingQuestions: string[] = [];
  if (caseTypeId === "fraud") {
    clarifyingQuestions.push("Has the customer's card already been used for other unexpected charges?");
    clarifyingQuestions.push("Does the customer still have physical possession of their card?");
  }
  if (caseTypeId === "billing") {
    clarifyingQuestions.push("Can the customer confirm the exact dates and amounts of both charges?");
  }
  if (caseTypeId === "access") {
    clarifyingQuestions.push("Is the customer able to receive the MFA code on their registered device?");
  }
  if (caseTypeId === "general") {
    clarifyingQuestions.push("Could you ask the customer to clarify what specifically they need help with?");
  }

  return {
    summary: `${summaries[caseTypeId]} (opening line: "${firstSentence}${firstSentence.length >= 160 ? "…" : ""}")`,
    clarifyingQuestions,
    suggestedCaseTypeId: caseType.id,
    confidence: match ? "high" : "low",
  };
}

const TONE_OPENERS: Record<string, string> = {
  empathetic: "I completely understand how concerning this must be, and I'm really sorry for the trouble this has caused.",
  formal: "Thank you for bringing this to our attention. We have reviewed the details of your case.",
  concise: "Thanks for the details — here's where things stand.",
};

const CASE_TYPE_BODY: Record<string, string> = {
  fraud:
    "We've flagged this as a potential fraud case and have frozen the affected card as a precaution. Our fraud team is investigating the transaction and you will not be held liable for any confirmed unauthorised charges. A replacement card is on its way.",
  billing:
    "We've reviewed your recent transactions and can confirm the duplicate charge. A refund of the extra amount has been issued and should appear on your statement within 3-5 business days.",
  access:
    "We've reset your account access and sent a new verification link to your registered email. If the code still doesn't arrive, please check that your device's date/time is set correctly, as this can affect verification.",
  complaint:
    "We're sorry this has happened more than once — that's not the experience we want for you. We've reviewed the case history and are taking steps to make sure this doesn't recur, and we'd like to offer a goodwill credit for the inconvenience.",
  general:
    "Here's the information you asked about. Please let us know if anything is still unclear and we're happy to help further.",
};

const TONE_CLOSERS: Record<string, string> = {
  empathetic: "Please don't hesitate to reach back out if there's anything else at all — we're here for you.",
  formal: "Please contact us if you require any further assistance regarding this matter.",
  concise: "Let us know if you need anything else.",
};

export function draftReply(caseTypeId: string, tone: "empathetic" | "formal" | "concise"): string {
  const opener = TONE_OPENERS[tone];
  const body = CASE_TYPE_BODY[caseTypeId] ?? CASE_TYPE_BODY.general;
  const closer = TONE_CLOSERS[tone];
  return `${opener}\n\n${body}\n\n${closer}`;
}
