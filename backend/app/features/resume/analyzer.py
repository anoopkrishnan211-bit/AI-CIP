import re
from pathlib import Path

from app.schemas.career import ResumeAnalysis, ResumeIssue

SKILL_VOCABULARY = {
    "python": "Python",
    "sql": "SQL",
    "excel": "Excel",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "react": "React",
    "communication": "Communication",
    "presentation": "Presentation",
    "statistics": "Statistics",
    "machine learning": "Machine Learning",
    "project management": "Project Management",
    "agile": "Agile",
    "stakeholder": "Stakeholder Management",
}

SECTION_PATTERNS = {
    "contact": r"@|(?:\+?\d[\d\s-]{8,})",
    "summary": r"\b(summary|profile|objective)\b",
    "experience": r"\b(experience|employment|internship)\b",
    "education": r"\b(education|academic|university|college)\b",
    "skills": r"\b(skills|competencies|technologies)\b",
    "projects": r"\b(projects?|portfolio)\b",
}


def analyze_resume(file_name: str, text: str) -> ResumeAnalysis:
    normalized = " ".join(text.split())
    lowered = normalized.lower()
    skills = [
        label
        for token, label in SKILL_VOCABULARY.items()
        if re.search(rf"\b{re.escape(token)}\b", lowered)
    ]
    coverage = {
        section: bool(re.search(pattern, lowered, flags=re.IGNORECASE))
        for section, pattern in SECTION_PATTERNS.items()
    }
    action_verbs = len(
        re.findall(
            r"\b(built|created|led|improved|analyzed|designed|delivered|reduced|increased)\b",
            lowered,
        )
    )
    metrics = len(re.findall(r"\b\d+(?:\.\d+)?%|\b\d{2,}\b", normalized))
    score = min(
        94,
        30
        + sum(coverage.values()) * 7
        + min(len(skills), 6) * 3
        + min(action_verbs, 4) * 2
        + min(metrics, 3) * 3,
    )

    suggestions: list[str] = []
    if metrics < 2:
        suggestions.append("Add measurable outcomes to project or experience bullets.")
    if not coverage["summary"]:
        suggestions.append("Add a concise role-focused professional summary.")
    if len(skills) < 4:
        suggestions.append("Add a scannable skills section using truthful role keywords.")
    if not coverage["projects"]:
        suggestions.append("Show at least one project with a problem, action, and result.")
    if len(normalized) < 350:
        suggestions.append("Add enough evidence for a recruiter to understand your contribution.")
    suggestions = suggestions[:3] or [
        "Tailor the top third of the resume to each target role.",
        "Keep the strongest outcome-led bullets near the top.",
    ]

    summary = (
        f"ANIRA found {len(skills)} relevant skills and "
        f"{sum(coverage.values())} of {len(coverage)} core resume sections."
    )
    structure_score = round(sum(coverage.values()) / len(coverage) * 100)
    achievement_score = min(94, 38 + metrics * 18)
    action_score = min(94, 40 + action_verbs * 13)
    project_score = (
        min(92, 58 + metrics * 8 + action_verbs * 5)
        if coverage["projects"]
        else 32
    )
    keyword_score = min(92, 42 + len(skills) * 8)
    readability_score = 82 if 350 <= len(normalized) <= 5_500 else 62
    dimensions = {
        "resume_structure": structure_score,
        "ats_compatibility": score,
        "formatting": readability_score,
        "grammar": 74 if len(normalized.split()) >= 80 else 62,
        "achievements": achievement_score,
        "action_verbs": action_score,
        "project_quality": project_score,
        "role_alignment": keyword_score,
        "technical_skills": min(94, 42 + len(skills) * 7),
        "soft_skills": 76 if "Communication" in skills else 58,
        "missing_information": structure_score,
        "keyword_optimization": keyword_score,
        "readability": readability_score,
        "professional_tone": 76 if action_verbs >= 2 else 60,
        "consistency": min(92, 48 + sum(coverage.values()) * 7),
        "professional_summary": 86 if coverage["summary"] else 28,
        "career_story": min(
            90,
            38
            + int(coverage["summary"]) * 18
            + int(coverage["experience"]) * 17
            + int(coverage["projects"]) * 17,
        ),
    }
    issues = _build_issues(
        coverage=coverage,
        metrics=metrics,
        action_verbs=action_verbs,
        skill_count=len(skills),
    )
    return ResumeAnalysis(
        file_name=Path(file_name).name,
        summary=summary,
        skills=skills[:10] or ["Communication", "Problem Solving"],
        ats_score=score,
        section_coverage=coverage,
        suggestions=suggestions,
        dimension_scores=dimensions,
        issues=issues,
    )


def _build_issues(
    coverage: dict[str, bool],
    metrics: int,
    action_verbs: int,
    skill_count: int,
) -> list[ResumeIssue]:
    issues: list[ResumeIssue] = []
    if metrics < 2:
        issues.append(
            ResumeIssue(
                category="Achievements",
                problem="Experience and project bullets contain limited measurable outcomes.",
                explanation="The resume describes activity but gives little evidence of scale or impact.",
                why_it_matters="Recruiters need proof of contribution, not only a list of responsibilities.",
                how_to_improve="Add truthful quantities such as time saved, records analyzed, accuracy, audience, or completion speed.",
                example="Analyzed 1,200 survey responses and reduced weekly reporting time by 30%.",
                improvement_prompt="Rewrite my project bullets with truthful measurable outcomes. Ask me for missing numbers instead of inventing them.",
                priority="high",
            )
        )
    if action_verbs < 2:
        issues.append(
            ResumeIssue(
                category="Action verbs",
                problem="Too few bullets begin with clear ownership verbs.",
                explanation="Passive wording makes the candidate's contribution difficult to identify.",
                why_it_matters="Strong verbs help both recruiters and ATS systems identify relevant work quickly.",
                how_to_improve="Start bullets with verbs such as analyzed, built, improved, designed, or presented.",
                example="Built a Power BI dashboard that highlighted three recurring service bottlenecks.",
                improvement_prompt="Rewrite my bullets with varied action verbs while preserving every factual claim.",
                priority="high",
            )
        )
    if not coverage["summary"]:
        issues.append(
            ResumeIssue(
                category="Professional summary",
                problem="A role-focused professional summary is missing.",
                explanation="The opening does not quickly connect education, evidence, and intended direction.",
                why_it_matters="The top third of the resume shapes the recruiter's first interpretation.",
                how_to_improve="Write two lines linking current capability, strongest evidence, and the target opportunity.",
                example="Commerce graduate with SQL and dashboard project experience, focused on entry-level analytics roles.",
                improvement_prompt="Write a two-line professional summary using only the education, skills, and project evidence I provide.",
                priority="medium",
            )
        )
    if not coverage["projects"]:
        issues.append(
            ResumeIssue(
                category="Project quality",
                problem="No clearly labeled project evidence was detected.",
                explanation="Early-career candidates need projects to substitute for limited formal experience.",
                why_it_matters="A project demonstrates applied skill, decision-making, and communication.",
                how_to_improve="Add one project with problem, method, tools, insight, and outcome.",
                example="Customer survey analysis — cleaned responses in Excel, identified churn drivers, and presented three actions.",
                improvement_prompt="Turn my project notes into three ATS-friendly bullets using problem, action, evidence, and outcome.",
                priority="high",
            )
        )
    if skill_count < 4:
        issues.append(
            ResumeIssue(
                category="Keyword alignment",
                problem="The skills evidence is too narrow for confident role matching.",
                explanation="Only a small number of recognized role skills were detected.",
                why_it_matters="Missing truthful keywords can reduce search visibility and weaken role alignment.",
                how_to_improve="Add only skills you can demonstrate, then connect each important skill to a project bullet.",
                example="Skills: SQL, Excel, Power BI, statistics; demonstrated in the sales performance project.",
                improvement_prompt="Compare my resume with this job description and list only truthful missing keywords I should evidence.",
                priority="medium",
            )
        )
    return issues[:5]
