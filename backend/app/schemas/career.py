from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=lambda value: "".join(
        word.capitalize() if index else word
        for index, word in enumerate(value.split("_"))
    ), populate_by_name=True)


class BasicProfile(CamelModel):
    name: str = Field(min_length=2, max_length=80)
    education: str = Field(min_length=2, max_length=160)
    experience_level: str = Field(min_length=2, max_length=80)
    career_goal: str = Field(min_length=5, max_length=300)


class ResumeAnalysis(CamelModel):
    file_name: str
    summary: str
    skills: list[str]
    ats_score: int = Field(ge=0, le=100)
    section_coverage: dict[str, bool]
    suggestions: list[str]


class RoleOption(CamelModel):
    id: str
    title: str
    fit: int = Field(ge=0, le=100)
    description: str
    skills: list[str]


class ReportRequest(CamelModel):
    profile: BasicProfile
    resume: ResumeAnalysis
    selected_role: RoleOption
    interview_answers: dict[str, str]
    assessment_answers: dict[str, int]


class ScoreCard(CamelModel):
    resume: int = Field(ge=0, le=100)
    interview: int = Field(ge=0, le=100)
    assessment: int = Field(ge=0, le=100)
    role_fit: int = Field(ge=0, le=100)


class RoadmapStage(CamelModel):
    period: str
    focus: str
    actions: list[str] = Field(min_length=1, max_length=4)


class CareerReport(CamelModel):
    readiness_score: int = Field(ge=0, le=100)
    headline: str
    summary: str
    scores: ScoreCard
    strengths: list[str] = Field(min_length=1, max_length=6)
    skill_gaps: list[str] = Field(min_length=1, max_length=6)
    recommendations: list[str] = Field(min_length=2, max_length=6)
    roadmap: list[RoadmapStage] = Field(min_length=3, max_length=4)
    disclaimer: str
    mode: str = "demo"

