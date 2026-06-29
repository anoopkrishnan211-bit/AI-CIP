import re
from collections import defaultdict

from app.features.intelligence.catalog import ROLE_CATALOG
from app.schemas.career import (
    AgentResult,
    DimensionScore,
    EvidenceItem,
    ReportRequest,
)

ASSESSMENT_KEY = {
    "metric": (2, "quantitative_reasoning"),
    "sql": (1, "technical_analysis"),
    "insight": (1, "communication"),
    "bias": (0, "problem_solving"),
    "priority": (2, "stakeholder_management"),
}


def _evidence(
    source: str,
    claim: str,
    observation: str,
    strength: int,
    reliability: float,
) -> EvidenceItem:
    return EvidenceItem(
        source=source,
        claim=claim,
        observation=observation,
        strength=max(0, min(100, strength)),
        reliability=reliability,
    )


def _dimension(
    name: str,
    score: int,
    confidence: int,
    evidence: list[EvidenceItem],
) -> DimensionScore:
    return DimensionScore(
        dimension=name,
        score=max(0, min(100, score)),
        confidence=max(0, min(100, confidence)),
        evidence=evidence,
    )


class ResumeAgent:
    name = "Resume Agent"

    def evaluate(self, request: ReportRequest) -> AgentResult:
        resume = request.resume
        skills = {skill.lower() for skill in resume.skills}
        technical_tokens = {
            "python",
            "sql",
            "excel",
            "power bi",
            "tableau",
            "statistics",
            "analytics",
        }
        technical_count = len(skills.intersection(technical_tokens))
        coverage = sum(resume.section_coverage.values())
        section_total = max(len(resume.section_coverage), 1)
        execution = round(45 + 35 * coverage / section_total)
        technical = min(92, 38 + technical_count * 11)
        communication = 72 if "communication" in skills else 55
        evidence = [
            _evidence(
                self.name,
                "The resume presents relevant capability evidence.",
                f"{len(resume.skills)} skills and {coverage}/{section_total} core sections were detected.",
                resume.ats_score,
                0.76,
            ),
            _evidence(
                self.name,
                "Technical evidence is visible in the resume.",
                f"{technical_count} analysis-oriented skills were detected.",
                technical,
                0.72,
            ),
        ]
        return AgentResult(
            agent=self.name,
            summary=resume.summary,
            dimensions=[
                _dimension("technical_analysis", technical, 74, evidence[1:]),
                _dimension("execution", execution, 72, evidence[:1]),
                _dimension("communication", communication, 58, evidence[:1]),
            ],
            strengths=resume.skills[:4],
            concerns=resume.suggestions[:3],
            evidence=evidence,
        )


class ATSAgent:
    name = "ATS Agent"

    def evaluate(self, request: ReportRequest) -> AgentResult:
        resume = request.resume
        coverage = sum(resume.section_coverage.values())
        total = max(len(resume.section_coverage), 1)
        evidence_quality = min(
            90,
            round(resume.ats_score * 0.72 + (coverage / total * 100) * 0.28),
        )
        evidence = [
            _evidence(
                self.name,
                "The resume is machine-readable and structurally complete.",
                f"ATS baseline {resume.ats_score}/100; {coverage}/{total} expected sections present.",
                evidence_quality,
                0.88,
            )
        ]
        return AgentResult(
            agent=self.name,
            summary=f"ATS and evidence-quality baseline: {evidence_quality}/100.",
            dimensions=[
                _dimension("resume_quality", resume.ats_score, 88, evidence),
                _dimension("execution", evidence_quality, 82, evidence),
            ],
            strengths=["Readable structure"] if resume.ats_score >= 70 else [],
            concerns=resume.suggestions[:3],
            evidence=evidence,
        )


class AssessmentAgent:
    name = "Assessment Agent"

    def evaluate(self, request: ReportRequest) -> AgentResult:
        by_dimension: dict[str, list[int]] = defaultdict(list)
        evidence: list[EvidenceItem] = []
        for question_id, (correct_answer, dimension) in ASSESSMENT_KEY.items():
            submitted = request.assessment_answers.get(question_id)
            score = 92 if submitted == correct_answer else 38
            by_dimension[dimension].append(score)
            evidence.append(
                _evidence(
                    self.name,
                    f"{dimension.replace('_', ' ').title()} was tested directly.",
                    (
                        f"The {question_id} item was answered correctly."
                        if submitted == correct_answer
                        else f"The {question_id} item needs review."
                    ),
                    score,
                    0.94,
                )
            )

        descriptive = " ".join(request.descriptive_answers.values()).strip()
        if descriptive:
            structure = min(88, 48 + len(descriptive.split()) // 3)
            by_dimension["communication"].append(structure)
            evidence.append(
                _evidence(
                    self.name,
                    "Written reasoning contains enough detail to evaluate.",
                    f"{len(descriptive.split())} words of descriptive evidence were supplied.",
                    structure,
                    0.76,
                )
            )

        dimensions = []
        for name, values in by_dimension.items():
            relevant = [item for item in evidence if name.replace("_", " ") in item.claim.lower()]
            dimensions.append(
                _dimension(name, round(sum(values) / len(values)), 91, relevant)
            )
        correct = sum(
            request.assessment_answers.get(question_id) == answer
            for question_id, (answer, _) in ASSESSMENT_KEY.items()
        )
        return AgentResult(
            agent=self.name,
            summary=f"{correct}/{len(ASSESSMENT_KEY)} objective items were answered correctly.",
            dimensions=dimensions,
            strengths=[
                dimension.dimension.replace("_", " ").title()
                for dimension in dimensions
                if dimension.score >= 80
            ],
            concerns=[
                dimension.dimension.replace("_", " ").title()
                for dimension in dimensions
                if dimension.score < 60
            ],
            evidence=evidence,
        )


class InterviewAgent:
    name = "Interview Agent"

    def evaluate(self, request: ReportRequest) -> AgentResult:
        answers = [answer.strip() for answer in request.interview_answers.values() if answer.strip()]
        combined = " ".join(answers)
        words = combined.split()
        has_outcome = bool(re.search(r"\b(result|improved|increased|reduced|helped|outcome)\b", combined, re.I))
        has_action = bool(re.search(r"\b(i|we)\s+(built|created|led|analyzed|cleaned|designed|presented|practise|practice|work)\b", combined, re.I))
        has_metric = bool(re.search(r"\d|percent|percentage", combined, re.I))
        answer_coverage = min(1, len(answers) / 3)
        communication = min(92, round(48 + min(len(words), 180) / 6 + answer_coverage * 12))
        problem_solving = min(92, 50 + int(has_action) * 16 + int(has_outcome) * 18 + int(has_metric) * 8)
        learning = 78 if any(token in combined.lower() for token in ("learn", "improv", "pract")) else 56
        star_method = min(
            94,
            42
            + int(has_action) * 18
            + int(has_outcome) * 20
            + int(has_metric) * 14,
        )
        clarity = min(92, round(communication * 0.9 + answer_coverage * 8))
        professionalism = 82 if len(answers) == 3 and len(words) >= 45 else 64
        critical_thinking = min(92, round(problem_solving * 0.85 + 10))
        unique_ratio = len({word.lower().strip(".,!?") for word in words}) / max(
            len(words), 1
        )
        vocabulary = min(90, round(52 + unique_ratio * 42))
        sentence_structure = min(
            90,
            58
            + min(combined.count(".") + combined.count(",") + combined.count(";"), 8)
            * 4,
        )
        leadership = (
            78
            if re.search(r"\b(led|coordinated|team|delegated|mentored|organized)\b", combined, re.I)
            else 52
        )
        role_understanding = (
            80
            if re.search(r"\b(data|analys|business|decision|stakeholder|customer)\b", combined, re.I)
            else 55
        )
        domain_knowledge = min(
            88,
            50
            + sum(
                bool(re.search(rf"\b{token}\b", combined, re.I))
                for token in ("sql", "excel", "dashboard", "analytics", "project")
            )
            * 8,
        )
        unobservable = _evidence(
            self.name,
            "Listening and vocal confidence require live acoustic evidence.",
            "Text transcription alone cannot establish tone, pace, or listening behaviour.",
            50,
            0.20,
        )
        evidence = [
            _evidence(
                self.name,
                "Communication was evaluated across complete interview responses.",
                f"{len(answers)}/3 questions answered with {len(words)} total words.",
                communication,
                0.80,
            ),
            _evidence(
                self.name,
                "Problem-solving evidence includes action and outcome structure.",
                f"Action evidence: {'yes' if has_action else 'limited'}; outcome evidence: {'yes' if has_outcome else 'limited'}; quantified evidence: {'yes' if has_metric else 'limited'}.",
                problem_solving,
                0.82,
            ),
            _evidence(
                self.name,
                "Learning agility is visible in the growth answer.",
                "A concrete learning habit was detected." if learning >= 70 else "The learning habit needs more concrete evidence.",
                learning,
                0.72,
            ),
        ]
        return AgentResult(
            agent=self.name,
            summary="Interview answers were evaluated for clarity, evidence, reflection, and STAR structure.",
            dimensions=[
                _dimension("communication", communication, 80, evidence[:1]),
                _dimension("problem_solving", problem_solving, 82, evidence[1:2]),
                _dimension("learning_agility", learning, 72, evidence[2:]),
                _dimension("star_method", star_method, 78, evidence[1:2]),
                _dimension("clarity", clarity, 76, evidence[:1]),
                _dimension("professionalism", professionalism, 70, evidence[:1]),
                _dimension("critical_thinking", critical_thinking, 78, evidence[1:2]),
                _dimension("vocabulary", vocabulary, 68, evidence[:1]),
                _dimension("sentence_structure", sentence_structure, 66, evidence[:1]),
                _dimension("leadership", leadership, 58, evidence[1:2]),
                _dimension("role_understanding", role_understanding, 66, evidence[:2]),
                _dimension("domain_knowledge", domain_knowledge, 64, evidence[:2]),
                _dimension("listening", 50, 20, [unobservable]),
                _dimension("vocal_confidence", 50, 20, [unobservable]),
            ],
            strengths=[
                label
                for label, score in (
                    ("Communication", communication),
                    ("Problem solving", problem_solving),
                    ("Learning agility", learning),
                )
                if score >= 72
            ],
            concerns=(
                ["Add a measurable result to interview stories"]
                if not has_metric
                else []
            ),
            evidence=evidence,
        )


class SkillGapAgent:
    name = "Skill Gap Agent"

    def evaluate(self, request: ReportRequest) -> AgentResult:
        current = {skill.lower() for skill in request.resume.skills}
        total_required = {
            skill.lower()
            for role in ROLE_CATALOG
            for skill in role.required_skills
        }
        matched = current.intersection(total_required)
        coverage = round(len(matched) / max(len(current.union(total_required)), 1) * 100)
        evidence = [
            _evidence(
                self.name,
                "Current skills were compared with all candidate role profiles.",
                f"{len(matched)} catalog skills are already evidenced; gaps remain role-dependent.",
                min(90, 45 + len(matched) * 8),
                0.78,
            )
        ]
        return AgentResult(
            agent=self.name,
            summary="Skill gaps were evaluated across six candidate careers before ranking.",
            dimensions=[
                _dimension("role_skill_coverage", min(90, 45 + coverage), 78, evidence),
                _dimension("learning_agility", 68, 52, evidence),
            ],
            strengths=sorted(skill for skill in request.resume.skills if skill.lower() in matched)[:5],
            concerns=["Role-specific gaps are resolved inside the engine ranking."],
            evidence=evidence,
        )


def collect_agent_results(request: ReportRequest) -> list[AgentResult]:
    agents = (
        ResumeAgent(),
        ATSAgent(),
        AssessmentAgent(),
        InterviewAgent(),
        SkillGapAgent(),
    )
    return [agent.evaluate(request) for agent in agents]
