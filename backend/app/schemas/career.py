from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=lambda value: "".join(
            word.capitalize() if index else word
            for index, word in enumerate(value.split("_"))
        ),
        populate_by_name=True,
    )


class BasicProfile(CamelModel):
    name: str = Field(min_length=2, max_length=80)
    education: str = Field(min_length=2, max_length=160)
    experience_level: str = Field(min_length=2, max_length=80)
    career_goal: str = Field(default="", max_length=300)


class ResumeIssue(CamelModel):
    category: str
    problem: str
    explanation: str
    why_it_matters: str
    how_to_improve: str
    example: str
    improvement_prompt: str
    priority: Literal["high", "medium", "low"]


class ResumeAnalysis(CamelModel):
    file_name: str
    summary: str
    skills: list[str]
    ats_score: int = Field(ge=0, le=100)
    section_coverage: dict[str, bool]
    suggestions: list[str]
    dimension_scores: dict[str, int] = Field(default_factory=dict)
    issues: list[ResumeIssue] = Field(default_factory=list)


class RoleOption(CamelModel):
    id: str
    title: str
    fit: int = Field(ge=0, le=100)
    description: str
    skills: list[str]


class ReportRequest(CamelModel):
    profile: BasicProfile
    resume: ResumeAnalysis
    interview_answers: dict[str, str] = Field(min_length=3)
    assessment_answers: dict[str, int] = Field(min_length=5)
    descriptive_answers: dict[str, str] = Field(min_length=2)
    selected_role: RoleOption | None = None

    @model_validator(mode="after")
    def require_complete_evidence(self) -> "ReportRequest":
        required_interview = {"intro", "evidence", "growth"}
        required_assessment = {"metric", "sql", "insight", "bias", "priority"}
        if not required_interview.issubset(self.interview_answers):
            raise ValueError("All interview questions must be completed before synthesis.")
        if any(
            len(self.interview_answers[key].strip()) < 20
            for key in required_interview
        ):
            raise ValueError("Interview answers must contain enough evidence to evaluate.")
        if not required_assessment.issubset(self.assessment_answers):
            raise ValueError("All objective assessment items must be completed.")
        if sum(
            len(answer.strip()) >= 30
            for answer in self.descriptive_answers.values()
        ) < 2:
            raise ValueError("Both descriptive assessment answers must be completed.")
        return self


class EvidenceItem(CamelModel):
    source: str
    claim: str
    observation: str
    strength: int = Field(ge=0, le=100)
    reliability: float = Field(ge=0, le=1)


class DimensionScore(CamelModel):
    dimension: str
    score: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    evidence: list[EvidenceItem] = Field(default_factory=list)


class AgentResult(CamelModel):
    agent: str
    summary: str
    dimensions: list[DimensionScore]
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)


class ConflictResolution(CamelModel):
    dimension: str
    signals: list[str]
    resolution: str
    rationale: str


class ScoreContribution(CamelModel):
    source: str
    weight: int = Field(ge=0, le=100)
    score: int = Field(ge=0, le=100)
    weighted_score: float = Field(ge=0, le=100)


class CareerMatch(CamelModel):
    role_id: str
    title: str
    rank: int = Field(ge=1, le=6)
    score: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    interview_readiness: int = Field(ge=0, le=100)
    hiring_readiness: int = Field(ge=0, le=100)
    industry_readiness: int = Field(ge=0, le=100)
    rationale: str
    evidence: list[str] = Field(min_length=1, max_length=6)
    gaps: list[str] = Field(default_factory=list, max_length=6)
    why_lower: str | None = None
    market_demand: str
    salary_range: str
    growth_potential: str
    future_outlook: str
    required_skills: list[str]
    learning_difficulty: str
    learning_timeline: str


class CareerIntelligence(CamelModel):
    confidence: int = Field(ge=0, le=100)
    data_quality: int = Field(ge=0, le=100)
    dominant_strength: str
    critical_gap: str
    dimension_scores: list[DimensionScore]
    conflicts: list[ConflictResolution] = Field(default_factory=list)
    score_contributions: list[ScoreContribution]
    career_matches: list[CareerMatch] = Field(min_length=1, max_length=6)


class CareerIntelligenceAnalysis(CamelModel):
    agents: list[AgentResult]
    intelligence: CareerIntelligence


class ScoreCard(CamelModel):
    resume: int = Field(ge=0, le=100)
    interview: int = Field(ge=0, le=100)
    assessment: int = Field(ge=0, le=100)
    role_fit: int = Field(ge=0, le=100)


class RoadmapStage(CamelModel):
    period: str
    focus: str
    actions: list[str] = Field(min_length=1, max_length=4)


class EvidenceRecommendation(CamelModel):
    title: str
    action: str
    evidence: str
    priority: Literal["now", "next", "later"]
    improvement_prompt: str


class DevelopmentResource(CamelModel):
    kind: Literal["certification", "project", "course", "book"]
    title: str
    reason: str
    evidence: str
    source_url: str | None = None


class CareerReport(CamelModel):
    readiness_score: int = Field(ge=0, le=100)
    headline: str
    summary: str
    scores: ScoreCard
    strengths: list[str] = Field(min_length=1, max_length=6)
    skill_gaps: list[str] = Field(min_length=1, max_length=6)
    recommendations: list[str] = Field(min_length=2, max_length=6)
    evidence_recommendations: list[EvidenceRecommendation] = Field(
        min_length=2, max_length=6
    )
    roadmap: list[RoadmapStage] = Field(min_length=3, max_length=4)
    career_intelligence: CareerIntelligence
    top_career_match: CareerMatch
    career_alternatives: list[CareerMatch] = Field(default_factory=list, max_length=5)
    development_resources: list[DevelopmentResource] = Field(
        default_factory=list, max_length=8
    )
    disclaimer: str
    mode: Literal["demo", "ai"] = "demo"


class AIReportNarrative(CamelModel):
    headline: str
    summary: str
