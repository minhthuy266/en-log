import { describe, expect, it } from "vitest";
import { addCalendarDays, scheduleNextReview } from "./review-scheduler";

describe("scheduleNextReview", () => {
  it.each([
    [0, 1, "2026-07-18"],
    [1, 2, "2026-07-22"],
    [2, 3, "2026-07-29"],
    [3, 4, "2026-08-14"],
  ])("advances step %s", (currentStep, nextStep, nextReviewOn) => {
    expect(scheduleNextReview({ currentStep, outcome: "remembered", reviewedOn: "2026-07-15" })).toEqual({
      nextStep,
      nextReviewOn,
      completed: false,
    });
  });

  it("graduates after the 30-day review", () => {
    expect(scheduleNextReview({ currentStep: 4, outcome: "remembered", reviewedOn: "2026-07-15" })).toEqual({
      nextStep: 5,
      nextReviewOn: null,
      completed: true,
    });
  });

  it("resets a forgotten rule to tomorrow", () => {
    expect(scheduleNextReview({ currentStep: 3, outcome: "forgotten", reviewedOn: "2026-07-15" })).toEqual({
      nextStep: 0,
      nextReviewOn: "2026-07-16",
      completed: false,
    });
  });

  it("uses calendar arithmetic at month, year and leap-day boundaries", () => {
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addCalendarDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("rejects impossible calendar dates", () => {
    expect(() => addCalendarDays("2026-02-30", 1)).toThrow();
  });
});
