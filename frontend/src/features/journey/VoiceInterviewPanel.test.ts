import { describe, expect, it } from "vitest";
import { getAdaptiveFollowUp } from "./VoiceInterviewPanel";

describe("adaptive interview follow-up", () => {
  it("asks for measurable evidence when a complete answer has no scale", () => {
    expect(
      getAdaptiveFollowUp(
        "I cleaned the survey data, compared the customer segments, and presented my recommendation clearly to the entire project team.",
      ),
    ).toContain("measurable");
  });

  it("moves to reflection after an answer includes scale and outcome", () => {
    expect(
      getAdaptiveFollowUp(
        "I analyzed 1,200 responses, improved reporting time by 30 percent, and the result helped the team choose the final recommendation.",
      ),
    ).toContain("differently");
  });
});

