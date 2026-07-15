export const sections = ["section_1", "section_2", "section_3", "section_4", "section_5", "section_6", "section_7"] as const;

export const captureReasons = ["wrong", "guessed_correct", "too_slow"] as const;

export const errorTypes = [
  "grammar",
  "vocabulary",
  "collocation",
  "listening_detail",
  "listening_inference",
  "distractor",
  "reading_detail",
  "reading_inference",
  "paraphrase",
  "careless",
  "time_management",
  "other",
] as const;

export const reviewOutcomes = ["remembered", "forgotten"] as const;

export const sectionLabels: Record<(typeof sections)[number], string> = {
  section_1: "Section 1",
  section_2: "Section 2",
  section_3: "Section 3",
  section_4: "Section 4",
  section_5: "Section 5",
  section_6: "Section 6",
  section_7: "Section 7",
};

export const captureReasonLabels: Record<(typeof captureReasons)[number], string> = {
  wrong: "Wrong",
  guessed_correct: "Guessed right",
  too_slow: "Too slow",
};

export const errorTypeLabels: Record<(typeof errorTypes)[number], string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  collocation: "Collocation",
  listening_detail: "Audio detail",
  listening_inference: "Audio inference",
  distractor: "Decoy",
  reading_detail: "Text detail",
  reading_inference: "Text inference",
  paraphrase: "Paraphrase",
  careless: "Careless",
  time_management: "Time management",
  other: "Other",
};
