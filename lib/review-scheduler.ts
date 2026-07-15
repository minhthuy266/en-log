export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

export type ReviewOutcome = "remembered" | "forgotten";

export type ReviewSchedule = {
  nextStep: number;
  nextReviewOn: string | null;
  completed: boolean;
};

function parseCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("reviewedOn must use YYYY-MM-DD format");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("reviewedOn must be a valid calendar date");
  }

  return date;
}

export function addCalendarDays(value: string, days: number) {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayAsCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function scheduleNextReview({
  currentStep,
  outcome,
  reviewedOn,
}: {
  currentStep: number;
  outcome: ReviewOutcome;
  reviewedOn: string;
}): ReviewSchedule {
  if (!Number.isInteger(currentStep) || currentStep < 0 || currentStep >= REVIEW_INTERVALS.length) {
    throw new Error("currentStep must be between 0 and 4");
  }

  parseCalendarDate(reviewedOn);

  if (outcome === "forgotten") {
    return {
      nextStep: 0,
      nextReviewOn: addCalendarDays(reviewedOn, REVIEW_INTERVALS[0]),
      completed: false,
    };
  }

  const nextStep = currentStep + 1;
  if (nextStep >= REVIEW_INTERVALS.length) {
    return { nextStep: REVIEW_INTERVALS.length, nextReviewOn: null, completed: true };
  }

  return {
    nextStep,
    nextReviewOn: addCalendarDays(reviewedOn, REVIEW_INTERVALS[nextStep]),
    completed: false,
  };
}
