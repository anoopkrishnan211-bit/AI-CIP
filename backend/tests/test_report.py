from app.features.report.evaluator import build_demo_report
from app.schemas.career import ReportRequest


def test_demo_report_is_bounded_and_actionable() -> None:
    request = ReportRequest.model_validate(
        {
            "profile": {
                "name": "Maya",
                "education": "BCom",
                "experienceLevel": "Student / fresher",
                "careerGoal": "Become a data analyst",
            },
            "resume": {
                "fileName": "resume.txt",
                "summary": "Early-career analyst",
                "skills": ["Excel", "SQL", "Communication"],
                "atsScore": 78,
                "sectionCoverage": {"skills": True},
                "suggestions": ["Add metrics"],
            },
            "selectedRole": {
                "id": "data-analyst",
                "title": "Data Analyst",
                "fit": 88,
                "description": "Analyze information",
                "skills": ["SQL", "Excel", "Power BI", "Statistics"],
            },
            "interviewAnswers": {
                "intro": "I am a commerce student who built two dashboards for real projects.",
                "evidence": "I cleaned survey data, found a trend, and presented a recommendation.",
                "growth": "I practise SQL every day using a small public dataset.",
            },
            "assessmentAnswers": {
                "metric": 2,
                "sql": 1,
                "insight": 1,
                "bias": 0,
                "priority": 2,
            },
        }
    )
    report = build_demo_report(request)
    assert 0 <= report.readiness_score <= 100
    assert report.mode == "demo"
    assert len(report.roadmap) == 3
    assert "Power BI" in report.skill_gaps

