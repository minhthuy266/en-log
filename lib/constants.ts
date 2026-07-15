export const toeicParts = ["part_1", "part_2", "part_3", "part_4", "part_5", "part_6", "part_7"] as const;

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

export const partLabels: Record<(typeof toeicParts)[number], string> = {
  part_1: "Part 1",
  part_2: "Part 2",
  part_3: "Part 3",
  part_4: "Part 4",
  part_5: "Part 5",
  part_6: "Part 6",
  part_7: "Part 7",
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
  listening_detail: "Listening detail",
  listening_inference: "Listening inference",
  distractor: "Distractor",
  reading_detail: "Reading detail",
  reading_inference: "Reading inference",
  paraphrase: "Paraphrase",
  careless: "Careless",
  time_management: "Time management",
  other: "Other",
};
