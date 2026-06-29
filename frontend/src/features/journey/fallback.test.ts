import { describe, expect, it } from "vitest";
import { sampleResume } from "./content";
import { buildFallbackReport } from "./fallback";

describe("local Career Intelligence fallback", () => {
  it("preserves explainable rankings when the API is unavailable", () => {
    const report = buildFallbackReport(
      {
        name: "Maya",
        education: "B.Com",
        experienceLevel: "Student / fresher",
        careerGoal: "",
      },
      sampleResume,
      {
        intro: "I built a dashboard and presented the decision to my project team.",
        evidence: "I cleaned the data, analyzed the pattern, and explained the result.",
        growth: "I practise SQL each week and document what I learn.",
      },
      {
        metric: 2,
        sql: 1,
        insight: 1,
        bias: 0,
        priority: 2,
      },
    );

    expect(report.careerIntelligence.careerMatches).toHaveLength(6);
    expect(report.careerAlternatives).toHaveLength(5);
    expect(report.evidenceRecommendations.every((item) => item.evidence)).toBe(true);
    expect(report.roadmap.map((item) => item.period)).toEqual([
      "Next 30 days",
      "Next 60 days",
      "Next 90 days",
    ]);
  });
});

