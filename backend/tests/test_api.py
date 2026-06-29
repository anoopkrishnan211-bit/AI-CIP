from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_demo_mode() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["mode"] == "demo"


def test_text_resume_is_analyzed_without_persistence() -> None:
    resume = b"""
    MAYA STUDENT
    maya@example.com
    Summary
    Data analyst interested in solving business problems.
    Education
    BCom, Example College
    Projects
    Built a Power BI dashboard using Excel and SQL. Improved reporting time by 30%.
    Skills
    Excel, SQL, Power BI, Python, Communication
    Experience
    Analytics internship
    """
    response = client.post(
        "/api/v1/resumes/analyze",
        files={"file": ("resume.txt", resume, "text/plain")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["atsScore"] >= 70
    assert "SQL" in body["skills"]
    assert len(body["dimensionScores"]) >= 12
    assert {
        "resume_structure",
        "grammar",
        "professional_tone",
        "project_quality",
        "career_story",
    }.issubset(body["dimensionScores"])
    assert all(
        {
            "problem",
            "explanation",
            "whyItMatters",
            "howToImprove",
            "example",
            "improvementPrompt",
        }.issubset(issue)
        for issue in body["issues"]
    )


def test_unsupported_resume_type_is_rejected() -> None:
    response = client.post(
        "/api/v1/resumes/analyze",
        files={"file": ("resume.exe", b"not a resume" * 10, "application/octet-stream")},
    )
    assert response.status_code == 415


def test_career_intelligence_endpoint_returns_explainable_rankings() -> None:
    payload = {
        "profile": {
            "name": "Maya",
            "education": "BCom",
            "experienceLevel": "Student / fresher",
            "careerGoal": "",
        },
        "resume": {
            "fileName": "resume.txt",
            "summary": "Early-career analyst",
            "skills": ["Excel", "SQL", "Communication"],
            "atsScore": 78,
            "sectionCoverage": {"skills": True, "projects": True},
            "suggestions": ["Add metrics"],
        },
        "interviewAnswers": {
            "intro": "I built a dashboard and explained the recommendation to my team.",
            "evidence": "I cleaned survey data and presented the result to the group.",
            "growth": "I practise SQL daily and document what I learn each week.",
        },
        "assessmentAnswers": {
            "metric": 2,
            "sql": 1,
            "insight": 1,
            "bias": 0,
            "priority": 2,
        },
        "descriptiveAnswers": {
            "problemSolving": "I would check the source of each number, compare definitions, document assumptions, and recommend the action supported by the strongest evidence.",
            "communication": "I would explain the dashboard as a decision tool that summarizes the pattern, its business impact, and the next action in plain language.",
        },
    }
    response = client.post("/api/v1/career-intelligence/analyze", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert len(body["agents"]) == 5
    assert len(body["intelligence"]["careerMatches"]) == 6
    assert body["intelligence"]["scoreContributions"]


def test_engine_rejects_incomplete_evidence() -> None:
    payload = {
        "profile": {
            "name": "Maya",
            "education": "BCom",
            "experienceLevel": "Student / fresher",
            "careerGoal": "",
        },
        "resume": {
            "fileName": "resume.txt",
            "summary": "Early-career analyst",
            "skills": ["Excel", "SQL"],
            "atsScore": 70,
            "sectionCoverage": {"skills": True},
            "suggestions": ["Add metrics"],
        },
        "interviewAnswers": {"intro": "Too little evidence"},
        "assessmentAnswers": {"metric": 2},
        "descriptiveAnswers": {},
    }
    response = client.post("/api/v1/career-intelligence/analyze", json=payload)
    assert response.status_code == 422
