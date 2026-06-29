"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Lightbulb,
  LockKeyhole,
  Printer,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import { ProgressRail } from "@/components/ProgressRail";
import { analyzeResume, generateReport } from "@/lib/api";
import type {
  BasicProfile,
  CareerReport,
  ResumeAnalysis,
  StepId,
} from "@/types/career";
import {
  assessmentQuestions,
  interviewQuestions,
  sampleResume,
} from "./content";
import { buildFallbackReport } from "./fallback";
import { VoiceInterviewPanel } from "./VoiceInterviewPanel";

const initialProfile: BasicProfile = {
  name: "",
  education: "",
  experienceLevel: "Student / fresher",
  careerGoal: "",
};

const stepOrder: StepId[] = [
  "welcome",
  "profile",
  "resume",
  "assessment",
  "interview",
  "reasoning",
  "report",
];

const reasoningStages = [
  "Reading resume evidence",
  "Evaluating assessment signals",
  "Understanding interview patterns",
  "Resolving conflicting evidence",
  "Comparing six career paths",
  "Building your Career Intelligence Report",
];

function StepFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="card rounded-[28px] p-6 md:p-9"
    >
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--teal)]">
        {eyebrow}
      </p>
      <h1 className="display max-w-4xl text-3xl leading-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
        {description}
      </p>
      <div className="mt-8">{children}</div>
    </motion.section>
  );
}

export function CareerJourney() {
  const [step, setStep] = useState<StepId>("welcome");
  const [profile, setProfile] = useState(initialProfile);
  const [resume, setResume] = useState<ResumeAnalysis | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [descriptiveAnswers, setDescriptiveAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<CareerReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualResume, setManualResume] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const profileReady =
    profile.name.trim().length >= 2 && profile.education.trim().length >= 2;
  const interviewReady = interviewQuestions.every(
    (question) => (interviewAnswers[question.id]?.trim().length ?? 0) >= 20,
  );
  const assessmentReady =
    Object.keys(assessmentAnswers).length === assessmentQuestions.length &&
    (descriptiveAnswers.problemSolving?.trim().length ?? 0) >= 30 &&
    (descriptiveAnswers.communication?.trim().length ?? 0) >= 30;

  function move(direction: 1 | -1) {
    const index = stepOrder.indexOf(step);
    setStep(
      stepOrder[Math.max(0, Math.min(stepOrder.length - 1, index + direction))],
    );
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setNotice("");
    try {
      setResume(await analyzeResume(file));
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `${error.message} You can continue with the seminar sample.`
          : "We could not read that file. You can continue with the seminar sample.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function analyzeManualResume() {
    const file = new File([manualResume], "manual-resume.txt", {
      type: "text/plain",
    });
    await handleFile(file);
  }

  async function createReport() {
    if (!resume) return;
    setBusy(true);
    setNotice("");
    setManualMode(false);
    setManualResume("");
    setStep("reasoning");
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fallback = buildFallbackReport(
      profile,
      resume,
      interviewAnswers,
      assessmentAnswers,
    );
    const minimumReasoningTime = new Promise((resolve) =>
      window.setTimeout(resolve, 2200),
    );
    try {
      const result = await generateReport({
        profile,
        resume,
        interviewAnswers,
        assessmentAnswers,
        descriptiveAnswers,
      });
      await minimumReasoningTime;
      setReport(result);
    } catch {
      await minimumReasoningTime;
      setReport(fallback);
      setNotice(
        "The API was unavailable, so ANIRA completed the same evidence workflow locally in seminar mode.",
      );
    } finally {
      setBusy(false);
      setStep("report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function copyPrompt(id: string, prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompt(id);
    window.setTimeout(() => setCopiedPrompt(""), 1600);
  }

  async function downloadReport() {
    if (!report) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const width = 170;
    let y = 20;
    const add = (text: string, size = 11, gap = 7) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, width);
      if (y + lines.length * gap > 278) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, 20, y);
      y += lines.length * gap;
    };

    doc.setTextColor(15, 118, 110);
    add("ANIRA Career Intelligence Report", 18, 9);
    doc.setTextColor(24, 35, 31);
    add(`${profile.name} · ${report.topCareerMatch.title}`, 15, 8);
    add(
      `Readiness ${report.readinessScore}/100 · Recommendation confidence ${report.careerIntelligence.confidence}%`,
    );
    add(
      `Interview readiness ${report.topCareerMatch.interviewReadiness} · Hiring readiness ${report.topCareerMatch.hiringReadiness} · Industry readiness ${report.topCareerMatch.industryReadiness}`,
    );
    y += 3;
    add(report.headline, 14, 8);
    add(report.summary);
    y += 2;
    add("Why this recommendation", 14, 8);
    report.topCareerMatch.evidence.forEach((item) => add(`• ${item}`));
    add(`Priority gaps: ${report.skillGaps.join(", ")}`);
    y += 2;
    add("Alternative career matches", 14, 8);
    report.careerAlternatives.forEach((match) =>
      add(`${match.rank}. ${match.title} — ${match.score}/100. ${match.whyLower ?? ""}`),
    );
    y += 2;
    add("Evidence-backed actions", 14, 8);
    report.evidenceRecommendations.forEach((item) => {
      add(`${item.title}: ${item.action}`, 12, 7);
      add(`Evidence: ${item.evidence}`, 10, 6);
    });
    y += 2;
    add("Suggested development resources", 14, 8);
    report.developmentResources.forEach((resource) => {
      add(`${resource.kind.toUpperCase()}: ${resource.title}`, 11, 7);
      add(`${resource.reason} Evidence: ${resource.evidence}`, 9, 6);
    });
    y += 2;
    add("30–60–90 day roadmap", 14, 8);
    report.roadmap.forEach((item) => {
      add(`${item.period}: ${item.focus}`, 12, 7);
      item.actions.forEach((action) => add(`• ${action}`));
    });
    y += 3;
    add(report.disclaimer, 9, 6);
    doc.save(`ANIRA-${profile.name.replace(/\s+/g, "-")}-career-intelligence.pdf`);
  }

  function reset() {
    setStep("welcome");
    setProfile(initialProfile);
    setResume(null);
    setInterviewAnswers({});
    setAssessmentAnswers({});
    setDescriptiveAnswers({});
    setReport(null);
    setNotice("");
    setManualMode(false);
    setManualResume("");
  }

  return (
    <main className="min-h-screen">
      <div className="noise" />
      <header className="app-header mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Brand />
        <div className="status-pill flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
          <span className="size-2 rounded-full bg-emerald-400" />
          Seminar demo ready
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <ProgressRail active={step} />
        {notice && (
          <div
            role="status"
            className="my-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
          >
            {notice}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.section
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid min-h-[72vh] items-center gap-10 py-10 md:grid-cols-[1.2fr_.8fr]"
            >
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--mint)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--teal-dark)]">
                  <Sparkles size={15} /> Meet your AI career mentor
                </div>
                <h1 className="display max-w-4xl text-5xl leading-[1.02] md:text-7xl">
                  Discover your career{" "}
                  <span className="gradient-text">potential with AI.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
                  ANIRA gathers evidence before offering direction—then shows
                  exactly why each career recommendation earned its place.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <button className="primary flex items-center gap-2" onClick={() => move(1)}>
                    Start assessment <ArrowRight size={17} />
                  </button>
                  <span className="flex items-center gap-2 px-3 text-sm font-semibold text-[var(--muted)]">
                    <LockKeyhole size={16} /> No login. Nothing stored.
                  </span>
                </div>
              </div>
              <div className="card relative overflow-hidden rounded-[32px] p-6 md:p-8">
                <div className="orb absolute -right-16 -top-16 size-44 rounded-full" />
                <p className="relative text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">
                  ANIRA understands before it recommends
                </p>
                <div className="relative mt-6 space-y-5">
                  {[
                    [FileText, "Resume intelligence", "Structure, evidence, ATS and skill signals"],
                    [BrainCircuit, "Multi-signal reasoning", "Assessment and interview evidence resolved together"],
                    [Target, "Explainable direction", "Six careers ranked with confidence and rationale"],
                    [Award, "Practical development", "Evidence-backed 30–60–90 day roadmap"],
                  ].map(([Icon, title, copy]) => {
                    const FeatureIcon = Icon as typeof FileText;
                    return (
                      <div key={String(title)} className="flex gap-4">
                        <span className="icon-tile grid size-11 shrink-0 place-items-center rounded-2xl text-[var(--teal)]">
                          <FeatureIcon size={20} />
                        </span>
                        <div>
                          <h2 className="font-extrabold">{String(title)}</h2>
                          <p className="mt-1 text-sm text-[var(--muted)]">{String(copy)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {step === "profile" && (
            <StepFrame
              key="profile"
              eyebrow="Step 1 · Student discovery"
              title={`Hi, I'm ANIRA. Let's understand your starting point.`}
              description="Career aspiration is optional. If you are unsure, ANIRA will discover the strongest direction from the evidence."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-bold">
                  Your name
                  <input
                    className="field mt-2"
                    placeholder="e.g. Maya"
                    value={profile.name}
                    onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  />
                </label>
                <label className="text-sm font-bold">
                  Education
                  <input
                    className="field mt-2"
                    placeholder="e.g. B.Com, final year"
                    value={profile.education}
                    onChange={(event) => setProfile({ ...profile, education: event.target.value })}
                  />
                </label>
                <label className="text-sm font-bold">
                  Experience level
                  <select
                    className="field mt-2"
                    value={profile.experienceLevel}
                    onChange={(event) =>
                      setProfile({ ...profile, experienceLevel: event.target.value })
                    }
                  >
                    <option>Student / fresher</option>
                    <option>0–2 years</option>
                    <option>3–5 years</option>
                    <option>Career switcher</option>
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Career aspiration <span className="font-normal text-[var(--muted)]">(optional)</span>
                  <input
                    className="field mt-2"
                    placeholder="e.g. Data analyst"
                    value={profile.careerGoal}
                    onChange={(event) => setProfile({ ...profile, careerGoal: event.target.value })}
                  />
                  <button
                    type="button"
                    className="mt-2 text-xs font-extrabold text-[var(--teal)]"
                    onClick={() => setProfile({ ...profile, careerGoal: "" })}
                  >
                    I&apos;m not sure yet
                  </button>
                </label>
              </div>
              <div className="mt-8 flex justify-end">
                <button className="primary flex items-center gap-2" disabled={!profileReady} onClick={() => move(1)}>
                  Continue <ArrowRight size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "resume" && (
            <StepFrame
              key="resume"
              eyebrow="Step 2 · Resume intelligence"
              title={resume ? "Here is what your resume currently proves." : "Bring the resume you have—not the perfect one."}
              description="PDF, DOCX, or TXT up to 5 MB. ANIRA reads it in memory and never saves the original."
            >
              {!resume ? (
                <div>
                  <button
                    className="upload-card w-full rounded-[24px] border-2 border-dashed border-[var(--line)] p-10 text-center transition hover:border-[var(--teal)]"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                  >
                    <UploadCloud className="mx-auto text-[var(--teal)]" size={34} />
                    <span className="mt-4 block font-extrabold">
                      {busy ? "Reading resume evidence…" : "Choose a resume"}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      Your original file never becomes stored application data.
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    hidden
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                  <div className="mt-4 text-center">
                    <button
                      className="text-sm font-extrabold text-[var(--teal)] underline-offset-4 hover:underline"
                      onClick={() => setResume(sampleResume)}
                    >
                      Use sample profile for the seminar
                    </button>
                    <span className="mx-3 text-[var(--muted)]">·</span>
                    <button
                      className="text-sm font-extrabold text-[var(--teal)] underline-offset-4 hover:underline"
                      onClick={() => setManualMode((value) => !value)}
                    >
                      Create resume manually
                    </button>
                  </div>
                  {manualMode && (
                    <div className="surface-card mt-5 rounded-3xl border border-[var(--line)] p-5 text-left">
                      <label className="text-sm font-extrabold">
                        Paste or type your resume content
                        <textarea
                          className="field mt-3 min-h-48 resize-y"
                          placeholder="Name, contact, summary, education, projects, experience, skills…"
                          value={manualResume}
                          onChange={(event) => setManualResume(event.target.value)}
                        />
                      </label>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-[var(--muted)]">
                          {manualResume.trim().length} characters · session only
                        </p>
                        <button
                          className="primary"
                          disabled={manualResume.trim().length < 80 || busy}
                          onClick={analyzeManualResume}
                        >
                          Analyze manual resume
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid gap-5 md:grid-cols-[.65fr_1.35fr]">
                    <div className="score-card rounded-3xl p-6 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Resume health</p>
                      <div className="display mt-2 text-6xl">{resume.atsScore}</div>
                      <p className="mt-3 text-sm leading-6 text-white/75">One input to the engine—not a career verdict.</p>
                    </div>
                    <div className="surface-card rounded-3xl border border-[var(--line)] p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Detected evidence</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resume.skills.map((skill) => (
                          <span key={skill} className="skill-chip rounded-full px-3 py-1.5 text-sm font-bold">{skill}</span>
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-6 text-[var(--muted)]">{resume.summary}</p>
                      <ul className="mt-4 space-y-2">
                        {resume.suggestions.map((suggestion) => (
                          <li key={suggestion} className="flex gap-2 text-sm">
                            <Lightbulb size={16} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {Object.keys(resume.dimensionScores).length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(resume.dimensionScores).map(([label, value]) => (
                        <div key={label} className="metric-card rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold capitalize">{label.replaceAll("_", " ")}</span>
                            <span className="font-black text-[var(--teal)]">{value}</span>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[var(--teal)]" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {resume.issues.length > 0 && (
                    <section className="mt-7">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Actionable resume issues</p>
                      <h2 className="display mt-1 text-2xl">Every issue includes the why and the fix.</h2>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {resume.issues.map((issue) => (
                          <article key={issue.category} className="surface-card rounded-3xl border border-[var(--line)] p-5">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-extrabold">{issue.category}</h3>
                              <span className={`priority-chip ${issue.priority}`}>{issue.priority}</span>
                            </div>
                            <p className="mt-3 text-sm font-bold">{issue.problem}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{issue.explanation}</p>
                            <dl className="mt-4 space-y-3 text-sm">
                              <div>
                                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[var(--teal)]">Why it matters</dt>
                                <dd className="mt-1 text-[var(--muted)]">{issue.whyItMatters}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[var(--teal)]">How to improve</dt>
                                <dd className="mt-1 text-[var(--muted)]">{issue.howToImprove}</dd>
                              </div>
                              <div className="rounded-2xl bg-black/15 p-3">
                                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[var(--gold)]">Example</dt>
                                <dd className="mt-1">{issue.example}</dd>
                              </div>
                            </dl>
                            <button
                              className="secondary mt-4 flex w-full items-center justify-center gap-2 text-xs"
                              onClick={() => copyPrompt(`resume-${issue.category}`, issue.improvementPrompt)}
                            >
                              <Copy size={14} />
                              {copiedPrompt === `resume-${issue.category}` ? "Prompt copied" : "Copy improvement prompt"}
                            </button>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
              <div className="mt-8 flex items-center justify-between">
                <button className="secondary flex items-center gap-2" onClick={() => move(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary flex items-center gap-2" disabled={!resume} onClick={() => move(1)}>
                  Continue to assessment <ArrowRight size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "assessment" && (
            <StepFrame
              key="assessment"
              eyebrow="Step 3 · Objective assessment"
              title="Now let’s evaluate how you think."
              description="These questions create direct evidence. ANIRA will compare it with—not blindly trust—the resume."
            >
              <section className="mb-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Part 1 · Descriptive reasoning</p>
                  <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-violet-300">
                    Adaptive · based on resume evidence
                  </span>
                </div>
                <div className="mt-4 grid gap-4">
                  <label className="surface-card rounded-3xl border border-[var(--line)] p-5 font-bold">
                    {resume && resume.atsScore >= 75
                      ? `Your resume shows ${resume.skills[0] ?? "analytical"} capability. A stakeholder challenges the reliability of your result one day before a deadline. Explain how you would test the evidence, resolve uncertainty, and communicate the decision.`
                      : "A team has conflicting information and a deadline tomorrow. Explain how you would investigate the problem and communicate your recommendation."}
                    <textarea
                      className="field mt-4 resize-y"
                      rows={4}
                      placeholder="Describe your reasoning, assumptions, actions, and expected result…"
                      value={descriptiveAnswers.problemSolving ?? ""}
                      onChange={(event) =>
                        setDescriptiveAnswers({ ...descriptiveAnswers, problemSolving: event.target.value })
                      }
                    />
                  </label>
                  <label className="surface-card rounded-3xl border border-[var(--line)] p-5 font-bold">
                    Explain your experience with {resume?.skills.slice(0, 2).join(" and ") || "one project"} to a non-technical stakeholder who needs to make a decision.
                    <textarea
                      className="field mt-4 resize-y"
                      rows={3}
                      placeholder="Make it concise, clear, and decision-oriented…"
                      value={descriptiveAnswers.communication ?? ""}
                      onChange={(event) =>
                        setDescriptiveAnswers({ ...descriptiveAnswers, communication: event.target.value })
                      }
                    />
                  </label>
                </div>
              </section>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Part 2 · Objective evidence</p>
              <div className="space-y-6">
                {assessmentQuestions.map((question, index) => (
                  <fieldset key={question.id} className="surface-card rounded-3xl border border-[var(--line)] p-5">
                    <legend className="px-2 font-extrabold">{index + 1}. {question.question}</legend>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const checked = assessmentAnswers[question.id] === optionIndex;
                        return (
                          <label
                            key={option}
                            className={`option-card flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-semibold ${
                              checked ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={checked}
                              onChange={() =>
                                setAssessmentAnswers({ ...assessmentAnswers, [question.id]: optionIndex })
                              }
                              className="accent-[var(--teal)]"
                            />
                            {option}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button className="secondary flex items-center gap-2" onClick={() => move(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary flex items-center gap-2" disabled={!assessmentReady} onClick={() => move(1)}>
                  Start interview <ArrowRight size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "interview" && (
            <StepFrame
              key="interview"
              eyebrow="Step 4 · Interview intelligence"
              title="Let’s simulate a real conversation."
              description="Answer as you would speak. ANIRA evaluates clarity, evidence, reflection, and problem-solving structure."
            >
              <VoiceInterviewPanel
                questions={interviewQuestions}
                answers={interviewAnswers}
                onTranscript={(questionId, transcript) =>
                  setInterviewAnswers((current) => ({ ...current, [questionId]: transcript }))
                }
              />
              <div className="space-y-5">
                {interviewQuestions.map((item, index) => (
                  <label key={item.id} className="surface-card block rounded-3xl border border-[var(--line)] p-5">
                    <span className="flex gap-3 font-extrabold">
                      <span className="text-[var(--teal)]">0{index + 1}</span>
                      {item.question}
                    </span>
                    <textarea
                      rows={3}
                      className="field mt-4 resize-y"
                      placeholder="Write the answer you would say aloud…"
                      value={interviewAnswers[item.id] ?? ""}
                      onChange={(event) =>
                        setInterviewAnswers({ ...interviewAnswers, [item.id]: event.target.value })
                      }
                    />
                    <span className="mt-2 block text-xs text-[var(--muted)]">Coach’s note: {item.hint}</span>
                  </label>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button className="secondary flex items-center gap-2" onClick={() => move(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary flex items-center gap-2" disabled={!interviewReady || busy} onClick={createReport}>
                  Build my career intelligence <Sparkles size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "reasoning" && (
            <motion.section
              key="reasoning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card mx-auto max-w-3xl rounded-[32px] p-8 text-center md:p-12"
              aria-live="polite"
            >
              <div className="ai-pulse mx-auto grid size-20 place-items-center rounded-full">
                <BrainCircuit size={34} />
              </div>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--teal)]">
                Career Intelligence Engine
              </p>
              <h1 className="display mt-3 text-4xl">ANIRA is connecting the evidence.</h1>
              <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
                No career was selected in advance. The recommendation appears only after every available signal has been weighed.
              </p>
              <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left">
                {reasoningStages.map((stage, index) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.22 }}
                    className="reasoning-row flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    <CheckCircle2 size={17} className="text-[var(--teal)]" />
                    {stage}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {step === "report" && report && (
            <StepFrame
              key="report"
              eyebrow={`Career Intelligence Report · ${report.mode === "ai" ? "AI enhanced" : "Evidence engine"}`}
              title={report.headline}
              description={report.summary}
            >
              <div className="grid gap-5 md:grid-cols-[.68fr_1.32fr]">
                <div className="score-panel rounded-[28px] p-6 text-white">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/55">Career readiness</p>
                  <div className="display mt-3 text-7xl text-[var(--mint)]">{report.readinessScore}</div>
                  <p className="text-sm text-white/60">out of 100</p>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/55">Recommendation confidence</p>
                    <div className="mt-1 text-2xl font-black">{report.careerIntelligence.confidence}%</div>
                    <p className="mt-1 text-xs text-white/60">Data quality {report.careerIntelligence.dataQuality}%</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {Object.entries(report.scores).map(([label, score]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs font-bold capitalize">
                          <span>{label.replace("roleFit", "career alignment")}</span>
                          <span>{score}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                          <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="recommendation-hero rounded-3xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Top career match</p>
                        <h2 className="display mt-2 text-3xl">{report.topCareerMatch.title}</h2>
                      </div>
                      <span className="match-score rounded-full px-3 py-1.5 text-sm font-black">
                        {report.topCareerMatch.score}% match
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{report.topCareerMatch.rationale}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {report.topCareerMatch.evidence.map((item) => (
                        <div key={item} className="evidence-chip flex gap-2 rounded-2xl p-3 text-sm">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--teal)]" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
                      {[
                        ["Market demand", report.topCareerMatch.marketDemand],
                        ["Indicative salary", report.topCareerMatch.salaryRange],
                        ["Growth potential", report.topCareerMatch.growthPotential],
                        ["Learning timeline", report.topCareerMatch.learningTimeline],
                        ["Interview readiness", `${report.topCareerMatch.interviewReadiness}/100`],
                        ["Hiring readiness", `${report.topCareerMatch.hiringReadiness}/100`],
                        ["Industry readiness", `${report.topCareerMatch.industryReadiness}/100`],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
                          <p className="mt-1 text-sm font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReportList title="Visible strengths" icon={CheckCircle2} items={report.strengths} tone="mint" />
                    <ReportList title="Priority gaps" icon={Target} items={report.skillGaps} tone="gold" />
                  </div>
                </div>
              </div>

              <section className="surface-card mt-6 rounded-[28px] border border-[var(--line)] p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Explainable intelligence</p>
                    <h2 className="display mt-1 text-2xl">What the engine resolved</h2>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    Strongest: {report.careerIntelligence.dominantStrength}
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {report.careerIntelligence.dimensionScores
                    .filter((item) => !["resume_quality", "role_skill_coverage"].includes(item.dimension))
                    .map((item) => (
                      <div key={item.dimension} className="metric-card rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold capitalize">{item.dimension.replaceAll("_", " ")}</span>
                          <span className="text-sm font-black text-[var(--teal)]">{item.score}</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[var(--teal)]" style={{ width: `${item.score}%` }} />
                        </div>
                        <p className="mt-2 text-[11px] text-[var(--muted)]">{item.confidence}% evidence confidence</p>
                      </div>
                    ))}
                </div>
                {report.careerIntelligence.conflicts.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-violet-400/25 bg-violet-400/10 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-violet-300">Evidence conflicts resolved</p>
                    <div className="mt-3 space-y-3">
                      {report.careerIntelligence.conflicts.map((conflict) => (
                        <div key={conflict.dimension} className="text-sm">
                          <span className="font-extrabold capitalize">{conflict.dimension.replaceAll("_", " ")}: </span>
                          <span className="text-[var(--muted)]">{conflict.signals.join(" · ")}. {conflict.resolution}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {report.developmentResources.length > 0 && (
                <section className="mt-6">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Learning resources</p>
                  <h2 className="display mt-1 text-2xl">What to build, study, and validate</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {report.developmentResources.map((resource) => (
                      <article key={`${resource.kind}-${resource.title}`} className="surface-card rounded-3xl border border-[var(--line)] p-5">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--teal)]">{resource.kind}</span>
                        <h3 className="mt-2 font-extrabold">{resource.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{resource.reason}</p>
                        <p className="mt-3 border-l-2 border-[var(--teal)] pl-3 text-xs leading-5 text-[var(--muted)]">
                          Evidence: {resource.evidence}
                        </p>
                        {resource.sourceUrl && (
                          <a
                            className="mt-4 inline-flex text-xs font-extrabold text-[var(--teal)] underline-offset-4 hover:underline"
                            href={resource.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Verify with official provider ↗
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Why other careers ranked lower</p>
                <h2 className="display mt-1 text-2xl">Alternative paths worth knowing</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {report.careerAlternatives.map((match) => (
                    <div key={match.roleId} className="surface-card rounded-3xl border border-[var(--line)] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-black text-[var(--teal)]">#{match.rank}</span>
                          <h3 className="mt-1 font-extrabold">{match.title}</h3>
                        </div>
                        <span className="text-lg font-black">{match.score}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{match.whyLower}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">Evidence-backed development</p>
                <h2 className="display mt-1 text-2xl">Your next best actions</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {report.evidenceRecommendations.map((item) => (
                    <article key={item.title} className="surface-card rounded-3xl border border-[var(--line)] p-5">
                      <span className="rounded-full bg-[var(--teal)]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--teal)]">
                        {item.priority}
                      </span>
                      <h3 className="mt-4 font-extrabold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6">{item.action}</p>
                      <p className="mt-3 border-l-2 border-[var(--teal)] pl-3 text-xs leading-5 text-[var(--muted)]">
                        Evidence: {item.evidence}
                      </p>
                      <button
                        className="secondary mt-4 flex w-full items-center justify-center gap-2 text-xs"
                        onClick={() => copyPrompt(item.title, item.improvementPrompt)}
                      >
                        <Copy size={14} />
                        {copiedPrompt === item.title ? "Prompt copied" : "Copy improvement prompt"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="surface-card mt-6 rounded-[28px] border border-[var(--line)] p-6">
                <h2 className="display text-2xl">Your 30–60–90 day roadmap</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {report.roadmap.map((item) => (
                    <div key={item.period} className="border-l-2 border-[var(--teal)] pl-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--teal)]">{item.period}</p>
                      <h3 className="mt-1 font-extrabold">{item.focus}</h3>
                      <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">
                        {item.actions.map((action) => <li key={action}>• {action}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <div className="report-actions mt-7 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-2xl text-xs leading-5 text-[var(--muted)]">
                  <ShieldCheck size={15} className="mr-1 inline text-[var(--teal)]" />
                  {report.disclaimer}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="secondary flex items-center gap-2" onClick={reset}>
                    <RefreshCcw size={15} /> Destroy session
                  </button>
                  <button className="secondary flex items-center gap-2" onClick={() => window.print()}>
                    <Printer size={15} /> Print report
                  </button>
                  <button className="primary flex items-center gap-2" onClick={downloadReport}>
                    <Download size={16} /> Download PDF
                  </button>
                </div>
              </div>
            </StepFrame>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ReportList({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle2;
  tone: "mint" | "gold";
}) {
  return (
    <div className={`report-list rounded-3xl p-5 ${tone}`}>
      <h2 className="flex items-center gap-2 font-extrabold">
        <Icon size={19} className="text-[var(--teal)]" />
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}
