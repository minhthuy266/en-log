import { captureReasons, errorTypes, sections } from "./constants";
import type { ErrorFormValues } from "./validations/error";
import type { RuleFormValues } from "./validations/rule";

export const STRUCTURED_IMPORT_PROMPT = `You are an expert exam error analyst. Analyze exactly ONE question at a time. Your goal is to identify the missed signal and create one short, transferable rule that helps with unseen questions.

Important rules:
- Use only the information I provide. Never invent a transcript, answer, explanation, or source detail.
- If essential information is missing, return only: NEED_MORE_CONTEXT: followed by what is missing.
- Infer SECTION from 1 to 7 when possible. If I provide it, keep it.
- REASON must be exactly one of: wrong, guessed_correct, too_slow.
- ERROR_TYPES must use one or more of these exact values: grammar, vocabulary, collocation, audio_detail, audio_inference, decoy, text_detail, text_inference, paraphrase, careless, time_management, other.
- Keep CONTEXT to the smallest excerpt needed to understand the mistake. Do not reproduce an entire test.
- EXPLANATION must identify the evidence, why my choice failed, and why the correct answer wins.
- RULE must be general and reusable. Do not merely restate this question.
- Keep the labels in English exactly as shown below. Field content may be in Vietnamese, except English expressions and grammar patterns should remain in English.
- Return only the labeled output. Do not use Markdown fences, headings, bullets, or extra commentary.

Section-specific focus:
- Section 1: image evidence, action/state, tense, preposition, sound-alike decoy.
- Section 2: question type, direct/indirect response, intent, sound-alike or repeated-word decoy.
- Section 3: speaker purpose, relationship, detail, inference, next action, paraphrase, visual information.
- Section 4: talk purpose, audience, detail, inference, next action, paraphrase, visual information.
- Section 5: grammar structure, word form, vocabulary, collocation, fixed expression.
- Section 6: grammar, vocabulary, sentence cohesion, reference words, logical sentence insertion.
- Section 7: explicit evidence, paraphrase, inference, purpose, vocabulary in context, single/multiple-text linkage.

Return exactly this structure:

SECTION: 1-7
REASON: wrong | guessed_correct | too_slow
ERROR_TYPES: comma-separated values
QUESTION: the question or shortest useful memory cue
CONTEXT: only the relevant passage, transcript excerpt, or image evidence
OPTION_A:
OPTION_B:
OPTION_C:
OPTION_D:
MY_ANSWER:
CORRECT_ANSWER:
EXPLANATION: evidence, failure reason, and why the correct answer wins
RULE_TITLE: a short recall prompt
RULE: one transferable rule that applies to unseen questions
KEYWORDS: comma-separated recall keywords
SOURCE:
REFERENCE:
QUESTION_NUMBER:
TIME_SECONDS:

I will paste the question and my attempt after this prompt.`;

type ParsedImport = {
  error: Partial<ErrorFormValues>;
  rule: RuleFormValues | null;
};

const aliases: Record<string, string> = {
  section: "section", part: "section",
  reason: "capture_reason", capture_reason: "capture_reason", result: "capture_reason",
  error_type: "error_types", error_types: "error_types", errors: "error_types",
  question: "question_text", question_text: "question_text", prompt: "question_text",
  context: "context_excerpt", context_excerpt: "context_excerpt", passage: "context_excerpt", transcript: "context_excerpt",
  option_a: "option_a", a: "option_a", option_b: "option_b", b: "option_b",
  option_c: "option_c", c: "option_c", option_d: "option_d", d: "option_d",
  my_answer: "my_answer", selected_answer: "my_answer", your_answer: "my_answer",
  correct_answer: "correct_answer", answer: "correct_answer",
  explanation: "explanation", analysis: "explanation", why_wrong: "explanation",
  rule_title: "rule_title", rule: "rule_text", rule_text: "rule_text",
  keywords: "keywords", source: "source_name", source_name: "source_name",
  reference: "source_reference", source_reference: "source_reference",
  question_number: "question_number", number: "question_number",
  time_seconds: "time_spent_seconds", time_spent_seconds: "time_spent_seconds", time: "time_spent_seconds",
  date: "occurred_on", occurred_on: "occurred_on",
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/\*\*/g, "").trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function valueAsText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(String).join(", ");
  return "";
}

function parseLabeledText(text: string) {
  const values: Record<string, string> = {};
  let currentKey: string | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const labeled = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([A-Za-z][A-Za-z0-9 _-]*?)(?:\*\*)?\s*:\s*(.*)$/);
    const heading = line.match(/^\s*#{1,6}\s+(.+?)\s*$/);
    const candidate = labeled?.[1] ?? heading?.[1];
    const canonical = candidate ? aliases[normalizeKey(candidate)] : undefined;
    if (canonical) {
      currentKey = canonical;
      values[canonical] = labeled?.[2]?.trim() ?? "";
    } else if (currentKey && line.trim()) {
      values[currentKey] = `${values[currentKey]}\n${line.trim()}`.trim();
    }
  }
  return values;
}

function normalizeInput(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const root = asRecord(JSON.parse(trimmed));
    if (!root) return parseLabeledText(trimmed);
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(root)) {
      if (key === "rule") continue;
      const canonical = aliases[normalizeKey(key)];
      if (canonical) values[canonical] = valueAsText(value);
    }
    const rule = asRecord(root.rule);
    if (rule) {
      values.rule_title = valueAsText(rule.title ?? rule.rule_title);
      values.rule_text = valueAsText(rule.rule_text ?? rule.text);
      values.keywords = valueAsText(rule.keywords);
    }
    return values;
  } catch {
    return parseLabeledText(trimmed);
  }
}

function parseSection(value: string) {
  const number = value.match(/[1-7]/)?.[0];
  const section = number ? `section_${number}` : "";
  return sections.find((item) => item === section);
}

function parseReason(value: string) {
  const normalized = normalizeKey(value);
  const map: Record<string, (typeof captureReasons)[number]> = {
    wrong: "wrong", incorrect: "wrong", guessed_correct: "guessed_correct",
    guessed_right: "guessed_correct", correct_guess: "guessed_correct",
    too_slow: "too_slow", slow: "too_slow", time_management: "too_slow",
  };
  return map[normalized] ?? captureReasons.find((item) => item === normalized);
}

function parseErrorTypes(value: string) {
  const neutralAliases: Record<string, (typeof errorTypes)[number]> = {
    audio_detail: "listening_detail",
    audio_inference: "listening_inference",
    decoy: "distractor",
    text_detail: "reading_detail",
    text_inference: "reading_inference",
  };
  const requested = value.split(/[,;|\n]+/).map(normalizeKey).map((item) => neutralAliases[item] ?? item);
  return [...new Set(requested.filter((item): item is (typeof errorTypes)[number] => errorTypes.includes(item as (typeof errorTypes)[number])))];
}

function positiveInteger(value: string) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export function parseStructuredImport(text: string): ParsedImport {
  if (!text.trim()) throw new Error("Paste structured text first.");
  const values = normalizeInput(text);
  const error: Partial<ErrorFormValues> = {};
  const section = parseSection(values.section ?? "");
  const reason = parseReason(values.capture_reason ?? "");
  const parsedErrorTypes = parseErrorTypes(values.error_types ?? "");
  if (section) error.section = section;
  if (reason) error.capture_reason = reason;
  if (parsedErrorTypes.length) error.error_types = parsedErrorTypes;
  const textFields = ["question_text", "context_excerpt", "option_a", "option_b", "option_c", "option_d", "my_answer", "correct_answer", "explanation", "source_name", "source_reference", "occurred_on"] as const;
  for (const field of textFields) if (values[field]) error[field] = values[field];
  const questionNumber = positiveInteger(values.question_number ?? "");
  const timeSpent = positiveInteger(values.time_spent_seconds ?? "");
  if (questionNumber) error.question_number = questionNumber;
  if (timeSpent) error.time_spent_seconds = timeSpent;
  const ruleText = values.rule_text?.trim() ?? "";
  const rule = ruleText ? {
    title: values.rule_title?.trim() || ruleText.slice(0, 72),
    rule_text: ruleText,
    keywords: values.keywords?.trim() ?? "",
  } satisfies RuleFormValues : null;
  if (!error.question_text && !rule) throw new Error("No recognized QUESTION or RULE field found.");
  return { error, rule };
}
