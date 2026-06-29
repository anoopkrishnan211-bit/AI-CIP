import re
from pathlib import Path

from app.schemas.career import ResumeAnalysis

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
    return ResumeAnalysis(
        file_name=Path(file_name).name,
        summary=summary,
        skills=skills[:10] or ["Communication", "Problem Solving"],
        ats_score=score,
        section_coverage=coverage,
        suggestions=suggestions,
    )

