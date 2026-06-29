from app.schemas.career import (
    CareerReport,
    ReportRequest,
    RoadmapStage,
    ScoreCard,
)

ASSESSMENT_KEY = {
    "metric": 2,
    "sql": 1,
    "insight": 1,
    "bias": 0,
    "priority": 2,
}


def build_demo_report(request: ReportRequest) -> CareerReport:
    correct = sum(
        request.assessment_answers.get(question_id) == answer
        for question_id, answer in ASSESSMENT_KEY.items()
    )
    assessment_score = round(correct / len(ASSESSMENT_KEY) * 100)
    substantial_answers = sum(
        len(answer.strip()) >= 40 for answer in request.interview_answers.values()
    )
    answer_count = max(len(request.interview_answers), 1)
    interview_score = min(92, 55 + round(substantial_answers / answer_count * 35))
    resume_score = request.resume.ats_score
    role_fit = request.selected_role.fit
    readiness = round(
        resume_score * 0.25
        + interview_score * 0.30
        + assessment_score * 0.25
        + role_fit * 0.20
    )

    resume_skills = {skill.lower() for skill in request.resume.skills}
    gaps = [
        skill
        for skill in request.selected_role.skills
        if skill.lower() not in resume_skills
    ]
    gaps = gaps[:4] or ["Advanced case practice"]
    strengths = request.resume.skills[:3] or ["Learning agility"]

    return CareerReport(
        readiness_score=readiness,
        headline=(
            "You have a strong foundation. Now make the evidence unmistakable."
            if readiness >= 75
            else "Your direction is promising; focused practice will make it visible."
        ),
        summary=(
            f"{request.profile.name}'s current evidence aligns with "
            f"{request.selected_role.title}. The clearest next step is deliberate "
            f"practice in {gaps[0]} and stronger outcome-led examples."
        ),
        scores=ScoreCard(
            resume=resume_score,
            interview=interview_score,
            assessment=assessment_score,
            role_fit=role_fit,
        ),
        strengths=strengths,
        skill_gaps=gaps,
        recommendations=[
            "Rewrite three resume bullets using action, evidence, and outcome.",
            "Record two 90-second STAR answers and review them for clarity.",
            "Build one compact portfolio case tied to a real decision.",
        ],
        roadmap=[
            RoadmapStage(
                period="Week 1",
                focus="Position your evidence",
                actions=[
                    "Tailor your headline and top skills to the target role.",
                    "Quantify two project outcomes.",
                ],
            ),
            RoadmapStage(
                period="Weeks 2–3",
                focus="Close the highest-value gap",
                actions=[
                    f"Complete a focused {gaps[0]} practice sprint.",
                    "Publish a one-page case study.",
                ],
            ),
            RoadmapStage(
                period="Week 4",
                focus="Become interview-ready",
                actions=[
                    "Run three timed mock interviews.",
                    "Apply to five carefully matched opportunities.",
                ],
            ),
        ],
        disclaimer=(
            "This report is developmental guidance, not a hiring decision or "
            "guarantee of employment."
        ),
        mode="demo",
    )

