import { describe, expect, it } from "vitest";
import { parseStructuredImport } from "./structured-import";

describe("parseStructuredImport", () => {
  it("parses long labeled text and multiline fields", () => {
    const result = parseStructuredImport(`
SECTION: 7
REASON: guessed right
ERROR_TYPES: text inference, paraphrase, decoy
QUESTION: What is implied about the delivery?
CONTEXT: The shipment was expected Monday.
It did not leave the warehouse until Tuesday.
MY_ANSWER: B
CORRECT_ANSWER: D
EXPLANATION: I matched a repeated word instead of the implied timeline.
RULE_TITLE: Infer from timeline shifts
RULE: Compare expected and actual event times before choosing an inference.
KEYWORDS: expected, actual, timeline
QUESTION_NUMBER: 188
TIME_SECONDS: 95
`);
    expect(result.error).toMatchObject({
      section: "section_7", capture_reason: "guessed_correct",
      error_types: ["reading_inference", "paraphrase", "distractor"],
      question_number: 188, time_spent_seconds: 95,
    });
    expect(result.error.context_excerpt).toContain("Tuesday");
    expect(result.rule?.title).toBe("Infer from timeline shifts");
  });

  it("parses JSON including a nested rule", () => {
    const result = parseStructuredImport(JSON.stringify({
      section: 5, reason: "wrong", error_types: ["grammar", "collocation"],
      question: "The manager insisted ___ reviewing the figures.",
      correct_answer: "on", rule: { title: "insist on", rule_text: "insist on + noun/V-ing", keywords: ["insist", "on"] },
    }));
    expect(result.error.section).toBe("section_5");
    expect(result.error.error_types).toEqual(["grammar", "collocation"]);
    expect(result.rule?.keywords).toBe("insist, on");
  });

  it("rejects unstructured text with no recognized fields", () => {
    expect(() => parseStructuredImport("A long answer with no supported labels.")).toThrow();
  });
});
