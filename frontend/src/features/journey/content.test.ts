import { describe, expect, it } from "vitest";
import { assessmentQuestions, interviewQuestions, roles } from "./content";

describe("career journey content", () => {
  it("keeps the seminar assessment concise and valid", () => {
    expect(assessmentQuestions).toHaveLength(5);
    for (const question of assessmentQuestions) {
      expect(question.options[question.answer]).toBeTruthy();
    }
  });

  it("offers enough interview and direction choices", () => {
    expect(interviewQuestions.length).toBeGreaterThanOrEqual(3);
    expect(roles.length).toBeGreaterThanOrEqual(3);
  });
});

