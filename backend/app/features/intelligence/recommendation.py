from app.features.intelligence.catalog import ROLE_CATALOG
from app.schemas.career import CareerMatch, ReportRequest


class CareerRecommendationAgent:
    """Ranks careers only after the engine has resolved all upstream evidence."""

    name = "Career Recommendation Agent"

    def recommend(
        self,
        request: ReportRequest,
        dimensions: dict[str, int],
        engine_confidence: int,
    ) -> list[CareerMatch]:
        current_skills = {skill.lower() for skill in request.resume.skills}
        aspiration = request.profile.career_goal.strip().lower()
        scored = []
        for role in ROLE_CATALOG:
            dimension_score = sum(
                dimensions.get(name, 50) * weight
                for name, weight in role.weights.items()
            )
            matched = [
                skill for skill in role.required_skills if skill.lower() in current_skills
            ]
            gaps = [
                skill for skill in role.required_skills if skill.lower() not in current_skills
            ]
            skill_score = len(matched) / max(len(role.required_skills), 1) * 100
            role_keywords = set(role.title.lower().split()) - {
                "analyst",
                "coordinator",
                "manager",
                "associate",
            }
            aspiration_bonus = (
                7
                if aspiration
                and aspiration not in {"not sure", "i'm not sure yet", "unsure"}
                and (
                    role.title.lower() in aspiration
                    or any(token in aspiration for token in role_keywords)
                )
                else 0
            )
            score = min(
                96,
                dimension_score * 0.82 + skill_score * 0.18 + aspiration_bonus,
            )
            strongest_dimensions = sorted(
                role.weights,
                key=lambda name: dimensions.get(name, 50) * role.weights[name],
                reverse=True,
            )[:2]
            evidence = [
                f"{name.replace('_', ' ').title()}: {dimensions.get(name, 50)}/100"
                for name in strongest_dimensions
            ]
            if matched:
                evidence.append(f"Existing role skills: {', '.join(matched[:3])}")
            scored.append((role, score, gaps, evidence))

        scored.sort(key=lambda item: item[1], reverse=True)
        top_score = scored[0][1]
        matches: list[CareerMatch] = []
        for index, (role, score, gaps, evidence) in enumerate(scored, start=1):
            why_lower = None
            if index > 1:
                distance = round(top_score - score)
                why_lower = (
                    f"Ranked {distance} points below the leading match because "
                    f"{gaps[0] if gaps else 'its strongest dimensions'} has less current evidence."
                )
            matches.append(
                CareerMatch(
                    role_id=role.role_id,
                    title=role.title,
                    rank=index,
                    score=round(score),
                    confidence=max(45, engine_confidence - (index - 1) * 3),
                    interview_readiness=round(
                        (
                            dimensions.get("communication", 50)
                            + dimensions.get("problem_solving", 50)
                            + dimensions.get("star_method", 50)
                            + dimensions.get("clarity", 50)
                            + dimensions.get("professionalism", 50)
                        )
                        / 5
                    ),
                    hiring_readiness=round(
                        score * 0.55
                        + dimensions.get("resume_quality", 50) * 0.25
                        + dimensions.get("execution", 50) * 0.20
                    ),
                    industry_readiness=round(
                        score * 0.70
                        + dimensions.get("technical_analysis", 50) * 0.15
                        + dimensions.get("communication", 50) * 0.15
                    ),
                    rationale=(
                        f"{role.title} aligns with the strongest demonstrated dimensions "
                        f"and {len(role.required_skills) - len(gaps)}/{len(role.required_skills)} required skills."
                    ),
                    evidence=evidence,
                    gaps=gaps[:5],
                    why_lower=why_lower,
                    market_demand=role.market_demand,
                    salary_range=role.salary_range,
                    growth_potential=role.growth_potential,
                    future_outlook=role.future_outlook,
                    required_skills=list(role.required_skills),
                    learning_difficulty=role.learning_difficulty,
                    learning_timeline=role.learning_timeline,
                )
            )
        return matches
