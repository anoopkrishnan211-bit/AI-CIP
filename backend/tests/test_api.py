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


def test_unsupported_resume_type_is_rejected() -> None:
    response = client.post(
        "/api/v1/resumes/analyze",
        files={"file": ("resume.exe", b"not a resume" * 10, "application/octet-stream")},
    )
    assert response.status_code == 415

