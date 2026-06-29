from app.features.intelligence.engine import CareerIntelligenceEngine
from app.features.report.evaluator import build_demo_report
from app.schemas.career import ReportRequest


def request_payload(career_goal: str = "Become a data analyst") -> dict:
    return {
        "profile": {
            "name": "Maya",
            "education": "BCom",
            "experienceLevel": "Student / fresher",
            "careerGoal": career_goal,
        },
        "resume": {
            "fileName": "resume.txt",
            "summary": "Early-career analyst",
            "skills": ["Excel", "SQL", "Communication"],
            "atsScore": 78,
            "sectionCoverage": {
                "summary": True,
                "education": True,
                "projects": True,
                "skills": True,
            },
            "suggestions": ["Add metrics"],
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
        "descriptiveAnswers": {
            "problemSolving": "I would verify the source, compare the conflicting records, state my assumptions, and present the evidence before recommending an action.",
            "communication": "I would explain the dashboard as a decision tool that turns raw survey responses into a clear view of the most important customer pattern.",
        },
    }


def test_engine_synthesizes_agents_before_ranking_careers() -> None:
    request = ReportRequest.model_validate(request_payload())
    analysis = CareerIntelligenceEngine().analyze(request)

    assert [agent.agent for agent in analysis.agents] == [
        "Resume Agent",
        "ATS Agent",
        "Assessment Agent",
        "Interview Agent",
        "Skill Gap Agent",
    ]
    matches = analysis.intelligence.career_matches
    assert len(matches) == 6
    assert matches[0].title == "Data Analyst"
    assert [match.rank for match in matches] == list(range(1, 7))
    assert all(match.evidence for match in matches)
    assert all(match.why_lower for match in matches[1:])


def test_engine_resolves_conflicting_evidence_transparently() -> None:
    request = ReportRequest.model_validate(request_payload(""))
    analysis = CareerIntelligenceEngine().analyze(request)

    conflict = next(
        item
        for item in analysis.intelligence.conflicts
        if item.dimension == "technical_analysis"
    )
    assert "Resume Agent" in " ".join(conflict.signals)
    assert "Assessment Agent" in " ".join(conflict.signals)
    assert "confidence-weighted" in conflict.resolution
    assert analysis.intelligence.data_quality >= 70


def test_report_preserves_engine_decision_and_evidence() -> None:
    request = ReportRequest.model_validate(request_payload())
    report = build_demo_report(request)

    assert 0 <= report.readiness_score <= 100
    assert report.mode == "demo"
    assert report.top_career_match == report.career_intelligence.career_matches[0]
    assert len(report.career_alternatives) == 5
    assert len(report.roadmap) == 3
    assert "Power BI" in report.skill_gaps
    assert all(item.evidence for item in report.evidence_recommendations)
    assert all(item.improvement_prompt for item in report.evidence_recommendations)
    assert {item.kind for item in report.development_resources} == {
        "certification",
        "project",
        "course",
        "book",
    }
    certification = next(
        item
        for item in report.development_resources
        if item.kind == "certification"
    )
    assert certification.source_url
    dimensions = {
        item.dimension for item in report.career_intelligence.dimension_scores
    }
    assert {"star_method", "clarity", "professionalism"}.issubset(dimensions)


def test_career_aspiration_is_optional() -> None:
    request = ReportRequest.model_validate(request_payload(""))
    report = build_demo_report(request)
    assert report.top_career_match.title
    assert report.career_intelligence.confidence > 0
