import type {
  AssessmentQuestion,
  InterviewQuestion,
  ResumeAnalysis,
} from "@/types/career";

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: "intro",
    question: "Tell us about yourself—and connect your story to this role.",
    hint: "Aim for 60–90 seconds: present, relevant past, and where you want to go.",
  },
  {
    id: "evidence",
    question: "Describe a time you used evidence to solve a difficult problem.",
    hint: "Use STAR: situation, task, action, and a measurable result.",
  },
  {
    id: "growth",
    question: "Which skill are you actively improving, and how?",
    hint: "Show self-awareness and a concrete learning habit.",
  },
];

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "metric",
    question: "A metric rises from 40 to 50. What is the percentage increase?",
    options: ["10%", "20%", "25%", "40%"],
    answer: 2,
    skill: "Quantitative reasoning",
  },
  {
    id: "sql",
    question: "Which SQL clause filters rows before grouping?",
    options: ["ORDER BY", "WHERE", "HAVING", "SELECT"],
    answer: 1,
    skill: "SQL",
  },
  {
    id: "insight",
    question: "What makes a data insight most useful to a stakeholder?",
    options: [
      "More charts",
      "A clear decision or action",
      "More decimal places",
      "A longer report",
    ],
    answer: 1,
    skill: "Communication",
  },
  {
    id: "bias",
    question: "Surveying only your most active users most likely creates:",
    options: ["Selection bias", "Encryption", "Normalization", "Version control"],
    answer: 0,
    skill: "Analytical thinking",
  },
  {
    id: "priority",
    question: "When two urgent requests conflict, what is the best first move?",
    options: [
      "Start both silently",
      "Pick the easier one",
      "Clarify impact and priority with owners",
      "Wait for the deadline",
    ],
    answer: 2,
    skill: "Stakeholder management",
  },
];

export const sampleResume: ResumeAnalysis = {
  fileName: "ANIRA sample profile",
  summary:
    "Early-career candidate with project experience in data analysis, dashboards, and presenting recommendations to peers.",
  skills: ["Excel", "SQL", "Power BI", "Python", "Communication"],
  atsScore: 76,
  sectionCoverage: {
    contact: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
  },
  suggestions: [
    "Add measurable outcomes to two project bullets.",
    "Mirror role-specific keywords naturally.",
    "Place the strongest technical project above coursework.",
  ],
  dimensionScores: {
    resume_structure: 84,
    ats_compatibility: 76,
    formatting: 82,
    grammar: 78,
    achievements: 62,
    action_verbs: 74,
    project_quality: 72,
    role_alignment: 82,
    technical_skills: 86,
    soft_skills: 76,
    missing_information: 84,
    keyword_optimization: 82,
    readability: 86,
    professional_tone: 78,
    consistency: 83,
    professional_summary: 80,
    career_story: 74,
  },
  issues: [
    {
      category: "Achievements",
      problem: "Two project bullets describe activity without measurable outcomes.",
      explanation: "The contribution is visible, but its scale and effect are not.",
      whyItMatters: "Recruiters need evidence of contribution, not only responsibilities.",
      howToImprove: "Add truthful quantities such as records analyzed, time saved, or audience reached.",
      example: "Analyzed 1,200 survey responses and reduced weekly reporting time by 30%.",
      improvementPrompt: "Rewrite my project bullets with truthful measurable outcomes. Ask for missing numbers instead of inventing them.",
      priority: "high",
    },
  ],
};
