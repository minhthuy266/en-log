export const queryKeys = {
  questions: ["questions"] as const,
  question: (id: string) => ["questions", id] as const,
  rules: ["rules"] as const,
  reviews: ["reviews"] as const,
  mockTests: ["mock-tests"] as const,
  analytics: ["analytics"] as const,
};
