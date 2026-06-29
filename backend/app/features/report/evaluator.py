from app.features.intelligence.engine import CareerIntelligenceEngine
from app.schemas.career import (
    CareerIntelligenceAnalysis,
    CareerReport,
    EvidenceRecommendation,
    DevelopmentResource,
    ReportRequest,
    RoadmapStage,
    ScoreCard,
)


class RoadmapAgent:
    name = "Roadmap Agent"

    def build(self, analysis: CareerIntelligenceAnalysis) -> list[RoadmapStage]:
        top = analysis.intelligence.career_matches[0]
        first_gap = top.gaps[0] if top.gaps else "portfolio evidence"
        second_gap = top.gaps[1] if len(top.gaps) > 1 else "interview evidence"
        return [
            RoadmapStage(
                period="Next 30 days",
                focus=f"Prove the foundation for {top.title}",
                actions=[
                    f"Complete a focused {first_gap} practice sprint.",
                    "Rewrite three resume bullets with action, evidence, and outcome.",
                    "Publish one one-page case study.",
                ],
            ),
            RoadmapStage(
                period="Next 60 days",
                focus="Turn learning into visible evidence",
                actions=[
                    f"Build a second project demonstrating {second_gap}.",
                    "Run four recorded STAR interview practices.",
                    "Ask two practitioners to review the portfolio.",
                ],
            ),
            RoadmapStage(
                period="Next 90 days",
                focus="Enter the market deliberately",
                actions=[
                    "Apply to ten carefully matched opportunities.",
                    "Track interview patterns and improve the weakest answer.",
                    "Refresh the evidence profile after each completed project.",
                ],
            ),
        ]


class ReportAgent:
    name = "Report Agent"

    def build(
        self,
        request: ReportRequest,
        analysis: CareerIntelligenceAnalysis,
    ) -> CareerReport:
        intelligence = analysis.intelligence
        top = intelligence.career_matches[0]
        agent_map = {agent.agent: agent for agent in analysis.agents}
        resume_score = request.resume.ats_score
        assessment = self._agent_score(agent_map["Assessment Agent"])
        interview = self._agent_score(agent_map["Interview Agent"])
        readiness = round(
            sum(item.weighted_score for item in intelligence.score_contributions)
        )
        strengths = self._unique(
            [
                intelligence.dominant_strength,
                *agent_map["Resume Agent"].strengths,
                *agent_map["Interview Agent"].strengths,
            ]
        )[:6]
        gaps = top.gaps[:5] or [intelligence.critical_gap]
        evidence_recommendations = self._recommendations(
            request, analysis
        )
        recommendations = [
            recommendation.action for recommendation in evidence_recommendations
        ]
        return CareerReport(
            readiness_score=readiness,
            headline=f"{top.title} is your strongest current career match.",
            summary=(
                f"ANIRA compared five independent evidence sources across six careers. "
                f"{top.title} ranked first at {top.score}/100 with "
                f"{top.confidence}% confidence because {top.rationale.lower()}"
            ),
            scores=ScoreCard(
                resume=resume_score,
                interview=interview,
                assessment=assessment,
                role_fit=top.score,
            ),
            strengths=strengths or ["Learning agility"],
            skill_gaps=gaps,
            recommendations=recommendations,
            evidence_recommendations=evidence_recommendations,
            roadmap=RoadmapAgent().build(analysis),
            career_intelligence=intelligence,
            top_career_match=top,
            career_alternatives=intelligence.career_matches[1:],
            development_resources=self._resources(top.role_id, top.title, gaps),
            disclaimer=(
                "This report is developmental guidance, not a hiring decision or "
                "guarantee of employment. Market and salary context is indicative "
                "and should be checked against current local vacancies."
            ),
            mode="demo",
        )

    def _resources(
        self, role_id: str, role_title: str, gaps: list[str]
    ) -> list[DevelopmentResource]:
        certifications = {
            "data-analyst": (
                "Microsoft Power BI Data Analyst (PL-300)",
                "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/",
            ),
            "business-analyst": (
                "IIBA Entry Certificate in Business Analysis (ECBA)",
                "https://www.iiba.org/globalassets/certification/ecba/files/ecba-handbook.pdf",
            ),
            "product-analyst": ("Product analytics fundamentals credential", None),
            "operations-analyst": ("Lean Six Sigma Yellow Belt", None),
            "digital-marketing-analyst": (
                "Google Analytics certification",
                "https://support.google.com/analytics/answer/15440208?hl=en",
            ),
            "project-coordinator": (
                "Certified Associate in Project Management (CAPM)",
                "https://www.pmi.org/certifications/certified-associate-capm",
            ),
        }
        gap = gaps[0] if gaps else "role-specific evidence"
        certification, certification_url = certifications.get(
            role_id, ("Role-aligned foundation credential", None)
        )
        return [
            DevelopmentResource(
                kind="certification",
                title=certification,
                reason="Use a credential to structure learning after building basic practical evidence.",
                evidence=f"{gap} is a priority gap for {role_title}.",
                source_url=certification_url,
            ),
            DevelopmentResource(
                kind="project",
                title=f"Decision-ready {role_title} case study",
                reason="Create a portfolio artifact with a problem, method, evidence, and recommendation.",
                evidence="The engine prioritizes visible applied evidence over course completion alone.",
            ),
            DevelopmentResource(
                kind="course",
                title=f"{gap} fundamentals and practice",
                reason="Choose a short course with exercises and a final artifact.",
                evidence=f"{gap} is not yet visible in the current resume evidence.",
            ),
            DevelopmentResource(
                kind="book",
                title="Storytelling with Data by Cole Nussbaumer Knaflic",
                reason="Strengthen the ability to communicate evidence clearly and concisely.",
                evidence="Communication affects both interview readiness and analyst role fit.",
            ),
        ]

    def _agent_score(self, agent) -> int:
        return round(
            sum(dimension.score for dimension in agent.dimensions)
            / max(len(agent.dimensions), 1)
        )

    def _recommendations(
        self,
        request: ReportRequest,
        analysis: CareerIntelligenceAnalysis,
    ) -> list[EvidenceRecommendation]:
        top = analysis.intelligence.career_matches[0]
        gap = top.gaps[0] if top.gaps else "portfolio evidence"
        resume_evidence = (
            f"Resume score is {request.resume.ats_score}/100 and "
            f"{len(request.resume.suggestions)} improvement signals remain."
        )
        interview_dimension = next(
            (
                dimension
                for dimension in analysis.intelligence.dimension_scores
                if dimension.dimension == "communication"
            ),
            None,
        )
        communication_score = interview_dimension.score if interview_dimension else 60
        return [
            EvidenceRecommendation(
                title="Strengthen role evidence",
                action=f"Build one compact {top.title} case study demonstrating {gap}.",
                evidence=f"{gap} is the highest-priority gap for the top-ranked role.",
                priority="now",
                improvement_prompt=(
                    f"Design a beginner-friendly {top.title} portfolio project that "
                    f"demonstrates {gap}, includes a measurable outcome, and can be "
                    "completed in two weeks."
                ),
            ),
            EvidenceRecommendation(
                title="Rewrite weak resume evidence",
                action="Rewrite three resume bullets using action, evidence, and outcome.",
                evidence=resume_evidence,
                priority="now",
                improvement_prompt=(
                    f"Rewrite my resume bullets for a {top.title} role using strong "
                    "action verbs, truthful measurable outcomes, and ATS-friendly language."
                ),
            ),
            EvidenceRecommendation(
                title="Practise evidence-led interview stories",
                action="Record two 90-second STAR answers and review them for clarity.",
                evidence=f"Resolved communication evidence is {communication_score}/100.",
                priority="next",
                improvement_prompt=(
                    f"Act as a {top.title} interviewer. Ask me for one STAR story at a "
                    "time, then identify missing actions, evidence, and measurable results."
                ),
            ),
        ]

    def _unique(self, values: list[str]) -> list[str]:
        seen: set[str] = set()
        result = []
        for value in values:
            clean = value.strip()
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                result.append(clean)
        return result


def build_demo_report(request: ReportRequest) -> CareerReport:
    analysis = CareerIntelligenceEngine().analyze(request)
    return ReportAgent().build(request, analysis)
