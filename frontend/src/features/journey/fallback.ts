import type {
  BasicProfile,
  CareerMatch,
  CareerReport,
  ResumeAnalysis,
} from "@/types/career";
import { assessmentQuestions, interviewQuestions } from "./content";

const roleProfiles = [
  ["data-analyst", "Data Analyst", ["SQL", "Excel", "Power BI", "Statistics"]],
  ["business-analyst", "Business Analyst", ["Requirements", "Process Mapping", "SQL", "Agile"]],
  ["product-analyst", "Product Analyst", ["SQL", "Analytics", "Experiments", "Product Metrics"]],
  ["operations-analyst", "Operations Analyst", ["Excel", "Process Improvement", "SQL", "Reporting"]],
  ["digital-marketing-analyst", "Digital Marketing Analyst", ["Analytics", "Excel", "SEO", "Campaign Analysis"]],
  ["project-coordinator", "Project Coordinator", ["Project Management", "Communication", "Agile", "Excel"]],
] as const;

export function buildFallbackReport(
  profile: BasicProfile,
  resume: ResumeAnalysis,
  interviewAnswers: Record<string, string>,
  assessmentAnswers: Record<string, number>,
): CareerReport {
  const correct = assessmentQuestions.filter(
    (question) => assessmentAnswers[question.id] === question.answer,
  ).length;
  const assessment = Math.round((correct / assessmentQuestions.length) * 100);
  const completeAnswers = interviewQuestions.filter(
    (question) => (interviewAnswers[question.id]?.trim().length ?? 0) >= 40,
  ).length;
  const interview = 55 + Math.round((completeAnswers / 3) * 35);
  const current = new Set(resume.skills.map((skill) => skill.toLowerCase()));
  const aspiration = profile.careerGoal.toLowerCase();

  const matches: CareerMatch[] = roleProfiles
    .map(([roleId, title, skills]) => {
      const matched = skills.filter((skill) => current.has(skill.toLowerCase()));
      const gaps = skills.filter((skill) => !current.has(skill.toLowerCase()));
      const score =
        resume.atsScore * 0.22 +
        assessment * 0.3 +
        interview * 0.28 +
        (matched.length / skills.length) * 20 +
        (aspiration.includes(title.split(" ")[0].toLowerCase()) ? 6 : 0);
      return { roleId, title, skills, gaps, score: Math.min(96, score) };
    })
    .sort((a, b) => b.score - a.score)
    .map((role, index, all) => ({
      roleId: role.roleId,
      title: role.title,
      rank: index + 1,
      score: Math.round(role.score),
      confidence: Math.max(48, 78 - index * 3),
      interviewReadiness: interview,
      hiringReadiness: Math.round(
        role.score * 0.55 + resume.atsScore * 0.25 + assessment * 0.2,
      ),
      industryReadiness: Math.round(
        role.score * 0.75 + assessment * 0.15 + interview * 0.1,
      ),
      rationale: `${role.title} aligns with the strongest available session evidence.`,
      evidence: [
        `Assessment evidence: ${assessment}/100`,
        `Interview evidence: ${interview}/100`,
        `Resume evidence: ${resume.atsScore}/100`,
      ],
      gaps: [...role.gaps],
      whyLower:
        index === 0
          ? null
          : `Ranked ${Math.round(all[0].score - role.score)} points below the leading match because less role-specific evidence is currently visible.`,
      marketDemand: "Verify against current local vacancies",
      salaryRange: "Varies by location and experience",
      growthPotential: "Role-dependent",
      futureOutlook: "Build transferable evidence and review current market demand.",
      requiredSkills: [...role.skills],
      learningDifficulty: "Moderate",
      learningTimeline: "8–16 weeks for an entry-level portfolio",
    }));

  const top = matches[0];
  const gap = top.gaps[0] ?? "portfolio evidence";
  const readiness = Math.round(
    resume.atsScore * 0.25 + interview * 0.3 + assessment * 0.25 + top.score * 0.2,
  );
  const evidenceRecommendations = [
    {
      title: "Strengthen role evidence",
      action: `Build one compact ${top.title} case study demonstrating ${gap}.`,
      evidence: `${gap} is missing from the current resume evidence.`,
      priority: "now" as const,
      improvementPrompt: `Design a two-week ${top.title} project demonstrating ${gap} with a measurable outcome.`,
    },
    {
      title: "Rewrite weak evidence",
      action: "Rewrite three resume bullets using action, evidence, and outcome.",
      evidence: `The resume baseline is ${resume.atsScore}/100.`,
      priority: "now" as const,
      improvementPrompt: `Rewrite my resume bullets for a ${top.title} role with truthful measurable outcomes.`,
    },
    {
      title: "Practise interview stories",
      action: "Record two 90-second STAR answers.",
      evidence: `Interview completeness produced a ${interview}/100 baseline.`,
      priority: "next" as const,
      improvementPrompt: `Interview me for a ${top.title} role and critique my STAR evidence.`,
    },
  ];

  return {
    readinessScore: readiness,
    headline: `${top.title} is your strongest current career match.`,
    summary: `ANIRA synthesized resume, assessment, interview, and skill evidence before ranking six career paths. ${top.title} ranked first with ${top.confidence}% confidence.`,
    scores: { resume: resume.atsScore, interview, assessment, roleFit: top.score },
    strengths: resume.skills.slice(0, 4),
    skillGaps: top.gaps.length ? top.gaps : ["Advanced portfolio evidence"],
    recommendations: evidenceRecommendations.map((item) => item.action),
    evidenceRecommendations,
    roadmap: [
      { period: "Next 30 days", focus: "Prove the foundation", actions: [`Practise ${gap}.`, "Publish one case study."] },
      { period: "Next 60 days", focus: "Turn learning into evidence", actions: ["Build a second project.", "Run four mock interviews."] },
      { period: "Next 90 days", focus: "Enter the market deliberately", actions: ["Apply to matched roles.", "Refresh evidence after each project."] },
    ],
    careerIntelligence: {
      confidence: top.confidence,
      dataQuality: 78,
      dominantStrength: resume.skills[0] ?? "Learning agility",
      criticalGap: gap,
      dimensionScores: [
        { dimension: "resume_quality", score: resume.atsScore, confidence: 82, evidence: [] },
        { dimension: "assessment", score: assessment, confidence: 90, evidence: [] },
        { dimension: "communication", score: interview, confidence: 76, evidence: [] },
      ],
      conflicts: [],
      scoreContributions: [
        { source: "Resume Agent", weight: 25, score: resume.atsScore, weightedScore: resume.atsScore * 0.25 },
        { source: "Assessment Agent", weight: 30, score: assessment, weightedScore: assessment * 0.3 },
        { source: "Interview Agent", weight: 30, score: interview, weightedScore: interview * 0.3 },
        { source: "Skill Gap Agent", weight: 15, score: top.score, weightedScore: top.score * 0.15 },
      ],
      careerMatches: matches,
    },
    topCareerMatch: top,
    careerAlternatives: matches.slice(1),
    developmentResources: [
      {
        kind: "certification",
        title: "Role-aligned foundation credential",
        reason: "Structure learning after building basic practical evidence.",
        evidence: `${gap} is a priority gap for ${top.title}.`,
      },
      {
        kind: "project",
        title: `Decision-ready ${top.title} case study`,
        reason: "Create a portfolio artifact with a problem, method, evidence, and recommendation.",
        evidence: "Applied evidence matters more than course completion alone.",
      },
    ],
    disclaimer: "This report is developmental guidance, not a hiring decision or guarantee of employment.",
    mode: "demo",
  };
}
