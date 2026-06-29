from dataclasses import dataclass


@dataclass(frozen=True)
class RoleProfile:
    role_id: str
    title: str
    description: str
    weights: dict[str, float]
    required_skills: tuple[str, ...]
    market_demand: str
    salary_range: str
    growth_potential: str
    future_outlook: str
    learning_difficulty: str
    learning_timeline: str


ROLE_CATALOG = (
    RoleProfile(
        role_id="data-analyst",
        title="Data Analyst",
        description="Turns information into decisions through analysis and storytelling.",
        weights={
            "technical_analysis": 0.27,
            "quantitative_reasoning": 0.24,
            "problem_solving": 0.17,
            "communication": 0.12,
            "execution": 0.10,
            "learning_agility": 0.10,
        },
        required_skills=("SQL", "Excel", "Power BI", "Statistics"),
        market_demand="High across analytics-enabled teams",
        salary_range="Indicative entry-level range in India: ₹3–7 LPA",
        growth_potential="Strong",
        future_outlook="Expands toward BI, product analytics, and data science.",
        learning_difficulty="Moderate",
        learning_timeline="8–16 weeks for a credible entry-level portfolio",
    ),
    RoleProfile(
        role_id="business-analyst",
        title="Business Analyst",
        description="Translates business problems into clear, testable solutions.",
        weights={
            "stakeholder_management": 0.24,
            "communication": 0.20,
            "problem_solving": 0.20,
            "execution": 0.16,
            "technical_analysis": 0.10,
            "learning_agility": 0.10,
        },
        required_skills=(
            "Requirements",
            "Process Mapping",
            "SQL",
            "Agile",
            "Communication",
        ),
        market_demand="High in technology, finance, and operations",
        salary_range="Indicative entry-level range in India: ₹3.5–8 LPA",
        growth_potential="Strong",
        future_outlook="Progresses toward product, consulting, and transformation roles.",
        learning_difficulty="Moderate",
        learning_timeline="8–14 weeks with two process or requirements case studies",
    ),
    RoleProfile(
        role_id="product-analyst",
        title="Product Analyst",
        description="Connects user behaviour, experiments, and product decisions.",
        weights={
            "technical_analysis": 0.21,
            "quantitative_reasoning": 0.19,
            "problem_solving": 0.20,
            "stakeholder_management": 0.14,
            "communication": 0.14,
            "learning_agility": 0.12,
        },
        required_skills=(
            "SQL",
            "Analytics",
            "Experiments",
            "Product Metrics",
            "Communication",
        ),
        market_demand="Growing in digital product organizations",
        salary_range="Indicative entry-level range in India: ₹4–9 LPA",
        growth_potential="Very strong",
        future_outlook="Can develop into product management or analytics leadership.",
        learning_difficulty="Moderate to high",
        learning_timeline="12–20 weeks with experimentation and product cases",
    ),
    RoleProfile(
        role_id="operations-analyst",
        title="Operations Analyst",
        description="Improves processes, reporting, and operational performance.",
        weights={
            "execution": 0.25,
            "problem_solving": 0.20,
            "quantitative_reasoning": 0.18,
            "technical_analysis": 0.15,
            "communication": 0.12,
            "stakeholder_management": 0.10,
        },
        required_skills=("Excel", "Process Improvement", "SQL", "Reporting"),
        market_demand="Steady across services, logistics, and finance",
        salary_range="Indicative entry-level range in India: ₹3–6.5 LPA",
        growth_potential="Strong",
        future_outlook="Builds toward operations strategy and program management.",
        learning_difficulty="Moderate",
        learning_timeline="6–12 weeks with a process-improvement case",
    ),
    RoleProfile(
        role_id="digital-marketing-analyst",
        title="Digital Marketing Analyst",
        description="Uses campaign and audience data to improve marketing performance.",
        weights={
            "communication": 0.23,
            "quantitative_reasoning": 0.17,
            "technical_analysis": 0.15,
            "problem_solving": 0.15,
            "execution": 0.15,
            "learning_agility": 0.15,
        },
        required_skills=("Analytics", "Excel", "SEO", "Campaign Analysis", "Communication"),
        market_demand="High in consumer and digital-first organizations",
        salary_range="Indicative entry-level range in India: ₹3–7 LPA",
        growth_potential="Strong",
        future_outlook="Progresses toward growth, performance, or marketing strategy.",
        learning_difficulty="Moderate",
        learning_timeline="8–12 weeks with two campaign-analysis cases",
    ),
    RoleProfile(
        role_id="project-coordinator",
        title="Project Coordinator",
        description="Keeps people, priorities, and delivery moving together.",
        weights={
            "stakeholder_management": 0.25,
            "communication": 0.24,
            "execution": 0.24,
            "problem_solving": 0.11,
            "learning_agility": 0.11,
            "technical_analysis": 0.05,
        },
        required_skills=(
            "Project Management",
            "Communication",
            "Agile",
            "Stakeholder Management",
            "Excel",
        ),
        market_demand="Steady across project-based organizations",
        salary_range="Indicative entry-level range in India: ₹3–6 LPA",
        growth_potential="Moderate to strong",
        future_outlook="Can progress into project, program, or delivery management.",
        learning_difficulty="Low to moderate",
        learning_timeline="6–10 weeks with planning and delivery evidence",
    ),
)

