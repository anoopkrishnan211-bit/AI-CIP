import { describe, expect, it } from "vitest";
import { assessmentQuestions, interviewQuestions } from "./content";

describe("career journey content", () => {
  it("keeps the seminar assessment concise and valid", () => {
    expect(assessmentQuestions).toHaveLength(5);
    for (const question of assessmentQuestions) {
      expect(question.options[question.answer]).toBeTruthy();
    }
  });

  it("collects interview evidence before the engine recommends a direction", () => {
    expect(interviewQuestions.length).toBeGreaterThanOrEqual(3);
  });
});
