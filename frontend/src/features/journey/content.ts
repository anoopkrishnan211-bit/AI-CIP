import type {
  AssessmentQuestion,
  InterviewQuestion,
  ResumeAnalysis,
  RoleOption,
} from "@/types/career";

export const roles: RoleOption[] = [
  {
    id: "data-analyst",
    title: "Data Analyst",
    fit: 88,
    description: "Turn messy information into decisions through analysis and storytelling.",
    skills: ["SQL", "Excel", "Power BI", "Statistics"],
  },
  {
    id: "product-analyst",
    title: "Product Analyst",
    fit: 82,
    description: "Connect user behaviour, product metrics, and business outcomes.",
    skills: ["Analytics", "Experiments", "SQL", "Communication"],
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    fit: 78,
    description: "Translate business needs into clear, testable solutions.",
    skills: ["Requirements", "Process mapping", "Stakeholders", "Agile"],
  },
];

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
};

