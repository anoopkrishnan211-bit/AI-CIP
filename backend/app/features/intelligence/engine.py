from collections import defaultdict

from app.features.intelligence.agents import collect_agent_results
from app.features.intelligence.recommendation import CareerRecommendationAgent
from app.schemas.career import (
    AgentResult,
    CareerIntelligence,
    CareerIntelligenceAnalysis,
    CareerMatch,
    ConflictResolution,
    DimensionScore,
    EvidenceItem,
    ReportRequest,
    ScoreContribution,
)

SOURCE_WEIGHTS = {
    "Resume Agent": 20,
    "ATS Agent": 15,
    "Assessment Agent": 25,
    "Interview Agent": 25,
    "Skill Gap Agent": 15,
}


class CareerIntelligenceEngine:
    def analyze(self, request: ReportRequest) -> CareerIntelligenceAnalysis:
        agents = collect_agent_results(request)
        dimensions, conflicts = self._resolve_dimensions(agents)
        dimension_map = {item.dimension: item.score for item in dimensions}
        data_quality = self._data_quality(request, agents)
        confidence = self._confidence(dimensions, conflicts, data_quality)
        matches = CareerRecommendationAgent().recommend(
            request, dimension_map, confidence
        )
        dominant = max(
            (
                item
                for item in dimensions
                if item.dimension not in {"resume_quality", "role_skill_coverage"}
            ),
            key=lambda item: item.score,
        )
        top = matches[0]
        critical_gap = top.gaps[0] if top.gaps else "Advanced evidence through portfolio work"
        contributions = self._score_contributions(agents)
        return CareerIntelligenceAnalysis(
            agents=agents,
            intelligence=CareerIntelligence(
                confidence=confidence,
                data_quality=data_quality,
                dominant_strength=dominant.dimension.replace("_", " ").title(),
                critical_gap=critical_gap,
                dimension_scores=dimensions,
                conflicts=conflicts,
                score_contributions=contributions,
                career_matches=matches,
            ),
        )

    def _resolve_dimensions(
        self, agents: list[AgentResult]
    ) -> tuple[list[DimensionScore], list[ConflictResolution]]:
        signals: dict[str, list[tuple[str, DimensionScore]]] = defaultdict(list)
        for result in agents:
            for dimension in result.dimensions:
                signals[dimension.dimension].append((result.agent, dimension))

        resolved: list[DimensionScore] = []
        conflicts: list[ConflictResolution] = []
        for name, items in signals.items():
            weighted_total = sum(
                dimension.score * dimension.confidence
                for _, dimension in items
            )
            confidence_total = sum(dimension.confidence for _, dimension in items)
            score = round(weighted_total / max(confidence_total, 1))
            confidence = min(
                94,
                round(
                    sum(dimension.confidence for _, dimension in items)
                    / len(items)
                    + min(len(items) - 1, 2) * 4
                ),
            )
            evidence = [
                evidence
                for _, dimension in items
                for evidence in dimension.evidence
            ][:6]
            resolved.append(
                DimensionScore(
                    dimension=name,
                    score=score,
                    confidence=confidence,
                    evidence=evidence,
                )
            )
            values = [dimension.score for _, dimension in items]
            if len(values) > 1 and max(values) - min(values) >= 22:
                signal_text = [
                    f"{agent}: {dimension.score}/100"
                    for agent, dimension in items
                ]
                conflicts.append(
                    ConflictResolution(
                        dimension=name,
                        signals=signal_text,
                        resolution=f"Resolved to {score}/100 using confidence-weighted evidence.",
                        rationale=(
                            "Direct assessment evidence receives higher confidence than "
                            "resume keyword evidence; multiple independent signals increase certainty."
                        ),
                    )
                )
        resolved.sort(key=lambda item: item.dimension)
        return resolved, conflicts

    def _data_quality(
        self, request: ReportRequest, agents: list[AgentResult]
    ) -> int:
        resume_quality = request.resume.ats_score
        interview_coverage = min(100, len(request.interview_answers) / 3 * 100)
        assessment_coverage = min(100, len(request.assessment_answers) / 5 * 100)
        agent_coverage = min(100, len(agents) / 5 * 100)
        return round(
            resume_quality * 0.25
            + interview_coverage * 0.30
            + assessment_coverage * 0.30
            + agent_coverage * 0.15
        )

    def _confidence(
        self,
        dimensions: list[DimensionScore],
        conflicts: list[ConflictResolution],
        data_quality: int,
    ) -> int:
        evidence_confidence = round(
            sum(item.confidence for item in dimensions) / max(len(dimensions), 1)
        )
        conflict_penalty = min(12, len(conflicts) * 4)
        return max(
            35,
            min(95, round(data_quality * 0.55 + evidence_confidence * 0.45) - conflict_penalty),
        )

    def _score_contributions(
        self, agents: list[AgentResult]
    ) -> list[ScoreContribution]:
        contributions = []
        for agent in agents:
            score = round(
                sum(item.score for item in agent.dimensions)
                / max(len(agent.dimensions), 1)
            )
            weight = SOURCE_WEIGHTS[agent.agent]
            contributions.append(
                ScoreContribution(
                    source=agent.agent,
                    weight=weight,
                    score=score,
                    weighted_score=round(score * weight / 100, 2),
                )
            )
        return contributions
