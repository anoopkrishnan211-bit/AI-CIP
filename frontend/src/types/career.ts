export type StepId =
  | "welcome"
  | "profile"
  | "resume"
  | "role"
  | "interview"
  | "assessment"
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
}

export interface RoleOption {
  id: string;
  title: string;
  fit: number;
  description: string;
  skills: string[];
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
  roadmap: Array<{
    period: string;
    focus: string;
    actions: string[];
  }>;
  disclaimer: string;
  mode: "demo" | "ai";
}

export interface ReportRequest {
  profile: BasicProfile;
  resume: ResumeAnalysis;
  selectedRole: RoleOption;
  interviewAnswers: Record<string, string>;
  assessmentAnswers: Record<string, number>;
}

