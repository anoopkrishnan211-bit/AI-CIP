export type StepId =
  | "welcome"
  | "profile"
  | "resume"
  | "assessment"
  | "interview"
  | "reasoning"
  | "report";

export interface BasicProfile {
  name: string;
  education: string;
  experienceLevel: string;
  careerGoal: string;
}

export interface ResumeAnalysis {
  fileName: string;
  summary: string;
  skills: string[];
  atsScore: number;
  sectionCoverage: Record<string, boolean>;
  suggestions: string[];
  dimensionScores: Record<string, number>;
  issues: ResumeIssue[];
}

export interface ResumeIssue {
  category: string;
  problem: string;
  explanation: string;
  whyItMatters: string;
  howToImprove: string;
  example: string;
  improvementPrompt: string;
  priority: "high" | "medium" | "low";
}

export interface InterviewQuestion {
  id: string;
  question: string;
  hint: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  skill: string;
}

export interface EvidenceItem {
  source: string;
  claim: string;
  observation: string;
  strength: number;
  reliability: number;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  confidence: number;
  evidence: EvidenceItem[];
}

export interface ConflictResolution {
  dimension: string;
  signals: string[];
  resolution: string;
  rationale: string;
}

export interface ScoreContribution {
  source: string;
  weight: number;
  score: number;
  weightedScore: number;
}

export interface CareerMatch {
  roleId: string;
  title: string;
  rank: number;
  score: number;
  confidence: number;
  interviewReadiness: number;
  hiringReadiness: number;
  industryReadiness: number;
  rationale: string;
  evidence: string[];
  gaps: string[];
  whyLower?: string | null;
  marketDemand: string;
  salaryRange: string;
  growthPotential: string;
  futureOutlook: string;
  requiredSkills: string[];
  learningDifficulty: string;
  learningTimeline: string;
}

export interface CareerIntelligence {
  confidence: number;
  dataQuality: number;
  dominantStrength: string;
  criticalGap: string;
  dimensionScores: DimensionScore[];
  conflicts: ConflictResolution[];
  scoreContributions: ScoreContribution[];
  careerMatches: CareerMatch[];
}

export interface EvidenceRecommendation {
  title: string;
  action: string;
  evidence: string;
  priority: "now" | "next" | "later";
  improvementPrompt: string;
}

export interface DevelopmentResource {
  kind: "certification" | "project" | "course" | "book";
  title: string;
  reason: string;
  evidence: string;
  sourceUrl?: string | null;
}

export interface CareerReport {
  readinessScore: number;
  headline: string;
  summary: string;
  scores: {
    resume: number;
    interview: number;
    assessment: number;
    roleFit: number;
  };
  strengths: string[];
  skillGaps: string[];
  recommendations: string[];
  evidenceRecommendations: EvidenceRecommendation[];
  roadmap: Array<{
    period: string;
    focus: string;
    actions: string[];
  }>;
  careerIntelligence: CareerIntelligence;
  topCareerMatch: CareerMatch;
  careerAlternatives: CareerMatch[];
  developmentResources: DevelopmentResource[];
  disclaimer: string;
  mode: "demo" | "ai";
}

export interface ReportRequest {
  profile: BasicProfile;
  resume: ResumeAnalysis;
  interviewAnswers: Record<string, string>;
  assessmentAnswers: Record<string, number>;
  descriptiveAnswers: Record<string, string>;
}
