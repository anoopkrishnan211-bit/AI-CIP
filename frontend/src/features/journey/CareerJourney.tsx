"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  Download,
  FileText,
  Lightbulb,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import { ProgressRail } from "@/components/ProgressRail";
import { analyzeResume, generateReport } from "@/lib/api";
import type {
  BasicProfile,
  CareerReport,
  ResumeAnalysis,
  RoleOption,
  StepId,
} from "@/types/career";
import {
  assessmentQuestions,
  interviewQuestions,
  roles,
  sampleResume,
} from "./content";

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
  "role",
  "interview",
  "assessment",
  "report",
];

function buildFallbackReport(
  resume: ResumeAnalysis,
  role: RoleOption,
  interviewAnswers: Record<string, string>,
  assessmentAnswers: Record<string, number>,
): CareerReport {
  const assessmentCorrect = assessmentQuestions.filter(
    (question) => assessmentAnswers[question.id] === question.answer,
  ).length;
  const assessment = Math.round(
    (assessmentCorrect / assessmentQuestions.length) * 100,
  );
  const answered = interviewQuestions.filter(
    (question) => (interviewAnswers[question.id]?.trim().length ?? 0) >= 40,
  ).length;
  const interview = 55 + Math.round((answered / interviewQuestions.length) * 35);
  const score = Math.round(
    resume.atsScore * 0.25 +
      interview * 0.3 +
      assessment * 0.25 +
      role.fit * 0.2,
  );
  const missing = role.skills.filter(
    (skill) =>
      !resume.skills.some((candidateSkill) =>
        candidateSkill.toLowerCase().includes(skill.toLowerCase()),
      ),
  );

  return {
    readinessScore: score,
    headline:
      score >= 75
        ? "You have a strong foundation. Now make the evidence unmistakable."
        : "Your direction is promising; focused practice will make it visible.",
    summary: `Your profile aligns well with ${role.title}. The fastest improvement will come from stronger outcome-led stories and deliberate practice in ${missing[0] ?? "role-specific problem solving"}.`,
    scores: {
      resume: resume.atsScore,
      interview,
      assessment,
      roleFit: role.fit,
    },
    strengths: resume.skills.slice(0, 3),
    skillGaps: missing.length ? missing.slice(0, 4) : ["Advanced case practice"],
    recommendations: [
      "Rewrite three resume bullets using action, evidence, and outcome.",
      "Record two 90-second STAR answers and review them for clarity.",
      "Build one compact portfolio case tied to a real decision.",
    ],
    roadmap: [
      {
        period: "Week 1",
        focus: "Position your evidence",
        actions: [
          "Tailor your headline and top skills to the target role.",
          "Quantify two project outcomes.",
        ],
      },
      {
        period: "Weeks 2–3",
        focus: "Close the highest-value gap",
        actions: [
          `Complete a focused ${missing[0] ?? role.skills[0]} practice sprint.`,
          "Publish a one-page case study.",
        ],
      },
      {
        period: "Week 4",
        focus: "Become interview-ready",
        actions: [
          "Run three timed mock interviews.",
          "Apply to five carefully matched opportunities.",
        ],
      },
    ],
    disclaimer:
      "This report is developmental guidance, not a hiring decision or guarantee of employment.",
    mode: "demo",
  };
}

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="card rounded-[28px] p-6 md:p-9"
    >
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--teal)]">
        {eyebrow}
      </p>
      <h1 className="display max-w-3xl text-3xl leading-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
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
  const [selectedRole, setSelectedRole] = useState<RoleOption>(roles[0]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>(
    {},
  );
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    Record<string, number>
  >({});
  const [report, setReport] = useState<CareerReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const profileReady =
    profile.name.trim().length >= 2 &&
    profile.education.trim().length >= 2 &&
    profile.careerGoal.trim().length >= 5;
  const interviewReady = interviewQuestions.every(
    (question) => (interviewAnswers[question.id]?.trim().length ?? 0) >= 20,
  );
  const assessmentReady =
    Object.keys(assessmentAnswers).length === assessmentQuestions.length;

  const roleOptions = useMemo(() => {
    if (!resume) return roles;
    return roles
      .map((role) => {
        const overlap = role.skills.filter((skill) =>
          resume.skills.some(
            (candidateSkill) =>
              candidateSkill.toLowerCase() === skill.toLowerCase(),
          ),
        ).length;
        return { ...role, fit: Math.min(96, role.fit + overlap * 2) };
      })
      .sort((a, b) => b.fit - a.fit);
  }, [resume]);

  function move(direction: 1 | -1) {
    const index = stepOrder.indexOf(step);
    setStep(stepOrder[Math.max(0, Math.min(stepOrder.length - 1, index + direction))]);
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

  async function createReport() {
    if (!resume) return;
    const currentRole =
      roleOptions.find((role) => role.id === selectedRole.id) ?? selectedRole;
    setBusy(true);
    setNotice("");
    const fallback = buildFallbackReport(
      resume,
      currentRole,
      interviewAnswers,
      assessmentAnswers,
    );
    try {
      const result = await generateReport({
        profile,
        resume,
        selectedRole: currentRole,
        interviewAnswers,
        assessmentAnswers,
      });
      setReport(result);
    } catch {
      setReport(fallback);
      setNotice(
        "The live AI service was unavailable, so ANIRA completed your report in seminar demo mode.",
      );
    } finally {
      setBusy(false);
      setStep("report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
    add("ANIRA Career Intelligence", 18, 9);
    doc.setTextColor(24, 35, 31);
    add(`${profile.name}'s Career Readiness Report`, 16, 8);
    add(`Target role: ${selectedRole.title}  |  Readiness: ${report.readinessScore}/100`);
    y += 3;
    add(report.headline, 14, 8);
    add(report.summary);
    y += 2;
    add("Scorecard", 14, 8);
    add(
      `Resume ${report.scores.resume}  |  Interview ${report.scores.interview}  |  Assessment ${report.scores.assessment}  |  Role fit ${report.scores.roleFit}`,
    );
    add(`Strengths: ${report.strengths.join(", ")}`);
    add(`Development priorities: ${report.skillGaps.join(", ")}`);
    y += 2;
    add("Recommended actions", 14, 8);
    report.recommendations.forEach((item) => add(`• ${item}`));
    y += 2;
    add("30-day roadmap", 14, 8);
    report.roadmap.forEach((item) => {
      add(`${item.period}: ${item.focus}`, 12, 7);
      item.actions.forEach((action) => add(`• ${action}`));
    });
    y += 3;
    add(report.disclaimer, 9, 6);
    doc.save(`ANIRA-${profile.name.replace(/\s+/g, "-")}-career-report.pdf`);
  }

  function reset() {
    setStep("welcome");
    setProfile(initialProfile);
    setResume(null);
    setSelectedRole(roles[0]);
    setInterviewAnswers({});
    setAssessmentAnswers({});
    setReport(null);
    setNotice("");
  }

  return (
    <main className="min-h-screen">
      <div className="noise" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Brand />
        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-3 py-2 text-xs font-bold text-[var(--muted)]">
          <span className="size-2 rounded-full bg-emerald-500" />
          Seminar demo ready
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <ProgressRail active={step} />
        {notice && (
          <div
            role="status"
            className="my-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
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
                  <Sparkles size={15} /> Your career, made clearer
                </div>
                <h1 className="display max-w-4xl text-5xl leading-[1.02] md:text-7xl">
                  Turn potential into a{" "}
                  <span className="text-[var(--teal)]">practical plan.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
                  In about ten minutes, understand your resume, practise the
                  interview, test your skills, and leave with a focused
                  30-day roadmap.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <button className="primary flex items-center gap-2" onClick={() => move(1)}>
                    Begin my assessment <ArrowRight size={17} />
                  </button>
                  <span className="flex items-center gap-2 px-3 text-sm font-semibold text-[var(--muted)]">
                    <LockKeyhole size={16} /> No login. Nothing stored.
                  </span>
                </div>
              </div>

              <div className="card relative overflow-hidden rounded-[32px] p-6 md:p-8">
                <div className="absolute -right-16 -top-16 size-44 rounded-full bg-[var(--mint)]" />
                <p className="relative text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">
                  What you will leave with
                </p>
                <div className="relative mt-6 space-y-5">
                  {[
                    [FileText, "Resume signal", "ATS evidence, not vague advice"],
                    [BrainCircuit, "Interview practice", "Structured answers and reflection"],
                    [Target, "Career direction", "Role fit and skill priorities"],
                    [Award, "Action plan", "A report you can download"],
                  ].map(([Icon, title, copy]) => {
                    const FeatureIcon = Icon as typeof FileText;
                    return (
                      <div key={String(title)} className="flex gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[var(--teal)] shadow-sm">
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
              eyebrow="Step 1 · Your starting point"
              title="Give the guidance a little context."
              description="We only use this information inside the current browser session to shape your report."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-bold">
                  Your name
                  <input
                    className="field mt-2"
                    placeholder="e.g. Maya"
                    value={profile.name}
                    onChange={(event) =>
                      setProfile({ ...profile, name: event.target.value })
                    }
                  />
                </label>
                <label className="text-sm font-bold">
                  Education
                  <input
                    className="field mt-2"
                    placeholder="e.g. B.Com, final year"
                    value={profile.education}
                    onChange={(event) =>
                      setProfile({ ...profile, education: event.target.value })
                    }
                  />
                </label>
                <label className="text-sm font-bold">
                  Experience level
                  <select
                    className="field mt-2"
                    value={profile.experienceLevel}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        experienceLevel: event.target.value,
                      })
                    }
                  >
                    <option>Student / fresher</option>
                    <option>0–2 years</option>
                    <option>3–5 years</option>
                    <option>Career switcher</option>
                  </select>
                </label>
                <label className="text-sm font-bold">
                  What would you like to become?
                  <input
                    className="field mt-2"
                    placeholder="e.g. Confident data analyst"
                    value={profile.careerGoal}
                    onChange={(event) =>
                      setProfile({ ...profile, careerGoal: event.target.value })
                    }
                  />
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
              title={resume ? "Your resume signals, at a glance." : "Bring the resume you have—not the perfect one."}
              description="PDF, DOCX, or TXT up to 5 MB. It is read in memory and is never saved by ANIRA."
            >
              {!resume ? (
                <div>
                  <button
                    className="w-full rounded-[24px] border-2 border-dashed border-[var(--line)] bg-white/60 p-10 text-center transition hover:border-[var(--teal)] hover:bg-white"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                  >
                    <UploadCloud className="mx-auto text-[var(--teal)]" size={34} />
                    <span className="mt-4 block font-extrabold">
                      {busy ? "Reading your resume…" : "Choose a resume"}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      Your original file never leaves this request.
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
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-[.65fr_1.35fr]">
                  <div className="rounded-3xl bg-[var(--teal)] p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                      ATS readiness
                    </p>
                    <div className="display mt-2 text-6xl">{resume.atsScore}</div>
                    <p className="mt-3 text-sm leading-6 text-white/75">
                      A useful baseline—not a hiring verdict.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Detected strengths
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resume.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-[var(--mint)] px-3 py-1.5 text-sm font-bold text-[var(--teal-dark)]">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                      {resume.summary}
                    </p>
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
              )}
              <div className="mt-8 flex items-center justify-between">
                <button className="secondary flex items-center gap-2" onClick={() => move(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary flex items-center gap-2" disabled={!resume} onClick={() => move(1)}>
                  Find my direction <ArrowRight size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "role" && (
            <StepFrame
              key="role"
              eyebrow="Step 3 · Career direction"
              title="Choose the path you want to test."
              description="Fit is based on your current evidence. It is a conversation starter, not a label."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {roleOptions.map((role) => {
                  const active = selectedRole.id === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-3xl border p-5 text-left transition ${
                        active
                          ? "border-[var(--teal)] bg-[var(--mint)]/60 ring-2 ring-[var(--teal)]/10"
                          : "border-[var(--line)] bg-white hover:-translate-y-1"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-extrabold">{role.title}</h2>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-[var(--teal)]">
                          {role.fit}% fit
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        {role.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {role.skills.map((skill) => (
                          <span key={skill} className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-bold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button className="secondary flex items-center gap-2" onClick={() => move(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary flex items-center gap-2" onClick={() => move(1)}>
                  Start interview <ArrowRight size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "interview" && (
            <StepFrame
              key="interview"
              eyebrow={`Step 4 · Mock interview · ${selectedRole.title}`}
              title="Practise the answer before the pressure."
              description="Write the answer you would say aloud. Clear evidence matters more than perfect wording."
            >
              <div className="space-y-5">
                {interviewQuestions.map((item, index) => (
                  <label key={item.id} className="block rounded-3xl border border-[var(--line)] bg-white p-5">
                    <span className="flex gap-3 font-extrabold">
                      <span className="text-[var(--teal)]">0{index + 1}</span>
                      {item.question}
                    </span>
                    <textarea
                      rows={3}
                      className="field mt-4 resize-y"
                      placeholder="Write your spoken answer here…"
                      value={interviewAnswers[item.id] ?? ""}
                      onChange={(event) =>
                        setInterviewAnswers({
                          ...interviewAnswers,
                          [item.id]: event.target.value,
                        })
                      }
                    />
                    <span className="mt-2 block text-xs text-[var(--muted)]">
                      Coach’s note: {item.hint}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button className="secondary flex items-center gap-2" onClick={() => move(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary flex items-center gap-2" disabled={!interviewReady} onClick={() => move(1)}>
                  Continue to assessment <ArrowRight size={17} />
                </button>
              </div>
            </StepFrame>
          )}

          {step === "assessment" && (
            <StepFrame
              key="assessment"
              eyebrow="Step 5 · Written assessment"
              title="A short test of how you think."
              description="Five role-relevant questions. Choose the best answer without overthinking it."
            >
              <div className="space-y-6">
                {assessmentQuestions.map((question, index) => (
                  <fieldset key={question.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                    <legend className="px-2 font-extrabold">
                      {index + 1}. {question.question}
                    </legend>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const checked = assessmentAnswers[question.id] === optionIndex;
                        return (
                          <label
                            key={option}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-semibold ${
                              checked
                                ? "border-[var(--teal)] bg-[var(--mint)]"
                                : "border-[var(--line)]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={checked}
                              onChange={() =>
                                setAssessmentAnswers({
                                  ...assessmentAnswers,
                                  [question.id]: optionIndex,
                                })
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
                <button
                  className="primary flex items-center gap-2"
                  disabled={!assessmentReady || busy}
                  onClick={createReport}
                >
                  {busy ? "Building your report…" : "Reveal my report"}
                  {!busy && <Sparkles size={17} />}
                </button>
              </div>
            </StepFrame>
          )}

          {step === "report" && report && (
            <StepFrame
              key="report"
              eyebrow={`Career readiness report · ${report.mode === "ai" ? "AI enhanced" : "Seminar demo"}`}
              title={report.headline}
              description={report.summary}
            >
              <div className="grid gap-5 md:grid-cols-[.7fr_1.3fr]">
                <div className="rounded-[28px] bg-[var(--ink)] p-6 text-white">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/55">
                    Overall readiness
                  </p>
                  <div className="display mt-3 text-7xl text-[var(--mint)]">
                    {report.readinessScore}
                  </div>
                  <p className="text-sm text-white/60">out of 100</p>
                  <div className="mt-7 space-y-3">
                    {Object.entries(report.scores).map(([label, score]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs font-bold capitalize">
                          <span>{label.replace("roleFit", "role fit")}</span>
                          <span>{score}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                          <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ReportList title="Visible strengths" icon={CheckCircle2} items={report.strengths} tone="mint" />
                  <ReportList title="Priority gaps" icon={Target} items={report.skillGaps} tone="gold" />
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:col-span-2">
                    <h2 className="flex items-center gap-2 font-extrabold">
                      <BrainCircuit size={19} className="text-[var(--teal)]" />
                      Next best actions
                    </h2>
                    <ol className="mt-4 grid gap-3 md:grid-cols-3">
                      {report.recommendations.map((item, index) => (
                        <li key={item} className="rounded-2xl bg-[var(--paper)] p-4 text-sm leading-6">
                          <span className="mb-2 block text-xs font-extrabold text-[var(--teal)]">
                            0{index + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-white p-6">
                <h2 className="display text-2xl">Your 30-day roadmap</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {report.roadmap.map((item) => (
                    <div key={item.period} className="border-l-2 border-[var(--teal)] pl-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--teal)]">
                        {item.period}
                      </p>
                      <h3 className="mt-1 font-extrabold">{item.focus}</h3>
                      <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">
                        {item.actions.map((action) => (
                          <li key={action}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-xl text-xs leading-5 text-[var(--muted)]">
                  <ShieldCheck size={15} className="mr-1 inline text-[var(--teal)]" />
                  {report.disclaimer}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="secondary flex items-center gap-2" onClick={reset}>
                    <RefreshCcw size={15} /> Destroy session
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
    <div
      className={`rounded-3xl p-5 ${
        tone === "mint" ? "bg-[var(--mint)]" : "bg-[#f7e9c9]"
      }`}
    >
      <h2 className="flex items-center gap-2 font-extrabold">
        <Icon size={19} className="text-[var(--teal)]" />
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
